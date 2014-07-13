define([
  './core',
  './regex/unicode',
  './regex/typeset'
], function( Han, UNICODE, TYPESET ) {

Han.UNICODE = UNICODE
Han.TYPESET = TYPESET

// Aliases
Han.UNICODE.cjk      = Han.UNICODE.hanzi
Han.UNICODE.greek    = Han.UNICODE.ellinika
Han.UNICODE.cyrillic = Han.UNICODE.kirillica
Han.UNICODE.hangul   = Han.UNICODE.eonmun

Han.TYPESET.char.cjk               = Han.TYPESET.char.hanzi
Han.TYPESET.char.alphabet.greek    = Han.TYPESET.char.alphabet.ellinika
Han.TYPESET.char.alphabet.cyrillic = Han.TYPESET.char.alphabet.kirillica
Han.TYPESET.char.alphabet.hangul   = Han.TYPESET.char.alphabet.eonmun

// Lock the regex objects to prevent from furthur
// modification.
Object.freeze( Han.UNICODE )
Object.freeze( Han.TYPESET )

return Han
})
