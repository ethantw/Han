/**
 * Homepage entry — boots the whole-page interaction modules.
 *
 * The playground console is now the `<han-console>` web component: importing
 * `/components/han-console.js` registers it, and it self-initializes on
 * connect (adopt shadow sheets → inject its locale template → wire its
 * controls to `main` → dispatch the initial `han-config-change`).
 * So this entry no longer calls `initConfigurator` / `initMetrics` —
 * those moved into the component (`components/console-config.js` +
 * `console-metrics.js`). It wires the page-side chrome the component
 * doesn't own:
 *
 *   • `initSnippet` — station④'s code panes, now a SUBSCRIBER to the
 *     console's `han-config-change` event (the future <han-snippet>).
 *   • `initConsoleCollapse` — the `.ConsoleToggle` handle that opens/closes the
 *     side console's column (`<han-console collapsed>`, a page-LAYOUT hook).
 *   • `initLangSwitcher` / `initTheme` — top-nav chrome, unchanged.
 *   • `initBrandGlyph` — measures the wordmark's baseline so the overlay
 *     漢 SVG stops sinking while the webfont is still loading.
 *
 * `initTheme` persists the masthead dark-mode checkbox to
 * `localStorage` (the checkbox's own initial state is restored by a
 * pre-paint inline script next to it in `_home.html`, not here).
 */

import { initLangSwitcher } from '/home/lang-switcher.js'
import { initTheme } from '/home/theme.js'
import { initBrandGlyph } from '/home/brand-glyph.js'
// <han-console> is NOT statically imported — it's dynamic-imported at
// gate-open (below) so its module graph + 3 shadow sheets don't compete
// with the main content / the stroke ceremony's thread. Until it upgrades,
// its light-DOM `.ConsoleLoading` fallback shows the 字徽 loader (home.css).
import { initConsoleCollapse } from '/home/console-collapse.js'
import { initSnippet } from '/home/snippet.js'
import { initLeadForme } from '/home/lead-forme.js'
import { initDashFuse } from '/home/dash-fuse.js'
import { initPunctLang } from '/home/punct-lang.js'
import { initPapersDateline } from '/home/papers-dateline.js'
import { initWavyCiteGap } from '/home/wavy-cite-gap.js'
import { initModuleState } from '/home/module-state.js'
import { initLedger } from '/home/ledger.js'
import { initCarousel } from '/home/carousel.js'
import { highlightAll } from '/home/highlight.js'
import { initReveal } from '/home/reveal.js'
import { initBreath } from '/home/breath.js'
import { gateOpened } from '/home/fonts-gate.js'

// Only PLAYGROUND is deferred past the fonts gate (dynamic import
// below) — it pulls the marked (72KB) + DOMPurify (118KB) vendor,
// ~190KB of fetch+parse+eval that otherwise lands square in the stroke
// ceremony's ~1.3s window and janks the main-thread dashoffset draw
// (measured: 5 long-task stalls across the first pass, 158–483ms each
// under throttle). It's unusable while the copy is hidden, so booting
// it at gate-open costs nothing and hands the ceremony a quiet thread.
// Snippet stays eager: it's light (highlight.js, no vendor) and the
// console's module switches drive its panes, so it must be wired at DCL.

/* InstallChip 的複製鍵——複製隔壁 <code> 的指令文字。
 * （站④的 CodePane 複製由 snippet.js 自管；這裡只管 chip。） */
const initInstallChips = () => {
  document.querySelectorAll('.InstallChip button').forEach(($btn) => {
    $btn.addEventListener('click', async () => {
      const $cmd = $btn.parentElement.querySelector('code')
      if (!$cmd) return
      await navigator.clipboard.writeText($cmd.textContent.trim())
      // 同 snippet.js：回饋是屬性，圖標的切換交給 CSS
      $btn.dataset.state = 'copied'
      setTimeout(() => { delete $btn.dataset.state }, 1500)
    })
  })
}

document.addEventListener('DOMContentLoaded', () => {
  initLangSwitcher()
  initTheme()
  // Wordmark 漢 — measure where the baseline actually is and pin the overlay
  // SVG to it, in the fallback state AND again after the webfont swap. First
  // in the boot order because it's above the fold and its CSS fallback value
  // is only right on the post-swap side (see home/brand-glyph.js).
  initBrandGlyph()
  // <han-console> self-initializes on connect (async: adopt sheets → inject
  // template → dispatch the initial han-config-change). Boot order:
  // the snippet subscribes to the console's event (the console's async init
  // dispatch lands after this handler, and the snippet also seeds from the
  // console's `config` getter as a belt-and-suspenders against the boot race).
  // playground（gate 後才 import）借它的 reapplyFallbacks，先取好引用。
  const $console = document.querySelector('han-console')
  initSnippet()
  // station②'s isometric lead-type forme (builds its SVG + wires its face／
  // punctuation form). Settled is the CSS default; the drop plays on reveal.
  initLeadForme()
  // station②'s 破折號熔接底圖 — stamps data-play on .PunctFix once the copy
  // is revealed AND the forme's drop has landed (CSS owns the animation).
  initDashFuse()
  // station②'s per-language punctuation demo — its selects mirror the console's
  // per-language punctuation controls (single source of truth = console config).
  initPunctLang()
  initConsoleCollapse()
  // station①'s four-edition datelines — 民國 era, today + 100 years
  initPapersDateline()
  // station①'s 甲式 row: re-stamp the adjacent-line gap han.js's default pass
  // doesn't cover for <cite>. Must run AFTER han.js's own pass has set
  // `[data-adjacent-lines-refined]` — han.js is a separate early <script
  // type="module"> in _home.html, so by DCL it has already run.
  // reflect <han-console>'s module switches onto <html> — page CSS can't see
  // a <link>'s disabled state, and station①'s specimen has to follow it
  initModuleState()
  // station 伍's addition prices what the console is actually configuring:
  // unchecked parts go grey and drop out of the footing
  initLedger()
  // …and 例5.1 cycles through real library selectors, reader-driven
  initCarousel()
  initWavyCiteGap()
  initInstallChips()
  // Seed syntax-highlighting for the hand-written prose code blocks
  // (station-craft's Override etc.); the panes get theirs when station④
  // renders. Same stable selector snippet.js re-runs on every config
  // change — the highlighter's registries are global and cleared wholesale
  // per call, so both paths MUST scan the same set of live <code> or one
  // wipes the other. Feature-detect + lang-resolution live inside.
  highlightAll('main pre > code')
  // The fonts gate (pre-paint stamp → 漢-stroke ceremony → reveal) runs
  // as its own early-mounted module (_home.html); reveal.js starts
  // OBSERVING now but routes every data-revealed stamp through the
  // gate's promise — a station toured while the gate holds queues up
  // and flies in the instant it opens, instead of missing its stamp
  // forever (found on real 3G).
  initReveal(gateOpened)
  // 循環動畫的視窗閘（`[data-breath]`）：站③浮水印那口氣動的是變體字重，
  // 每幀一記全文件重排（實測主執行緒 68%），捲出畫面就暫停。不過 gate ——
  // 它管的是「別算」，愈早裝上愈好，字幕還沒開之前尤其該省。
  initBreath()

  // Boot the playground once the curtain is up — see the import note
  // above. `data-pg-ready` on <html> signals its wiring is live (the
  // dynamic import lands a few ms after gate-open); e2e awaits it
  // instead of racing the deferred load.
  gateOpened.then(async () => {
    // Register <han-console> here (not a static import) so its module graph +
    // shadow sheets load off the ceremony thread. It self-initialises on
    // connect; its light-DOM 字徽 loader covered the wait, and the toolbar
    // swaps in once its sheets land. The snippet (wired at DCL) subscribes
    // to the console's `han-config-change`, which now fires post-gate — fine,
    // the copy is hidden until the gate opens anyway.
    await import('/components/han-console.js')
    const { initPlayground } = await import('/home/playground.js')
    // 借主控台的 reapplyFallbacks：預覽每次重繪都是一棵新
    // 子樹，han.js 的 `<h-char>`／`<h-iss>` 包裹得重跑，*.with-js.css 才有東西
    // 可選。走主控台而不是直接 import installFallbacks，讀者的開關才算話。
    initPlayground(($target) => $console?.reapplyFallbacks($target))
    document.documentElement.dataset.pgReady = ''
  })
})
