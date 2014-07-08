define([
  './regex/unicode',
  './regex/typeset',
  './method',
  './farr',
  './core',
  './hyu/hyu',
  './mre/mre',
  './inline'
], function( UNICODE, TYPESET, $, Farr, Han, Hyu, Mre ) {

/**
 * API: regular expression
 */
$.extend( Han, {
  UNICODE: UNICODE,
  TYPESET: TYPESET
})

// English aliases are easier to memorise
$.extend( Han.UNICODE, {
  greek: Han.UNICODE.ellinika,
  cyrillic: Han.UNICODE.kirillica
})

// Lock the regex objects preventing from furthur
// modification.
Object.freeze( Han.UNICODE )
Object.freeze( Han.TYPESET )

/**
 * Shortcut for `renderByRoutine` in default situation
 */
Han.init = function() {
  return Han().renderByRoutine()
}

/**
 * Farr Methods
 */
Han.Farr = Farr

;[ 'replace', 'wrap', 'revert', 'jinzify', 'charify' ]
.forEach(function( method ) {
  Han.fn[ method ] = function() {
    if ( !this.Farr ) {
      // Share the same selector
      this.Farr = Han.Farr( this.context )
    }

    this.Farr[ method ]( arguments[ 0 ], arguments[ 1 ] )
    return this
  }
})

/**
 * Normalisation rendering mechanism via Hyu
 */
Han.normalize = Hyu
Han.support = Hyu.support
Han.detectFont = Hyu.detectFont

$.extend( Han.fn, {
  initCond: function() {
    this.condition.classList.add( 'han-js-rendered' )
    Han.normalize.initCond( this.condition )
    return this
  }
})

;[ 'Elem', 'LineDeco', 'Em', 'Ruby' ]
.forEach(function( elem ) {
  var
    method = 'render' + elem
  ;
  Han.fn[ method ] = function( target ) {
    Han.normalize[ method ]( this.context, target )
    return this
  }
})

/**
 * Typography improvement via Mre
 */
Han.typeface = Mre
$.extend( Han.support, Mre.support )

/**
 * Advanced typesetting
 */
;[ 'HWS', 'BasicBd' ]
.forEach(function( feat ) {
  var
    method = 'render' + feat
  ;

  Han.fn[ method ] = function() {

    $
    .makeArray( arguments )
    .unshift( this.context )

    Han[ method ].apply( null, arguments )
    return this
  }
})
})
