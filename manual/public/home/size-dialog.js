/** Native file-size dialog for station 陸. */
export const initSizeDialog = ($root = document) => {
  const $dialog = $root.querySelector('.SizeDialog')
  const $open = $root.querySelector('.OpenSizeDialog')
  if (!$dialog || !$open) return

  $open.addEventListener('click', () => {
    $dialog.showModal()
    /* showModal() focuses the first control. While the panel still has its
       fly-in translate, Chromium scrolls the full-viewport dialog to reveal
       that off-screen control and consumes the intended opening whitespace. */
    $dialog.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    requestAnimationFrame(() =>
      $dialog.scrollTo({ top: 0, left: 0, behavior: 'instant' }))
  })
  $dialog.addEventListener('click', (event) => {
    if (event.target === $dialog) $dialog.close()
  })
}
