/**
 * Auto-install entry point — a drop-in alternative to `han.js` that triggers
 * fallback installation as a module-load side effect, preserving the v3
 * behaviour for projects that previously relied on implicit auto-setup.
 *
 * On module load, `autoInstallFallbacks()` fires and respects the
 * `--han-install` CSS custom property on `:root`:
 *
 * - `auto` (default) — runs the full `installFallbacks()` suite
 * - `fallbacks`       — runs punctuation, ISS, and adjacent-line passes only
 * - `probes`          — runs environment-probe passes only
 * - `none`            — skips installation entirely
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
 * Auto-install once the document is parseable. Skipped in non-browser
 * environments (the test runner imports the named exports directly).
 */
const autoInstallFallbacks = () => {
  if (isServerSide()) {
    return
  }

  CSS.registerProperty({
    name: '--han-install',
    syntax: 'auto | fallbacks | probes | none',
    initialValue: 'auto',
    inherits: false,
  })

  const $root = document.documentElement
  const mode = getComputedStyle($root).getPropertyValue('--han-install').trim()

  const install = () => {
    switch (mode) {
      case 'none':
        return
      case 'auto':
        installFallbacks()
        break
      case 'fallbacks':
        refinePunctuation($root)
        applyISS($root)
        markAdjacentLines($root)
        break
      case 'probes':
        runProbes()
        break
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
