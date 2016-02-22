define([
  '../core',
  '../method',
  '../regex/unicode',
  '../find'
], function( Han, $, UNICODE ) {

var csHTML  = '<h-cs hidden> </h-cs>'
var matches = Han.find.matches

var get$csoHTML = function( prev, clazz ) {
  return '<h-cs hidden prev="' + prev + '" class="jinze-outer ' + clazz + '"> </h-cs>'
}

function get$bdType( $char ) {
  var clazz = $char.classList
  return (
    clazz.contains( 'bd-open' )
    ? 'bd-open'
    : clazz.contains( 'bd-close' )
    ? 'bd-close'
    : clazz.contains( 'bd-middle' )
    ? 'bd-middle'
    : clazz.contains( 'bd-liga' )
    ? 'bd-liga'
    : clazz.contains( 'bd-end' )
    ? (
      /(?:3001|3002|ff0c)/i.test($char.getAttribute( 'unicode' ))
      // `cop` stands for ‘comma or period’.
      ? 'bd-end bd-cop'
      : 'bd-end'
    )
    : ''
  )
}

var prevBiaodianType

function locateConsecutiveBd( portion ) {
  var $elmt = portion.node.parentNode
  var clazz = $elmt.classList

  while (!matches( $elmt, 'h-char.biaodian' )) {
    $elmt = $elmt.parentNode
  }

  if ( prevBiaodianType ) {
    $elmt.setAttribute( 'prev', prevBiaodianType )
  }

  if ( portion.isEnd ) {
    prevBiaodianType = undefined
    clazz.add( 'consecutive-bd', 'end-portion' )
  } else {
    prevBiaodianType = get$bdType( $elmt )
    clazz.add( 'consecutive-bd' )
  }

  return portion.text
}

Han.renderJiya = function( context ) {
  var context = context || document
  var finder = Han.find( context )

  finder
  .avoid( 'textarea, code, kbd, samp, pre, h-cs' )

  .avoid( 'h-char.biaodian' )
  .charify({ biaodian: true })
  // End avoiding selector `h-char.biaodian`:
  .endAvoid()

  .replace( TYPESET.group.biaodian[0], locateConsecutiveBd )
  .replace( TYPESET.group.biaodian[1], locateConsecutiveBd )

  // The reason we’re doing this instead of using
  // pseudo elements in CSS is because WebKit has
  // problem rendering pseudo elements containing
  // only spaces.
  $.qsa( 'h-char.bd-open, h-char.bd-end', context )
  .forEach(function( $elmt ) {
    var html = '<h-inner>' + $elmt.innerHTML + '</h-inner>'

    $elmt.innerHTML = $elmt.classList.contains( 'bd-open' )
      ? csHTML + html
      : html + csHTML
  })

  $.qsa( 'h-jinze', context )
  .forEach(function( $jinze ) {
    var clazz = 'jiya-outer '
    var $char, $cs, prev

    if (matches( $jinze, '.tou, .touwei' )) {
      $char = $.qs( '.biaodian:first-child', $jinze )
      $cs   = $jinze.previousSibling
      prev  = $char.getAttribute( 'prev' ) || ''

      if ( $cs && matches( $cs, 'h-cs.jinze-outer' )) {
        $cs.setAttribute( 'prev', prev )
        $cs.setAttribute( 'class', 'jinze-outer jiya-outer' )
      } else {
        $jinze.insertAdjacentHTML(
          'beforebegin', get$csoHTML( prev, clazz )
        )
      }
    }
    if (matches( $jinze, '.wei, .touwei' )) {
      $char = $.qs( '.biaodian:last-child', $jinze )
      $cs   = $jinze.nextSibling
      clazz += $char.getAttribute( 'class' )

      if ( $cs && matches( $cs, 'h-cs.jinze-outer' )) {
        $cs.setAttribute( 'class', clazz + ' ' + $cs.getAttribute( 'class' ))
      } else {
        $jinze.insertAdjacentHTML(
          'afterend', get$csoHTML( '', clazz )
        )
      }
    }
  })

  return finder
}

$.extend( Han.fn, {
  jiya: null,

  renderJiya: function() {
    this.jiya = Han.renderJiya( this.context )
    return this
  },

  revertJiya: function() {
    try {
      this.jiya.revert( 'all' )
    } catch ( e ) {}
    return this
  }
})

return Han
})
