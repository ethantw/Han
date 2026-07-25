---
name: cjk-jako-translation
description: >-
  Authoritative house style for translating Chinese (zh) UI / marketing / editorial copy into Japanese (ja) and Korean (ko) for hanzi.pro properties. Japanese uses である体 (plain literary); Korean uses 漢諺混寫體 (Sino-Korean written as hanja + hangul-reading ruby) in 해라체 (plain declarative). Use whenever writing, reviewing, or filling `ja` / `ko` fields in i18n blocks, homepage copy, docs, demos, or any zh→ja / zh→ko translation. Triggers: "翻譯成日文／韓文", "translate to Japanese/Korean", 日韓翻譯, 漢諺混寫, である体, 해라체, filling `ja:` / `ko:` keys, any x-i18n / locale copy that still holds Chinese placeholder text. Pairs with the `ruby-markup` skill, which governs the mechanical `<ruby>` markup this style emits.
---

# JA / KO Translation House Style (hanzi.pro)

House rules for turning Chinese source copy into **Japanese** and **Korean** across hanzi.pro properties (han.css homepage, docs, demos). Origin: the 太陽中文報 i18n effort (`han-stock/next/ssr-demo/docs/plans/i18n-ja-ko.md`, now obsolete as a plan but kept as the style seed); refined by the han.css homepage translation.

**Relationship to `ruby-markup`.** This skill decides *what words become ruby and how the sentence reads*; the `ruby-markup` skill decides *how the `<ruby>` tag is written* (punctuation flush on both sides, no whitespace inside/around, nested forms, no `<rtc>`/`<rb>`). Emit Korean 漢諺混寫 ruby that satisfies **both**. Load `ruby-markup` too whenever Korean output contains `<ruby>`.

---

## Japanese (ja) — である体

- **地の文**: 〜である／〜だ／〜した／〜という. Plain, not です・ます. Reportorial, composed.
- **見出し・欄位名（headings, labels）**: 漢字多めで格調を保つ — lean on kanji, keep it dense and formal.
- **Orthography**: **standard Japanese forms (shinjitai)** — 画 (not 畵), 学 (not 學), 体 (not 體), 継承 (not 繼承). This is the one place ja and ko diverge on glyph shape (ko keeps heritage forms — see below). Precedent: homepage `mfH1` ja = `活字美学…画面に並ぶ漢字へ`.
- **Loanwords / technical terms**: katakana (ピクセル, フォールバック, カスタムプロパティ, ブラウザ) or Latin as-is (CSS, JavaScript, npm, CDN). Do not translate proper API/product names.
- **Tone**: composed and precise; a light, dry wit is welcome where the source has it, never at the cost of clarity.

**Recurring term anchors (zh → ja):** 標點→約物 · 擠壓→詰め · 懸掛→ぶら下げ · 著重號→圏点 · 注音→注音 · 拼音→ピンイン · 螢幕→画面 · 鉛字時代→活版時代 · 排版/組版→組版 · 字體→書体／フォント · 選擇器→セレクタ · 權重(specificity)→詳細度 · 覆寫→上書き · 回落(fallback)→フォールバック.

---

## Korean (ko) — 漢諺混寫體 + 해라체

Two independent axes: a **script policy** (漢諺混寫) and a **speech level** (해라체).

### Script — 漢諺混寫體

Write **Sino-Korean content words (漢字語 내용어) as hanja**, annotated with their hangul reading in ruby: `<ruby>漢字<rt>한자</rt></ruby>`. Everything native stays hangul. Full policy:

| 類型 | 처리 | 예 |
|---|---|---|
| 漢字語 내용어 (Sino content word) | hanja base + hangul-reading `<rt>` | `<ruby>大統領<rt>대통령</rt></ruby>`、`<ruby>傍點<rt>방점</rt></ruby>` |
| 純한국어 (native words, 助詞, 語尾, verbs) | 한글만 | 아버지 · 하다 · 가다 · 은/는/이/가 · 〜다 |
| 아라비아 숫자 (numerals) | 숫자 그대로, 한자 불사용 | 22초 · 30분 · 120개 · 60여 년 |
| 외래어 · 외국 고유명사 (loanwords, foreign names) | 한글 (또는 Latin 그대로) | 픽셀 · 브라우저 · 폴백 · 트럼프 · CSS · JavaScript |
| 直接引用 (quoted speech) | 한글만 | 「괜찮네」 · 「맛있다」 |
| 카테고리 태그 | 漢諺混寫 | `<ruby>國際<rt>국제</rt></ruby> 뉴스` |

- **Ruby granularity = one ruby per lexical word**, not per character and not per whole clause. `<ruby>活字<rt>활자</rt></ruby>`, `<ruby>固有名詞<rt>고유명사</rt></ruby>` — each a single ruby. (Precedent: homepage `mfH1` `<ruby>活字<rt>활자</rt></ruby> <ruby>美學<rt>미학</rt></ruby>`.) Split only where a long compound reads as separable morphemes.
- **Orthography: keep heritage / traditional hanja forms** — 學 (not 学), 畵 (not 画), 傳 (not 伝), 體 (not 体). These are a heritage-glyph brand; Korean hanja are traditional forms anyway. Precedent: `mfH1` ko = `<ruby>美學<rt>미학</rt></ruby>`, `<ruby>畵面<rt>화면</rt></ruby>`.
- **Chinese place / person names read in Sino-Korean (한국 한자음), never in transliterated Mandarin.** They are 漢字語: hanja base + hanja-reading ruby — `<ruby>台北<rt>대북</rt></ruby>`, never 타이베이; `<ruby>北京<rt>북경</rt></ruby>`, never 베이징. For polyreading hanja (台=태/대), use the reading Korean usage historically settled on for that name (대북시), not a character-by-character dictionary assembly — when unsure, flag it (ruby-markup Rule 5). Mechanical checks: one hanja ↔ one hangul syllable (a character swelling into two syllables betrays a Mandarin transliteration), and 入聲 characters keep their ㅂ/ㄹ/ㄱ coda (北→북, 十→십, 一→일; -t regularly became ㄹ — standard hanja readings have no ㄷ coda, use one only where a genuine convention exists) — codas Mandarin lost. Names that are only *written* in hanzi but not Chinese (謝廖沙・林, a Russian) follow the loanword rule instead: hangul from the source language (세료샤 림).
- **Do not force hanja onto non-Sino vocabulary.** If a word is native Korean or a loanword, it is hangul — even when a Chinese source word exists. Forcing a fake 漢字語 (e.g. writing 懸掛/현괘 for "hanging", which is not real Korean vocabulary) is an error. Prefer the natural Korean word (hanging punctuation → 내어쓰기, native). When unsure whether a reading is a real Sino-Korean word, treat it like a polyphone: flag it to the operator rather than inventing one (see `ruby-markup` Rule 5).

**Recurring term anchors (zh → ko):** 漢字→`漢字/한자` · 活字→`活字/활자` · 組版→`組版/조판` · 著重號→`傍點/방점` (the standard Korean term) · 注音→`注音/주음` · 拼音→`倂音/병음` · 螢幕→`畵面/화면` · 活版時代→`活版/활판 時代/시대` · 傳承字形→`傳承/전승 字形/자형` · 書名號→`書名號/서명호` · 懸掛→**내어쓰기**(native) · 擠壓→`壓縮/압축` · 瀏覽器→브라우저 · fallback→폴백.

### Speech level — 해라체 (地の文)

- **地文 default**: 해라체 = plain declarative literary endings — 〜다 · 〜이다 · 〜했다 · 〜이었다 · 〜라고 밝혔다 · 〜것이었다. **No 경어** (습니다 / 요) in narration.
- **Quoted speech (「」)**: narration stays 해라체; the register *inside* quotes follows the speaker→listener relationship:

  | 상황 | 체태 | 예 |
  |---|---|---|
  | 공식 발언 (기자회견·연설·공식 답변) | 합쇼체 | 「맛있습니다！」 |
  | 직급 차이 업무 대화 | 합쇼체 / 해요체 | 「그렇게 하겠습니다」 |
  | 사적·친밀 | 해요체 / 해라체 | 「맛있어！」 |
  | 동료·친구·가족 (대등·하대) | 해라체(반말) | 「맛있다！」 |

  e.g. 대통령→기자 = 합쇼체; 대통령→배우자(사적) = 해라체(반말).
- **Quote patterns**: 「…」라고 말했다 / 「…」고 했다 (indirect also fine: 〜라고 전했다 / 밝혔다).

### Editorial formats (news-style copy only)

- 전보(dispatch): 【<ruby>本紙<rt>본지</rt></ruby> 제네바 <ruby>特派員<rt>특파원</rt></ruby> 이명원 <ruby>電傳<rt>전전</rt></ruby>】
- 編輯注: （<ruby>編輯<rt>편집</rt></ruby> <ruby>注<rt>주</rt></ruby>：…）
- Keep the whole body in 漢諺混寫體 throughout.

---

## Cross-cutting rules (both languages)

- **Specimens stay in the source language.** Sample text whose *purpose* is to show CJK typography (擠壓/懸掛/著重號 demos like `「世界，你好！」` or `字距，行氣。`) is kept as-is; translate only the surrounding explanation. Mirror what the `en` field does — it keeps the specimen and translates the frame.
- **Preserve inline markup and placeholders.** `<code>`, `<em>`, `<cite>`, `<strong>`, `&lt;head&gt;`, `<br />`, `\n`, `{{ tokens }}`, `<ruby class="zhuyin">…</ruby>` demo runs — carry them through unchanged; translate only the human text between them.
- **Register is context-led.** The source rules were written for a newspaper (報道文体); for homepage / marketing / manifesto copy, keep the *mechanics* (である体, 漢諺混寫+해라체) but let the voice match the brand register. The newspaper-only bits (전보, 編輯注, 기자회견 quote levels) rarely apply to UI copy.
- **Numerals & product names**: Arabic numerals stay Arabic in both. Product/API names (han.css, CSS, JavaScript, npm, CDN, unicode-range, GPOS, OpenType) stay Latin in both.
- **When a reading or a word choice is genuinely ambiguous, ask** — don't silently invent a Sino-Korean reading or a Japanese term. A wrong 한자음 is invisible to a trusting reader (`ruby-markup` Rule 5).

---

## Worked examples (han.css homepage)

```
zh  像素間的活字美學，講究螢幕上的每一個漢字
ja  ピクセルの間の活字美学、画面に並ぶ漢字へ。
ko  <ruby>픽셀<rt>pixel</rt></ruby> 사이의 <ruby>活字<rt>활자</rt></ruby> <ruby>美學<rt>미학</rt></ruby>, <ruby>畵面<rt>화면</rt></ruby>의 <ruby>漢字<rt>한자</rt></ruby>에게.
```
```
zh  排版是文字的衣冠——活字的傳承，在螢幕上繼續演化。
ja  組版は文字の衣冠——活字の継承が、画面の上で進化を続ける。
ko  <ruby>組版<rt>조판</rt></ruby>은 <ruby>文字<rt>문자</rt></ruby>의 <ruby>衣冠<rt>의관</rt></ruby>——<ruby>活字<rt>활자</rt></ruby>의 <ruby>傳承<rt>전승</rt></ruby>이 <ruby>畵面<rt>화면</rt></ruby> 위에서 <ruby>進化<rt>진화</rt></ruby>를 이어 간다.
```

---

## Checklist (before saving ja / ko copy)

1. **ja**: である体 (no です・ます in 地の文); standard-form kanji (画/学/体); katakana/Latin for loanwords.
2. **ko**: 해라체 declarative 地文 (〜다/이다/했다, no 습니다·요); quotes take the relationship-appropriate level.
3. **ko**: every Sino-Korean content word is `<ruby>漢字<rt>한글</rt></ruby>`, one ruby per lexical word, **heritage hanja forms**.
4. **ko**: native words / 助詞 / 語尾 / loanwords / direct quotes stay hangul; no invented 漢字語.
5. **Both**: Arabic numerals stay Arabic; product/API names stay Latin.
6. **Both**: specimens kept in source language; inline markup / placeholders / `\n` preserved.
7. **ko ruby** satisfies the `ruby-markup` skill — punctuation flush on both sides, no whitespace inside or around `<ruby>`/`</ruby>`.
8. Ambiguous readings or uncertain 漢字語 were flagged to the operator, not silently resolved.
