define([
  './core',
  '../method',
  '../regex/typeset',
  './h-ruby'
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

   // Traverse all target elements and address
   // presentational corrections if any two of
   // them are adjacent to each other.
  renderDecoLine: function( context, target ) {
    var $$target = $.qsa( target || 'u, ins', context )
    var i = $$target.length

    traverse: while ( i-- ) {
      var $this = $$target[ i ]
      var $prev = null

      // Ignore all `<wbr>` and comments in between,
      // and add class `.adjacent` once two targets
      // are next to each other.
      ignore: do {
        $prev = ( $prev || $this ).previousSibling

        if ( !$prev ) {
          continue traverse
        } else if ( $$target[ i-1 ] === $prev ) {
          $this.classList.add( 'adjacent' )
        }
      } while ( $.isIgnorable( $prev ))
    }
  },

  // Traverse all target elements to render
  // emphasis marks.
  renderEm: function( context, target ) {
    var method = target ? 'qsa' : 'tag'
    var target = target || 'em'
    var $target = $[ method ]( target, context )

    $target
    .forEach(function( elem ) {
      var $elem = Han( elem )

      if ( Locale.support.textemphasis ) {
        $elem
        .avoid( 'rt, h-char' )
        .charify({ biaodian: true, punct: true })
      } else {
        $elem
        .avoid( 'rt, h-char, h-char-group' )
        .jinzify()
        .groupify({ western: true })
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
