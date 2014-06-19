define([
  './var/root',
  './var/body',
  './core',
  './fn'
], function( root, body, Han ) {

    // Initialise the condition with feature-detecting
    // classes (Modernizr-alike) on root elements,
    // possibly `<html>`
    Han( root ).initCond()

    // Address JS-required style normalisation
    Han( body ).renderAll()
})
