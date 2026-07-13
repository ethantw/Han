/**
 * Homepage entry — boots the whole-page interaction modules.
 *
 * The playground rail is now the `<han-rail>` web component: importing
 * `/components/han-rail.js` registers it, and it self-initializes on
 * connect (adopt shadow sheets → inject its locale template → wire its
 * controls to `main.han` → dispatch the initial `han-config-change`).
 * So this entry no longer calls `initConfigurator` / `initMetrics` —
 * those moved into the component (`components/rail-config.js` +
 * `rail-metrics.js`). It wires the page-side chrome the component
 * doesn't own:
 *
 *   • `initSnippet` — station④'s code panes, now a SUBSCRIBER to the
 *     rail's `han-config-change` event (the future <han-snippet>).
 *   • `initDemoLang` — borrows the component's `reapplyFallbacks` method.
 *   • `initRailChooser` — writes the rail's `form` attribute (side/top).
 *   • `initLangSwitcher` / `initTheme` — top-nav chrome, unchanged.
 *
 * `initTheme` persists the masthead dark-mode checkbox to
 * `localStorage` (the checkbox's own initial state is restored by a
 * pre-paint inline script next to it in `_home.html`, not here).
 */

import { initLangSwitcher } from '/home/lang-switcher.js'
import { initTheme } from '/home/theme.js'
import '/components/han-rail.js'
import { initDemoLang } from '/home/demo-lang.js'
import { initSnippet } from '/home/snippet.js'
import { initRailChooser } from '/home/rail-chooser.js'

/* InstallChip 的 ⎘ ——複製隔壁 <code> 的指令文字。
 * （站④的 CodePane 複製由 snippet.js 自管；這裡只管 chip。） */
const initInstallChips = () => {
  document.querySelectorAll('.InstallChip button').forEach(($btn) => {
    $btn.addEventListener('click', async () => {
      const $cmd = $btn.parentElement.querySelector('code')
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
  // <han-rail> self-initializes on connect (async: adopt sheets → inject
  // template → dispatch the initial han-config-change). Boot order:
  // demo-lang borrows its `reapplyFallbacks`; the snippet subscribes to
  // its event (the rail's async init dispatch lands after this handler,
  // and the snippet also seeds from the rail's `config` getter as a
  // belt-and-suspenders against the boot race).
  const $rail = document.querySelector('han-rail')
  initDemoLang(($target) => $rail?.reapplyFallbacks($target))
  initSnippet()
  initRailChooser()
  initInstallChips()
})
