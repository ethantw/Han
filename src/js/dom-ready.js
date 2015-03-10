define([
  './var/root',
  './core',
  './locale'
], function( root, Han ) {

window.addEventListener( 'DOMContentLoaded', function() {
  var initContext

  // Use the shortcut under the default situation
  if ( root.classList.contains( 'han-init' )) {
    Han.init()

  // Consider ‘a configured context’ the special
  // case of the default situation. Will have to
  // replace the `Han.init` with the instance as
  // well (for future usage).
  } else if ( initContext = document.querySelector( '.han-init-context' )) {
    Han.init = Han( initContext ).render()
  }
})
})
