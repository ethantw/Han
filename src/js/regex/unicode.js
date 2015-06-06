define(function() {

var UNICODE = {
  /**
   * Western punctuation (西文標點符號)
   */
  punct: {
    base:   '[\u2026,.;:!?\u203D_]',
    sing:   '[\u2010-\u2014\u2026]',
    middle: '[\\\/~\\-&\u2010-\u2014_]',
    open:   '[\'"‘“\\(\\[\u00A1\u00BF\u2E18\u00AB\u2039\u201A\u201C\u201E]',
    close:  '[\'"”’\\)\\]\u00BB\u203A\u201B\u201D\u201F]',
    end:    '[\'"”’\\)\\]\u00BB\u203A\u201B\u201D\u201F\u203C\u203D\u2047-\u2049,.;:!?]',
  },

  /**
   * CJK biaodian (CJK標點符號)
   */
  biaodian: {
    base:   '[︰．、，。：；？！ー]',
    liga:   '[—…⋯]',
    middle: '[·＼／－゠\uFF06\u30FB\uFF3F]',
    open:   '[「『《〈（〔［｛【〖]',
    close:  '[」』》〉）〕］｝】〗]',
    end:    '[」』》〉）〕］｝】〗︰．、，。：；？！ー]'
  },

  /**
   * CJK-related blocks (CJK相關字符區段)
   *
   *  1. 中日韓統一意音文字：[\u4E00-\u9FFF]
         Basic CJK unified ideographs
   *  2. 擴展-A區：[\u3400-\u4DB5]
         Extended-A
   *  3. 擴展-B區：[\u20000-\u2A6D6]（[\uD840-\uD869][\uDC00-\uDED6]）
         Extended-B
   *  4. 擴展-C區：[\u2A700-\u2B734]（\uD86D[\uDC00-\uDF3F]|[\uD86A-\uD86C][\uDC00-\uDFFF]|\uD869[\uDF00-\uDFFF]）
         Extended-C
   *  5. 擴展-D區：[\u2B740-\u2B81D]（急用漢字，\uD86D[\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1F]）
         Extended-D
   *  6. 擴展-E區：[\u2B820-\u2F7FF]（暫未支援）
         Extended-E (not supported yet)
   *  7. 擴展-F區（暫未支援）
         Extended-F (not supported yet)
   *  8. 筆畫區：[\u31C0-\u31E3]
         Strokes
   *  9. 意音數字「〇」：[\u3007]
         Ideographic number zero
   * 10. 相容意音文字及補充：[\uF900-\uFAFF][\u2F800-\u2FA1D]（不使用）
         Compatibility ideograph and supplement (not supported)

         12 exceptions:
         [\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]

         https://zh.wikipedia.org/wiki/中日韓統一表意文字#cite_note-1

   * 11. 康熙字典及簡化字部首：[\u2F00-\u2FD5\u2E80-\u2EF3]
         Kangxi and supplement radicals
   * 12. 意音文字描述字元：[\u2FF0-\u2FFA]
         Ideographic description characters
   */
  hanzi: {
    base:    '[\u4E00-\u9FFF\u3400-\u4DB5\u31C0-\u31E3\u3007\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\uD800-\uDBFF][\uDC00-\uDFFF]',
    desc:    '[\u2FF0-\u2FFA]',
    radical: '[\u2F00-\u2FD5\u2E80-\u2EF3]'
  },

  /**
   * Latin script blocks (拉丁字母區段)
   *
   * 1. 基本拉丁字母：A-Za-z
        Basic Latin
   * 2. 阿拉伯數字：0-9
        Digits
   * 3. 補充-1：[\u00C0-\u00FF]
        Latin-1 supplement
   * 4. 擴展-A區：[\u0100-\u017F]
        Extended-A
   * 5. 擴展-B區：[\u0180-\u024F]
        Extended-B
   * 5. 擴展-C區：[\u2C60-\u2C7F]
        Extended-C
   * 5. 擴展-D區：[\uA720-\uA7FF]
        Extended-D
   * 6. 附加區：[\u1E00-\u1EFF]
        Extended additional
   * 7. 變音組字符：[\u0300-\u0341\u1DC0-\u1DFF]
        Combining diacritical marks
   */
  latin: {
    base:    '[A-Za-z0-9\u00C0-\u00FF\u0100-\u017F\u0180-\u024F\u2C60-\u2C7F\uA720-\uA7FF\u1E00-\u1EFF]',
    combine: '[\u0300-\u0341\u1DC0-\u1DFF]'
  },

  /**
   * Elli̱niká (Greek) script blocks (希臘字母區段)
   *
   * 1. 希臘字母及擴展：[\u0370–\u03FF\u1F00-\u1FFF]
        Basic Greek & Greek Extended
   * 2. 阿拉伯數字：0-9
        Digits
   * 3. 希臘字母變音組字符：[\u0300-\u0345\u1DC0-\u1DFF]
        Combining diacritical marks
   */
  ellinika: {
    base:    '[0-9\u0370-\u03FF\u1F00-\u1FFF]',
    combine: '[\u0300-\u0345\u1DC0-\u1DFF]'
  },

  /**
   * Kirillica (Cyrillic) script blocks (西里爾字母區段)
   *
   * 1. 西里爾字母及補充：[\u0400-\u0482\u048A-\u04FF\u0500-\u052F]
        Basic Cyrillic and supplement
   * 2. 擴展B區：[\uA640-\uA66E\uA67E-\uA697]
        Extended-B
   * 3. 阿拉伯數字：0-9
        Digits
   * 4. 西里爾字母組字符：[\u0483-\u0489\u2DE0-\u2DFF\uA66F-\uA67D\uA69F]（位擴展A、B區）
        Cyrillic combining diacritical marks (in extended-A, B)
   */
  kirillica: {
    base:    '[0-9\u0400-\u0482\u048A-\u04FF\u0500-\u052F\uA640-\uA66E\uA67E-\uA697]',
    combine: '[\u0483-\u0489\u2DE0-\u2DFF\uA66F-\uA67D\uA69F]'
  },

  /**
   * Kana (假名)
   *
   * 1. 日文假名：[\u30A2\u30A4\u30A6\u30A8\u30AA-\u30FA\u3042\u3044\u3046\u3048\u304A-\u3094\u309F\u30FF]
        Japanese Kana
   * 2. 假名補充[\u1B000\u1B001]（\uD82C[\uDC00-\uDC01]）
        Kana supplement
   * 3. 日文假名小寫：[\u3041\u3043\u3045\u3047\u3049\u30A1\u30A3\u30A5\u30A7\u30A9\u3063\u3083\u3085\u3087\u308E\u3095\u3096\u30C3\u30E3\u30E5\u30E7\u30EE\u30F5\u30F6\u31F0-\u31FF]
        Japanese small Kana
   * 4. 假名組字符：[\u3099-\u309C]
        Kana combining characters
   * 5. 半形假名：[\uFF66-\uFF9F]
        Halfwidth Kana
   * 6. 符號：[\u309D\u309E\u30FB-\u30FE]
        Marks
   */
  kana: {
    base:    '[\u30A2\u30A4\u30A6\u30A8\u30AA-\u30FA\u3042\u3044\u3046\u3048\u304A-\u3094\u309F\u30FF]|\uD82C[\uDC00-\uDC01]',
    small:   '[\u3041\u3043\u3045\u3047\u3049\u30A1\u30A3\u30A5\u30A7\u30A9\u3063\u3083\u3085\u3087\u308E\u3095\u3096\u30C3\u30E3\u30E5\u30E7\u30EE\u30F5\u30F6\u31F0-\u31FF]',
    combine: '[\u3099-\u309C]',
    half:    '[\uFF66-\uFF9F]',
    mark:    '[\u30A0\u309D\u309E\u30FB-\u30FE]'
  },

  /**
   * Eonmun (Hangul, 諺文)
   *
   * 1. 諺文音節：[\uAC00-\uD7A3]
        Eonmun (Hangul) syllables
   * 2. 諺文字母：[\u1100-\u11FF\u314F-\u3163\u3131-\u318E\uA960-\uA97C\uD7B0-\uD7FB]
        Eonmun (Hangul) letters
   * 3. 半形諺文字母：[\uFFA1-\uFFDC]
        Halfwidth Eonmun (Hangul) letters
   */
  eonmun: {
    base:    '[\uAC00-\uD7A3]',
    letter:  '[\u1100-\u11FF\u314F-\u3163\u3131-\u318E\uA960-\uA97C\uD7B0-\uD7FB]',
    half:    '[\uFFA1-\uFFDC]'
  },

  /**
   * Zhuyin (注音符號, Mandarin & Dialect Phonetic Symbols)
   *
   * 1. 國語注音、方言音符號：[\u3105-\u312D][\u31A0-\u31BA]
        Bopomofo phonetic symbols
   * 2. 平上去聲調號：[\u02D9\u02CA\u02C5\u02C7\u02EA\u02EB\u02CB] （**註：**國語三聲包含乙個不合規範的符號）
        Level, rising, departing tones
   * 3. 入聲調號：[\u31B4-\u31B7][\u0358\u030d]?
        Checked (entering) tones
   */
  zhuyin: {
    base:    '[\u3105-\u312D\u31A0-\u31BA]',
    initial: '[\u3105-\u3119\u312A-\u312C\u31A0-\u31A3]',
    medial:  '[\u3127-\u3129]',
    final:   '[\u311A-\u3129\u312D\u31A4-\u31B3\u31B8-\u31BA]',
    tone:    '[\u02D9\u02CA\u02C5\u02C7\u02CB\u02EA\u02EB]',
    checked: '[\u31B4-\u31B7][\u0358\u030d]?'
  }
}

return UNICODE
})
