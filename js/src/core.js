define([
  './var/root',
  './var/body',
  './method'
], function( root, body, $ ) {

  var
    VERSION = '3.0.0-alpha1',

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

    // Default routine for rendering
    routine: [
      // Initialise the condition with feature-detecting
      // classes (Modernizr-alike) on root elements,
      // possibly `<html>`.
      'initCond',
      // Address element normalisation
      'renderElem',
      // Address Hanzi and Western script mixed spacing
      'renderHWS',
      'renderBasicBd'
    ],

    init: function( context, condition ) {
      if ( context ) {
        this.context = context
      }
      if ( condition ) {
        this.condition = condition
      }
      return this
    },

    setOption: function( option ) {
      return this
    },

    renderByRoutine: function() {
      var
        routine = this.routine
      ;
      for ( var i = 0, len = routine.length; i < len; i++ ) {
        try {
          this[ routine[ i ]]()
        } catch (e) {}
      }
      return this
    }
  }

  Han.fn.init.prototype = Han.fn
  return Han
})
