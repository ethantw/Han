define([
  '../query',
  '../farr',
  './core',
  './support'
], function( $, Farr, Hyu, support ) {

$.extend( Hyu, {
  renderAnnotation: function( selector, target ) {
    var
      target = target || 'u, ins',
      $target = selector.querySelectorAll( target )
      rTarget = new RegExp( '[' + target.replace(/\,[\s\n]?/g, '|') + ']', 'ig' )
    ;

    $
    .arraify( $target )
    .forEach(function( elem, i ) {
      var
        next = elem.nextSibling
      ;

      if ( !next ) {
        return
      }
      // Ignore all `<wbr>` and comments in between
      while ( next.nodeName === 'WBR' || next.nodeType == 8 ) {
        next = next.nextSibling
      }

      if ( next.nodeName.match( rTarget )) {
        next.classList.add('adjacent')
      }
    })
  },

  renderEmphasis: function( selector, target ) {
    var
      target = target || 'em',
      $target = selector.querySelectorAll( target )
    ;

    $
    .arraify( $target )
    .forEach(function( elem, i ) {
      var
        $elem = Farr( elem )
      ;

      if ( !support.textemphasis ) {
        $elem.jinzify()
      }

      $elem
      .charify( support.textemphasis ? {
        hanzi:     'biaodian',
        word:      'punctuation'
      } : {
        latin:     'individual',
        ellinika:  'individual',
        kirillica: 'individual'
      })
    })
  },

  renderRuby: function( selector, target ) {
    var
      target = target || 'ruby',
      $target = selector.querySelectorAll( target ),

      simpClaElem = target + ', rtc',
      $simpClaElem = selector.querySelectorAll( simpClaElem )
    ;

    // First of all,
    // simplify the semantic classes
    $
    .arraify( $simpClaElem )
    .forEach(function( elem, i ) {
      var
        clazz = elem.classList
      ;

      if ( clazz.contains( 'pinyin' )) {
        clazz.add( 'romanization' )
      } else if ( clazz.contains( 'mps' )) {
        clazz.add( 'zhuyin' )
      }

      if ( clazz.contains( 'romanization' )) {
        clazz.add( 'annotation' )
      }
    })

    $
    .arraify( $target )
    .forEach(function( elem, i ) {
      var
        clazz = elem.classList,
        html = elem.innerHTML,
        hruby
      ;

      // Simple ruby polyfill for, um, Firefox
      if ( !support.ruby &&
           !clazz.contains( 'complex' ) &&
           !clazz.contains( 'zhuyin' ) &&
           !clazz.contains( 'rightangle' )
      ) {
        $
        .arraify( elem.getElementsByTagName( 'rt' ))
        .forEach(function( elem, i ) {
          var
            html = elem.innerHTML,
            prev = elem.previousSibling,
            text = prev.nodeValue,
            hruby = $.create( 'hruby' ),
            rb = $.create( 'rb' )
          ;

          if ( !elem.parentNode ) {
            return
          }

          prev.nodeValue = ''

          rb.setAttribute( 'data-annotation', anno )
          parentNode.insertBefore( rb )
        })

        hruby.innerHTML = html
        elem.parentNode( hruby, this )

      // Complex ruby support
      } else {

      }
    })
  },

  renderAll: function( selector ) {
    this.renderRuby( selector )
    this.renderEmphasis( selector )
    this.renderAnnotation( selector )
  }
})

Hyu.renderAll( document.body )

})
