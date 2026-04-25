---
name: ruby-markup
description: >-
  Authoritative authoring rules for CJK ruby annotation markup — Zhuyin (注音, Mandarin Phonetic Symbols, MPS), Hanyu Pinyin, Japanese furigana (振り仮名), Cantonese Jyutping (粵拼), romanization, and gloss ruby — in any HTML / Markdown / JSX / Svelte / docs / test fixture / LLM output. Use whenever writing, reviewing, transforming, or generating ruby-annotated CJK text. Triggers include: any ruby element, class tokens like `zhuyin`, `mps`, `pinyin`, `jyutping`, an `rt` containing ㄅㄆㄇ or kana or romanization, "注音 ruby", "Zhuyin ruby", 拼音, 粵拼, furigana, "ruby markup", "字間注", "行間注", "聲調定位", or any request to add phonetic annotation or glosses to Chinese / Japanese / Korean text. Apply even when the request only says "add zhuyin to X" or "add pinyin to X" — the strict rules below override convenience.
---

# CJK Ruby Markup Rules

These rules describe how to author **CJK ruby annotation markup** (`<ruby>`) so that the browser's **native** ruby engine renders correct line-breaking, kinsoku (標點避頭尾), and annotation layout. They are organized in two tiers:

- **Universal rules (Rules 1–5)** bind *every* annotation type — Zhuyin, Hanyu Pinyin, furigana, Jyutping, romanization, glosses.
- **Per-type sections** bind only their own type. Zhuyin (注音 / MPS) — the one CJKV annotation type that can render inter-character (字間注) — is the most constrained type and gets the deepest section (Rules 6–8); other types are lighter and grow as needed.

The rules apply to **all** hand-authored or AI-generated source: prose, demos, test fixtures, JSDoc snippets, playground HTML, anything.

> **Reference implementation.** These rules are extracted from [Han.css](https://hanzi.pro), which ships the Zhuyin web font, the inter-character CSS fallback, and the `transpileRuby` down-leveler referenced below. Han.css is the canonical consumer, but the markup rules here are engine-agnostic — nothing on this page requires Han.css specifically. See [`examples/`](./examples/) for openable demonstrations.

**Scope.** This spec governs how `<ruby>` markup is *written*. It does not govern rendering implementation — fonts, CSS fallbacks, and engine behavior belong to consumers such as Han.css. Layout differences (inter-character 字間注 vs interlinear 行間注, horizontal vs vertical) are the consumers' problem; the markup rules are shared.

---

## Universal rules — every annotation type

### Rule 1 — Punctuation lives **outside** the `<ruby>`, with no whitespace on either side

Punctuation (CJK or Latin) is never inside a ruby, whatever the annotation type. **Both sides** matter: the closing `</ruby>` must be flush against any **following** punctuation (closing brackets, commas, periods, question marks…), and the opening `<ruby>` must be flush against any **preceding** punctuation (opening brackets, opening quotes…). Zero text characters between — no space, no newline, no tab. HTML comments (`<!-- -->`) are inert and don't break adjacency, but only as long as no whitespace surrounds them.

```html
<!-- ✅ both sides flush (examples show zhuyin; the rule is type-agnostic) -->
<ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>。
「<ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>」
（<ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>）
<ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>，<ruby class="zhuyin">嗎<rt>˙ㄇㄚ</rt></ruby>？

<!-- ❌ space on either side -->
<ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby> 。
「 <ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>」

<!-- ❌ newline between bracket and ruby -->
「
<ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>」

<!-- ❌ punctuation pulled inside the ruby -->
<ruby class="zhuyin">字<rt>ㄗˋ</rt>。</ruby>
<ruby class="zhuyin">「字<rt>ㄗˋ</rt></ruby>

<!-- ✅ comments are inert — flush on both sides is fine -->
<ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby><!-- inline note -->。

<!-- ❌ comment surrounded by whitespace breaks adjacency -->
<ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby> <!-- inline note --> 。
```

**Why** — *this is the most load-bearing rule.* Native browser kinsoku ("avoid punctuation at line head / tail") only triggers when the punctuation is the immediately-adjacent character node next to `<ruby>` / `</ruby>`. Inserting whitespace creates a text node between them, which breaks the adjacency the kinsoku heuristic relies on; punctuation can then wrap to the line head or hang at the line tail, which is the very thing kinsoku exists to prevent. Some toolchains historically shipped runtime JS to repair this (because legacy HTML output was unpredictable), but the modern approach deliberately drops that crutch — native engines now handle ruby + kinsoku correctly *if* the source is adjacency-clean to begin with. (Han.css, the reference implementation, made exactly this transition between its v3 and v4: v3 repaired adjacency at runtime, v4 relies on clean source.) Author the markup right and let the browser do its job.

**How to apply**

- In raw HTML / JSX / Svelte: write `「<ruby…>字<rt>…</rt></ruby>」` as one continuous token.
- In Markdown: keep the entire run on one source line. Do not break a sentence containing rubies across lines, and do not insert blank lines or list-bullet breaks mid-sentence.
- Long source lines are acceptable — line length yields to kinsoku correctness.
- In nested structures (Rule 2), adjacency applies to the **outermost** `</ruby>` / `<ruby>`.

### Rule 2 — Multi-layer annotation uses nested `<ruby>`

When a base carries more than one annotation layer (e.g. Zhuyin + Hanyu Pinyin, or Zhuyin + an English gloss, or any author-chosen combination), use a nested `<ruby>`: an outer ruby whose **bases are themselves rubies of the inner layer**, plus one outer `<rt>` for the second layer.

```html
<!-- 「漢字」as one word: per-char zhuyin + word-level pinyin -->
<ruby><ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby><rt>hanzi</rt></ruby>

<!-- the outer <rt> is free-form: pinyin, gloss, translation, anything -->
<ruby><ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby><rt>Han character</rt></ruby>
```

Key constraints:

- The outer `<ruby>` carries **no** type class — only the inner per-char rubies do (e.g. `class="zhuyin"`).
- Inner Zhuyin rubies still obey the zhuyin one-base rule (Rule 6) when applicable.
- The outer `<rt>` may span any number of inner bases — that is how you express "this annotation applies to a multi-character word".
- The outer `<rt>` content is arbitrary: pinyin, romanization, English / Japanese / Korean translation, transliteration, etc.
- **Rule 1 still applies to the outermost `</ruby>` / `<ruby>`** — punctuation sits flush on both sides.

```html
<!-- ✅ punctuation adjacent to OUTER closer -->
「<ruby><ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby><rt>hanzi</rt></ruby>」
```

### Rule 3 — `<rtc>` / `<rb>`: not used, pending engine support

`<rb>` and `<rtc>` are **conforming markup**: the WHATWG HTML Standard had marked them obsolete, but the W3C [HTML Ruby Markup Extensions](https://www.w3.org/TR/html-ruby-extensions/) specification (Candidate Recommendation, 2026-06-04) revokes that status and deems both elements fully conforming, and their standardization continues to advance. What has *not* caught up is the engines: no browser yet renders the tabular model (`<rtc>` layers, `rbspan` spans) interoperably.

Until they do, this spec expresses the same structures in an **interop encoding** built from what engines already render:

- **single annotation** → flat `<ruby>基<rt>annotation</rt></ruby>` (for zhuyin: one per CJK char, Rule 6)
- **multi-layer / span annotation** → nested `<ruby>` with the outer `<rt>` carrying the second layer, spanning any number of inner bases (Rule 2)

This is a rendering workaround, not a judgment on the tabular model — once engines implement it interoperably, `<rb>` / `<rtc>` forms may be adopted here directly.

Existing `<rtc>` / `<rb>` markup can be converted by feeding it to an LLM with this skill loaded — the rules here are sufficient to emit the interop form. For programmatic conversion, [Han.css](https://hanzi.pro) ships an opt-in down-leveler `transpileRuby(src)` that handles forms A / B / C / E (tabular zhuyin, dual annotation with `rbspan`, anonymous-base multi-`<rt>`, and 3+ annotation layers) — call it once at build time or as a manual runtime compat shim.

### Rule 4 — Keep `<ruby>` children minimal (recommendation, not a hard rule)

The cleanest `<ruby>` contains only:

- one base text node — or one inline element like `<b>`, `<em>` wrapping only the base
- one `<rt>` with the annotation string
- optionally `<rp>` parens around the `<rt>` for plain-text fallback

`<span>`, `<small>`, line breaks, or stray text inside the `<ruby>` are **not forbidden** — they may be needed for legitimate styling, semantics, or editorial markup — but they are **discouraged** because they tend to interact unpredictably with the native ruby engine's box model and with CSS fallbacks.

**Better trade-off when extra wrappers are needed**: place them **outside** the `<ruby>`, not inside.

```html
<!-- preferred — wrapper outside the ruby -->
<em><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby></em>

<!-- works, but more fragile — wrapper inside the ruby -->
<ruby class="zhuyin"><em>字</em><rt>ㄗˋ</rt></ruby>
```

`lang`, `id`, `data-*`, and other attributes on the `<ruby>` itself are unrestricted — use them as semantics demand.

### Rule 5 — Reading standard & polyphone (多音字) handling

**Step 0 — settle the reading standard before annotating anything.** Which language / regional standard governs the readings — Taiwan MOE 審訂音, mainland 普通話, Singapore / Malaysia Mandarin, a topolect standard, Japanese / Korean / Vietnamese readings… — and how tone sandhi is marked are the **author's** decisions: regional standard first, the author's explicit preference above that. Ask once, up front, rather than guessing per-occurrence. If the author specifies nothing, default to Taiwan MOE readings with citation-tone marking (zhuyin specifics in Rule 8).

When an LLM is adding zhuyin (or pinyin, or any phonetic annotation) to CJK text, **stop and ask the operator** whenever a character has multiple legitimate readings in the target language and context does not unambiguously determine which to use. This applies to Mandarin (Standard Chinese / 國語 / 普通話), Hokkien (閩南語), Hakka (客語), Wu (吳語), Cantonese (粵語), Japanese, Korean, and any other CJK-reading language the annotation targets.

Examples:

- 「我和你」— 和 may read **ㄏㄜˊ (hé)** or **ㄏㄢˋ (hàn)** depending on regional / register preference.
- 「學富五車」— 車 in this idiom is conventionally **ㄐㄩ (jū)**, but **ㄔㄜ (chē)** is the everyday reading; both may be defended.
- Any 破音字 / 多音字 / 異讀 where context, regional convention, or stylistic register changes the answer.
- Any character whose reading depends on a meaning the LLM cannot confidently pin down (homographs, technical terms, historical pronunciations, name readings…).

**How to surface the ambiguity:**

1. Annotate the unambiguous characters first.
2. For each ambiguous character, **list it explicitly with the candidate readings and a brief note on which reading fits which sense / dialect / register**.
3. Wait for the operator's choice before emitting the final annotated markup. Do not silently pick a reading — a wrong choice in phonetic annotation is invisible to readers who trust the markup, and very expensive to discover later.

---

## Zhuyin (注音 / MPS)

Writing mode belongs to the **base text**; what varies for zhuyin is which space the annotation occupies. **Inter-character** (字間注) zhuyin takes room *inside the line*, standing beside each character within the intra-line spacing. **Interlinear** (行間注) annotation takes the space *between lines* — above the line in horizontal text, beside the vertical line in vertical text; so vertical zhuyin sitting next to its characters is interlinear, not inter-character. In **horizontal text**, zhuyin added to particular characters (or all of them) is mostly set inter-character; the interlinear setting is the minority but equally sanctioned by the official (MOE) conventions. In **vertical text**, zhuyin is interlinear — a vertical inter-character setting is essentially unseen (and makes little sense). Among CJKV annotation types, only zhuyin over horizontal text renders inter-character at all. Which setting renders is the author's CSS decision, not this spec's; the reference Zhuyin web font supports all of the above. Because inter-character must stay *possible*, zhuyin markup carries the strictest constraints — the rules below hold whichever layout the CSS picks. `<ruby class="zhuyin">` / `<ruby class="mps">` mark the type.

### Rule 6 — One base character per `<ruby class="zhuyin">` (recommended; required when CSS fallback is in play)

Each Zhuyin ruby should contain **exactly one** base character (one CJK ideograph) and **exactly one** `<rt>` with that character's full zhuyin reading (initials + medials + finals + tone, in canonical order).

```html
<!-- ✅ canonical -->
<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>

<!-- ❌ never — zhuyin requires one <rt> per base character; merged readings are not allowed -->
<ruby class="zhuyin">漢字<rt>ㄏㄢˋㄗˋ</rt></ruby>

<!-- ⚠ multi-base, one <rt> per base — layout-correct in pure vertical / Safari, breaks the CSS fallback -->
<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt>字<rt>ㄗˋ</rt></ruby>
```

**Why** — implementations that emulate `ruby-position: inter-character` for engines that do not yet support it (currently every engine other than Safari) typically rely on a CSS fallback: the ruby gets `letter-spacing` to reserve room beside each base for its annotation, and the `<rt>` is `position: absolute` so the annotation lands alongside without disturbing the base's flow. For a flat run of uniformly-annotated characters this is enough — the simple case works. Multi-base rubies break it at the seams:

- **Annotation can wrap away from its base** — the ruby is `position: relative`, so the absolutely-positioned `<rt>` is anchored to a point *inside that single containing block* (typically `inset-inline-start: 50%`). When the multi-base cluster wraps mid-line, the cluster splits across two line boxes but the `<rt>` stays pinned to one point — the annotation can end up on a different line from the base it annotates. A one-base ruby is too small to wrap internally, so base and `<rt>` always travel together.
- **`letter-spacing` leaks onto unannotated characters** — the spacing is uniform across every character inside the ruby. A base position with no `<rt>`, or an embedded punctuation char (which usually carries no zhuyin), still gets the same gap reserved on its right as if it had annotation. Result: visual gaps next to characters that don't need them. With one base per ruby, an unannotated character simply isn't wrapped in `<ruby class="zhuyin">` — no spacing leak.
- **Multiple `<rt>`s collapse to one anchor** — a multi-base ruby with N `<rt>`s gives N elements all anchored to the same `inset-inline-start: 50%` of the same containing block. They stack on top of each other instead of distributing one-per-base. One ruby per base means one `<rt>` per anchor, which is the geometry the CSS fallback was designed for.

One base per `<ruby>` sidesteps all three.

**When the rule can be relaxed**

- **Pure vertical writing-mode**, where the zhuyin column sits naturally beside the column of CJK text (行間注) — no inter-character emulation needed.
- **Safari-only** (or any future engine that natively supports `ruby-position: inter-character`).
- Any environment where the author has verified the CSS fallback above is not in use.

In those contexts a multi-base ruby is layout-correct. **Default to one-base-per-ruby anyway**: it is forward-compatible with every engine and every typesetting mode, while the relaxed form is a bet on the consumer's CSS.

**How to apply** — when a word spans N CJK characters, emit N adjacent `<ruby class="zhuyin">` elements. Do not group them.

### Rule 7 — Class spelling: `zhuyin` is canonical, `mps` is an alias

Both `class="zhuyin"` and `class="mps"` are recognized and equally valid — pick whichever fits the project's vocabulary. Don't put both on the same element. Adding **other** classes alongside (e.g. for project-level styling hooks) is fine — implementations match on `:is(.zhuyin, .mps)` and ignore siblings.

### Rule 8 — Tone marks and the MOE default

Inside `<rt>`, the zhuyin string follows the standard Taiwanese textbook order:

- 平/二/三/四聲 (ˉ ˊ ˇ ˋ) at the **end** of the syllable: `ㄏㄢˋ`, `ㄗˋ`
- 輕聲 (˙) at the **start**: `˙ㄇㄚ`, `˙ㄋㄜ`
- 方音 departing tones 陰去 (˪) / 陽去 (˫) at the **end**, like the Mandarin tone marks
- Dialectal entering-tone finals (ㆴ ㆵ ㆷ, and ㆻ for -k) at the end after any other syllabic content: `ㄏㄚㆷ`

Use the standard Unicode code points — U+02CA ˊ, U+02C7 ˇ, U+02CB ˋ, U+02D9 ˙; for 方音: U+02EA ˪, U+02EB ˫, U+31B4 ㆴ, U+31B5 ㆵ, U+31B7 ㆷ, U+31BB ㆻ — the set recommended by [Bopomofo on Web](https://github.com/cmex-30/Bopomofo_on_Web). Do not substitute combining marks at the source layer — a properly-built Zhuyin font's GSUB handles the spacing→combining swap for vertical / inter-character contexts.

**Reading standard — author-led, with a default.** Which readings to use, and how tone sandhi is marked, are the author's decisions (settled up front via Rule 5 step 0). When the author specifies nothing, the default is **Taiwan MOE dictionary readings with citation-tone marking** (教育部《重編國語辭典修訂本》／《國語一字多音審訂表》):

- 一 and 不 are marked with their **citation tone** (本調), never the sandhi form: 不亦說乎 → 不 is ㄅㄨˋ, not ㄅㄨˊ. (The MOE dictionary marks ㄅㄨˋ ㄧˋ ㄌㄜˋ ㄏㄨ even for the set idiom 不亦樂乎.)
- Third-tone sandhi is likewise never marked — adjacent third tones both keep ˇ.
- 陰平 (first tone) carries no tone mark; 輕聲 ˙ is prefixed as above.

Marking actual sandhi tones (e.g. for pronunciation-teaching material) is a legitimate author-specified override, not the default.

---

## Hanyu Pinyin (拼音) — skeleton

Pinyin ruby is **interlinear** (行間注, over the top in horizontal text), never inter-character, so the zhuyin one-base rule does not apply — group **per word**: a multi-character base with one `<rt>` is the normal form.

```html
<ruby class="pinyin">漢字<rt>hànzì</rt></ruby>
```

- Suggested type class: `pinyin`.
- Tone-marked (`hànzì`) vs tone-numbered (`han4zi4`) pinyin is a reading-standard decision — settle it via Rule 5 step 0.
- As a second layer over zhuyin, use the nested form (Rule 2) — the outer `<rt>` carries the pinyin.
- Universal rules 1–5 apply as-is. *Section to be expanded.*

## Furigana (振り仮名) — skeleton

- Mono ruby (per character) vs group / jukugo ruby (per word) is an editorial convention — settle it via Rule 5 step 0; both are valid markup under this spec.
- Annotation is kana; mark the content `lang="ja"`.
- Universal rules 1–5 apply as-is — Japanese kinsoku depends on Rule 1 adjacency exactly as Chinese kinsoku does. *Section to be expanded.*

## Cantonese Jyutping (粵拼) — skeleton

- Per-character annotation with tone numbers: `<ruby class="jyutping">粵<rt>jyut6</rt></ruby>`.
- Suggested type class: `jyutping`.
- Universal rules 1–5 apply as-is. *Section to be expanded.*

## Korean hanja readings (諺文) — skeleton

- Hangul reading annotation over hanja: `<ruby lang="ko">漢字<rt>한자</rt></ruby>`; per-word vs per-character grouping is an editorial convention — settle it via Rule 5 step 0.
- Universal rules 1–5 apply as-is. *Section to be expanded.*

## Topolect romanizations (方言) — skeleton

- Hokkien 臺羅 / 白話字 (POJ), Hakka 客語拼音, and other topolect schemes. Which scheme annotates is a reading-standard decision — settle it via Rule 5 step 0.
- Suggested type class: name it after the scheme (e.g. `tailo`, `poj`).
- Universal rules 1–5 apply as-is. *Section to be expanded.*

---

## Authoring checklist

Before saving any file that touches CJK ruby:

1. No punctuation is inside any `<ruby>`.
2. No whitespace, newline, or comment sits between `<ruby>` / `</ruby>` and the punctuation on **either** side (the outermost ruby, in nested structures).
3. Multi-layer cases use nested `<ruby>` with only the inner rubies type-classed.
4. No `<rtc>` / `<rb>` — conforming, but engines don't render them interoperably yet; express the same structure with nested `<ruby>` (Rule 3).
5. The reading standard was settled up front (author-specified, or the Taiwan MOE citation-tone default) and polyphones were flagged to the operator before emission, not silently resolved.
6. Zhuyin: each `<ruby class="zhuyin">` (or `mps`) contains one CJK char and one `<rt>` — unless the consumer is verified vertical-only or Safari-only.
7. Zhuyin: multi-char words are emitted as adjacent rubies, no separator.
8. Zhuyin: tone marks use canonical Unicode points and canonical position (end / start for 輕聲) — 一 / 不 in citation tone unless the author overrode.
