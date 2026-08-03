/**
 * Elements whose text must never be touched by the inline-typesetting DOM
 * fallbacks (標點擠壓／懸掛, 跨文種間隙). Two reasons to be on this list.
 *
 * **Literal content.** Monospace / preformatted / sample / keyboard code and
 * form fields are text to be read exactly as typed: wrapping it in `<h-char>`
 * / `<h-iss>` both misrenders the code (a comma must not hang, a space must
 * not become a ¼-em gap) and splits the element's single text node into
 * several — which breaks downstream consumers that read `<code>` as one text
 * node (e.g. the manual's Custom-Highlight-API code highlighter).
 *
 * Mirrors han.css v3, which excluded `code, kbd, samp, pre` from `renderHWS` /
 * `renderJiya`; `textarea` is added because its value is user-typed literal
 * text too.
 *
 * **Foreign content.** `<math>` (and `<svg>`) are not HTML: their layout is
 * defined over their OWN element vocabulary, and an element from outside it is
 * not merely unstyled but actively broken. MathML Core's UA stylesheet gives
 * any unrecognised descendant of `<math>` `display: block`, so a single
 * `<h-char>` around a 「，」 inside an `<mtext>` turns that one line of display
 * maths into two — observed in Chromium on this project's own homepage
 * (station 伍's 式5.1, 2026-08-03). SVG has the same shape of problem: an
 * `<h-char>` inside `<text>` is unknown to the SVG layout model and simply
 * does not paint.
 *
 * Both are skipped WHOLE — the walk does not descend — because there is no
 * position inside either where an HTML wrapper element would be legal. Authors
 * who want CJK punctuation refined inside maths have no way to get it from the
 * DOM anyway; that is the engine's job via `text-spacing-trim`, which applies
 * to MathML text like any other text.
 *
 * `nodeType === 1` rather than `instanceof Element`: hyperly invokes `ignore`
 * predicates from non-browser test runs where the `Element` global isn't bound
 * (same rationale as punctuation.ts's `isHCharWrapper`). For the same reason
 * the match is on `tagName`, which for foreign content is case-sensitive —
 * `<math>` parses to tagName `math`, NOT `MATH`, so both spellings are listed.
 */
const SKIP_TAGS = new Set([
  'CODE', 'PRE', 'KBD', 'SAMP', 'TEXTAREA',
  'math', 'MATH', 'svg', 'SVG',
])

export const isCodeLike = (n: Node): boolean =>
  n.nodeType === 1 && SKIP_TAGS.has((n as Element).tagName)
