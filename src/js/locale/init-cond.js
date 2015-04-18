define([
  '../var/root',
  './core'
], function( root, Locale ) {

var UA = window.navigator.userAgent || null
var isIE = /Trident/i.test( UA )

Locale.support['pseudo-element-clipboard'] = isIE ? true : false

Locale.initCond = function( target ) {
  var target = target || root
  var ret = ''
  var clazz

  for ( var feature in Locale.support ) {
    clazz = ( Locale.support[ feature ] ? '' : 'no-' ) + feature

    target.classList.add( clazz )
    ret += clazz + ' '
  }
  return ret
}

return Locale
})
