define(function() {

var
  UNICODE = {
    /**
     * Western punctuation (西文標點符號)
     */
    punct: {
      base:   '[\u2010-\u2014\u2026,.;:!?\u203D_—]',
      middle: '[\\\/~\\-&]',
      open:   '[\'"‘“\\(\\[\u00A1\u00BF\u2E18\u00AB\u2039\u201A\u201C\u201E]',
      close:  '[\'"”’\\)\\]\u00BB\u203A\u201B\u201D\u201F]',
      end:    '[\'"”’\\)\\]\u00BB\u203A\u201B\u201D\u201F\u2010-\u2014\u2026,.;:!?\u203D_—…]',
    },

    /**
     * CJK biaodian (CJK標點符號)
     */
    biaodian: {
      base:   '[︰．、，。：；？！—ー…⋯]',
      middle: '[·・＼／]',
      open:   '[「『《〈（〔［｛【〖]',
      close:  '[」』》〉）〕］｝】〗]',
      end:    '[」』》〉）〕］｝】〗︰．、，。：；？！ー…⋯]'
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
     * 6. 附加區：[\u1E00-\u1EFF]
          Extended additional
     * 7. 拉丁字母變音組字符：[\u0300-\u0341]
          Combining diacritical marks
     */
    latin: {
      base:    '[A-Za-z0-9\u00C0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]',
      combine: '[\u0300-\u0341]'
    },

    /**
     * Elli̱niká (Greek) script blocks (希臘字母區段)
     *
     * 1. 希臘字母及擴展：[\u0370–\u03FF\u1F00-\u1FFF]
          Basic Greek & Greek Extended
     * 2. 阿拉伯數字：0-9
          Digits
     * 3. 希臘字母變音組字符：[\u0300-\u0341][\u0342-\u0345]
          Combining diacritical marks
     */
    ellinika: {
      base:    '[0-9\u0370-\u03FF\u1F00-\u1FFF]',
      combine: '[\u0300-\u0345]'
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
     * CJK-related blocks (CJK相關字符區段)
     *
     *  1. 中日韓統一表意文字：[\u4E00-\u9FFF]
           Basic CJK unified ideographs
     *  2. 擴展-A區：[\u3400-\u4DB5]
           Extended-A
     *  3. 擴展-B區：[\u20000-\u2A6D6]（[\uD840-\uD869][\uDC00-\uDED6]）
           Extended-B
     *  4. Unicode 4.1：[\u9FA6-\u9FBB]、[\uFA70-\uFAD9]
     *  5. Unicode 5.1：[\u9FBC-\u9FC3]
     *  6. 擴展-C區：[\u2A700-\u2B734]（\uD86D[\uDC00-\uDF3F]|[\uD86A-\uD86C][\uDC00-\uDFFF]|\uD869[\uDF00-\uDFFF]）
           Extended-C
     *  7. 擴展-D區：[\u2B740-\u2B81D]（急用漢字，\uD86D[\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1F]）
           Extended-D
     *  8. 擴展-E區：[\u2B820-\u2F7FF]（**註**：暫未支援）
           Extended-E (**note:** not supported yet)
     *  9. 擴展-F區（**註**：暫未支援）
           Extended-F (**note:** not supported yet)
     * 10. 筆畫區：[\u31C0-\u31E3]
           Strokes
     * 11. 表意數字「〇」：[\u3007]
           Ideographic number zero

     * 12. 相容表意文字：
           Compatibility ideograph
           http://zh.wikipedia.org/wiki/中日韓越統一表意文字#cite_note-1

           [\uF900-\uFAFF]（**註**：不使用）
           [\uFA0E-\uFA0F\uFA11\uFA13-\uFA14\uFA1F\uFA21\uFA23-\uFA24\uFA27-\uFA29]（**註**：12個例外）

     * 13. 日文假名：[\u3040-\u309F][\u30A1-\u30FA][\u30FD-\u30FF]（**註**：排除片假名中點、長音符）
           Japanese Kana (**note:** some symbols excluded)
     * 14. 康熙字典及簡化字部首：[\u2F00-\u2FD5\u2E80-\u2EF3]
           Kangxi and supplement radicals
     * 15. 表意文字描述字元：[\u2FF0-\u2FFA]
           Ideographic description characters
     */
    hanzi: {
      base:    '[\u4E00-\u9FFF\u3400-\u4DB5\u9FA6-\u9FBB\uFA70-\uFAD9\u9FBC-\u9FC3\u31C0-\u31E3\u3007\u3040-\u309F\u30A1-\u30FA\u30FD-\u30FF\uFA0E-\uFA0F\uFA11\uFA13-\uFA14\uFA1F\uFA21\uFA23-\uFA24\uFA27-\uFA29]|[\uD840-\uD868][\uDC00-\uDFFF]|\uD869[\uDC00-\uDEDF]|\uD86D[\uDC00-\uDF3F]|[\uD86A-\uD86C][\uDC00-\uDFFF]|\uD869[\uDF00-\uDFFF]|\uD86D[\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1F]',
      desc:    '[\u2FF0-\u2FFA]',
      radical: '[\u2F00-\u2FD5\u2E80-\u2EF3]'
    },

    /**
     * Zhuyin (注音符號, Mandarin & Dialect Phonetic Symbols)
     *
     * 1. 國語注音、方言音符號：[\u3105-\u312D][\u31A0-\u31BA]
          Bopomofo phonetic symbols
     * 2. 陰陽上去聲調號：[\u02D9\u02CA\u02C5\u02C7\u02CB] （**註：**三聲包含乙個不合規範的符號）
          Tones for Mandarin
     * 3. 方言音聲調號：[\u02EA\u02EB]
          Tones for other dialects
     * 4. 陰、陽入韻：[\u31B4-\u31B7][\u0358\u030d]?
          Checked tones
     */
    zhuyin: {
      base:    '[\u3105-\u312D\u31A0-\u31BA]',
      initial: '[\u3105-\u3119\u312A-\u312C\u31A0-\u31A3]',
      medial:  '[\u3127-\u3129]',
      final:   '[\u311A-\u3126\u312D\u31A4-\u31B3\u31B8-\u31BA]',
      tone:    '[\u02D9\u02CA\u02C5\u02C7\u02CB\u02EA\u02EB]',
      ruyun:   '[\u31B4-\u31B7][\u0358\u030d]?'
    }
  }
;

return UNICODE
})
