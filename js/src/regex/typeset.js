define([
  './unicode'
], function( UNICODE ) {

  var
    TYPESET,

    // Whitespace characters
    // http://www.w3.org/TR/css3-selectors/#whitespace
    rWhite = '[\\x20\\t\\r\\n\\f]',

    rPtOpen = UNICODE.punct.open,
    rPtEnd = UNICODE.punct.end,
    rPtMid = UNICODE.punct.middle,
    rPt = rPtOpen + '|' + rPtEnd + '|' + rPtMid,

    rBdOpen = UNICODE.biaodian.open,
    rBdEnd = UNICODE.biaodian.end,
    rBdMid = UNICODE.biaodian.middle,
    rBd = rBdOpen + '|' + rBdEnd + '|' + rBdMid,

    rAllOpen = UNICODE.biaodian.open,
    rAllEnd = UNICODE.biaodian.end,
    rAllMid = UNICODE.biaodian.middle,
    rAll = rAllOpen + '|' + rAllEnd + '|' + rAllMid,

    rHan = UNICODE.hanzi.base + '|' + UNICODE.hanzi.desc + '|' + UNICODE.hanzi.radical,

    rCbn = UNICODE.ellinika.combine,
    rLatn = UNICODE.latin.base + rCbn + '*',
    rGk = UNICODE.ellinika.base + rCbn + '*',

    rCyCbn = UNICODE.kirillica.combine,
    rCy = UNICODE.kirillica.base + rCyCbn + '*',

    rAlph = rLatn + '|' + rGk + '|' + rCy,
    rChar = rHan + '|(' + rAlph + ')+'
  ;

  TYPESET = {
    /* Character-level selector (字級選擇器)
     */
    char: {
      biaodian: {
        all:   new RegExp( '(' + rBd + ')', 'g' ),
        open:  new RegExp( '(' + rBdOpen + ')', 'g' ),
        end:   new RegExp( '(' + rBdEnd + ')', 'g' )
      },

      hanzi: {
        individual: new RegExp( '(' + rHan + ')', 'g' ),
        group: new RegExp( '(' + rHan + ')+', 'g' )
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
      touwei:   new RegExp( '(' + rAllOpen + '+)(' + rChar + ')(' + rAllEnd + '+)', 'ig' ),
      tou:      new RegExp( '(' + rAllOpen + '+)(' + rChar + ')', 'ig' ),
      wei:      new RegExp( '(' + rChar + ')(' + rAllEnd + '+)', 'ig' ),
      middle:   new RegExp( '(' + rChar + ')(' + rAllMid + ')(' + rChar + ')', 'ig' )
    },

    /* Hanzi and Western mixed spacing (漢字西文混排間隙)
     * - Basic mode
     * - Strict mode
     */
    hws: {
      base: [
        new RegExp( '('+ rHan +')(' + rAlph + ')', 'ig' ),
        new RegExp( '('+ rAlph +')(' + rHan + ')', 'ig' )
      ],

      strict: [
        new RegExp( '('+ rHan +')' + rWhite + '*(' + rAlph + ')', 'ig' ),
        new RegExp( '('+ rAlph +')' + rWhite + '*(' + rHan + ')', 'ig' )
      ]
    }
  }
  return TYPESET
})
