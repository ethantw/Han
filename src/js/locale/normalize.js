define([
  './core',
  '../method',
  '../regex/typeset',
  '../fibre-extend'
], function( Locale, $, TYPESET, Fibre ) {

/**
 * Create and return a new `<ru>` element
 * according to the given contents
 */
function createNormalRu( $rb, $rt, attr ) {
  var $ru = $.create( 'ru' )
  var $rt = $.clone( $rt )
  var attr = attr || {}

  if ( Array.isArray( $rb )) {
    $ru.innerHTML = $rb.map(function( rb ) {
      if (typeof rb == 'undefined') { return '' }
      return rb.outerHTML 
    }).join('')
  } else {
    $ru.appendChild( $.clone( $rb ))
  }

  $ru.appendChild( $rt )
  attr.annotation = $rt.textContent
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
  var $ru     = $.create( 'ru' )
  var $zhuyin = $.create( 'zhuyin' )
  var $yin    = $.create( 'yin' )
  var $diao   = $.create( 'diao' )

  // #### Explanation ####
  // * `zhuyin`: the entire phonetic annotation
  // * `yin`:    the plain pronunciation (w/out tone)
  // * `diao`:   the tone
  // * `form`:   the combination of the pronunciation
  // * `len`:    the text length of `yin`
  var zhuyin = $rt.textContent
  var yin, diao, form, len

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
  // - <ru>
  // -   <rb><rb/> 
  // -   <zhuyin>
  // -     <yin></yin>
  // -     <diao></diao>
  // -   </zhuyin>
  // - </ru>
  $diao.innerHTML = diao
  $yin.innerHTML = yin
  $zhuyin.appendChild( $yin )
  $zhuyin.appendChild( $diao )

  $ru.appendChild( $rb )
  $ru.appendChild( $zhuyin )

  // Finally, set up the necessary attribute
  // and return the new `<ru>`
  $.setAttr( $ru, {
    zhuyin: '',
    diao: diao,
    length: len,
    form: form
  })
  return $ru
}

/**
 * Normalisation rendering mechanism
 */
$.extend( Locale, {

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
      var $elem = Fibre( elem )

      if ( !Locale.support.textemphasis ) {
        $elem.jinzify()
      }

      $elem
      .groupify()
      .charify( Locale.support.textemphasis ? {
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

      // 1. Simple ruby polyfill for, um, Firefox;
      // 2. Zhuyin polyfill for all.
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

            if ( !irb || irb.nodeName.match( /(r[ubt])/i ))  break 

            $rb.insertBefore( $.clone( irb ), $rb.firstChild )
            airb.push( irb )
          } while ( !irb.nodeName.match( /(r[ubt])/i ))
          // Create a real `<ru>` to append.
          $ru = clazz.contains( 'zhuyin' ) ?
            createZhuyinRu( $rb, rt ) : createNormalRu( $rb, rt )

          // Replace the ruby text with the new `<ru>`,
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
        !function( rtc ) {
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
          ruby.setAttribute( 'rightangle', '' )
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
                if (typeof rb == 'undefined') { break }
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
