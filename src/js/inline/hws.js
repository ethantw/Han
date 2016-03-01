define([
  '../core',
  '../method',
  '../regex'
], function( Han, $ ) {

var hws = '<<hws>>'

var $hws = $.create( 'h-hws' )
$hws.setAttribute( 'hidden', '' )
$hws.innerHTML = ' '

function sharingSameParent( $a, $b ) {
  return $a && $b && $a.parentNode === $b.parentNode
}

function properlyPlaceHWSBehind( $node, text ) {
  var $elmt = $node
  var text  = text || ''

  if (
    $.isElmt( $node.nextSibling ) ||
    sharingSameParent( $node, $node.nextSibling )
  ) {
    return text + hws
  } else {
    // One of the parental elements of the current text
    // node would definitely have a next sibling, since
    // it is of the first portion and not `isEnd`.
    while ( !$elmt.nextSibling ) {
      $elmt = $elmt.parentNode
    }
    if ( $node !== $elmt ) {
      $elmt.insertAdjacentHTML( 'afterEnd', '<h-hws hidden> </h-hws>' )
    }
  }
  return text
}

function firstStepLabel( portion, mat ) {
  return portion.isEnd && portion.index === 0
    ? mat[1] + hws + mat[2]
    : portion.index === 0
    ? properlyPlaceHWSBehind( portion.node, portion.text )
    : portion.text
}

function real$hwsElmt( portion ) {
  return portion.index === 0
    ? $.clone( $hws )
    : ''
}

var last$hwsIdx

function apostrophe( portion ) {
  var $elmt = portion.node.parentNode

  if ( portion.index === 0 ) {
    last$hwsIdx = portion.endIndexInNode-2
  }

  if (
    $elmt.nodeName.toLowerCase() === 'h-hws' && (
    portion.index === 1 || portion.indexInMatch === last$hwsIdx
  )) {
    $elmt.classList.add( 'quote-inner' )
  }
  return portion.text
}

function curveQuote( portion ) {
  var $elmt = portion.node.parentNode

  if ( $elmt.nodeName.toLowerCase() === 'h-hws' ) {
    $elmt.classList.add( 'quote-outer' )
  }
  return portion.text
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
    .replace( Han.TYPESET.hws[ mode ][0], firstStepLabel )
    .replace( Han.TYPESET.hws[ mode ][1], firstStepLabel )

    // Convert text nodes `<hws/>` into real element nodes:
    .replace( new RegExp( '(' + hws + ')+', 'g' ), real$hwsElmt )

    // Deal with:
    // - '<hws/>字<hws/>' => '字'
    // - "<hws/>字<hws/>" => "字"
    .replace( /([\'"])\s(.+?)\s\1/g, apostrophe )

    // Deal with:
    // - <hws/>“字”<hws/>
    // - <hws/>‘字’<hws/>
    .replace( /\s[‘“]/g, curveQuote )
    .replace( /[’”]\s/g, curveQuote )
    .normalize()

    // Return the finder instance for future usage
    return finder
  }
})

$.extend( Han.fn, {
  renderHWS: function( strict ) {
    Han.renderHWS( this.context, strict )
    return this
  },

  revertHWS: function() {
    $.tag( 'h-hws', this.context )
    .forEach(function( hws ) {
      $.remove( hws )
    })
    this.HWS = []
    return this
  }
})

return Han
})
