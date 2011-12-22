/* 漢字標準格式
 * Standard Han Format
 *
 * Version: 1.2
 * Lisence: MIT Lisence
 * Last Modified: 2011/12/22
 */


(function($){

var han = {
    js: function() {
        han.msie_html5();
        $(document).ready(function() {  han.init();  });
    },


    init: function( range, dectect ) {
        if ( !range && $("html").hasClass("no-han_init") )
            return;

        var hasFontSmoothing = han.support.font_smoothy,
            hasColumnWidth = han.support.column_width,
            hasTextEm = han.support.text_em,
            hasQuotes = han.support.quotes,
            hasWritingMode = han.support.writing_mode,
            dectector;

        if ( !range && dectect != false || range && dectect ) {
            dectector = "han-js " + han.conditions();
            dectector += " hasFontSmoothing-" + (( hasFontSmoothing ) ? "true" : ( hasFontSmoothing == false ) ? "false" : "unknown");
            dectector += " " + (( !hasColumnWidth ) ? "no-" : "") + "columnwidth";
            dectector += " " + (( !hasTextEm ) ? "no-" : "") + "textemphasis";
            dectector += " " + (( !hasQuotes ) ? "no-" : "") + "quotes";
            dectector += " " + (( !hasWritingMode ) ? "no-" : "") + "writingmode";

            $(( !range ) ? "html" : range).addClass(dectector);
        }


        var range = range || document;

        // punctuation: CJK emphasis dots for <em>
        $(range).find("em").each(function() {
            $(this).html( han.characterize($(this).html(), {
                cjk: ( hasTextEm ) ? "punctuation" : null,
                latin: ( hasTextEm ) ? "none" : "individual" })
            );
        });


        // punctuation: CJK quotes for <q>
        if ( !hasQuotes )
            $(range).find("q q").each(function() {
                if ( $(this).parents("q").length%2 != 0 )  $(this).addClass("double");
            });


        // <i>
        if ( $.browser.msie )
            $(range).find("i").each(function() {
                $(this).html( han.characterize($(this).html(), { cjk: "none", latin: "group" }) );
            });


        // <ruby>
        $(range).find("ruby.pinyin").addClass("romanization");
        $(range).find("ruby.zhuyin").addClass("mps");

        $(range).find("ruby").each(function() {
            if ( $(this).hasClass("mps") || !$.browser.webkit ) {
                  var html = $(this).html(),
                      result = html.replace(/<rt>/ig, '<span class="rt">').replace(/<\/rt>/ig, '</span></span><span class="rb">');

                $(this).html('<span class="rb">' + result + '</span>');
            }
        });

        if ( !$.browser.webkit )
            $("ruby.romanization .rt, ruby.mps-ltr .rt").each(function () {
                var width = [];
                width['rt'] = $(this).outerWidth();
                width['rb'] = $(this).parent("span.rb").outerWidth();
    
                $(this).css("min-width", width['rb']);
                $(this).parent("span.rb").css("min-width", width['rt']);
            });


        $("ruby.mps .rt").each(function () {
            /*var height = [];
            height['rt'] = $(this).height();
            height['rb'] = $(this).parent("span.rb").height();

            $(this).parent("span.rb").css("min-height", height['rt']);*/
            $(this).html(
                $(this).html()
                    .replace(/(˙)/ig, '<span class="tone tone-0">$1</span>')
                    .replace(/([ˊˇˋ])/ig, '<span class="tone">$1</span>')
            );
        });
    },


    characterize: function( content, glyph ) {
        var content = content + "<!---->",
            glyph = glyph || {};
            glyph = {
                cjk: glyph.cjk || "individual",
                latin: glyph.latin || "group",
                space: glyph.space || "individual"
            };

        // CJK
        if ( glyph.cjk === "individual" )
            content = content
            .replace(/([\u1100-\u11FF\u2030-\u217F\u2600-\u261B\u2620-\u277F\u2E80-\u2FDF\u2FF0-\u4DBF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF\uF900-\uFAFF\uFE30-\uFE4F\uFF00\uFF01\uFF03-\uFF06\uFF08-\uFF0C\uFF0E-\uFF19\uFF1F-\uFF3D\uFF40-\uFF5B\uFF5D-\uFFEF])(?=[^>]*<)/ig, '<span class="cjk">$1</span>')
            .replace(/<span class="cjk">([·・︰、，。：；？！—⋯．·])/ig, '<span class="cjk punc">$1')
            .replace(/<span class="cjk">([「『（〔【《〈“‘])/ig, '<span class="cjk punc open">$1')
            .replace(/<span class="cjk">([」』）〕】》〉’”])/ig, '<span class="cjk punc close">$1');

        else if ( glyph.cjk === "group" )
            content = content
            .replace(/([\u1100-\u11FF\u2030-\u217F\u2600-\u261B\u2620-\u277F\u2E80-\u2FDF\u2FF0-\u4DBF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF\uF900-\uFAFF\uFE30-\uFE4F\uFF00\uFF01\uFF03-\uFF06\uFF08-\uFF0C\uFF0E-\uFF19\uFF1F-\uFF3D\uFF40-\uFF5B\uFF5D-\uFFEF]+)(?=[^>]*<)/ig, '<span class="cjk">$1</span>');

        else if ( glyph.cjk === "punctuation" )
            content = content
            .replace(/([·・︰、，。：；？！—⋯．·])(?=[^>]*<)/ig, '<span class="cjk punc">$1</span>')
            .replace(/([「『（〔【《〈“‘])(?=[^>]*<)/ig, '<span class="cjk punc open">$1</span>')
            .replace(/([」』）〕】》〉’”])(?=[^>]*<)/ig, '<span class="cjk punc close">$1</span>');


        // Latin
        if ( glyph.latin === "individual" )
            content = content
            .replace(/([\u0020-\u003B\u003D\u003F-\u007F\u0100-\u017F\u0180-\u024F\u0300-\u036F\u1E00-\u1EFF\u2000-\u206F\u2070-\u209F\u20A0-\u20CF\u2100-\u214F\u2150-\u218F])(?=[^>]*<)/ig, '<span class="latin">$1</span>');

        else if ( glyph.latin === "group" )
            content = content
            .replace(/([\u0020-\u003B\u003D\u003F-\u007F\u0100-\u017F\u0180-\u024F\u0300-\u036F\u1E00-\u1EFF\u2000-\u206F\u2070-\u209F\u20A0-\u20CF\u2100-\u214F\u2150-\u218F]+)(?=[^>]*<)/ig, '<span class="latin">$1</span>');


        // spaces
        if ( glyph.space === "individual" )
            content = content
            .replace(/<span class="(\w+)">([\s])/ig, '<span class="$1 space">$2');

        return content;
    },


    msie_html5: function(tags) {
        // only execute when used in IE (<= 8)
        if ( $.browser.msie && $.browser.version <= 8 ) {
            // list of (known) HTML5 elements
            e = "abbr,article,aside,audio,canvas,datalist,details,dfn,eventsource,figure,footer,header,hgroup,mark,menu,meter,nav,output,progress,rp,rt,ruby,section,summary,time,video";
    
            // if tags is set, add them to the elements list
            if ( tags )  e += ',' + tags;
    
            e = e.split(',');
            i = e.length;
            // loop through the elements and add them to the DOM
            while (i--) {
                document.createElement(e[i]);
            }
        }
    },


    conditions: function( q ) {
        var appVersion = function( os ) {
                return (navigator.appVersion.indexOf(os) != -1) ? true : false;
            },

            os = (appVersion("Mac")) ? "mac" : (appVersion("X11")) ? "unix" : (appVersion("Linux")) ? "linux" : (appVersion("Win")) ? "win"  : "os-unknown";

            browser = ($.browser.mozilla) ? "mozilla" : ($.browser.opera) ? "opera" : ($.browser.webkit) ? "webkit" :
                ($.browser.msie && $.browser.version <= 7) ? "msie msie-old ie-" +  Math.floor($.browser.version) : ($.browser.msie && $.browser.version >= 8) ? "msie ie-"  + Math.floor($.browser.version) : "browser-unknown";

        return ( q === "os" ) ? os : ( q === "browser" ) ? browser : os + " " + browser;
    }
};


var a = $('<a href="/" style="display: none; text-emphasis: dot; -moz-text-emphasis: dot; -o-text-emphasis: dot; -webkit-text-emphasis: dot;">tester</a>'),
    q = $('<q style="display: none; quotes: \'“\' \'”\' \'‘\' \'’\'">tester</q>'),
    wm = $('<div style="display: none; column-width: 200px; -moz-column-width: 200px; -webkit-column-width: 200px; writing-mode: tb-rl; -webkit-writing-mode: vertical-rl; ">tester</div>')
    fs = function() {
    if ( han.conditions("os") === "mac" )  return true;

    // IE has screen.fontSmoothingEnabled - sweet!      
    if ( typeof (screen.fontSmoothingEnabled) !== "undefined" )
        return screen.fontSmoothingEnabled;  
    else {
        try {
            // Create a 35x35 Canvas block.
            var canvasNode = document.createElement("canvas");
            canvasNode.width = "35";
            canvasNode.height = "35";

            // We must put this node into the body, otherwise 
            // Safari Windows does not report correctly.
            canvasNode.style.display = "none";
            document.body.appendChild(canvasNode);
            var ctx = canvasNode.getContext("2d");

            // draw a black letter "O", 32px Arial.
            ctx.textBaseline = "top";
            ctx.font = "32px Arial";
            ctx.fillStyle = "black";
            ctx.strokeStyle = "black";

            ctx.fillText("O", 0, 0);

            // start at (8,1) and search the canvas from left to right,
            // top to bottom to see if we can find a non-black pixel.  If
            // so we return true.
            for (var j = 8; j <= 32; j++) {
                for (var i = 1; i <= 32; i++) {
                    var imageData = ctx.getImageData(i, j, 1, 1).data,
                        alpha = imageData[3];
          
                    if (alpha != 255 && alpha != 0 && alpha > 180)  return true;
                    // font-smoothing must be on.
                }
            }

            // didn't find any non-black pixels - return false.
            return false;
        }

        catch (ex) {
            // Something went wrong (for example, Opera cannot use the
            // canvas fillText() method.  Return null (unknown).
            return null;
        }
    }
};

han.support = {
    column_width: ( /^200px$/.test( wm.css("-webkit-column-width") ) ||
      /^200px$/.test( wm.css("-moz-column-width") ) ||
      /^200px$/.test( wm.css("column-width") ) ) ? true : false,

    font_smoothy: fs(),

    text_em: ( /^dot$/.test( a.css("-webkit-text-emphasis-style") ) ||
      /^dot$/.test( a.css("text-emphasis-style") ) ||
      /^dot$/.test( a.css("-moz-text-emphasis-style") ) ||
      /^dot$/.test( a.css("-o-text-emphasis-style") ) ) ? true : false,

    quotes: /^"“" "”" "‘" "’"$/.test( q.css("quotes") ),

    writing_mode: ( /^vertical-rl$/.test( wm.css("-webkit-writing-mode") )) ? true : false
};


han.js();

window.han = han.external = {
    applyTo: han.init,
    characterize: han.characterize,
    conditions: han.conditions,
    support: han.support
};

})(jQuery);
