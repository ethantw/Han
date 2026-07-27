/**
 * Console collapse — persistence for the `.ConsoleToggle` checkbox.
 *
 * The handle is a real `<input type="checkbox">` (owner call — same
 * recipe as the dark-mode toggle): the LAYOUT is pure CSS via
 * `body:has(.ConsoleToggle input:checked)` (home.css § han-console; the body
 * grid animates its left column to 0 and header + main slide left to
 * fill — never an overlay). checked = collapsed.
 *
 * The checkbox's INITIAL state is restored by a pre-paint inline script
 * right next to it in `_home.html` (no flash — same pattern as the theme
 * checkbox); this module only persists future flips.
 *
 * form="top" / <52rem: the handle is `display: none` (home.css), so the
 * checkbox is unreachable — a no-op in those layouts.
 */
const KEY = 'han-console-collapsed'

export const initConsoleCollapse = () => {
  const $box = document.querySelector('.ConsoleToggle input[type="checkbox"]')
  if (!$box) return

  $box.addEventListener(
    'change',
    () => {
      try {
        localStorage.setItem(KEY, $box.checked ? '1' : '0')
      } catch (e) {
        /* ignore */
      }
    },
  )
}
