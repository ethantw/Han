define([
  './method',
  './core',
  './inline/hws',
  './inline/basic-bd',
], function( $, Han, renderHWS, renderBasicBd ) {

  $.extend( Han, {
    renderHWS: renderHWS,
    renderBasicBd: renderBasicBd
  })
})
