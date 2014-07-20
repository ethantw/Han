define([
  '../core',
  '../method',
  '../regex'
], function( Han, $ ) {

var
  QUERY_RB_W_ANNO = 'rb.romanization[annotation], .romanization rb[annotation]',

  isCombLigaNormal = (function() {
    var
      fakeBody = body || $.create( 'body' ),
      div = $.create( 'div' ),

      container = body ? div : fakeBody,

      control = $.create( 'span' ),

      treat, docOverflow, ret
    ;

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

  charCombLiga = $.create( 'char', 'comb-liga' ),
  charCombLigaInner =  $.create( 'inner' )
;

$.extend( Han, {
  isCombLigaNormal: isCombLigaNormal,

  substCombLigaWithPUA: function( context ) {
    var
      context = context || document,
      finder = Han.find( context )
    ;

    if ( isCombLigaNormal ) {
      return
    }

    finder.filteredElemList += ' textarea code kbd samp pre'

    aCombLiga
    .forEach(function( pattern ) {
      finder
      .replace(
        new RegExp( pattern[ 0 ], 'ig' ),
        function( portion, match ) {
          var
            ret = $.clone( charCombLiga ),
            inner = $.clone( charCombLigaInner )
          ;

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
    .qsa( QUERY_RB_W_ANNO, context )
    .forEach(function( rb ) {
      var annotation = rb.getAttribute( 'annotation' )

      aCombLiga
      // Latin vowels only
      .slice( 0, 5 )
      .forEach(function( pattern ) {
        annotation = annotation.replace(
          new RegExp( pattern[ 0 ], 'ig' ), pattern[ 1 ]
        )
      })
      rb.setAttribute( 'annotation', annotation )
    })
    return finder
  }
})

$.extend( Han.fn, {
  combLiga: null,

  substCombLigaWithPUA: function() {
    this.combLiga = Han.substCombLigaWithPUA( this.context )
    return this
  },

  revertCombLigaWithPUA: function() {
    try {
      this.combLiga.revert( 'all' )
    } catch ( e ) {}
    return this
  }
})
})
