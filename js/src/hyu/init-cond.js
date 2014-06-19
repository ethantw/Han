define([
  '../var/root',
  '../method',
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
