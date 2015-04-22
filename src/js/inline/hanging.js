define([
  '../core',
  '../method'
], function( Han, $ ) {

Han.renderHanging = function( context ) {
  var context = context || document
  var finder = Han.find( context )

  finder
  .filterOut( 'textarea, code, kbd, samp, pre, hangable', true )
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
