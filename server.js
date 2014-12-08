
var fs = require('fs')
var http = require('http')
var path = require('path')
var url = require('url')
var EventEmitter = require('events').EventEmitter
var exec = require('child_process').exec
var spawn = require('child_process').spawn

var args = {}
var argv = process.argv.slice(2)

// Guess arguments.
for (var i = 0; i < argv.length; i++){
  arg = argv[i]
  if (arg.match(/^\d+$/)){
    args.port = arg
  } else if (arg === 'coffee'){
    args.coffee = true
  } else if (arg === 'fix'){
    args.fix = true
  } else {
    args.host = arg
  }
}

// Emulate mime if it didn't exist.
var mime
try {
  mime = require('mime')
} catch (e) {
  mime = (function() {
    var CONTENT_TYPES = {
      'js': 'application/javascript; charset=utf-8',
      'css': 'text/css; charset=utf-8',
      'json': 'application/json; charset=utf-8',
      'html': 'text/html; charset=utf-8',
      'htm': 'text/html; charset=utf-8',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'ico': 'image/x-icon',
      'gif': 'image/gif',
      'txt': 'text/plain; charset=utf-8',
      'svg': 'image/svg+xml',
      'ttf': 'application/x-font-ttf',
      'woff': 'application/font-woff',
      'apk': 'application/vnd.android.package-archive'
    }
    return {
      lookup: function (ext) {
        ext = ext.trim()
        if (ext[0] === '.') ext = ext.slice(1)
        return CONTENT_TYPES[ext] || 'application/octet-stream'
      }
    }
  })()
}

// Simple http response.
function httpRespond(res, code, txt, headers) {
  headers = headers || {}
  txt = txt || ''
  headers['Content-Type'] = "text/plain"
  res.writeHead(code, headers)
  res.end(txt)
}

var httpCb = function (req, res) {
  var uri = url.parse(req.url).pathname
  var filename
  try {
    filename = decodeURIComponent(path.join(process.cwd(), uri))
  } catch (e) {
    filename = path.join(process.cwd(), uri)
  }

  path.exists(filename, function (exists) {
    if (!exists || /manifest.appcache/.test(filename)) {
      httpRespond(res, 404, "Page Not Found!\n")
      return
    }
    
    if (fs.statSync(filename).isDirectory()) {
      if (filename.slice(-1) !== '/') {
        httpRespond(res, 302, 'Location is a folder, redirecting..', {
          'Location': uri + '/'
        })
        return
      } else {
        filename = path.join(filename, 'index.html')
      }
    }
    
    fs.readFile(filename, 'binary', function (err, file) {
      if ( err ) {
        httpRespond(res, 500, err + '\n')
        return
      }
      var ext = path.extname(filename).slice(1)
      res.writeHead(200, {'Content-Type': mime.lookup(ext)})
      res.write(file, 'binary')
      res.end()
    })
  }) 
}

// Assign defaults and define the start server action.
args.port = args.port || 7777
args.host = args.host || '0.0.0.0'
http.createServer( httpCb ).listen( args.port, args.host )

console.log(
  'Serving files from %s at http://%s:%s/', 
  process.cwd(),
  args.host,
  args.port
)

