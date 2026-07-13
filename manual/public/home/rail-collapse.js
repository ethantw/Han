/**
 * Rail collapse — the page-side toggle for `<han-rail>`'s `collapsed`
 * boolean attribute (public component API). NOT part of the component:
 * collapsing is a page-LAYOUT concern — the body grid animates its left
 * column to 0 and header + main slide left to fill (home.css § han-rail),
 * never an overlay — so it lives in page chrome alongside
 * `writing-switch.js`.
 *
 * The `.RailToggle` handle sits at the aside/content boundary and is the
 * only way back once collapsed. The attribute's INITIAL state is restored
 * by a pre-paint inline script next to the mount in `_home.html` (no
 * flash — same pattern as the theme checkbox); this module only wires the
 * click and persists the choice. Copy-free: the two aria-labels ride on
 * the button's `data-*` (the DOM carries the locale strings).
 *
 * form="top" / <52rem: the handle is `display: none` (home.css), so
 * there's nothing to click — the toggle is a no-op in those layouts.
 */
const KEY = 'han-rail-collapsed'

export const initRailCollapse = () => {
  const $rail = document.querySelector('han-rail')
  const $toggle = document.querySelector('[data-rail-collapse]')
  if (!$rail || !$toggle) return

  // The aria-label names the AVAILABLE action: collapse while expanded,
  // expand while collapsed. aria-expanded carries the state itself.
  const apply = (collapsed) => {
    $rail.toggleAttribute('collapsed', collapsed)
    $toggle.setAttribute('aria-expanded', String(!collapsed))
    const label = collapsed ? $toggle.dataset.labelExpand : $toggle.dataset.labelCollapse
    $toggle.setAttribute('aria-label', label ?? '')
    $toggle.title = label ?? ''
  }

  // Seed from the attribute the pre-paint script already set (the
  // attribute is the source of truth), so label/title match on first wire.
  apply($rail.hasAttribute('collapsed'))

  $toggle.addEventListener(
    'click',
    () => {
      const collapsed = !$rail.hasAttribute('collapsed')
      apply(collapsed)
      try {
        localStorage.setItem(KEY, collapsed ? '1' : '0')
      } catch (e) {
        /* ignore */
      }
    },
  )
}
