define([
  '../var/document',
  '../core',
  '../method',
  '../regex'
], function( document, Han, $ ) {

var QUERY_RU_W_ANNO    = 'h-ru[annotation]'
var SELECTOR_TO_IGNORE = 'textarea, code, kbd, samp, pre'

function createCompareFactory( font, treat, control ) {
  return function() {
    var a = Han.localize.writeOnCanvas( treat, font )
    var b = Han.localize.writeOnCanvas( control, font )
    return Han.localize.compareCanvases( a, b )
  }
}

function isVowelCombLigaNormal() {
  return createCompareFactory( '"Romanization Sans"', '\u0061\u030D', '\uDB80\uDC61' )
}

function isVowelICombLigaNormal() {
  return createCompareFactory( '"Romanization Sans"', '\u0069\u030D', '\uDB80\uDC69' )
}

function isZhuyinCombLigaNormal() {
  return createCompareFactory( '"Zhuyin Kaiti"', '\u31B4\u0358', '\uDB8C\uDDB4' )
}

function createSubstFactory( regexToSubst ) {
  return function( context ) {
    var context = context || document
    var finder  = Han.find( context ).avoid( SELECTOR_TO_IGNORE )

    regexToSubst
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
    return finder
  }
}

var charCombLiga = $.create( 'h-char', 'comb-liga' )

$.extend( Han, {
  isVowelCombLigaNormal:   isVowelCombLigaNormal(),
  isVowelICombLigaNormal:  isVowelICombLigaNormal(),
  isZhuyinCombLigaNormal:  isZhuyinCombLigaNormal(),

  isCombLigaNormal:        isVowelICombLigaNormal()(),  // ### Deprecated

  substVowelCombLiga:   createSubstFactory( Han.TYPESET[ 'display-as' ][ 'comb-liga-vowel' ] ),
  substZhuyinCombLiga:  createSubstFactory( Han.TYPESET[ 'display-as' ][ 'comb-liga-zhuyin' ] ),
  substCombLigaWithPUA: createSubstFactory( Han.TYPESET[ 'display-as' ][ 'comb-liga-pua' ] ),

  substInaccurateChar: function( context ) {
    var context = context || document
    var finder = Han.find( context )

    finder.avoid( SELECTOR_TO_IGNORE )

    Han.TYPESET[ 'inaccurate-char' ]
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
  'comb-liga-vowel':   null,
  'comb-liga-vowel-i': null,
  'comb-liga-zhuyin':  null,
  'inaccurate-char':   null,

  substVowelCombLiga: function() {
    this['comb-liga-vowel'] = Han.substVowelCombLiga( this.context )
    return this
  },

  substVowelICombLiga: function() {
    this['comb-liga-vowel-i'] = Han.substVowelICombLiga( this.context )
    return this
  },

  substZhuyinCombLiga: function() {
    this['comb-liga-zhuyin'] = Han.substZhuyinCombLiga( this.context )
    return this
  },

  substCombLigaWithPUA: function() {
    if ( !Han.isVowelCombLigaNormal()) {
      this['comb-liga-vowel'] = Han.substVowelCombLiga( this.context )
    } else if ( !Han.isVowelICombLigaNormal()) {
      this['comb-liga-vowel-i'] = Han.substVowelICombLiga( this.context )
    }

    if ( !Han.isZhuyinCombLigaNormal()) {
      this['comb-liga-zhuyin'] = Han.substZhuyinCombLiga( this.context )
    }
    return this
  },

  revertVowelCombLiga: function() {
    try {
      this['comb-liga-vowel'].revert( 'all' )
    } catch (e) {}
    return this
  },

  revertVowelICombLiga: function() {
    try {
      this['comb-liga-vowel-i'].revert( 'all' )
    } catch (e) {}
    return this
  },

  revertZhuyinCombLiga: function() {
    try {
      this['comb-liga-zhuyin'].revert( 'all' )
    } catch (e) {}
    return this
  },

  revertCombLigaWithPUA: function() {
    try {
      this['comb-liga-vowel'].revert( 'all' )
      this['comb-liga-vowel-i'].revert( 'all' )
      this['comb-liga-zhuyin'].revert( 'all' )
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
