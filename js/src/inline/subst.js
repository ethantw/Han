define([
  '../core',
  '../method',
  '../regex'
], function( Han, $ ) {

var
  isCombLigaNormal = (function (){
    var
      div = $.create( 'div' ),
      control = $.create( 'span' ),
      test
    ;

    control.innerHTML = '&#xF0069;'
    control.style.fontFamily = '"Romanization Sans"'
    control.style.display = 'inline-block'

    test = $.clone( control )
    test.innerHTML = '&#x0069;&#x030D;'

    body.appendChild( control )
    body.appendChild( test )
    $.remove( control )
    $.remove( test )
    //return control.offsetWidth === test.offsetWidth
    return false
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
