/**
 * Selector specificity, computed — station 陸's carousel prints a weight
 * beside each selector, and a typed-in triple is exactly the kind of figure
 * that goes stale the first time somebody edits the selector next to it.
 *
 * Per Selectors-4 § 17: `a` = IDs, `b` = classes / attributes / pseudo-classes,
 * `c` = type selectors and pseudo-elements. The functional pseudo-classes are
 * where the interesting cases live:
 *
 *   - `:is()` / `:not()` / `:has()` take the specificity of their MOST
 *     SPECIFIC argument — a selector list inside, ranked, not summed. Summing
 *     is the classic error: it turns `:is(a, b, c)` into a fictional (0,3,0).
 *   - `:where()` is always zero, whatever is inside it. That IS the framework's
 *     whole argument, so it had better be right here too.
 *   - `:nth-child(… of S)` counts as one pseudo-class PLUS the ranked
 *     specificity of `S`.
 *
 * Relative selectors (`:has(> rt)`, `:has(+ u)`) carry a leading combinator;
 * it contributes nothing, and the tokenizer skips it like any other
 * combinator, so no special case is needed.
 *
 * Deliberately NOT a postcss dependency: this reads selector TEXT, one
 * character at a time, and the whole job is 60 lines. The census that produced
 * the carousel's roster used postcss to walk a stylesheet — a different job
 * (docs/notes/2026-08-02-where-specificity-census.md).
 */

const ZERO = [0, 0, 0]
const add = (x, y) => [x[0] + y[0], x[1] + y[1], x[2] + y[2]]
const max = (x, y) =>
  x[0] !== y[0] ? (x[0] > y[0] ? x : y)
  : x[1] !== y[1] ? (x[1] > y[1] ? x : y)
  : x[2] >= y[2] ? x : y

/** `:is()` / `:has()` / `:not()` rank their arguments — never sum them. */
const rankOf = (list) => splitTopLevel(list).map(specificity).reduce(max, ZERO)

/** Split a selector list at TOP-LEVEL commas only (`:is(a, b)` is one token). */
export const splitTopLevel = (src) => {
  const out = []
  let depth = 0
  let start = 0
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '(' || src[i] === '[') depth++
    else if (src[i] === ')' || src[i] === ']') depth--
    else if (src[i] === ',' && depth === 0) {
      out.push(src.slice(start, i))
      start = i + 1
    }
  }
  out.push(src.slice(start))
  return out.map((s) => s.trim()).filter(Boolean)
}

const IDENT = /[\w -￿-]/
const skipIdent = (src, i) => {
  while (i < src.length && (IDENT.test(src[i]) || src[i] === '\\')) i++
  return i
}
const matchParen = (src, i) => {
  let depth = 0
  for (; i < src.length; i++) {
    if (src[i] === '(') depth++
    else if (src[i] === ')' && --depth === 0) return i
  }
  return src.length
}

/** Pseudo-classes that take on their argument's specificity instead of one `b`. */
const RANKED = new Set(['is', 'not', 'has', 'matches', '-moz-any', '-webkit-any'])

export const specificity = (selector) => {
  let spec = ZERO
  let i = 0
  while (i < selector.length) {
    const ch = selector[i]

    if (ch === '#') {
      spec = add(spec, [1, 0, 0])
      i = skipIdent(selector, i + 1)
    } else if (ch === '.') {
      spec = add(spec, [0, 1, 0])
      i = skipIdent(selector, i + 1)
    } else if (ch === '[') {
      spec = add(spec, [0, 1, 0])
      const close = selector.indexOf(']', i)
      i = close < 0 ? selector.length : close + 1
    } else if (ch === ':') {
      const isElement = selector[i + 1] === ':'
      let j = skipIdent(selector, i + (isElement ? 2 : 1))
      const name = selector.slice(i + (isElement ? 2 : 1), j).toLowerCase()
      let arg = ''
      if (selector[j] === '(') {
        const close = matchParen(selector, j)
        arg = selector.slice(j + 1, close)
        j = close + 1
      }
      if (isElement) spec = add(spec, [0, 0, 1])
      else if (name === 'where') { /* zero, by definition — the whole point */ }
      else if (RANKED.has(name)) spec = add(spec, rankOf(arg))
      else if (name === 'nth-child' || name === 'nth-last-child') {
        spec = add(spec, [0, 1, 0])
        const of = /\bof\s+([\s\S]+)$/.exec(arg)
        if (of) spec = add(spec, rankOf(of[1]))
      } else spec = add(spec, [0, 1, 0])
      i = j
    } else if (IDENT.test(ch) || ch === '|') {
      // A type selector. `*` is matched by neither branch and falls through to
      // the skip below, which is correct — the universal selector weighs zero.
      spec = add(spec, [0, 0, 1])
      i = skipIdent(selector, i)
      if (selector[i] === '|') { // namespace prefix — the name after it is the type
        spec = add(spec, [0, 0, -1])
        i++
      }
    } else {
      i++ // combinators, whitespace, `*`, `&`
    }
  }
  return spec
}

/** `(0,2,2)` — the form station 陸 prints, matching the CSS spec's own. */
export const formatSpecificity = (selector) => `(${specificity(selector).join(',')})`
