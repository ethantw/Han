define([
  '../var/root',
  '../query',
  './support',
  './detect-font'
], function( root, $, support ) {
  function initCond( target ) {
    var
      target = target || root
    ;

    for ( feature in support ) {
      target.classList.add( (support[feature] ? '' : 'no-') + feature )
    }
  }

  return initCond
})
