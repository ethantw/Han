
module.exports = {
  baseUrl: 'js',
  name: 'han',
  out: './han.js',
  optimize: 'none',
  findNestedDependencies: true,
  skipSemiColonInsertion: true,
  wrap: {
    startFile: 'js/src/intro.js',
    endFile: 'js/src/outro.js'
  },
  paths: {
    findAndReplaceDOMText: './lib/findAndReplaceDOMText.module'
  },
  rawText: {},
  onBuildWrite: function( name, path, src ) {
    var rdefineEnd = /\}\);?[^}\w]*$/
    var amdName

    if ( /.\/var\//.exec( path )) {
      src = src
        .replace(/define\([\w\W]*?return/, 'var ' + /var\/([\w-]+)/.exec(name)[1] + ' =')
        .replace(rdefineEnd, '')
    } else if ( /^findAndReplaceDOMText$/.exec( name )) {
      src = 'var findAndReplaceDOMText =\n' + src.replace(/\/\/\s*EXPOSE[\w\W]*\/\/\s*EXPOSE/, "return exposed;")
    } else {
      if ( name !== 'han' ) {
        src = src.replace( /\s*return\s+[^\}]+(\}\);?[^\w\}]*)$/, '$1' )
      }

      src = src
        .replace( /define\([^{]*?{/, '' )
        .replace( rdefineEnd, '' )
        .replace( /\/\*\s*ExcludeStart\s*\*\/[\w\W]*?\/\*\s*ExcludeEnd\s*\*\//ig, '' )
        .replace( /\/\/\s*BuildExclude\n\r?[\w\W]*?\n\r?/ig, '' )
        .replace( /define\(\[[^\]]+\]\)[\W\n]+$/, '' )
    }

    return src
  }
}

