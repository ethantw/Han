/**
 * Station④ snippet panel — the reference-code generator.
 *
 * The OUTPUT half of the old `configurator.js`, now a page-side
 * SUBSCRIBER: it listens for `<han-rail>`'s `han-config-change` event
 * (bubbles + composed, so it surfaces to `document`) and rebuilds the
 * code panes from `detail.config`. This is the content of the future
 * `<han-snippet>` component — decoupled from the rail through the public
 * event, so it can be lifted into its own element with zero rewiring.
 *
 * Rendering stays pure: codegen.js turns config into `{ lang, code }[]`,
 * `buildPane` turns each into a `<figure class="CodePane">` (textContent
 * for code — never innerHTML with interpolated code), and highlight.js
 * colours them via the Custom Highlight API.
 *
 * ts-style note: `configRef` is the one-mutable-cell — replaced
 * wholesale on each event, never patched.
 */
import { renderCDN, renderBundler } from '/home/codegen.js'
import { highlightAll } from '/home/highlight.js'

/* ── pane[] → <figure class="CodePane"> ──
 * figcaption 是語言徽章（CLI/HTML/JS/CSS），其唯一的 <button> 即複製鍵
 * （元素選擇器承載，不需 data-* hook），鏡射 InstallChip 的 ⎘ 慣例。 */
const LANG_LABEL = { bash: 'CLI', html: 'HTML', js: 'JS', css: 'CSS' }

const buildPane = ({ lang, code }) => {
  const $figure = document.createElement('figure')
  $figure.className = 'CodePane'

  const $figcaption = document.createElement('figcaption')
  $figcaption.textContent = LANG_LABEL[lang] ?? lang

  const $copy = document.createElement('button')
  Object.assign($copy, { type: 'button', textContent: '⎘' })
  $copy.setAttribute('aria-label', 'copy')

  const $pre = document.createElement('pre')
  $pre.dataset.lang = lang
  const $code = document.createElement('code')
  $code.textContent = code
  $pre.append($code)

  // copy 住在 figcaption 內（標籤靠左、⎘ 靠右——figcaption 的
  // space-between 佈局），不是 figure 的直接子元素。
  $figcaption.append($copy)
  $figure.append($figcaption, $pre)
  return $figure
}

const renderPanes = ($container, panes) => {
  $container.replaceChildren(...panes.map(buildPane))
}

const renderOutput = (config, ui) => {
  const panes = {
    bundler: () => renderBundler(config, ui.$pm?.value),
    cdn: () => renderCDN(config),
  }[ui.tab]()
  renderPanes(ui.$panes, panes)
  // Highlight API replaces ranges wholesale on every call — safe to
  // re-run unconditionally after every pane rewrite, no leak across
  // renders.
  highlightAll('[data-out-panes] pre[data-lang] > code')
}

/* ── 進場 ──
 * 訂閱 han-config-change（在 document 上聽——事件 composed 冒泡上來）；
 * ViewTabs / pm select 是本面板自有的 UI 狀態（config 不變時也可重繪）。
 * `$root` 預設 document——面板活在 station④（light DOM）。 */
export const initSnippet = ($root = document) => {
  const $panes = $root.querySelector('[data-out-panes]')
  if (!$panes) return

  const ui = {
    tab: 'bundler',
    $pm: $root.querySelector('[data-out-pm]'),
    $panes,
  }
  const configRef = { current: null }

  const rerender = () => {
    if (configRef.current) renderOutput(configRef.current, ui)
  }

  // The rail broadcasts the initial state on connect (source:'init') and
  // on every change; we're the subscriber. Listen on document since the
  // event is composed + bubbling.
  document.addEventListener(
    'han-config-change',
    (event) => {
      configRef.current = event.detail.config
      rerender()
    },
  )

  // Safety net for the boot race: if the rail already dispatched before
  // we subscribed, seed from its `config` getter.
  const $rail = $root.querySelector('han-rail')
  if ($rail?.config) {
    configRef.current = $rail.config
    rerender()
  }

  // pg-view 分頁（bundler／cdn）＋ pm select — 本面板 UI，config 不變也重繪。
  const $views = $root.querySelector('[data-pg-views]')
  $views?.addEventListener(
    'input',
    () => {
      ui.tab = $views.querySelector('input:checked').value
      rerender()
    },
  )
  ui.$pm?.addEventListener('input', rerender)

  // 每個 pane 各自的複製鍵——委派在容器上（panes 每次重繪整批換新，個別
  // 綁定會漏新節點）。行為鏡射 home.js 的 InstallChip ⎘ handler。
  $panes.addEventListener(
    'click',
    async (event) => {
      const $btn = event.target.closest('figure.CodePane button')
      if (!$btn) return
      const $code = $btn.closest('figure')?.querySelector('pre code')
      if (!$code) return
      await navigator.clipboard.writeText($code.textContent)
      const original = $btn.textContent
      $btn.textContent = '✓'
      setTimeout(() => { $btn.textContent = original }, 1500)
    },
  )
}
