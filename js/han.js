(function ($) {

    // MSIE HTML5 elements fixer
    msie_html5();


    $(document).ready(function () {
        var cond = condtions() + " ",
            // conditions: OS and browser

            smoothyType = type_smoothing();
            // type_smoothing

        $("html")
        .addClass("han-js " + cond + "hasFontSmoothing-" + (( smoothyType ) ? "true" : 
            ( smoothyType == false ) ? "false" : "unknown")
        );

		
	// punctuation: CJK emphasis dots
        $("em").each(function () {
            $(this).html( cjk_spanify($(this).html() + "<!---->") );
        });


        // <q>
        if ( $.browser.webkit )
            $("q").each(function () {
                if ( $(this).parents("q").length%2 != 0 )
                    $(this).addClass("double");
            });


        // <ruby>
        $("ruby").each(function () {
            if ( $(this).hasClass("mps") || !$.browser.webkit ) {
                  var html = $(this).html(),
                      result = ( !$.browser.msie ) ?
                      html.replace(/<\/rt>/ig, '</rt></span><span class="rb">') :
                      html.replace(/<rt>/ig, '<span class="rt">').replace(/<\/rt>/ig, '</span></span><span class="rb">');

                $(this).html('<span class="rb">' + result + '</span>');
            }
        });

        if ( !$.browser.webkit )
            $("ruby.romanization rt, ruby.mps-ltr rt, ruby.romanization .rt, ruby.mps-ltr .rt").each(function () {
                var width = [];
                width['rt'] = $(this).width();
                width['rb'] = $(this).parent("span.rb").width();
    
                $(this).css("min-width", width['rb']);
                $(this).parent("span.rb").css("min-width", width['rt']);
            });

        $("ruby.mps rt, ruby.mps .rt").each(function () {
            var height = [];
            height['rt'] = $(this).height();
            //height['rb'] = $(this).parent("span.rb").height();

            $(this).parent("span.rb").css("min-height", height['rt']);

            $(this).html(
                $(this).html()
                    .replace(/(˙)/ig, '<span class="tone tone-0">$1</span>')
                    .replace(/([ˊˇˋ])/ig, '<span class="tone">$1</span>')
            );
        });

    });


/* Functions */
function condtions ( q ) {
    var os = (navigator.appVersion.indexOf("Mac") != -1) ? "mac" :
        (navigator.appVersion.indexOf("X11") != -1) ? "unix" :
        (navigator.appVersion.indexOf("Linux") != -1) ? "linux" :
        (navigator.appVersion.indexOf("Win") != -1) ? "win" : "os-unknown",

        browser = ($.browser.mozilla) ? "mozilla" :
        ($.browser.opera) ? "opera" :
        ($.browser.webkit) ? "webkit" :
        ($.browser.msie && $.browser.version <= 7) ? "msie msie-old" :
        ($.browser.msie && $.browser.version >= 8) ? "msie" : "browser-unknown";

    return ( q === "os" ) ?
        os : ( q === "browser" ) ? browser : os + " " + browser;
};


// MSIE HTML5 elements fix
// Copyright (c) 2010 Johan de Jong <http://johan.notitia.nl>
// Creative Commons Attribution-Share Alike 3.0
// http://creativecommons.org/licenses/by-sa/3.0/
function msie_html5 ( tags ) {
    // only execute when used in IE
    if ( $.browser.msie && $.browser.version <= 8 ) {
        // list of (known) HTML5 elements
        e = "abbr,article,aside,audio,canvas,datalist,details,eventsource,figure,footer,header,hgroup,mark,menu,meter,nav,output,progress,rp,rt,ruby,section,summary,time,video";

        // if tags is set, add them to the elements list
        if ( tags )  e += ',' + tags;

        e = e.split(',');
        i = e.length;
        // loop through the elements and add them to the DOM
        while (i--) {
            document.createElement(e[i]);
        }
    }
};


function cjk_spanify ( html, glyph ) {
    if ( glyph === "cjk" || !glyph )
        html = html
            .replace(/([\u1100-\u11FF\u2030-\u217F\u2600-\u261B\u2620-\u277F\u2E80-\u2FDF\u2FF0-\u4DBF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7AF\uD7B0-\uD7FF\uF900-\uFAFF\uFE30-\uFE4F\uFF00\uFF01\uFF03-\uFF06\uFF08-\uFF0C\uFF0E-\uFF19\uFF1F-\uFF3D\uFF40-\uFF5B\uFF5D-\uFFEF])(?=[^>]*<)/ig, '<span class="cjk">$1</span>')
            // CJK
            .replace(/<span class="cjk">([·・︰、，。：；？！—⋯．·])/ig, '<span class="cjk punc">$1')
            // CJK punctuation
            .replace(/<span class="cjk">([「『（〔【《〈“‘])/ig, '<span class="cjk punc open">$1')
            // CJK punctuation (open bracket/quote)
            .replace(/<span class="cjk">([」』）〕】》〉’”])/ig, '<span class="cjk punc close">$1')
            // CJK punctuation (close bracket/quote)

    if ( glyph === "latin" || !glyph )
        html = html
            .replace(/([\u0020-\u003B\u003D\u003F-\u007F\u0100-\u017F\u0180-\u024F\u0300-\u036F\u1E00-\u1EFF\u2000-\u206F\u2070-\u209F\u20A0-\u20CF\u2100-\u214F\u2150-\u218F]+)(?=[^>]*<)/ig, '<span class="latin">$1</span>')
            // Latin

    return html;
};



// TypeHelpers version 1.0
// by Zoltan Hawryluk
// https://gist.github.com/283689
function type_smoothing () {
    // IE has screen.fontSmoothingEnabled - sweet!      
    if ( typeof (screen.fontSmoothingEnabled) !== "undefined" )
        return screen.fontSmoothingEnabled;  
    else {
        try {
            // Create a 35x35 Canvas block.
            var canvasNode = document.createElement("canvas");
            canvasNode.width = "35";
            canvasNode.height = "35"

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
          
                    if (alpha != 255 && alpha != 0 && alpha > 180)
                        return true; // font-smoothing must be on.
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

})(jQuery);

