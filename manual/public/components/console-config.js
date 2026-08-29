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
  DEFAULTS, MODULES, HERITAGE_LOCALES, cssVars, packages, zianoUrl, selectedPasses,
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

/* 所有可能被 cssVars() 寫入的自訂屬性；初次掛載用來清理舊實例的殘值，
   後續更新則由 effectiveVars 的前後 map 差量收回。 */
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
  '--han-zhuyin-ruby-position',
  '--han-cite-title-marks', '--han-em-symbol', '--han-em-dot-position',
]

// han.js 只會把這三個解析後的模式寫回 install root；設定改變時先收回它們，
// 讓 :root 的新值立刻穿透，不必等排在下一幀的 DOM fallback 重建。
const FALLBACK_SYNCED_VARS = [
  '--han-punctuation-refinement',
  '--han-text-autospace',
  '--han-text-decoration-inset',
]

const clearFallbackModes = ($target) => {
  if (!$target || $target === document.documentElement) return
  for (const prop of FALLBACK_SYNCED_VARS) $target.style.removeProperty(prop)
}

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
const applyTarget = (config, state) => {
  const $root = document.documentElement
  const $body = document.body
  const next = effectiveVars(config)

  // 首輪清掉 SSR／上一個元件實例可能留下的值；之後只碰真正變動的屬性。
  const previous = state.vars
  if (!previous) {
    for (const prop of ALL_VARS) $root.style.removeProperty(prop)
  } else {
    for (const prop of previous.keys()) {
      if (!next.has(prop)) $root.style.removeProperty(prop)
    }
  }
  for (const [prop, value] of next) {
    if (previous?.get(prop) !== value) $root.style.setProperty(prop, value)
  }
  state.vars = next

  // 預覽恆走 CDN link（不管 webfontDelivery 生成碼要不要走 npm）。
  for (const id of packages(config).ziano) ensureFont(id, config.webfontCdnSource)
  // baseGeneric：serif 時把 body 的 font-family 換上 --han-font-alternative
  // （鏡射生成碼的 `body { … }`）；RESET 靠 removeProperty 收回。
  if (state.baseGeneric !== config.baseGeneric) {
    config.baseGeneric === 'serif'
      ? ($body.style.fontFamily = 'var(--han-font-alternative)')
      : $body.style.removeProperty('font-family')
    state.baseGeneric = config.baseGeneric
  }
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
 *     `@font-face` 不啟用 → 連帶**不抓 woff2 字體檔**（真正省到的是字體檔，
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

/**
 * 最終真正寫到 :root 的變數。模組 off 旗標也在同一張 map 裡，讓一次差量
 * 寫入同時處理「偏差值」與「模組狀態」，不再先把整批變數清空、寫回，然後
 * 又由 applyModules 覆寫一次。後者會讓 8k+ 節點的首頁在每次 input 都做兩輪
 * 無謂的 style invalidation。
 */
const effectiveVars = (config) => {
  const vars = new Map(cssVars(config))
  for (const [name, mechanism] of Object.entries(MODULE_MECHANISM)) {
    if (config[name] !== false || mechanism === 'link') continue
    for (const [prop, value] of Object.entries(mechanism)) vars.set(prop, value)
  }
  return vars
}

const applyModules = (config) => {
  const { dataset } = document.documentElement
  for (const [name, mechanism] of Object.entries(MODULE_MECHANISM)) {
    const on = config[name] !== false
    /* 狀態鏡射到 `<html>`：頁面 CSS 有東西可以選（prose 的 article 規則、
       站①的 `[data-han-module-semantics='off']`），且四個模組一致，不管該
       模組走的是 link 還是旗標。 */
    const key = `hanModule${name[0].toUpperCase()}${name.slice(1)}`
    if (on && key in dataset) delete dataset[key]
    else if (!on && dataset[key] !== 'off') dataset[key] = 'off'
  }
  document.querySelectorAll('link[data-han-module]').forEach(($link) => {
    if (MODULE_MECHANISM[$link.dataset.hanModule] !== 'link') return
    const disabled = !config[$link.dataset.hanModule]
    if ($link.disabled !== disabled) $link.disabled = disabled
  })
  document.querySelectorAll('link[data-han-webfont]').forEach(($link) => {
    const disabled = config.webfontDelivery === 'none'
    if ($link.disabled !== disabled) $link.disabled = disabled
  })
}

/* ── apply：JS 後備（作用於 target）──
 * `modRef` — the one-mutable-cell for the lazily-imported han.js module.
 *
 * 兩種送法在預覽裡要真的長得不一樣：`auto` 跑整套 `installFallbacks`，
 * `manual` 只跑讀者勾的那幾支、依 PASSES 序。預覽的目的就是讓「少勾一支」
 * 看得見，全部一律 installFallbacks 會讓那幾顆 checkbox 變成純裝飾。
 *
 * `uninstall` 這一支不在預覽裡執行——它的作用是「把前面做的全撤掉」，在一個
 * 每次重繪本來就先 uninstall 一次的預覽裡跑它，等於把整組勾選歸零，讀者只會
 * 看到畫面突然沒有排版。它出現在清單上是為了讓加法式替它計價。 */
const modRef = { current: null }
const applyFallbacks = async (config, $target, isCurrent = () => true) => {
  if (!$target || !isCurrent()) return
  /* han.js 會把解析後的行調整模式寫回 scope。只有真的要重跑 fallback 時才掃；
     純字體／語意變數變動若也掃，既破壞快取又迫使整棵 main 重新算 style。 */
  clearFallbackModes($target)
  if (!config.fallbacks) {
    modRef.current?.uninstallFallbacks($target)
    return
  }
  const mod = modRef.current ??= await import('/han/han.js')
  // Initial import may finish after the reader has already changed config.
  // Never let that stale snapshot overwrite the newer scheduled run.
  if (!isCurrent()) return
  mod.uninstallFallbacks($target)
  if (config.jsMode !== 'manual') {
    mod.installFallbacks($target)
    return
  }
  selectedPasses(config)
    .filter((p) => p.id !== 'uninstall')
    // runPassChunked：單支 pass 直接吃大文檔會爆棧（han.js 的遞迴走訪
    // ~7,500 節點上限；installFallbacks 內建同一套分塊）。
    .forEach((p) => mod.runPassChunked($target, ($chunk) => mod[p.fn]($chunk)))
}

/* Autospace mode changes own only <h-iss>. Re-running punctuation, quote
 * boundaries and adjacent-line marking for this dropdown was the remaining
 * 600ms stall after the broad invalidation was fixed. Restore/remove its
 * nodes locally, then run that one pass. */
const applyISSFallback = async (config, $target, isCurrent = () => true) => {
  if (!$target || !isCurrent()) return
  const mod = modRef.current ??= await import('/han/han.js')
  if (!isCurrent()) return

  $target.querySelectorAll('h-iss').forEach(($iss) => {
    $iss.dataset.mode === 'replace' ? $iss.replaceWith(' ') : $iss.remove()
  })

  const enabled = config.fallbacks
    && config.lines
    && (config.jsMode !== 'manual' || config.fn.iss)
  if (!enabled) return
  mod.runPassChunked($target, ($chunk) => mod.applyISSWithProbe($chunk))
}

/** 一次實際 fallback run 能留下的 DOM 能力。關掉某項時 wrapper 可以靠
 * cascade 休眠，毋須拆除；之後重新打開，只要上一次實際 run 已經建過那種
 * wrapper，也毋須再走 8k 節點。只有新增尚未建過的能力才重跑。 */
const fallbackPlan = (config) => ({
  core: JSON.stringify({
    fallbacks: config.fallbacks,
    jsMode: config.jsMode,
    fn: config.jsMode === 'manual' ? config.fn : undefined,
  }),
  fallbacks: config.fallbacks,
  lines: config.lines,
  hang: config.lines && config.hang,
  squeeze: config.lines && config.squeeze,
  autospace: config.lines ? config.autospace : 'off',
})

const fallbackRunKind = (next, applied) => {
  if (!applied || next.core !== applied.core) return 'full'
  if (!next.fallbacks || !next.lines) return null
  if (!applied.lines) return 'full'
  if (next.hang && !applied.hang) return 'full'
  if (next.squeeze && !applied.squeeze) return 'full'
  return next.autospace !== 'off' && next.autospace !== applied.autospace
    ? 'iss'
    : null
}

const sameFallbackPlan = (a, b) =>
  a?.core === b?.core
  && a?.lines === b?.lines
  && a?.hang === b?.hang
  && a?.squeeze === b?.squeeze
  && a?.autospace === b?.autospace

/**
 * 重建 fallback DOM 是首頁唯一還可能超過一幀的工作。設定本身（CSS 變數與
 * module flag）先同步落地，fallback 等瀏覽器畫出這一幀後再在 idle slot
 * 對齊；快速連撥只執行最後一份 config。這不是把回應延後——恰好相反：使用者
 * 先立即看到 cascade 的結果，不再被一輪 8k 節點的 tree walk 擋在 input 裡。
 */
const scheduleFallbacks = (config, $target, kind, generationRef, onApplied) => {
  const generation = ++generationRef.current
  const snapshot = structuredClone(config)
  requestAnimationFrame(() => {
    const run = async () => {
      if (generation !== generationRef.current) return
      const apply = kind === 'iss' ? applyISSFallback : applyFallbacks
      await apply(snapshot, $target, () => generation === generationRef.current)
      if (generation === generationRef.current) onApplied()
    }
    if ('requestIdleCallback' in globalThis) {
      requestIdleCallback(run, { timeout: 180 })
    } else {
      setTimeout(run, 0)
    }
  })
}

/* ── 進場 ──
 * `root` = shadowRoot（控件所在）；`target` = **han.js JS 後備的作用範圍**
 * （light DOM，可 null——CSS 那側的落點固定是 `:root` ＋ `body`，見
 * applyTarget）；`dispatch(config, source)` = 廣播回呼（元件提供，發
 * han-config-change）；`initial` = 補水用起始 config（lang 重渲染時保留
 * 狀態；預設 DEFAULTS）。 */
export const mountConsoleConfig = ({ root, target, dispatch, initial }) => {
  const configRef = { current: structuredClone(initial ?? DEFAULTS) }
  const appliedRef = { current: { vars: null, baseGeneric: null } }
  const fallbackAppliedRef = { current: null }
  const fallbackDesiredRef = { current: null }
  const fallbackGenerationRef = { current: 0 }

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

    // Homepage may freeze off-screen specimens before an inherited root/body
    // change. The component stays generic: pages without that performance
    // hook simply have no listener for this event.
    if (source !== 'init') {
      document.dispatchEvent(new CustomEvent('han-config-will-apply', {
        detail: { source },
      }))
    }

    applyTarget(configRef.current, appliedRef.current)
    applyModules(configRef.current)
    const plan = fallbackPlan(configRef.current)
    const fallbackConfigChanged = !sameFallbackPlan(plan, fallbackDesiredRef.current)
    fallbackDesiredRef.current = plan
    if (fallbackConfigChanged) clearFallbackModes(target)

    const runKind = fallbackConfigChanged
      ? fallbackRunKind(plan, fallbackAppliedRef.current)
      : null
    if (fallbackConfigChanged && !runKind) {
      // A cheaper cascade-only state superseded a queued rebuild.
      fallbackGenerationRef.current += 1
    }

    if (runKind) {
      clearFallbackModes(target)
      if (source === 'init') {
        const generation = ++fallbackGenerationRef.current
        const snapshot = structuredClone(configRef.current)
        applyFallbacks(
          snapshot,
          target,
          () => generation === fallbackGenerationRef.current,
        ).then(() => {
          if (generation === fallbackGenerationRef.current)
            fallbackAppliedRef.current = plan
        })
      } else {
        scheduleFallbacks(
          configRef.current,
          target,
          runKind,
          fallbackGenerationRef,
          () => { fallbackAppliedRef.current = plan },
        )
      }
    }
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
