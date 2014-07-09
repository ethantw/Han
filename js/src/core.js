define([
  './var/document',
  './var/root',
  './var/body'
], function( document, root, body ) {

var
  VERSION = '3.0.0',

  ROUTINE = [
    // Initialise the condition with feature-detecting
    // classes (Modernizr-alike), binding onto the root
    // element, possibly `<html>`.
    'initCond',
    // Address element normalisation
    'renderElem',
    // Address Hanzi and Western script mixed spacing
    'renderHWS',
    // Address Basic Biaodian correction in Firefox
    'renderBasicBD'
  ],

  // Define Han
  Han = function( context, condition ) {
    return new Han.fn.init( context, condition )
  }
;

Han.fn = Han.prototype = {
  version: VERSION,

  constructor: Han,

  // Default target context
  context: body,

  // Root element as the default condition
  condition: root,

  // Default rendering routine
  routine: ROUTINE,

  init: function( context, condition ) {
    if ( context ) {
      this.context = context
    }
    if ( condition ) {
      this.condition = condition
    }
    return this
  },

  setRoutine: function( routine ) {
    if ( !Array.isArray( routine )) {
      return
    }

    this.routine = routine
    return this
  },

  renderByRoutine: function() {
    var
      that = this
    ;

    this
      .routine
      .forEach(function( method ) {
        if ( typeof method === 'string' ){
          try {
            that[ method ]()
          } catch ( e ) {}
        } else if ( Array.isArray( method )) {
          try {
            that[ method.shift() ].apply( that, method )
          } catch ( e ) {}
        }
      })
    return this
  }
}

Han.fn.init.prototype = Han.fn

/**
 * Shortcut for `renderByRoutine` under the default
 * situation.
 *
 * Once initialised, replace `Han.init` with the
 * instance for future usage.
 */
Han.init = function() {
  return Han.init = Han().renderByRoutine()
}

return Han
})
