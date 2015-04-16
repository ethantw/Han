define([
  '../core',
  '../method'
], function( Han, $ ) {

Han.renderHanging = function( context ) {
  var context = context || document
  var finder = Han.find( context )

  finder
  .filterOut( 'textarea, code, kbd, samp, pre, jinze', true )
  .hangingify()

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
