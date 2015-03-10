define([
  './method',
  './core',
  './locale'
], function( $, Han ) {

$.extend( Han.support, {
  // Assume that all devices support Heiti for we
  // use `sans-serif` to do the comparison.
  heiti: true,
  // 'heiti-gb': true,

  songti: Han.detectFont( '"Han Songti"' ),
  'songti-gb': Han.detectFont( '"Han Songti GB"' ),

  kaiti: Han.detectFont( '"Han Kaiti"' ),
  // 'kaiti-gb': Han.detectFont( '"Han Kaiti GB"' ),

  fangsong: Han.detectFont( '"Han Fangsong"' )
  // 'fangsong-gb': Han.detectFont( '"Han Fangsong GB"' )
})
})
