define([
    './core'
], function( Han ) {

  if (
    typeof noGlobalNS === 'undefined' ||
    noGlobalNS === false &&
    ( typeof define !== 'function' && !define.amd )
  ) {
    window.Han = Han
  }
})
