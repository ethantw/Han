/**
 * Elements whose text must never be touched by the inline-typesetting DOM
 * fallbacks (標點擠壓／懸掛, 跨文種間隙). Monospace / preformatted / sample /
 * keyboard code and form fields are literal content: wrapping their text in
 * `<h-char>` / `<h-iss>` both misrenders the code (a comma must not hang, a
 * space must not become a ¼-em gap) and splits the element's single text node
 * into several — which breaks downstream consumers that read `<code>` as one
 * text node (e.g. the manual's Custom-Highlight-API code highlighter).
 *
 * Mirrors han.css v3, which excluded `code, kbd, samp, pre` from `renderHWS` /
 * `renderJiya`; `textarea` is added because its value is user-typed literal
 * text too.
 *
 * `nodeType === 1` rather than `instanceof Element`: hyperly invokes `ignore`
 * predicates from non-browser test runs where the `Element` global isn't bound
 * (same rationale as punctuation.ts's `isHCharWrapper`).
 */
const SKIP_TAGS = new Set(['CODE', 'PRE', 'KBD', 'SAMP', 'TEXTAREA'])

export const isCodeLike = (n: Node): boolean =>
  n.nodeType === 1 && SKIP_TAGS.has((n as Element).tagName)
