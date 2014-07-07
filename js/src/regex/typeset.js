define([
  './unicode'
], function( UNICODE ) {

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

  return TYPESET
})
