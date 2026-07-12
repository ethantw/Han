/**
 * 配置器 intents + apply。
 * config（單一事實源）→ ① 預覽容器變數 ② 按需字體 <link> ③ 輸出面板重繪。
 * 生成邏輯全在 codegen.js（純函數）；本檔只碰 DOM。
 */
import {
  DEFAULTS, cssVars, packages, zianoUrl,
  renderCDN, renderBundler, renderImport,
} from '/home/codegen.js'

/* ── 按需字體載入（去重） ── */
const loaded = new Set()
const ensureFont = (id) => {
  if (loaded.has(id)) return
  loaded.add(id)
  document.head.insertAdjacentHTML(
    'beforeend',
    `<link rel="stylesheet" href="${zianoUrl(id)}">`,
  )
}

/* ── config 讀寫 ── */
const setPath = (obj, path, value) => {
  const keys = path.split('.')
  const last = keys.pop()
  keys.reduce((o, k) => o[k], obj)[last] = value
}

const readControl = (el) =>
  el.type === 'checkbox' ? el.checked : el.value

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

/* ── apply：config → 預覽變數 ── */
// 自訂 proseScope 對預覽刻意無效——預覽容器是單一恆開 prose 的 article；
// 作用域規則只進生成碼。
const applyPreview = (config, body) => {
  for (const prop of ALL_VARS) body.style.removeProperty(prop)
  for (const [prop, value] of cssVars(config)) body.style.setProperty(prop, value)
  // packages() 已依 heritage/cursive 編碼需要的家族；ensureFont 去重
  for (const id of packages(config).ziano) ensureFont(id)
}

/* ── apply：JS 後備（作用於預覽容器） ── */
let hanMod = null
const applyFallbacks = async (config, body) => {
  if (!config.fallbacks) {
    hanMod?.uninstallFallbacks(body)
    return
  }
  hanMod ??= await import('/han/han.js')
  hanMod.uninstallFallbacks(body)
  hanMod.installFallbacks(body)
}

/* ── apply：輸出面板 ── */
const renderOutput = (config, ui) => {
  const render = {
    bundler: () => renderBundler(config, ui.pm.value),
    cdn: () => renderCDN(config),
    import: () => renderImport(config),
  }[ui.tab]
  ui.code.textContent = render()
}

/* ── 進場 ── */
export const initConfigurator = (root) => {
  const body = root.querySelector('[data-pg-body]')
  const config = structuredClone(DEFAULTS)
  const ui = {
    tab: 'bundler',
    pm: root.querySelector('[data-out-pm]'),
    code: root.querySelector('[data-out-code] code'),
  }
  const autospaceOn = root.querySelector('[data-cfg-key="autospaceOn"]')
  const autospaceMode = root.querySelector('[data-cfg-key="autospaceMode"]')

  const sync = () => {
    // autospace 開關×進階模式 → config.autospace
    // insert/replace/strict 是 JS 消費值——fallbacks off 時一律折回 normal
    const jsMode = config.fallbacks ? autospaceMode.value : 'normal'
    config.autospace = autospaceOn.checked ? jsMode : 'off'

    applyPreview(config, body)
    applyFallbacks(config, body)
    renderOutput(config, ui)

    // 家族選單只在 heritage=webfont 時可用；進階 autospace 只在勾了後備時展示
    root.querySelectorAll('[data-cfg-heritage-family]').forEach((el) => {
      el.toggleAttribute('hidden', config.heritage !== 'webfont')
    })
    root.querySelectorAll('[data-cfg-semantics-sub]').forEach((el) => {
      el.toggleAttribute('hidden', !config.semantics)
    })
    root.querySelector('[data-cfg-advanced]')
      .toggleAttribute('hidden', !config.fallbacks)
  }

  for (const el of root.querySelectorAll('[data-cfg] [data-cfg-key]')) {
    const key = el.dataset.cfgKey
    el.addEventListener('input', () => {
      if (key !== 'autospaceOn' && key !== 'autospaceMode')
        setPath(config, key, readControl(el))
      sync()
    })
  }

  // pg-view 分頁：radio + :has() 由 CSS 切換顯隱；JS 只追蹤 code pane
  // 該渲染哪一版（「即時預覽」分頁不改寫選擇，切回程式碼分頁時內容仍在）。
  const views = root.querySelector('[data-pg-views]')
  views.addEventListener('input', () => {
    const view = views.querySelector('input:checked').value
    if (view !== 'preview') ui.tab = view
    renderOutput(config, ui)
  })
  ui.pm.addEventListener('input', () => renderOutput(config, ui))

  const copy = root.querySelector('[data-out-copy]')
  copy.addEventListener('click', async () => {
    await navigator.clipboard.writeText(ui.code.textContent)
    const original = copy.textContent
    copy.textContent = copy.dataset.copied ?? '已複製'
    setTimeout(() => { copy.textContent = original }, 1500)
  })

  sync()

  // 把後備套用權交還呼叫端：換範文/重渲染 Markdown 後由 playground.js
  // 以「當前 config」重套，而非無條件 installFallbacks。
  return { reapplyFallbacks: (body) => applyFallbacks(config, body) }
}
