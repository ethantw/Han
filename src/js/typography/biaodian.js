define([
  '../core',
  '../method',
  '../locale/support'
], function( Han, $, support ) {

Han.correctBiaodian = function( context ) {
  var context = context || document
  var finder  = Han.find( context )

  finder
  .avoid( 'h-char' )
  .replace( /([‘“])/g, function( portion ) {
    var $char = Han.createBDChar( portion.text )
    $char.classList.add( 'bd-open', 'punct' )
    return $char
  })
  .replace( /([’”])/g, function( portion ) {
    var $char = Han.createBDChar( portion.text )
    $char.classList.add( 'bd-close', 'bd-end', 'punct' )
    return $char
  })

  return Han.support.unicoderange
    ? finder
    : finder.charify({ biaodian: true })
}

Han.correctBasicBD = Han.correctBiaodian
Han.correctBD = Han.correctBiaodian

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
