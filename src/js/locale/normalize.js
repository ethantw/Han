define([
  './core',
  '../method',
  '../regex/typeset'
], function( Locale, $, TYPESET ) {

/**
 * Create and return a new `<h-ru>` element
 * according to the given contents
 */
function createNormalRu( $rb, $rt, attr ) {
  var $ru = $.create( 'h-ru' )
  var $rt = $.clone( $rt )
  var attr = attr || {}
  attr.annotation = 'true'

  if ( Array.isArray( $rb )) {
    $ru.innerHTML = $rb.map(function( rb ) {
      if ( typeof rb === 'undefined' )  return ''
      return rb.outerHTML 
    }).join('') + $rt.outerHTML
  } else {
    $ru.appendChild( $.clone( $rb ))
    $ru.appendChild( $rt )
  }

  $.setAttr( $ru, attr )
  return $ru
}

/**
 * Create and return a new `<ru>` element
 * in Zhuyin form
 */
function createZhuyinRu( $rb, $rt ) {
  var $rb = $.clone( $rb )

  // Create an element to return
  var $ru = $.create( 'h-ru' )

  // #### Explanation ####
  // * `zhuyin`: the entire phonetic annotation
  // * `yin`:    the plain pronunciation (w/out tone)
  // * `diao`:   the tone
  // * `len`:    the length of the plain pronunciation (`yin`)
  var zhuyin = $rt.textContent
  var yin, diao, len

  yin  = zhuyin.replace( TYPESET.zhuyin.diao, '' )
  len  = yin ? yin.length : 0
  diao = zhuyin
    .replace( yin, '' )
    .replace( /[\u02C5]/g, '\u02C7' )
    .replace( /[\u030D]/g, '\u0358' )

  // - <h-ru>
  // -   <rb><rb/> 
  // -   <h-zhuyin>
  // -     <h-yin></h-yin>
  // -     <h-diao></h-diao>
  // -   </h-zhuyin>
  // - </h-ru>
  $ru.appendChild( $rb )
  $ru.innerHTML += '<h-zhuyin><h-yin>' + yin + '</h-yin><h-diao>' + diao + '</h-diao></h-zhuyin>'

  // Finally, set up the necessary attribute
  // and return the new `<ru>`
  $.setAttr( $ru, {
    zhuyin: 'true',
    diao: diao,
    length: len
  })
  return $ru
}

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
  },

  // Address normalisation for both simple and complex
  // rubies
  renderRuby: function( context, target ) {
    var method = target ? 'qsa' : 'tag'
    var target = target || 'ruby'
    var $target = $[ method ]( target, context )
    var $simpClaElem = $.qsa( target + ', rtc', context )

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
      var clazz = ruby.classList

      var condition = (
        !Locale.support.ruby ||
        clazz.contains( 'zhuyin') ||
        clazz.contains( 'complex' ) ||
        clazz.contains( 'rightangle' )
      )

      var frag, $cloned, $rb, $ru, maxspan, hruby

      if ( !condition ) return

      // Apply document fragment here to avoid
      // continuously pointless re-paint
      frag = $.create( '!' )
      frag.appendChild( $.clone( ruby ))
      $cloned = $.qsa( target, frag )[0]

      // 1. Simple ruby polyfill;
      // 2. Zhuyin polyfill for all browsers.
      if ( !Locale.support.ruby || clazz.contains( 'zhuyin' )) {

        $
        .tag( 'rt', $cloned )
        .forEach(function( rt ) {
          var $rb = $.create( '!' )
          var airb = []
          var irb

          // Consider the previous nodes the implied
          // ruby base
          do {
            irb = ( irb || rt ).previousSibling

            if ( !irb || irb.nodeName.match( /((?:h\-)?r[ubt])/i ))  break

            $rb.insertBefore( $.clone( irb ), $rb.firstChild )
            airb.push( irb )
          } while ( !irb.nodeName.match( /((?:h\-)?r[ubt])/i ))
          // Create a real `<h-ru>` to append.
          $ru = clazz.contains( 'zhuyin' ) ?
            createZhuyinRu( $rb, rt ) : createNormalRu( $rb, rt )

          // Replace the ruby text with the new `<h-ru>`,
          // and remove the original implied ruby base(s)
          try {
            rt.parentNode.replaceChild( $ru, rt )

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
      if ( clazz.contains( 'complex' ) || clazz.contains( 'rightangle' )) {
        $rb = $ru = $.tag( 'rb', $cloned )
        maxspan = $rb.length

        // First of all, deal with Zhuyin containers
        // individually
        //
        // Note that we only support one single Zhuyin
        // container in each complex ruby
        void function( rtc ) {
          if ( !rtc )  return

          $ru = $
            .tag( 'rt', rtc )
            .map(function( rt, i ) {
              if ( !$rb[ i ] )  return
              var ret = createZhuyinRu( $rb[ i ], rt )

              try {
                $rb[ i ].parentNode.replaceChild( ret, $rb[ i ] )
              } catch ( e ) {}
              return ret
            })

          // Remove the container once it's useless
          $.remove( rtc )
          ruby.setAttribute( 'rightangle', 'true' )
        }( $cloned.querySelector( 'rtc.zhuyin' ))

        // Then, normal annotations other than Zhuyin
        $
        .qsa( 'rtc:not(.zhuyin)', $cloned )
        .forEach(function( rtc, order ) {
          var ret
          ret = $
            .tag( 'rt', rtc )
            .map(function( rt, i ) {
              var rbspan = Number( rt.getAttribute( 'rbspan' ) || 1 )
              var span = 0
              var aRb = []
              var rb, ret

              if ( rbspan > maxspan ) {
                rbspan = maxspan
              }

              do {
                try {
                  rb = $ru.shift()
                  aRb.push( rb ) 
                } catch (e) {}

                if ( typeof rb === 'undefined' )  break
                span += Number( rb.getAttribute( 'span' ) || 1 )
              } while ( rbspan > span )

              if ( rbspan < span ) {
                if ( aRb.length > 1 ) {
                  console.error( 'An impossible `rbspan` value detected.', ruby ) 
                  return
                }
                aRb = $.tag( 'rb', aRb[0] )
                $ru = aRb.slice( rbspan ).concat( $ru ) 
                aRb = aRb.slice( 0, rbspan )
                span = rbspan
              }
              
              ret = createNormalRu( aRb, rt, {
                'class': clazz, 
                span: span,
                order: order 
              })

              try {
                aRb[0].parentNode.replaceChild( ret, aRb.shift())
                aRb.forEach(function( rb ) {
                  $.remove( rb )
                })
              } catch (e) {}

              return ret
            })
          $ru = ret

          if ( order === 1 ) {
            ruby.setAttribute( 'doubleline', 'true' )
          }

          // Remove the container once it's useless
          $.remove( rtc )
        })
      }
      // Create a new fake `<h-ruby>` element so the
      // style sheets will render it as a polyfill,
      // which also helps to avoid the UA style.
      hruby = $.create( 'h-ruby' )
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
