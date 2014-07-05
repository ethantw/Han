
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
  './src/global',
  './src/script'
], function( Han ) {
  return Han
})
