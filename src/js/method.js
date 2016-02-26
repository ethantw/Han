define(function() {

var $ = {
  /**
   * Query selectors which return arrays of the resulted
   * node lists.
   */
  id: function( selector, $context ) {
    return ( $context || document ).getElementById( selector )
  },

  tag: function( selector, $context ) {
    return this.makeArray(
      ( $context || document ).getElementsByTagName( selector )
    )
  },

  qs: function( selector, $context ) {
    return ( $context || document ).querySelector( selector )
  },

  qsa: function( selector, $context ) {
    return this.makeArray(
      ( $context || document ).querySelectorAll( selector )
    )
  },

  parent: function( $node, selector ) {
    return selector
      ? (function() {
        if ( typeof $.matches !== 'function' )  return

        while (!$.matches( $node, selector )) {
          if (
            !$node ||
            $node === document.documentElement
          ) {
            $node = undefined
            break
          }
          $node = $node.parentNode
        }
        return $node
      })()
      : $node
      ? $node.parentNode : undefined
  },

  /**
   * Create a document fragment, a text node with text
   * or an element with/without classes.
   */
  create: function( name, clazz ) {
    var $elmt = '!' === name
      ? document.createDocumentFragment()
      : '' === name
      ? document.createTextNode( clazz || '' )
      : document.createElement( name )

    try {
      if ( clazz ) {
        $elmt.className = clazz
      }
    } catch (e) {}

    return $elmt
  },

  /**
   * Clone a DOM node (text, element or fragment) deeply
   * or childlessly.
   */
  clone: function( $node, deep ) {
    return $node.cloneNode(
      typeof deep === 'boolean'
      ? deep
      : true
    )
  },

  /**
   * Remove a node (text, element or fragment).
   */
  remove: function( $node ) {
    return $node.parentNode.removeChild( $node )
  },

  /**
   * Set attributes all in once with an object.
   */
  setAttr: function( target, attr ) {
    if ( typeof attr !== 'object' )  return
    var len = attr.length

    // Native `NamedNodeMap``:
    if (
      typeof attr[0] === 'object' &&
      'name' in attr[0]
    ) {
      for ( var i = 0; i < len; i++ ) {
        if ( attr[ i ].value !== undefined ) {
          target.setAttribute( attr[ i ].name, attr[ i ].value )
        }
      }

    // Plain object:
    } else {
      for ( var name in attr ) {
        if (
          attr.hasOwnProperty( name ) &&
          attr[ name ] !== undefined
        ) {
          target.setAttribute( name, attr[ name ] )
        }
      }
    }
    return target
  },

  /**
   * Indicate whether or not the given node is an
   * element.
   */
  isElmt: function( $node ) {
    return $node && $node.nodeType === Node.ELEMENT_NODE
  },

  /**
   * Indicate whether or not the given node should
   * be ignored (`<wbr>` or comments).
   */
  isIgnorable: function( $node ) {
    if ( !$node )  return false

    return (
      $node.nodeName === 'WBR' ||
      $node.nodeType === Node.COMMENT_NODE
    )
  },

  /**
   * Convert array-like objects into real arrays.
   */
  makeArray: function( object ) {
    return Array.prototype.slice.call( object )
  },

  /**
   * Extend target with an object.
   */
  extend: function( target, object ) {
    if ((
      typeof target === 'object' ||
      typeof target === 'function' ) &&
      typeof object === 'object'
    ) {
      for ( var name in object ) {
        if (object.hasOwnProperty( name )) {
          target[ name ] = object[ name ]
        }
      }
    }
    return target
  }
}

return $
})

