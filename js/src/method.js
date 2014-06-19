define({

  // Simplified query selector
  //
  // - $.id
  // - $.tag
  // - $.qsa
  id: function( selector, context ) {
    return ( context || document ).getElementById( selector )
  },

  // `getElementsByXXX` methods prior to QSA for they
  // return live node lists and manipulate DOM faster
  tag: function( selector, context ) {
    return this.makeArray(
      ( context || document ).getElementsByTagName( selector )
    )
  },

  qsa: function( selector, context ) {
    return this.makeArray(
      ( context || document ).querySelectorAll( selector )
    )
  },

  // Create a new document fragment or element
  // with/without classes
  create: function( elem, clazz ) {
    var
      elem = '!' === elem ?
        document.createDocumentFragment() :
        document.createElement( elem )
    ;

    if ( '!' !== elem && clazz ) {
      elem.className = clazz
    }
    return elem
  },

  // Clone a node (text, element or fragment)
  // deeply or individually
  clone: function( node, deep ) {
    return node.cloneNode( deep || true )
  },

  // Remove a node (text, element or fragment)
  remove: function( node ) {
    return node.parentNode.removeChild( node )
  },

  // Set attributes all in once with object
  setAttr: function( target, attr ) {
    var
      len = attr.length
    ;

    if ( typeof attr !== 'object' ) {
      return
    }

    // Native NamedNodeMap
    if ( typeof attr[0] === 'object' &&
      'name' in attr[0]
    ) {
      for ( var i = 0; i < len; i++ ) {
        if ( attr[ i ].value !== undefined ) {
          target.setAttribute( attr[ i ].name, attr[ i ].value )
        }
      }

    // Plain object
    } else {
      for ( name in attr ) {
        if ( attr[ name ] !== undefined ) {
          target.setAttribute( name, attr[ name ] )
        }
      }
    }
    return target
  },

  // Mainly used to convert node lists into
  // real arrays for the native prototype methods
  makeArray: function( obj ) {
    return Array.prototype.slice.call( obj )
  },

  // Extend target's method with some object
  extend: function( target, object ) {
    var
      len = object.length,
      bTarget = typeof target === 'object' || typeof target === 'function'
    ;

    if ( !bTarget || typeof object !== 'object' ) {
      return
    }

    for ( name in object ) {
      if ( object.hasOwnProperty( name )) {
        target[ name ] = object[ name ]
      }
    }
    return target
  }
})
