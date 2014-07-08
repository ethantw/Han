/*!
 * Mre
 * css.hanzi.co/mre
 *
 * This module is a subset project of Han,
 * which aims to address proper typefaces with
 * better readability.
 *
 * This module depends on Hyu for basic typeface
 * detecting.
 */

define([
  '../hyu/hyu'
], function( Hyu ) {

var
  Mre = {}
;

Mre.support = {
  // Assume that all devices support Heiti for we
  // use `sans-serif` to do the comparison.
  heiti: true,

  songti: (function() {
    return Hyu.detectFont( 'Han Songti' )
  })(),

  kaiti: (function() {
    return Hyu.detectFont( 'Han Kaiti' )
  })(),

  fangsong: (function() {
    return Hyu.detectFont( 'Han Fangsong' )
  })()
}

return Mre
})
