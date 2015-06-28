define([
  './core',
  './method',
  './regex/unicode',
  './regex/typeset',
  './fibre'
], function( Han, $, UNICODE, TYPESET, Fibre ) {

function createBdGroup( portion, match ) {
  var elem = $.create( 'h-char-group', 'biaodian cjk' )

  if ( portion.index === 0 && portion.isEnd ) {
    elem.innerHTML = match[0]
  } else {
    elem.innerHTML = portion.text
    elem.classList.add( 'portion' ) 

    if ( portion.index === 0 ) {
      elem.classList.add( 'isFirst' ) 
    } else if ( portion.isEnd ) {
      elem.classList.add( 'isEnd' ) 
    }
  }
  return elem
}

function createBdChar( char ) {
  var div = $.create( 'div' )
  var unicode = char.charCodeAt( 0 ).toString( 16 )
  var clazz = 'biaodian cjk ' + ( char.match( TYPESET.char.biaodian.open ) ? 'open' :
    char.match( TYPESET.char.biaodian.close ) ? 'close end' :
    char.match( TYPESET.char.biaodian.end ) ? 'end' : 
    char.match( new RegExp( '(' + UNICODE.biaodian.liga + ')' )) ? 'liga' : '' )

  div.innerHTML = '<h-char unicode="' + unicode + '" class="' + clazz + '">' + char + '</h-char>'
  return div.firstChild
}

$.extend( Fibre.fn, {
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

    this.avoid( 'h-hangable, h-char-group, h-word' )

    if ( option.biaodian ) {
      this.replace(
        TYPESET.group.biaodian[ 0 ], createBdGroup
      ).replace(
        TYPESET.group.biaodian[ 1 ], createBdGroup
      )
    }
    if ( option.hanzi || option.cjk ) {
      this.wrap(
        TYPESET.group.hanzi, $.clone( $.create( 'h-char-group', 'hanzi cjk' ))
      )
    }
    if ( option.western ) {
      this.wrap(
        TYPESET.group.western, $.clone( $.create( 'h-word', 'western' ))
      )
    }
    if ( option.kana ) {
      this.wrap(
        TYPESET.group.kana, $.clone( $.create( 'h-char-group', 'kana' ))
      )
    }
    if ( option.eonmun || option.hangul ) {
      this.wrap(
        TYPESET.group.eonmun, $.clone( $.create( 'h-word', 'eonmun hangul' ))
      )
    }

    this.endAvoid()
    return this
  },

  charify: function( option ) {
    var option = $.extend({
      biaodian: false,
      punct: false,
      hanzi: false,     // Includes Kana
      latin: false,
      ellinika: false,
      kirillica: false,
      kana: false,
      eonmun: false
    }, option || {})

    this.avoid( 'h-char' )

    if ( option.biaodian ) {
      this.replace(
        TYPESET.char.biaodian.all,
        function( portion, match ) {  return createBdChar( match[0] )  }
      ).replace(
        TYPESET.char.biaodian.liga,
        function( portion, match ) {  return createBdChar( match[0] )  }
      )
    }
    if ( option.hanzi || option.cjk ) {
      this.wrap(
        TYPESET.char.hanzi, $.clone( $.create( 'h-char', 'hanzi cjk' ))
      )
    }
    if ( option.punct ) {
      this.wrap(
        TYPESET.char.punct.all, $.clone( $.create( 'h-char', 'punct' ))
      )
    }
    if ( option.latin ) {
      this.wrap(
        TYPESET.char.latin, $.clone( $.create( 'h-char', 'alphabet latin' ))
      )
    }
    if ( option.ellinika || option.greek ) {
      this.wrap(
        TYPESET.char.ellinika, $.clone( $.create( 'h-char', 'alphabet ellinika greek' ))
      )
    }
    if ( option.kirillica || option.cyrillic ) {
      this.wrap(
        TYPESET.char.kirillica, $.clone( $.create( 'h-char', 'alphabet kirillica cyrillic' ))
      )
    }
    if ( option.kana ) {
      this.wrap(
        TYPESET.char.kana, $.clone( $.create( 'h-char', 'kana' ))
      )
    }
    if ( option.eonmun || option.hangul ) {
      this.wrap(
        TYPESET.char.eonmun, $.clone( $.create( 'h-char', 'eonmun hangul' ))
      )
    }

    this.endAvoid()
    return this
  }
})

Han.find = Fibre

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
