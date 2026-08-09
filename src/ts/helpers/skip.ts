/**
 * Subtrees the inline-typesetting passes must never touch.
 *
 * **Literal content** (`code`/`pre`/`kbd`/`samp`/`textarea`): text read
 * exactly as typed — a comma must not hang, a space must not become a ¼-em
 * gap, and wrapping splits the single text node downstream consumers (code
 * highlighters) rely on.
 *
 * **Foreign content** (`math`/`svg`), skipped WHOLE: their layout is defined
 * over their own vocabulary, and an HTML wrapper element inside is not
 * unstyled but broken — MathML Core's UA stylesheet gives unknown
 * descendants `display: block` (one `<h-char>` splits a formula onto two
 * lines), SVG simply doesn't paint them. There is no position inside either
 * where a wrapper is legal; punctuation there is the engine's job via
 * `text-spacing-trim`.
 *
 * `nodeType === 1` not `instanceof Element` (no `Element` global in
 * non-browser runs); tagName matched case-sensitively because foreign
 * content parses lowercase — `<math>` is `math`, not `MATH`.
 */
const SKIP_TAGS = new Set([
  'CODE', 'PRE', 'KBD', 'SAMP', 'TEXTAREA',
  'math', 'MATH', 'svg', 'SVG',
])

/** Should the inline-typesetting walk skip this node's whole subtree? */
export const isCodeLike = (n: Node): boolean =>
  n.nodeType === 1 && SKIP_TAGS.has((n as Element).tagName)
