/**
 * Homepage entry — boots the whole-page interaction modules.
 *
 * HP-3: the page itself is the playground. `initConfigurator` wires the
 * rail's controls to `main.han` and station④'s output pane;
 * `initMetrics` ports the old playground's slider logic onto the same
 * `<main>`; `initRailChooser` drives the (temporary, owner-facing)
 * side/top layout picker. `initLangSwitcher` is unrelated chrome (top
 * nav) and stays.
 *
 * `initPlayground` / `initFeatureToggles` / `initMagnifier` /
 * `initSpecHint` targeted DOM that no longer exists on this page
 * (`[data-pg]`, `.Specimen`) — dropped from the boot list along with
 * their now-deleted live modules (`hero.js`, `playground.js`,
 * `playground-md.js`); `/old.html` still needs them via its own
 * frozen `/old-assets/` copies. `initLangSwitcher` moved out of
 * `hero.js` into its own `lang-switcher.js` (HP-4) since it was the
 * only export this page still used.
 *
 * `initDemoLang` (owner-feedback round) needs `initConfigurator()`'s
 * returned `{ reapplyFallbacks }` handle — boot order matters here:
 * configurator first, demo-lang second.
 *
 * `initTheme` persists the masthead dark-mode checkbox to
 * `localStorage` (style-conformance pass — the checkbox's own initial
 * state is restored by a pre-paint inline script next to it in
 * `_home.html`, not by this module).
 */

import { initLangSwitcher } from '/home/lang-switcher.js'
import { initTheme } from '/home/theme.js'
import { initConfigurator } from '/home/configurator.js'
import { initDemoLang } from '/home/demo-lang.js'
import { initMetrics } from '/home/rail-metrics.js'
import { initRailChooser } from '/home/rail-chooser.js'

/* InstallChip 的 ⎘ ——複製隔壁 [data-part="cmd"] 的指令文字。
 * （站④的 [data-out-copy] 由 configurator.js 自管；這裡只管 chip。） */
const initInstallChips = () => {
  document.querySelectorAll('.InstallChip [data-part="copy"]').forEach(($btn) => {
    $btn.addEventListener('click', async () => {
      const $cmd = $btn.parentElement.querySelector('[data-part="cmd"]')
      if (!$cmd) return
      await navigator.clipboard.writeText($cmd.textContent.trim())
      const original = $btn.textContent
      $btn.textContent = '✓'
      setTimeout(() => { $btn.textContent = original }, 1500)
    })
  })
}

document.addEventListener('DOMContentLoaded', () => {
  initLangSwitcher()
  initTheme()
  const cfg = initConfigurator()
  initDemoLang(cfg.reapplyFallbacks)
  initMetrics(document.querySelector('main.han'))
  initRailChooser()
  initInstallChips()
})
