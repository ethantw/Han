define([
  '../core',
  '../method',
  '../regex/unicode',
  '../find'
], function( Han, $, UNICODE ) {

var JIYA_CLASS = 'bd-jiya'
var JIYA_AVOID = 'h-char.bd-jiya'
var CONSECUTIVE_CLASS = 'bd-consecutive'
var JIYA_CS_HTML = '<h-cs hidden class="jinze-outer jiya-outer"> </h-cs>'

var matches = Han.find.matches

function trimBDClass( clazz ) {
  return clazz.replace(
    /(biaodian|cjk|bd-jiya|bd-consecutive|bd-hangable)/gi, ''
  ).trim()
}

function get$bdType( $bd ) {
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
      /(?:3001|3002|ff0c)/i.test($bd.getAttribute( 'unicode' ))
      // `cop` stands for ‘comma or period’.
      ? 'bd-end bd-cop'
      : 'bd-end'
    )
    : ''
  )

  function hasClass( className ) {
    return $bd.classList.contains( className )
  }
}

function charifyBiaodian( portion ) {
  var biaodian = portion.text
  var $elmt = portion.node.parentNode
  var $bd = $.parent( $elmt, 'h-char.biaodian' )
  var $new = Han.createBDChar( biaodian )
  var $jinze

  $new.innerHTML = '<h-inner>' + biaodian + '</h-inner>'
  $new.classList.add( JIYA_CLASS )

  if ( $jinze = $.parent( $elmt, 'h-jinze' )) {
    insertJiyaCS( $jinze )
  }

  return !$bd
    ? $new
    : (function() {
      $bd.classList.add( JIYA_CLASS )

      return matches( $elmt, 'h-inner, h-inner *' )
        ? biaodian
        : $new.firstChild
    })()
}

var prevBDType

function locateConsecutiveBD( portion ) {
  var prev = prevBDType
  var $elmt = portion.node.parentNode
  var $bd = $.parent( $elmt, 'h-char.biaodian' )
  var $jinze = $.parent( $bd, 'h-jinze' )
  var classList

  classList = $bd.classList

  if ( prev ) {
    $bd.setAttribute( 'prev', prev )
  }

  if ( portion.isEnd ) {
    prevBDType = undefined
    classList.add( CONSECUTIVE_CLASS, 'end-portion' )
  } else {
    prevBDType = trimBDClass($bd.getAttribute( 'class' ))
    classList.add( CONSECUTIVE_CLASS )
  }

  if ( $jinze ) {
    locateCS( $jinze, {
      prev: prev,
      'class': trimBDClass($bd.getAttribute( 'class' ))
    })
  }
  return portion.text
}

function insertJiyaCS( $jinze ) {
  if (
    matches( $jinze, '.tou, .touwei' ) &&
    !matches( $jinze.previousSibling, 'h-cs.jiya-outer' )
  ) {
    $jinze.insertAdjacentHTML( 'beforebegin', JIYA_CS_HTML )
  }
  if (
    matches( $jinze, '.wei, .touwei' ) &&
    !matches( $jinze.nextSibling, 'h-cs.jiya-outer' )
  ) {
    $jinze.insertAdjacentHTML( 'afterend', JIYA_CS_HTML )
  }
}

function locateCS( $jinze, attr ) {
  var $cs

  if (matches( $jinze, '.tou, .touwei' )) {
    $cs = $jinze.previousSibling

    if (matches( $cs, 'h-cs' )) {
      $cs.className = 'jinze-outer jiya-outer'
      $cs.setAttribute( 'prev', attr.prev )
    }
  }
  if (matches( $jinze, '.wei, .touwei' )) {
    $cs = $jinze.nextSibling

    if (matches( $cs, 'h-cs' )) {
      $cs.className = 'jinze-outer jiya-outer ' + attr[ 'class' ]
      $cs.removeAttribute( 'prev' )
    }
  }
}

Han.renderJiya = function( context ) {
  var context = context || document
  var finder = Han.find( context )

  finder
  .avoid( 'textarea, code, kbd, samp, pre, h-cs' )

  .avoid( JIYA_AVOID )
  .charify({
    avoid: false,
    biaodian: charifyBiaodian
  })
  // End avoiding `JIYA_AVOID`:
  .endAvoid()

  .avoid( 'textarea, code, kbd, samp, pre, h-cs' )
  .replace( TYPESET.group.biaodian[0], locateConsecutiveBD )
  .replace( TYPESET.group.biaodian[1], locateConsecutiveBD )

  return finder
}

$.extend( Han.fn, {
  renderJiya: function() {
    Han.renderJiya( this.context )
    return this
  },

  revertJiya: function() {
    $.qsa(
      'h-char.bd-jiya, h-cs.jiya-outer',
      this.context
    ).forEach(function( $elmt ) {
      var classList = $elmt.classList
      classList.remove( 'bd-jiya' )
      classList.remove( 'jiya-outer' )
    })
    return this
  }
})

return Han
})
