/** Native file-size dialog for station 伍. */
export const initSizeDialog = ($root = document) => {
  const $dialog = $root.querySelector('[data-size-dialog]')
  const $open = $root.querySelector('[data-size-dialog-open]')
  if (!$dialog || !$open) return

  $open.addEventListener('click', () => $dialog.showModal())
  $dialog.addEventListener('click', (event) => {
    if (event.target === $dialog) $dialog.close()
  })
}
