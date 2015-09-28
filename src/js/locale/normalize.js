define([
  './core',
  '../method',
  '../regex/typeset',
  './hruby'
], function( Locale, $, TYPESET ) {

/**
 * Normalisation rendering mechanism
 */
$.extend( Locale, {

  // Render and normalise the given context by routine:
  //
  // ruby -> u, ins -> s, del -> em
  //
  renderElem: function( context ) {
    this.renderRuby( context )
    this.renderDecoLine( context )
    this.renderDecoLine( context, 's, del' )
    this.renderEm( context )
  },

  // Traverse target elements (those with text-decoration-
  // line) to see if we should address spacing in
  // between for semantic presentation.
  renderDecoLine: function( context, target ) {
    var target = target || 'u, ins'
    var $target = $.qsa( target, context )
    var rTarget = new RegExp( '^(' + target.replace(/\,\s?/g, '|') + ')$', 'ig' )

    $target
    .forEach(function( elem ) {
      var next

      // Ignore all `<wbr>` and comments in between
      do {
        next = ( next || elem ).nextSibling
        if ( !next ) return
      } while ( $.isIgnorable( next ))

      if ( next.nodeName.match( rTarget )) {
        next.classList.add( 'adjacent' )
      }
    })
  },

  // Traverse target elements to render Hanzi emphasis marks
  // and skip that in punctuation
  renderEm: function( context, target ) {
    var method = target ? 'qsa' : 'tag'
    var target = target || 'em'
    var $target = $[ method ]( target, context )

    $target
    .forEach(function( elem ) {
      var $elem = Han( elem )

      if ( Locale.support.textemphasis ) {
        $elem
        .avoid( 'rt, h-char, h-char-group' )
        .charify({ biaodian: true, punct: true })
      } else {
        $elem
        .avoid( 'rt, h-char, h-char-group' )
        .jinzify()
        .groupify({ western: true, biaodian: true })
        .charify({
          hanzi:     true,
          biaodian:  true,
          punct:     true,
          latin:     true,
          ellinika:  true,
          kirillica: true
        })
      }
    })
  }
})
})
