define([
  './core',
  './method',
  './regex/unicode-range',
  './regex/typeset',
  './farr',
  './hyu'
], function( Han, $, UNICODE, TYPESET, Farr, Hyu ) {

/**
 * Regular expression as usable API
 */
$.extend( Han, {
  UNICODE: UNICODE,
  TYPESET: TYPESET
})

/**
 * Modules and prototype methods
 */

// Farr Methods
//
Han.Farr = Farr

;[ 'replace', 'wrap', 'unfarr', 'jinzify', 'charify' ]
.forEach(function( method ) {
  Han.fn[ method ] = function() {
    if ( !this.Farr ) {
      // Share the same selector
      this.Farr = Han.Farr( this.selector )
    }

    this.Farr[ method ]( arguments[0], arguments[1] )
    return this
  }
})

// Hyu normalisation rendering mechanism
//
Han.Hyu = Hyu
Han.support = Hyu.support
Han.detectFont = Hyu.detectFont

$.extend( Han.fn, {
  initCond: function() {
    Han.Hyu.initCond( this.selector )
    return this
  }
})

;[ 'renderAll', 'renderU', 'renderEm', 'renderRuby' ]
.forEach(function( method ) {
  Han.fn[ method ] = function( target ) {
    Han.Hyu[ method ]( this.selector, target )
    return this
  }
})

})
