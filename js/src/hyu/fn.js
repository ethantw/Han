define([
  './core',
  './support',
  './detect-font',
  './init-cond'
], function( Hyu, support, detectFont, initCond ) {

  Hyu.support = support
  Hyu.detectFont = detectFont
  Hyu.initCond = initCond

  return Hyu
})
