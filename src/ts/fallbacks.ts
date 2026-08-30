import { hype, element, type Hyperly, type Hype } from 'hyperly/fp'

import {
  refinePunctuation,
  refinePunctuationWithMode,
} from './line-adjustments/punctuation.ts'

import {
  markQuoteBoundaries,
  FOLLOWED_BY_QUOTE,
  FOLLOWED_BY as FOLLOWED_BY_ON_QUOTE,
  OPEN_FOLLOWED_BY,
  QUOTE_GENERATOR_TAGS,
} from './line-adjustments/quote-boundary.ts'

import {
  applyISS,
  applyISSWithProbe,
  applyISSWithMode,
} from './line-adjustments/iss.ts'

import {
  markAdjacentLines,
  markAdjacentLinesWithMode,
  ADJACENT_LINES_REFINED,
  FOLLOWED_BY_ADJACENT_LINE,
  FOLLOWED_BY_ADJACENT_WAVY,
  stampTargets,
} from './semantics/adjacent-lines.ts'

import { isServerSide } from './helpers/env.ts'
import { pipe } from './helpers/fp.ts'
import { forEachChunk } from './helpers/chunk.ts'

/* The three passes write their resolved mode back as an inline custom
 * property on the element they run on. That write belongs on the install
 * root only: a stale inline copy on a nested element locks that subtree
 * against later `:root` changes, and may clobber an author's inline opt-out.
 * So every non-root chunk restores its prior inline state after the pass. */
const SYNCED_VARS = [
  '--han-punctuation-refinement',
  '--han-text-autospace',
  '--han-text-decoration-inset',
] as const

/**
 * Run a single pass over `root` in stack-safe chunks. Use this to feed a
 * large document to any per-pass entry (`refinePunctuation`, `applyISS…`,
 * `markAdjacentLines…`) — fed whole, hyperly's recursive walk overflows at
 * ~7,500 nodes and fails PARTIALLY, leaving a half-refined page.
 * `installFallbacks` chunks internally; per-pass calls do not.
 */
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

/* Chunking leaves a "refined" stamp on every chunk — correct, but ×N
 * attribute noise. Converge back to the single-root contract by hoisting
 * descendants' stamps onto the install root. WHERE a stamp must live is the
 * pass's knowledge (stampTargets); this only undoes the chunk fan-out. */
const hoistAdjacentLinesStamp = (root: Element, stampOn: readonly Element[] = [root]): void => {
  const stamped = [...root.querySelectorAll(`[${ADJACENT_LINES_REFINED}]`)]
  // A tree that fits one chunk stamps the root itself, and querySelectorAll
  // never returns the root — "did the pass run?" must ask both places.
  const rootStamped = root.hasAttribute(ADJACENT_LINES_REFINED)
  if (stamped.length === 0 && !rootStamped) return
  stamped.forEach((el) => el.removeAttribute(ADJACENT_LINES_REFINED))
  if (rootStamped && !stampOn.includes(root)) root.removeAttribute(ADJACENT_LINES_REFINED)
  stampOn.forEach((el) => el.setAttribute(ADJACENT_LINES_REFINED, ''))
}

/**
 * Install every DOM-level typesetting fallback: 標點擠壓／懸掛
 * (`refinePunctuation`) → 混排間隙 (`applyISS`) → 鄰行間距
 * (`markAdjacentLines`), each in stack-safe chunks — no document size limit.
 *
 * Two execution modes, chosen by environment:
 *
 * - **Browser**: mutates the element in place (default
 *   `document.documentElement`); each pass self-gates on `CSS.supports`
 *   and the `--han-*` cascade variables, doing only what the engine lacks.
 * - **Node SSR**: requires an explicit source, runs every pass
 *   unconditionally (the browser's CSS decides at delivery time which
 *   wrappers become load-bearing), and returns a `Hype` — serialize with
 *   `html()` from `hyperly/fp`.
 *
 * @example
 * // SSR
 * import { installFallbacks } from '@hanzi.pro/han.css/ssr'
 * import { html } from 'hyperly/fp'
 * const rendered = html(installFallbacks('<main>…</main>'))
 */
export function installFallbacks(): Hype
export function installFallbacks(root: Element): Hype
export function installFallbacks(src: string | Hype): Hype
export function installFallbacks(root?: Hyperly) {
  if (isServerSide()) {
    if (root === undefined) {
      throw new Error('installFallbacks: SSR path requires an explicit source (string | Element | Hype)')
    }
    // hype(root) FIRST: the source's htmlType decides what html() emits;
    // element() on a fragment string would promote it to the host body and
    // break round-trip equality.
    const h = hype(root)
    const el = element(h)
    runPassChunked(el, (chunk) => refinePunctuationWithMode('auto')(chunk))
    runPassChunked(el, (chunk) => markQuoteBoundaries(chunk))
    runPassChunked(el, (chunk) => applyISSWithMode('strict')(chunk))
    runPassChunked(el, (chunk) => markAdjacentLinesWithMode('auto')(chunk))
    hoistAdjacentLinesStamp(el, stampTargets(h))
    return h
  }

  // One chunk loop per pass — a shared loop would interleave passes through
  // the document, making install order position-dependent for no benefit.
  const r = (root as Element | undefined) ?? document.documentElement
  runPassChunked(r, refinePunctuation)
  // Immediately after the wrappers exist and before anything else inserts
  // nodes into the inline flow — `<h-iss>` spacers between the mark and the
  // element boundary would read as content and break the adjacency.
  runPassChunked(r, markQuoteBoundaries)
  runPassChunked(r, applyISSWithProbe)
  runPassChunked(r, markAdjacentLines)
  hoistAdjacentLinesStamp(r)

  return hype(r)
}

/**
 * Reverse all DOM mutations made by `installFallbacks` — browser- or
 * SSR-produced alike; no prior install call required. Consumed author
 * spaces are restored, `<h-char>` unwrapped, `<h-iss>` removed, and all
 * marker attributes cleared.
 *
 * `root` defaults to `document.documentElement`; SSR requires it explicit.
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

  // The quote-boundary markers. `data-followed-by` is cleared only off the
  // elements that can generate a bracket: on an `<h-char>` the same attribute
  // is punctuation.ts's, and a blanket sweep would strip that too.
  $root.querySelectorAll(`[${FOLLOWED_BY_QUOTE}]`)
    .forEach(el => el.removeAttribute(FOLLOWED_BY_QUOTE))

  $root.querySelectorAll(`[${OPEN_FOLLOWED_BY}]`)
    .forEach(el => el.removeAttribute(OPEN_FOLLOWED_BY))

  $root.querySelectorAll([...QUOTE_GENERATOR_TAGS].join(', ').toLowerCase())
    .forEach(el => el.removeAttribute(FOLLOWED_BY_ON_QUOTE))

  // Clear BOTH pairing markers — missing the wavy one fails silently:
  // wrappers all gone, skip-gap still there.
  for (const attr of [FOLLOWED_BY_ADJACENT_LINE, FOLLOWED_BY_ADJACENT_WAVY]) {
    $root.querySelectorAll(`[${attr}]`)
      .forEach(el => el.removeAttribute(attr))
  }

  // Clear the "refined" stamp too, or the CSS keeps taking the JS-refined
  // branch on a stripped tree; the root itself may carry it.
  $root.removeAttribute(ADJACENT_LINES_REFINED)
  $root.querySelectorAll(`[${ADJACENT_LINES_REFINED}]`)
    .forEach(el => el.removeAttribute(ADJACENT_LINES_REFINED))
}
