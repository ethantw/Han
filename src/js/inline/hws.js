define([
  '../core',
  '../method',
  '../regex'
], function( Han, $ ) {

var $hws = $.create( 'h-hws' )
$hws.setAttribute( 'hidden', '' )
$hws.innerHTML = ' '

function sharingSameParent( $a, $b ) {
  return $a && $b && $a.parentNode === $b.parentNode
}

function putBehindElmt( $node, ret ) {
  var $elmt

  do {
    $elmt = ( $elmt || $node ).parentNode
  } while ( !$elmt.nextSibling )

  $elmt.insertAdjacentText( 'afterend', '<hws/>' )
  return ret || ''
}

function replacementFn( portion, mat ) {
  return portion.isEnd && portion.index === 0
    ? mat[1] + '<hws/>' + mat[2]
    : portion.index === 0
    ? (
      $.isElmt( portion.node.nextSibling ) ||
      sharingSameParent( portion.node, portion.node.nextSibling )
      ? portion.text + '<hws/>'
      : !portion.node.nextSibling
      ? putBehindElmt( portion.node, portion.text )
      : portion.text
    )
    : portion.index === 1
    ? (
      $.isElmt( portion.node.previousSibling ) ||
      $.isIgnorable( portion.node.previousSibling )
      ? '<hws/>' + portion.text
      : portion.text
    )
    : ''
}

$.extend( Han, {
  renderHWS: function( context, strict ) {
  // Elements to be filtered according to the
  // HWS rendering mode.
    var AVOID = strict
    ? 'textarea, code, kbd, samp, pre'
    : 'textarea'

    var mode = strict ? 'strict' : 'base'
    var context = context || document
    var finder = Han.find( context )

    finder
    .avoid( AVOID )

    // Basic situations:
    // - 字a => 字<hws/>a
    // - A字 => A<hws/>字
    .replace( Han.TYPESET.hws[ mode ][0], replacementFn )
    .replace( Han.TYPESET.hws[ mode ][1], replacementFn )

    // Deal with:
    // - '<hws/>字' => '字'
    // - "<hws/>字" => "字"
    .replace( /(['"]+)<hws\/>(.+?)<hws\/>\1/ig, '$1$2$1' )

    // Omit `<hws/>` preceding/following [“字”] and [‘字’],
    // See: https://github.com/ethantw/Han/issues/59
    .replace( /<hws\/>([‘“]+)/ig, '$1' )
    .replace( /([’”]+)<hws\/>/ig, '$1' )

    // Convert text nodes `<hws/>` into real element nodes:
   .replace( /(<hws\/>)+/g, function( portion ) {
      return portion.index === 0
        ? $.clone( $hws )
        : ''
    })
    .normalize()

    // Return the finder instance for future usage
    return finder
  }
})

$.extend( Han.fn, {
  HWS: [],

  renderHWS: function( strict ) {
    Han.renderHWS( this.context, strict )

    this.HWS = $.tag( 'h-hws', this.context )
    return this
  },

  revertHWS: function() {
    this.HWS.map(function( hws ) {
      $.remove( hws )
    })
    this.HWS = []
    return this
  }
})

return Han
})
