/**
 * Quote-boundary marking (引號邊界) — the pass that tells `<h-char>` about the
 * brackets that are not in the DOM.
 *
 * `<q>` and `<cite>` draw 「」『』《》〈〉 from `::before` / `::after`
 * (`content: open-quote`), so those are real CJK brackets that
 * `refinePunctuation` can never see: `<q>今天真好。</q>` renders as 「今天真好。」,
 * yet the period looks line-final to the pass and gets wrapped as hangable —
 * it hangs into the margin with a close bracket painted after it.
 *
 * As in `semantics/adjacent-lines.ts`, the JS records only the STRUCTURAL fact
 * — which punctuation wrapper touches which element boundary — and leaves the
 * cascade fact to CSS, because whether a bracket is generated at all depends on
 * `--han-cite-title-marks` and `:lang()`, both of which an author can flip live.
 * Marking every layer (`close-cite close-q`) is what makes that possible: CSS
 * ORs the tokens, so whichever layer currently generates is the one that wins.
 *
 * Adjacency is literal — any text between the mark and the boundary breaks it,
 * indentation included, since a collapsed space really does render there.
 */

import { element, hype, type Hyperly, type Hype } from 'hyperly/fp'

const ELEMENT_NODE_TYPE = 1
const TEXT_NODE_TYPE = 3
const COMMENT_NODE_TYPE = 8

/**
 * Attribute naming the quote-generating boundaries a mark abuts, nearest
 * first: `close-cite close-q` for a mark ending a `<cite>` that ends a `<q>`.
 * Reads like `data-followed-by` (punctuation.ts) — a fact about what comes
 * NEXT lives in its own attribute, never in `data-punct`.
 */
export const FOLLOWED_BY_QUOTE = 'data-followed-by-quote'

/** Mirrors `wrapHangablePairs`' squeezer marking, except the squeezer is a
 *  pseudo-element: CSS pays the half em on `q::after` itself. Same attribute
 *  name as punctuation.ts's, on a different kind of element. */
export const FOLLOWED_BY = 'data-followed-by'

/** Elements whose pseudo-elements can generate CJK brackets. */
export const QUOTE_GENERATOR_TAGS = new Set(['Q', 'CITE'])

const isElement = (n: Node | null): n is Element =>
  n?.nodeType === ELEMENT_NODE_TYPE

/* Plain `boolean`, not a type predicate: `!isGenerator(node)` would then
 * narrow an already-`Element` node to `never`. */
const isGenerator = (n: Node | null): boolean =>
  isElement(n) && QUOTE_GENERATOR_TAGS.has(n.tagName)

/**
 * Nodes that cannot separate a mark from a bracket because they render
 * nothing: `<wbr>`, comments, and the ZERO-LENGTH text nodes the wrapping
 * pass leaves at the seams where it split a text node.
 *
 * Whitespace text is deliberately not here — indentation collapses to a space
 * that really does render between the mark and the bracket, so it breaks
 * adjacency like any other text (same rule as `markAdjacentLines`).
 */
const isTransparent = (n: Node | null): boolean =>
  n?.nodeName === 'WBR'
  || n?.nodeType === COMMENT_NODE_TYPE
  || (n?.nodeType === TEXT_NODE_TYPE && n.nodeValue === '')

const lastRealChild = (parent: Element): Node | null => {
  let node: Node | null = parent.lastChild
  while (node !== null && isTransparent(node)) node = node.previousSibling
  return node
}

const firstRealChild = (parent: Element): Node | null => {
  let node: Node | null = parent.firstChild
  while (node !== null && isTransparent(node)) node = node.nextSibling
  return node
}

/** The node that effectively follows `start`, climbing out of wrappers it
 *  ends. Climbing is only reached when nothing follows within the parent —
 *  a trailing text node is returned instead and ends the search, which is
 *  how "any text breaks adjacency" falls out. */
const nextRealNode = (start: Element): Node | null => {
  let node: Node = start
  while (true) {
    let next: Node | null = node.nextSibling
    while (next !== null && isTransparent(next)) next = next.nextSibling
    if (next !== null) return next
    const parent: Element | null = node.parentElement
    if (parent === null) return null
    node = parent
  }
}

/**
 * Tokens for the brackets that would be painted right AFTER `$char`: every
 * ancestor `$char` closes, innermost first (`</cite></q>` → the 》 paints
 * before the 」). Climbing stops the moment `$char` is not the last thing in
 * an ancestor — being some descendant's last child is not the same as sitting
 * at the boundary, and `<q><em>好，</em>然後</q>` must keep its comma hanging.
 */
const closeTokens = ($char: Element): string[] => {
  const tokens: string[] = []
  let node: Element = $char
  while (true) {
    const parent = node.parentElement
    if (parent === null || lastRealChild(parent) !== node) return tokens
    if (isGenerator(parent)) tokens.push(`close-${parent.tagName.toLowerCase()}`)
    node = parent
  }
}

/**
 * Tokens for the brackets painted right BEFORE the element that follows
 * `$char` — outermost first, mirroring `close`'s nearest-first order (`<q>`'s
 * 「 paints before a nested `<cite>`'s 《). Non-generating wrappers are
 * descended through: an `<em>` between the mark and the `<q>` renders nothing.
 */
const openTokens = ($char: Element): string[] => {
  const tokens: string[] = []
  let node: Node | null = nextRealNode($char)
  while (isElement(node)) {
    if (isGenerator(node)) tokens.push(`open-${node.tagName.toLowerCase()}`)
    node = firstRealChild(node)
  }
  return tokens
}

/**
 * Is a hangable mark painted right after `$generator`'s close bracket? Unlike
 * `openTokens` this stops at a nested generator — its own bracket would come
 * between. Narrow on purpose: the attribute drives `letter-spacing: -.5em`,
 * so marking anything that does not actually squeeze costs half an em
 * (the conservative side `SQUEEZE_BEFORE_HANGABLE` already takes).
 */
const isFollowedByHangable = ($generator: Element): boolean => {
  let node: Node | null = nextRealNode($generator)
  while (isElement(node) && !isGenerator(node)) {
    if (node.matches('h-char[data-punct~="hangable"]')) return true
    node = firstRealChild(node)
  }
  return false
}

/**
 * Mark every punctuation wrapper that touches a `<q>` / `<cite>` boundary, and
 * every such element whose close bracket touches a hangable mark. Runs AFTER
 * `refinePunctuation` — the wrappers it marks are that pass's output — and is
 * idempotent: both attributes are recomputed from the DOM, never accumulated.
 */
export const markQuoteBoundaries = (src: Hyperly): Hype => {
  // ONE parse: `element(src)` and `hype(src)` each parse a string source into
  // their own DOM, so marking one and returning the other loses every
  // mutation (the lesson `markAdjacentLines` records).
  const h = hype(src)
  const $root = element(h)

  $root.querySelectorAll('h-char[data-punct]').forEach(($char) => {
    const tokens = [...closeTokens($char), ...openTokens($char)]
    if (tokens.length > 0) $char.setAttribute(FOLLOWED_BY_QUOTE, tokens.join(' '))
    else $char.removeAttribute(FOLLOWED_BY_QUOTE)
  })

  $root.querySelectorAll('q, cite').forEach(($generator) => {
    if (isFollowedByHangable($generator)) $generator.setAttribute(FOLLOWED_BY, 'hangable')
    else $generator.removeAttribute(FOLLOWED_BY)
  })

  return h
}
