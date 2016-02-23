define([
  '../core',
  '../method',
  '../regex/unicode',
  '../find'
], function( Han, $, UNICODE ) {

var JIYA_CLASS = 'bd-jiya'
var JIYA_AVOID = 'h-char.bd-jiya'
var CONSECUTIVE_CLASS = 'bd-consecutive'

var matches = Han.find.matches

var get$csoHTML = function( prev, clazz ) {
  return '<h-cs hidden prev="' + prev + '" class="jinze-outer ' + clazz + '"> </h-cs>'
}

function get$bdType( $char ) {
  var hasClass = function( className ) {
    return $char.classList.contains( className )
  }

  return (
    hasClass( 'bd-open' )
    ? 'bd-open'
    : hasClass( 'bd-close' )
    ? 'bd-close'
    : hasClass( 'bd-middle' )
    ? 'bd-middle'
    : hasClass( 'bd-liga' )
    ? 'bd-liga'
    : hasClass( 'bd-end' )
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
  var clazz

  while (!matches( $elmt, 'h-char.biaodian' )) {
    $elmt = $elmt.parentNode
  }

  clazz = $elmt.classList

  if ( prevBiaodianType ) {
    $elmt.setAttribute( 'prev', prevBiaodianType )
  }

  if ( portion.isEnd ) {
    prevBiaodianType = undefined
    clazz.add( CONSECUTIVE_CLASS, 'end-portion' )
  } else {
    prevBiaodianType = get$bdType( $elmt )
    clazz.add( CONSECUTIVE_CLASS )
  }
  return portion.text
}

Han.renderJiya = function( context ) {
  var context = context || document
  var finder = Han.find( context )

  finder
  .avoid( 'textarea, code, kbd, samp, pre, h-cs' )

  .avoid( JIYA_AVOID )
  .charify({
    avoid: false,

    biaodian: function( portion ) {
      var $elmt = portion.node.parentNode
      var beenWrapped = matches( $elmt, 'h-char.biaodian, h-char.biaodian *' )

      var biaodian = portion.text
      var $new = Han.createBdChar( biaodian )

      $new.innerHTML = '<h-inner>' + biaodian + '</h-inner>'
      $new.classList.add( JIYA_CLASS )

      return !beenWrapped
        ? $new
        : (function() {
          var $char = $elmt

          while (!matches( $char, 'h-char.biaodian' )) {
            $char = $char.parentNode
          }
          $char.classList.add( JIYA_CLASS )

          return matches( $elmt, 'h-inner, h-inner *' )
            ? biaodian
            : $new.firstChild
        })()
    }
  })
  // End avoiding `JIYA_AVOID`:
  .endAvoid()

  .replace( TYPESET.group.biaodian[0], locateConsecutiveBd )
  .replace( TYPESET.group.biaodian[1], locateConsecutiveBd )

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
