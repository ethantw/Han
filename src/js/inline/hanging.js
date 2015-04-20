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
      var elem = $.create( 'hangable' )

      elem.innerHTML = match[2] + '<hcs biaodian="' + match[3] + '"><inner hidden> </inner></hcs>' + match[3]
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
