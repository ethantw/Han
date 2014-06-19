define([
  './var/root',
  './var/body',
  './method'
], function( root, body, $ ) {
  var
    VERSION = '3.0.0-alpha1'
  ;

  var
    // Define Han
    Han = function( query ) {
      return new Han.fn.init( query )
    }
  ;

  Han.fn = Han.prototype = {
    version: VERSION,

    constructor: Han,

    // Default target selector
    selector: body,

    // Default target DOM object ready to use
    //$this: $( this.selector ),

    // Default root element
    root: root,

    // Default routine for rendering
    routine: [
      // Detect end user's browser and system condition
      'condition',

      // Render the HTML5 elements
      'ruby',
      'emphasis',
      'annotation'
    ],

    // Init
    init: function( query, option ) {
      if ( query ) {
        this.selector = query
        //this.$this = query instanceof $ ? query : $( query )
      }

      if ( typeof option === 'object' ) {
        this.option = option
      }

      /*if ( typeof option.routine !== 'undefined' ) {
        this.routine = option.routine
      }*/

      return this
    }
  }

  Han.fn.init.prototype = Han.fn
  return Han
})
