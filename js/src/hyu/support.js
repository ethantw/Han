/**
 * Tests for HTML5/CSS3 features
 */

define([
  '../var/root',
  '../var/body',
  '../method'
], function( root, body, $ ) {
var
  PREFIX = 'Webkit Moz ms'.split(' '),

  support = {},

  // Create an element for feature detecting
  // (in `testCSSProp`)
  elem = $.create('_')
;

function testCSSProp( prop ) {
  var
    ucProp = prop.charAt(0).toUpperCase() + prop.slice(1),
    allProp = (prop + ' ' + PREFIX.join(ucProp + ' ') + ucProp).split(' '),
    ret
  ;

  allProp.forEach(function( prop ) {
    if ( typeof elem.style[prop] === 'string' ) {
      ret = true
    }
  })

  return ret
}

function injectElementWithStyle( rule, callback ) {
  var
    fakeBody = body || $.create('body'),
    div = $.create('div'),
    style, ret, node, docOverflow
  ;

  style = ['<style>', rule, '</style>'].join('')

  ;(body ? div : fakeBody).innerHTML += style
  fakeBody.appendChild(div)

  if ( !body ) {
    fakeBody.style.background = ''
    fakeBody.style.overflow = 'hidden'
    docOverflow = root.style.overflow

    root.style.overflow = 'hidden'
    root.appendChild(fakeBody)
  }

  // Callback
  ret = callback( div, rule )

  // Remove the injected scope
  if ( !body ) {
    fakeBody.parentNode.removeChild(fakeBody)
    root.style.overflow = docOverflow
  } else {
    div.parentNode.removeChild(div)
  }

  return !!ret
}

function getStyle( elem, prop ) {
  var
    ret
  ;

  if ( window.getComputedStyle ) {
    ret = document.defaultView.getComputedStyle(elem, null).getPropertyValue( prop )
  } else if ( elem.currentStyle ) {
    // for IE
    ret = elem.currentStyle[prop]
  }

  return ret
}

support = {
  ruby: (function() {
    var
      ruby = $.create('ruby'),
      rt = $.create('rt'),
      rp = $.create('rp')
    ;

    if ( typeof rubies !== 'undefined' ) {
      return rubies
    }

    ruby.appendChild( rp )
    ruby.appendChild( rt )
    root.appendChild( ruby )

    // Browsers that support ruby hide the `<rp>` via `display: none`
    rubies = ( getStyle(rp, 'display') == 'none' ||
      // but in IE, `<rp>` has `display: inline`
      // so, the test needs other conditions:
      getStyle(ruby, 'display') == 'ruby'
      && getStyle(rt, 'display') == 'ruby-text' ) ?
      true : false


    // Remove and clean from memory
    root.removeChild( ruby )
    ruby = null
    rt = null
    rp = null

    return rubies
  })(),

  fontface: (function() {
    var
      ret
    ;

    injectElementWithStyle(
      '@font-face {font-family: font; src: url("https://")}',
      function( node, rule ) {
        var
          style = node.getElementsByTagName('style')[0],
          sheet = style.sheet || style.styleSheet,
          cssText = sheet ? (sheet.cssRules && sheet.cssRules[0] ? sheet.cssRules[0].cssText : sheet.cssText || '') : ''
        ;

        ret = /src/i.test(cssText) && cssText.indexOf(rule.split(' ')[0]) === 0
      }
    )

    return ret
  })(),

  columnwidth: (function() {
    return testCSSProp('columnWidth')
  })(),

  textemphasis: (function() {
    return testCSSProp('textEmphasis')
  })(),

  writingmode: (function() {
    return testCSSProp('writingMode')
  })()
}

return support
})
