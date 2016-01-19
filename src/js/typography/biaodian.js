define([
  '../core',
  '../method',
  '../locale/support'
], function( Han, $, support ) {

var $mdot  = $.create( 'h-char', 'biaodian cjk bd-middle' )
$mdot.setAttribute( 'unicode', 'b7' )

Han.correctBiaodian = function( context ) {
  var context = context || document
  var finder  = Han.find( context )

  finder
  .avoid( 'h-char' )
  .replace( /([‘“])/g, function( portion ) {
    var $char = Han.createBdChar( portion.text )
    $char.classList.add( 'bd-open', 'punct', 'western' )
    return $char
  })
  .replace( /([’”])/g, function( portion ) {
    var $char = Han.createBdChar( portion.text )
    $char.classList.add( 'bd-close', 'punct', 'western' )
    return $char
  })

  return Han.support.unicoderange
    ? finder
    : finder
      .wrap( /\u00B7/g, $.clone( $mdot ))
      .charify({ biaodian: true })
}

Han.correctBasicBD = Han.correctBiaodian

$.extend( Han.fn, {
  biaodian: null,

  correctBiaodian: function() {
    this.biaodian = Han.correctBiaodian( this.context )
    return this
  },

  revertCorrectedBiaodian: function() {
    try {
      this.biaodian.revert( 'all' )
    } catch (e) {}
    return this
  }
})

// Legacy support (deprecated):
Han.fn.correctBasicBD = Han.fn.correctBiaodian
Han.fn.revertBasicBD  = Han.fn.revertCorrectedBiaodian

return Han
})
