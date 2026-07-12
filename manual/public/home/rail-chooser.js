/**
 * Rail-form chooser — 選型用，owner 定案後移除。
 *
 * Floating bottom-right pill (`[data-rail-chooser]`, markup in
 * `_home.html`) flips `body.dataset.rail` between 'side' and 'top' so
 * the owner can compare both layouts in a real browser; the choice
 * persists in localStorage so it survives reloads. Below 52rem both
 * forms collapse into the same bottom sheet (pure CSS in rail.css),
 * so the chooser only matters on wider viewports.
 */
const KEY = 'han-rail-form'

export function initRailChooser() {
  const saved = localStorage.getItem(KEY)
  const form = saved === 'top' ? 'top' : 'side'
  document.body.dataset.rail = form

  const chooser = document.querySelector('[data-rail-chooser]')
  if (!chooser) return

  const markActive = () => {
    chooser.querySelectorAll('[data-rail-form]').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.railForm === document.body.dataset.rail)
    })
  }
  markActive()

  chooser.addEventListener('click', e => {
    const btn = e.target.closest('[data-rail-form]')
    if (!btn) return
    document.body.dataset.rail = btn.dataset.railForm
    localStorage.setItem(KEY, btn.dataset.railForm)
    markActive()
  })
}
