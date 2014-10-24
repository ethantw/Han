
- [中文版](https://github.com/ethantw/Han)
- <b>English version</b>


Han.css
=======

Han.css is a Sass/JavaScript typesetting framework, which features style normalisation to semantic elements, typography and advanced typesetting. Its elegant, standardised Hanzi (CJK) environment provides not only the legacy of reading convention but also the de facto specification in the digital. Han.css is the solution to Hanzi web design for the time being.

Han.css supports Traditional Chinese, Simplified Chinese and Japanese.

[View the test pages (zh) →]
(http://ethantw.github.io/Han/latest/)

## Installation
- NPM `npm install --save han-css`
- Bower `bower install --save Han`
- Component `component install ethantw/Han`

### Customisation
Han.css provides plenty of customisable features. By variable configuration or module import, it is easy to compile projects own style sheets. [Check out the manual][manual] for more detailed information.

[manual]: http://css.hanzi.co/manual/

### Use of CDN
For high-speed downloads and cache, in need of customisation otherwise, you can use the CDN style sheets, JavaScript files and web fonts compiled by default configuration. The service [is hosted on cdnjs.com][cdnjs].

[cdnjs]: http://cdnjs.com/libraries/han

````html
<link rel="stylesheet" media="all" href="//cdnjs.cloudflare.com/ajax/libs/Han/3.0.0/han.min.css">
````

JavaScript,

````html
<script src="//cdnjs.cloudflare.com/ajax/libs/Han/3.0.0/han.min.js"></script>
````

Web fonts,

- WOFF `//cdnjs.cloudflare.com/ajax/libs/Han/3.0.0/font/han.woff`
- OTF `//cdnjs.cloudflare.com/ajax/libs/Han/3.0.0/font/han.otf`

## How to use

1. Include `han.min.css` before all other styles (or import it in Sass).
2. Include script file, `han.min.js`, according to own requirements. Then add the class name `han-init` onto `<html>` tag to activate DOM-ready rendering.
3. Or, customise your own rendering routine. [Check out the manual][manual] for further information.

### JavaScript is optional
Han.css is of low coupling and high semantics. Style sheets and JavaScript depend *little* on each other. Multi-level fallback can be applied within the style sheets, hence the optional use of the scripts.

### Issue of overwriting styles
Different from most of the CSS frameworks, Han.css contains numerous style correction aiming at the language attribute `:lang`. It may cause unexpected results such as style overwritting not carried out.

#### Element types with language-based style correction:
- <i>Text-level semantics</i>
- <i>Grouping content</i> and combining situations with <i>sections</i> **(font-family only)**
- The <i>root</i> element `html` **(font-family only)**

#### Solution
In order to handle these circumstances properly, please be well-alarmed with rules of style inheritance. It is recommended to add the corresponding language attribute, parental elements or other selectors, rather to overuse the `!important` declaration for maintainability.

Use the ‘DOM Inspector’ in browsers to observe the inheritance and overwritten relations of style sheets while in need.

## Browser support

- Google Chrome (latest)
- Mozilla Firefox (latest)
- Opera Next (latest)
- Apple Safari 7+
- Internet Explorer 10+

* * *
Han.css v3.0.0  
Last-modified: 2014-10-23 04:20 (GMT+8)
