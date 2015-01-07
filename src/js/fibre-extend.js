define([
  './method',
  './regex/unicode',
  './regex/typeset',
  'fibre'
], function( $, UNICODE, TYPESET, Fibre ) {

$.extend( Fibre.fn, {
  // Force punctuation & biaodian typesetting rules to be applied.
  jinzify: function() {
    var origFilterOutSelector= this.filterOutSelector

    this.filterOutSelector += ', jinze'

    this
    .replace(
      TYPESET.jinze.touwei,
      function( portion, match ) {
        var mat = match[0]
        var text = $.create( '', mat )
        var elem = $.create( 'jinze', 'touwei' )

        elem.appendChild( text )
        return (
          ( portion.index === 0 && portion.isEnd ) || portion.index === 1
        ) ? elem : ''
      }
    )
    .replace(
      TYPESET.jinze.wei,
      function( portion, match ) {
        var mat = match[0]
        var text = $.create( '', mat )
        var elem = $.create( 'jinze', 'wei' )

        elem.appendChild( text )
        return portion.index === 0 ? elem : ''
      }
    )
    .replace(
      TYPESET.jinze.tou,
      function( portion, match ) {
        var mat = match[0]
        var text = $.create( '', mat )
        var elem = $.create( 'jinze', 'tou' )

        elem.appendChild( text )
        return (
          ( portion.index === 0 && portion.isEnd ) ||
          portion.index === 1
        ) ? elem : ''
      }
    )
    .replace(
      TYPESET.jinze.middle,
      function( portion, match ) {
        var mat = match[0]
        var text = $.create( '', mat )
        var elem = $.create( 'jinze', 'middle' )

        elem.appendChild( text )
        return (( portion.index === 0 && portion.isEnd ) || portion.index === 1 )
          ? elem : ''
      }
    )

    this.filterOutSelector = origFilterOutSelector
    return this
  },

  groupify: function() {
    this
    .wrap(
      TYPESET.char.biaodian.group[ 0 ],
      $.clone( $.create( 'char_group', 'biaodian cjk' ))
    )
    .wrap(
      TYPESET.char.biaodian.group[ 1 ],
      $.clone( $.create( 'char_group', 'biaodian cjk' ))
    )
    return this
  },

  // Implementation of character-level selector
  // (字元級選擇器)
  charify: function( option ) {
    var option = $.extend({
      hanzi:     'individual',
                  // individual || group || biaodian || none
      liga:      'liga',
                 // liga || none
      word:      'group',
                  // group || punctuation || none

      latin:     'group',
      ellinika:  'group',
      kirillica: 'group',
      kana:      'none',
      eonmun:    'none'
                  // group || individual || none
    }, option || {})

    // CJK and biaodian
    if ( option.hanzi === 'group' ) {
      this.wrap( TYPESET.char.hanzi.group, $.clone( $.create( 'char_group', 'hanzi cjk' )))
    }
    if ( option.hanzi === 'individual' ) {
      this.wrap( TYPESET.char.hanzi.individual, $.clone( $.create( 'char', 'hanzi cjk' )))
    }

    if ( option.hanzi === 'individual' ||
         option.hanzi === 'biaodian' ||
         option.liga  === 'liga'
    ) {
      if ( option.hanzi !== 'none' ) {
        this.replace(
          TYPESET.char.biaodian.all,
          function( portion, match ) {
            var mat = match[0]
            var text = $.create( '', mat )
            var  clazz = 'biaodian cjk ' + (
                  mat.match( TYPESET.char.biaodian.open ) ? 'open' :
                    mat.match( TYPESET.char.biaodian.close ) ? 'close end' :
                      mat.match( TYPESET.char.biaodian.end ) ? 'end' : ''
                )
            var elem = $.create( 'char', clazz )
            var unicode = mat.charCodeAt( 0 ).toString( 16 )

            elem.setAttribute( 'unicode', unicode )
            elem.appendChild( text )
            return elem
          }
        )
      }

      this.replace(
        option.liga === 'liga' ? TYPESET.char.biaodian.liga :
          new RegExp( '(' + UNICODE.biaodian.liga + ')', 'g' ),
        function( portion, match ) {
          var mat = match[0]
          var text = $.create( '', mat )
          var elem = $.create( 'char', 'biaodian liga cjk' )
          var unicode = mat.charCodeAt( 0 ).toString( 16 )

          elem.setAttribute( 'unicode', unicode )
          elem.appendChild( text )
          return elem
        }
      )
    }

    // Western languages (word-level)
    if ( option.word !== 'none' ) {
      this.wrap( TYPESET.char.word, $.clone( $.create( 'word' )))
    }

    // Western languages (alphabet-level)
    if ( option.latin !== 'none' ||
         option.ellinika !== 'none' ||
         option.kirillica !== 'none'
    ) {
      this.wrap( TYPESET.char.punct.all, $.clone( $.create( 'char', 'punct' )))
    }
    if ( option.latin === 'individual' ) {
      this.wrap( TYPESET.char.alphabet.latin, $.clone( $.create( 'char', 'alphabet latin' )))
    }
    if ( option.ellinika === 'individual' ) {
      this.wrap( TYPESET.char.alphabet.ellinika, $.clone( $.create( 'char', 'alphabet ellinika greek' )))
    }
    if ( option.kirillica === 'individual' ) {
      this.wrap( TYPESET.char.alphabet.kirillica, $.clone( $.create( 'char', 'alphabet kirillica cyrillic' )))
    }
    return this
  }
})

return Fibre
})
