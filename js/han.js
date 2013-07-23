

/* 
 * 漢字標準格式 v2.0.0
 * ---
 * Hanzi-optimised CSS Mode
 *
 *
 *
 * Lisence: MIT Lisence
 * Last Modified: 2013/07/23
 *
 */
 


jQuery.noConflict();


(function($){

    var version = '2.0.0',

    tests = [],
    rubies,

    unicode = [],

    classes = ['han-js'],
    fontfaces = [],


    han = function() {
        $(document).ready(function(){
            (function(){
                fontfaces['songti'] = test_for_fontface( 'Han Songti' );
                fontfaces['kaiti'] = test_for_fontface( 'Han Kaiti' );
                fontfaces['fangsong'] = test_for_fontface( 'Han Fangsong' );

                for ( var font in fontfaces ) {
                    classes.push( ( fontfaces[font] ? '' : 'no-' ) + 'fontface-' + font );
                }
            })();

            init();
        });


        var had_spacing, // 是不是剛剛執行完 spacing
            last_spacing_time = 0; // 0 means there were never any requests sent


        $('body').bind('DOMNodeInserted', function() {
            var d = new Date(),
                current_time = d.getTime(), // get the time of this change event
                interval = current_time - last_spacing_time; // how many milliseconds since the last request

            if ( interval >= 1000 ) { // more than 1 second
                last_spacing_time = current_time; // set last_spacing_time for next change event

                if ( !had_spacing ) {
                    had_spacing = setTimeout(function() {
                        hanla();
                        had_spacing = null;
                    }, 1000);
                }
            }
        });
    },


    init = function( range ) {
        if ( !range && $('html').hasClass('no-han-init') )
            return;

        $(( !range ) ? 'html' : range).addClass( classes.join(' ') );

        var range = range || document;


        /* 
         * 修正相鄰註記元素`<u>`的底線相連問題
         * ---
         * fixing the underline-adjacency issues on `<u>` element
         *
         */

        $( (range == document) ? 'body' : range ).each(function() {
            var html = $(this).html();

            $(this)
            .html( html.replace(/<\/u>(<!--.*?-->|<wbr[ ]?[\/]?>)*?<u(\s.*?)*?>/ig, '</u>$1<u data-adjacent $2>') )
            .find('u[data-adjacent]').addClass('adjacent').removeAttr('data-adjacent');
        });



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

                hanzi = unicode['hanzi'].join(''),

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
                    $('<span class="ruby-zhuyin-constructed"></span>').addClass('zhuyin-' + zhuyin_font).html( html )
                );
            }
        });



        /* 強調元素`<em>`的着重號
         * ---
         * punctuation: CJK emphasis dots
         * on `<em>` element
         *
         */

        $(range).find('em').each(function() {
            $(this).html( characterize($(this).html(), {
                cjk: ( tests['textemphasis']() ) ? 'biaodian' : 'individual',
                latin: ( tests['textemphasis']() ) ? 'none' : 'individual' })
            );
        });



        /* 修正引言元素`<q>`不為WebKit引擎支援的問題
         * ---
         * punctuation: CJK quotes on `<q>` (WebKit)
         *
         */

        if ( !tests['quotes']() )
        $(range).find('q q').each(function() {
            if ( $(this).parents('q').length%2 != 0 )  $(this).addClass('double');
        });



        /* 漢拉間隙 
         * ---
         * Gaps between Hanzi and Latin Letter
         * 
         * 修改自：https://github.com/gibuloto/paranoid-auto-spacing/
         *
         */

        hanla();
    },



    characterize = function( content, glyph ) {
        var content = content + '<!---->',
            glyph = glyph || {};

        glyph = {
            cjk: glyph.cjk || 'individual',
            latin: glyph.latin || 'group',
            space: glyph.space || 'individual'
        };


        // CJK Unified Ideographs
        if ( glyph.cjk === 'individual' )
            content = content
            .replace( eval('/(' + unicode['hanzi'].join('') + ')(?=[^>]*<)/ig'), '<span class="cjk">$1</span>' )
            .replace( eval('/(' + unicode['biaodian'][0] + ')(?=[^>]*<)/ig'), '<span class="cjk biaodian">$1</span>' )
            .replace( eval('/(' + unicode['biaodian']['open'] + ')(?=[^>]*<)/ig'), '<span class="cjk biaodian open">$1</span>' )
            .replace( eval('/(' + unicode['biaodian']['close'] + ')(?=[^>]*<)/ig'), '<span class="cjk biaodian close">$1</span>' );


        else if ( glyph.cjk === 'group' )
            content = content
            .replace( eval('/(' + unicode['hanzi'].join('') + '+)(?=[^>]*<)/ig'), '<span class="cjk">$1</span>' );


        else if ( glyph.cjk === 'biaodian' )
            content = content
            .replace( eval('/(' + unicode['biaodian'][0] + ')(?=[^>]*<)/ig'), '<span class="cjk biaodian">$1</span>' )
            .replace( eval('/(' + unicode['biaodian']['open'] + ')(?=[^>]*<)/ig'), '<span class="cjk biaodian open">$1</span>' )
            .replace( eval('/(' + unicode['biaodian']['close'] + ')(?=[^>]*<)/ig'), '<span class="cjk biaodian close">$1</span>' );



        // Latin letters
        if ( glyph.latin === 'individual' )
            content = content
            .replace( eval('/(' + unicode['latin'].join('') + ')(?=[^>]*<)/ig'), '<span class="latin">$1</span>' );


        else if ( glyph.latin === 'group' )
            content = content
            .replace( eval('/(' + unicode['latin'].join('') + '+)(?=[^>]*<)/ig'), '<span class="latin">$1</span>' );



        // spaces
        if ( glyph.space === 'individual' )
            content = content
            .replace( /([\s])(?=[^>]*<)/ig, '<span class="space">$1</span>' );


        return content;
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
    },



    insert_hanla = function( text ) {
        var hanzi = unicode['hanzi'].join(''),
            latin = unicode['latin'] + unicode['latin']['punc'][0],
            lo = latin + unicode['latin']['punc']['open'],
            lc = latin + unicode['latin']['punc']['close'],

        // CJK在前
        regex0 = '/(' + hanzi + ')(' + lo.replace( /\]\[/g, '' ) + ')/ig',
        // CJK在後
        regex1 = '/(' + lc.replace( /\]\[/g, '' ) + ')(' + hanzi + ')/ig';

        text = text.replace( eval(regex0), '$1![!hanla!]!$2' )
            .replace( eval(regex1), '$1![!hanla!]!$2' );

        return text;
    },


    hanla = function() {
        if ( !document.evaluate )
            return;

        traversal_and_spacing();

        $('body').each(function() {
            var html = $(this).html()
                hanla = '<span class="hanla"></span>';

            $(this).html( html.replace(/!\[!hanla!\]!/ig, hanla) );


            $('* > span.hanla:first-child').parent().each(function() {
                if ( $(this).html().match(/^<span class="hanla">/i) )
                    $(this).find('span.hanla:first-child').eq(0).remove();
            });
        });
    },


    traversal_and_spacing = function() {
    	var firstTextChild = function(parentNode, targetChild) {
    		var childNodes = parentNode.childNodes;
    		for (var i = 0; i < childNodes.length && childNodes[i] != targetChild; i++) {
    			if (childNodes[i].nodeType != 8 && childNodes[i].textContent) {
    				return childNodes[i];
    			}
    		}
    
    		return targetChild;
    	};
    
    	var lastTextChild = function(parentNode, targetChild) {
    		var childNodes = parentNode.childNodes;
    		for (var i = childNodes.length - 1; i > -1 && childNodes[i] != targetChild; i--) {
    			if (childNodes[i].nodeType != 8 && childNodes[i].textContent) {
    				return childNodes[i];
    			}
    		}
    
    		return targetChild;
    	};
    
        var current_document = window.document;
    
        /*
         // >> 選擇任意位置的某個節點
         . >> 自己這個節點
         .. >> 父節點
         text() >> 尋找某點的文字型別，例如 hello 之於 <tag>hello</tag>
         normalize-space() >> 字串頭和尾的空白字元都會被移除，大於兩個以上的空白字元會被置換成單一空白
    
         另外 XML 是 case-sensitive 的
         試試 [translate(name(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz")="html"]
         而 lower-case(name(..)) 不起作用
        */
        var xpath_query = '//text()[normalize-space(.)][translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="title"][translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="style"][translate(name(..),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")!="script"]';
    
        var nodes = current_document.evaluate(xpath_query, current_document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    
        // snapshotLength 要配合 XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE 使用
        var nodes_length = nodes.snapshotLength;
    
        var next_node;
    
        for (var i = nodes_length - 1; i > -1; --i) {
            var current_node = nodes.snapshotItem(i);
    
            // .data 是 XML DOM 的屬性
            // http://www.w3school.com.cn/xmldom/dom_text.asp
            current_node.data = insert_hanla(current_node.data);
    
            if ( next_node ) {
                var text = current_node.data.toString().substr(-1) + next_node.data.toString().substr(0, 1);
                var newText = insert_hanla(text);
    
                if ( text != newText ) {
                    var next_temp = next_node;
                    while ( next_temp.parentNode && 
                      next_temp.nodeName.search(/^(a|u)$/i) == -1 &&
                      firstTextChild(next_temp.parentNode, next_temp) == next_temp ) {
                        next_temp = next_temp.parentNode;
                    }
    
                    var current_temp = current_node;
                    while (current_temp.parentNode &&
                      current_temp.nodeName.search(/^(a|u)$/i) == -1 &&
                      lastTextChild(current_temp.parentNode, current_temp) == current_temp ) {
                        current_temp = current_temp.parentNode;
                    }
    
                    next_temp.parentNode.insertBefore(document.createTextNode("![!hanla!]!"), next_temp);
                 }
            }
    
            next_node = current_node;
        }
    };



    /* --------------------------------------------------------
     * Unicode區域說明（6.2.0）
     * --------------------------------------------------------
     * 或參考：
     * http://css.hanzi.co/manual/api/javascript_jiekou-han.unicode
     * --------------------------------------------------------
     *
     ** 以下歸類為「拉丁字母」（unicode['latin']）**
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

    unicode['latin'] = [];
    unicode['latin'][0] = '[a-z0-9\u00C0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\s]';

    unicode['latin']['punc'] = [];
    unicode['latin']['punc'][0] = '[&;=_\,\.\$\%\^\*\-\+\/]';
    unicode['latin']['punc']['open'] = '[\(\[\'"<‘“]';
    unicode['latin']['punc']['close'] = '[\)\\]\'">”’]';

    unicode['hanzi'] = [];
    unicode['hanzi'][0] = '[\u4E00-\u9FFF\u3400-\u4DB5\u9FA6-\u9FBB\uFA70-\uFAD9\u9FBC-\u9FC3\u3007\u3040-\u309E\u30A1-\u30FA\u30FD\u30FE]';
    unicode['hanzi']['b'] = '[\uD840-\uD868][\uDC00-\uDFFF]|\uD869[\uDC00-\uDEDF]';
    unicode['hanzi']['c'] = '\uD86D[\uDC00-\uDF3F]|[\uD86A-\uD86C][\uDC00-\uDFFF]|\uD869[\uDF00-\uDFFF]';
    unicode['hanzi']['d'] = '\uD86D[\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1F]';

    unicode['biaodian'] = [];
    unicode['biaodian'][0] = '[·・︰、，。：；？！—⋯…．·]';
    unicode['biaodian']['open'] = '[「『（〔【《〈“‘]';
    unicode['biaodian']['close'] = '[」』）〕】》〉’”]';

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
        characterize: characterize,
        unicode: unicode,
        support: tester
    }

})(jQuery);





