/**
 * <han-console> config core — 控件 → config → 套用 + 廣播.
 *
 * The configurator half of the old `home/configurator.js`, now scoped to
 * the component's shadow root (controls). The CSS lands on `:root` ＋
 * `body` —逐字鏡射生成碼的兩條規則，且非如此不可（§ applyTarget）；
 * light-DOM 的 `target`（預設 `main`）只剩一個職責：han.js JS 後備的作用
 * 範圍。The OUTPUT half (station④'s code
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
  DEFAULTS, MODULES, HERITAGE_LOCALES, cssVars, packages, zianoUrl,
} from '/home/codegen.js'
import { icon } from '../common/icon.js'

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
  '--han-text-autospace',
  '--han-use-heritage-glyphs-for-hant', '--han-use-heritage-glyphs-for-hans',
  '--han-use-heritage-glyphs-for-ja', '--han-use-heritage-glyphs-for-ko',
  '--han-webfont-heritage-family',
  '--han-use-cursive', '--han-webfont-cursive-hant',
  '--han-punctuation-hant', '--han-punctuation-hans',
  '--han-punctuation-ja', '--han-punctuation-ko',
  '--han-font-zhuyin-serif',
  '--han-cite-title-marks', '--han-em-symbol', '--han-em-dot-position',
]

/* ── apply：config → 文件變數 ──
 *
 * 落點與生成碼**逐字一致**：模式變數上 `:root`，`font-family` 覆寫上 `body`
 * （codegen.js § configCSS 產的就是這兩條規則）。這不是風格選擇，是必要條件：
 *
 *   `--han-punctuation-*` 之類的模式變數由 fonts.css 的 `@container style()`
 *   翻成字體槽，而 style query **只看祖先、不看自己**。頁面的字體堆疊宣告在
 *   `body { font-family: var(--han-font-default) }`——`font-family` 是普通繼承
 *   屬性，`var()` 只在宣告它的那個元素上代換一次，代換出來的字串才往下繼承。
 *   所以模式變數必須落在 `body` 的**上方**（＝`:root`）：落在 `body` 自己或
 *   更下面的 `main`，body 代換時查到的仍是 `<html>` 的舊值，整棵子樹就繼承到
 *   一份定型的舊字體堆疊——症狀是「按新公約懸掛、按舊公約畫字」（懸掛走
 *   `--han-state-hanging-punctuation`，那條宣告在 `:where(:lang(zh))`，每個元素
 *   各自重新求值，所以它是對的，只有字體是錯的）。
 *
 * 反過來，`font-family` 覆寫不能跟著上 `:root`：`body` 有自己的 `font-family`
 * 宣告，會贏過從 `<html>` 繼承來的值：寫在 `:root` 等於沒寫。它必須落在 body
 * 這一層，且落在這裡才讀得到 `:root` 剛寫上的模式變數。
 *
 * 元件的 `target` 屬性管的是另一件事（han.js JS 後備的作用範圍），與此無關。 */
const applyTarget = (config, $fallbackScope) => {
  const $root = document.documentElement
  const $body = document.body
  for (const prop of ALL_VARS) $root.style.removeProperty(prop)
  /* han.js 的 JS 後備會把它解析出來的模式**回寫**成 `$fallbackScope` 上的行內
     值（punctuation.ts § setPunctuationRefinementMode，autospace 同理）。那份
     回寫是宣告值，會蓋掉從 `:root` 繼承下來的新設定——上一輪停在 `auto`，這一
     輪 :root 改成 `hang`，整個 scope 仍讀到自己身上那個舊 `auto`，連 han.js
     下一輪重讀 computed 都只讀得到自己的舊值，就此鎖死。所以每輪先把這批變數
     從 scope 上掃掉，讓它重新繼承 `:root`，han.js 再據以回寫。CSS 落點統一到
     `:root` 之前，這裡寫的就是 scope 本身，覆寫順手就把舊值蓋掉了，不必額外掃。 */
  if ($fallbackScope && $fallbackScope !== $root)
    for (const prop of ALL_VARS) $fallbackScope.style.removeProperty(prop)
  for (const [prop, value] of cssVars(config)) $root.style.setProperty(prop, value)
  // 預覽恆走 CDN link（不管 webfontDelivery 生成碼要不要走 npm）。
  for (const id of packages(config).ziano) ensureFont(id, config.webfontCdnSource)
  // baseGeneric：serif 時把 body 的 font-family 換上 --han-font-alternative
  // （鏡射生成碼的 `body { … }`）；RESET 靠 removeProperty 收回。
  config.baseGeneric === 'serif'
    ? ($body.style.fontFamily = 'var(--han-font-alternative)')
    : $body.style.removeProperty('font-family')
}

/* ── apply：模組／webfont 開關（頁面側 DOM 寫入，與 ensureFont 同邊界）──
 *
 * 三個模組撥 han.css 自己的旗標，只有 fonts 仍卸載樣式表。理由是實測到的：
 * `link.disabled` 的代價**與模組大小無關**，是「重新收集整份 document 的
 * stylesheet」的固定稅。首頁 Chromium、longtask observer 收 600ms、7 次
 * 中位數（docs/plans/module-switch-css-vars.md §5）：
 *
 *              link.disabled      旗標
 *   semantics    439ms            123ms   --han-semantics
 *   lines        405ms            163ms   兩個旋鈕（見下）
 *   prose        405ms              0ms   --han-prose
 *   fonts        478ms（開）        ——     維持 link
 *
 * prose.css 只有 134 行也照樣要價 405ms，這就是「稅」而不是「工」的證據。
 * 走旗標的成本才跟實際工作量成正比。fonts 留在 link 上是刻意的：換字體必然
 * 全頁重新 shape，那份工旗標省不掉，而它的 `@font-face` / `@property` 註冊
 * 本來就不是旗標關得掉的東西。
 *
 * **生成碼不變**：加／減一行 `@import` 仍是這幾個開關要預覽的決定，codegen
 * 一個字都沒動。旗標只是拿來把那個決定畫出來的手段。
 *
 * 已知的單向近似（真的少一行 import 會更徹底，走旗標則留著）：
 *   · semantics.css 刻意放在 `@container style()` 之外的那幾條（`:root` 的
 *     font-family 與 underline-offset，該檔稱之為 correctness fix 而非可退
 *     出的加值）仍會套用。
 *   · 各模組的 `@property` 註冊都還在。
 *
 * 唯一補過的一處落差是 lines 的擠壓：`--han-punctuation-refinement: none`
 * 會落到 `text-spacing-trim: space-all`，比「沒 import」關得更徹底（瀏覽器
 * 原生本來就會擠）。由 common/module-state.css 把它 revert 回 UA 值，那支
 * 檔的註解有量測與 `&` 那半為何不可省。
 *
 * `.disabled` 撥的是 stylesheet 的**啟用**狀態，不是下載——設 disabled 只讓該
 * sheet 不參與 cascade；CSS 檔本身照樣被 preload scanner 抓（實測 Chromium 如此，
 * 連初始 HTML 就帶 disabled 屬性也照抓）。
 *   · `<link data-han-webfont>` 於 webfontDelivery==='none' 時 disable：其
 *     `@font-face` 不啟用 → 連帶**不抓 woff2 字型檔**（真正省到的是字型檔，
 *     不是那支 swap.css）。
 * 沒有這些 link 的頁面（元件單獨掛載）整層 no-op。 */

/** 模組 → 撥法。`link` ＝ 卸載樣式表；其餘是要寫在 `:root` 上的旗標。
 *  lines 需要兩個旋鈕才蓋得住整個模組：`--han-text-autospace` 管混排間隙，
 *  `--han-punctuation-refinement` 管擠壓＋懸掛，且 han.js 讀同兩個 cascade
 *  變數決定要不要插 `<h-iss>` / 包 `<h-char>`（iss.ts 的 `resolveISSMode`
 *  顯式把 `no-autospace` 映到 JS enum 的 `none`）。所以旗標一撥，CSS 與 JS
 *  同時停手 —— 這是 `link.disabled` 做不到的：樣式表卸載連帶帶走
 *  `@property` 註冊，han.js 讀回空字串後退回 `normal` / `auto`，照樣插
 *  spacer、照樣包 wrapper，只是沒樣式所以看不見。 */
const MODULE_MECHANISM = {
  semantics: { '--han-semantics': 'off' },
  lines: {
    '--han-text-autospace': 'no-autospace',
    '--han-punctuation-refinement': 'none',
  },
  /* prose 的旗標種在 `:where(article)` 上（prose.css 刻意如此），`:root` 撥
     不到它 —— 所以這裡只鏡射狀態屬性，實際的 `article { --han-prose: off }`
     在 common/module-state.css。 */
  prose: {},
  fonts: 'link',
}

const applyModules = (config) => {
  const { style, dataset } = document.documentElement
  for (const [name, mechanism] of Object.entries(MODULE_MECHANISM)) {
    const on = config[name] !== false
    /* 只**寫** off 旗標，不負責收回——收回由 applyTarget 的 ALL_VARS 掃除
       統一做（三個旗標 `--han-semantics` / `--han-text-autospace` /
       `--han-punctuation-refinement` 都在那張表裡）。自從 CSS 落點統一到
       `:root`（applyTarget），兩邊寫的是同一個元素的同一批屬性：這裡若還帶
       removeProperty，模組重新開啟那一輪就會把 applyTarget 剛寫上的偏差值
       一併抹掉（sync 的順序是 applyTarget → applyModules）。反向也安全：
       cssVars() 對關掉的模組本就不輸出任何變數，所以掃除完只剩這裡的 off
       旗標，兩者不會爭同一個值。 */
    if (mechanism !== 'link') {
      for (const [prop, offValue] of Object.entries(mechanism)) {
        if (!on) style.setProperty(prop, offValue)
      }
    }
    /* 狀態鏡射到 `<html>`：頁面 CSS 有東西可以選（prose 的 article 規則、
       站①的 `[data-han-module-semantics='off']`），且四個模組一致，不管該
       模組走的是 link 還是旗標。 */
    const key = `hanModule${name[0].toUpperCase()}${name.slice(1)}`
    if (on) delete dataset[key]
    else dataset[key] = 'off'
  }
  document.querySelectorAll('link[data-han-module]').forEach(($link) => {
    if (MODULE_MECHANISM[$link.dataset.hanModule] !== 'link') return
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
 * `root` = shadowRoot（控件所在）；`target` = **han.js JS 後備的作用範圍**
 * （light DOM，可 null——CSS 那側的落點固定是 `:root` ＋ `body`，見
 * applyTarget）；`dispatch(config, source)` = 廣播回呼（元件提供，發
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
      $btn.append(icon('reset'), label)
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
    const anyHeritageWebfont = HERITAGE_LOCALES.some((loc) => c.heritage[loc] === 'webfont')
    root.querySelectorAll('[data-cfg-heritage-family]').forEach(($el) => {
      $el.toggleAttribute('hidden', !anyHeritageWebfont)
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
    const webfontSelectKeys = [
      ...HERITAGE_LOCALES.map((loc) => `heritage.${loc}`),
      'cursive',
    ]
    for (const key of webfontSelectKeys) {
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
          heritage: { ...configRef.current.heritage },
          cursive: configRef.current.cursive,
          punct: { ...configRef.current.punct },
        }
        configRef.current = {
          ...configRef.current,
          // 無外部 webfont：繁中退日系統字（system-ja），其餘語言退各自系統字（off）。
          heritage: { hant: 'system-ja', hans: 'off', ja: 'off', ko: 'off' },
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
