/**
 * Language switcher — the top-nav `.LangSwitcher` trigger/menu pair.
 *
 * Split out of the old `home/hero.js` in HP-4 (dead-asset cleanup):
 * this is the only export from that file the new homepage still uses
 * (`initFeatureToggles` / `initMagnifier` / `initSpecHint` targeted
 * `.Specimen` markup that no longer exists on this page). `/old.html`
 * keeps its own frozen copy under `/old-assets/home/hero.js`.
 */

export function initLangSwitcher() {
  const root = document.querySelector('[data-lang-switcher]')
  if (!root) return
  const trigger = root.querySelector('button')
  const menu    = root.querySelector('ul')
  if (!trigger || !menu) return

  const close = () => {
    menu.hidden = true
    trigger.setAttribute('aria-expanded', 'false')
  }
  const open = () => {
    menu.hidden = false
    trigger.setAttribute('aria-expanded', 'true')
  }

  trigger.addEventListener('click', e => {
    e.stopPropagation()
    if (menu.hidden) open(); else close()
  })

  document.addEventListener('click', e => {
    if (!menu.hidden && !root.contains(e.target)) close()
  })

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) {
      close()
      trigger.focus()
    }
  })
}
