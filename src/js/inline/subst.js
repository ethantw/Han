define([
  '../var/body',
  '../core',
  '../method',
  '../regex'
], function( body, Han, $ ) {

var QUERY_RU_W_ANNO = 'h-ru[annotation]'
var SELECTOR_TO_IGNORE = 'textarea, code, kbd, samp, pre'

var isCombLigaNormal = (function() {
  var treat   = Han.localize.writeOnCanvas( '\u0069\u030D', '"Romanization Sans"' )
  var control = Han.localize.writeOnCanvas( '\uDB80\uDC69', '"Romanization Sans"' )

  return Han.localize.compareCanvases( treat, control )
})()

var aCombLiga = Han.TYPESET[ 'display-as' ][ 'comb-liga-pua' ]
var aInaccurateChar = Han.TYPESET[ 'inaccurate-char' ]

var charCombLiga = $.create( 'h-char', 'comb-liga' )

$.extend( Han, {
  isCombLigaNormal: isCombLigaNormal,

  substCombLigaWithPUA: function( context ) {
    if ( isCombLigaNormal ) return

    var context = context || document
    var finder = Han.find( context )

    finder.avoid( SELECTOR_TO_IGNORE )

    aCombLiga
    .forEach(function( pattern ) {
      finder
      .replace(
        new RegExp( pattern[ 0 ], 'ig' ),
        function( portion, match ) {
          var ret = $.clone( charCombLiga )

          // Put the original content in an inner container
          // for better presentational effect of hidden text
          ret.innerHTML = '<h-inner>' + match[0] + '</h-inner>'
          ret.setAttribute( 'display-as', pattern[ 1 ] )
          return portion.index === 0 ? ret : ''
        }
      )
    })

    $
    .qsa( QUERY_RU_W_ANNO, context )
    .forEach(function( ru ) {
      var annotation = ru.getAttribute( 'annotation' )

      aCombLiga
      // Latin vowels only
      .slice( 0, 5 )
      .forEach(function( pattern ) {
        annotation = annotation.replace(
          new RegExp( pattern[ 0 ], 'ig' ), pattern[ 1 ]
        )
      })
      ru.setAttribute( 'annotation', annotation )
    })
    return finder
  },

  substInaccurateChar: function( context ) {
    var context = context || document
    var finder = Han.find( context )

    finder.avoid( SELECTOR_TO_IGNORE )
    aInaccurateChar
    .forEach(function( pattern ) {
      finder
      .replace(
        new RegExp( pattern[ 0 ], 'ig' ),
        pattern[ 1 ]
      )
    })
  }
})

$.extend( Han.fn, {
  'comb-liga': null,
  'inaccurate-char': null,

  substCombLigaWithPUA: function() {
    this['comb-liga'] = Han.substCombLigaWithPUA( this.context )
    return this
  },

  revertCombLigaWithPUA: function() {
    try {
      this['comb-liga'].revert( 'all' )
    } catch (e) {}
    return this
  },

  substInaccurateChar: function() {
    this['inaccurate-char'] = Han.substInaccurateChar( this.context )
    return this
  },

  revertInaccurateChar: function() {
    try {
      this['inaccurate-char'].revert( 'all' )
    } catch (e) {}
    return this
  }
})
})
