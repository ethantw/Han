define([
    './core'
], function( Han ) {

  if (
    typeof noGlobalNamespace === 'undefined' ||
    noGlobalNamespace === false &&
    ( typeof define !== 'function' && !define.amd )
  ) {
    window.Han = Han
  }
})
