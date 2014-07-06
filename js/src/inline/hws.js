define([
  '../method',
  '../farr',
  '../regex/typeset'
], function( $, Farr, TYPESET ) {

  var
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

    farr
    .replace( TYPESET.hws[ mode ][0], '$1<hws/>$2' )
    .replace( TYPESET.hws[ mode ][1], '$1<hws/>$2' )
    .replace( '<hws/>', function() {
      return $.clone( hws )
    })

    // Deal with situations like `漢<u>zi</u>`:
    // `漢<u><hws/>zi</u>` => `漢<hws/><u>zi</u>`
    $
    .qsa( '* > hws:first-child', context )
    .forEach(function( firstChild ) {
      var
        parent = firstChild.parentNode
      ;
      // The ‘first-child’ of DOM is different from
      // the ones of QSA, could be either an element
      // or a text fragment, but the latter one is
      // not what we want.
      if ( parent.firstChild.nodeName === 'HWS' ) {
        parent.parentNode.insertBefore( $.clone( hws ), parent )
        parent.removeChild( firstChild )
      }
    })

    // Normalise nodes we messed up with
    //// Disabled for temp due to the issue in IE11
    //// See: http://stackoverflow.com/questions/22337498/why-does-ie11-handle-node-normalize-incorrectly-for-the-minus-symbol
    if ( isNodeNormalizeNormal ) {
      context.normalize()
    }
    // Return the Farr instance for future usage
    return farr
  }

  return renderHWS
})
