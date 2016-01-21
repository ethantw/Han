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
  $.remove( div, body )
  return ret
}

Han.support['han-space'] = detectSpaceFont()

var get$csoHTML = function( clazz ) {
  return '<h-cs hidden class="jinze-outer ' + clazz + '"> </h-cs>'
}

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
                'afterend', get$csoHTML( 'hangable-outer' )
              )
            }
          }
        }( $elmt )

        if ( beenWrapped ) {
          while (!matches( $elmt, 'h-char[unicode]' )) {
            $elmt = $elmt.parentNode
          }
        } else {
          $elmt = Han.createBdChar( biaodian )
        }

        $elmt.classList.add( 'hangable' )
        $elmt.innerHTML = html

        return beenWrapped
          ? null
          : $elmt
      }
    )
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

