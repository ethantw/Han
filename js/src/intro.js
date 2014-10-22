/*!
 * 漢字標準格式 v3.0.0 | MIT License | css.hanzi.co
 * Han: CSS typography framework optimised for Hanzi
 */

void (function( global, factory ) {

  // CommonJS
  if ( typeof module === 'object' && typeof module.exports === 'object' ) {
    module.exports = factory( global, true )
  } else {
    factory( global )
  }

})( typeof window !== 'undefined' ? window : this, function( window, noGlobalNS ) {

  'use strict'
