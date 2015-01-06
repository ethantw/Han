
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
    fibre: './lib/fibre.js/index'
  },
  rawText: {},
  onBuildWrite: function( name, path, src ) {
    var rdefineEnd = /\}\);?[^}\w]*$/
    var amdName

    if ( /.\/var\//.exec( path )) {
      src = src
        .replace(/define\([\w\W]*?return/, 'var ' + /var\/([\w-]+)/.exec(name)[1] + ' =')
        .replace(rdefineEnd, '')
    } else if ( /^fibre$/.exec( name )) {
      src = '\nvar Fibre =\n' + src
        .replace( /void\s/, '' )
        .replace( "var Finder = Finder || require( './finder.umd' )\n", '' )
        .replace( /\/\/\s*EXPOSE[\w\W]*\/\/\s*EXPOSE/, 'return Fibre' )
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

