/*!
 * 漢字標準格式 v@VERSION | MIT License | css.hanzi.co
 * Han.css: the CSS typography framework optimised for Hanzi
 */

void function( global, factory ) {

  // CommonJS
  if ( typeof module === 'object' && typeof module.exports === 'object' ) {
    module.exports = factory( global, true )
  // AMD
  } else if ( typeof define === 'function' && define.amd ) {
    define(function() {  return factory( global, true )  })
  // Global namespace
  } else {
    factory( global )
  }

}( typeof window !== 'undefined' ? window : this, function( window, noGlobalNS ) {

'use strict'

