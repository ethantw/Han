---
name: no-cjk-pseudo-italics
description: Use whenever writing CSS, HTML, or markdown for this repo (including manual/, demos, and any v4 chrome) — Han.css's mission is to eliminate pseudo-italics on Han characters, so the project itself must never ship them, even on Latin runs in the layout.
---

# No CJK Pseudo-Italics

## The Rule

**Never write `font-style: italic` anywhere in this repo's authored output.**

This rule applies to:

- `manual/` — homepage, doc chrome, demo pages, illustrations
- Any new HTML/CSS/markdown shipped from this repo
- Class names: do not coin `.italic-*`, `.t-italic-*`, `.ital-*`, etc.
- `<em>`, `<i>`, `<cite>`, `<var>`, `<dfn>`, `<address>` styling — let the
  framework's `font-style: inherit` for CJK win; do not re-introduce italic
  in author CSS
- Markdown: don't use `*…*` to render Chinese text; pick a non-italic
  semantic (e.g. emphasis dots via `<em>`, title marks via `<cite>`,
  pinyin via Latin run with the serif face upright)

The **only** legitimate `font-style: italic` reference in this codebase
sits inside the demo that *demonstrates* the framework removing UA italics —
i.e. the `.demo-off` block in `manual/public/demo.css` uses
`font-style: revert` to show what UAs do without Han.css. Don't add new
ones.

## Why

Han.css exists, in part, to eradicate the practice of skewing Han
characters with the browser's pseudo-italic transform. Real italic
glyphs do not exist in any Han typeface — what `font-style: italic`
produces on CJK is a synthetic shear, which is bad typography and a
political tell that the platform was designed for Latin scripts first.

The framework already neutralises `<em>`, `<cite>`, `<i>`, `<var>`,
`<address>`, `<dfn>` for CJK by setting `font-style: inherit`. But if
the manual itself, or any v4 chrome, sprinkles `font-style: italic`
into author CSS, it:

1. Bypasses the framework on classes that target Han text (e.g. an
   `<em class="feat-h2-en">三</em>` in a hero pulls italic via the class
   selector even though the framework's element-level rule would have
   suppressed it).
2. Sends the wrong design signal — the project is anti-italic by
   ideology, so the layout must be visually anti-italic too.
3. Tempts a future contributor to "fix" the framework rule because the
   demo pages they look at *are* italic.

Even on Latin-only classes (`.brand-ext`, `.feat-cell-en`, taglines), we
choose upright Cormorant — the *display serif voice* of the project is
upright, period.

## How to apply

When you see a request to add styling for English/Latin display text,
emphasis, taglines, brand extensions, callouts, or any inline accent:

- Use the serif face upright. `font-family: var(--font-serif-en)` is
  fine; `font-style: italic` is not.
- For emphasis, prefer `<em>` and let the framework render it as
  emphasis dots (`text-emphasis`) for CJK and as bold/colour shift for
  Latin if needed — never pseudo-italic.
- For book/film titles (《》), use `<cite>` with the framework's title
  marks; do not italicise.
- For pinyin/transliteration labels, use the Latin face upright with a
  smaller size or a colour token — italic adds nothing here.
- For step numerals, version tags, monogram extensions, etc. — same:
  upright.

When auditing a page, grep:

```bash
grep -rn 'font-style: *italic' manual/ \
  | grep -v 'manual/public/han/' \
  | grep -v 'manual/public/demo\.\(css\|html\)$'
```

Expected output: empty.

## When the user adds new design language

If the user asks for "italic English subtitle" or similar, push back
gently and offer alternatives (upright serif at smaller size, colour
shift, letterspaced eyebrow, hairline rule). Do not silently honour the
italic — the project's stance is non-negotiable.

## Adjacent rule

Don't insert manual spaces between CJK and Latin in markdown source
either — the `--han-text-autospace` cascade variable does that work.
(See the CJK↔Latin spacing memory.)
