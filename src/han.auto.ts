/**
 * Auto-install entry point — a drop-in alternative to `han.js` that triggers
 * fallback installation as a module-load side effect, preserving the v3
 * behaviour for projects that previously relied on implicit auto-setup.
 *
 * On module load, `autoInstallFallbacks()` fires and respects the
 * `--han-install` CSS custom property on `:root`. The value is a
 * WHITESPACE-SEPARATED TOKEN LIST, so a page can ask for exactly the passes
 * it wants:
 *
 * - `auto` (default) — runs the full `installFallbacks()` suite
 * - `fallbacks`       — runs punctuation, ISS, and adjacent-line passes only
 * - `probes`          — runs environment-probe passes only
 * - `none`            — skips installation entirely
 * - `punctuation`     — 標點擠壓／懸掛 pass only
 * - `iss`             — 混排間隙 pass only
 * - `adjacent-lines`  — 鄰行間距 pass only
 *
 * The last three combine freely, with or without `probes`:
 * `--han-install: punctuation iss` runs those two and nothing else. The four
 * original keywords keep their exact v4 meaning, so no existing declaration
 * changes behaviour.
 *
 * ⚠ These switches choose BEHAVIOUR, not bundle size. Every pass shares the
 * same hyperly + helpers floor (~6.5k brotli of the 8.4k whole), so a
 * narrower selection ships the same file — it just does less to your DOM.
 * The way to actually pay less is to import the named passes from `han.js`
 * and let your own bundler shake the rest (package.json declares
 * `sideEffects`). Measurements: docs/plans/per-pass-install-and-lean-auto.md.
 *
 * Installation is deferred to `DOMContentLoaded` when the document is still
 * loading; otherwise it runs synchronously. The call is a no-op in
 * non-browser environments (e.g. SSR, test runners).
 *
 * All named exports from `han.ts` are re-exported unchanged, so this module
 * is a strict superset of the primary entry point.
 */

export * from './han.ts'

import {
  installFallbacks,
  refinePunctuation,
  applyISS,
  markAdjacentLines,
  runProbes,
} from './han.ts'
import { isServerSide } from './ts/helpers/env.ts'

/**
 * The individually selectable passes, in the order `installFallbacks()`
 * runs them. Token names are the CSS-facing API — `iss` and
 * `adjacent-lines` match the vocabulary the manual already uses for
 * 混排間隙 and 鄰行間距, not the function names.
 */
const PASSES: ReadonlyArray<readonly [string, (root: Element) => unknown]> = [
  ['punctuation', refinePunctuation],
  ['iss', applyISS],
  ['adjacent-lines', markAdjacentLines],
]


/**
 * Auto-install once the document is parseable. Skipped in non-browser
 * environments (the test runner imports the named exports directly).
 */
const autoInstallFallbacks = () => {
  if (isServerSide()) {
    return
  }

  /**
   * `syntax: '*'` — the universal syntax, because the value is now a token
   * LIST (`punctuation iss`) and the keyword-enum syntax could only ever
   * match one. Registration still buys the `initialValue`, which is what
   * makes `getComputedStyle` return `auto` on a page that never declares
   * the property.
   */
  CSS.registerProperty({
    name: '--han-install',
    syntax: '*',
    initialValue: 'auto',
    inherits: false,
  })

  const $root = document.documentElement
  const mode = getComputedStyle($root).getPropertyValue('--han-install').trim()

  const install = () => {
    const tokens = new Set(mode.split(/\s+/).filter(Boolean))

    // `none` wins outright, wherever it sits in the list — an opt-out that
    // could be defeated by a later token would be a footgun.
    if (tokens.has('none') || tokens.size === 0) {
      return
    }

    // `auto` is the whole suite, probes included, in installFallbacks' own
    // order — kept as its own branch so the default path stays one call.
    if (tokens.has('auto')) {
      installFallbacks()
      return
    }

    // Probes first: they stamp the capability flags the passes read.
    if (tokens.has('probes')) {
      runProbes()
    }

    // `fallbacks` is the v4 keyword for「all three passes, no probes」; it
    // stays exactly that, and simply implies every pass token.
    const all = tokens.has('fallbacks')
    for (const [token, pass] of PASSES) {
      if (all || tokens.has(token)) {
        pass($root)
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      install,
      { once: true },
    )
  } else {
    install()
  }
}

autoInstallFallbacks()
