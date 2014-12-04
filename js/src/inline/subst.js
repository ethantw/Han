define([
  '../var/body',
  '../core',
  '../method',
  '../regex'
], function( body, Han, $ ) {

var QUERY_RU_W_ANNO = 'ru.romanization[annotation], .romanization ru[annotation]',
    ELEM_TO_IGNORE = ' textarea code kbd samp pre'

var isCombLigaNormal = (function() {
      var fakeBody = body || $.create( 'body' ),
          div = $.create( 'div' ),
          control = $.create( 'span' ),

          container = body ? div : fakeBody,
          treat, docOverflow, ret

      if ( !body ) {
        fakeBody.style.background = ''
        fakeBody.style.overflow = 'hidden'
        docOverflow = root.style.overflow

        root.style.overflow = 'hidden'
        root.appendChild( fakeBody )
      } else {
        body.appendChild( container )
      }

      control.innerHTML = '&#x0069;&#x030D;'
      control.style.fontFamily = 'sans-serif'
      control.style.display = 'inline-block'

      treat = $.clone( control )
      treat.style.fontFamily = '"Romanization Sans"'

      container.appendChild( control )
      container.appendChild( treat )

      ret = control.clientWidth !== treat.clientWidth
      $.remove( container )

      if ( !body ) {
        root.style.overflow = docOverflow
      }
      return ret
    })(),

    aCombLiga = Han.TYPESET[ 'display-as' ][ 'comb-liga-pua' ],
    aInaccurateChar = Han.TYPESET[ 'inaccurate-char' ],

    charCombLiga = $.create( 'char', 'comb-liga' ),
    charCombLigaInner =  $.create( 'inner' )

$.extend( Han, {
  isCombLigaNormal: isCombLigaNormal,

  substCombLigaWithPUA: function( context ) {
    var context = context || document,
        finder = Han.find( context )

    if ( isCombLigaNormal ) {
      return
    }

    finder.filteredElemList += ELEM_TO_IGNORE

    aCombLiga
    .forEach(function( pattern ) {
      finder
      .replace(
        new RegExp( pattern[ 0 ], 'ig' ),
        function( portion, match ) {
          var ret = $.clone( charCombLiga ),
              inner = $.clone( charCombLigaInner )

          // Put the original content in an inner container
          // for better presentational effect of hidden text
          inner.innerHTML = match[ 0 ]
          ret.appendChild( inner )
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
    var context = context || document,
        finder = Han.find( context )

    finder.filteredElemList += ELEM_TO_IGNORE
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
    } catch ( e ) {}
    return this
  },

  substInaccurateChar: function() {
    this['inaccurate-char'] = Han.substInaccurateChar( this.context )
    return this
  },

  revertInaccurateChar: function() {
    try {
      this['inaccurate-char'].revert( 'all' )
    } catch ( e ) {}
    return this
  }
})
})
