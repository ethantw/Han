/**
 * <han-rail> config core — 控件 → config → 套用 + 廣播.
 *
 * The configurator half of the old `home/configurator.js`, now scoped to
 * the component's shadow root (controls) and a light-DOM `target`
 * element (`main.han` by default — where the `--han-*` deviations and
 * the metrics inline style land). The OUTPUT half (station④'s code
 * panes) split out to `home/snippet.js`, which subscribes to the
 * `han-config-change` event this module broadcasts through `dispatch`.
 *
 * ts-style note: `configRef` / `modRef` are the codebase's one-mutable-
 * cell pattern (ts-style SKILL §3) — `const`, never rebound; only
 * `.current` is replaced wholesale. Everything else is a pure function
 * (`setPath` / `getPath` / `readControl`) or a DOM read/write confined
 * to the `apply*` layer.
 */
import {
  DEFAULTS, cssVars, packages, zianoUrl,
} from '/home/codegen.js'

/* ── 按需字體載入（去重）── injects into document.head (light DOM), so
 * the target actually renders the webfonts the config encodes. `loaded`
 * is a dedup index (membership only) — a mutated Set is the sanctioned
 * exception. Dedup key is `id:source`. */
const loaded = new Set()
const ensureFont = (id, source) => {
  const key = `${id}:${source}`
  if (loaded.has(key)) return
  loaded.add(key)
  document.head.insertAdjacentHTML(
    'beforeend',
    `<link rel="stylesheet" href="${zianoUrl(id, source)}">`,
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
  '--han-cursive', '--han-webfont-cursive-hant',
  '--han-punctuation-hant', '--han-punctuation-hans',
  '--han-punctuation-ja', '--han-punctuation-vertical-ko',
  '--han-font-zhuyin-serif',
  '--han-cite-title-marks', '--han-em-symbol', '--han-em-dot-position',
]

/* ── apply：config → target 變數 ──
 * target 找不到時（元件照常渲染、僅不套用）這層整個略過。 */
const applyTarget = (config, $target) => {
  if (!$target) return
  for (const prop of ALL_VARS) $target.style.removeProperty(prop)
  for (const [prop, value] of cssVars(config)) $target.style.setProperty(prop, value)
  // 預覽恆走 CDN link（不管 zianoDelivery 生成碼要不要走 npm）。
  for (const id of packages(config).ziano) ensureFont(id, config.zianoCdnSource)
  // baseGeneric：serif 時把 target 的 font-family 換上 --han-font-alternative
  // （鏡射生成碼的 `body { … }`）；RESET 靠 removeProperty 收回。
  config.baseGeneric === 'serif'
    ? ($target.style.fontFamily = 'var(--han-font-alternative)')
    : $target.style.removeProperty('font-family')
}

/* ── apply：JS 後備（作用於 target）──
 * `modRef` — the one-mutable-cell for the lazily-imported han.js module. */
const modRef = { current: null }
const applyFallbacks = async (config, $target) => {
  if (!$target) return
  if (!config.fallbacks) {
    modRef.current?.uninstallFallbacks($target)
    return
  }
  modRef.current ??= await import('/han/han.js')
  modRef.current.uninstallFallbacks($target)
  modRef.current.installFallbacks($target)
}

/* ── 進場 ──
 * `root` = shadowRoot（控件所在）；`target` = 套用目標（light DOM，可
 * null）；`dispatch(config, source)` = 廣播回呼（元件提供，發
 * han-config-change）；`initial` = 補水用起始 config（lang 重渲染時保留
 * 狀態；預設 DEFAULTS）。 */
export const mountRailConfig = ({ root, target, dispatch, initial }) => {
  const configRef = { current: structuredClone(initial ?? DEFAULTS) }

  const controls = () => [...root.querySelectorAll('[data-cfg] [data-cfg-key]')]
  const $autospaceOn = () => root.querySelector('[data-cfg-key="autospaceOn"]')
  const $autospaceMode = () => root.querySelector('[data-cfg-key="autospaceMode"]')

  const applyVisibility = () => {
    root.querySelectorAll('[data-cfg-heritage-family]').forEach(($el) => {
      $el.toggleAttribute('hidden', configRef.current.heritage !== 'webfont')
    })
    root.querySelectorAll('[data-cfg-cursive-family]').forEach(($el) => {
      $el.toggleAttribute('hidden', configRef.current.cursive !== 'webfont')
    })
    root.querySelectorAll('[data-cfg-ziano-cdn-source]').forEach(($el) => {
      $el.toggleAttribute('hidden', configRef.current.zianoDelivery !== 'cdn')
    })
    root.querySelectorAll('[data-cfg-semantics-sub]').forEach(($el) => {
      $el.toggleAttribute('hidden', !configRef.current.semantics)
    })
    root.querySelectorAll('[data-cfg-prose-sub]').forEach(($el) => {
      $el.toggleAttribute('hidden', !configRef.current.prose)
    })
    root.querySelector('[data-cfg-advanced]')
      ?.toggleAttribute('hidden', !configRef.current.fallbacks)
  }

  const sync = (source) => {
    // autospace 開關×進階模式 → config.autospace（fallbacks off 時折回 normal）
    const jsMode = configRef.current.fallbacks ? $autospaceMode().value : 'normal'
    configRef.current = {
      ...configRef.current,
      autospace: $autospaceOn().checked ? jsMode : 'off',
    }

    applyTarget(configRef.current, target)
    applyFallbacks(configRef.current, target)
    applyVisibility()
    dispatch(configRef.current, source)
  }

  // 把 config 值寫回控件 DOM——reset 與 lang 重渲染後補水共用。
  const writeControls = (config) => {
    controls().forEach(($el) => {
      const key = $el.dataset.cfgKey
      if (key === 'autospaceOn') { $el.checked = config.autospace !== 'off'; return }
      if (key === 'autospaceMode') { $el.value = config.autospace === 'off' ? 'normal' : config.autospace; return }
      const v = getPath(config, key)
      if ($el.type === 'checkbox') $el.checked = v
      else $el.value = v
    })
  }

  // 補水起始狀態進控件 DOM（lang 重渲染時保留使用者選擇）。
  if (initial) writeControls(configRef.current)

  controls().forEach(($el) => {
    const key = $el.dataset.cfgKey
    $el.addEventListener('input', () => {
      if (key !== 'autospaceOn' && key !== 'autospaceMode')
        configRef.current = setPath(configRef.current, key, readControl($el))
      sync(key)
    })
  })

  // 回預設——config 整個換回 DEFAULTS，控件 DOM 同步，再 sync('reset')。
  const reset = () => {
    configRef.current = structuredClone(DEFAULTS)
    writeControls(DEFAULTS)
    sync('reset')
  }

  sync('init')

  return {
    reset,
    reapplyFallbacks: ($t) => applyFallbacks(configRef.current, $t ?? target),
    get config() { return configRef.current },
  }
}
