define([
  './var/root',
  './core',
  './fn'
], function( root, Han ) {

  !function() {
    var
      DOMReady,
      initContext
    ;

    DOMReady = setInterval( function() {
      if ( document.readyState === 'complete' ) {
        clearTimeout( DOMReady )

        // Use shortcut for default situation
        if ( root.classList.contains( 'han-init' )) {
          Han.init()

        // If a context is configured
        } else if ( initContext = document.querySelector( '.han-init-context' )) {
          Han( initContext ).renderByRoutine()
        }
      }
    }, 50 )
  }()
})
