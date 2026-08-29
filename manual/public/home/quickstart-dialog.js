/** Hero quickstart: the link remains a real manual URL when JS is absent. */
export const initQuickstartDialog = ($root = document) => {
  const $dialog = $root.querySelector('[data-quickstart-dialog]')
  const $open = $root.querySelector('[data-quickstart-open]')
  if (!$dialog?.showModal || !$open) return

  $open.addEventListener('click', (event) => {
    event.preventDefault()
    if (!$dialog.open) $dialog.showModal()
  })
  $dialog.addEventListener('click', (event) => {
    if (event.target === $dialog) $dialog.close()
  })
}
