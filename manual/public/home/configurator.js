/**
 * 配置器 intents + apply。
 * config（單一事實源）→ ① 全頁 <main class="han"> 變數 ② 按需字體 <link>
 * ③ 站④輸出面板重繪。生成邏輯全在 codegen.js（純函數）；本檔只碰 DOM。
 *
 * HP-3 scope change: 控制項活在 rail（`[data-cfg] [data-cfg-key]`，任何
 * DOM 位置皆可——rail 本身在 main 之外），套用目標是整個
 * `main.han`（不再是單一預覽 `<article>`），輸出面板是站④的
 * `[data-out-code] code` / `[data-pg-views]`（不再有「即時預覽」分頁，
 * 頁面本身就是預覽）。
 *
 * ts-style note: `configRef` / `modRef` are this codebase's one-
 * mutable-cell pattern (ts-style SKILL §3, "no let, no mutation") —
 * both stay `const`, never rebound; only `.current` is replaced
 * wholesale (`configRef.current = { ...prev, … }`). Everything else
 * in this file is either a pure function (`setPath`, `getPath`,
 * `readControl`) or an imperative DOM read/write confined to the
 * `apply*` layer.
 */
import {
  DEFAULTS, cssVars, packages, zianoUrl,
  renderCDN, renderBundler, renderImport,
} from '/home/codegen.js'

/* ── 按需字體載入（去重） ──
 * `loaded` is a dedup index, not app state — nothing reads its
 * history, only membership — so a mutated `Set` is the accepted
 * exception here rather than an immutable-collection rebuild. */
const loaded = new Set()
const ensureFont = (id) => {
  if (loaded.has(id)) return
  loaded.add(id)
  document.head.insertAdjacentHTML(
    'beforeend',
    `<link rel="stylesheet" href="${zianoUrl(id)}">`,
  )
}

/* ── config 讀寫（純函數：回傳新物件，從不動原物件）── */
const setPath = (obj, path, value) => {
  const [key, ...rest] = path.split('.')
  return rest.length
    ? { ...obj, [key]: setPath(obj[key], rest.join('.'), value) }
    : { ...obj, [key]: value }
}

const getPath = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj)

const readControl = ($el) => ($el.type === 'checkbox' ? $el.checked : $el.value)

/* 所有可能被 cssVars() 寫入的自訂屬性；換 config 前先清空，
   讓未偏差的值交還給 @property 的 initial-value。 */
const ALL_VARS = [
  '--han-semantics', '--han-prose', '--han-punctuation-refinement',
  '--han-text-autospace', '--han-use-heritage-glyphs-for-hant',
  '--han-webfont-heritage-glyphs-sans', '--han-webfont-heritage-glyphs-serif',
  '--han-cursive', '--han-punctuation-hant', '--han-punctuation-hans',
  '--han-punctuation-ja', '--han-punctuation-vertical-ko',
  '--han-font-zhuyin-serif',
  '--han-cite-title-marks', '--han-em-symbol', '--han-em-dot-position',
]

/* ── apply：config → 全頁變數 ── */
// 自訂 proseScope 對頁面刻意無效——<main> 是單一恆開 prose 的容器；
// 作用域規則只進生成碼（讀者若把 <main> 換成別的選擇器才用得上）。
const applyMain = (config, $main) => {
  for (const prop of ALL_VARS) $main.style.removeProperty(prop)
  for (const [prop, value] of cssVars(config)) $main.style.setProperty(prop, value)
  // packages() 已依 heritage/cursive 編碼需要的家族；ensureFont 去重
  for (const id of packages(config).ziano) ensureFont(id)
  // baseGeneric：本頁沒有 <body> 可套（body 是 html.home 的殼），拿
  // main.han 自身頂替——codegen.js 生成的引用碼寫的是 `body { … }`，
  // 這裡的等效寫法是把同一條規則套在 main 本身（也是 --han-font-*
  // 讀者實際排文的容器）。RESET 靠 default 分支的 removeProperty 收回。
  config.baseGeneric === 'serif'
    ? ($main.style.fontFamily = 'var(--han-font-alternative)')
    : $main.style.removeProperty('font-family')
}

/* ── apply：JS 後備（作用於整個 main） ──
 * `modRef` — the one-mutable-cell for the lazily-imported han.js
 * module (see file-header note). */
const modRef = { current: null }
const applyFallbacks = async (config, $main) => {
  if (!config.fallbacks) {
    modRef.current?.uninstallFallbacks($main)
    return
  }
  modRef.current ??= await import('/han/han.js')
  modRef.current.uninstallFallbacks($main)
  modRef.current.installFallbacks($main)
}

/* ── apply：輸出面板（站④） ── */
const renderOutput = (config, ui) => {
  const render = {
    bundler: () => renderBundler(config, ui.$pm.value),
    cdn: () => renderCDN(config),
    import: () => renderImport(config),
  }[ui.tab]
  ui.$code.textContent = render()
}

/* ── 進場 ──
 * `$root` defaults to `document` — controls live in the rail, the
 * apply target is `main.han`, the output pane is station④'s markup;
 * none of them share a common ancestor smaller than the document, so
 * scoping queries to `$root` (rather than hardcoding `document`) only
 * matters for tests that pass an isolated fragment. */
export const initConfigurator = ($root = document) => {
  const $main = $root.querySelector('main.han')
  const configRef = { current: structuredClone(DEFAULTS) }
  const ui = {
    tab: 'bundler',
    $pm: $root.querySelector('[data-out-pm]'),
    $code: $root.querySelector('[data-out-code] code'),
  }

  const controls = () => [...$root.querySelectorAll('[data-cfg] [data-cfg-key]')]
  const $autospaceOn = () => $root.querySelector('[data-cfg-key="autospaceOn"]')
  const $autospaceMode = () => $root.querySelector('[data-cfg-key="autospaceMode"]')

  const sync = () => {
    // autospace 開關×進階模式 → config.autospace
    // insert/replace/strict 是 JS 消費值——fallbacks off 時一律折回 normal
    const jsMode = configRef.current.fallbacks ? $autospaceMode().value : 'normal'
    configRef.current = {
      ...configRef.current,
      autospace: $autospaceOn().checked ? jsMode : 'off',
    }

    applyMain(configRef.current, $main)
    applyFallbacks(configRef.current, $main)
    renderOutput(configRef.current, ui)

    // 家族選單只在 heritage=webfont 時可用；進階 autospace 只在勾了後備時展示
    $root.querySelectorAll('[data-cfg-heritage-family]').forEach(($el) => {
      $el.toggleAttribute('hidden', configRef.current.heritage !== 'webfont')
    })
    $root.querySelectorAll('[data-cfg-semantics-sub]').forEach(($el) => {
      $el.toggleAttribute('hidden', !configRef.current.semantics)
    })
    $root.querySelectorAll('[data-cfg-prose-sub]').forEach(($el) => {
      $el.toggleAttribute('hidden', !configRef.current.prose)
    })
    $root.querySelector('[data-cfg-advanced]')
      ?.toggleAttribute('hidden', !configRef.current.fallbacks)
  }

  controls().forEach(($el) => {
    const key = $el.dataset.cfgKey
    $el.addEventListener('input', () => {
      if (key !== 'autospaceOn' && key !== 'autospaceMode')
        configRef.current = setPath(configRef.current, key, readControl($el))
      sync()
    })
  })

  // pg-view 分頁（站④）：三分頁全是輸出碼（無「即時預覽」——全頁即預覽），
  // radio 值直接就是 ui.tab，不需 CSS pane-switch。
  const $views = $root.querySelector('[data-pg-views]')
  $views?.addEventListener('input', () => {
    ui.tab = $views.querySelector('input:checked').value
    renderOutput(configRef.current, ui)
  })
  ui.$pm?.addEventListener('input', () => renderOutput(configRef.current, ui))

  const $copy = $root.querySelector('[data-out-copy]')
  $copy?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(ui.$code.textContent)
    const original = $copy.textContent
    $copy.textContent = $copy.dataset.copied ?? '已複製'
    setTimeout(() => { $copy.textContent = original }, 1500)
  })

  // 「回到預設」— config 整個換回 DEFAULTS，控制項 DOM 狀態同步寫回，再 sync()。
  const $resetBtn = $root.querySelector('[data-rail-reset]')
  $resetBtn?.addEventListener('click', () => {
    configRef.current = structuredClone(DEFAULTS)
    controls().forEach(($el) => {
      const key = $el.dataset.cfgKey
      if (key === 'autospaceOn') { $el.checked = DEFAULTS.autospace !== 'off'; return }
      if (key === 'autospaceMode') { $el.value = DEFAULTS.autospace === 'off' ? 'normal' : DEFAULTS.autospace; return }
      const v = getPath(DEFAULTS, key)
      if ($el.type === 'checkbox') $el.checked = v
      else $el.value = v
    })
    sync()
  })

  sync()

  // 把後備套用權交還呼叫端——沒有呼叫端會用到這個了（範文切換已不存在），
  // 保留只為 API 穩定性（HP-4/HP-5 若要重套後備，介面已在）。
  return { reapplyFallbacks: ($target) => applyFallbacks(configRef.current, $target ?? $main) }
}
