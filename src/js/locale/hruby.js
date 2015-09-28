define([
  './core',
  '../method',
  '../regex/typeset'
], function( Locale, $, TYPESET ) {

var SUPPORT_IC = Locale.support[ 'ruby-interchar' ]

// 1. Simple ruby polyfill;
// 2. Inter-character polyfill for Zhuyin
function renderSimpleRuby( $ruby ) {
  var frag = $.create( '!' )
  var clazz = $ruby.classList
  var $rb, $ru

  frag.appendChild( $.clone( $ruby ))

  $
  .tag( 'rt', frag.firstChild )
  .forEach(function( $rt ) {
    var $rb = $.create( '!' )
    var airb = []
    var irb

    // Consider the previous nodes the implied
    // ruby base
    do {
      irb = ( irb || $rt ).previousSibling
      if ( !irb || irb.nodeName.match( /((?:h\-)?r[ubt])/i ))  break

      $rb.insertBefore( $.clone( irb ), $rb.firstChild )
      airb.push( irb )
    } while ( !irb.nodeName.match( /((?:h\-)?r[ubt])/i ))

    // Create a real `<h-ru>` to append.
    $ru = clazz.contains( 'zhuyin' ) ? createZhuyinRu( $rb, $rt ) : createNormalRu( $rb, $rt )

    // Replace the ruby text with the new `<h-ru>`,
    // and remove the original implied ruby base(s)
    try {
      $rt.parentNode.replaceChild( $ru, $rt )
      airb.map( $.remove )
    } catch ( e ) {}
  })
  return createCustomRuby( frag )
}

function renderInterCharRuby( $ruby ) {
  var frag = $.create( '!' )
  frag.appendChild( $.clone( $ruby ))

  $
  .tag( 'rt', frag.firstChild )
  .forEach(function( $rt ) {
    var $rb = $.create( '!' )
    var airb = []
    var irb, $zhuyin

    // Consider the previous nodes the implied
    // ruby base
    do {
      irb = ( irb || $rt ).previousSibling
      if ( !irb || irb.nodeName.match( /((?:h\-)?r[ubt])/i ))  break

      $rb.insertBefore( $.clone( irb ), $rb.firstChild )
      airb.push( irb )
    } while ( !irb.nodeName.match( /((?:h\-)?r[ubt])/i ))

    $zhuyin = $.create( 'rt' )
    $zhuyin.innerHTML = getZhuyinHTML( $rt )
    $rt.parentNode.replaceChild( $zhuyin, $rt )
  })
  return frag.firstChild
}

// 3. Complex ruby polyfill
// - Double-lined annotation;
// - Right-angled annotation.
function renderComplexRuby( $ruby ) {
  var frag = $.create( '!' )
  var clazz = $ruby.classList
  var $cloned, $rb, $ru, maxspan

  frag.appendChild( $.clone( $ruby ))
  $cloned = frag.firstChild

  $rb = $ru = $.tag( 'rb', $cloned )
  maxspan = $rb.length

  // First of all, deal with Zhuyin containers
  // individually
  //
  // Note that we only support one single Zhuyin
  // container in each complex ruby
  void function( $rtc ) {
    if ( !$rtc )  return

    $ru = $
      .tag( 'rt', $rtc )
      .map(function( $rt, i ) {
        if ( !$rb[ i ] )  return
        var ret = createZhuyinRu( $rb[ i ], $rt )

        try {
          $rb[ i ].parentNode.replaceChild( ret, $rb[ i ] )
        } catch ( e ) {}
        return ret
      })

    // Remove the container once it's useless
    $.remove( $rtc )
    $cloned.setAttribute( 'rightangle', 'true' )
  }( $cloned.querySelector( 'rtc.zhuyin' ))

  // Then, normal annotations other than Zhuyin
  $
  .qsa( 'rtc:not(.zhuyin)', $cloned )
  .forEach(function( $rtc, order ) {
    var ret
    ret = $
      .tag( 'rt', $rtc )
      .map(function( $rt, i ) {
        var rbspan = Number( $rt.getAttribute( 'rbspan' ) || 1 )
        var span = 0
        var aRb = []
        var $rb, ret

        if ( rbspan > maxspan )  rbspan = maxspan

        do {
          try {
            $rb = $ru.shift()
            aRb.push( $rb )
          } catch (e) {}

          if ( typeof $rb === 'undefined' )  break
          span += Number( $rb.getAttribute( 'span' ) || 1 )
        } while ( rbspan > span )

        if ( rbspan < span ) {
          if ( aRb.length > 1 ) {
            console.error( 'An impossible `rbspan` value detected.', ruby )
            return
          }
          aRb  = $.tag( 'rb', aRb[0] )
          $ru  = aRb.slice( rbspan ).concat( $ru )
          aRb  = aRb.slice( 0, rbspan )
          span = rbspan
        }

        ret = createNormalRu( aRb, $rt, {
          'class': clazz,
          span: span,
          order: order
        })

        try {
          aRb[0].parentNode.replaceChild( ret, aRb.shift() )
          aRb.map( $.remove )
        } catch (e) {}
        return ret
      })
    $ru = ret
    if ( order === 1 )  $cloned.setAttribute( 'doubleline', 'true' )

    // Remove the container once it's useless
    $.remove( $rtc )
  })
  return createCustomRuby( frag )
}

// Create a new fake `<h-ruby>` element so the
// style sheets will render it as a polyfill,
// which also helps to avoid the UA style.
function createCustomRuby( frag ) {
  var $ruby = frag.firstChild
  var hruby = $.create( 'h-ruby' )

  hruby.innerHTML = $ruby.innerHTML
  $.setAttr( hruby, $ruby.attributes )
  hruby.normalize()
  return hruby
}

function simplifyRubyClass( elem ) {
  if ( !elem instanceof Element )  return elem
  var clazz = elem.classList

  if      ( clazz.contains( 'pinyin' ))        clazz.add( 'romanization' )
  else if ( clazz.contains( 'romanization' ))  clazz.add( 'annotation' )
  else if ( clazz.contains( 'mps' ))           clazz.add( 'zhuyin' )
  else if ( clazz.contains( 'rightangle' ))    clazz.add( 'complex' )
  return elem
}

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
 * Create and return a new `<h-ru>` element
 * in Zhuyin form
 */
function createZhuyinRu( $rb, $rt ) {
  var $rb = $.clone( $rb )

  // Create an element to return
  var $ru = $.create( 'h-ru' )
  $ru.setAttribute( 'zhuyin', true )

  // - <h-ru zhuyin>
  // -   <rb><rb/>
  // -   <h-zhuyin>
  // -     <h-yin></h-yin>
  // -     <h-diao></h-diao>
  // -   </h-zhuyin>
  // - </h-ru>
  $ru.appendChild( $rb )
  $ru.innerHTML += getZhuyinHTML( $rt )
  return $ru
}

/**
 * Create a Zhuyin-form HTML string
 */
function getZhuyinHTML( rt ) {
  // #### Explanation ####
  // * `zhuyin`: the entire phonetic annotation
  // * `yin`:    the plain pronunciation (w/out tone)
  // * `diao`:   the tone
  // * `len`:    the length of the plain pronunciation (`yin`)
  var zhuyin = typeof rt === 'string' ? rt : rt.textContent
  var yin, diao, len

  yin  = zhuyin.replace( TYPESET.zhuyin.diao, '' )
  len  = yin ? yin.length : 0
  diao = zhuyin
    .replace( yin, '' )
    .replace( /[\u02C5]/g, '\u02C7' )
    .replace( /[\u030D]/g, '\u0358' )
  return len === 0 ? '' : '<h-zhuyin length="' + len + '" diao="' + diao + '"><h-yin>' + yin + '</h-yin><h-diao>' + diao + '</h-diao></h-zhuyin>'
}

/**
 * Normalize `ruby` elements
 */
$.extend( Locale, {

  // Address normalisation for both simple and complex
  // rubies (interlinear annotations)
  renderRuby: function( context, target ) {
    var target   = target || 'ruby'
    var $target  = $.qsa( target, context )

    $.qsa( 'rtc', context )
    .concat( $target ).map( simplifyRubyClass )

    $target
    .forEach(function( $ruby ) {
      var clazz = $ruby.classList
      var $new

      if      ( clazz.contains( 'complex' ))  $new = renderComplexRuby( $ruby )
      else if ( clazz.contains( 'zhuyin' ))   $new = SUPPORT_IC ? renderInterCharRuby( $ruby ) : renderSimpleRuby( $ruby )

      // Finally, replace it
      if ( $new )  $ruby.parentNode.replaceChild( $new, $ruby )
    })
  },

  simplifyRubyClass:   simplifyRubyClass,
  getZhuyinHTML:       getZhuyinHTML,
  renderComplexRuby:   renderComplexRuby,
  renderSimpleRuby:    renderSimpleRuby,
  renderInterCharRuby: renderInterCharRuby

  // ### TODO list ###
  //
  // * Debug mode
  // * Better error-tolerance
})
})
