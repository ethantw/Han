define([
  '../method',
  '../farr',
  '../regex/typeset'
], function( $, Farr, TYPESET ) {

var
  HWS_AS_FIRST_CHILD_QUERY = '* > hws:first-child, * > wbr:first-child + hws, wbr:first-child + wbr + hws',

  //// Disabled `Node.normalize()` for temp due to
  //// the issue in IE11.
  //// See: http://stackoverflow.com/questions/22337498/why-does-ie11-handle-node-normalize-incorrectly-for-the-minus-symbol
  isNodeNormalizeNormal = (function() {
    var
      div = $.create('div')
    ;

    div.appendChild( document.createTextNode( '0-' ))
    div.appendChild( document.createTextNode( '2' ))
    div.normalize()

    return div.firstChild.length !== 2
  })()
;

function renderHWS( context, strict ) {
  var
    context = context || document,
    mode = strict ? 'strict' : 'base',
    hws, farr
  ;

  hws = $.create( 'hws' )
  hws.innerHTML = ' '
  farr = Farr( context )
  farr.filteredElemList += ' textarea'

  farr
  .replace( TYPESET.hws[ mode ][0], '$1<hws/>$2' )
  .replace( TYPESET.hws[ mode ][1], '$1<hws/>$2' )

  // Deal with `' 字'` and `" 字"`
  .replace( /(['"]+)[<hws\/>|\s]*(.+?)[<hws\/>|\s]*(['"]+)/ig, '$1$2$3' )

  // Convert string `<hws/>` into real elements
  .replace( '<hws/>', function() {
    return $.clone( hws )
  })

  // Deal with situations like `漢<u>zi</u>`:
  // `漢<u><hws/>zi</u>` => `漢<hws/><u>zi</u>`
  $.qsa( HWS_AS_FIRST_CHILD_QUERY, context )
  .forEach(function( firstChild ) {
    var
      parent = firstChild.parentNode,
      target = parent.firstChild
    ;

    // Skip all `<wbr>` and comments
    while (
      target.nodeName === 'WBR' || target.nodeType === 8
    ) {
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
      parent.removeChild( target )

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
  // Return the Farr instance for future usage
  return farr
}

return renderHWS
})
