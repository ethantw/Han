/**
 * Rail-form chooser — 選型用，owner 定案後移除。
 *
 * Floating bottom-right pill (`[data-rail-chooser]`, markup in
 * `_home.html`) writes the `<han-rail>`'s public `form` attribute
 * ('side' | 'top') so the owner can compare both layouts in a real
 * browser; the choice persists in localStorage. The page grid reacts via
 * `body:has(han-rail[form="…"])` (home.css) and the shadow skeleton via
 * `:host([form="top"])` — both pure CSS. Below 52rem both forms collapse
 * into the same bottom sheet, so the chooser only matters wider.
 */
const KEY = 'han-rail-form'

export const initRailChooser = () => {
  const $rail = document.querySelector('han-rail')
  if (!$rail) return

  const saved = localStorage.getItem(KEY)
  $rail.setAttribute('form', saved === 'top' ? 'top' : 'side')

  const $chooser = document.querySelector('[data-rail-chooser]')
  if (!$chooser) return

  const markActive = () => {
    $chooser.querySelectorAll('[data-rail-form]').forEach(($btn) => {
      $btn.classList.toggle('is-active', $btn.dataset.railForm === $rail.getAttribute('form'))
    })
  }
  markActive()

  $chooser.addEventListener('click', (e) => {
    const $btn = e.target.closest('[data-rail-form]')
    if (!$btn) return
    $rail.setAttribute('form', $btn.dataset.railForm)
    localStorage.setItem(KEY, $btn.dataset.railForm)
    markActive()
  })
}
