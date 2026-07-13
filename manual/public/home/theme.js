/**
 * Theme persistence — the masthead `.ThemeToggle` checkbox
 * (`input[name="dark-mode"]`, `_home.html`) drives `:root:has(...)`
 * in CSS; this module's only job is to remember the choice.
 *
 * The checkbox's *initial* `checked` state is restored by a pre-paint
 * inline `<script>` sitting immediately after it in the markup — it
 * must tick before first paint, which a deferred module can't do.
 * `initTheme` only persists future toggles, mirroring ziano's
 * `theme.ts` (`mountTheme`). Same `localStorage` key ('theme') as the
 * docs site's own `data-theme-toggle` button, so the preference
 * carries over between the homepage and `/docs/`.
 */
const KEY = 'theme'

export const initTheme = (root = document) => {
  const $box = root.querySelector('input[name="dark-mode"]')
  if (!$box) return

  $box.addEventListener('change', () => {
    try {
      localStorage.setItem(KEY, $box.checked ? 'dark' : 'light')
    } catch (e) {
      /* ignore */
    }
  })
}
