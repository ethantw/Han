/**
 * Demo-lang chip switcher — top-right of the content column
 * (`[data-demo-lang]`, first child of `<main class="han">`).
 *
 * Distinct from the site's own UI locale (`/`, `/hans/`, `/ja/`, `/ko/` —
 * that's `<html lang>`, chosen at build time per `_locales.js`): this
 * switches which language the SPECIMEN (the seven stations' running copy)
 * demonstrates, independent of what language the reader is browsing the
 * chrome in. Clicking a chip sets `main.han[lang]`; every `:lang()` rule
 * already in han.css/diantenjeom (heritage hant-only gate, per-locale
 * punctuation) re-evaluates natively from that attribute — no extra
 * JS-side branching needed here.
 *
 * `reapplyFallbacks` is the `<han-rail>` component's method (home.js
 * passes `$rail.reapplyFallbacks` in) — when JS fallbacks are installed
 * (`installFallbacks`), some of what they patch is lang-sensitive, so a
 * demo-lang switch re-runs them the same way a config change would.
 */
export const initDemoLang = (reapplyFallbacks, $root = document) => {
  const $main = $root.querySelector('main.han')
  const $group = $root.querySelector('[data-demo-lang]')
  if (!$main || !$group) return

  $group.addEventListener('input', () => {
    const $checked = $group.querySelector('input:checked')
    if (!$checked) return
    $main.lang = $checked.value
    reapplyFallbacks?.($main)
  })
}
