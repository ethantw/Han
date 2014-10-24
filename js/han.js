
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
  './src/regex',
  './src/find',
  './src/normalize',
  './src/typeface',
  './src/inline',
  './src/dom-ready',
  './src/global'
], function( Han ) {
return Han
})
