/**
 * Adjacent-line gap fallback — JS-class fallback for browsers that do not
 * support `text-decoration-inset: auto`.
 *
 * The companion CSS in `src/css/semantics.with-js.css` revokes the pure-CSS
 * `:has()` fallback wherever this pass ran, then re-applies the gap from the
 * markers this pass sets:
 *
 *   [data-followed-by-adjacent-line]   straight-line families (`u`+`ins`,
 *                                      `s`+`del`) — gap in every mode.
 *   [data-followed-by-adjacent-wavy]   pairs involving `<cite>` — gap only under
 *                                      `--han-cite-title-marks: wavy`, the one
 *                                      mode where `<cite>` draws a line.
 *
 * This module adds those markers to every element that is effectively followed
 * by an element of the same family, with two traversal rules:
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
  element, hype, htmlType,
  type Hyperly, type Hype,
} from 'hyperly/fp'

import { isBrowserSide } from '../helpers/env.ts'
import { identity, pipe, tap } from '../helpers/fp.ts'

const ELEMENT_NODE_TYPE = 1
const COMMENT_NODE_TYPE = 8

export const ADJACENT_LINES_REFINED = 'data-adjacent-lines-refined'
export const FOLLOWED_BY_ADJACENT_LINE = 'data-followed-by-adjacent-line'

/**
 * Second marker, for pairs where a `<cite>` is one of the two.
 *
 * `<cite>` only draws a line under `--han-cite-title-marks: wavy` (書名號甲式),
 * and that is a CSS fact this pass cannot read — the mode lives in the cascade.
 * So the pass records WHICH FAMILY paired and `semantics.with-js.css` decides
 * whether that family currently draws a line. Folding cite into the plain
 * marker instead would put a stray 2px before 《 in `bracket` mode.
 */
export const FOLLOWED_BY_ADJACENT_WAVY = 'data-followed-by-adjacent-wavy'

/**
 * Selector groups for "same family" — elements with the same kind of
 * decoration line. Underline-family and strike-family don't interact.
 */
export const SELECTORS_FOR_ELEMENTS_WITH_LINES = ['u, ins', 's, del'] as const

/**
 * One pairing rule: mark an element matching `subject` when the element that
 * effectively follows it matches `next`, using attribute `attr`.
 *
 * Same-family rules have `subject === next`; the wavy 書名號 rules are
 * DIRECTED, because the family is asymmetric — `<cite>` counts as underlined
 * only in wavy mode, so a `u`→`cite` pair must be marked on the `u` with the
 * wavy attribute (the gap belongs to the earlier element), while a `u`→`u` pair
 * is plain-family business.
 */
type PairingRule = {
  readonly subject: string
  readonly next: string
  readonly attr: string
}

/** Default rules: the two straight-line families, plus the two directed wavy
 *  ones that give `<cite>` a family at all (it had none until 2026-08-08 —
 *  see FOLLOWED_BY_ADJACENT_WAVY). `cite` is unqualified here on purpose:
 *  `:lang(zh)` gating belongs to the CSS, which is where the mode lives. */
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

/**
 * Where the "refined" stamp has to go so that it SURVIVES `html(src)`.
 *
 * The companion CSS reads the stamp off an ANCESTOR, so the pass has always
 * put it on the source's root. But hyperly picks its serialiser from the
 * source's shape:
 *
 *   | htmlType    | source                                       | html() emits     | root attrs |
 *   |-------------|----------------------------------------------|------------------|------------|
 *   | `Outer`     | `<div>…</div>`, an Element, a full document   | `outerHTML`      | kept |
 *   | `BodyOuter` | a lone `<body>`                              | `body.outerHTML` | kept |
 *   | `Inner`     | has head/body but incomplete                 | `innerHTML`      | **dropped** |
 *   | `BodyInner` | a bare fragment string — the common SSR case | `body.innerHTML` | **dropped** |
 *
 * For the two `*Inner` shapes the root is a container the output never contains
 * (a synthetic `<body>` for fragment strings), so stamping it writes to
 * /dev/null: the per-element markers ship, the ancestor stamp does not, and
 * `semantics.with-js.css` can no longer revoke the pure-CSS skip-gap it exists
 * to revoke. Measured symptom: 2px, on the manual's SSR specimen page
 * (2026-08-08 — docs/notes/2026-08-08-ssr-string-source-loses-root-marker.md).
 *
 * So for those shapes, stamp the top-level element children instead — each is
 * the root of a refined subtree and each IS serialised. Usually there is exactly
 * one (`installFallbacks('<main>…</main>')`), so the byte cost is unchanged.
 *
 * Two deliberate exclusions:
 *
 *   - **Our own wrappers.** On a text-only fragment (`'甲乙，丙'`) the
 *     punctuation pass can leave an `<h-char>` as the only top-level element.
 *     Nothing inside an `<h-char>` / `<h-iss>` can be a `<u>` / `<cite>`, so
 *     there is nothing to protect; claiming a generated inline wrapper is an
 *     author container would just be noise in a diff.
 *   - **Nothing at all** when every top-level element is one of ours — no stamp
 *     is the honest answer, and the CSS stays on its pure-CSS branch.
 *
 * Known edge, documented rather than solved: when a top-level child is ITSELF a
 * `<u>` / `<cite>`, the revoke rule wants a proper ancestor and an element is
 * not its own ancestor. Wrap the fragment in a container and it is fine.
 */
const OWN_WRAPPERS = /^H-(CHAR|ISS|LAYER)$/

export const stampTargets = (src: Hyperly): readonly Element[] => {
  const type = htmlType(src)
  const $root = element(src)
  if (type === 'Outer' || type === 'BodyOuter') return [$root]
  return [...$root.children].filter(($child) => !OWN_WRAPPERS.test($child.tagName))
}

type Selectors = readonly (string | PairingRule)[]

/**
 * Per-family `Hype → Hype` pass — finds every element under `src` matching a
 * rule's `subject` that is effectively followed by an element matching its
 * `next` (via sibling, wrapper descent, or parent climbing), and adds that
 * rule's attribute to it. Returns `hype(src)` so the pass composes with other
 * Hyperly transforms.
 *
 * Accepts the historical shape too: a bare selector string means "same family,
 * `[data-followed-by-adjacent-line]`" — so existing callers passing
 * `SELECTORS_FOR_ELEMENTS_WITH_LINES` (or their own string list) are unchanged.
 */
export const markAdjacentLinesWithSelectors =
    (selectors: Selectors) =>
    (src: Hyperly): Hype => {
  // ONE parse, then work inside it. `element(src)` and `hype(src)` on a STRING
  // source each parse their own DOM — mark in the first, return the second, and
  // every mutation is thrown away: `markAdjacentLinesWithSelectors(['u, ins'])`
  // called with a string was completely inert, silently
  // (2026-08-08; the other passes already did `hype()` first).
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
 * cascade var to `'0'` on `src`, which `semantics.with-js.css`'s
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
