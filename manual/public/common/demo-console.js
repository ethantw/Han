const NARROW_CONSOLE = '(max-width: 51.9375rem)'

export const initDemoConsole = (panel) => {
  if (!(panel instanceof HTMLDialogElement)) return () => {}

  const narrow = matchMedia(NARROW_CONSOLE)
  const openers = [...document.querySelectorAll(`[aria-controls="${panel.id}"]`)]
  const closers = [...panel.querySelectorAll('[data-demo-console-close]')]

  const isOpen = () => !narrow.matches || panel.hasAttribute('data-open')
  const sync = () => {
    const open = isOpen()
    panel.inert = !open
    if (open) panel.removeAttribute('aria-hidden')
    else panel.setAttribute('aria-hidden', 'true')
    for (const opener of openers) opener.setAttribute('aria-expanded', String(open))
  }

  const setOpen = (open, { restoreFocus = false } = {}) => {
    panel.toggleAttribute('data-open', open)
    sync()
    if (open) panel.querySelector('[data-demo-console-close]')?.focus()
    else if (restoreFocus) openers[0]?.focus()
  }

  for (const opener of openers) opener.addEventListener('click', () => setOpen(true))
  for (const closer of closers) closer.addEventListener('click', () => setOpen(false, { restoreFocus: true }))

  const onKeydown = (event) => {
    if (event.key !== 'Escape' || !narrow.matches || !panel.hasAttribute('data-open')) return
    event.preventDefault()
    setOpen(false, { restoreFocus: true })
  }
  addEventListener('keydown', onKeydown)

  const onBreakpoint = () => {
    panel.removeAttribute('data-open')
    sync()
  }
  narrow.addEventListener('change', onBreakpoint)
  sync()

  return () => {
    removeEventListener('keydown', onKeydown)
    narrow.removeEventListener('change', onBreakpoint)
  }
}

for (const panel of document.querySelectorAll('[data-demo-console]')) initDemoConsole(panel)
