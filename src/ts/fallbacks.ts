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
} from './semantics/adjacent-lines.ts'

import {
  detectAutospaceBoundaryBug,
  detectStyleQuerySupport,
} from './helpers/probes.ts'

import { isServerSide } from './helpers/env.ts'
import { pipe } from './helpers/fp.ts'

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
    // Each transform returns a new Hype wrapping the SAME element
    // reference, so the void mutators still see the in-place changes.
    return pipe<Hyperly, Hype, Hype, Hype>
      (
        refinePunctuationWithMode('auto'),
        applyISSWithMode('strict'),
        markAdjacentLinesWithMode('auto'),
      )
      (hype(root))
  }

  runProbes()
  const r = (root as Element | undefined) ?? document.documentElement
  refinePunctuation(r)
  applyISSWithProbe(r)
  markAdjacentLines(r)

  return hype(r)
}

/**
 * Run browser-capability probes and stamp the results onto `<html>`.
 *
 * Each probe is memoised — repeat calls within the same document are
 * effectively free. Called automatically by `installFallbacks()` and
 * when `--han-install: probes` is set.
 *
 * Side effects on `document.documentElement`:
 *
 *   - `--han-probe-autospace: broken` / `data-probe-autospace="broken"`
 *     when Safari's `text-autospace` inline-boundary bug is detected.
 *   - `--han-probe-style-query: unsupported` / `data-probe-style-query="unsupported"`
 *     when CSS Style Queries (`@container style()`) are not supported.
 */
export const runProbes = () => {
  detectAutospaceBoundaryBug()
  detectStyleQuerySupport()
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
}
