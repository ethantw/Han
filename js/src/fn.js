define([
  './core',
  './farr'
], function( Han, Farr ) {

/**
 * Farr Methods
 */
Han.Farr = Farr

// Bind the Farr methods onto Han constructor
;['replace', 'wrap', 'unfarr', 'jinzify', 'charify']
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
 *
 */
})
