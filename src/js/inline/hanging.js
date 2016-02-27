define([
  '../core',
  '../method',
  '../find'
], function( Han, $ ) {

var HANGABLE_CLASS = 'bd-hangable'
var HANGABLE_AVOID = 'h-char.bd-hangable'

var matches = Han.find.matches

function detectSpaceFont() {
  var div = $.create( 'div' )
  var ret

  div.innerHTML = '<span>a b</span><span style="font-family: \'Han Space\'">a b</span>'
  body.appendChild( div )
  ret = div.firstChild.offsetWidth !== div.lastChild.offsetWidth
  $.remove( div )
  return ret
}

function insertHangableCS( $jinze ) {
  var $cs = $jinze.nextSibling

  if ( $cs && matches( $cs, 'h-cs.jinze-outer' )) {
    $cs.classList.add( 'hangable-outer' )
  } else {
    $jinze.insertAdjacentHTML(
      'afterend',
      '<h-cs hidden class="jinze-outer hangable-outer"> </h-cs>'
    )
  }
}

Han.support['han-space'] = detectSpaceFont()

$.extend( Han, {
  detectSpaceFont:   detectSpaceFont,
  isSpaceFontLoaded: detectSpaceFont(),

  renderHanging: function( context ) {
    var context = context || document
    var finder  = Han.find( context )

    finder
    .avoid( 'textarea, code, kbd, samp, pre' )
    .avoid( HANGABLE_AVOID )
    .replace(
      TYPESET.jinze.hanging,
      function( portion ) {
        if ( /^[\x20\t\r\n\f]+$/.test( portion.text )) {
          return ''
        }

        var $elmt = portion.node.parentNode
        var $jinze, $new, $bd, biaodian


        if ( $jinze = $.parent( $elmt, 'h-jinze' )) {
          insertHangableCS( $jinze )
        }

        biaodian = portion.text.trim()

        $new = Han.createBdChar( biaodian )
        $new.innerHTML = '<h-inner>' + biaodian + '</h-inner>'
        $new.classList.add( HANGABLE_CLASS )

        $bd = $.parent( $elmt, 'h-char.biaodian' )

        return !$bd
          ? $new
          : (function() {
            $bd.classList.add( HANGABLE_CLASS )

            return matches( $elmt, 'h-inner, h-inner *' )
              ? biaodian
              : $new.firstChild
          })()
      }
    )
    return finder
  }
})

$.extend( Han.fn, {
  hanging: null,

  renderHanging: function() {
    var classList = this.condition.classList
    Han.isSpaceFontLoaded = detectSpaceFont()

    if (
      Han.isSpaceFontLoaded &&
      classList.contains( 'no-han-space' )
    ) {
      classList.remove( 'no-han-space' )
      classList.add( 'han-space' )
    }

    this.hanging = Han.renderHanging( this.context )
    return this
  },

  revertHanging: function() {
    try {
      this.hanging.revert( 'all' )
    } catch ( e ) {}
    return this
  }
})

return Han
})

