define([
  './core',
  './method',
  './farr',
  './hyu'
], function( Han, $, Farr, Hyu ) {

/**
 * Farr Methods
 */
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

/**
 * Extend Hyu normalisation rendering methods onto Han
 */
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
