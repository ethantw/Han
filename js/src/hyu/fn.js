define([
  '../method',
  './core',
  './support',
  './detect-font',
  './init-cond'
], function( $, Hyu, support, detectFont, initCond ) {

  $.extend( Hyu, {
    support: support,
    detectFont: detectFont,
    initCond: initCond
  })

  return Hyu
})
