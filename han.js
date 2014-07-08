/*!
 * 漢字標準格式 v3.0.0 | MIT License | css.hanzi.co
 * Han: CSS typography framework optimised for Hanzi
 */

;(function( global, factory ) {

  // AMD
  if ( typeof define === 'function' && define.amd ) {
    define( 'Han', [], function() {
      return factory
    })
  // CommonJS
  } else if ( typeof module === 'object' && typeof module.exports === 'object' ) {
    module.exports = factory( global, true )
  } else {
    factory( global )
  }

})( this, function( window, noGlobalNS ) {

  

var root = document.documentElement

var body = document.body



  var
    VERSION = '3.0.0-alpha1',

    // Define Han
    Han = function( context, condition ) {
      return new Han.fn.init( context, condition )
    }
  ;

  Han.fn = Han.prototype = {
    version: VERSION,

    constructor: Han,

    // Default target context
    context: body,

    // Root element as the default condition
    condition: root,

    // Default routine for rendering
    routine: [
      // Initialise the condition with feature-detecting
      // classes (Modernizr-alike) on root elements,
      // possibly `<html>`.
      'initCond',
      // Address element normalisation
      'renderElem',
      // Address Hanzi and Western script mixed spacing
      'renderHWS',
      'renderBasicBd'
    ],

    init: function( context, condition ) {
      if ( context ) {
        this.context = context
      }
      if ( condition ) {
        this.condition = condition
      }
      return this
    },

    setOption: function( option ) {
      return this
    },

    renderByRoutine: function() {
      var
        routine = this.routine
      ;
      for ( var i = 0, len = routine.length; i < len; i++ ) {
        try {
          this[ routine[ i ]]()
        } catch (e) {}
      }
      return this
    }
  }

  Han.fn.init.prototype = Han.fn


var
  UNICODE = {
    /**
     * Western punctuation (西文標點符號)
     */
    punct: {
      base:   '[\u2026,.;:!?\u203D_]',
      sing:   '[\u2010-\u2014\u2026]',
      middle: '[\\\/~\\-&\u2010-\u2014]',
      open:   '[\'"‘“\\(\\[\u00A1\u00BF\u2E18\u00AB\u2039\u201A\u201C\u201E]',
      close:  '[\'"”’\\)\\]\u00BB\u203A\u201B\u201D\u201F]',
      end:    '[\'"”’\\)\\]\u00BB\u203A\u201B\u201D\u201F,.;:!?\u203D_]',
    },

    /**
     * CJK biaodian (CJK標點符號)
     */
    biaodian: {
      base:   '[︰．、，。：；？！ー]',
      liga:   '[—…⋯]',
      middle: '[·・＼／－]',
      open:   '[「『《〈（〔［｛【〖]',
      close:  '[」』》〉）〕］｝】〗]',
      end:    '[」』》〉）〕］｝】〗︰．、，。：；？！ー]'
    },

    /**
     * Latin script blocks (拉丁字母區段)
     *
     * 1. 基本拉丁字母：A-Za-z
          Basic Latin
     * 2. 阿拉伯數字：0-9
          Digits
     * 3. 補充-1：[\u00C0-\u00FF]
          Latin-1 supplement
     * 4. 擴展-A區：[\u0100-\u017F]
          Extended-A
     * 5. 擴展-B區：[\u0180-\u024F]
          Extended-B
     * 6. 附加區：[\u1E00-\u1EFF]
          Extended additional
     * 7. 拉丁字母變音組字符：[\u0300-\u0341]
          Combining diacritical marks
     */
    latin: {
      base:    '[A-Za-z0-9\u00C0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]',
      combine: '[\u0300-\u0341]'
    },

    /**
     * Elli̱niká (Greek) script blocks (希臘字母區段)
     *
     * 1. 希臘字母及擴展：[\u0370–\u03FF\u1F00-\u1FFF]
          Basic Greek & Greek Extended
     * 2. 阿拉伯數字：0-9
          Digits
     * 3. 希臘字母變音組字符：[\u0300-\u0341][\u0342-\u0345]
          Combining diacritical marks
     */
    ellinika: {
      base:    '[0-9\u0370-\u03FF\u1F00-\u1FFF]',
      combine: '[\u0300-\u0345]'
    },

    /**
     * Kirillica (Cyrillic) script blocks (西里爾字母區段)
     *
     * 1. 西里爾字母及補充：[\u0400-\u0482\u048A-\u04FF\u0500-\u052F]
          Basic Cyrillic and supplement
     * 2. 擴展B區：[\uA640-\uA66E\uA67E-\uA697]
          Extended-B
     * 3. 阿拉伯數字：0-9
          Digits
     * 4. 西里爾字母組字符：[\u0483-\u0489\u2DE0-\u2DFF\uA66F-\uA67D\uA69F]（位擴展A、B區）
          Cyrillic combining diacritical marks (in extended-A, B)
     */
    kirillica: {
      base:    '[0-9\u0400-\u0482\u048A-\u04FF\u0500-\u052F\uA640-\uA66E\uA67E-\uA697]',
      combine: '[\u0483-\u0489\u2DE0-\u2DFF\uA66F-\uA67D\uA69F]'
    },

    /**
     * CJK-related blocks (CJK相關字符區段)
     *
     *  1. 中日韓統一表意文字：[\u4E00-\u9FFF]
           Basic CJK unified ideographs
     *  2. 擴展-A區：[\u3400-\u4DB5]
           Extended-A
     *  3. 擴展-B區：[\u20000-\u2A6D6]（[\uD840-\uD869][\uDC00-\uDED6]）
           Extended-B
     *  4. 擴展-C區：[\u2A700-\u2B734]（\uD86D[\uDC00-\uDF3F]|[\uD86A-\uD86C][\uDC00-\uDFFF]|\uD869[\uDF00-\uDFFF]）
           Extended-C
     *  5. 擴展-D區：[\u2B740-\u2B81D]（急用漢字，\uD86D[\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1F]）
           Extended-D
     *  6. 擴展-E區：[\u2B820-\u2F7FF]（**註**：暫未支援）
           Extended-E (**note:** not supported yet)
     *  7. 擴展-F區（**註**：暫未支援）
           Extended-F (**note:** not supported yet)
     *  8. 筆畫區：[\u31C0-\u31E3]
           Strokes
     *  9. 表意數字「〇」：[\u3007]
           Ideographic number zero

     * 10. 相容表意文字：
           Compatibility ideograph
           http://zh.wikipedia.org/wiki/中日韓越統一表意文字#cite_note-1

           [\uF900-\uFAFF]（**註**：不使用）
           [\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]（**註**：12個例外）

     * 11. 康熙字典及簡化字部首：[\u2F00-\u2FD5\u2E80-\u2EF3]
           Kangxi and supplement radicals
     * 12. 表意文字描述字元：[\u2FF0-\u2FFA]
           Ideographic description characters
     */
    hanzi: {
      base:    '[\u4E00-\u9FFF\u3400-\u4DB5\u31C0-\u31E3\u3007\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\uD840-\uD868][\uDC00-\uDFFF]|\uD869[\uDC00-\uDEDF]|\uD86D[\uDC00-\uDF3F]|[\uD86A-\uD86C][\uDC00-\uDFFF]|\uD869[\uDF00-\uDFFF]|\uD86D[\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1F]',
      desc:    '[\u2FF0-\u2FFA]',
      radical: '[\u2F00-\u2FD5\u2E80-\u2EF3]'
    },

    /**
     * Kana
     *
     * 1. 日文假名：[\u30A2\u30A4\u30A6\u30A8\u30AA-\u30FA\u3042\u3044\u3046\u3048\u304A-\u3094\u309F\u30FF]
          Japanese Kana
     * 2. 日文假名小寫：[\u3041\u3043\u3045\u3047\u3049\u30A1\u30A3\u30A5\u30A7\u30A9\u3063\u3083\u3085\u3087\u308E\u3095\u3096\u30C3\u30E3\u30E5\u30E7\u30EE\u30F5\u30F6\u31F0-\u31FF]
          Japanese small Kana
     * 3. 假名組字符：[\u3099-\u309C]
          Kana combining characters
     * 4. 符號：[\u309D\u309E\u30FB-\u30FE]
          Marks
     */
    kana: {
      base:    '[\u30A2\u30A4\u30A6\u30A8\u30AA-\u30FA\u3042\u3044\u3046\u3048\u304A-\u3094\u309F\u30FF]',
      combine: '[\u3099-\u309C]',
      small:   '[\u3041\u3043\u3045\u3047\u3049\u30A1\u30A3\u30A5\u30A7\u30A9\u3063\u3083\u3085\u3087\u308E\u3095\u3096\u30C3\u30E3\u30E5\u30E7\u30EE\u30F5\u30F6\u31F0-\u31FF]',
      mark:    '[\u30A0\u309D\u309E\u30FB-\u30FE]'
    },

    /**
     * Zhuyin (注音符號, Mandarin & Dialect Phonetic Symbols)
     *
     * 1. 國語注音、方言音符號：[\u3105-\u312D][\u31A0-\u31BA]
          Bopomofo phonetic symbols
     * 2. 陰陽上去聲調號：[\u02D9\u02CA\u02C5\u02C7\u02CB] （**註：**三聲包含乙個不合規範的符號）
          Tones for Mandarin
     * 3. 方言音聲調號：[\u02EA\u02EB]
          Tones for other dialects
     * 4. 陰、陽入韻：[\u31B4-\u31B7][\u0358\u030d]?
          Checked tones
     */
    zhuyin: {
      base:    '[\u3105-\u312D\u31A0-\u31BA]',
      initial: '[\u3105-\u3119\u312A-\u312C\u31A0-\u31A3]',
      medial:  '[\u3127-\u3129]',
      final:   '[\u311A-\u3126\u312D\u31A4-\u31B3\u31B8-\u31BA]',
      tone:    '[\u02D9\u02CA\u02C5\u02C7\u02CB\u02EA\u02EB]',
      ruyun:   '[\u31B4-\u31B7][\u0358\u030d]?'
    }
  }
;


  var
    // Whitespace characters
    // http://www.w3.org/TR/css3-selectors/#whitespace
    rWhite = '[\\x20\\t\\r\\n\\f]',

    rPtOpen = UNICODE.punct.open,
    rPtClose = UNICODE.punct.close,
    rPtEnd = UNICODE.punct.end,
    rPtMid = UNICODE.punct.middle,
    rPt = rPtOpen + '|' + rPtEnd + '|' + rPtMid,

    rBdOpen = UNICODE.biaodian.open,
    rBdEnd = UNICODE.biaodian.end,
    rBdMid = UNICODE.biaodian.middle,
    rBdLiga = UNICODE.biaodian.liga + '{2}',
    rBd = rBdOpen + '|' + rBdEnd + '|' + rBdMid,

    rKana = UNICODE.kana.base + UNICODE.kana.combine + '?',
    rKanaS = UNICODE.kana.small + UNICODE.kana.combine + '?',
    rHan = UNICODE.hanzi.base + '|' + UNICODE.hanzi.desc + '|' + UNICODE.hanzi.radical + '|' + rKana,

    rCbn = UNICODE.ellinika.combine,
    rLatn = UNICODE.latin.base + rCbn + '*',
    rGk = UNICODE.ellinika.base + rCbn + '*',

    rCyCbn = UNICODE.kirillica.combine,
    rCy = UNICODE.kirillica.base + rCyCbn + '*',

    rAlph = rLatn + '|' + rGk + '|' + rCy,
    rChar = rHan + '|(' + rAlph + ')+',

    TYPESET = {
      /* Character-level selector (字級選擇器)
       */
      char: {
        biaodian: {
          all:   new RegExp( '(' + rBd + ')', 'g' ),
          open:  new RegExp( '(' + rBdOpen + ')', 'g' ),
          end:   new RegExp( '(' + rBdEnd + ')', 'g' ),
          liga:  new RegExp( '(' + rBdLiga + ')', 'g' )
        },

        hanzi: {
          individual: new RegExp( '(' + rHan + ')', 'g' ),
          kana:       new RegExp( '(' + rKana + ')', 'g' ),
          smallkana:  new RegExp( '(' + rKanaS + ')', 'g' ),
          group:      new RegExp( '(' + rHan + ')+', 'g' )
        },

        punct: {
          all: new RegExp( '(' + rPt + ')', 'g' )
        },

        alphabet: {
          latin:     new RegExp( rLatn, 'ig' ),
          ellinika:  new RegExp( rGk, 'ig' ),
          kirillica: new RegExp( rCy, 'ig' )
        },

        word: new RegExp( '(' + rLatn + '|' + rGk + '|' + rCy + '|' + rPt + ')+', 'ig' )
      },

      /* Punctuation Rules (禁則)
       */
      jinze: {
        touwei:   new RegExp( '(' + rBdOpen + '+)(' + rChar + ')(' + rBdEnd + '+)', 'ig' ),
        tou:      new RegExp( '(' + rBdOpen + '+)(' + rChar + ')', 'ig' ),
        wei:      new RegExp( '(' + rChar + ')(' + rBdEnd + '+)', 'ig' ),
        middle:   new RegExp( '(' + rChar + ')(' + rBdMid + ')(' + rChar + ')', 'ig' )
      },

      /* Hanzi and Western mixed spacing (漢字西文混排間隙)
       * - Basic mode
       * - Strict mode
       */
      hws: {
        base: [
          new RegExp( '('+ rHan +')(' + rAlph + '|' + rPtOpen + ')', 'ig' ),
          new RegExp( '('+ rAlph+ '|' + rPtEnd +')(' + rHan + ')', 'ig' )
        ],

        strict: [
          new RegExp( '('+ rHan +')' + rWhite + '?(' + rAlph + '|' + rPtOpen + ')', 'ig' ),
          new RegExp( '('+ rAlph+ '|' + rPtEnd +')' + rWhite + '?(' + rHan + ')', 'ig' )
        ]
      }
    }
  ;


var
  $ = {
    // Simplified query selector
    //
    // - $.id
    // - $.tag
    // - $.qsa
    id: function( selector, context ) {
      return ( context || document ).getElementById( selector )
    },

    tag: function( selector, context ) {
      return this.makeArray(
        ( context || document ).getElementsByTagName( selector )
      )
    },

    qsa: function( selector, context ) {
      return this.makeArray(
        ( context || document ).querySelectorAll( selector )
      )
    },

    // Create a new document fragment or element with/without
    // classes
    create: function( elem, clazz ) {
      var
        elem = '!' === elem ?
          document.createDocumentFragment() :
          document.createElement( elem )
      ;

      try {
        if ( clazz ) {
          elem.className = clazz
        }
      } catch ( e ) {}

      return elem
    },

    // Clone a node (text, element or fragment) deeply or
    // childlessly
    clone: function( node, deep ) {
      return node.cloneNode( deep || true )
    },

    // Remove a node (text, element or fragment)
    remove: function( node ) {
      return node.parentNode.removeChild( node )
    },

    // Set attributes all in once with object
    setAttr: function( target, attr ) {
      var
        len = attr.length
      ;

      if ( typeof attr !== 'object' ) {
        return
      }

      // Native NamedNodeMap
      if (
        typeof attr[0] === 'object' &&
        'name' in attr[0]
      ) {
        for ( var i = 0; i < len; i++ ) {
          if ( attr[ i ].value !== undefined ) {
            target.setAttribute( attr[ i ].name, attr[ i ].value )
          }
        }

      // Plain object
      } else {
        for ( var name in attr ) {
          if (
            attr.hasOwnProperty( name ) &&
            attr[ name ] !== undefined
          ) {
            target.setAttribute( name, attr[ name ] )
          }
        }
      }
      return target
    },

    // Convert array-like objects into real arrays
    // for the native prototype methods
    makeArray: function( obj ) {
      return Array.prototype.slice.call( obj )
    },

    // Extend target's method with objects
    extend: function( target, object ) {
      var
        bTarget = typeof target === 'object' || typeof target === 'function'
      ;

      if ( !bTarget || typeof object !== 'object' ) {
        return
      }

      for ( var name in object ) {
        if ( object.hasOwnProperty( name )) {
          target[ name ] = object[ name ]
        }
      }
      return target
    }
  }
;
var findAndReplaceDOMText =
/**
 * findAndReplaceDOMText v 0.4.2
 * @author James Padolsey http://james.padolsey.com
 * @license http://unlicense.org/UNLICENSE
 *
 * Matches the text of a DOM node against a regular expression
 * and replaces each match (or node-separated portions of the match)
 * in the specified element.
 */
(function() {

	var PORTION_MODE_RETAIN = 'retain';
	var PORTION_MODE_FIRST = 'first';

	var doc = document;
	var toString = {}.toString;

	function isArray(a) {
		return toString.call(a) == '[object Array]';
	}

	function escapeRegExp(s) {
		return String(s).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
	}

	function exposed() {
		// Try deprecated arg signature first:
		return deprecated.apply(null, arguments) || findAndReplaceDOMText.apply(null, arguments);
	}

	function deprecated(regex, node, replacement, captureGroup, elFilter) {
		if ((node && !node.nodeType) && arguments.length <= 2) {
			return false;
		}
		var isReplacementFunction = typeof replacement == 'function';

		if (isReplacementFunction) {
			replacement = (function(original) {
				return function(portion, match) {
					return original(portion.text, match.startIndex);
				};
			}(replacement));
		}

		// Awkward support for deprecated argument signature (<0.4.0)
		var instance = findAndReplaceDOMText(node, {

			find: regex,

			wrap: isReplacementFunction ? null : replacement,
			replace: isReplacementFunction ? replacement : '$' + (captureGroup || '&'),

			prepMatch: function(m, mi) {

				// Support captureGroup (a deprecated feature)

				if (!m[0]) throw 'findAndReplaceDOMText cannot handle zero-length matches';

				if (captureGroup > 0) {
					var cg = m[captureGroup];
					m.index += m[0].indexOf(cg);
					m[0] = cg;
				}

				m.endIndex = m.index + m[0].length;
				m.startIndex = m.index;
				m.index = mi;

				return m;
			},
			filterElements: elFilter
		});

		exposed.revert = function() {
			return instance.revert();
		};

		return true;
	}

	/**
	 * findAndReplaceDOMText
	 *
	 * Locates matches and replaces with replacementNode
	 *
	 * @param {Node} node Element or Text node to search within
	 * @param {RegExp} options.find The regular expression to match
	 * @param {String|Element} [options.wrap] A NodeName, or a Node to clone
	 * @param {String|Function} [options.replace='$&'] What to replace each match with
	 * @param {Function} [options.filterElements] A Function to be called to check whether to
	 *	process an element. (returning true = process element,
	 *	returning false = avoid element)
	 */
	function findAndReplaceDOMText(node, options) {
		return new Finder(node, options);
	}

	exposed.Finder = Finder;

	/**
	 * Finder -- encapsulates logic to find and replace.
	 */
	function Finder(node, options) {

		options.portionMode = options.portionMode || PORTION_MODE_RETAIN;

		this.node = node;
		this.options = options;

		// ENable match-preparation method to be passed as option:
		this.prepMatch = options.prepMatch || this.prepMatch;

		this.reverts = [];

		this.matches = this.search();

		if (this.matches.length) {
			this.processMatches();
		}

	}

	Finder.prototype = {

		/**
		 * Searches for all matches that comply with the instance's 'match' option
		 */
		search: function() {

			var match;
			var matchIndex = 0;
			var regex = this.options.find;
			var text = this.getAggregateText();
			var matches = [];

			regex = typeof regex === 'string' ? RegExp(escapeRegExp(regex), 'g') : regex;

			if (regex.global) {
				while (match = regex.exec(text)) {
					matches.push(this.prepMatch(match, matchIndex++));
				}
			} else {
				if (match = text.match(regex)) {
					matches.push(this.prepMatch(match, 0));
				}
			}

			return matches;

		},

		/**
		 * Prepares a single match with useful meta info:
		 */
		prepMatch: function(match, matchIndex) {

			if (!match[0]) {
				throw new Error('findAndReplaceDOMText cannot handle zero-length matches');
			}

			match.endIndex = match.index + match[0].length;
			match.startIndex = match.index;
			match.index = matchIndex;

			return match;
		},

		/**
		 * Gets aggregate text within subject node
		 */
		getAggregateText: function() {

			var elementFilter = this.options.filterElements;

			return getText(this.node);

			/**
			 * Gets aggregate text of a node without resorting
			 * to broken innerText/textContent
			 */
			function getText(node) {

				if (node.nodeType === 3) {
					return node.data;
				}

				if (elementFilter && !elementFilter(node)) {
					return '';
				}

				var txt = '';

				if (node = node.firstChild) do {
					txt += getText(node);
				} while (node = node.nextSibling);

				return txt;

			}

		},

		/**
		 * Steps through the target node, looking for matches, and
		 * calling replaceFn when a match is found.
		 */
		processMatches: function() {

			var matches = this.matches;
			var node = this.node;
			var elementFilter = this.options.filterElements;

			var startPortion,
				endPortion,
				innerPortions = [],
				curNode = node,
				match = matches.shift(),
				atIndex = 0, // i.e. nodeAtIndex
				matchIndex = 0,
				portionIndex = 0,
				doAvoidNode,
				nodeStack = [node];

			out: while (true) {

				if (curNode.nodeType === 3) {

					if (!endPortion && curNode.length + atIndex >= match.endIndex) {

						// We've found the ending
						endPortion = {
							node: curNode,
							index: portionIndex++,
							text: curNode.data.substring(match.startIndex - atIndex, match.endIndex - atIndex),
							indexInMatch: atIndex - match.startIndex,
							indexInNode: match.startIndex - atIndex, // always zero for end-portions
							endIndexInNode: match.endIndex - atIndex,
							isEnd: true
						};

					} else if (startPortion) {
						// Intersecting node
						innerPortions.push({
							node: curNode,
							index: portionIndex++,
							text: curNode.data,
							indexInMatch: atIndex - match.startIndex,
							indexInNode: 0 // always zero for inner-portions
						});
					}

					if (!startPortion && curNode.length + atIndex > match.startIndex) {
						// We've found the match start
						startPortion = {
							node: curNode,
							index: portionIndex++,
							indexInMatch: 0,
							indexInNode: match.startIndex - atIndex,
							endIndexInNode: match.endIndex - atIndex,
							text: curNode.data.substring(match.startIndex - atIndex, match.endIndex - atIndex)
						};
					}

					atIndex += curNode.data.length;

				}

				doAvoidNode = curNode.nodeType === 1 && elementFilter && !elementFilter(curNode);

				if (startPortion && endPortion) {

					curNode = this.replaceMatch(match, startPortion, innerPortions, endPortion);

					// processMatches has to return the node that replaced the endNode
					// and then we step back so we can continue from the end of the
					// match:

					atIndex -= (endPortion.node.data.length - endPortion.endIndexInNode);

					startPortion = null;
					endPortion = null;
					innerPortions = [];
					match = matches.shift();
					portionIndex = 0;
					matchIndex++;

					if (!match) {
						break; // no more matches
					}

				} else if (
					!doAvoidNode &&
					(curNode.firstChild || curNode.nextSibling)
				) {
					// Move down or forward:
					if (curNode.firstChild) {
						nodeStack.push(curNode);
						curNode = curNode.firstChild;
					} else {
						curNode = curNode.nextSibling;
					}
					continue;
				}

				// Move forward or up:
				while (true) {
					if (curNode.nextSibling) {
						curNode = curNode.nextSibling;
						break;
					}
					curNode = nodeStack.pop();
					if (curNode === node) {
						break out;
					}
				}

			}

		},

		/**
		 * Reverts ... TODO
		 */
		revert: function() {
			// Reversion occurs backwards so as to avoid nodes subsequently
			// replaced during the matching phase (a forward process):
			for (var l = this.reverts.length; l--;) {
				this.reverts[l]();
			}
			this.reverts = [];
		},

		prepareReplacementString: function(string, portion, match, matchIndex) {
			var portionMode = this.options.portionMode;
			if (
				portionMode === PORTION_MODE_FIRST &&
				portion.indexInMatch > 0
			) {
				return '';
			}
			string = string.replace(/\$(\d+|&|`|')/g, function($0, t) {
				var replacement;
				switch(t) {
					case '&':
						replacement = match[0];
						break;
					case '`':
						replacement = match.input.substring(0, match.startIndex);
						break;
					case '\'':
						replacement = match.input.substring(match.endIndex);
						break;
					default:
						replacement = match[+t];
				}
				return replacement;
			});

			if (portionMode === PORTION_MODE_FIRST) {
				return string;
			}

			if (portion.isEnd) {
				return string.substring(portion.indexInMatch);
			}

			return string.substring(portion.indexInMatch, portion.indexInMatch + portion.text.length);
		},

		getPortionReplacementNode: function(portion, match, matchIndex) {

			var replacement = this.options.replace || '$&';
			var wrapper = this.options.wrap;

			if (wrapper && wrapper.nodeType) {
				// Wrapper has been provided as a stencil-node for us to clone:
				var clone = doc.createElement('div');
				clone.innerHTML = wrapper.outerHTML || new XMLSerializer().serializeToString(wrapper);
				wrapper = clone.firstChild;
			}

			if (typeof replacement == 'function') {
				replacement = replacement(portion, match, matchIndex);
				if (replacement && replacement.nodeType) {
					return replacement;
				}
				return doc.createTextNode(String(replacement));
			}

			var el = typeof wrapper == 'string' ? doc.createElement(wrapper) : wrapper;

			replacement = doc.createTextNode(
				this.prepareReplacementString(
					replacement, portion, match, matchIndex
				)
			);

			if (!replacement.data) {
				return replacement;
			}

			if (!el) {
				return replacement;
			}

			el.appendChild(replacement);

			return el;
		},

		replaceMatch: function(match, startPortion, innerPortions, endPortion) {

			var matchStartNode = startPortion.node;
			var matchEndNode = endPortion.node;

			var preceedingTextNode;
			var followingTextNode;

			if (matchStartNode === matchEndNode) {

				var node = matchStartNode;

				if (startPortion.indexInNode > 0) {
					// Add `before` text node (before the match)
					preceedingTextNode = doc.createTextNode(node.data.substring(0, startPortion.indexInNode));
					node.parentNode.insertBefore(preceedingTextNode, node);
				}

				// Create the replacement node:
				var newNode = this.getPortionReplacementNode(
					endPortion,
					match
				);

				node.parentNode.insertBefore(newNode, node);

				if (endPortion.endIndexInNode < node.length) { // ?????
					// Add `after` text node (after the match)
					followingTextNode = doc.createTextNode(node.data.substring(endPortion.endIndexInNode));
					node.parentNode.insertBefore(followingTextNode, node);
				}

				node.parentNode.removeChild(node);

				this.reverts.push(function() {
					if (preceedingTextNode === newNode.previousSibling) {
						preceedingTextNode.parentNode.removeChild(preceedingTextNode);
					}
					if (followingTextNode === newNode.nextSibling) {
						followingTextNode.parentNode.removeChild(followingTextNode);
					}
					newNode.parentNode.replaceChild(node, newNode);
				});

				return newNode;

			} else {
				// Replace matchStartNode -> [innerMatchNodes...] -> matchEndNode (in that order)


				preceedingTextNode = doc.createTextNode(
					matchStartNode.data.substring(0, startPortion.indexInNode)
				);

				followingTextNode = doc.createTextNode(
					matchEndNode.data.substring(endPortion.endIndexInNode)
				);

				var firstNode = this.getPortionReplacementNode(
					startPortion,
					match
				);

				var innerNodes = [];

				for (var i = 0, l = innerPortions.length; i < l; ++i) {
					var portion = innerPortions[i];
					var innerNode = this.getPortionReplacementNode(
						portion,
						match
					);
					portion.node.parentNode.replaceChild(innerNode, portion.node);
					this.reverts.push((function(portion, innerNode) {
						return function() {
							innerNode.parentNode.replaceChild(portion.node, innerNode);
						};
					}(portion, innerNode)));
					innerNodes.push(innerNode);
				}

				var lastNode = this.getPortionReplacementNode(
					endPortion,
					match
				);

				matchStartNode.parentNode.insertBefore(preceedingTextNode, matchStartNode);
				matchStartNode.parentNode.insertBefore(firstNode, matchStartNode);
				matchStartNode.parentNode.removeChild(matchStartNode);

				matchEndNode.parentNode.insertBefore(lastNode, matchEndNode);
				matchEndNode.parentNode.insertBefore(followingTextNode, matchEndNode);
				matchEndNode.parentNode.removeChild(matchEndNode);

				this.reverts.push(function() {
					preceedingTextNode.parentNode.removeChild(preceedingTextNode);
					firstNode.parentNode.replaceChild(matchStartNode, firstNode);
					followingTextNode.parentNode.removeChild(followingTextNode);
					lastNode.parentNode.replaceChild(matchEndNode, lastNode);
				});

				return lastNode;
			}
		}

	};

return exposed;

}());

/**
 * Module: Farr (Find and Replace/wRap DOM text)
 * Based on findAndReplaceDOMText:
 * github.com/padolsey/findAndReplaceDOMText
 */



  var
    Farr = function( selector, filter, method, pattern, subst ) {
      return new Farr.prototype.init( selector, filter, method, pattern, subst )
    }
  ;

  Farr.prototype = {
    constructor: Farr,

    selector: '',

    // Store the findAndReplaceDOMText instance
    // for future action, i.e. revert.
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
    // filtered out.
    filteredElemList: 'style script',

    // Define the default `filterElement` function
    filterElem: function( currentElem ) {
      var
        currentElem = currentElem.nodeName.toLowerCase(),
        aFilterList = this.filteredElemList.split(' '),

        // Return true by default unless it matches
        // the element on the list.
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

    // Now that we support chaining syntax, it should
    // be able to revert the finder by level.
    revert: function( level ) {
      var
        len = this.finder.length,
        level = Number(level) || level === 0 ? Number(level) :
          level === 'all' ? len : 1
      ;

      if ( typeof len === 'undefined' || len === 0 ) {
        return this
      } else if ( level > this.finder.length ) {
        level = len
      }

      for (var i = parseInt( level ); i > 0; i--) {
        this.finder.pop().revert()
      }
      return this
    },

    // Force punctuation & biaodian typesetting rules
    // to be applied.
    jinzify: function() {
      var
        origFilteredElemList = this.filteredElemList
      ;
      this.filteredElemList += ' jinze'

      this
      .replace(
        TYPESET.jinze.touwei,
        function( portion, match ) {
          var
            mat = match[0],
            text = document.createTextNode( mat ),
            elem = $.create( 'jinze', 'touwei' )
          ;
          elem.appendChild( text )
          return (
            ( portion.index === 0 && portion.isEnd ) ||
            portion.index === 1
          ) ? elem : ''
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
          elem.appendChild( text )
          return portion.index === 0 ? elem : ''
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
          var
            mat = match[0],
            text = document.createTextNode( mat ),
            elem = $.create( 'jinze', 'middle' )
          ;
          elem.appendChild( text )
          return (
            ( portion.index === 0 && portion.isEnd ) ||
            portion.index === 1
          ) ? elem : ''
        }
      )

      this.filteredElemList = origFilteredElemList
      return this
    },

    // Implementation of character-level selector
    // (字元級選擇器)
    charify: function( option ) {
      var
        option = $.extend( {
          hanzi:     'individual',
                      // individual || group || biaodian || none
          liga:      'liga',
                     // liga || none
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
          $.clone( $.create( 'char_group', 'hanzi cjk' ))
        )
      }
      if ( option.hanzi === 'individual' ) {
        this.wrap(
          TYPESET.char.hanzi.individual,
          $.clone( $.create( 'char', 'hanzi cjk' ))
        )
      }
      if ( option.hanzi === 'individual' ||
           option.hanzi === 'biaodian' ||
           option.liga === 'liga'
      ) {

        if ( option.hanzi !== 'none' ) {
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
                unicode = mat.charCodeAt( 0 ).toString( 16 )
              ;

              elem.setAttribute( 'unicode', unicode )
              elem.appendChild( text )

              return elem
            }
          )
        }

        this.replace(
          option.liga === 'liga' ?
            TYPESET.char.biaodian.liga :
            new RegExp( '(' + UNICODE.biaodian.liga + ')', 'g' ),
          function( portion, match ) {
            var
              mat = match[0],
              text = document.createTextNode( mat ),

              elem = $.create( 'char', 'biaodian liga cjk' ),
              unicode = mat.charCodeAt( 0 ).toString( 16 )
            ;

            elem.setAttribute( 'unicode', unicode )
            elem.appendChild( text )

            return elem
          }
        )
      }

      // Western languages (word-level)
      if ( option.word !== 'none' ) {
        this.wrap(
          TYPESET.char.word,
          $.clone( $.create( 'word' ))
        )
      }

      // Western languages (alphabet-level)
      if ( option.latin !== 'none' ||
           option.ellinika !== 'none' ||
           option.kirillica !== 'none'
      ) {
        this.wrap(
          TYPESET.char.punct.all,
          $.clone( $.create( 'char', 'punct' ))
        )
      }
      if ( option.latin === 'individual' ) {
        this.wrap(
          TYPESET.char.alphabet.latin,
          $.clone( $.create( 'char', 'alphabet latin' ))
        )
      }
      if ( option.ellinika === 'individual' ) {
        this.wrap(
          TYPESET.char.alphabet.ellinika,
          $.clone( $.create( 'char', 'alphabet ellinika greek' ))
        )
      }
      if ( option.kirillica === 'individual' ) {
        this.wrap(
          TYPESET.char.alphabet.kirillica,
          $.clone( $.create( 'char', 'alphabet kirillica cyrillic' ))
        )
      }
      return this
    }
  }

  Farr.prototype.init.prototype = Farr.prototype


  var
    Hyu = {}
  ;


  function writeOnCanvas( text, font ) {
    var
      canvas = $.create( 'canvas' ),
      context
    ;

    canvas.width = '50'
    canvas.height = '20'
    canvas.style.display = 'none'

    body.appendChild( canvas )

    context = canvas.getContext('2d')
    context.textBaseline = 'top'
    context.font = '15px ' + font + ', sans-serif'
    context.fillStyle = 'black'
    context.strokeStyle = 'black'
    context.fillText( text, 0, 0 )

    return [ canvas, context ]
  }

  function detectFont( treat, control, text ) {
    var
      treat = treat,
      control = control,
      text = text || '辭Q',
      ret
    ;

    try {
      control = writeOnCanvas( text, control || 'sans-serif' )
      treat = writeOnCanvas( text, treat )

      for ( var j = 1; j <= 20; j++ ) {
        for ( var i = 1; i <= 50; i++ ) {
          if (
            ret !== 'undefined' &&
            treat[1].getImageData(i, j, 1, 1).data[3] !==
              control[1].getImageData(i, j, 1, 1).data[3]
          ) {
            ret = true
            break
          } else if ( ret ) {
            break
          }

          if ( i === 50 && j === 20 && !ret ) {
            ret = false
          }
        }
      }

      // Remove and clean from memory
      control[0].parentNode.removeChild( control[0] )
      treat[0].parentNode.removeChild( treat[0] )
      control = null
      treat = null

      return ret
    } catch ( err ) {
      return false
    }
  }


  var
    PREFIX = 'Webkit Moz ms'.split(' '),

    support = {},

    // Create an element for feature detecting
    // (in `testCSSProp`)
    elem = $.create( '_' )
  ;

  function testCSSProp( prop ) {
    var
      ucProp = prop.charAt(0).toUpperCase() + prop.slice(1),
      allProp = ( prop + ' ' + PREFIX.join( ucProp + ' ' ) + ucProp ).split(' '),
      ret
    ;
    allProp.forEach(function( prop ) {
      if ( typeof elem.style[ prop ] === 'string' ) {
        ret = true
      }
    })
    return ret || false
  }

  function injectElementWithStyle( rule, callback ) {
    var
      fakeBody = body || $.create( 'body' ),
      div = $.create( 'div' ),

      container = body ? div : fakeBody,

      callback = typeof callback === 'function' ?
        callback : function() {},

      style, ret, docOverflow
    ;
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
    container.parentNode.removeChild( container )
    if ( !body ) {
      root.style.overflow = docOverflow
    }
    return !!ret
  }

  function getStyle( elem, prop ) {
    var
      ret
    ;
    if ( window.getComputedStyle ) {
      ret = document.defaultView.getComputedStyle( elem, null ).getPropertyValue( prop )
    } else if ( elem.currentStyle ) {
      // for IE
      ret = elem.currentStyle[ prop ]
    }
    return ret
  }

  support = {
    ruby: (function() {
      var
        ruby = $.create( 'ruby' ),
        rt = $.create( 'rt' ),
        rp = $.create( 'rp' ),
        ret
      ;
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
      var
        ret
      ;
      injectElementWithStyle(
        '@font-face { font-family: font; src: url("http://"); }',
        function( node, rule ) {
          var
            style = $.qsa( 'style', node )[0],
            sheet = style.sheet || style.styleSheet,
            cssText = sheet ?
              ( sheet.cssRules && sheet.cssRules[0] ?
                sheet.cssRules[0].cssText : sheet.cssText || ''
              ) : ''
          ;
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
      var
        ret
      ;
      injectElementWithStyle(
        '@font-face{font-family:test-for-unicode-range;src:local(Arial),local("Droid Sans")}@font-face{font-family:test-for-unicode-range;src:local("Times New Roman"),local(Times),local("Droid Serif");unicode-range:U+270C}',
        function() {
          ret = !detectFont(
            'test-for-unicode-range', // treatment group
            'Arial, "Droid Sans"',    // control group
            'Q'                       // ASCII characters only
          )
        }
      )
      return ret
    })(),

    columnwidth: (function() {
      return testCSSProp( 'columnWidth' )
    })(),

    textemphasis: (function() {
      return testCSSProp( 'textEmphasis' )
    })(),

    writingmode: (function() {
      return testCSSProp( 'writingMode' )
    })()
  }


  var
    S = UNICODE.zhuyin.initial,
    J = UNICODE.zhuyin.medial,
    Y = UNICODE.zhuyin.final,
    D = UNICODE.zhuyin.tone + '|' + UNICODE.zhuyin.ruyun,

    rZyForm = new RegExp( '^(' + S + ')?' + '(' + J + ')?' + '(' + Y + ')?' + '(' + D + ')?$' ),
    rDiao = new RegExp( '(' + D + ')', 'ig' )
  ;

  /**
   * Create and return a new `<rb>` element
   * according to the given contents
   */
  function createPlainRb( rb, rt ) {
    var
      rb = $.clone( rb ),
      rt = $.clone( rt ),

      $rb = $.create( 'rb' )
    ;

    $rb.appendChild( rb )
    $rb.appendChild( rt )

    $.setAttr( $rb, {
      'annotation': rt.textContent
    })
    return $rb
  }

  /**
   * Create and return a new `<rb>` element
   * in Zhuyin form
   */
  function createZhuyinRb( rb, rt ) {
    var
      rb = $.clone( rb ),

      // Create an element to return
      $rb   = $.create( 'rb' ),
      $rt   = $.create( 'zhuyin' ),
      $yin  = $.create( 'yin' ),
      $diao = $.create( 'diao' ),

      // #### Explanation ####
      // * `zhuyin`: the entire phonetic annotation
      // * `yin`:    the plain pronunciation (w/out tone)
      // * `diao`:   the tone
      // * `form`:   the combination of the pronunciation
      // * `len`:    the text length of `yin`
      zhuyin = rt.textContent,
      yin, diao, form, len
    ;

    yin  = zhuyin.replace( rDiao, '' )
    len  = yin ? yin.length : 0
    diao = zhuyin
           .replace( yin, '' )
           .replace( /[\u02C5]/g, '\u02C7' )
           .replace( /[\u030D]/g, '\u0358' )

    form = zhuyin.replace( rZyForm, function( s, j, y ) {
      return [
        s ? 'S' : null,
        j ? 'J' : null,
        y ? 'Y' : null
      ].join('')
    })

    // - <rb>
    // -   # ruby base text
    // -   <zhuyin>
    // -     <yin></yin>
    // -     <diao></diao>
    // -   </zhuyin>
    // - </rb>
    $diao.innerHTML = diao
    $yin.innerHTML = yin
    $rt.appendChild( $yin )
    $rt.appendChild( $diao )

    if ( rb.nodeName === 'RB' ) {
      $rb.innerHTML = rb.innerHTML
    } else {
      $rb.appendChild( rb )
    }

    $rb.appendChild( $rt )

    // Finally, set up the necessary attribute
    // and return the new `<rb>`
    $
    .setAttr( $rb, {
      zhuyin: '',
      diao: diao,
      length: len,
      form: form
    })
    return $rb
  }

  /**
   * Normalisation rendering mechanism
   */
  $.extend( Hyu, {

    // Render and normalise the given context by routine:
    //
    // > ruby > u, ins > s, del > em
    //
    renderElem: function( context ) {
      this.renderRuby( context )
      this.renderLine( context )
      this.renderLine( context, 's, del' )
      this.renderEm( context )
    },

    // Traverse target elements (those with text-decoration
    // -line) to see if we should address spacing in
    // between for semantic presentation.
    renderLine: function( context, target ) {
      var
        target = target || 'u, ins',
        $target = $.qsa( target, context ),
        rTarget = new RegExp( '^(' + target.replace(/\,\s?/g, '|') + ')$', 'ig' )
      ;

      $target
      .forEach(function( elem ) {
        var
          next
        ;

        // Ignore all `<wbr>` and comments in between
        do {
          next = ( next || elem ).nextSibling

          if ( !next ) {
            return
          }
        } while ( next.nodeName === 'WBR' || next.nodeType === 8 )

        if ( next.nodeName.match( rTarget )) {
          next.classList.add( 'adjacent' )
        }
      })
    },

    // Traverse target elements to render Hanzi emphasis marks
    // and skip that in punctuation
    renderEm: function( context, target ) {
      var
        qs = target ? 'qsa' : 'tag',
        target = target || 'em',
        $target = $[ qs ]( target, context )
      ;

      $target
      .forEach(function( elem ) {
        var
          $elem = Farr( elem )
        ;

        if ( !support.textemphasis ) {
          $elem.jinzify()
        }

        $elem
        .charify( support.textemphasis ? {
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
      var
        qs = target ? 'qsa' : 'tag',
        target = target || 'ruby',
        $target = $[ qs ]( target, context ),

        simpClaElem = target + ', rtc',
        $simpClaElem = $.qsa( simpClaElem, context )
      ;

      // First of all, simplify semantic classes
      $simpClaElem
      .forEach(function( elem ) {
        var
          clazz = elem.classList
        ;

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
        var
          clazz = ruby.classList,

          condition = (
            !support.ruby ||
            clazz.contains( 'zhuyin') ||
            clazz.contains( 'complex' ) ||
            clazz.contains( 'rightangle' )
          ),

          frag, $cloned, $rb, hruby
        ;

        if ( !condition ) {
          return
        }

        // Apply document fragment here to avoid
        // continuously pointless re-paint
        frag = $.create( '!' )
        frag.appendChild( $.clone( ruby ))
        $cloned = $.qsa( target, frag )[0]

        // 1. Simple ruby polyfill for, um, Firefox;
        // 2. Zhuyin polyfill for all.
        if (
          !support.ruby ||
          clazz.contains( 'zhuyin' )
        ) {

          $
          .tag( 'rt', $cloned )
          .forEach(function( rt ) {
            var
              $rb = $.create( '!' ),
              airb = [],
              irb
            ;

            // Consider the previous nodes the implied
            // ruby base
            do {
              irb = ( irb || rt ).previousSibling

              if ( !irb || irb.nodeName.match( /(rt|rb)/i ) ) {
                break
              }

              $rb.insertBefore(
                $.clone( irb ),
                $rb.firstChild
              )
              airb.push( irb )
            } while ( !irb.nodeName.match( /(rt|rb)/i ))

            // Create a real `<rb>` to append.
            $rb = clazz.contains( 'zhuyin' ) ?
              createZhuyinRb( $rb, rt ) :
              createPlainRb( $rb, rt )

            // Replace the ruby text with the new `<rb>`,
            // and remove the original implied ruby base(s)
            try {
              rt.parentNode.replaceChild( $rb, rt )

              airb
              .forEach(function( irb ) {
                $.remove( irb )
              })
            } catch (e) {}
          })
        }

        // 3. Complex ruby polyfill
        // - Double-lined annotation;
        // - Right-angled annotation.
        if (
          clazz.contains( 'complex' ) ||
          clazz.contains( 'rightangle' )
        ) {
          $rb = $.tag( 'rb', $cloned )

          // First of all, deal with Zhuyin containers
          // individually
          //
          // (We only support one single Zhuyin in
          // each complex ruby)
          !function( rtc ) {
            if ( !rtc ) {
              return
            }

            $
            .tag( 'rt', rtc )
            .forEach(function( rt, i ) {
              var
                $$rb = createZhuyinRb( $rb[ i ], rt )
              ;
              try {
                $rb[ i ].parentNode.replaceChild( $$rb, $rb[ i ] )
              } catch (e) {}
            })

            // Remove the container once it's useless
            $.remove( rtc )
            ruby.setAttribute( 'rightangle', '' )
          }( $cloned.querySelector( 'rtc.zhuyin' ))

          // Then, other normal annotations
          $
          .qsa( 'rtc:not(.zhuyin)', $cloned )
          .forEach(function( rtc, order ) {
            var
              clazz = rtc.classList,
              start, end
            ;

            // Initialise
            start = end = 0

            // Recache the ruby base
            $rb = $.qsa(
              order === 0 ? 'rb' : 'rb[span]',
              $cloned
            )

            $
            .tag( 'rt', rtc )
            .forEach(function( rt ) {
              var
                $$rb = $.create( '!' ),

                // #### Explanation ####
                // * `rbspan`: the `<rb>` span assigned in the HTML
                // * `span`:   the span number of the current `<rb>`
                rbspan = parseInt( rt.getAttribute( 'rbspan' )) || 1,
                span, _$rb
              ;

              start = end
              end += parseInt( rbspan )

              // Rearrange the effected `<rb>` array according
              // to (rb)span, while working on the second container.
              if ( order > 0 ) {
                for ( var i = end-1; i >= start; i-- ) {
                  if ( !$rb[ i ] ) {
                    continue
                  }

                  span = parseInt( $rb[ i ].getAttribute( 'span' )) || 1

                  if ( span > rbspan ) {
                    _$rb = $.tag( 'rb', $rb[ i ] )

                    for ( var j = 0, len = _$rb.length; j < len; j++ ) {
                      $rb.splice( i+j, 1, _$rb[ j ] )
                    }
                  }
                }
              }

              // Iterate from the last item, for we don't
              // want to mess up with the original indices.
              for ( var i = end-1; i >= start; i-- ) {
                if ( !$rb[ i ] ) {
                  continue
                }

                $$rb.insertBefore(
                  $.clone( $rb[ i ] ),
                  $$rb.firstChild
                )

                if ( rbspan > 1 && i !== start ) {
                  $.remove( $rb[ i ] )
                  continue
                }

                $$rb = createPlainRb( $$rb, rt )
                $.setAttr( $$rb, {
                  'class': clazz,
                  span: rbspan,
                  order: order
                })
                $rb[ i ].parentNode.replaceChild( $$rb, $rb[ i ] )
              }
            })

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


  function initCond( target ) {
    var
      target = target || root,
      ret = '',
      clazz
    ;

    target.classList.add( 'hyu-js-rendered' )

    for ( var feature in support ) {
      clazz = (support[ feature ] ? '' : 'no-') + feature

      target.classList.add( clazz )
      ret += clazz + ' '
    }
    return ret
  }


  $.extend( Hyu, {
    support: support,
    detectFont: detectFont,
    initCond: initCond
  })
/*!
 * Hyu
 * css.hanzi.co/hyu
 *
 * This module is a subset project of Han,
 * which aims to provide HTML5-ready and
 * Hanzi-optimised style normalisation.
 */


/*!
 * Mre
 * css.hanzi.co/mre
 *
 * This module is a subset project of Han,
 * which aims to address proper typefaces with
 * better readability.
 *
 * This module depends on Hyu for basic typeface
 * detecting.
 */



  var
    Mre = {}
  ;

  Mre.support = {
    // Assume that all devices support Heiti for we
    // use `sans-serif` to do the comparison.
    heiti: true,

    songti: (function() {
      return Hyu.detectFont( 'Han Songti' )
    })(),

    kaiti: (function() {
      return Hyu.detectFont( 'Han Kaiti' )
    })(),

    fangsong: (function() {
      return Hyu.detectFont( 'Han Fangsong' )
    })()
  }


  var
    HWS_AS_FIRST_CHILD_QUERY = '* > hws:first-child, * > wbr:first-child + hws, wbr:first-child + wbr + hws',

    //// Disabled `Node.normalize()` for temp due to
    //// the issue in IE11.
    //// See: http://stackoverflow.com/questions/22337498/why-does-ie11-handle-node-normalize-incorrectly-for-the-minus-symbol
    isNodeNormalizeNormal = (function() {
      var
        div = $.create('div')
      ;

      div.appendChild( document.createTextNode( '0-' ))
      div.appendChild( document.createTextNode( '2' ))
      div.normalize()

      return div.firstChild.length !== 2
    })()
  ;

  function renderHWS( context, strict ) {
    var
      context = context || document,
      mode = strict ? 'strict' : 'base',
      hws, farr
    ;

    hws = $.create( 'hws' )
    hws.innerHTML = ' '
    farr = Farr( context )
    farr.filteredElemList += ' textarea'

    farr
    .replace( TYPESET.hws[ mode ][0], '$1<hws/>$2' )
    .replace( TYPESET.hws[ mode ][1], '$1<hws/>$2' )

    // Deal with `' 字'` and `" 字"`
    .replace( /(['"]+)[<hws\/>|\s]*(.+?)[<hws\/>|\s]*(['"]+)/ig, '$1$2$3' )

    // Convert string `<hws/>` into real elements
    .replace( '<hws/>', function() {
      return $.clone( hws )
    })

    // Deal with situations like `漢<u>zi</u>`:
    // `漢<u><hws/>zi</u>` => `漢<hws/><u>zi</u>`
    $.qsa( HWS_AS_FIRST_CHILD_QUERY, context )
    .forEach(function( firstChild ) {
      var
        parent = firstChild.parentNode,
        target = parent.firstChild
      ;

      // Skip all `<wbr>` and comments
      while (
        target.nodeName === 'WBR' || target.nodeType === 8
      ) {
        target = target.nextSibling

        if ( !target ) {
          return
        }
      }

      // The ‘first-child’ of DOM is different from
      // the ones of QSA, could be either an element
      // or a text fragment, but the latter one is
      // not what we want. We don't want comments,
      // either.
      while ( target.nodeName === 'HWS' ) {
        parent.removeChild( target )

        target = parent.parentNode.insertBefore( $.clone( hws ), parent )
        parent = parent.parentNode

        if ( isNodeNormalizeNormal ) {
          parent.normalize()
        }

        // This is for extreme circumstances, i.e.,
        // `漢<a><b><c><hws/>zi</c></b></a>` =>
        // `漢<hws/><a><b><c>zi</c></b></a>`
        if ( target !== parent.firstChild ) {
          break
        }
      }
    })

    // Normalise nodes we messed up with
    if ( isNodeNormalizeNormal ) {
      context.normalize()
    }
    // Return the Farr instance for future usage
    return farr
  }


  function renderBasicBd( context ) {
    var
      context = context || document,
      farr, mid
    ;

    if ( support.unicoderange ) {
      return
    }

    farr = Farr( context )
    farr.filteredElemList += ' em'

    mid = $.create( 'char', 'biaodian cjk middle' )
    mid.setAttribute( 'unicode', 'b7' )

    farr
    .wrap( /\u00B7/g, $.clone( mid ))
    .charify({
      liga:      'liga',
      hanzi:     'none',
      word:      'none',
      latin:     'none',
      ellinika:  'none',
      kirillica: 'none'
    })
  }


  $.extend( Han, {
    renderHWS: renderHWS,
    renderBasicBd: renderBasicBd
  })



  /**
   * API: regular expression
   */
  $.extend( Han, {
    UNICODE: UNICODE,
    TYPESET: TYPESET
  })

  // English aliases are easier to memorise
  $.extend( Han.UNICODE, {
    greek: Han.UNICODE.ellinika,
    cyrillic: Han.UNICODE.kirillica
  })

  // Lock the regex objects preventing from furthur
  // modification.
  Object.freeze( Han.UNICODE )
  Object.freeze( Han.TYPESET )

  /**
   * Shortcut for `renderByRoutine` in default situation
   */
  Han.init = function() {
    return Han().renderByRoutine()
  }

  /**
   * Farr Methods
   */
  Han.Farr = Farr

  ;[ 'replace', 'wrap', 'revert', 'jinzify', 'charify' ]
  .forEach(function( method ) {
    Han.fn[ method ] = function() {
      if ( !this.Farr ) {
        // Share the same selector
        this.Farr = Han.Farr( this.context )
      }

      this.Farr[ method ]( arguments[ 0 ], arguments[ 1 ] )
      return this
    }
  })

  /**
   * Normalisation rendering mechanism via Hyu
   */
  Han.normalize = Hyu
  Han.support = Hyu.support
  Han.detectFont = Hyu.detectFont

  $.extend( Han.fn, {
    initCond: function() {
      this.condition.classList.add( 'han-js-rendered' )
      Han.normalize.initCond( this.condition )
      return this
    }
  })

  ;[ 'Elem', 'Line', 'Em', 'Ruby' ]
  .forEach(function( elem ) {
    var
      method = 'render' + elem
    ;
    Han.fn[ method ] = function( target ) {
      Han.normalize[ method ]( this.context, target )
      return this
    }
  })

  /**
   * Typography improvement via Mre
   */
  Han.typeface = Mre
  $.extend( Han.support, Mre.support )

  /**
   * Advanced typesettings
   */
  ;[ 'HWS', 'BasicBd' ]
  .forEach(function( feat ) {
    var
      method = 'render' + feat
    ;

    Han.fn[ method ] = function() {

      $
      .makeArray( arguments )
      .unshift( this.context )

      Han[ method ].apply( null, arguments )
      return this
    }
  })



  !function() {
    var
      DOMReady,
      initContext
    ;

    DOMReady = setInterval( function() {
      if ( document.readyState === 'complete' ) {
        clearTimeout( DOMReady )

        // Use shortcut for default situation
        if ( root.classList.contains( 'han-init' )) {
          Han.init()

        // If a context is configured
        } else if ( initContext = document.querySelector( '.han-init-context' )) {
          Han( initContext ).renderByRoutine()
        }
      }
    }, 50 )
  }()



  if (
    typeof noGlobalNS === 'undefined' ||
    noGlobalNS === false &&
    ( typeof define !== 'function' && !define.amd )
  ) {
    window.Han = Han
  }


  return Han
});
