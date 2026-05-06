/**
 * Adjacent-line gap fallback — JS-class fallback for browsers that do not
 * support `text-decoration-inset: auto`.
 *
 * The companion CSS in `src/css/with-js/semantics.css` reads:
 *
 *   :where(u, ins, s, del, cite) {
 *     &:where(:not([data-followed-by-adjacent-line])) { margin-inline-end: initial }
 *     &:where([data-followed-by-adjacent-line])       { margin-inline-end: var(--…) }
 *   }
 *
 * This module adds `[data-followed-by-adjacent-line]` to every element that is
 * effectively followed by a same-family element, with two traversal rules:
 *
 *   1. Wrapper descent — if the next candidate node is not itself a same-family
 *      element, descend into its first-child chain to check whether it *starts*
 *      with one (e.g. `<u>a</u><em><u>b</u>…</em>` → mark `<u>a</u>`).
 *      A text node at any depth immediately stops the search.
 *
 *   2. Parent climbing — if an element has no real next sibling, climb to its
 *      parent and continue looking there (e.g. `<p><u>a</u></p><u>b</u>` →
 *      mark `<u>a</u>`). Climbing stops at the `root` passed to
 *      `markAdjacentLines`. Because `margin-inline-end` on the last inline
 *      element inside a block container produces no visible gap, false positives
 *      across block boundaries are visually harmless.
 *
 * Pure CSS `:where(u,ins):has(+ u, + ins)` cannot replicate this because:
 *   • CSS `+` skips text nodes — `<u>a</u>b<u>c</u>` would be incorrectly
 *     matched even though text `b` separates the two underlines.
 *   • CSS cannot descend into a sibling's subtree to check its first child.
 *
 * `<wbr>` and HTML comments are typographically invisible and are skipped at
 * every level of the traversal.
 */

import {
  element, hype,
  type Hyperly, type Hype,
} from 'hyperly/fp'

import { isBrowserSide } from '../helpers/env.ts'
import { identity, pipe, tap } from '../helpers/fp.ts'

const ELEMENT_NODE_TYPE = 1
const COMMENT_NODE_TYPE = 8

export const ADJACENT_LINES_REFINED = 'data-adjacent-lines-refined'
export const FOLLOWED_BY_ADJACENT_LINE = 'data-followed-by-adjacent-line'

/**
 * Selector groups for "same family" — elements with the same kind of
 * decoration line. Underline-family and strike-family don't interact.
 */
export const SELECTORS_FOR_ELEMENTS_WITH_LINES = ['u, ins', 's, del'] as const

const ignore = (node: Node | null): boolean =>
  node?.nodeName === 'WBR' ||
  node?.nodeType === COMMENT_NODE_TYPE

/** Walk forward past `<wbr>` and comments to find the next real node. */
const getValidNext = (node: Node | null): Node | null => {
  const next = node?.nextSibling ?? null
  return ignore(next) ? getValidNext(next) : next
}

/**
 * Walk forward past `<wbr>` and comments among an element's *children*
 * to find the first real child node (text or element).
 */
const getFirstRealChild = (el: Element): Node | null => {
  let node: Node | null = el.firstChild
  while (node !== null && ignore(node)) node = node.nextSibling
  return node
}

/**
 * Check whether `start` — or the first-child chain descended from it —
 * begins with an element matching `selector` before any text node.
 * Tail-recursive logic implemented as a `while` loop (no TCO needed).
 */
const startsWithMatch = (start: Element, selector: string): boolean => {
  let el: Element = start
  while (true) {
    const first = getFirstRealChild(el)
    if (first === null || first.nodeType !== ELEMENT_NODE_TYPE) return false
    const firstEl = first as Element
    if (firstEl.matches(selector)) return true
    el = firstEl
  }
}

/**
 * Like `getValidNext`, but when `start` has no real next sibling, climbs
 * to the parent and tries again — stopping at `root`.
 * Tail-recursive logic implemented as a `while` loop.
 */
const getNextCandidateNode =
    (start: Element, root: Element): Node | null => {
  let el: Element = start
  while (true) {
    const next = getValidNext(el)
    if (next !== null) return next
    const parent = el.parentElement
    if (parent === null || parent === root) return null
    el = parent
  }
}

type Selectors = readonly string[]

/**
 * Per-family `Hype → Hype` pass — finds every element under `src` matching
 * `selector` that is effectively followed by a same-family element (via
 * sibling, wrapper descent, or parent climbing), and adds
 * `[data-followed-by-adjacent-line]` to it. Returns `hype(src)` so the pass
 * composes with other Hyperly transforms.
 */
export const markAdjacentLinesWithSelectors =
    (selectors: Selectors) =>
    (src: Hyperly): Hype => {
  const $src = element(src) as HTMLElement
  $src.setAttribute(ADJACENT_LINES_REFINED, '')

  selectors.forEach(selector => {
    [...$src.querySelectorAll(selector)]
      .filter(el => {
        const next = getNextCandidateNode(el, $src)
        if (!next || next.nodeType !== ELEMENT_NODE_TYPE) {
          return false
        }
        const nextElmt = next as Element
        return (
          nextElmt.matches(selector)
          || startsWithMatch(nextElmt, selector)
        )
      })
      .forEach($elmt => $elmt.setAttribute(FOLLOWED_BY_ADJACENT_LINE, ''))
  })

  return hype(src)
}

/** CSS values Han.css currently supports for `--han-text-decoration-inset`. */
export type DecorationInsetMode = 'auto' | '0'

/**
 * Write `--han-text-decoration-inset: {mode}` as an inline style on `src`.
 * Pure setter — no marking pass; for the atomic "set + apply" combo,
 * call `markAdjacentLinesWithMode(mode)(src)` instead.
 */
export const setDecorationInsetMode =
    (mode: DecorationInsetMode) =>
    (src: Hyperly): void =>
  (element(src) as HTMLElement)
    .style
    .setProperty('--han-text-decoration-inset', mode)

/* ─── Mode-specific transform recipes (module-level, pure values) ────────── */

/** Default same-family marking pass — `[data-followed-by-adjacent-line]` on
 *  every underline/strike-family element followed by another in its family.
 *  Bound to the default selector groups; callers needing other groups
 *  invoke `markAdjacentLinesWithSelectors(...)` directly. */
const markDefault = markAdjacentLinesWithSelectors(SELECTORS_FOR_ELEMENTS_WITH_LINES)

/** Mode → `Hyperly → Hype` dispatch. Pure value table, no side effects. */
const dispatchByDecorationInsetMode = (mode: DecorationInsetMode): ((src: Hyperly) => Hype) =>
  mode === '0'
  ? hype

  : markDefault

/** Cascade-write half of the `withMode` contract — only fires in browser.
 *  Future CSS uses `@container style(--han-text-decoration-inset: …)` to
 *  switch styles per subtree; markup and cascade var must stay atomic, so
 *  this gets `pipe`d with `dispatchByDecorationInsetMode`. SSR skips the
 *  write — the client-side run will set it on hydration. */
const syncCascadeIfBrowser = (mode: DecorationInsetMode) =>
  isBrowserSide()
  ? tap(setDecorationInsetMode(mode))
  : identity

export const markAdjacentLinesWithMode = (mode: DecorationInsetMode) =>
  pipe<Hyperly, Hyperly, Hype>(
    syncCascadeIfBrowser(mode),
    dispatchByDecorationInsetMode(mode),
  )

/** Pure read: resolve the cascade-declared mode on `src`. Anything other than
 *  `'auto'` (including `'0px'` after `@property` normalisation) maps to `'0'`. */
const resolveDecorationInsetMode = (src: Hyperly): DecorationInsetMode => {
  const raw = getComputedStyle(element(src))
    .getPropertyValue('--han-text-decoration-inset').trim()
  return raw === 'auto' ? 'auto' : '0'
}

/**
 * Cascade-dispatching entry — reads `--han-text-decoration-inset` off `src`,
 * then gates on `CSS.supports('text-decoration-inset', 'auto')` for native
 * support. SSR (`typeof CSS` undefined) always runs the transform.
 *
 * Diverges from `refinePunctuation`'s downgrade-to-different-mode shape:
 * here, native support means "JS does nothing at all" (not "JS runs in a
 * smaller mode"). Calling `markAdjacentLinesWithMode('0')` would stomp the
 * cascade var to `'0'` on `src`, which `with-js/semantics.css`'s
 * `@container style(--han-text-decoration-inset: 0)` would (wrongly) match —
 * suppressing styles author intended at the `:root` `auto` declaration. So
 * we short-circuit `hype(src)` instead, leaving the cascade authoritative.
 *
 * To override the selector families, call `markAdjacentLinesWithSelectors`
 * directly (bypasses cascade and `CSS.supports`).
 *
 * Returns a `Hype` wrapping `src`. Idempotent — re-running on already-marked
 * DOM is a no-op.
 */
export const markAdjacentLines = (src: Hyperly): Hype => {
  const declared =
    typeof CSS !== 'undefined'
    ? resolveDecorationInsetMode(src)
    : 'auto'

  // Native or explicit opt-out: skip JS without stomping cascade.
  if (
    declared === '0' ||
    (typeof CSS !== 'undefined' && CSS.supports('text-decoration-inset', 'auto'))
  ) {
    return hype(src)
  }

  return markAdjacentLinesWithMode('auto')(src)
}
