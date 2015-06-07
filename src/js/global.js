define([
  './core'
], function( Han ) {

// Expose to global namespace
if ( typeof noGlobalNS === 'undefined' || noGlobalNS === false ) {
  window.Han = Han
}
})

