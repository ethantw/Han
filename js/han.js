
/* 
 * 漢字標準格式 v2.1.0
 * ---
 * Hanzi-optimised CSS Mode
 *
 *
 *
 * Lisence: MIT Lisence
 * Last Modified: 2013/09/17
 *
 */

jQuery.noConflict();


(function($){

    var version = '2.1.0',

    tests = [],
    rubies,

    unicode = [],

    rendered = 'han-js-rendered',
    classes = [rendered],
    fontfaces = [],


    han = function() {
        $(document).on('ready', function(){
            (function(){
                fontfaces['songti'] = test_for_fontface( 'Han Songti' );
                fontfaces['kaiti'] = test_for_fontface( 'Han Kaiti' );
                fontfaces['fangsong'] = test_for_fontface( 'Han Fangsong' );

                for ( var font in fontfaces ) {
                    classes.push( ( fontfaces[font] ? '' : 'no-' ) + 'fontface-' + font );
                }

                $('html').addClass( classes.join(' ') );
            })();

            init();
        });
    },


    init = function( range ) {
        if ( !range && $('html').hasClass('no-han-init') )
            return;

        var range = range || 'body';

        if ( range !== 'body' && !$(range).hasClass(rendered) )
            $(range).addClass(rendered);
        else if ( range === 'body' && !$('html').hasClass(rendered) )
            $('html').addClass(rendered);



        /* 
         * 加強漢字註音功能
         * ---
         * Enhance `<ruby>` element
         *
         * **注意：**需置於`<em>`的hack前。
         *
         * **Note:** The necessity of being 
         * placed before the hack of
         * the `<em>` element is required.
         */

        $(range).find('ruby.pinyin').addClass('romanization');
        $(range).find('ruby.zhuyin').addClass('mps');

        $(range).find('ruby').each(function() {
            var html = $(this).html();

            // 羅馬拼音（在不支援`<ruby>`的瀏覽器下）
            if ( !$(this).hasClass('mps') && !tests['ruby']() ) {
                var result = html
                      .replace(/<rt>/ig, '</span><span class="rt"><span class="rt inner">')
                      .replace(/<\/rt>/ig, '</span></span></span><span class="rr"><span class="rb">');

                $(this).html('<span class="rr"><span class="rb">' + result + '</span>');

            // 注音符號
            } else if ( $(this).hasClass('mps') ) {
                var generic = $(this).css('font-family'),
                zhuyin_font = ( generic.match(/(sans-serif|monospace)$/) ) ? 'sans-serif' : 'serif',

                hanzi = unicode_set('hanzi'),

                shengmu = unicode['bopomofo']['mps']['shengmu'],
                jieyin = unicode['bopomofo']['mps']['jieyin'],
                yunmu = unicode['bopomofo']['mps']['yunmu'],
                tone = unicode['bopomofo']['tone']['five'],

                reg = '/(' + hanzi + ')<rt>(.*)<\\/rt>/ig';


                html = html.replace(eval(reg), function(entire, character, mps){
                    var form, yin, diao, data, zi;

                    form = ( mps.match(eval('/(' + shengmu + ')/')) ) ? 'shengmu' : '';
                    form += ( mps.match(eval('/(' + jieyin + ')/')) ) ? (( form !== '' ) ? '-' : '') + 'jieyin' : '';
                    form += ( mps.match(eval('/(' + yunmu + ')/')) ) ? (( form !== '' ) ? '-' : '') + 'yunmu' : '';

                    yin = mps.replace(eval('/(' + tone + ')/g'), ''),
                    diao = ( mps.match(/([\u02D9])/) ) ? '0' : 
                        ( mps.match(/([\u02CA])/) ) ? '2' : 
                        ( mps.match(/([\u02C5\u02C7])/) ) ? '3' :
                        ( mps.match(/([\u02CB])/) ) ? '4' : '1';

                    data = 'data-zy="' + yin + '" data-tone="' + diao + '" data-form="' + form + '"';
                    zi = '<span class="zi" ' + data + '>' + character + '</span>';

                    return zi + '<span class="zy">' + mps + '</span>';
                });


                $(this).replaceWith(
                    $('<span class="han-js-zhuyin-rendered"></span>').addClass('zhuyin-' + zhuyin_font).html( html )
                );
            }
        });



        /* 
         * 漢拉間隙 
         * ---
         * Gaps between Hanzi and Latin Letter
         *
         */

        if ( $('html').hasClass('han-la') )
            $(range).each(function(){
                var hanzi = unicode_set('hanzi'),
                    latin = unicode_set('latin') + '|' + unicode['punc'][0],
                    punc = unicode['punc'];

                    patterns = [
                        '/(' + hanzi + ')(' + latin + '|' + punc[1] + ')/ig',
                        '/(' + latin + '|' + punc[2] + ')(' + hanzi + ')/ig'
                    ],

                    replaceFn = function() {
                        return function( fill, i ){
                            var span = _span( 'hanla' );
                            span.setAttribute('data-text-before', fill);

                            return span;
                        };
                    };


                patterns.forEach(function( exp ){
                    findAndReplaceDOMText(eval( exp ), this, replaceFn(), 1);

                    $(this).find('span.hanla[data-text-before]').each(function(){
                        var char = $(this).attr('data-text-before'),
                            parent = this.parentNode;

                        parent.insertBefore(document.createTextNode( char ), this);
                        $(this).removeAttr('data-text-before');
                        parent.normalize();
                    });
                }, this);


                $('* > span.hanla:last-child').parent().each(function(){
                    if ( this.lastChild.nodeType == 1 ) {
                        $(this).after( $('<span class="hanla"></span>') );
                        $(this).find('span.hanla:last-child').remove();
                    }
                });
            });



        /* 
         * 修正相鄰註記元素`<u>`的底線相連問題
         * ---
         * fixing the underline-adjacency issues on `<u>` element
         *
         */

        if ( $('html').hasClass('han-lab-underline') )
            $(range).find('u:not(.han-js-charized)').charize('', true, true);

        else
            $(range).each(function() {
                var html = $(this).html();

                $(this)
                .html( html.replace(/<\/u>(<!--.*?-->|<wbr[ ]?[\/]?>)*?<u(\s.*?)*?>/ig, '</u>$1<u data-adjacent $2>') )
                .find('u[data-adjacent]').addClass('adjacent').removeAttr('data-adjacent');
            });



        /* 強調元素`<em>`的着重號
         * ---
         * punctuation: CJK emphasis dots
         * on `<em>` element
         *
         */

        $(range).find('em:not(.han-js-charized)').charize({
            latin: ( tests['textemphasis']() ) ? 'none' : 'individual'
        });



        /* 修正引言元素`<q>`不為WebKit引擎支援的問題
         * ---
         * punctuation: CJK quotes on `<q>` (WebKit)
         *
         */

        if ( !tests['quotes']() )
            $(range).find('q q').each(function() {
                if ( $(this).parents('q').length%2 != 0 )
                    $(this).addClass('double');
            });
    },



    unicode_set = function( set, sep ) {
        return unicode[set].join( sep || '|' );
    },


    _span = function( className ) {
        var span = document.createElement('span');
        span.className = className;

        return span;
    },


    findAndReplaceDOMText = function( exp, node, repNode, cG ) {
        return window.findAndReplaceDOMText(
            exp, node, repNode, cG || null, 
            function( el ) {
                var name = el.nodeName.toLowerCase();
                return name !== 'style' && name !== 'script';
            }
        );
    },


    inject_element_with_styles = function( rule, callback, nodes, testnames ) {
        var style, ret, node, docOverflow,
    
            docElement = document.documentElement,
            div = document.createElement('div'),
            body = document.body,
            fakeBody = body || document.createElement('body');
    
    
        style = ['<style id="han-support">', rule, '</style>'].join('');
    
        (body ? div : fakeBody).innerHTML += style;
        fakeBody.appendChild(div);
    
        if ( !body ) {
            fakeBody.style.background = '';
            fakeBody.style.overflow = 'hidden';
            docOverflow = docElement.style.overflow;
            docElement.style.overflow = 'hidden';
            docElement.appendChild(fakeBody);
        }
    
        ret = callback(div, rule);
    
        if ( !body ) {
            fakeBody.parentNode.removeChild(fakeBody);
            docElement.style.overflow = docOverflow;
        } else
            div.parentNode.removeChild(div);
    
        return !!ret;
    },


    write_on_canvas = function( text, font ) {
        var canvasNode = document.createElement('canvas');
        canvasNode.width = '50';
        canvasNode.height = '20';

        canvasNode.style.display = 'none';
        canvasNode.className = 'han_support_tests';
        document.body.appendChild(canvasNode);
        var ctx = canvasNode.getContext('2d');

        ctx.textBaseline = 'top';
        ctx.font = '15px ' + font + ', sans-serif';
        ctx.fillStyle = 'black';
        ctx.strokeStyle = 'black';

        ctx.fillText( text, 0, 0 );

        return ctx;
    },


    test_for_fontface = function( font ) {
        if ( !tests['fontface']() )
            return false;

        try {
            var sans = write_on_canvas( '辭Q', 'sans-serif' ),
                test = write_on_canvas( '辭Q', font ),
                support;


            for (var j = 1; j <= 20; j++) {
                for (var i = 1; i <= 50; i++) {
                    var sansData = sans.getImageData(i, j, 1, 1).data,
                        testData = test.getImageData(i, j, 1, 1).data,

                        alpha = [];

                    alpha['sans'] = sansData[3];
                    alpha['test'] = testData[3];


                    if ( support !== 'undefined' && alpha['test'] != alpha['sans'] )
                        support = true;

                    else if ( support )
                        break;

                    if ( i == 20 && j == 20 )
                        if ( !support )
                            support = false;
                }
            }


            $('canvas.han_support_tests').remove();

            return support;

        } catch ( err ) {
            return false;
        }
    };



    /* --------------------------------------------------------
     * Unicode區域說明（6.2.0）
     * --------------------------------------------------------
     * 或參考：
     * http://css.hanzi.co/manual/api/javascript_jiekou-han.unicode
     * --------------------------------------------------------
     *
     ** 以下歸類為「拉丁字母」（unicode['latin'].join('|')）**
     *
     * 基本拉丁字母：a-z
     * 阿拉伯數字：0-9
     * 拉丁字母補充-1：[\u00C0-\u00FF]
     * 拉丁字母擴展-A區：[\u0100-\u017F]
     * 拉丁字母擴展-B區：[\u0180-\u024F]
     * 拉丁字母附加區：[\u1E00-\u1EFF]
     * 符號：[~!@#&;=_\$\%\^\*\-\+\,\.\/(\\)\?\:\'\"\[\]\(\)'"<>‘“”’]
     *
     * --------------------------------------------------------
     *
     ** 以下歸類為「漢字」（unicode['hanzi']）**
     *
     * CJK一般：[\u4E00-\u9FFF]
     * CJK擴展-A區：[\u3400-\u4DB5]
     * CJK擴展-B區：[\u20000-\u2A6D6]
     * CJK Unicode 4.1：[\u9FA6-\u9FBB][\uFA70-\uFAD9]
     * CJK Unicode 5.1：[\u9FBC-\u9FC3]
     * CJK擴展-C區：[\u2A700-\u2B734]
     * CJK擴展-D區：[\u2B740-\u2B81D]（急用漢字）
     * CJK擴展-E區：[\u2B820-\u2F7FF]（**註**：暫未支援）
     * CJK擴展-F區（**註**：暫未支援）
     * CJK筆畫區：[\u31C0-\u31E3]
     * 數字「〇」：[\u3007]
     * 日文假名：[\u3040-\u309E][\u30A1-\u30FA][\u30FD\u30FE]（**註**：排除片假名中點、長音符）
     *
     * CJK相容表意文字：[\uF900-\uFAFF]（**註**：不使用）
     * --------------------------------------------------------
     *
     ** 其他
     *
     * 漢語注音符號、擴充：[\u3105-\u312D][\u31A0-\u31BA]
     * 國語五聲調（三聲有二種符號）：[\u02D9\u02CA\u02C5\u02C7\u02CB]
     * 台灣漢語方言音擴充聲調：[\u02EA\u02EB]
     * 符號：[·・︰、，。：；？！—⋯…．·「『（〔【《〈“‘」』）〕】》〉’”–ー—]
     *
     *
     */

    unicode['latin'] = [
        '[a-z0-9]',
        '[\u00C0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]'
    ];


    unicode['punc'] = [
        '[@&;=_\,\.\?\!\$\%\^\*\-\+\/]',
        '[\(\[\'"<‘“]',
        '[\)\\]\'">”’]'
    ];

    unicode['hanzi'] = [
        '[\u4E00-\u9FFF]',
        '[\u3400-\u4DB5\u9FA6-\u9FBB\uFA70-\uFAD9\u9FBC-\u9FC3\u3007\u3040-\u309E\u30A1-\u30FA\u30FD\u30FE]',
        '[\uD840-\uD868][\uDC00-\uDFFF]|\uD869[\uDC00-\uDEDF]',
        '\uD86D[\uDC00-\uDF3F]|[\uD86A-\uD86C][\uDC00-\uDFFF]|\uD869[\uDF00-\uDFFF]',
        '\uD86D[\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1F]',
        '[\u31C0-\u31E3]'
    ];

    unicode['biaodian'] = [
        '[·・︰、，。：；？！—⋯…．·／]',
        '[「『（〔【《〈“‘]',
        '[」』）〕】》〉’”]'
    ];

    unicode['bopomofo'] = [];
    unicode['bopomofo']['mps'] = [];
    unicode['bopomofo']['mps'][0] = '[\u3105-\u312D]';
    unicode['bopomofo']['mps']['shengmu'] = '[\u3105-\u3119\u312A-\u312C]';
    unicode['bopomofo']['mps']['jieyin'] = '[\u3127-\u3129]';
    unicode['bopomofo']['mps']['yunmu'] = '[\u311A-\u3126\u312D]';
    unicode['bopomofo']['extend'] = '[\u31A0-\u31BA]';
    unicode['bopomofo']['tone'] = [];
    unicode['bopomofo']['tone']['five'] = '[\u02D9\u02CA\u02C5\u02C7\u02CB]';
    unicode['bopomofo']['tone']['extend'] = '[\u02EA\u02EB]';



    /* tests for HTML5/CSS3 features */

    /* CSS3 property: `column-width` */
    tests['columnwidth'] = function() {
        var cw = $('<div style="display: none; column-width: 200px; -webkit-column-width: 200px;">tester</div>'),

            bool = ( /^200px$/.test( cw.css("-webkit-column-width") ) ||
                /^200px$/.test( cw.css("-moz-column-width") ) ||
                /^200px$/.test( cw.css("-ms-column-width") ) ||
                /^200px$/.test( cw.css("column-width") ) ) ? true : false;

        return bool;
    };


   /* --------------------------------------------------------
    * test for '@font-face'
    * -------------------------------------------------------- 
    * Originates from Modernizr (http://modernizr.com)
    */

    tests['fontface'] = function() {
        var bool;

        inject_element_with_styles('@font-face {font-family:"font";src:url("https://")}', function( node, rule ) {
          var style = document.getElementById('han-support'),
              sheet = style.sheet || style.styleSheet,
              cssText = sheet ? (sheet.cssRules && sheet.cssRules[0] ? sheet.cssRules[0].cssText : sheet.cssText || '') : '';

          bool = /src/i.test(cssText) && cssText.indexOf(rule.split(' ')[0]) === 0;
        });

        return bool;
    };


    tests['ruby'] = function() {
        if ( rubies != null )
            return rubies;


        var ruby = document.createElement('ruby'),
            rt = document.createElement('rt'),
            rp = document.createElement('rp'),
            docElement = document.documentElement,
            displayStyleProperty = 'display';

        ruby.appendChild(rp);
        ruby.appendChild(rt);
        docElement.appendChild(ruby);

          // browsers that support <ruby> hide the <rp> via "display:none"
        rubies = ( getStyle(rp, displayStyleProperty) == 'none' ||
          // but in IE browsers <rp> has "display:inline" so, the test needs other conditions:
          getStyle(ruby, displayStyleProperty) == 'ruby'
          && getStyle(rt, displayStyleProperty) == 'ruby-text' ) ? true : false;


        docElement.removeChild(ruby);
        // the removed child node still exists in memory, so ...
        ruby = null;
        rt = null;
        rp = null;

        return rubies;


        function getStyle( element, styleProperty ) {
            var result;

            if ( window.getComputedStyle )     // for non-IE browsers
                result = document.defaultView.getComputedStyle(element,null).getPropertyValue(styleProperty);
            else if ( element.currentStyle )   // for IE
                result = element.currentStyle[styleProperty];

            return result;
        }
    };


    tests['textemphasis'] = function() {
        var em = $('<span style="display: none; text-emphasis: dot; -moz-text-emphasis: dot; -ms-text-emphasis: dot; -webkit-text-emphasis: dot;">tester</span>'),

            bool = ( /^dot$/.test( em.css("-webkit-text-emphasis-style") ) ||
                /^dot$/.test( em.css("text-emphasis-style") ) ||
                /^dot$/.test( em.css("-moz-text-emphasis-style") ) ||
                /^dot$/.test( em.css("-ms-text-emphasis-style") ) ) ? true : false;

        return bool;
    };


    tests['quotes'] = function() {
        var q = $('<q style="display: none; quotes: \'“\' \'”\' \'‘\' \'’\'">tester</q>'),

            bool = /^"“" "”" "‘" "’"$/.test( q.css("quotes") );

        return bool;
    };


    tests['writingmode'] = function() {
        var wm = $('<div style="display: none; writing-mode: tb-rl; -moz-writing-mode: tb-rl; -ms-writing-mode: tb-rl; -webkit-writing-mode: vertical-rl;">tester</div>'),

            bool = ( /^tb-rl$/.test( wm.css("writing-mode") ) ||
            	  /^vertical-rl$/.test( wm.css("-webkit-writing-mode") ) || 
                /^tb-rl$/.test( wm.css("-moz-writing-mode") ) ||
                /^tb-rl$/.test( wm.css("-ms-writing-mode") ) ) ? true: false;

        return bool;
    };





    $.fn.extend({
        hanInit: function() {
            return init(this);
        },


        bitouwei: function() {
            return this.each(function(){
                $(this).addClass( 'han-js-bitouwei-rendered' );

                var tou = unicode['biaodian'][0] + unicode['biaodian'][2],
                    wei = unicode['biaodian'][1],
                    start = unicode['punc'][0] + unicode['punc'][2],
                    end = unicode['punc'][1];

                tou = tou.replace(/\]\[/g, '' );
                start = start.replace(/\]\[/g, '' );


                // CJK characters
                findAndReplaceDOMText(
                    eval( '/(' + wei + ')(' + unicode_set('hanzi') + ')(' + tou + ')/ig' ),
                    this,
                    _span( 'bitouwei bitouweidian' )
                );

                findAndReplaceDOMText(
                    eval( '/(' + unicode_set('hanzi') + ')(' + tou + ')/ig' ),
                    this,
                    _span( 'bitouwei bitoudian' )
                );

                findAndReplaceDOMText(
                    eval( '/(' + wei + ')(' + unicode_set('hanzi') + ')/ig' ),
                    this,
                    _span( 'bitouwei biweidian' )
                );


                // Latin letters
                findAndReplaceDOMText(
                    eval( '/(' + end + ')(' + unicode_set('latin', '+|') + '+)(' + start + ')/ig' ),
                    this,
                    _span( 'bitouwei bitouweidian' )
                );

                findAndReplaceDOMText(
                    eval( '/(' + unicode_set('latin', '+|') + '+)(' + start + ')/ig' ),
                    this,
                    _span( 'bitouwei bitoudian' )
                );

                findAndReplaceDOMText(
                    eval( '/(' + end + ')(' + unicode_set('latin', '+|') + '+)/ig' ),
                    this,
                    _span( 'bitouwei biweidian' )
                );
            });
        },


        charize: function( glyph, charClass, innerSpan ){
            var glyph = glyph || {},
            charClass = charClass || true;

            glyph = {
                cjk: glyph.cjk || 'individual',
                bitouwei: glyph.bitouwei || true,
                latin: glyph.latin || 'group'
            };

            return this.each(function(){
                if ( charClass ) 
                    $(this).addClass('han-js-charized');


                if ( glyph.bitouwei )
                    $(this).bitouwei();


                // CJK characters
                if ( glyph.cjk === 'individual' )
                    findAndReplaceDOMText(
                        eval( '/(' + unicode_set('hanzi') + ')/ig' ),
                        this,
                        _span( 'char cjk' )
                    );


                if ( glyph.cjk === 'individual' || glyph.cjk === 'biaodian' )
                    findAndReplaceDOMText(
                        eval( '/(' + unicode_set('biaodian') + ')/ig' ),
                        this,
                        _span( 'char cjk biaodian' )
                    );


                if ( glyph.cjk === 'group' )
                    findAndReplaceDOMText(
                        eval( '/(' + unicode_set('hanzi') + '|' + unicode_set('biaodian') + '+)/ig' ),
                        this,
                        _span( 'char cjk' )
                    );


                var latin_regex = ( glyph.latin === 'group' ) ?
                    '/(' + unicode_set('latin', '+|') + '+)/ig' :
                    '/(' + unicode_set('latin') + ')/ig';

                findAndReplaceDOMText(
                    eval( latin_regex ),
                    this,
                    _span( 'char latin' )
                );


                findAndReplaceDOMText(
                    eval( '/(' + unicode_set('punc') + '+)/ig' ),
                    this,
                    _span( 'char latin punc' )
                );

                findAndReplaceDOMText(
                    /([\s]+)/ig,
                    this,
                    _span( 'char space' )
                );


                if ( innerSpan )
                    $(this).find('.char').each(function(){
                        $(this).html(
                            $('<span>').text( $(this).text() )
                        );
                    });
            });
        }
    });







    for ( var feature in tests ) {
        classes.push( ( tests[feature]() ? '' : 'no-' ) + feature );


        if ( !tester )
            var tester = '';
 
        tester += '    ' + feature + ': tests[\'' + feature + '\'](),\n';
    }

    !function(window) {
        eval("tester = ({\n" + tester.replace(/\n$/ig, '\nfont: test_for_fontface\n}') + ")");
    }();



    han();

    window.han = {
        unicode: unicode_set,
        support: tester
    }

})(jQuery);




/**
 * findAndReplaceDOMText v 0.3.0
 * @author James Padolsey http://james.padolsey.com
 * @license http://unlicense.org/UNLICENSE
 *
 * Matches the text of a DOM node against a regular expression
 * and replaces each match (or node-separated portions of the match)
 * in the specified element.
 *
 * Example: Wrap 'test' in <em>:
 *   <p id="target">This is a test</p>
 *   <script>
 *     findAndReplaceDOMText(
 *       /test/,
 *       document.getElementById('target'),
 *       'em'
 *     );
 *   </script>
 */
window.findAndReplaceDOMText = (function() {

  /** 
   * findAndReplaceDOMText
   * 
   * Locates matches and replaces with replacementNode
   *
   * @param {RegExp} regex The regular expression to match
   * @param {Node} node Element or Text node to search within
   * @param {String|Element|Function} replacementNode A NodeName,
   *  Node to clone, or a function which returns a node to use
   *  as the replacement node.
   * @param {Number} [captureGroup] A number specifiying which capture
   *  group to use in the match. (optional)
   * @param {Function} [elFilter] A Function to be called to check whether to
   *  process an element. (returning true = process element,
   *  returning false = avoid element)
   */
  function findAndReplaceDOMText(regex, node, replacementNode, captureGroup, elFilter) {

    var m, matches = [], text = _getText(node, elFilter);
    var replaceFn = _genReplacer(replacementNode);

    if (!text) { return; }

    if (regex.global) {
      while (m = regex.exec(text)) {
        matches.push(_getMatchIndexes(m, captureGroup));
      }
    } else {
      m = text.match(regex);
      matches.push(_getMatchIndexes(m, captureGroup));
    }

    if (matches.length) {
      _stepThroughMatches(node, matches, replaceFn, elFilter);
    }
  }

  /**
   * Gets the start and end indexes of a match
   */
  function _getMatchIndexes(m, captureGroup) {

    captureGroup = captureGroup || 0;
 
    if (!m[0]) throw 'findAndReplaceDOMText cannot handle zero-length matches';
 
    var index = m.index;

    if (captureGroup > 0) {
      var cg = m[captureGroup];
      if (!cg) throw 'Invalid capture group';
      index += m[0].indexOf(cg);
      m[0] = cg;
    }

    return [ index, index + m[0].length, [ m[0] ] ];
  };

  /**
   * Gets aggregate text of a node without resorting
   * to broken innerText/textContent
   */
  function _getText(node, elFilter) {

    if (node.nodeType === 3) {
      return node.data;
    }

    if (elFilter && !elFilter(node)) {
      return '';
    }

    var txt = '';

    if (node = node.firstChild) do {
      txt += _getText(node, elFilter);
    } while (node = node.nextSibling);

    return txt;

  }

  /** 
   * Steps through the target node, looking for matches, and
   * calling replaceFn when a match is found.
   */
  function _stepThroughMatches(node, matches, replaceFn, elFilter) {

    var after, before,
        startNode,
        endNode,
        startNodeIndex,
        endNodeIndex,
        innerNodes = [],
        atIndex = 0,
        curNode = node,
        matchLocation = matches.shift(),
        matchIndex = 0,
        doAvoidNode;

    out: while (true) {

      if (curNode.nodeType === 3) {

        if (!endNode && curNode.length + atIndex >= matchLocation[1]) {
          // We've found the ending
          endNode = curNode;
          endNodeIndex = matchLocation[1] - atIndex;
        } else if (startNode) {
          // Intersecting node
          innerNodes.push(curNode);
        }

        if (!startNode && curNode.length + atIndex > matchLocation[0]) {
          // We've found the match start
          startNode = curNode;
          startNodeIndex = matchLocation[0] - atIndex;
        }

        atIndex += curNode.length;
      }

      doAvoidNode = curNode.nodeType === 1 && elFilter && !elFilter(curNode);

      if (startNode && endNode) {
        curNode = replaceFn({
          startNode: startNode,
          startNodeIndex: startNodeIndex,
          endNode: endNode,
          endNodeIndex: endNodeIndex,
          innerNodes: innerNodes,
          match: matchLocation[2],
          matchIndex: matchIndex
        });
        // replaceFn has to return the node that replaced the endNode
        // and then we step back so we can continue from the end of the 
        // match:
        atIndex -= (endNode.length - endNodeIndex);
        startNode = null;
        endNode = null;
        innerNodes = [];
        matchLocation = matches.shift();
        matchIndex++;
        if (!matchLocation) {
          break; // no more matches
        }
      } else if (
        !doAvoidNode &&
        (curNode.firstChild || curNode.nextSibling)
      ) {
        // Move down or forward:
        curNode = curNode.firstChild || curNode.nextSibling;
        continue;
      }

      // Move forward or up:
      while (true) {
        if (curNode.nextSibling) {
          curNode = curNode.nextSibling;
          break;
        } else if (curNode.parentNode !== node) {
          curNode = curNode.parentNode;
        } else {
          break out;
        }
      }

    }

  }

  var reverts;
  /**
   * Reverts the last findAndReplaceDOMText process
   */
  findAndReplaceDOMText.revert = function revert() {
    for (var i = 0, l = reverts.length; i < l; ++i) {
      reverts[i]();
    }
    reverts = [];
  };

  /** 
   * Generates the actual replaceFn which splits up text nodes
   * and inserts the replacement element.
   */
  function _genReplacer(nodeName) {

    reverts = [];

    var makeReplacementNode;

    if (typeof nodeName != 'function') {
      var stencilNode = nodeName.nodeType ? nodeName : document.createElement(nodeName);
      makeReplacementNode = function(fill) {
        var clone = document.createElement('div'),
            el;
        clone.innerHTML = stencilNode.outerHTML || new XMLSerializer().serializeToString(stencilNode);
        el = clone.firstChild;
        if (fill) {
          el.appendChild(document.createTextNode(fill));
        }
        return el;
      };
    } else {
      makeReplacementNode = nodeName;
    }

    return function replace(range) {

      var startNode = range.startNode,
          endNode = range.endNode,
          matchIndex = range.matchIndex;

      if (startNode === endNode) {
        var node = startNode;
        if (range.startNodeIndex > 0) {
          // Add `before` text node (before the match)
          var before = document.createTextNode(node.data.substring(0, range.startNodeIndex));
          node.parentNode.insertBefore(before, node);
        }

        // Create the replacement node:
        var el = makeReplacementNode(range.match[0], matchIndex, range.match[0]);
        node.parentNode.insertBefore(el, node);

        if (range.endNodeIndex < node.length) {
          // Add `after` text node (after the match)
          var after = document.createTextNode(node.data.substring(range.endNodeIndex));
          node.parentNode.insertBefore(after, node);
        }

        node.parentNode.removeChild(node);

        reverts.push(function() {
          var pnode = el.parentNode;
          pnode.insertBefore(el.firstChild, el);
          pnode.removeChild(el);
          pnode.normalize();
        });

        return el;

      } else {
        // Replace startNode -> [innerNodes...] -> endNode (in that order)
        var before = document.createTextNode(startNode.data.substring(0, range.startNodeIndex));
        var after = document.createTextNode(endNode.data.substring(range.endNodeIndex));
        var elA = makeReplacementNode(startNode.data.substring(range.startNodeIndex), matchIndex, range.match[0]);
        var innerEls = [];

        for (var i = 0, l = range.innerNodes.length; i < l; ++i) {
          var innerNode = range.innerNodes[i];
          var innerEl = makeReplacementNode(innerNode.data, matchIndex, range.match[0]);
          innerNode.parentNode.replaceChild(innerEl, innerNode);
          innerEls.push(innerEl);
        }

        var elB = makeReplacementNode(endNode.data.substring(0, range.endNodeIndex), matchIndex, range.match[0]);

        startNode.parentNode.insertBefore(before, startNode);
        startNode.parentNode.insertBefore(elA, startNode);
        startNode.parentNode.removeChild(startNode);
        endNode.parentNode.insertBefore(elB, endNode);
        endNode.parentNode.insertBefore(after, endNode);
        endNode.parentNode.removeChild(endNode);

        reverts.push(function() {
          innerEls.unshift(elA);
          innerEls.push(elB);
          for (var i = 0, l = innerEls.length; i < l; ++i) {
            var el = innerEls[i];
            var pnode = el.parentNode;
            pnode.insertBefore(el.firstChild, el);
            pnode.removeChild(el);
            pnode.normalize();
          }
        });

        return elB;
      }
    };

  }

  return findAndReplaceDOMText;

}());