define([
  './core',
  //'./farr',
  './fn'
], function( Han ) {

    Han( document.body )
    .wrap( /[大]/ig, 'strong' )
    .replace( /[山]/ig, '〇' )
    //.unfarr()
})
