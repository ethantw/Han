define([
  './var/document',
  './var/root',
  './var/body'
], function( document, root, body ) {

var VERSION = '@VERSION'

var ROUTINE = [
  // Initialise the condition with feature-detecting
  // classes (Modernizr-alike), binding onto the root
  // element, possibly `<html>`.
  'initCond',

  // Address element normalisation
  'renderElem',

  // Handle Biaodian
  /* 'jinzify', */
  'renderHanging',
  'renderJiya',

  // Address Hanzi and Western script mixed spacing
  'renderHWS',

  // Address Basic Biaodian correction in Firefox
  'correctBasicBD',

  // Address presentational correction to combining ligatures
  'substCombLigaWithPUA'

  // Address semantic correction to inaccurate characters
  // **Note:** inactivated by default
  /* 'substInaccurateChar', */
]

// Define Han
var Han = function( context, condition ) {
  return new Han.fn.init( context, condition )
}

var init = function() {
  if ( arguments[ 0 ] ) {
    this.context = arguments[ 0 ]
  }
  if ( arguments[ 1 ] ) {
    this.condition = arguments[ 1 ]
  }
  return this
}

Han.version = VERSION

Han.fn = Han.prototype = {
  version: VERSION,

  constructor: Han,

  // Body as the default target context
  context: body,

  // Root element as the default condition
  condition: root,

  // Default rendering routine
  routine: ROUTINE,

  init: init,

  setRoutine: function( routine ) {
    if ( Array.isArray( routine )) {
      this.routine = routine
    }
    return this
  },

  // Note that the routine set up here will execute
  // only once. The method won't alter the routine in
  // the instance or in the prototype chain.
  render: function( routine ) {
    var it = this
    var routine = Array.isArray( routine ) ? routine : this.routine

    routine
    .forEach(function( method ) {
      try {
        if ( typeof method === 'string' ) {
          it[ method ]()
        } else if ( Array.isArray( method )) {
          it[ method.shift() ].apply( it, method )
        }
      } catch ( e ) {}
    })
    return this
  }
}

Han.fn.init.prototype = Han.fn

/**
 * Shortcut for `render()` under the default
 * situation.
 *
 * Once initialised, replace `Han.init` with the
 * instance for future usage.
 */
Han.init = function() {
  return Han.init = Han().render()
}

return Han
})
