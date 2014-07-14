define([
  '../core',
  '../method',
  '../regex'
], function( Han, $ ) {

var
  HWS_AS_FIRST_CHILD_QUERY = '* > hws:first-child, * > wbr:first-child + hws, wbr:first-child + wbr + hws',

  //// Disabled `Node.normalize()` for temp due to
  //// the issue in IE11.
  //// See: http://stackoverflow.com/questions/22337498/why-does-ie11-handle-node-normalize-incorrectly-for-the-minus-symbol
  isNodeNormalizeNormal = (function() {
    var
      div = $.create( 'div' )
    ;

    div.appendChild( $.create( '', '0-' ))
    div.appendChild( $.create( '', '2' ))
    div.normalize()

    return div.firstChild.length !== 2
  })(),

  hws
;

hws = $.create( 'hws' )
hws.innerHTML = ' '

$.extend( Han, {
  isNodeNormalizeNormal: isNodeNormalizeNormal,

  renderHWS: function( context, strict ) {
    var
      context = context || document,
      mode = strict ? 'strict' : 'base',
      finder = Han.find( context )
    ;

    // Elements to be filtered according to the
    // HWS rendering mode
    if ( strict ) {
      finder.filteredElemList += ' textarea code kbd samp pre'
    } else {
      finder.filteredElemList += ' textarea'
    }

    finder
    .replace( Han.TYPESET.hws[ mode ][0], '$1<hws/>$2' )
    .replace( Han.TYPESET.hws[ mode ][1], '$1<hws/>$2' )

    // Deal with `' 字'`, `" 字"` => `'字'`, `"字"`
    .replace( /(['"]+)[<hws\/>|\s]*(.+?)[<hws\/>|\s]*(['"]+)/ig, '$1$2$3' )

    // Convert text nodes `<hws/>` into real element nodes
    .replace( '<hws/>', function() {
      return $.clone( hws )
    })

    // Deal with:
    // `漢<u><hws/>zi</u>` => `漢<hws/><u>zi</u>`
    $
    .qsa( HWS_AS_FIRST_CHILD_QUERY, context )
    .forEach(function( firstChild ) {
      var
        parent = firstChild.parentNode,
        target = parent.firstChild
      ;

      // Skip all `<wbr>` and comments
      while ( $.isIgnorable( target )) {
        target = target.nextSibling

        if ( !target ) {
          return
        }
      }

      // The ‘first-child’ of DOM is different from
      // the ones of QSA, could be either an element
      // or a text fragment, but the latter one is
      // not what we want. We don't want comments,
      // either.
      while ( target.nodeName === 'HWS' ) {
        $.remove( target, parent )

        target = parent.parentNode.insertBefore( $.clone( hws ), parent )
        parent = parent.parentNode

        if ( isNodeNormalizeNormal ) {
          parent.normalize()
        }

        // This is for extreme circumstances, i.e.,
        // `漢<a><b><c><hws/>zi</c></b></a>` =>
        // `漢<hws/><a><b><c>zi</c></b></a>`
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
    this.HWS = Han.renderHWS( this.context, strict )
    return this
  },

  revertHWS: function() {
    $
    .tag( 'hws', this.context )
    .forEach(function( hws ) {
      $.remove( hws )
    })
    return this
  }
})

return Han
})
