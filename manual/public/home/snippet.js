/**
 * Station④ snippet panel — the reference-code generator.
 *
 * The OUTPUT half of the old `configurator.js`, now a page-side
 * SUBSCRIBER: it listens for `<han-console>`'s `han-config-change` event
 * (bubbles + composed, so it surfaces to `document`) and rebuilds the
 * code panes from `detail.config`. This is the content of the future
 * `<han-snippet>` component — decoupled from the console through the public
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
import {
  renderCDN, renderBundler, renderInline,
  localHanCssUrls, HAN_AUTO_LOCAL_URL, HAN_JS_LOCAL_URL, selectedPasses,
} from '/home/codegen.js'
import { highlightAll } from '/home/highlight.js'
import { icon } from '/common/icon.js'

/* ── pane[] → <figure class="CodePane"> ──
 * figcaption 是語言徽章（CLI/HTML/JS/CSS）＋ 唯一的 <button> 複製鍵
 * （元素選擇器承載，不需 data-* hook），鏡射 InstallChip 的複製鍵慣例。CLI
 * pane 額外把 pm select 塞進標籤旁邊——package manager 只對這一格有意義，
 * 放在 ViewTabs 那排反而讓人以為跟 CDN／內嵌分頁也有關係。 */
const LANG_LABEL = { bash: 'CLI', html: 'HTML', js: 'JS', css: 'CSS' }

const buildPane = ({ lang, code }, $pm) => {
  const $figure = document.createElement('figure')
  $figure.className = 'CodePane'

  const $figcaption = document.createElement('figcaption')

  const $label = document.createElement('span')
  $label.dataset.part = 'label'
  $label.append(LANG_LABEL[lang] ?? lang)
  if (lang === 'bash' && $pm) $label.append($pm)

  const $copy = document.createElement('button')
  $copy.type = 'button'
  $copy.append(icon('copy'))
  $copy.setAttribute('aria-label', 'copy')

  const $pre = document.createElement('pre')
  $pre.dataset.lang = lang
  const $code = document.createElement('code')
  $code.textContent = code
  $pre.append($code)

  // label(+pm select) 住 figcaption 左邊、複製鍵住右邊（figcaption 的
  // space-between 佈局），兩個都不是 figure 的直接子元素。
  $figcaption.append($label, $copy)
  $figure.append($figcaption, $pre)
  return $figure
}

const renderPanes = ($container, panes, $pm) => {
  $container.replaceChildren(...panes.map((p) => buildPane(p, $pm)))
}

/* ── 「內嵌」分頁的資產抓取 ──
 * framework 的 minified bytes 是靜態檔案（跟 console 模組開關讀的是同一批，見
 * vite.config.js syncFramework()），內容不隨 config 變動——只有「抓哪幾個」
 * 隨模組開關變動。用 URL 當 key 快取，同一顆檔案在多次重繪之間只抓一次。 */
const textCache = new Map()
const fetchText = (url) => {
  if (!textCache.has(url)) textCache.set(url, fetch(url).then((r) => r.text()))
  return textCache.get(url)
}

const fetchInlineAssets = async (config) => {
  const [cssTexts, autoJs, hanJs] = await Promise.all([
    Promise.all(localHanCssUrls(config).map(fetchText)),
    config.fallbacks && config.jsMode !== 'manual' ? fetchText(HAN_AUTO_LOCAL_URL) : undefined,
    // 具名匯入的路徑（jsMode='manual'）與 legacyRuby 都要 han.min.js 的原始
    // bytes——renderInline 從它動態 import，按匯出名取用選中的那幾支。
    config.legacyRuby || selectedPasses(config).length ? fetchText(HAN_JS_LOCAL_URL) : undefined,
  ])
  return { css: cssTexts.join('\n'), autoJs, hanJs }
}

// `renderToken` guards against a slower in-flight fetch (from an earlier
// slider tweak) clobbering a newer one's result — only the render whose
// token still matches after the `await` gets to touch the DOM.
let renderToken = 0

const renderOutput = async (config, ui) => {
  const token = ++renderToken
  if (ui.tab === 'inline') {
    // Loading placeholder first — the fetch can take a moment on the very
    // first inline render (subsequent ones hit the cache and resolve fast
    // enough this rarely shows).
    renderPanes(ui.$panes, [{ lang: 'html', code: '<!-- 載入 framework bytes… -->' }], ui.$pm)
    const assets = await fetchInlineAssets(config)
    if (token !== renderToken) return // a newer render started meanwhile
    renderPanes(ui.$panes, renderInline(config, assets), ui.$pm)
  } else {
    const panes = ui.tab === 'bundler' ? renderBundler(config, ui.$pm?.value) : renderCDN(config)
    renderPanes(ui.$panes, panes, ui.$pm)
  }
  // Highlight API replaces ranges wholesale on every call — the global
  // registries are cleared then re-added from scratch, so we re-scan EVERY
  // live <code> under main (panes ＋ the hand-written prose blocks like
  // station-craft's Override), not just the panes. Sharing one stable
  // selector with home.js's seed call is what stops each rewrite from
  // wiping the other's ranges. Safe to re-run unconditionally per rewrite.
  highlightAll('main pre > code')
}

/* pm select — 建一次、重繪時搬進當下那顆 CLI pane 的 figcaption（見
 * buildPane）。node 本身在多次重繪之間是同一個引用，reparent 不會丟監聽器
 * 也不會丟目前選的值；tab 不是 bundler 時沒有 bash pane，它就單純沒被接
 * 回 DOM（仍在記憶體裡，下次切回 bundler 再被 append 回去）。 */
const createPmSelect = () => {
  const $pm = document.createElement('select')
  $pm.dataset.outPm = ''
  // 無可見 <label>（選單自身就是「pnpm/npm/yarn」語意），給 AT 一個
  // 名字——axe select-name（critical）在此抓過違規。
  $pm.setAttribute('aria-label', 'package manager')
  for (const v of ['pnpm', 'npm', 'yarn']) {
    const $opt = document.createElement('option')
    Object.assign($opt, { value: v, textContent: v, selected: v === 'pnpm' })
    $pm.append($opt)
  }
  return $pm
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
    $pm: createPmSelect(),
    $panes,
  }
  const configRef = { current: null }

  const rerender = () => {
    if (configRef.current) renderOutput(configRef.current, ui)
  }

  // The console broadcasts the initial state on connect (source:'init') and
  // on every change; we're the subscriber. Listen on document since the
  // event is composed + bubbling.
  document.addEventListener(
    'han-config-change',
    (event) => {
      configRef.current = event.detail.config
      rerender()
    },
  )

  // Safety net for the boot race: if the console already dispatched before
  // we subscribed, seed from its `config` getter.
  const $console = $root.querySelector('han-console')
  if ($console?.config) {
    configRef.current = $console.config
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
  // 綁定會漏新節點）。行為鏡射 home.js 的 InstallChip 複製 handler。
  $panes.addEventListener(
    'click',
    async (event) => {
      const $btn = event.target.closest('figure.CodePane button')
      if (!$btn) return
      const $code = $btn.closest('figure')?.querySelector('pre code')
      if (!$code) return
      await navigator.clipboard.writeText($code.textContent)
      // 成功回饋蓋在屬性上，不動 DOM——換的是哪張 mask 由 CSS 決定
      // （icons.css § 複製鍵的狀態），JS 這邊只說「現在是 copied」。
      $btn.dataset.state = 'copied'
      setTimeout(() => { delete $btn.dataset.state }, 1500)
    },
  )
}
