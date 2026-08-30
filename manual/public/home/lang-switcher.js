/**
 * Language switcher — the top-nav `.LangSwitcher` trigger/menu pair.
 *
 * Split out of the old `home/hero.js` in HP-4 (dead-asset cleanup):
 * this is the only export from that file the new homepage still uses
 * (`initFeatureToggles` / `initMagnifier` / `initSpecHint` targeted
 * `.Specimen` markup that no longer exists on this page).
 */
export const initLangSwitcher = () => {
  const $root = document.querySelector('.LangSwitcher')
  if (!$root) return
  const $trigger = $root.querySelector('button')
  const $menu    = $root.querySelector('ul')
  if (!$trigger || !$menu) return

  const close = () => {
    $menu.hidden = true
    $trigger.setAttribute('aria-expanded', 'false')
  }
  const open = () => {
    $menu.hidden = false
    $trigger.setAttribute('aria-expanded', 'true')
  }

  $trigger.addEventListener('click', (e) => {
    e.stopPropagation()
    $menu.hidden ? open() : close()
  })

  document.addEventListener('click', (e) => {
    if (!$menu.hidden && !$root.contains(e.target)) close()
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$menu.hidden) {
      close()
      $trigger.focus()
    }
  })
}
