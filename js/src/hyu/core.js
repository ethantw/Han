define([
  '../method',
  './support',
  './detect-font',
  './init-cond'
], function( $, support, detectFont, initCond ) {

  var
    Hyu = {}
  ;

  $.extend( Hyu, {
    support: support,
    detectFont: detectFont,
    initCond: initCond
  })

  return Hyu
})
