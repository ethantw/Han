/*!
 * 漢字標準格式 v3.0.0 | MIT License | css.hanzi.co
 * Han: CSS typography framework optimised for Hanzi
 */

;(function( global, factory ) {

  // AMD
  if ( typeof define === 'function' && define.amd ) {
    define( 'Han', [], function() {
      return factory
    })
  // CommonJS
  } else if ( typeof module === 'object' && typeof module.exports === 'object' ) {
    module.exports = factory( global, true )
  } else {
    factory( global )
  }

})( this, function( window, noGlobalNamespace ) {

  'use strict';
