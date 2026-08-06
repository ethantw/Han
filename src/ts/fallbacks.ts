import { hype, element, type Hyperly, type Hype } from 'hyperly/fp'

import {
  refinePunctuation,
  refinePunctuationWithMode,
} from './line-adjustments/punctuation.ts'

import {
  applyISS,
  applyISSWithProbe,
  applyISSWithMode,
} from './line-adjustments/iss.ts'

import {
  markAdjacentLines,
  markAdjacentLinesWithMode,
  ADJACENT_LINES_REFINED,
} from './semantics/adjacent-lines.ts'

import { isServerSide } from './helpers/env.ts'
import { pipe } from './helpers/fp.ts'
import { forEachChunk } from './helpers/chunk.ts'

/**
 * Install all DOM-level fallbacks. Two execution modes:
 *
 *   - **Browser** (`document` / `CSS` available): mutate the given
 *     `Element` in place; gate each transform by `CSS.supports` and
 *     the `--han-punctuation-refinement` / `--han-text-autospace` cascade vars.
 *     Returns `void`. This is what the auto-installer at the bottom
 *     of this file invokes on `DOMContentLoaded`.
 *   - **Node SSR** (`document` undefined): treat `root` as a Hyperly
 *     source (`string | Element | Hype`), materialise it through
 *     happy-dom (`element(root)`), run every transform unconditionally,
 *     and return a `Hype` so the caller can `html(...)` it back to a
 *     string. No `CSS.supports` / `getComputedStyle` paths are taken —
 *     the browser CSS decides at delivery time which wrappers stay
 *     load-bearing.
 *
 * Transform inventory:
 *
 *   - 標點擠壓 + 標點懸掛  ← `refinePunctuationWithMode(mode)` (single pass)
 *   - 混排間隙             ← `replaceISS` + `insertISS` (gated in browser
 *                            by `--han-text-autospace`; unconditional in SSR)
 *   - 鄰行間距             ← `markAdjacentLines` (gated in browser by
 *                            `text-decoration-inset: auto`; unconditional in SSR)
 *   - 注音 ruby            ← CSS-native（`ruby-position: inter-character` + font GPOS；
 *                            `@supports not` fallback for Chrome/Firefox）
 *                            `transformZhuyinRuby` no longer called by `installFallbacks`.
 *
 * `--han-punctuation-refinement` legal values (browser-only; SSR forces `auto`):
 *
 *   `auto` (default)  — Run JS only for what the engine doesn't natively
 *                       support. Both supported → no JS punct work;
 *                       trim-start only → emit hang wrappers;
 *                       allow-end only → emit compress wrappers;
 *                       neither → emit combined wrappers in one pass.
 *   `compress`        — Force compress-only wrappers regardless of native.
 *   `hang`            — Force hang-only wrappers regardless of native.
 *   `none`            — Skip JS punct refinement entirely.
 *
 * `--han-text-autospace` legal values (unchanged):
 *
 *   `normal` (default)  — native `text-autospace: normal` (= insert);
 *                         no JS work.
 *   `insert`            — alias for `normal`.
 *   `replace`           — native off; JS runs `replaceISS` to consume
 *                         author-typed whitespace at Han ↔ Western
 *                         boundaries (CSS-Text-4 `replace` semantic,
 *                         not yet shipped by any engine).
 *   `strict`            — native off; JS runs both `replaceISS` and
 *                         `insertISS`, so every Han ↔ Western pair
 *                         (with or without an author space) ends up
 *                         spaced via the `<h-iss>` element. All-JS
 *                         path is chosen deliberately — letting native
 *                         insert ride alongside JS-injected `<h-iss>`
 *                         risks a double ¼-em on engines that treat
 *                         the inline custom element as transparent.
 *   `no-autospace`      — native off; no JS work either.
 */
/**
 * The three passes write their resolved mode back as an INLINE custom
 * property on the element they are called with (`syncCascadeIfBrowser`).
 * Called once on the root that is the documented contract; called once per
 * CHUNK it would litter nested elements with inline copies of an inherited
 * value — and a stale inline copy LOCKS that subtree against later `:root`
 * changes (the exact failure console-config.js § applyTarget scrubs for).
 * So every non-root chunk restores its prior inline state after the pass —
 * which also protects author-set inline opt-outs (`--han-punctuation-
 * refinement: none` on a demo box IS an element a chunk walk may land on).
 */
const SYNCED_VARS = [
  '--han-punctuation-refinement',
  '--han-text-autospace',
  '--han-text-decoration-inset',
] as const

export const runPassChunked = (root: Element, fn: (el: Element) => unknown): void => {
  forEachChunk(root, (el) => {
    if (el === root) {
      fn(el)
      return
    }
    const style = (el as HTMLElement).style
    if (!style) {
      fn(el)
      return
    }
    const prior = SYNCED_VARS.map((v) => [v, style.getPropertyValue(v)] as const)
    fn(el)
    for (const [v, val] of prior) {
      if (val) style.setProperty(v, val)
      else style.removeProperty(v)
    }
  })
}

/**
 * 鄰行 pass 在它施作的根上蓋 `data-adjacent-lines-refined` 章（CSS 靠祖先
 * 上的這個章判定「已修補」——semantics.with-js.css）。分塊後章會落在每個
 * chunk 上——語意沒錯，但屬性噪音 ×N，且與單根時代的輸出不再逐位元相等。
 * 收斂回單根契約：後代的章全部上移到安裝根。pass 整個被跳過（原生支援）
 * 時後代沒有章，這裡也不會無中生有。
 */
const hoistAdjacentLinesStamp = (root: Element): void => {
  const stamped = root.querySelectorAll(`[${ADJACENT_LINES_REFINED}]`)
  if (stamped.length === 0) return
  stamped.forEach((el) => el.removeAttribute(ADJACENT_LINES_REFINED))
  root.setAttribute(ADJACENT_LINES_REFINED, '')
}

export function installFallbacks(): Hype
export function installFallbacks(root: Element): Hype
export function installFallbacks(src: string | Hype): Hype
export function installFallbacks(root?: Hyperly) {
  if (isServerSide()) {
    if (root === undefined) {
      throw new Error('installFallbacks: SSR path requires an explicit source (string | Element | Hype)')
    }
    // hype(root) FIRST so the original htmlType (BodyInner / Outer / …)
    // is preserved — calling element() on a fragment string would
    // promote it to the host body Element and html() would then emit
    // a `<body>…</body>` wrapper, breaking round-trip equality.
    // The transforms mutate the same element reference in place, so the
    // chunked calls below compose exactly like the old straight pipe —
    // and the chunking matters in Node too: its default stack is in the
    // same ballpark as the browsers'.
    const h = hype(root)
    const el = element(h)
    runPassChunked(el, (chunk) => refinePunctuationWithMode('auto')(chunk))
    runPassChunked(el, (chunk) => applyISSWithMode('strict')(chunk))
    runPassChunked(el, (chunk) => markAdjacentLinesWithMode('auto')(chunk))
    hoistAdjacentLinesStamp(el)
    return h
  }

  // No separate probe step: the only probe there is
  // (`detectAutospaceBoundaryBug`, for Safari's inline-boundary bug) is read
  // by exactly one pass, so it lives inside that pass — `applyISSWithProbe`
  // runs it, memoised. A standalone `runProbes()` used to sit here and was
  // exported for callers assembling their own set; it bought nothing but a
  // way to get the order wrong.
  //
  // CHUNKED, not one straight walk over the root: hyperly's walk recurses
  // per node and blows the stack at ~7,500 nodes — WORSE, it fails
  // partially, leaving a half-refined page with no error anyone will
  // connect to typography (docs/notes/2026-08-05-install-fallbacks-stack-
  // overflow.md, found by the 12k-node bare-page demo). `forEachChunk`
  // splits at element-only levels, which is exactly the boundary both
  // passes tolerate: the punctuation look-ahead and the adjacent-lines
  // sibling pairing both live inside inline flow, and inline flow is never
  // split (see chunk.ts). Each pass runs its own chunk loop — a shared
  // loop would interleave passes per chunk, changing the install order
  // within the document for no benefit.
  const r = (root as Element | undefined) ?? document.documentElement
  runPassChunked(r, refinePunctuation)
  runPassChunked(r, applyISSWithProbe)
  runPassChunked(r, markAdjacentLines)
  hoistAdjacentLinesStamp(r)

  return hype(r)
}

/**
 * Reverse all DOM mutations made by `installFallbacks`. Works on any
 * subtree regardless of whether it was processed by the browser or SSR
 * path — no prior `installFallbacks` call is required.
 *
 * What is removed:
 *
 *   - `<h-iss data-mode="replace">` — restores the original author
 *     space (U+0020) that `replaceISS` consumed at a Han ↔ Western
 *     boundary.
 *   - `<h-iss>` (insert mode) — deleted without replacement; no space
 *     existed in the source at that boundary.
 *   - `<h-char>` — unwrapped back to the plain punctuation text node.
 *   - `[data-followed-by-adjacent-line]` — attribute removed.
 *
 * `root` defaults to `document.documentElement` when omitted.
 */
export function uninstallFallbacks(root?: Hyperly) {
  if (isServerSide() && root === undefined) {
    throw new Error('uninstallFallbacks: SSR path requires an explicit source (string | Element | Hype)')
  }

  const $root = element(root ?? document.documentElement)

  $root.querySelectorAll('h-iss[data-mode="replace"]')
    .forEach(el => el.replaceWith(' '))

  $root.querySelectorAll('h-iss')
    .forEach(el => el.remove())

  $root.querySelectorAll('h-char')
    .forEach(el => el.replaceWith(el.textContent ?? ''))

  $root.querySelectorAll('[data-followed-by-adjacent-line]')
    .forEach(el => el.removeAttribute('data-followed-by-adjacent-line'))

  // 「已修補」章也要撤——留著它，CSS 會在 wrapper 已拆光的樹上繼續按
  // 「JS 修補過」的分支行事。根自己也可能帶章（querySelectorAll 不含根）。
  $root.removeAttribute(ADJACENT_LINES_REFINED)
  $root.querySelectorAll(`[${ADJACENT_LINES_REFINED}]`)
    .forEach(el => el.removeAttribute(ADJACENT_LINES_REFINED))
}
