/** Hero quickstart: without JS, the link still reaches the canonical setup skill. */
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
