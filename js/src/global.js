define([
    './core'
], function( Han ) {

  if (
    typeof noGlobalNamespace === 'undefined' ||
    noGlobalNamespace === false
  ) {
    window.Han = Han
  }
})
