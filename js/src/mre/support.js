define([
  '../hyu'
], function( Hyu ) {

  return {
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
})
