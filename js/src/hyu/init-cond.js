define([
  '../var/root',
  './core'
], function( root, Hyu ) {

Hyu.initCond = function( target ) {
  var target = target || root,
      ret = '',
      clazz

  target.classList.add( Hyu.JS_RENDERED_CLASS )

  for ( var feature in Hyu.support ) {
    clazz = ( Hyu.support[ feature ] ? '' : 'no-' ) + feature

    target.classList.add( clazz )
    ret += clazz + ' '
  }
  return ret
}

return Hyu
})
