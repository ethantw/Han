
<<<<<<< HEAD

/*! 
 * 漢字標準格式 v2.3
 * Hanzi-optimised CSS Mode
 *
 * Lisence: MIT Lisence
 * Last-Modified: 2014/2/7
 */

;(function(window, $){
    var version = '2.3',

    tests = [],
    rubies,

    unicode = [],

    rendered = 'han-js-rendered',
    classes = [rendered],
    fontfaces = [],


    han = function() {
        $(document).on('ready', function(){

            // `unicode-range`
            classes.push( ( test_for_unicoderange() ? '' : 'no-' ) + 'unicoderange' )

            // The 4(-1) Typefaces
            fontfaces['songti'] = test_for_fontface( 'Han Songti' )
            fontfaces['kaiti'] = test_for_fontface( 'Han Kaiti' )
            fontfaces['fangsong'] = test_for_fontface( 'Han Fangsong' )

            for ( var font in fontfaces ) {
                classes.push( ( fontfaces[font] ? '' : 'no-' ) + 'fontface-' + font )
            }

            // altogether
            $('html').addClass( classes.join(' ') )

            init()
        })
    },


    init = function( range ) {
        if ( !range && $('html').hasClass('no-han-init') )
            return

        var range = range || 'body'

        if ( range !== 'body' && !$(range).hasClass(rendered) )
            $(range).addClass(rendered)
        else if ( range === 'body' && !$('html').hasClass(rendered) )
            $('html').addClass(rendered)



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

        // 語意類別簡化
        var _ruby = $(range).find('ruby, rtc')
        _ruby.filter('.pinyin').addClass('romanization')
        _ruby.filter('.mps').addClass('zhuyin')
        _ruby.filter('.romanization').addClass('annotation')

        $(range).find('ruby').each(function() {
            var html = $(this).html(),
                that = $(this),
                hruby = document.createElement('hruby')

            // 羅馬拼音（在不支援`<ruby>`的瀏覽器下）
            if ( !tests['ruby']() && 
                 !that.hasClass('complex') &&
                 !that.hasClass('zhuyin') &&
                 !that.hasClass('rightangle') ) {

                // 將拼音轉為元素屬性以便CSS產生偽類
                that
                .find('rt')
                .each(function(){
                    var anno = $(this).html(),
                        prev = this.previousSibling,
                        text = prev.nodeValue

                    prev.nodeValue = ''

                    $(prev).before(
                         $('<rb/>')
                        .html( text )
                        .attr('annotation', anno)
                        .replaceWith(_copy)
                    )

                    $(this).replaceWith(
                        _copy().html(anno)
                    )
                })

                that
                .replaceWith(
                    $(hruby)
                    .html( $(this).html() )
                )

            } else {
                var attr = {}

                // 國語注音、台灣方言音符號
                if ( that.hasClass('zhuyin') ) {
                    // 將注音轉為元素屬性以便CSS產生偽類
                    that.find('rt')
                    .each(function(){
                        _apply_zhuyin(this)
                    })

                // 雙行文字註記
                } else if ( that.hasClass('complex') ) {
                    attr.complex = 'complex'

                    _apply_annotation(this)
                    

                // 拼音、注音直角顯示
                } else if ( that.hasClass('rightangle') ) {
                    attr.rightangle = 'rightangle'


                    // 國語注音、台灣方言音符號
                    that.find('rtc.zhuyin')
                    .hide()
                    .each(function(){
                        var t = $(this).prevAll('rbc'),
                            c, len, data
                        
                        $(this).find('rt')
                        .each(function(i){
                            var rb = t.find('rb:not([annotation])').eq(i)
                            if($(this).html()) _apply_zhuyin( this, rb )
                        })
                        
                        $(this).nextAll('rt')
                        .each(function(i){
                            var rb = t.find('rb:not([annotation])').eq(i)
                            if($(this).html()) _apply_zhuyin( this, rb )
                        })
                    })

                    // 羅馬拼音或文字註記
                    _apply_annotation(this)
                }

                // 以`<hruby>`元素替代`<ruby>`，避免UA原生樣式的干擾
                that.filter(function(){
                    return $(this).hasClass("zhuyin") ||
                           $(this).hasClass("complex") ||
                           $(this).hasClass("rightangle")
                }).replaceWith(
                    $(hruby)
                    .html( $(this).html().replace(/(.*<\/rbc>).*/, '$1') )
                    .attr('generic', _get_zhuyin_font(this))
                    .attr(attr)
                )
            }
        })



        /* 
         * 漢拉間隙 
         * ---
         * Kerning between Hanzi and Latin Letter
         *
         */

        if ( $('html').hasClass('han-la') )
            $(range).each(function(){
                var hanzi = unicode_set('hanzi'),
                    latin = unicode_set('latin') + '|' + unicode['punc'][0],
                    punc = unicode['punc']

                    patterns = [
                        '/(' + hanzi + ')(' + latin + '|' + punc[1] + ')/ig',
                        '/(' + latin + '|' + punc[2] + ')(' + hanzi + ')/ig'
                    ]


                patterns.forEach(function( exp ){
                    findAndReplaceDOMText(this, {
                        find: eval(exp),
                        replace: '$1<hanla>$2'
                    })
                }, this)

               findAndReplaceDOMText(this, {
                    find: '<hanla>',
                    replace: function(){
                        return document.createElement('hanla')
                    }
                })

               this.normalize()

                $('* > hanla:first-child').parent().each(function(){
                    if ( this.firstChild.nodeType == 1 ) {
                        $(this).before( $('<hanla/>') )
                        $(this).find('hanla:first-child').remove()
                    }
                })
            })



        /* 
         * 修正相鄰註記元素`<u>`的底線相連問題
         * ---
         * fixing the underline-adjacency issue on `<u>` element
         *
         */

        if ( $('html').hasClass('han-lab-underline') )
            $(range).find('u').charize({'bitouwei': false}, true, true)

        $(range).find('u, ins').each(function(){
            var next = this.nextSibling

            while ( next != null && ( next.nodeName === "WBR" || next.nodeType == 8 ))
                next = next.nextSibling

            $(next).filter('u, ins').addClass('adjacent')
        })



        /* 強調元素`<em>`的着重號
         * ---
         * punctuation: CJK emphasis dots on `<em>` element
         *
         */

        $(range).find('em').charize({
            latin: ( tests['textemphasis']() ) ? 'none' : 'individual'
        })
    },



    unicode_set = function( set ) {
        var join = ( set.match(/[hanzi|latin]/) ) ? true : false,
        result = ( join ) ? unicode[set].join('|') : unicode[set]

        return result
    },


    _span = function( className ) {
        var span = document.createElement('span')
        span.className = className

        return span
    },


    _copy = function() {
        return $(document.createElement('copy'))
    },


    _apply_annotation = function( node ) {
        $(node).find('rbc').find('rb')
        .each(function(i){
            $(this).attr('index', i)
        })

        $(node).find('rtc:not(.zhuyin)')
        .hide()
        .each(function(t){
            var c = 0,
                rtc = $(this),
                rbc = $(this).prevAll('rbc'),
                len = $(this).find('rt').length || $(this).nextAll('rt').length,
                data = []

            $(this).find('rt')
            .each(function(h){
                var anno     = $(this).html(),
                    rbspan     = $(this).attr('rbspan') || 1,
                    i        = c

                c += Number(rbspan)

                data[h] = {
                    'annotation': anno,
                    'order': (t==0) ? '1' : '2'
                }

                for ( var j=i; j<c; j++ ) {
                    rbc.find('rb[index]')
                    .eq(j).attr({ 'set': h })
                }
            })

            $(this).nextAll('rt')
            .each(function(h){
                var anno     = $(this).html(),
                    rbspan     = $(this).attr('rbspan') || 1,
                    i        = c

                c += Number(rbspan)

                data[h] = {
                    'annotation': anno,
                    'order': (t==0) ? '1' : '2'
                }

                for ( var j=i; j<c; j++ ) {
                    rbc.find('rb[index]')
                    .eq(j).attr({ 'set': h })
                }
            })

            rbc.find('rb[annotation]')
            .each(function(){
                var rb = $(this).find('rb[index]'),
                    first = rb.filter(':first-child').attr('set'),
                    last = rb.filter(':last-child').attr('set')

                if ( first === last ) {
                    rb.removeAttr('set')
                    $(this).attr('set', first)
                }
            })

            for ( var k=0; k<len; k++ ) {
                rbc
                .find('rb[set='+ k +']')
                .wrapAll(
                    $('<rb/>')
                    .attr( data[k] )
                )
            }
        })
        .remove()

        $(node).find('rb')
        .removeAttr('set index')
        .filter('rb[annotation]')
        .each(function(){
            var t = $(this).attr('annotation')
            $(this).after( _copy().html( t ) )
        })
    },


    _get_zhuyin_font = function( node ) {
        var reg = /(sans-serif|monospace)$/,
            generic = $(node).css('font-family'),
            font = generic.match(reg) ? 'sans' : 'serif'
        
        return font
    },


    _apply_zhuyin = function( node, rb ) {
        var sm         = unicode['zhuyin']['shengmu'],
            jy         = unicode['zhuyin']['jieyin'],
            ym         = unicode['zhuyin']['yunmu'],
            yj         = unicode['zhuyin']['yunjiao'],
            tone     = unicode['zhuyin']['diao'],

            prev, text, zi,
            zy = $(node).html(),
            yin, diao, form, length, data

        form =     ( zy.match(eval('/(' + sm + ')/')) ) ? 'shengmu' : ''
        form += ( zy.match(eval('/(' + jy + ')/')) ) ? (( form !== '' ) ? '-' : '') + 'jieyin' : ''
        form += ( zy.match(eval('/(' + ym + ')/')) ) ? (( form !== '' ) ? '-' : '') + 'yunmu' : ''

        yin = zy
            .replace(eval('/(' + tone + ')/g'), '')
            .replace(eval('/(' + yj + '[\u0358\u030d]?)/g'), '')

        length = (yin) ? yin.length : 0

        diao =     ( zy.match(/(\u02D9)/) )                     ? '\u02D9' : 
                ( zy.match(/(\u02CA)/) )                     ? '\u02CA' : 
                ( zy.match(/([\u02C5\u02C7])/) )             ? '\u02C7' :
                ( zy.match(/(\u02CB)/) )                     ? '\u02CB' : 
                ( zy.match(/(\u02EA)/) )                     ? '\u02EA' : 
                ( zy.match(/(\u02EB)/) )                     ? '\u02EB' : 
                ( zy.match(/(\u31B4[\u0358\u030d])/) )         ? '\u31B4\u0358' : 
                ( zy.match(/(\u31B5[\u0358\u030d])/) )         ? '\u31B5\u0358' :
                ( zy.match(/(\u31B6[\u0358\u030d])/) )         ? '\u31B6\u0358' :
                ( zy.match(/(\u31B7[\u0358\u030d])/) )         ? '\u31B7\u0358' :
                ( zy.match(/(\u31B4)/) )                     ? '\u31B4' : 
                ( zy.match(/(\u31B5)/) )                     ? '\u31B5' :
                ( zy.match(/(\u31B6)/) )                     ? '\u31B6' :
                ( zy.match(/(\u31B7)/) )                     ? '\u31B7' : ''

        data = {
            'zhuyin': zy,
            'yin': yin,
            'diao': diao,
            'length': length,
            'form': form
        }

        if ( rb )
            rb
            .attr(data)
            .append( _copy().html( zy ) )
        else {
            prev = node.previousSibling
            text = prev.nodeValue.split('')
            zi = text.pop()
            prev.nodeValue = text.join('')

            $(node)
            .before( 
                $('<rb/>')
                .attr(data)
                .text( zi )
            )
            .replaceWith( _copy().html( zy ) )
        }
    },


    findAndReplaceDOMText = function( a, b ) {
        var b = b

        b.filterElements = function( el ) {
            var name = el.nodeName.toLowerCase(),
                classes = ( el.nodeType == 1 ) ? el.getAttribute('class') : '',
                charized = ( classes && classes.match(/han-js-charized/) != null ) ? true : false

            return name !== 'style' && name !== 'script' && !charized
        }

        return window.findAndReplaceDOMText(a,b)
    },


    inject_element_with_styles = function( rule, callback, nodes, testnames ) {
        var style, ret, node, docOverflow,
    
            docElement = document.documentElement,
            div = document.createElement('div'),
            body = document.body,
            fakeBody = body || document.createElement('body')

    
        style = ['<style id="han-support">', rule, '</style>'].join('')
    
        ;(body ? div : fakeBody).innerHTML += style
        fakeBody.appendChild(div)
    
        if ( !body ) {
            fakeBody.style.background = ''
            fakeBody.style.overflow = 'hidden'
            docOverflow = docElement.style.overflow
            docElement.style.overflow = 'hidden'
            docElement.appendChild(fakeBody)
        }
    
        ret = callback(div, rule)
    
        if ( !body ) {
            fakeBody.parentNode.removeChild(fakeBody)
            docElement.style.overflow = docOverflow
        } else
            div.parentNode.removeChild(div)
    
        return !!ret
    },


    write_on_canvas = function( text, font ) {
        var canvasNode = document.createElement('canvas')
        canvasNode.width = '50'
        canvasNode.height = '20'

        canvasNode.style.display = 'none'
        canvasNode.className = 'han_support_tests'
        document.body.appendChild(canvasNode)
        var ctx = canvasNode.getContext('2d')

        ctx.textBaseline = 'top'
        ctx.font = '15px ' + font + ', sans-serif'
        ctx.fillStyle = 'black'
        ctx.strokeStyle = 'black'

        ctx.fillText( text, 0, 0 )

        return ctx
    },


    test_for_fontface = function( test, compare, zi ) {
        if ( !tests['fontface']() )
            return false

        var test = test,
            compare = compare || 'sans-serif',
            zi = zi || '辭Q'

        try {
            var sans = write_on_canvas( zi, compare ),
                test = write_on_canvas( zi, test ),
                support

            for (var j=1; j<=20; j++) {
                for (var i=1; i<=50; i++) {
                    var sansData = sans.getImageData(i, j, 1, 1).data,
                        testData = test.getImageData(i, j, 1, 1).data,

                        alpha = []

                    alpha['sans'] = sansData[3]
                    alpha['test'] = testData[3]

                    if ( support !== 'undefined' && alpha['test'] != alpha['sans'] )
                        support = true
                    else if ( support )
                        break
                    if ( i == 20 && j == 20 && !support )
                        support = false
                }
            }

            $('canvas.han_support_tests').remove()
            return support
        } catch ( err ) {
            return false
        }
    }


    test_for_unicoderange = function() {
        return !test_for_fontface( 'han-unicode-range', 'Arial, "Droid Sans"', 'a' )
    }


    /**
     * --------------------------------------------------------
     * Unicode區段說明（6.2.0）
     * Unicode blocks
     * --------------------------------------------------------
     * 或參考：
     * http://css.hanzi.co/manual/api/javascript_jiekou-han.unicode
     * --------------------------------------------------------
     *
     ** 以下歸類為「拉丁字母」（`unicode('latin')`）**
     *
     * 基本拉丁字母：a-z
     * 阿拉伯數字：0-9
     * 拉丁字母補充-1：[\u00C0-\u00FF]
     * 拉丁字母擴展-A區：[\u0100-\u017F]
     * 拉丁字母擴展-B區：[\u0180-\u024F]
     * 拉丁字母附加區：[\u1E00-\u1EFF]
     *
     ** 符號：[~!@#&=_\$\%\^\*\-\+\,\.\/(\\)\?\:\'\"\[\]\(\)'"<>‘“”’]
     *
     * --------------------------------------------------------
     *
     ** 以下歸類為「漢字」（`unicode（'hanzi')`）**
     *
     * CJK一般：[\u4E00-\u9FFF]
     * CJK擴展-A區：[\u3400-\u4DB5]
     * CJK擴展-B區：[\u20000-\u2A6D6]
     * CJK Unicode 4.1：[\u9FA6-\u9FBB]、[\uFA70-\uFAD9]
     * CJK Unicode 5.1：[\u9FBC-\u9FC3]
     * CJK擴展-C區：[\u2A700-\u2B734]
     * CJK擴展-D區：[\u2B740-\u2B81D]（急用漢字）
     * CJK擴展-E區：[\u2B820-\u2F7FF]（**註**：暫未支援）
     * CJK擴展-F區（**註**：暫未支援）
     * CJK筆畫區：[\u31C0-\u31E3]
     * 數字「〇」：[\u3007]
     * 日文假名：[\u3040-\u309E][\u30A1-\u30FA][\u30FD\u30FE]（**註**：排除片假名中點、長音符）
     *
     * CJK相容表意文字：
     * [\uF900-\uFAFF]（**註**：不使用）
     * [\uFA0E-\uFA0F\uFA11\uFA13-\uFA14\uFA1F\uFA21\uFA23-\uFA24\uFA27-\uFA29]（**註**：12個例外）
     * --------------------------------------------------------
     *
     ** 符號
     * [·・︰、，。：；？！—⋯…．·「『（〔【《〈“‘」』）〕】》〉’”–ー—]
     *
     ** 其他
     *
     * 漢語注音符號、擴充：[\u3105-\u312D][\u31A0-\u31BA]
     * 國語五聲調（三聲有二種符號）：[\u02D9\u02CA\u02C5\u02C7\u02CB]
     * 台灣漢語方言音擴充聲調：[\u02EA\u02EB]
     *
     */

    unicode['latin'] = [
        '[A-Za-z0-9\u00C0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]'
    ]

    unicode['punc'] = [
        '[@&=_\,\.\?\!\$\%\^\*\-\+\/]',
        '[\(\\[\'"<‘“]',
        '[\)\\]\'">”’]'
    ]

    unicode['hanzi'] = [
        '[\u4E00-\u9FFF]',
        '[\u3400-\u4DB5\u9FA6-\u9FBB\uFA70-\uFAD9\u9FBC-\u9FC3\u3007\u3040-\u309E\u30A1-\u30FA\u30FD\u30FE\uFA0E-\uFA0F\uFA11\uFA13-\uFA14\uFA1F\uFA21\uFA23-\uFA24\uFA27-\uFA29]',
        '[\uD840-\uD868][\uDC00-\uDFFF]|\uD869[\uDC00-\uDEDF]',
        '\uD86D[\uDC00-\uDF3F]|[\uD86A-\uD86C][\uDC00-\uDFFF]|\uD869[\uDF00-\uDFFF]',
        '\uD86D[\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1F]',
        '[\u31C0-\u31E3]'
    ]

    unicode['biaodian'] = [
        '[·・︰、，。：；？！—ー⋯…．·／]',
        '[「『（〔【《〈“‘]',
        '[」』）〕】》〉’”]'
=======
/**
 * Library Configuration
 */
require.config({
  paths: {
    findAndReplaceDOMText: [
      './lib/findAndReplaceDOMText.module'
>>>>>>> v3
    ]
  }
})

/**
 * Core
 */
define([
  './src/core',
  './src/regex',
  './src/find',
  './src/normalize',
  './src/typeface',
  './src/inline',
  './src/dom-ready',
  './src/global'
], function( Han ) {
return Han
})
