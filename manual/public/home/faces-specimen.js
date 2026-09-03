/**
 * Keep the three-face specimen's two radio groups in explicit DOM state.
 *
 * The first version let a relational `:has(input:checked)` selector climb
 * from each radio to the whole figure. That works in Chromium and WebKit's
 * test shell, but real Safari can postpone invalidating the distant specimen
 * rows: the pill changes while 乙／丙 stays hidden. A small data attribute is
 * both cheaper to invalidate and unambiguous to inspect. The matching
 * attributes already live in the HTML with the checked defaults, so the
 * initial 尚古／甲 specimen is never JS-dependent.
 */

import { zianoUrl } from './codegen.js'

const GENKI_FAMILIES = ['genki-sans-yue', 'genki-serif-yue']

const loadGenkiFallback = () => {
  if (document.documentElement.hasAttribute('data-han-subset')) return
  const disabled = document.querySelector('link[data-han-webfont]')?.disabled ?? false
  for (const family of GENKI_FAMILIES) {
    if (document.querySelector(`link[data-faces-font="${family}"]`)) continue
    const $link = document.createElement('link')
    $link.rel = 'stylesheet'
    $link.href = zianoUrl(family)
    $link.dataset.hanWebfont = ''
    $link.dataset.facesFont = family
    $link.disabled = disabled
    document.head.append($link)
  }
}

export const initFacesSpecimen = () => {
  const $figure = document.querySelector('.Illust[data-variant="faces"]')
  const $form = $figure?.querySelector('.FacesSwitch')
  if (!$figure || !$form) return

  const $size = $form.elements.namedItem('faces-size')
  const $weight = $form.elements.namedItem('faces-weight')
  const $sizeOutput = $form.querySelector('output[for="faces-size"]')
  const $weightOutput = $form.querySelector('output[for="faces-weight"]')

  const reflectSelection = () => {
    const family = $form.elements.namedItem('faces-family')?.value
    const copy = $form.elements.namedItem('faces-copy')?.value
    if (family) $figure.dataset.facesFamilySelected = family
    if (copy) $figure.dataset.facesCopySelected = copy
    if (family === 'genki') loadGenkiFallback()
  }

  const reflectMetrics = () => {
    const size = $size?.value
    const weight = $weight?.value
    if (size) {
      $figure.style.setProperty('--faces-font-size', `${size}px`)
      if ($sizeOutput) $sizeOutput.value = `${size}px`
    }
    if (weight) {
      $figure.style.setProperty('--faces-font-weight', weight)
      if ($weightOutput) $weightOutput.value = weight
    }
  }

  $form.addEventListener('change', reflectSelection)
  $form.addEventListener('input', reflectMetrics)
  reflectSelection()
  reflectMetrics()
}
