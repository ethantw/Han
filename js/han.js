

/**
 * Library Configuration
 */
require.config({
  paths: {
    $: [
      '//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.min',
      './lib/jquery-2.1.1.min'
    ],

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
  './src/mei',
  './src/script'
], function( Han, FaR ) {
  return Han
})
