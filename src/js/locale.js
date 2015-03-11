define([
  './core',
  './locale/locale'
], function( Han, Locale ) {

Han.normalize = Locale
Han.localize = Locale
Han.support = Locale.support
Han.detectFont = Locale.detectFont

Han.fn.initCond = function() {
  this.condition.classList.add( 'han-js-rendered' )
  Han.normalize.initCond( this.condition )
  return this
}

void [
  'Elem',
  'DecoLine',
  'Em',
  'Ruby'
].forEach(function( elem ) {
  var method = 'render' + elem

  Han.fn[ method ] = function( target ) {
    Han.normalize[ method ]( this.context, target )
    return this
  }
})

return Han
})
