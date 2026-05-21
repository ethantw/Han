---
name: zhuyin-ruby-markup
description: Authoritative authoring rules for Zhuyin (注音, Mandarin Phonetic Symbols, MPS) ruby markup, intended for any HTML / Markdown / JSX / Svelte / docs / test fixture / LLM output that contains a Zhuyin-annotated CJK passage. Use whenever writing, reviewing, transforming, or generating content with `<ruby class="zhuyin">` or its alias `class="mps">`. Triggers include: any token like `class="zhuyin"`, `class="mps"`, `<rt>ㄅㄆㄇ`, "注音 ruby", "Zhuyin ruby", "字旁直書", "聲調定位", or any request to add zhuyin/MPS to Chinese text. Apply even when the request only says "add zhuyin to X" — the strict rules below override convenience.
---

# Zhuyin Ruby Markup Rules

These rules describe how to author **Zhuyin (注音 / MPS)** ruby markup so that the browser's **native** `<ruby>` engine — together with a Zhuyin OpenType web font that GPOS-positions tone marks — renders correct line-breaking, kinsoku (標點避頭尾), and inter-character字旁直書 layout.

The rules apply to **all** hand-authored or AI-generated source: prose, demos, test fixtures, JSDoc snippets, playground HTML, anything.

**Scope.** This skill governs **only** `<ruby class="zhuyin">` and `<ruby class="mps">`. Other ruby uses — Hanyu Pinyin, Latin romanization, English glosses, Japanese furigana, classical 旁註 — are *not* inter-character layouts and are *not* constrained by these rules. They may use whatever HTML5-conforming pattern fits.

---

## Rule 1 — One base character per `<ruby class="zhuyin">` (recommended; required when CSS fallback is in play)

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

- **Pure vertical writing-mode**, where the zhuyin column sits naturally beside the column of CJK text — no inter-character emulation needed.
- **Safari-only** (or any future engine that natively supports `ruby-position: inter-character`).
- Any environment where the author has verified the CSS fallback above is not in use.

In those contexts a multi-base ruby is layout-correct. **Default to one-base-per-ruby anyway**: it is forward-compatible with every engine and every typesetting mode, while the relaxed form is a bet on the consumer's CSS.

**How to apply** — when a word spans N CJK characters, emit N adjacent `<ruby class="zhuyin">` elements. Do not group them.

---

## Rule 2 — Punctuation lives **outside** the `<ruby>`, with no whitespace on either side

Punctuation (CJK or Latin) is never inside a Zhuyin ruby. **Both sides** matter: the closing `</ruby>` must be flush against any **following** punctuation (closing brackets, commas, periods, question marks…), and the opening `<ruby>` must be flush against any **preceding** punctuation (opening brackets, opening quotes…). Zero text characters between — no space, no newline, no tab. HTML comments (`<!-- -->`) are inert and don't break adjacency, but only as long as no whitespace surrounds them.

```html
<!-- ✅ both sides flush -->
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

**Why** — *this is the most load-bearing rule.* Native browser kinsoku ("avoid punctuation at line head / tail") only triggers when the punctuation is the immediately-adjacent character node next to `<ruby>` / `</ruby>`. Inserting whitespace creates a text node between them, which breaks the adjacency the kinsoku heuristic relies on; punctuation can then wrap to the line head or hang at the line tail, which is the very thing kinsoku exists to prevent. v3 used to ship JS that repaired this at runtime (because legacy HTML output was unpredictable), but v4 deliberately drops that crutch — native engines now handle ruby + kinsoku correctly *if* the source is adjacency-clean to begin with. Author the markup right and let the browser do its job.

**How to apply**

- In raw HTML / JSX / Svelte: write `「<ruby…>字<rt>…</rt></ruby>」` as one continuous token.
- In Markdown: keep the entire run on one source line. Do not break a sentence containing rubies across lines, and do not insert blank lines or list-bullet breaks mid-sentence.
- Long source lines are acceptable — line length yields to kinsoku correctness.

---

## Rule 3 — Dual annotation (Zhuyin + pinyin / gloss) uses nested `<ruby>`

When a base also carries a second annotation (Hanyu Pinyin, English gloss, translation, or any author-chosen text), use a nested `<ruby>`: an outer ruby whose **bases are themselves Zhuyin rubies**, plus one outer `<rt>` for the second annotation.

```html
<!-- 「漢字」as one word: per-char zhuyin + word-level pinyin -->
<ruby><ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby><rt>hanzi</rt></ruby>

<!-- the outer <rt> is free-form: pinyin, gloss, translation, anything -->
<ruby><ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby><rt>Han character</rt></ruby>
```

Key constraints:

- The outer `<ruby>` carries **no** `class="zhuyin|mps"` — only the inner per-char Zhuyin rubies do.
- The inner Zhuyin rubies still obey **Rule 1** (one base each, when applicable).
- The outer `<rt>` may span any number of inner bases — that is how you express "this annotation applies to a multi-character word".
- The outer `<rt>` content is arbitrary: pinyin, romanization, English / Japanese / Korean translation, transliteration, etc.
- **Rule 2 still applies to the outermost `</ruby>` / `<ruby>`** — punctuation sits flush on both sides.

```html
<!-- ✅ punctuation adjacent to OUTER closer -->
「<ruby><ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby><rt>hanzi</rt></ruby>」
```

---

## Rule 4 — Class spelling: `zhuyin` is canonical, `mps` is an alias

Both `class="zhuyin"` and `class="mps"` are recognized and equally valid — pick whichever fits the project's vocabulary. Don't put both on the same element. Adding **other** classes alongside (e.g. for project-level styling hooks) is fine — implementations match on `:is(.zhuyin, .mps)` and ignore siblings.

---

## Rule 5 — Tone-mark order inside `<rt>`

Inside `<rt>`, the zhuyin string follows the standard Taiwanese textbook order:

- 平/二/三/四聲（ˉ ˊ ˇ ˋ）at the **end** of the syllable: `ㄏㄢˋ`, `ㄗˋ`
- 輕聲（˙）at the **start**: `˙ㄇㄚ`, `˙ㄋㄜ`
- Dialectal entering-tone finals (`ㆴ ㆵ ㆷ` etc.) at the end after any other syllabic content: `ㄏㄚㆷ`

Use the standard Unicode code points (U+02CA ˊ, U+02C7 ˇ, U+02CB ˋ, U+02D9 ˙). Do not substitute combining marks at the source layer — a properly-built Zhuyin font's GSUB handles the spacing→combining swap for vertical / inter-character contexts.

---

## Rule 6 — `<rtc>` / `<rb>` are not used

The HTML Living Standard has marked `<rb>` and `<rtc>` as **obsolete / non-conforming**, and modern browsers' native ruby engines do not implement the tabular model reliably. The historical reason for `<rb>` / `<rtc>` was human readability — when zhuyin was hand-authored, the columnar form was easier to audit. With LLMs producing the markup, that rationale is gone.

Use the two replacement forms:

- **single annotation** → flat `<ruby class="zhuyin">基<rt>注音</rt></ruby>`, one per CJK char (Rule 1)
- **dual annotation** → nested `<ruby>` with the outer `<rt>` carrying pinyin / gloss (Rule 3)

Hand-written legacy `<rtc>` / `<rb>` content can be migrated by feeding it to an LLM with this skill loaded — the rules here are sufficient to emit standards-compliant output. For programmatic conversion, Han.css ships an opt-in helper `convertLegacyZhuyinRuby(src)` that handles forms A / B / C / E (tabular zhuyin, dual annotation with `rbspan`, anonymous-base multi-`<rt>`, and 3+ annotation layers) — call it once at build time or as a manual runtime compat shim.

---

## Rule 7 — Keep `<ruby>` children minimal (recommendation, not a hard rule)

The cleanest Zhuyin `<ruby>` contains only:

- one base text node (the single CJK character) — or one inline element like `<b>`, `<em>` wrapping only that character
- one `<rt>` with the zhuyin string
- optionally `<rp>` parens around the `<rt>` for plain-text fallback

`<span>`, `<small>`, line breaks, or stray text inside the `<ruby>` are **not forbidden** — they may be needed for legitimate styling, semantics, or editorial markup — but they are **discouraged** because they tend to interact unpredictably with the native ruby engine's box model and the inter-character CSS fallback.

**Better trade-off when extra wrappers are needed**: place them **outside** the `<ruby>`, not inside.

```html
<!-- preferred — wrapper outside the ruby -->
<em><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby></em>

<!-- works, but more fragile — wrapper inside the ruby -->
<ruby class="zhuyin"><em>字</em><rt>ㄗˋ</rt></ruby>
```

`lang`, `id`, `data-*`, and other attributes on the `<ruby>` itself are unrestricted — use them as semantics demand.

---

## Rule 8 — Polyphone (多音字) handling for LLM-generated annotations

When an LLM is adding zhuyin (or pinyin, or any phonetic annotation) to CJK text, **stop and ask the operator** whenever a character has multiple legitimate readings in the target language and context does not unambiguously determine which to use. This applies to Mandarin (Standard Chinese / 國語 / 普通話), Hokkien (閩南語), Hakka (客語), Wu (吳語), Cantonese (粵語), Japanese, Korean, and any other CJK-reading language the annotation targets.

Examples:

- 「我和你」— 和 may read **ㄏㄜˊ (hé)** or **ㄏㄢˋ (hàn)** depending on regional / register preference.
- 「學富五車」— 車 in this idiom is conventionally **ㄐㄩ (jū)**, but **ㄔㄜ (chē)** is the everyday reading; both may be defended.
- Any 破音字 / 多音字 / 異讀 where context, regional convention, or stylistic register changes the answer.
- Any character whose reading depends on a meaning the LLM cannot confidently pin down (homographs, technical terms, historical pronunciations, name readings…).

**How to surface the ambiguity:**

1. Annotate the unambiguous characters first.
2. For each ambiguous character, **list it explicitly with the candidate readings and a brief note on which reading fits which sense / dialect / register**.
3. Wait for the operator's choice before emitting the final annotated markup. Do not silently pick a reading — a wrong choice in zhuyin is invisible to readers who trust the markup, and very expensive to discover later.

If the operator wants a default, ask up-front (e.g. "default to Taiwan Mandarin standard readings unless otherwise specified") rather than guessing per-occurrence.

---

## Authoring checklist

Before saving any file that touches Zhuyin ruby:

1. Each `<ruby class="zhuyin">` (or `mps`) contains one CJK char and one `<rt>` — unless the consumer is verified vertical-only or Safari-only.
2. No punctuation is inside any `<ruby>`.
3. No whitespace, newline, or comment sits between `<ruby>` / `</ruby>` and the punctuation on **either** side.
4. Multi-char words are emitted as adjacent rubies, no separator.
5. Dual-annotation cases use nested `<ruby>` with only the inner ones classed.
6. Tone marks use canonical Unicode points and canonical position (end / start for 輕聲).
7. No `<rtc>` / `<rb>`.
8. Polyphone characters were flagged to the operator before emission, not silently resolved.
