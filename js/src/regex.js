define([
  './core',
  './regex/unicode',
  './regex/typeset'
], function( Han, UNICODE, TYPESET ) {

Han.UNICODE = UNICODE
Han.TYPESET = TYPESET

// Aliases
Han.UNICODE.greek = Han.UNICODE.ellinika
Han.UNICODE.cyrillic = Han.UNICODE.kirillica
Han.UNICODE.cjk = Han.UNICODE.hanzi
Han.UNICODE.hangul = Han.UNICODE.eonmun

// Lock the regex objects to prevent from furthur
// modification.
Object.freeze( Han.UNICODE )
Object.freeze( Han.TYPESET )

return Han
})
