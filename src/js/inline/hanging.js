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

Han.support['han-space'] = detectSpaceFont()

$.extend( Han, {
  detectSpaceFont:   detectSpaceFont,
  isSpaceFontLoaded: detectSpaceFont(),

  renderHanging: function( context ) {
    var context = context || document
    var finder  = Han.find( context )

    finder
    .avoid( 'textarea, code, kbd, samp, pre, h-cs' )
    .avoid( HANGABLE_AVOID )
    .replace(
      TYPESET.jinze.hanging,
      function( portion ) {
        var $node = portion.node
        var $elmt = $node.parentNode
        var $new

        var biaodian = portion.text
        var html = '<h-inner>' + biaodian + '</h-inner>'
        var beenWrapped = matches( $elmt, 'h-char[unicode], h-char[unicode] *' )

        void function( $elmt ) {
          if (matches( $elmt, 'h-jinze, h-jinze *' )) {
            var $jinze = $elmt
            var $cs

            while (!matches( $jinze, 'h-jinze' )) {
              $jinze = $jinze.parentNode
            }

            $cs = $jinze.nextSibling

            if ( $cs && matches( $cs, 'h-cs.jinze-outer' )) {
              $cs.classList.add( 'hangable-outer' )
            } else {
              $jinze.insertAdjacentHTML(
                'afterend',
                '<h-cs hidden class="jinze-outer hangable-outer"> </h-cs>'
              )
            }
          }
        }( $elmt )

        $new = Han.createBdChar( biaodian )
        $new.innerHTML = html
        $new.classList.add( HANGABLE_CLASS )

        return !beenWrapped
          ? $new
          : (function() {
            var $char = $elmt

            while (!matches( $char, 'h-char.biaodian' )) {
              $char = $char.parentNode
            }
            $char.classList.add( HANGABLE_CLASS )

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
    var isSpaceFontLoaded = detectSpaceFont()

    if ( isSpaceFontLoaded && classList.contains( 'no-han-space' )) {
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

