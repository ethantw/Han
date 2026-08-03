/**
 * Auto-install entry point — a drop-in alternative to `han.js` that triggers
 * fallback installation as a module-load side effect, preserving the v3
 * behaviour for projects that previously relied on implicit auto-setup.
 *
 * On module load, `installFallbacks()` fires against `<html>`. There is no
 * switch: this entry IS the switch. A `--han-install` custom property briefly
 * let a page narrow the passes from CSS; it was removed because every pass
 * shares the same hyperly floor, so narrowing bought a smaller DOM diff but
 * never a smaller file — a confusing thing to offer on a framework that sells
 * its size. The way to actually pay less is the other entry: import the named
 * passes from `han.js` and let your bundler shake the rest (`package.json`
 * declares `sideEffects`). The homepage's console prices every combination.
 *
 * Installation is deferred to `DOMContentLoaded` when the document is still
 * loading; otherwise it runs synchronously. The call is a no-op in
 * non-browser environments (e.g. SSR, test runners).
 *
 * All named exports from `han.ts` are re-exported unchanged, so this module
 * is a strict superset of the primary entry point.
 */

export * from './han.ts'

import { installFallbacks } from './han.ts'
import { isServerSide } from './ts/helpers/env.ts'

const autoInstallFallbacks = () => {
  if (isServerSide()) {
    return
  }

  const install = () => installFallbacks(document.documentElement)

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
