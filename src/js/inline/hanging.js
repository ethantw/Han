define([
  '../core',
  '../method',
  '../find'
], function( Han, $ ) {

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
    .avoid( 'textarea, code, kbd, samp, pre, h-cs, h-char.hangable' )
    .replace(
      TYPESET.jinze.hanging,
      function( portion ) {
        var $node = portion.node
        var $elmt = $node.parentNode
        var $new

        var biaodian = portion.text
        var html = '<h-cs hidden> </h-cs><h-inner>' + biaodian + '</h-inner>'
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
        $new.classList.add( 'hangable' )
        $new.innerHTML = html

        if ( beenWrapped ) {
          while (!matches( $elmt, 'h-char.biaodian' )) {
            $elmt = $elmt.parentNode
          }

          $elmt.classList.add( 'to-be-omitted' )
          $elmt.parentNode.insertBefore( $new, $elmt )
        }

        return beenWrapped
          ? ''
          : $new
      }
    )

    $.qsa( 'h-char.to-be-omitted', context )
    .forEach(function( $elmt ) {
      $.remove( $elmt )
    })
    return finder
  }
})

$.extend( Han.fn, {
  hanging: null,

  renderHanging: function() {
    var condClazz = this.condition.classList
    var isSpaceFontLoaded = detectSpaceFont()

    if ( isSpaceFontLoaded && condClazz.contains( 'no-han-space' )) {
      condClazz.remove( 'no-han-space' )
      condClazz.add( 'han-space' )
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

