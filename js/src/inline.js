define([
  './method',
  './core',
  './inline/hws'
], function( $, Han, renderHWS ) {

  $.extend( Han, {
    renderHWS: renderHWS
  })
})
