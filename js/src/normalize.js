define([
  './core',
  './hyu/hyu'
], function( Han, Hyu ) {

Han.normalize = Hyu
Han.support = Hyu.support
Han.detectFont = Hyu.detectFont

Han.fn.initCond = function() {
  this.condition.classList.add( 'han-js-rendered' )
  Han.normalize.initCond( this.condition )
  return this
}

;[
  'Elem',
  'DecoLine',
  'Em',
  'Ruby'
].forEach(function( elem ) {
  var
    method = 'render' + elem
  ;

  Han.fn[ method ] = function( target ) {
    Han.normalize[ method ]( this.context, target )
    return this
  }
})

return Han
})
