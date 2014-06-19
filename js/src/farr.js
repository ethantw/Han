/**
 * Module: Farr (Find and Replace/wRap DOM text)
 * Based on findAndReplaceDOMText
 * github.com/padolsey/findAndReplaceDOMText
 */

define([
  './method',
  './regex/TYPESET',
  'findAndReplaceDOMText'
], function( $, TYPESET, findAndReplaceDOMText ) {
var
  Farr = function( selector, filter, method, pattern, subst ) {
    return new Farr.prototype.init( selector, filter, method, pattern, subst )
  }
;

Farr.prototype = {
  constructor: Farr,

  selector: '',

  // Store the findAndReplaceDOMText instance
  // for future action, i.e. revert
  finder: [],

  // Adapt jQuery-way to do everything
  init: function( selector, filter, method, pattern, subst ) {
    this.selector = selector

    if ( typeof filter === 'string' ) {
      this.filteredElemList = filter
    } else if ( typeof filter === 'function' ) {
      this.filterElem = filter
    }

    return typeof method === 'string' && this[ method ] ?
      this[ method ](pattern, subst) : this
  },

  // Define the default element list to be
  // filtered out
  filteredElemList: 'style script',

  // Define the default `filterElement` function
  filterElem: function( currentElem ) {
    var
      currentElem = currentElem.nodeName.toLowerCase(),
      aFilterList = this.filteredElemList.split(' '),

      // Return true by default unless it matches
      // the element on the list
      ret = true
    ;

    aFilterList
    .forEach(function( filter ) {
      if ( currentElem === filter ) {
        ret = false
        return
      }
    })
    return ret
  },

  replace: function( pattern, subst ) {
    var
      that = this
    ;
    this.finder.push( findAndReplaceDOMText(
      this.selector,
      {
        find: pattern,
        replace: subst,
        filterElements: function( currentElem ) {
          return that.filterElem( currentElem )
        }
      }
    ))
    return this
  },

  wrap: function( pattern, subst ) {
    var
      that = this
    ;
    that.finder.push( findAndReplaceDOMText(
      that.selector,
      {
        find: pattern,
        wrap: subst,
        filterElements: function( currentElem ) {
          return that.filterElem( currentElem )
        }
      }
    ))
    return this
  },

  // Now that we support chaining syntax, it
  // should be able to revert the finder by level
  unfarr: function( level ) {
    var
      len = this.finder.length,
      level = Number(level) || level == 0 ? Number(level) :
        level === 'all' ? len : 1
    ;

    if ( typeof len === 'undefined' || len == 0 ) {
      return this
    } else if ( level > this.finder.length ) {
      level = len
    }

    for (var i = parseInt( level ); i > 0; i--) {
      this.finder.pop().revert()
    }
    return this
  },

  // Force punctuation & biaodian
  // typesetting rules to be applied
  jinzify: function() {
    var
      origFilteredElemList = this.filteredElemList
    ;

    this.filteredElemList = 'style script jinze'

    this
    .replace(
      TYPESET.jinze.touwei,
      function( portion, match ) {
        var
          mat = match[0],
          text = document.createTextNode( mat ),
          elem = $.create( 'jinze', 'touwei' )
        ;

        elem.setAttribute( 'data-portion', portion.index ),
        elem.appendChild( text )

        return portion.index != 2 ? elem : 0
      }
    )
    .replace(
      TYPESET.jinze.wei,
      function( portion, match ) {
        var
          mat = match[0],
          text = document.createTextNode( mat ),
          elem = $.create( 'jinze', 'wei' )
        ;

        elem.setAttribute( 'data-portion', portion.index )
        elem.appendChild( text )

        return elem
      }
    )
    .replace(
      TYPESET.jinze.tou,
      function( portion, match ) {
        var
          mat = match[0],
          text = document.createTextNode( mat ),
          elem = $.create( 'jinze', 'tou' )
        ;

        elem.setAttribute( 'data-portion', portion.index )
        elem.appendChild( text )

        return elem
      }
    )
    .replace(
      TYPESET.jinze.middle,
      function( portion, match ) {
        var
          mat = match[0],
          text = document.createTextNode( mat ),
          elem = $.create( 'jinze', 'middle' )
        ;

        elem.setAttribute( 'data-portion', portion.index )
        elem.appendChild( text )

        return elem
      }
    )

    // document.querySelectorAll('[data-portion=1]')
    //// undone
    //// 位元素邊界的標點修正

    this.filteredElemList = origFilteredElemList
    return this
  },

  // Wrap characters by the preferred or
  // default options all in once
  charify: function( option ) {
    var
      option = $.extend( {
        hanzi:     'individual',
                    // individual || group || biaodian || none

        word:      'group',
                    // group || punctuation || none

        latin:     'group',
        ellinika:  'group',
        kirillica: 'group'
                    // group || individual || none
      }, option || {} )
    ;

    // CJK and biaodian
    if ( option.hanzi === 'group' ) {
      this.wrap(
        TYPESET.char.hanzi.group,
        $.create( 'char_group', 'hanzi cjk' )
      )
    }
    if ( option.hanzi === 'individual' ) {
      this.wrap(
        TYPESET.char.hanzi.individual,
        $.create( 'char', 'hanzi cjk' )
      )
    }
    if ( option.hanzi === 'individual' ||
         option.hanzi === 'biaodian'
    ) {
      this.replace(
        TYPESET.char.biaodian.all,
        function( portion, match ) {
          var
            mat = match[0],
            text = document.createTextNode( mat ),

            clazz = 'biaodian cjk ' + (
              mat.match( TYPESET.char.biaodian.open ) ? 'open' :
              mat.match( TYPESET.char.biaodian.end ) ? 'end' : ''
            ),

            elem = $.create( 'char', clazz ),
            unicode = mat.charCodeAt(0).toString(16)
          ;

          elem.setAttribute( 'data-unicode', unicode )
          elem.appendChild( text )

          return elem
        }
      )
    }

    // Western languages (word-level)
    if ( option.word !== 'none' ) {
      this.wrap(
        TYPESET.char.word,
        $.create( 'word' )
      )
    }

    // Western languages (alphabet-level)
    if ( option.latin !== 'none' ||
         option.ellinika !== 'none' ||
         option.kirillica !== 'none'
    ) {
      this.wrap(
        TYPESET.char.punct.all,
        $.create( 'char', 'punct' )
      )
    }
    if ( option.latin === 'individual' ) {
      this.wrap(
        TYPESET.char.alphabet.latin,
        $.create( 'char', 'alphabet latin' )
      )
    }
    if ( option.ellinika === 'individual' ) {
      this.wrap(
        TYPESET.char.alphabet.ellinika,
        $.create( 'char', 'alphabet ellinika greek' )
      )
    }
    if ( option.kirillica === 'individual' ) {
      this.wrap(
        TYPESET.char.alphabet.kirillica,
        $.create( 'char', 'alphabet kirillica cyrillic' )
      )
    }
    return this
  }
}

Farr.prototype.init.prototype = Farr.prototype
return Farr
})
