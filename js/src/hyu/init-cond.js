define([
  '../var/root',
  './support'
], function( root, support ) {
  function initCond( target ) {
    var
      target = target || root,
      ret = '',
      clazz
    ;

    target.classList.add( 'hyu-js-rendered' )

    for ( var feature in support ) {
      clazz = (support[ feature ] ? '' : 'no-') + feature

      target.classList.add( clazz )
      ret += clazz + ' '
    }
    return ret
  }

  return initCond
})
