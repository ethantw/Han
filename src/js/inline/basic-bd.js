define([
  '../core',
  '../method',
  '../locale/support'
], function( Han, $, support ) {

var mdot

mdot = $.create( 'h-char', 'biaodian cjk middle' )
mdot.setAttribute( 'unicode', 'b7' )

Han.correctBasicBD = function( context, all ) {
  if ( Han.support.unicoderange && !all ) return

  var context = context || document
  var finder

  finder = Han.find( context )

  finder
  .wrap( /\u00B7/g, $.clone( mdot ))
  .charify({ biaodian: true })
}

$.extend( Han.fn, {
  basicBD: null,

  correctBasicBD: function( all ) {
    this.basicBD = Han.correctBasicBD( this.context, all )
    return this
  },

  revertBasicBD: function() {
    try {
      this.basicBD.revert( 'all' )
    } catch (e) {}
    return this
  }
})

return Han
})
