define([
  './core'
], function( Han ) {

// AMD
if ( typeof define === 'function' && define.amd ) {
  define(function() { return Han })

// Expose to global namespace
} else if ( typeof noGlobalNS === 'undefined' || noGlobalNS === false ) {
  window.Han = Han
}
})
