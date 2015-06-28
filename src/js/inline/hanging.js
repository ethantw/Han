define([
  '../core',
  '../method'
], function( Han, $ ) {

function detectSpaceFont() {
  var div = $.create( 'div' )
  var ret

  div.innerHTML = '<span>a b</span><span style="font-family: \'Han Space\'">a b</span>'
  body.appendChild( div )
  ret = div.firstChild.offsetWidth !== div.lastChild.offsetWidth
  $.remove( div, body )
  return ret
}

$.extend( Han, {
  detectSpaceFont:   detectSpaceFont,
  isSpaceFontLoaded: detectSpaceFont()
})

Han.support['han-space'] = detectSpaceFont()

Han.renderHanging = function( context ) {
  var context = context || document
  var finder = Han.find( context )

  finder
  .avoid( 'textarea, code, kbd, samp, pre, h-hangable' )
  .replace(
    TYPESET.jinze.hanging,
    function( portion, match ) {
      var elem = $.create( 'h-hangable' )
      elem.innerHTML = match[2] + '<h-cs><h-inner hidden> </h-inner><h-char class="biaodian close end cjk">' + match[3] + '</h-char></h-cs>'
      return portion.index === 0 ? elem : ''
    }
  )

  return finder
}

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

