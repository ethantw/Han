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
 *   • `initWritingSwitch` — 橫排/直排 floating pill (preview state,
 *     outside the rail — not a han.css variable).
 *   • `initRailCollapse` — the `.RailToggle` handle that opens/closes the
 *     side rail's column (`<han-rail collapsed>`, a page-LAYOUT hook).
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
import { initWritingSwitch } from '/home/writing-switch.js'
import { initRailCollapse } from '/home/rail-collapse.js'
import { initSnippet } from '/home/snippet.js'
import { initReveal } from '/home/reveal.js'
import { gateOpened } from '/home/fonts-gate.js'

// Only PLAYGROUND is deferred past the fonts gate (dynamic import
// below) — it pulls the marked (72KB) + DOMPurify (118KB) vendor,
// ~190KB of fetch+parse+eval that otherwise lands square in the stroke
// ceremony's ~1.3s window and janks the main-thread dashoffset draw
// (measured: 5 long-task stalls across the first pass, 158–483ms each
// under throttle). It's unusable while the copy is hidden, so booting
// it at gate-open costs nothing and hands the ceremony a quiet thread.
// Snippet stays eager: it's light (highlight.js, no vendor) and the
// rail's module switches drive its panes, so it must be wired at DCL.

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
  initWritingSwitch()
  initRailCollapse()
  initInstallChips()
  // The fonts gate (pre-paint stamp → 漢-stroke ceremony → reveal) runs
  // as its own early-mounted module (_home.html); reveal.js starts
  // OBSERVING now but routes every data-revealed stamp through the
  // gate's promise — a station toured while the gate holds queues up
  // and flies in the instant it opens, instead of missing its stamp
  // forever (found on real 3G).
  initReveal(gateOpened)

  // Boot the playground once the curtain is up — see the import note
  // above. `data-pg-ready` on <html> signals its wiring is live (the
  // dynamic import lands a few ms after gate-open); e2e awaits it
  // instead of racing the deferred load.
  gateOpened.then(async () => {
    const { initPlayground } = await import('/home/playground.js')
    initPlayground()
    document.documentElement.dataset.pgReady = ''
  })
})
