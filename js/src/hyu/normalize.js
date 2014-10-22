define([
  './core',
  '../method',
  '../farr/farr',
  '../regex/typeset'
], function( Hyu, $, Farr, TYPESET ) {

/**
 * Create and return a new `<rb>` element
 * according to the given contents
 */
function createPlainRb( rb, rt ) {
  var rb = $.clone( rb ),
      rt = $.clone( rt ),
      $rb = $.create( 'rb' )

  $rb.appendChild( rb )
  $rb.appendChild( rt )
  $rb.setAttribute( 'annotation', rt.textContent )

  return $rb
}

/**
 * Create and return a new `<rb>` element
 * in Zhuyin form
 */
function createZhuyinRb( rb, rt ) {
  var rb = $.clone( rb ),

      // Create an element to return
      $rb   = $.create( 'rb' ),
      $rt   = $.create( 'zhuyin' ),
      $yin  = $.create( 'yin' ),
      $diao = $.create( 'diao' ),

      // #### Explanation ####
      // * `zhuyin`: the entire phonetic annotation
      // * `yin`:    the plain pronunciation (w/out tone)
      // * `diao`:   the tone
      // * `form`:   the combination of the pronunciation
      // * `len`:    the text length of `yin`
      zhuyin = rt.textContent,
      yin, diao, form, len

  yin  = zhuyin.replace( TYPESET.zhuyin.diao, '' )
  len  = yin ? yin.length : 0
  diao = zhuyin
         .replace( yin, '' )
         .replace( /[\u02C5]/g, '\u02C7' )
         .replace( /[\u030D]/g, '\u0358' )

  form = zhuyin.replace( TYPESET.zhuyin.form, function( s, j, y ) {
    return [
      s ? 'S' : null,
      j ? 'J' : null,
      y ? 'Y' : null
    ].join('')
  })

  // - <rb>
  // -   # ruby base text
  // -   <zhuyin>
  // -     <yin></yin>
  // -     <diao></diao>
  // -   </zhuyin>
  // - </rb>
  $diao.innerHTML = diao
  $yin.innerHTML = yin
  $rt.appendChild( $yin )
  $rt.appendChild( $diao )

  if ( rb.nodeName === 'RB' ) {
    $rb.innerHTML = rb.innerHTML
  } else {
    $rb.appendChild( rb )
  }

  $rb.appendChild( $rt )

  // Finally, set up the necessary attribute
  // and return the new `<rb>`
  $.setAttr( $rb, {
    zhuyin: '',
    diao: diao,
    length: len,
    form: form
  })
  return $rb
}

/**
 * Normalisation rendering mechanism
 */
$.extend( Hyu, {

  // Render and normalise the given context by routine:
  //
  // > ruby > u, ins > s, del > em
  //
  renderElem: function( context ) {
    this.renderRuby( context )
    this.renderDecoLine( context )
    this.renderDecoLine( context, 's, del' )
    this.renderEm( context )
  },

  // Traverse target elements (those with text-decoration
  // -line) to see if we should address spacing in
  // between for semantic presentation.
  renderDecoLine: function( context, target ) {
    var target = target || 'u, ins',
        $target = $.qsa( target, context ),
        rTarget = new RegExp( '^(' + target.replace(/\,\s?/g, '|') + ')$', 'ig' )

    $target
    .forEach(function( elem ) {
      var next

      // Ignore all `<wbr>` and comments in between
      do {
        next = ( next || elem ).nextSibling

        if ( !next ) {
          return
        }
      } while ( $.isIgnorable( next ))

      if ( next.nodeName.match( rTarget )) {
        next.classList.add( 'adjacent' )
      }
    })
  },

  // Traverse target elements to render Hanzi emphasis marks
  // and skip that in punctuation
  renderEm: function( context, target ) {
    var qs = target ? 'qsa' : 'tag',
        target = target || 'em',
        $target = $[ qs ]( target, context )

    $target
    .forEach(function( elem ) {
      var $elem = Farr( elem )

      if ( !Hyu.support.textemphasis ) {
        $elem.jinzify()
      }

      $elem
      .groupify()
      .charify( Hyu.support.textemphasis ? {
        hanzi:     'biaodian',
        word:      'punctuation'
      } : {
        latin:     'individual',
        ellinika:  'individual',
        kirillica: 'individual'
      })
    })
  },

  // Address normalisation for both simple and complex
  // rubies
  renderRuby: function( context, target ) {
    var qs = target ? 'qsa' : 'tag',
        target = target || 'ruby',
        $target = $[ qs ]( target, context ),

        simpClaElem = target + ', rtc',
        $simpClaElem = $.qsa( simpClaElem, context )

    // First of all, simplify semantic classes
    $simpClaElem
    .forEach(function( elem ) {
      var clazz = elem.classList

      if ( clazz.contains( 'pinyin' )) {
        clazz.add( 'romanization' )
      } else if ( clazz.contains( 'mps' )) {
        clazz.add( 'zhuyin' )
      }

      if ( clazz.contains( 'romanization' )) {
        clazz.add( 'annotation' )
      }
    })

    // Deal with `<ruby>`
    $target
    .forEach(function( ruby ) {
      var clazz = ruby.classList,

          condition = (
            !Hyu.support.ruby ||
            clazz.contains( 'zhuyin') ||
            clazz.contains( 'complex' ) ||
            clazz.contains( 'rightangle' )
          ),

          frag, $cloned, $rb, hruby

      if ( !condition ) {
        return
      }

      // Apply document fragment here to avoid
      // continuously pointless re-paint
      frag = $.create( '!' )
      frag.appendChild( $.clone( ruby ))
      $cloned = $.qsa( target, frag )[0]

      // 1. Simple ruby polyfill for, um, Firefox;
      // 2. Zhuyin polyfill for all.
      if (
        !Hyu.support.ruby ||
        clazz.contains( 'zhuyin' )
      ) {

        $
        .tag( 'rt', $cloned )
        .forEach(function( rt ) {
          var $rb = $.create( '!' ),
              airb = [],
              irb

          // Consider the previous nodes the implied
          // ruby base
          do {
            irb = ( irb || rt ).previousSibling

            if ( !irb || irb.nodeName.match( /(rt|rb)/i )) {
              break
            }

            $rb.insertBefore(
              $.clone( irb ),
              $rb.firstChild
            )
            airb.push( irb )
          } while ( !irb.nodeName.match( /(rt|rb)/i ))

          // Create a real `<rb>` to append.
          $rb = clazz.contains( 'zhuyin' ) ?
            createZhuyinRb( $rb, rt ) :
            createPlainRb( $rb, rt )

          // Replace the ruby text with the new `<rb>`,
          // and remove the original implied ruby base(s)
          try {
            rt.parentNode.replaceChild( $rb, rt )

            airb
            .forEach(function( irb ) {
              $.remove( irb )
            })
          } catch ( e ) {}
        })
      }

      // 3. Complex ruby polyfill
      // - Double-lined annotation;
      // - Right-angled annotation.
      if (
        clazz.contains( 'complex' ) ||
        clazz.contains( 'rightangle' )
      ) {
        $rb = $.tag( 'rb', $cloned )

        // First of all, deal with Zhuyin containers
        // individually
        //
        // Note that we only support one single Zhuyin
        // container in each complex ruby
        !function( rtc ) {
          if ( !rtc ) {
            return
          }

          $
          .tag( 'rt', rtc )
          .forEach(function( rt, i ) {
            if ( !$rb[ i ] ) {
              return
            }

            var $$rb = createZhuyinRb( $rb[ i ], rt )

            try {
              $rb[ i ].parentNode.replaceChild( $$rb, $rb[ i ] )
            } catch ( e ) {}
          })

          // Remove the container once it's useless
          $.remove( rtc )
          ruby.setAttribute( 'rightangle', '' )
        }( $cloned.querySelector( 'rtc.zhuyin' ))

        // Then, other normal annotations
        $
        .qsa( 'rtc:not(.zhuyin)', $cloned )
        .forEach(function( rtc, order ) {
          var clazz = rtc.classList,
              start, end

          // Initialise
          start = end = 0

          // Recache the ruby base
          $rb = $.qsa(
            order === 0 ? 'rb' : 'rb[span]',
            $cloned
          )

          $
          .tag( 'rt', rtc )
          .forEach(function( rt ) {
            var $$rb = $.create( '!' ),

                // #### Explanation ####
                // * `rbspan`: the `<rb>` span assigned in the HTML
                // * `span`:   the span number of the current `<rb>`
                rbspan = parseInt( rt.getAttribute( 'rbspan' )) || 1,
                span, _$rb

            start = end
            end += parseInt( rbspan )

            // Rearrange the effected `<rb>` array according
            // to (rb)span, while working on the second container.
            if ( order > 0 ) {
              for ( var i = end-1; i >= start; i-- ) {
                if ( !$rb[ i ] ) {
                  continue
                }

                span = parseInt( $rb[ i ].getAttribute( 'span' )) || 1

                if ( span > rbspan ) {
                  _$rb = $.tag( 'rb', $rb[ i ] )

                  for ( var j = 0, len = _$rb.length; j < len; j++ ) {
                    $rb.splice( i+j, 1, _$rb[ j ] )
                  }
                }
              }
            }

            // Iterate from the last item, for we don't
            // want to mess up with the original indices.
            for ( var i = end-1; i >= start; i-- ) {
              if ( !$rb[ i ] ) {
                continue
              }

              $$rb.insertBefore(
                $.clone( $rb[ i ] ),
                $$rb.firstChild
              )

              if ( rbspan > 1 && i !== start ) {
                $.remove( $rb[ i ] )
                continue
              }

              $$rb = createPlainRb( $$rb, rt )
              $.setAttr( $$rb, {
                'class': clazz,
                span: rbspan,
                order: order
              })
              $rb[ i ].parentNode.replaceChild( $$rb, $rb[ i ] )
            }
          })

          // Remove the container once it's useless
          $.remove( rtc )
        })
      }

      // Create a new fake `<hruby>` element so the
      // style sheets will render it as a polyfill,
      // which also helps to avoid the UA style.
      //
      // (The ‘H’ stands for ‘Han’, by the way)
      hruby = $.create( 'hruby' )
      hruby.innerHTML = frag.firstChild.innerHTML

      // Copy all attributes onto it
      $.setAttr( hruby, ruby.attributes )
      hruby.normalize()

      // Finally, replace it
      ruby.parentNode.replaceChild( hruby, ruby )
    })
  }

  // ### TODO list ###
  //
  // * Debug mode
  // * Better error-tolerance
})
})
