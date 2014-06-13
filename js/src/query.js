define({
  // Create a new element with/without
  // classes
  create: function( elem, clazz ) {
    var
      elem = document.createElement( elem )
    ;

    if ( clazz ) {
      elem.className = clazz
    }
    return elem
  },

  // Mainly used to convert node lists into
  // real arrays for the native prototype methods
  arraify: function( list ) {
    var
      len = list.length,
      array = []
    ;

    for ( var i = 0; i < len; i++) {
      array[ i ] = list[ i ]
    }
    return array
  },

  // Simplified jQuery.extend() to extend
  // target's method with some object
  extend: function( target, object ) {
    var
      len = object.length,
      bTarget = typeof target === 'object' || typeof target === 'function'
    ;

    if ( !bTarget || typeof object !== 'object' ) {
      return
    }

    for ( name in object ) {
      if ( object.hasOwnProperty( name ) ) {
        target[ name ] = object[ name ]
      }
    }
    return target
  }
})
