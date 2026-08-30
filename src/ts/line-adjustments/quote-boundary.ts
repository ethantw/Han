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

import {
  PUNCT_PAIR_CHARS,
  SQUEEZE_NEXT,
  pairFollowerSubtype,
} from './punctuation.ts'

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

/** What the generator's opening pseudo is immediately followed by. This is
 *  the pseudo→DOM / pseudo→pseudo mirror of `FOLLOWED_BY`. */
export const OPEN_FOLLOWED_BY = 'data-open-followed-by'

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

/**
 * The node that effectively follows `start`, climbing out of wrappers it
 * ends. Climbing is only reached when nothing follows within the parent —
 * a trailing text node is returned instead and ends the search, which is
 * how "any text breaks adjacency" falls out.
 *
 * Climbing out of a GENERATOR ends the search with nothing: that element's
 * own close bracket is painted at exactly that point, so it, not whatever
 * comes after the element, is what follows. Missing this put two closing
 * brackets on top of each other — `《…〈…〉》` marked BOTH cites as meeting
 * the following comma, and both `::after`s took the half-em letter-spacing.
 */
const nextRealNode = (start: Element): Node | null => {
  let node: Node = start
  while (true) {
    let next: Node | null = node.nextSibling
    while (next !== null && isTransparent(next)) next = next.nextSibling
    if (next !== null) return next
    const parent: Element | null = node.parentElement
    if (parent === null || isGenerator(parent)) return null
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

/** Classify a wrapped, genuinely pair-compressible punctuation follower. */
const punctuationSubtypeAt = (start: Node | null): string => {
  let node = start
  while (isElement(node) && !isGenerator(node)) {
    if (node.matches('h-char[data-punct]')) {
      const ch = [...(node.textContent ?? '')][0] ?? ''
      if (!PUNCT_PAIR_CHARS.includes(ch)) return ''
      return pairFollowerSubtype(
        ch,
        node.matches('h-char[data-punct~="hangable"]'),
      )
    }
    node = firstRealChild(node)
  }
  return ''
}

/** Punctuation painted right after a generator's closing pseudo. */
const followedByPunctuation = ($generator: Element): string =>
  punctuationSubtypeAt(nextRealNode($generator))

/** Generated bracket(s) painted right after a generator's closing pseudo.
 *  Closing ancestors win over later siblings because their pseudo sits in
 *  between; when there is no such ancestor, descend into the next generator. */
const quoteTokensAfter = ($generator: Element): string[] => {
  const closes = closeTokens($generator)
  return closes.length > 0 ? closes : openTokens($generator)
}

/** What the generator's opening pseudo immediately meets inside itself. */
const afterOpeningPseudo = ($generator: Element): string => {
  const tokens: string[] = []
  let node: Node | null = firstRealChild($generator)
  while (isElement(node)) {
    if (isGenerator(node)) tokens.push(`open-${node.tagName.toLowerCase()}`)
    else {
      const subtype = punctuationSubtypeAt(node)
      if (subtype) return subtype
    }
    node = firstRealChild(node)
  }
  return tokens.join(' ')
}

/**
 * Mark every punctuation wrapper that touches a `<q>` / `<cite>` boundary, and
 * every generator pseudo that touches wrapped punctuation or another
 * generator. Runs AFTER `refinePunctuation` — the wrappers it marks are that
 * pass's output — and is idempotent: all attributes are recomputed from the
 * DOM, never accumulated.
 */
export const markQuoteBoundaries = (src: Hyperly): Hype => {
  // ONE parse: `element(src)` and `hype(src)` each parse a string source into
  // their own DOM, so marking one and returning the other loses every
  // mutation (the lesson `markAdjacentLines` records).
  const h = hype(src)
  const $root = element(h)

  $root.querySelectorAll('h-char[data-punct]').forEach(($char) => {
    const tokens = [...closeTokens($char), ...openTokens($char)]
    if (tokens.length > 0) {
      $char.setAttribute(FOLLOWED_BY_QUOTE, tokens.join(' '))
      // hyperly matches punctuation runs over flattened text. A generated
      // bracket at this boundary means that apparent DOM neighbour is not the
      // visual neighbour, so discard the ordinary pair/seam claims and let
      // the quote marker own the real boundary.
      $char.removeAttribute(SQUEEZE_NEXT)
      $char.removeAttribute(FOLLOWED_BY)
    } else {
      $char.removeAttribute(FOLLOWED_BY_QUOTE)
    }
  })

  $root.querySelectorAll('q, cite').forEach(($generator) => {
    const punct = followedByPunctuation($generator)
    if (punct) $generator.setAttribute(FOLLOWED_BY, punct)
    else $generator.removeAttribute(FOLLOWED_BY)

    const quoteTokens = quoteTokensAfter($generator)
    if (quoteTokens.length > 0)
      $generator.setAttribute(FOLLOWED_BY_QUOTE, quoteTokens.join(' '))
    else
      $generator.removeAttribute(FOLLOWED_BY_QUOTE)

    const openingFollower = afterOpeningPseudo($generator)
    if (openingFollower) $generator.setAttribute(OPEN_FOLLOWED_BY, openingFollower)
    else $generator.removeAttribute(OPEN_FOLLOWED_BY)
  })

  return h
}
