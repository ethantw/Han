define([
  '../core',
  '../method',
  '../regex'
], function( Han, $ ) {

var QUERY_HWS_AS_FIRST_CHILD = '* > h-hws:first-child, * > wbr:first-child + h-hws, wbr:first-child + wbr + h-hws'

//// Disabled `Node.normalize()` for temp due to
//// issue below in IE11.
//// See: http://stackoverflow.com/questions/22337498/why-does-ie11-handle-node-normalize-incorrectly-for-the-minus-symbol
var isNodeNormalizeNormal = (function() {
  var div = $.create( 'div' )

  div.appendChild( $.create( '', '0-' ))
  div.appendChild( $.create( '', '2' ))
  div.normalize()

  return div.firstChild.length !== 2
})()

var hws = $.create( 'h-hws' )
hws.setAttribute( 'hidden', '' )
hws.innerHTML = ' '

$.extend( Han, {
  isNodeNormalizeNormal: isNodeNormalizeNormal,

  renderHWS: function( context, strict ) {
    var context = context || document
    var mode = strict ? 'strict' : 'base'
    var finder = Han.find( context )

    // Elements to be filtered according to the
    // HWS rendering mode
    if ( strict ) {
      finder.avoid( 'textarea, code, kbd, samp, pre' )
    } else {
      finder.avoid( 'textarea' )
    }

    finder
    .replace( Han.TYPESET.hws[ mode ][0], '$1<hws/>$2' )
    .replace( Han.TYPESET.hws[ mode ][1], '$1<hws/>$2' )

    // Deal with [' 字'], [" 字"] => ['字'], ["字"]
    .replace( /(['"]+)<hws\/>(.+?)<hws\/>\1/ig, '$1$2$1' )

    // Remove all `<hws/>` pre/post [“字”] and [‘字’]
    // See: https://github.com/ethantw/Han/issues/59
    .replace( /<hws\/>([‘“]+)/ig, '$1' )
    .replace( /([’”]+)<hws\/>/ig, '$1' )

    // Convert text nodes `<hws/>` into real element nodes
    .replace( '<hws/>', function() {
      return $.clone( hws )
    })

    // Deal with:
    // `漢<u><hws/>zi</u>` => `漢<hws/><u>zi</u>`
    $
    .qsa( QUERY_HWS_AS_FIRST_CHILD, context )
    .forEach(function( firstChild ) {
      var parent = firstChild.parentNode
      var target = parent.firstChild

      // Skip all `<wbr>` and comments
      while ( $.isIgnorable( target )) {
        target = target.nextSibling

        if ( !target ) return
      }

      // The ‘first-child’ of DOM is different from
      // the ones of QSA, could be either an element
      // or a text fragment, but the latter one is
      // not what we want. We don't want comments,
      // either.
      while ( target.nodeName === 'H-HWS' ) {
        $.remove( target, parent )

        target = parent.parentNode.insertBefore( $.clone( hws ), parent )
        parent = parent.parentNode

        if ( isNodeNormalizeNormal ) {
          parent.normalize()
        }

        // This is for extreme circumstances, i.e.,
        // `漢<a><b><c><h-hws/>zi</c></b></a>` =>
        // `漢<h-hws/><a><b><c>zi</c></b></a>`
        if ( target !== parent.firstChild ) {
          break
        }
      }
    })

    // Normalise nodes we messed up with
    if ( isNodeNormalizeNormal ) {
      context.normalize()
    }

    // Return the finder instance for future usage
    return finder
  }
})

$.extend( Han.fn, {
  HWS: null,

  renderHWS: function( strict ) {
    Han.renderHWS( this.context, strict )

    this.HWS = $.tag( 'h-hws', this.context )
    return this
  },

  revertHWS: function() {
    this.HWS.forEach(function( hws ) {
      $.remove( hws )
    })
    return this
  }
})

return Han
})
