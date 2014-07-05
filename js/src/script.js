define([
  './core',
  './fn'
], function( Han ) {

  var
    ready
  ;

  ready = setInterval( function() {
    if ( document.readyState === 'complete' ) {
      clearTimeout( ready )
      Han.renderByRoutine()
    }
  }, 50 )

})
