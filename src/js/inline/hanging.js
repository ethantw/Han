define([
  '../core',
  '../method'
], function( Han, $ ) {

Han.isSpaceFontLoaded = (function() {
  var div = $.create( 'div' )
  var ret

  div.innerHTML = '<span>a b</span><span style="font-family: \'Han Space\'">a b</span>'
  body.appendChild( div )
  ret = div.firstChild.offsetWidth !== div.lastChild.offsetWidth
  $.remove( div, body )
  return ret
})()

Han.support['han-space'] = Han.isSpaceFontLoaded

Han.renderHanging = function( context ) {
  var context = context || document
  var finder = Han.find( context )

  finder
  .avoid( 'textarea, code, kbd, samp, pre, hangable' )
  .replace(
    TYPESET.jinze.hanging,
    function( portion, match ) {
      var elem = $.create( 'h-hangable' )
      var unicode = match[3].charCodeAt( 0 ).toString( 16 )

      elem.innerHTML = match[2] + '<h-cs biaodian="' + match[3] + '"><h-inner hidden> </h-inner></h-cs><h-char class="biaodian cjk end" unicode="' + unicode + '">' + match[3] + '</h-char>'
      return portion.index === 0 ? elem : ''
    }
  )

  return finder
}

$.extend( Han.fn, {
  hanging: null,

  renderHanging: function() {
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
