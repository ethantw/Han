define([
  '../method',
  '../var/root',
  '../var/body',
  './core',
  './detect-font'
], function( $, root, body, Locale ) {

Locale.support = (function() {

  var PREFIX = 'Webkit Moz ms'.split(' ')

  // Create an element for feature detecting
  // (in `testCSSProp`)
  var elem = $.create( '_' )
  var exposed = {}

  function testCSSProp( prop ) {
    var ucProp = prop.charAt(0).toUpperCase() + prop.slice(1)
    var allProp = ( prop + ' ' + PREFIX.join( ucProp + ' ' ) + ucProp ).split(' ')
    var ret

    allProp.forEach(function( prop ) {
      if ( typeof elem.style[ prop ] === 'string' ) {
        ret = true
      }
    })
    return ret || false
  }

  function injectElementWithStyle( rule, callback ) {
    var fakeBody = body || $.create( 'body' )
    var div = $.create( 'div' )
    var container = body ? div : fakeBody
    var  callback = typeof callback === 'function' ? callback : function() {}
    var style, ret, docOverflow

    style = [ '<style>', rule, '</style>' ].join('')

    container.innerHTML += style
    fakeBody.appendChild( div )

    if ( !body ) {
      fakeBody.style.background = ''
      fakeBody.style.overflow = 'hidden'
      docOverflow = root.style.overflow

      root.style.overflow = 'hidden'
      root.appendChild( fakeBody )
    }

    // Callback
    ret = callback( container, rule )

    // Remove the injected scope
    $.remove( container )
    if ( !body ) {
      root.style.overflow = docOverflow
    }
    return !!ret
  }

  function getStyle( elem, prop ) {
    var ret

    if ( window.getComputedStyle ) {
      ret = document.defaultView.getComputedStyle( elem, null ).getPropertyValue( prop )
    } else if ( elem.currentStyle ) {
      // for IE
      ret = elem.currentStyle[ prop ]
    }
    return ret
  }

  return {
    ruby: (function() {
      var ruby = $.create( 'ruby' )
      var rt = $.create( 'rt' )
      var rp = $.create( 'rp' )
      var ret

      ruby.appendChild( rp )
      ruby.appendChild( rt )
      root.appendChild( ruby )

      // Browsers that support ruby hide the `<rp>` via `display: none`
      ret = (
        getStyle( rp, 'display' ) === 'none' ||
        // but in IE, `<rp>` has `display: inline`
        // so, the test needs other conditions:
        getStyle( ruby, 'display' ) === 'ruby' &&
        getStyle( rt, 'display' ) === 'ruby-text'
      ) ? true : false

      // Remove and clean from memory
      root.removeChild( ruby )
      ruby = null
      rt = null
      rp = null

      return ret
    })(),

    fontface: (function() {
      var ret

      injectElementWithStyle(
        '@font-face { font-family: font; src: url("//"); }',
        function( node, rule ) {
          var style = $.qsa( 'style', node )[0]
          var sheet = style.sheet || style.styleSheet
          var cssText = sheet ?
            ( sheet.cssRules && sheet.cssRules[0] ?
              sheet.cssRules[0].cssText : sheet.cssText || ''
            ) : ''

          ret = /src/i.test( cssText ) &&
            cssText.indexOf( rule.split(' ')[0] ) === 0
        }
      )

      return ret
    })(),

    // Address feature support test for `unicode-range` via
    // detecting whether it's Arial (supported) or
    // Times New Roman (not supported).
    unicoderange: (function() {
      var ret

      injectElementWithStyle(
        '@font-face{font-family:test-for-unicode-range;src:local(Arial),local("Droid Sans")}@font-face{font-family:test-for-unicode-range;src:local("Times New Roman"),local(Times),local("Droid Serif");unicode-range:U+270C}',
        function() {
          ret = !Locale.detectFont(
            'test-for-unicode-range', // treatment group
            'Arial, "Droid Sans"',    // control group
            'Q'                       // ASCII characters only
          )
        }
      )
      return ret
    })(),

    columnwidth: testCSSProp( 'columnWidth' ),

    textemphasis: testCSSProp( 'textEmphasis' ),

    writingmode: testCSSProp( 'writingMode' )
  }
})()

return Locale
})
