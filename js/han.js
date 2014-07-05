
/**
 * Library Configuration
 */
require.config({
  paths: {
    findAndReplaceDOMText: [
      './lib/findAndReplaceDOMText.module'
    ]
  }
})

/**
 * Core
 */
define([
  './src/core',
  './src/fn',
  './src/hyu/hyu',
  './src/mre/mre',
  './src/inline',
  './src/script',
  './src/global'
], function( Han ) {
  return Han
})
