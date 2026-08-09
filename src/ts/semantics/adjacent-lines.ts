/**
 * Adjacent-line gap fallback (鄰行間距) for engines without
 * `text-decoration-inset: auto`: when two same-family decorated elements
 * touch, the earlier one gets a marker attribute and the companion CSS
 * (`semantics.with-js.css`) turns it into a small inline gap — two adjacent
 * 專名號 are two names, not one.
 *
 * Two markers, because `<cite>` only draws a line in one title-mark mode and
 * JS cannot read the cascade: `[data-followed-by-adjacent-line]` for the
 * straight-line families (`u`+`ins`, `s`+`del`, gap in every mode) and
 * `[data-followed-by-adjacent-wavy]` for pairs involving `<cite>` (gap only
 * under `--han-cite-title-marks: wavy`). The CSS decides whether the paired
 * family currently draws a line; the JS only records which family paired.
 *
 * Pure CSS `:has(+ …)` cannot replace this pass: `+` skips text nodes
 * (`<u>a</u>b<u>c</u>` would falsely match) and cannot descend into a
 * sibling's subtree to check what it starts with.
 */

import {
  element, hype, htmlType,
  type Hyperly, type Hype,
} from 'hyperly/fp'

import { isBrowserSide } from '../helpers/env.ts'
import { identity, pipe, tap } from '../helpers/fp.ts'

const ELEMENT_NODE_TYPE = 1
const COMMENT_NODE_TYPE = 8

export const ADJACENT_LINES_REFINED = 'data-adjacent-lines-refined'
export const FOLLOWED_BY_ADJACENT_LINE = 'data-followed-by-adjacent-line'

/** Marker for pairs involving `<cite>` — gap applies only in wavy 書名號
 *  mode, a cascade fact the CSS gates on (see file header). */
export const FOLLOWED_BY_ADJACENT_WAVY = 'data-followed-by-adjacent-wavy'

/**
 * Selector groups for "same family" — elements with the same kind of
 * decoration line. Underline-family and strike-family don't interact.
 */
export const SELECTORS_FOR_ELEMENTS_WITH_LINES = ['u, ins', 's, del'] as const

/**
 * One pairing rule: mark an element matching `subject` (with `attr`) when the
 * element that effectively follows it matches `next`. Rules are DIRECTED —
 * the gap belongs to the earlier element, and the cite family is asymmetric
 * (`u`→`cite` is wavy business, `u`→`u` is plain-family business).
 */
type PairingRule = {
  readonly subject: string
  readonly next: string
  readonly attr: string
}

/** Default rules: the two straight-line families plus the two directed wavy
 *  ones. `cite` is unqualified on purpose — `:lang(zh)` gating belongs to
 *  the CSS, where the mode lives. */
export const ADJACENT_LINE_PAIRING_RULES: readonly PairingRule[] = [
  ...SELECTORS_FOR_ELEMENTS_WITH_LINES
    .map((s) => ({ subject: s, next: s, attr: FOLLOWED_BY_ADJACENT_LINE })),
  { subject: 'cite',  next: 'u, ins, cite', attr: FOLLOWED_BY_ADJACENT_WAVY },
  { subject: 'u, ins', next: 'cite',        attr: FOLLOWED_BY_ADJACENT_WAVY },
]

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

/* han.css's own generated wrappers — never author containers. */
const OWN_WRAPPERS = /^H-(CHAR|ISS|LAYER)$/

/**
 * Where the "refined" stamp survives serialization. The companion CSS reads
 * the stamp off an ANCESTOR, but hyperly serializes `Inner`/`BodyInner`
 * sources (fragment strings — the common SSR case) as their container's
 * innerHTML, so a stamp on that container never reaches the output and the
 * CSS can't revoke the pure-CSS skip-gap it exists to revoke. For those
 * shapes, stamp the top-level element children instead — each is serialized
 * and each roots a refined subtree; skip han.css's own wrappers (nothing
 * inside an `<h-char>` can be a decorated element, and when ALL top-level
 * elements are ours, no stamp is the honest answer).
 *
 * Known edge: a top-level child that IS itself a `<u>`/`<cite>` cannot serve
 * as its own ancestor — wrap the fragment in a container.
 */
export const stampTargets = (src: Hyperly): readonly Element[] => {
  const type = htmlType(src)
  const $root = element(src)
  if (type === 'Outer' || type === 'BodyOuter') return [$root]
  return [...$root.children].filter(($child) => !OWN_WRAPPERS.test($child.tagName))
}

type Selectors = readonly (string | PairingRule)[]

/**
 * Marking pass with explicit rules — finds every element matching a rule's
 * `subject` that is effectively followed by an element matching its `next`,
 * and adds that rule's attribute. "Effectively followed" tolerates markup
 * between the pair: wrapper descent (`<u>a</u><em><u>b</u>…` pairs across the
 * `<em>`), parent climbing (`<p><u>a</u></p><u>b</u>` pairs across the block
 * edge — harmless, a trailing gap never renders), and `<wbr>`/comments are
 * skipped; any text between the two breaks the pair.
 *
 * A bare selector string means "same family, `[data-followed-by-adjacent-line]`".
 */
export const markAdjacentLinesWithSelectors =
    (selectors: Selectors) =>
    (src: Hyperly): Hype => {
  // ONE parse. element(src) and hype(src) on a string source each parse
  // their own DOM — mark in one, return the other, and every mutation is
  // silently thrown away.
  const h = hype(src)
  const $src = element(h) as HTMLElement
  stampTargets(h).forEach(($el) => $el.setAttribute(ADJACENT_LINES_REFINED, ''))

  selectors.forEach(rule => {
    const { subject, next: nextSel, attr } = typeof rule === 'string'
      ? { subject: rule, next: rule, attr: FOLLOWED_BY_ADJACENT_LINE }
      : rule

    ;[...$src.querySelectorAll(subject)]
      .filter(el => {
        const next = getNextCandidateNode(el, $src)
        if (!next || next.nodeType !== ELEMENT_NODE_TYPE) {
          return false
        }
        const nextElmt = next as Element
        return (
          nextElmt.matches(nextSel)
          || startsWithMatch(nextElmt, nextSel)
        )
      })
      .forEach($elmt => $elmt.setAttribute(attr, ''))
  })

  return h
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
const markDefault = markAdjacentLinesWithSelectors(ADJACENT_LINE_PAIRING_RULES)

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

/** Force a literal mode: sync the cascade var (browser only), then mark with
 *  the default rules (`auto`) or do nothing (`'0'`). Bypasses `CSS.supports`. */
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
 * Cascade-dispatching entry — reads `--han-text-decoration-inset` off `src`
 * and stands down when the engine supports `text-decoration-inset: auto`
 * natively or the cascade opts out; SSR always marks. Idempotent.
 *
 * Standing down short-circuits WITHOUT writing the cascade var: stomping it
 * to `'0'` would make the companion CSS's opt-out query match against the
 * author's `:root`-declared intent. Skipping must leave the cascade
 * authoritative.
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
