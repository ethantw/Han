define([
  './core',
  './method',
  './regex/unicode',
  './regex/typeset',
  './fibre'
], function( Han, $, UNICODE, TYPESET, Fibre ) {

var isNodeNormalizeNormal = (function() {
    //// Disabled `Node.normalize()` for temp due to
    //// issue below in IE11.
    //// See: http://stackoverflow.com/questions/22337498/why-does-ie11-handle-node-normalize-incorrectly-for-the-minus-symbol
    var div = $.create( 'div' )

    div.appendChild($.create( '', '0-' ))
    div.appendChild($.create( '', '2' ))
    div.normalize()

    return div.firstChild.length !== 2
})()

function getFunctionOrElement( callback ) {
  return (
    typeof callback === 'function' ||
    callback instanceof Element
  )
    ? callback
    : undefined
}

function createBdGroup( portion ) {
  var clazz = portion.index === 0 && portion.isEnd
    ? 'biaodian cjk'
    : 'biaodian cjk portion ' + (
      portion.index === 0
      ? 'is-first'
      : portion.isEnd
      ? 'is-end'
      : 'is-inner'
    )

    var $elmt = $.create( 'h-char-group', clazz )
    $elmt.innerHTML = portion.text
    return $elmt
}

function createBdChar( char ) {
  var div     = $.create( 'div' )
  var unicode = char.charCodeAt( 0 ).toString( 16 )
  var clazz   = 'biaodian cjk ' + (
    char.match( TYPESET.char.biaodian.open )
      ? 'bd-open'
      : char.match( TYPESET.char.biaodian.close )
      ? 'bd-close bd-end'
      : char.match( TYPESET.char.biaodian.end )
      ? 'bd-end'
      : char.match(new RegExp( UNICODE.biaodian.liga ))
      ? 'bd-liga'
      : char.match(new RegExp( UNICODE.biaodian.middle ))
      ? 'bd-middle'
      : ''
  )
  div.innerHTML = (
    '<h-char unicode="' + unicode +
    '" class="' + clazz +
    '">' + char + '</h-char>'
  )
  return div.firstChild
}

$.extend( Fibre.fn, {
  normalize: function() {
    if ( isNodeNormalizeNormal ) {
      this.context.normalize()
    }
    return this
  },

  // Force punctuation & biaodian typesetting rules to be applied.
  jinzify: function( selector ) {
    return (
    this
    .filter( selector || null )
    .avoid( 'h-jinze' )
    .replace(
      TYPESET.jinze.touwei,
      function( portion, match ) {
        var elem = $.create( 'h-jinze', 'touwei' )
        elem.innerHTML = match[0]
        return (( portion.index === 0 && portion.isEnd ) || portion.index === 1 ) ? elem : ''
      }
    )
    .replace(
      TYPESET.jinze.wei,
      function( portion, match ) {
        var elem = $.create( 'h-jinze', 'wei' )
        elem.innerHTML = match[0]
        return portion.index === 0 ? elem : ''
      }
    )
    .replace(
      TYPESET.jinze.tou,
      function( portion, match ) {
        var elem = $.create( 'h-jinze', 'tou' )
        elem.innerHTML = match[0]
        return (( portion.index === 0 && portion.isEnd ) || portion.index === 1 )
          ? elem : ''
      }
    )
    .replace(
      TYPESET.jinze.middle,
      function( portion, match ) {
        var elem = $.create( 'h-jinze', 'middle' )
        elem.innerHTML = match[0]
        return (( portion.index === 0 && portion.isEnd ) || portion.index === 1 )
          ? elem : ''
      }
    )
    .endAvoid()
    .endFilter()
    )
  },

  groupify: function( option ) {
    var option = $.extend({
      biaodian: false,
    //punct: false,
      hanzi: false,   // Includes Kana
      kana: false,
      eonmun: false,
      western: false  // Includes Latin, Greek and Cyrillic
    }, option || {})

    this.avoid( 'h-word, h-char-group' )

    if ( option.biaodian ) {
      this.replace(
        TYPESET.group.biaodian[0], createBdGroup
      ).replace(
        TYPESET.group.biaodian[1], createBdGroup
      )
    }

    if ( option.hanzi || option.cjk ) {
      this.wrap(
        TYPESET.group.hanzi, $.clone($.create( 'h-char-group', 'hanzi cjk' ))
      )
    }
    if ( option.western ) {
      this.wrap(
        TYPESET.group.western, $.clone($.create( 'h-word', 'western' ))
      )
    }
    if ( option.kana ) {
      this.wrap(
        TYPESET.group.kana, $.clone($.create( 'h-char-group', 'kana' ))
      )
    }
    if ( option.eonmun || option.hangul ) {
      this.wrap(
        TYPESET.group.eonmun, $.clone($.create( 'h-word', 'eonmun hangul' ))
      )
    }

    this.endAvoid()
    return this
  },

  charify: function( option ) {
    var option = $.extend({
      avoid: true,
      biaodian: false,
      punct: false,
      hanzi: false,     // Includes Kana
      latin: false,
      ellinika: false,
      kirillica: false,
      kana: false,
      eonmun: false
    }, option || {})

    if ( option.avoid ) {
      this.avoid( 'h-char' )
    }

    if ( option.biaodian ) {
      this.replace(
        TYPESET.char.biaodian.all,
        getFunctionOrElement( option.biaodian )
          ||
        function( _, match ) {  return createBdChar( match[0] )  }
      ).replace(
        TYPESET.char.biaodian.liga,
        getFunctionOrElement( option.biaodian )
          ||
        function( _, match ) {  return createBdChar( match[0] )  }
      )
    }
    if ( option.hanzi || option.cjk ) {
      this.wrap(
        TYPESET.char.hanzi,
        getFunctionOrElement( option.hanzi || option.cjk )
          ||
        $.clone($.create( 'h-char', 'hanzi cjk' ))
      )
    }
    if ( option.punct ) {
      this.wrap(
        TYPESET.char.punct.all,
        getFunctionOrElement( option.punct )
          ||
        $.clone($.create( 'h-char', 'punct' ))
      )
    }
    if ( option.latin ) {
      this.wrap(
        TYPESET.char.latin,
        getFunctionOrElement( option.latin )
          ||
        $.clone($.create( 'h-char', 'alphabet latin' ))
      )
    }
    if ( option.ellinika || option.greek ) {
      this.wrap(
        TYPESET.char.ellinika,
        getFunctionOrElement( option.ellinika || option.greek )
          ||
        $.clone($.create( 'h-char', 'alphabet ellinika greek' ))
      )
    }
    if ( option.kirillica || option.cyrillic ) {
      this.wrap(
        TYPESET.char.kirillica,
        getFunctionOrElement( option.kirillica || option.cyrillic )
          ||
        $.clone($.create( 'h-char', 'alphabet kirillica cyrillic' ))
      )
    }
    if ( option.kana ) {
      this.wrap(
        TYPESET.char.kana,
        getFunctionOrElement( option.kana )
          ||
        $.clone($.create( 'h-char', 'kana' ))
      )
    }
    if ( option.eonmun || option.hangul ) {
      this.wrap(
        TYPESET.char.eonmun,
        getFunctionOrElement( option.eonmum || option.hangul )
          ||
        $.clone($.create( 'h-char', 'eonmun hangul' ))
      )
    }

    this.endAvoid()
    return this
  }
})

$.extend( Han, {
  isNodeNormalizeNormal: isNodeNormalizeNormal,
  find: Fibre,
  createBdGroup: createBdGroup,
  createBdChar: createBdChar
})

$.matches = Han.find.matches

void [
  'setMode',
  'wrap', 'replace', 'revert',
  'addBoundary', 'removeBoundary',
  'avoid', 'endAvoid',
  'filter', 'endFilter',
  'jinzify', 'groupify', 'charify'
].forEach(function( method ) {
  Han.fn[ method ] = function() {
    if ( !this.finder ) {
      // Share the same selector
      this.finder = Han.find( this.context )
    }

    this.finder[ method ]( arguments[ 0 ], arguments[ 1 ] )
    return this
  }
})

return Han
})
