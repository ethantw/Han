export interface Probes {
  autospaceBoundaryBug?: boolean
  styleQuerySupport?: boolean
}

const probesCache: Probes = {}

/**
 * Detect Safari's `text-autospace` inline-boundary bug.
 *
 * On engines that propagate autospace through inline element boundaries
 * (Chromium, Gecko), the gap between Han and Western glyphs is inserted
 * regardless of any inline wrapping. Safari (as of 26.x / WebKit 18.x)
 * silently skips the gap when one or more inline elements sit at the
 * seam — including `display:none` / `hidden` placeholders, which is
 * exactly the markup `replaceISS` and `insertISS` produce.
 *
 * The probe lays out two short strings under `text-autospace: normal`:
 *
 *   bare:    A中
 *   wrapped: A<i></i>中
 *
 * On a working engine the two render at the same width (the gap is
 * present in both — `<i></i>` has no metrics of its own). On Safari
 * the wrapped run is narrower by ≈ ¼ em.
 *
 * Returns `false` when the engine doesn't support `text-autospace`
 * at all (the bug doesn't apply — there's no autospace either way),
 * when there's no `document` (SSR / Node), and when the measurement
 * gives sub-pixel noise we can't trust.
 *
 * Tracked: https://bugs.webkit.org/show_bug.cgi?id=299306#c6
 * (our comment on the broader element-boundary ticket).
 */
export function detectAutospaceBoundaryBug(force = false, doc = typeof document !== 'undefined' ? document : null): boolean {
  if (!doc) return false
  if (probesCache.autospaceBoundaryBug !== undefined && !force) {
    const broken = probesCache.autospaceBoundaryBug
    /* node:coverage disable */
    // Cache-hit + broken: unreachable from unit tests — happy-dom can't lay
    // out, so the bare/wrapped width delta is always 0 and `broken` never
    // becomes true to begin with. Covered by e2e on real Safari.
    if (broken) {
      doc.documentElement.style.setProperty('--han-probe-autospace', 'broken')
      doc.documentElement.dataset.probeAutospace = 'broken'
    }
    /* node:coverage enable */
    return broken
  }

  if (typeof CSS === 'undefined' || !CSS.supports?.('text-autospace', 'normal')) {
    return probesCache.autospaceBoundaryBug = false
  }

  // Three Han ↔ Western boundaries give the bug a chance to compound:
  // Safari is sensitive to *every* seam having an inline wrapper (see
  // jsfiddle/jn582tus, line 4 of the user's reproduction). One probe
  // boundary isn't reliable — Safari spaces the seam with one empty
  // span but stops once every seam has one, the very pattern Han.css
  // produces in `replace`/`strict` mode.
  const probe = doc.createElement('div')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText =
    'position:absolute;top:-9999px;left:-9999px;visibility:hidden;' +
    'font:16px serif;white-space:nowrap;text-autospace:normal'
  probe.innerHTML =
    '<span data-bare>A中A中A中</span>' +
    '<span data-wrapped>A<span></span>中<span></span>A<span></span>中<span></span>A<span></span>中</span>'
  doc.body.appendChild(probe)
  const bare = (probe.querySelector('[data-bare]') as HTMLElement).getBoundingClientRect().width
  const wrapped = (probe.querySelector('[data-wrapped]') as HTMLElement).getBoundingClientRect().width
  probe.remove()

  // Three boundaries × ¼-em (≈ 4px at 16px) = 12px expected loss when
  // every seam drops the gap. Threshold > 6px catches that without
  // tripping on the sub-pixel residue some engines leave even when
  // they did insert the gaps (e.g. Chromium 124's 2px-per-seam noise
  // around italic-switch hints).
  const broken = (bare - wrapped) > 6

  /* node:coverage disable */
  // Fresh-measurement broken branch: same reason as the cache-hit branch
  // above — happy-dom yields a zero delta. Real-engine behaviour is
  // exercised by the Safari e2e suite.
  if (broken) {
    doc.documentElement.style.setProperty('--han-probe-autospace', 'broken')
    doc.documentElement.dataset.probeAutospace = 'broken'
  }
  /* node:coverage enable */

  return probesCache.autospaceBoundaryBug = broken
}

/**
 * Detect support for CSS Style Queries (`@container style(--var: value)`).
 *
 * `CSS.supports()` and CSSOM inspection are unreliable: older Firefox (110+)
 * parsed the rule into the CSSOM without applying it (Firefox shipped real
 * support in 2026-06). The only trustworthy check across versions is creating
 * a live DOM probe and reading `getComputedStyle`.
 */
export const detectStyleQuerySupport = (force = false, doc = typeof document !== 'undefined' ? document : null): boolean => {
  if (!doc) return false
  if (probesCache.styleQuerySupport !== undefined && !force) {
    const isSupported = probesCache.styleQuerySupport
    if (!isSupported) {
      doc.documentElement.style.setProperty('--han-probe-style-query', 'unsupported')
      doc.documentElement.dataset.probeStyleQuery = 'unsupported'
    }
    return isSupported
  }

  const style = doc.createElement('style')
  style.textContent = `
    #han-sq-parent { --han-probe: 1; }
    @container style(--han-probe: 1) {
      #han-sq-child { z-index: 99; }
    }
  `
  doc.head.appendChild(style)

  const parent = doc.createElement('div')
  parent.id = 'han-sq-parent'
  // Hidden so it doesn't affect layout
  parent.style.display = 'none'

  const child = doc.createElement('div')
  child.id = 'han-sq-child'
  parent.appendChild(child)

  doc.body.appendChild(parent)

  const isSupported = doc.defaultView!.getComputedStyle(child).zIndex === '99'

  parent.remove()
  style.remove()

  if (!isSupported) {
    doc.documentElement.style.setProperty('--han-probe-style-query', 'unsupported')
    doc.documentElement.dataset.probeStyleQuery = 'unsupported'
  }

  return probesCache.styleQuerySupport = isSupported
}
