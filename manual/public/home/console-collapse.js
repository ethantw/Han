/**
 * Console visibility — persistence for the `.ConsoleToggle` checkbox.
 *
 * The handle is a real `<input type="checkbox">` (owner call — same recipe as
 * the dark-mode toggle): the LAYOUT is pure CSS via
 * `body:has(.ConsoleToggle input:checked)` (home/console.css). What the bit
 * MEANS depends on the form the console is in — collapsed in the side column,
 * on stage in the floating panel — so each form remembers it under its own
 * key, with its own default: the column comes up open, the panel does not.
 *
 * The checkbox's INITIAL state is restored by a pre-paint inline script right
 * next to it in `_home.html` (no flash — same pattern as the theme checkbox);
 * this module persists future flips, re-seeds the bit when the window crosses
 * the boundary between the two forms, and closes the panel on Escape (a
 * non-modal dialog doesn't do that for itself).
 */
const SIDE_FORM = '(min-width: 52rem)'
const KEY = { side: 'han-console-collapsed', panel: 'han-console-panel-open' }

const read = (key) => {
  try {
    return localStorage.getItem(key) === '1'
  } catch (e) {
    return false
  }
}

const write = (key, on) => {
  try {
    localStorage.setItem(key, on ? '1' : '0')
  } catch (e) {
    /* ignore */
  }
}

export const initConsoleCollapse = () => {
  const $box = document.querySelector('.ConsoleToggle input[type="checkbox"]')
  if (!$box) return

  const side = matchMedia(SIDE_FORM)
  const keyNow = () => (side.matches ? KEY.side : KEY.panel)

  $box.addEventListener('change', () => write(keyNow(), $box.checked))

  // Crossing the boundary is a change of meaning, not of state: re-seed the
  // bit from the form we just entered, so a phone that was rotated into the
  // side column doesn't read「面板開著」as「欄收起來」.
  side.addEventListener('change', () => {
    $box.checked = read(keyNow())
  })

  // Escape closes the floating panel — `show()`-style dialogs don't, and in
  // the side form there is nothing overlaying anything to dismiss.
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || side.matches || !$box.checked) return
    $box.checked = false
    write(KEY.panel, false)
  })
}
