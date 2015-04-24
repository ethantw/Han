define([
  './core',
  './method',
  './regex/unicode',
  './regex/typeset',
  './fibre'
], function( Han, $, UNICODE, TYPESET, Fibre ) {

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
  jinzify: function() {
    var origFilterOutSelector = this.filterOutSelector
    this.filterOutSelector += ', h-jinze'

    this
    .replace(
      TYPESET.jinze.touwei,
      function( portion, match ) {
        var elem = $.create( 'h-jinze', 'touwei' )
        elem.innerHTML = match[0]
        return (( portion.index === 0 && portion.isEnd ) || portion.index === 1 )
          ? elem : ''
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

    this.filterOutSelector = origFilterOutSelector
    return this
  },

  groupify: function( option ) {
    var origFilterOutSelector = this.filterOutSelector
    var option = $.extend({
      biaodian: false,
    //punct: false,
      hanzi: false,   // Includes Kana
      kana: false,
      eonmun: false,
      western: false  // Includes Latin, Greek and Cyrillic
    }, option || {})

    this.filterOutSelector += ', h-hangable, h-char-group'

    if ( option.biaodian ) {
      this.wrap(
        TYPESET.group.biaodian[ 0 ], $.clone( $.create( 'h-char-group', 'biaodian cjk' ))
      ).wrap(
        TYPESET.group.biaodian[ 1 ], $.clone( $.create( 'h-char-group', 'biaodian cjk' ))
      )
    }
    if ( option.hanzi ) {
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
    if ( option.eonmun ) {
      this.wrap(
        TYPESET.group.eonmun, $.clone( $.create( 'h-word', 'eonmun hangul' ))
      )
    }

    this.filterOutSelector = origFilterOutSelector
    return this
  },

  // Implementation of character-level selector
  // (字元級選擇器)
  charify: function( option ) {
    var origFilterOutSelector = this.filterOutSelector
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

    this.filterOutSelector += ', h-char'

    if ( option.biaodian ) {
      this.replace(
        TYPESET.char.biaodian.all,
        function( portion, match ) {  return createBdChar( match[0] )  }
      ).replace(
        TYPESET.char.biaodian.liga,
        function( portion, match ) {  return createBdChar( match[0] )  }
      )
    }
    if ( option.hanzi ) {
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
    if ( option.ellinika ) {
      this.wrap(
        TYPESET.char.ellinika, $.clone( $.create( 'h-char', 'alphabet ellinika greek' ))
      )
    }
    if ( option.kirillica ) {
      this.wrap(
        TYPESET.char.kirillica, $.clone( $.create( 'h-char', 'alphabet kirillica cyrillic' ))
      )
    }
    if ( option.kana ) {
      this.wrap(
        TYPESET.char.kana, $.clone( $.create( 'h-char', 'kana' ))
      )
    }
    if ( option.eonmun ) {
      this.wrap(
        TYPESET.char.eonmun, $.clone( $.create( 'h-char', 'eonmun hangul' ))
      )
    }

    this.filterOutSelector = origFilterOutSelector
    return this
  }
})

Han.find = Fibre

void [
  'replace',
  'wrap',
  'revert',
  'jinzify',
  'groupify',
  'charify'
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
