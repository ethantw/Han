
/**
 * Library Configuration
 */
require.config({
  paths: {
    findAndReplaceDOMText: [
      './lib/findAndReplaceDOMText'
    ]
  },

  shim: {
    'findAndReplaceDOMText': {
      exports: 'findAndReplaceDOMText'
    }
  }
})

/**
 * Core
 */
define([
  './src/core',
  './src/fn',
  './src/hyu',
  './src/mre',
  './src/script'
], function( Han ) {
  return Han
})
