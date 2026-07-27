/**
 * <han-console> config core — 控件 → config → 套用 + 廣播.
 *
 * The configurator half of the old `home/configurator.js`, now scoped to
 * the component's shadow root (controls) and a light-DOM `target`
 * element (`main` by default — where the `--han-*` deviations and
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
  DEFAULTS, MODULES, cssVars, packages, zianoUrl,
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
  '--han-use-cursive', '--han-webfont-cursive-hant',
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
  // 預覽恆走 CDN link（不管 webfontDelivery 生成碼要不要走 npm）。
  for (const id of packages(config).ziano) ensureFont(id, config.webfontCdnSource)
  // baseGeneric：serif 時把 target 的 font-family 換上 --han-font-alternative
  // （鏡射生成碼的 `body { … }`）；RESET 靠 removeProperty 收回。
  config.baseGeneric === 'serif'
    ? ($target.style.fontFamily = 'var(--han-font-alternative)')
    : $target.style.removeProperty('font-family')
}

/* ── apply：模組／webfont link 開關（頁面側 DOM 寫入，與 ensureFont 同邊界）──
 * `.disabled` 撥的是 stylesheet 的**啟用**狀態，不是下載——設 disabled 只讓該
 * sheet 不參與 cascade；CSS 檔本身照樣被 preload scanner 抓（實測 Chromium 如此，
 * 連初始 HTML 就帶 disabled 屬性也照抓）。
 *   · `<link data-han-module>` 依模組布林撥：off ＝ 該模組樣式**不套用**（鏡射
 *     生成碼少一行 import 的視覺結果，並非省下該檔的下載）。
 *   · `<link data-han-webfont>` 於 webfontDelivery==='none' 時 disable：其
 *     `@font-face` 不啟用 → 連帶**不抓 woff2 字型檔**（真正省到的是字型檔，
 *     不是那支 swap.css）。
 * 沒有這些 link 的頁面（元件單獨掛載）整層 no-op。 */
const applyModules = (config) => {
  document.querySelectorAll('link[data-han-module]').forEach(($link) => {
    $link.disabled = !config[$link.dataset.hanModule]
  })
  document.querySelectorAll('link[data-han-webfont]').forEach(($link) => {
    $link.disabled = config.webfontDelivery === 'none'
  })
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
export const mountConsoleConfig = ({ root, target, dispatch, initial }) => {
  const configRef = { current: structuredClone(initial ?? DEFAULTS) }

  /* webfontDelivery='none' 級聯的兩格一格可變單元（ts-style §3）。進入 none
   * 時 memo 記下 heritage／cursive／punct 原值、config 強制為無外部 webfont 的
   * 等價設定；離開 none 時還原。以 sync 內「delivery 與上次相比是否改變」偵測
   * 驅動，好讓 ↺／reset 路徑也一併走到（reset 直接棄 memo、不還原——reset 為
   * 大）。zhuyinWebfont 不在級聯內：注音是 han.css 內建字體，與第三方 webfont
   * 套件無關。已知可接受的邊界（設計取捨）：memo 不跨 lang 重渲染存活，補水後
   * 從無 memo 起算。 */
  const deliveryRef = { current: configRef.current.webfontDelivery }
  const webfontMemo = { current: null }

  const controls = () => [...root.querySelectorAll('[data-cfg] [data-cfg-key]')]
  const $autospaceOn = () => root.querySelector('[data-cfg-key="autospaceOn"]')
  const $autospaceMode = () => root.querySelector('[data-cfg-key="autospaceMode"]')

  /* ── per-control 「使用預設値」 ──
   * The composite autospace pair maps onto config.autospace, so its two
   * controls carry their own default values; everything else reads
   * straight out of DEFAULTS by path. */
  const defaultFor = (key) =>
    key === 'autospaceOn' ? DEFAULTS.autospace !== 'off'
    : key === 'autospaceMode' ? 'normal'
    : getPath(DEFAULTS, key)

  /* Injected at mount — uniform behaviour chrome, not domain data; the
   * locale string comes from the template's data-label-default (the DOM
   * carries the copy, this module stays copy-free). ONE button per
   * ControlGroup head (owner call: 每個 details 群組，不是每個細項),
   * visible only while any control in the group deviates. A nested
   * group (標點字體／繁體專項) gets its own narrower button; the parent
   * group's covers all descendants, so both light up together — the
   * parent reads as "this group, as a whole, is dirty". Clicking inside
   * a <summary> must preventDefault or it would toggle the accordion. */
  const groupControls = ($group) => [...$group.querySelectorAll('[data-cfg-key]')]
  const groups = () => [...root.querySelectorAll('.ControlGroup')]
    .map(($group) => ({
      $group,
      $head: $group.querySelector(':scope > summary, :scope > header'),
    }))
    .filter(({ $group, $head }) => $head && groupControls($group).length)

  const injectDefaultButtons = () => {
    const label = root.querySelector('.Controls')?.dataset.labelDefault ?? 'Use default'
    groups().forEach(({ $group, $head }) => {
      const $btn = document.createElement('button')
      $btn.type = 'button'
      $btn.className = 'Default'
      $btn.textContent = `↺ ${label}`
      $btn.title = label
      $btn.hidden = true
      $btn.addEventListener('click', (e) => {
        e.preventDefault()
        groupControls($group).forEach(($el) => {
          const key = $el.dataset.cfgKey
          const v = defaultFor(key)
          if ($el.type === 'checkbox') $el.checked = v
          else $el.value = v
          if (key !== 'autospaceOn' && key !== 'autospaceMode')
            configRef.current = setPath(configRef.current, key, v)
        })
        sync('reset')
      })
      $head.append($btn)
    })
  }

  const updateDefaultButtons = () => {
    groups().forEach(({ $group, $head }) => {
      const $btn = $head.querySelector(':scope > .Default')
      if (!$btn) return
      $btn.hidden = groupControls($group)
        .every(($el) => readControl($el) === defaultFor($el.dataset.cfgKey))
    })
  }

  const applyVisibility = () => {
    const c = configRef.current
    root.querySelectorAll('[data-cfg-heritage-family]').forEach(($el) => {
      $el.toggleAttribute('hidden', c.heritage !== 'webfont')
    })
    root.querySelectorAll('[data-cfg-cursive-family]').forEach(($el) => {
      $el.toggleAttribute('hidden', c.cursive !== 'webfont')
    })
    root.querySelectorAll('[data-cfg-webfont-cdn-source]').forEach(($el) => {
      $el.toggleAttribute('hidden', c.webfontDelivery !== 'cdn')
    })
    // 模組 off → 對應 details 掛 data-module-off（controls.css 灰掉整組，
    // summary 仍可點）。狀態化、冪等；details 的開／合本身只在 input handler
    // 撥動的當下處理，不在這裡（職責分離）。
    for (const key of MODULES) {
      root.querySelector(`details[data-module="${key}"]`)
        ?.toggleAttribute('data-module-off', !c[key])
    }
    // webfontDelivery='none' → 外部 webfont 全不可達，停用相應選項（heritage／
    // cursive 的 webfont 選項、四個 punct 的非 off 選項）；離開 none 一律解禁。
    const noWebfont = c.webfontDelivery === 'none'
    for (const key of ['heritage', 'cursive']) {
      const $opt = root.querySelector(`[data-cfg-key="${key}"] option[value="webfont"]`)
      if ($opt) $opt.disabled = noWebfont
    }
    root.querySelectorAll('[data-cfg-key^="punct."] option').forEach(($opt) => {
      if ($opt.value !== 'off') $opt.disabled = noWebfont
    })
    root.querySelector('[data-cfg-advanced]')
      ?.toggleAttribute('hidden', !c.fallbacks)
  }

  const sync = (source) => {
    // webfontDelivery 級聯（見 deliveryRef 宣告處註解）——以「與上次 sync 的
    // delivery 差異」偵測驅動（imperative shell），故 reset 與 ↺ 路徑同樣經此。
    const delivery = configRef.current.webfontDelivery
    if (delivery !== deliveryRef.current) {
      if (source === 'reset') {
        webfontMemo.current = null              // reset 為大：棄 memo、不還原
      } else if (delivery === 'none') {
        webfontMemo.current = {
          heritage: configRef.current.heritage,
          cursive: configRef.current.cursive,
          punct: { ...configRef.current.punct },
        }
        configRef.current = {
          ...configRef.current,
          heritage: 'system',
          cursive: 'system',
          punct: { hant: 'off', hans: 'off', ja: 'off', ko: 'off' },
        }
        writeControls(configRef.current)
      } else if (webfontMemo.current) {
        configRef.current = { ...configRef.current, ...webfontMemo.current }
        webfontMemo.current = null
        writeControls(configRef.current)
      }
      deliveryRef.current = delivery
    }

    // autospace 開關×進階模式 → config.autospace（fallbacks off 時折回 normal）
    const jsMode = configRef.current.fallbacks ? $autospaceMode().value : 'normal'
    configRef.current = {
      ...configRef.current,
      autospace: $autospaceOn().checked ? jsMode : 'off',
    }

    applyTarget(configRef.current, target)
    applyModules(configRef.current)
    applyFallbacks(configRef.current, target)
    applyVisibility()
    updateDefaultButtons()
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

  injectDefaultButtons()

  controls().forEach(($el) => {
    const key = $el.dataset.cfgKey
    $el.addEventListener('input', () => {
      if (key !== 'autospaceOn' && key !== 'autospaceMode')
        configRef.current = setPath(configRef.current, key, readControl($el))
      // 模組開關撥動的當下——同步展開／收合對應 details（勾＝開、取消＝合）；
      // 僅此一刻，狀態化的 data-module-off 灰化由 applyVisibility 負責。
      if (MODULES.includes(key)) {
        const $details = root.querySelector(`details[data-module="${key}"]`)
        if ($details) $details.open = $el.checked
      }
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
    // 度量 slider → config.metrics 的唯一入口（console-metrics.js 的 onChange）。
    // metrics 不對應任何 [data-cfg-key] 控件，故 writeControls／defaultFor 無涉；
    // DEFAULTS 已含 metrics，故 structuredClone／reset 自動帶上它。
    setMetrics: (metrics) => {
      configRef.current = { ...configRef.current, metrics: { ...metrics } }
      sync('metrics')
    },
  }
}
