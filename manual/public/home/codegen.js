/**
 * Playground 配置器 · 純生成核心。
 * config in → pane[] out（`{ lang, code }[]`），零 DOM——單測直跑 node --test。
 * 變數 API 對照 docs/plans/playground-configurator-impl.md 表格。
 *
 * Pane API (Request A): each of renderBundler/renderCDN returns an
 * ordered array of `{ lang: 'bash'|'html'|'js'|'css', code: string }`,
 * empty panes omitted. configurator.js renders one <figure> per pane;
 * highlight.js colours each <code> by its pane's `lang`.
 *
 * CDN @import method (formerly renderImport) was dropped per owner
 * request — @import can't carry <link>-only delivery (e.g. ziano CDN
 * webfonts) or JS, and two method tabs (bundler/CDN) cover the need.
 */

const CDN = 'https://cdn.jsdelivr.net/npm/'
const SCOPE = '@hanzi.pro/'

/**
 * 傳承字形家族。`pkgs` 只列**第一順位那一刻**的套件,不列第二順位——那不是
 * 省略,是量出來的: 丹與月兩個套件的 `unicode-range` 逐條相同（尚古明體 109
 * 條、源起黑體 648 條、源起明體 756 條,全數一致,只有 family 名與 woff2 檔
 * 不同）。CSS 的字體匹配只看 `unicode-range`,不看語言,所以 `'X', 'X Yue'`
 * 這種疊法裡第二順位永遠輪不到——每個碼位都先被第一順位接走。兩刻是「改用」
 * 而非「補上」的關係。疊著只是多兩支 render-blocking 樣式表,一個字都不會由
 * 它畫。（ziano 的包名: 無後綴 ＝ 丹,`-yue` ＝ 月。）
 *
 * han.css 自己的 `--han-webfont-heritage-glyphs-*`（src/css/fonts.css）仍然
 * 兩個都列,那是刻意的保險:只裝 TC 套件的人靠第二順位才拿得到字。這裡是
 * 「產生什麼安裝指示」,不是「堆疊怎麼寫」,所以只給實際會用到的那個。
 */
export const HERITAGE = {
  shanggu: {
    sans:  { stack: "'Shanggu Sans', 'Shanggu Sans Yue'",   pkgs: ['shanggu-sans'] },
    serif: { stack: "'Shanggu Serif', 'Shanggu Serif Yue'", pkgs: ['shanggu-serif'] },
  },
  // genyo（源樣）不提供：與源起同設計，源起的字體技術較新。
  genki: {
    sans:  { stack: "'Genki Sans Yue', 'Genki Sans'",   pkgs: ['genki-sans-yue'] },
    serif: { stack: "'Genki Serif Yue', 'Genki Serif'", pkgs: ['genki-serif-yue'] },
  },
}

/* 傳承字形 per-locale 的出廠預設（cssVars 只輸出偏離值；只有繁中預設開）。 */
export const HERITAGE_LOCALES = ['hant', 'hans', 'ja', 'ko']
const HERITAGE_DEFAULT = { hant: 'webfont', hans: 'off', ja: 'off', ko: 'off' }
const anyHeritageWebfont = (c) => HERITAGE_LOCALES.some((loc) => c.heritage[loc] === 'webfont')

/* 繁體楷體的可換家族（--han-webfont-cursive-hant swap 槽）；
   hans（lxgw-wenkai）與 ja（klee-one）楷體不受此選擇影響。 */
export const CURSIVE_HANT = {
  lxgw:   { stack: "'LXGW WenKai TC'", pkg: 'lxgw-wenkai-tc' },
  iansui: { stack: "'Iansui'",         pkg: 'iansui' },
}

const cursivePkgs = (c) => [CURSIVE_HANT[c.cursiveHant].pkg, 'lxgw-wenkai', 'klee-one']

export const DEFAULTS = {
  // 四個模組開關（semantics／lines／prose／fonts）：off ＝ 該模組 CSS 根本不
  // import（生成碼加／減 import 行）。semantics／prose 原就是布林旗標，這裡兼作
  // 模組開關重複使用。
  // 度量 sliders — body-level 排版基準；只在偏差時輸出 body 規則，不屬任何模組
  metrics: { size: 16, leading: 1.75, weight: 400 },
  semantics: true,
  citeTitleMarks: 'none',        // none|bracket|wavy（僅 semantics on 時輸出）
  emSymbol: 'circle',            // circle|dot|sesame|triangle（同上）
  emPosition: 'auto',            // auto|under|over → '<v> right'（同上）
  zhuyinPosition: 'over',        // over|inter-character（同上；橫排推薦 inter-character）
  prose: true,
  proseScope: 'article',
  lines: true,
  hang: true,
  squeeze: true,
  autospace: 'normal',            // normal|insert|replace|strict|off
  fonts: true,
  // 傳承字形 per-locale（鏡射 punct）：hant 三值 webfont|system-ja|off、預設
  // webfont；hans/ja/ko 兩值 webfont|off、預設 off。字形以傳承字形為主，不符
  // JIS/GB 國家標準——適合繁簡日韓混排統一字體，合規要求者留 off。
  heritage: { hant: 'webfont', hans: 'off', ja: 'off', ko: 'off' },
  heritageFamily: 'shanggu',      // shanggu|genki — 印刷字體（黑＋明一體選，全域）
  cursive: 'webfont',             // webfont|system|off
  cursiveHant: 'lxgw',            // lxgw|iansui — 繁體楷體家族
  punct: { hant: 'MOE', hans: 'GB', ja: 'JIS', ko: 'KLR' },
  zhuyinWebfont: true,
  baseGeneric: 'sans-serif',      // sans-serif|serif — which composite the body rides
  fallbacks: true,               // JS排版補全 — on by default (owner call)
  /**
   * 腳本怎麼送。`auto` ＝ 匯入 `…/auto`，載入即全套安裝，一行了事；`manual`
   * ＝ 自己具名匯入要用的那幾支、自己挑時機呼叫，打包器把其餘搖掉。兩者的
   * 差別是**體積**，這正是站伍加法式在算的東西。
   */
  jsMode: 'auto',                // auto|manual
  /* jsMode='manual' 時逐函式取捨。預設三支 ＝ installFallbacks 會跑的那些，
     所以「切到 manual 但一顆都不動」在行為上等同 auto，只是少了幾百 byte。 */
  fn: {
    punctuation: true,
    iss: true,
    adjacentLines: true,
    ruby: false,
    uninstall: false,
  },
  legacyRuby: false,
  // Request B — 第三方 webfont 套件的送法，套用到「所有」外部 webfont 套件
  // （ziano 家族 ＋ diantenjeom）：'none' ＝ 完全不用外部 webfont。
  webfontDelivery: 'cdn',         // cdn|npm|none — CDN is ziano's 方法一, slice-on-demand is its point
  webfontCdnSource: 'jsdelivr',   // jsdelivr|unpkg|esmsh
}

/* ── 0 · 模組 ─────────────────────────────────────────────── */

// 四個模組（bundle 順序 ＝ 生成 import 順序）。開關 off ＝ 該模組 CSS 不 import。
export const MODULES = ['semantics', 'lines', 'prose', 'fonts']

const enabledModules = (c) => MODULES.filter((m) => c[m])

/* ── 1 · 變數偏差 ─────────────────────────────────────────── */

/**
 * 可具名匯入的函式，順序 ＝ 生成碼的呼叫順序 ＝ 站伍加法式的列序。順序是有
 * 作用的：加法式把共用碼算給先出現的那一支（見 home/ledger.js 的鏈式拆解），
 * 所以共用最多 helper 的兩道行調整排在前面。ISS 給的是帶探針的那支——Safari
 * 的 inline-boundary bug 全靠它，而探針有記憶化，沒有理由把不帶探針的版本
 * 當成預設選項。
 *
 * `id` ＝ config.fn 的鍵、console 的 checkbox 鍵；`fn` ＝ 匯出名；`call` ＝ 生成
 * 碼那一行。這三者必須與 `dist/pass-sizes.json` 逐字相同，否則加法式報的是讀者
 * 拿不到的那個打包——manual/tests/codegen.test.js 有一條專門盯這件事。
 */
export const PASSES = [
  { id: 'punctuation',   fn: 'refinePunctuation',  call: 'refinePunctuation(document.body)' },
  { id: 'iss',           fn: 'applyISSWithProbe',  call: 'applyISSWithProbe(document.body)' },
  { id: 'adjacentLines', fn: 'markAdjacentLines',  call: 'markAdjacentLines(document.body)' },
  { id: 'ruby',          fn: 'transpileRuby',      call: 'transpileRuby(document.body)' },
  { id: 'uninstall',     fn: 'uninstallFallbacks', call: 'uninstallFallbacks(document.body)' },
]

/** 選中的 pass（依 PASSES 序）；非 manual 模式或後備整顆關掉時為空。 */
export const selectedPasses = (c) =>
  c.fallbacks && c.jsMode === 'manual' ? PASSES.filter((p) => c.fn[p.id]) : []

/** 選擇的 bitmask — `dist/pass-sizes.json` 的查表鍵（bit i ↔ PASSES[i]）。 */
export const passMask = (c) =>
  PASSES.reduce((m, p, i) => (c.fallbacks && c.jsMode === 'manual' && c.fn[p.id] ? m | (1 << i) : m), 0)

const refinement = ({ hang, squeeze }) =>
  hang && squeeze ? 'auto' : hang ? 'hang' : squeeze ? 'compress' : 'none'

/** 只回傳偏離出廠預設的 [prop, value] 對，順序固定。
 *  模組 off ＝ 整段 CSS 不 import，故該模組的變數一律不輸出（off 由缺席表達，
 *  不再靠 `--han-semantics: off` 之類的旗標）。 */
export const cssVars = (c) => {
  const out = []
  if (c.semantics) {          // 語意細項：layer 關掉即失效，不輸出
    if (c.citeTitleMarks !== 'none') out.push(['--han-cite-title-marks', c.citeTitleMarks])
    if (c.emSymbol !== 'circle') out.push(['--han-em-symbol', c.emSymbol])
    if (c.emPosition !== 'auto') out.push(['--han-em-dot-position', `${c.emPosition} right`])
    if (c.zhuyinPosition !== 'over') out.push(['--han-zhuyin-ruby-position', c.zhuyinPosition])
  }
  if (c.lines) {              // 行的調整：標點refine ＋ 混排autospace
    const refine = refinement(c)
    if (refine !== 'auto') out.push(['--han-punctuation-refinement', refine])
    if (c.autospace !== 'normal')
      out.push(['--han-text-autospace', c.autospace === 'off' ? 'no-autospace' : c.autospace])
  }
  if (c.fonts) {              // 字體：heritage／cursive／punct／zhuyin 全歸此模組
    for (const loc of HERITAGE_LOCALES)
      if (c.heritage[loc] !== HERITAGE_DEFAULT[loc])
        out.push([`--han-use-heritage-glyphs-for-${loc}`, c.heritage[loc]])
    // 家族＝單行 --han-webfont-heritage-family（library 端 @container 翻成
    // swap 槽）；任一語言開 webfont 且非預設 shanggu 時才輸出。
    if (anyHeritageWebfont(c) && c.heritageFamily !== 'shanggu')
      out.push(['--han-webfont-heritage-family', c.heritageFamily])
    if (c.cursive !== 'webfont') out.push(['--han-use-cursive', c.cursive])
    if (c.cursive === 'webfont' && c.cursiveHant !== 'lxgw')
      out.push(['--han-webfont-cursive-hant', CURSIVE_HANT[c.cursiveHant].stack])
    // 四個文種同構（公約與文種已解耦，見 src/css/fonts.css 檔頭）——ko 從前
    // 因為變數名帶 `vertical-` 而要單獨一行，改名之後併回迴圈。
    for (const [key, def] of [['hant', 'MOE'], ['hans', 'GB'], ['ja', 'JIS'], ['ko', 'KLR']])
      if (c.punct[key] !== def) out.push([`--han-punctuation-${key}`, c.punct[key]])
    if (!c.zhuyinWebfont) out.push(['--han-font-zhuyin-serif', 'cursive, serif'])
  }
  return out
}

/** :root 區塊（含 prose 自訂作用域的附加規則）；無偏差回空字串。 */
const configCSS = (c, indent = '  ') => {
  const vars = cssVars(c)
  const scope = c.proseScope.replace(/[<>{};/]/g, '').trim()
  // body 規則：baseGeneric 的 font-family 覆寫 ＋ 度量 slider 的偏差，合成
  // 「一條」body { }。各宣告獨立 gate、順序固定：
  //  · font-family — baseGeneric serif 換上 --han-font-alternative；sans-serif
  //    （出廠）本就是 --han-font-default，無需輸出。不進 cssVars()——這不是
  //    --han-* 變數偏差，是 body 自己的 font-family 覆寫；該變數來自 fonts.css，
  //    故 fonts off 時整條失去意義，一併 gate 掉。
  //  · font-size／line-height／font-weight — 度量 slider 只在偏離出廠基準時輸出，
  //    body 層排版基準，不屬任何 --han-* 模組。
  // 恰一條宣告 → 維持單行 `body { … }`；兩條以上 → 展開成塊（比照 :root 的縮排）。
  const m = c.metrics
  const bodyDecls = [
    ...(c.fonts && c.baseGeneric === 'serif' ? ['font-family: var(--han-font-alternative);'] : []),
    ...(m.size !== 16 ? [`font-size: ${m.size}px;`] : []),
    ...(m.leading !== 1.75 ? [`line-height: ${String(m.leading)};`] : []),
    ...(m.weight !== 400 ? [`font-weight: ${m.weight};`] : []),
  ]
  const bodyRule =
    bodyDecls.length === 0 ? []
    : bodyDecls.length === 1 ? [`body { ${bodyDecls[0]} }`]
    : [`body {\n${bodyDecls.map((d) => `${indent}${d}`).join('\n')}\n}`]
  const rules = [
    ...(vars.length
      ? [`:root {\n${vars.map(([k, v]) => `${indent}${k}: ${v};`).join('\n')}\n}`]
      : []),
    ...(c.prose && scope && scope !== 'article' ? [`${scope} { --han-prose: on; }`] : []),
    ...bodyRule,
  ]
  return rules.join('\n')
}

/* ── 2 · 套件清單 ─────────────────────────────────────────── */

/** 實際用到的（webfont）套件族：ziano 依家族/楷體；dtj 依標點是否全關。
 *  fonts 模組 off ＝ 完全不需要字體套件。與 webfontDelivery 無關——那只決定
 *  「怎麼送」，這裡只算「要不要」。 */
export const packages = (c) => {
  if (!c.fonts) return { ziano: [], dtj: false }
  // 印刷字體＝同家族的黑＋明成對（heritageFamily 單選驅動兩者）；任一語言
  // 開 webfont 即需載入（尚古/源起 base 已覆蓋全 CJK，同組 pkgs 服務四語言）。
  const heritagePkgs = anyHeritageWebfont(c)
    ? [
        ...HERITAGE[c.heritageFamily].sans.pkgs,
        ...HERITAGE[c.heritageFamily].serif.pkgs,
      ]
    : []
  const ziano = [
    ...heritagePkgs,
    ...(c.cursive === 'webfont' ? cursivePkgs(c) : []),
  ]
  const dtj = Object.values(c.punct).some((v) => v !== 'off')
  return { ziano, dtj }
}

/* ── 2b · CDN 來源（Request B）───────────────────────────────
 * han.css 恆走 jsdelivr（方法頁既有行為不變）；ziano webfont 套件與 diantenjeom
 * 的來源皆可由 webfontCdnSource 切換——鏡射 ziano/demo/src/cdn/cdn.ts 的 ORIGIN
 * 表。 */
const ORIGIN = {
  jsdelivr: 'https://cdn.jsdelivr.net/npm/',
  unpkg: 'https://unpkg.com/',
  esmsh: 'https://esm.sh/',
}

/* 版本號來自 `window.__hanCdn`，由 _layout.html／_home.html 從 manual/.env
   注入（見那兩個檔的 head）。這支檔在 public/ 底下、被 Vite 原樣複製，所以讀不到
   import.meta.env，也吃不到 `%VITE_…%` 替換——只能靠全域傳進來。
   讀不到就退回 `latest`：這支也可以被直接開來讀、當成示範程式碼，那種情境下沒有
   layout，不該因此壞掉。
   要緊的是它產生的片段與讀者眼前那一頁載入的是同一版；兩者同源於 .env。 */
const version = (pkg) => globalThis.__hanCdn?.[pkg] || 'latest'

export const zianoUrl = (id, source = 'jsdelivr') =>
  `${ORIGIN[source]}${SCOPE}webfonts-${id}@${version('ziano')}/swap.css`

// diantenjeom 現在也隨 webfontCdnSource（han.css 本身仍恆 jsdelivr）。
export const dtjUrl = (source = 'jsdelivr') =>
  `${ORIGIN[source]}${SCOPE}diantenjeom@${version('diantenjeom')}/dist/diantenjeom.css`

const preconnectHost = (source) => new URL(ORIGIN[source]).origin

const HAN_CSS_URL = `${CDN}${SCOPE}han.css@latest/dist/han.min.css`
const HAN_CSS_MOD_URL = (mod) => `${CDN}${SCOPE}han.css@latest/dist/han.${mod}.min.css`
const HAN_AUTO_URL = `${CDN}${SCOPE}han.css@latest/dist/han.auto.min.js`
const HAN_JS_URL = `${CDN}${SCOPE}han.css@latest/dist/han.min.js`

// han.css 樣式引用：四模組全開 → 單一入口（han.min.css／'/styles'）；有關 →
// 逐模組（bundle 順序）；全關 → 無（樣式層完全不引）。
const hanCssUrls = (c) => {
  const mods = enabledModules(c)
  return mods.length === MODULES.length ? [HAN_CSS_URL] : mods.map(HAN_CSS_MOD_URL)
}

// 站④「內嵌」分頁專用——同源、已由 vite.config.js 的 syncFramework() 同步進
// public/han/ 的本機副本（console 模組開關讀的就是這批檔案）。renderInline() 不
// 自己 fetch（codegen.js 保持零 DOM、純函式、node --test 可測）；snippet.js
// 用這幾個 URL 把「真正的 minified bytes」抓回來，當 assets 參數傳進去。
export const localHanCssUrls = (c) => {
  const mods = enabledModules(c)
  return mods.length === MODULES.length ? ['/han/han.min.css'] : mods.map((m) => `/han/han.${m}.min.css`)
}
export const HAN_AUTO_LOCAL_URL = '/han/han.auto.min.js'
export const HAN_JS_LOCAL_URL = '/han/han.min.js'

const hanCssImports = (c) => {
  const mods = enabledModules(c)
  return mods.length === MODULES.length
    ? [`import '${SCOPE}han.css/styles'`]
    : mods.map((m) => `import '${SCOPE}han.css/styles/${m}'`)
}

const styleUrls = (c) => {
  const { ziano, dtj } = packages(c)
  const webfonts = c.webfontDelivery !== 'none'
  return [
    ...hanCssUrls(c),
    ...(webfonts ? ziano.map((id) => zianoUrl(id, c.webfontCdnSource)) : []),
    ...(webfonts && dtj ? [dtjUrl(c.webfontCdnSource)] : []),
  ]
}

// preconnect：直接從實際輸出的樣式 URL 取 origin（Set 去重），jsdelivr 若在其
// 中排最前——dtj／ziano 可能落在別的 origin，比手算來源更穩且自動正確。
const JSDELIVR_ORIGIN = 'https://cdn.jsdelivr.net'

const preconnectLines = (c) => {
  const origins = new Set(styleUrls(c).map((u) => new URL(u).origin))
  const ordered = origins.has(JSDELIVR_ORIGIN)
    ? [JSDELIVR_ORIGIN, ...[...origins].filter((o) => o !== JSDELIVR_ORIGIN)]
    : [...origins]
  return ordered.map((h) => `<link rel="preconnect" href="${h}" crossorigin>`)
}

/* ── 3 · 兩分頁（bundler／cdn）── 各自回傳 pane[]，空窗格省略 ──── */

/**
 * 腳本區塊（CDN／內嵌兩分頁共用的形狀）。`auto` ＝ 一行 `<script src>`；
 * `manual` ＝ 一段具名匯入的 module 區塊，讀者自己挑的那幾支、按 PASSES 序
 * 呼叫。`legacyRuby` 只在 auto 模式下另掛一段——manual 模式的 ruby 由
 * `fn.ruby` 這顆勾選表達，兩處都給會變成同一件事有兩個開關。
 */
const moduleScript = (url, passes) => [
  '<script type="module">',
  `  import { ${passes.map((p) => p.fn).join(', ')} } from '${url}'`,
  ...passes.map((p) => `  ${p.call}`),
  '</script>',
].join('\n')

const scriptLines = (c, autoUrl, jsUrl) => {
  if (!c.fallbacks) return []
  if (c.jsMode === 'manual') {
    const passes = selectedPasses(c)
    return passes.length ? [moduleScript(jsUrl, passes)] : []
  }
  return [
    `<script type="module" src="${autoUrl}"></script>`,
    ...(c.legacyRuby ? [moduleScript(jsUrl, [PASSES.find((p) => p.id === 'ruby')])] : []),
  ]
}

export const renderCDN = (c) => {
  const htmlLines = [
    ...preconnectLines(c),
    ...styleUrls(c).map((u) => `<link rel="stylesheet" href="${u}">`),
    ...scriptLines(c, HAN_AUTO_URL, HAN_JS_URL),
  ]
  const css = configCSS(c)

  return [
    { lang: 'html', code: htmlLines.join('\n') },
    ...(css ? [{ lang: 'css', code: css }] : []),
  ]
}

const PM = { npm: 'npm i', pnpm: 'pnpm add', yarn: 'yarn add' }

// exported name/label split: internal radio value stays `bundler` and this
// export stays `renderBundler` for API/test stability — the ViewTabs label
// reads "npm" now (owner rename), since delivery here is always npm-first.
export const renderBundler = (c, pm = 'pnpm') => {
  const { ziano, dtj } = packages(c)
  const npm = c.webfontDelivery === 'npm'
  const cdn = c.webfontDelivery === 'cdn'
  const npmZiano = npm ? ziano : []
  const cdnZiano = cdn ? ziano : []
  const npmDtj = npm && dtj
  const cdnDtj = cdn && dtj

  const jsPasses = selectedPasses(c)

  // han.css dep：任一模組開，或 fallbacks／legacyRuby 的 JS 仍需 han.css 套件時
  // 才列——全模組關且無 JS 附掛時整個 han.css 套件都不需要。
  const needHanCss = enabledModules(c).length > 0 || c.fallbacks || c.legacyRuby

  const deps = [
    ...(needHanCss ? [`${SCOPE}han.css`] : []),
    ...npmZiano.map((id) => `${SCOPE}webfonts-${id}`),
    ...(npmDtj ? [`${SCOPE}diantenjeom`] : []),
  ]
  const bash = { lang: 'bash', code: `${PM[pm]} ${deps.join(' \\\n  ')}` }

  const jsLines = [
    '// main.js',
    ...hanCssImports(c),
    ...npmZiano.map((id) => `import '${SCOPE}webfonts-${id}'`),
    ...(npmDtj ? [`import '${SCOPE}diantenjeom'`] : []),
    // auto ＝ 一行匯入，載入即安裝；manual ＝ 具名匯入自選的那幾支，打包器
    // 靠 package.json 的 sideEffects 把其餘搖掉（站伍加法式算的就是這個）。
    ...(jsPasses.length
      ? [
          `import { ${jsPasses.map((p) => p.fn).join(', ')} } from '${SCOPE}han.css'`,
          ...jsPasses.map((p) => p.call),
        ]
      : c.fallbacks
        ? [
            `import '${SCOPE}han.css/auto'`,
            ...(c.legacyRuby
              ? [
                  `import { transpileRuby } from '${SCOPE}han.css'`,
                  `transpileRuby(document.body)`,
                ]
              : []),
          ]
        : []),
  ]
  const js = { lang: 'js', code: jsLines.join('\n') }

  const cssBody = configCSS(c)
  const css = cssBody ? { lang: 'css', code: `/* styles.css — 放進全域樣式表，勿貼進 main.js */\n${cssBody}` } : null

  // webfontDelivery=cdn：ziano ＋ dtj 家族不進 install/import，改在這裡出 <link>
  // ——它們不走 npm，這段 CDN 引用是唯一的取得方式（dtj link 排在 ziano 之後）。
  const htmlLines = cdnZiano.length || cdnDtj
    ? [
        `<link rel="preconnect" href="${preconnectHost(c.webfontCdnSource)}" crossorigin>`,
        ...cdnZiano.map((id) => `<link rel="stylesheet" href="${zianoUrl(id, c.webfontCdnSource)}">`),
        ...(cdnDtj ? [`<link rel="stylesheet" href="${dtjUrl(c.webfontCdnSource)}">`] : []),
      ]
    : []
  const html = htmlLines.length ? { lang: 'html', code: htmlLines.join('\n') } : null

  return [bash, js, ...(css ? [css] : []), ...(html ? [html] : [])]
}

/**
 * 「內嵌」分頁 — 一段可以直接貼進任意網頁或 JSBin/CSSBin 之類單檔編輯器的
 * `<style>`＋`<script type="module">`，framework 本體的 CSS/JS 是**真正貼進去
 * 的 minified bytes**，不是 URL 參照。維持 codegen.js 零 DOM／純函式的約定：
 * 不自己 fetch，`assets`（框架真正的 minified 文字）由呼叫端（snippet.js）先
 * 抓好再傳進來——`renderInline(c, {})` 在 assets 還沒抓到時安全地省略對應區塊
 * （不會丟例外），方便呼叫端在 fetch 進行中先用空 assets 渲染一次。
 *
 * ziano／diantenjeom 依然是 CDN `<link>`，不內嵌——它們的 CSS 本來就指向外部
 * `.woff2`，內嵌那段 CSS 文字並不會讓頁面真正離線；把整組字重的 binary 轉
 * base64 塞進去是完全另一個功能，這裡不做。
 */
export const renderInline = (c, assets = {}) => {
  const { ziano, dtj } = packages(c)
  const webfonts = c.webfontDelivery !== 'none'
  const cdnZiano = webfonts ? ziano : []
  const cdnDtj = webfonts && dtj

  const linkLines = cdnZiano.length || cdnDtj
    ? [
        `<link rel="preconnect" href="${preconnectHost(c.webfontCdnSource)}" crossorigin>`,
        ...cdnZiano.map((id) => `<link rel="stylesheet" href="${zianoUrl(id, c.webfontCdnSource)}">`),
        ...(cdnDtj ? [`<link rel="stylesheet" href="${dtjUrl(c.webfontCdnSource)}">`] : []),
      ]
    : []

  // framework minified CSS（assets，已抓好的 bytes）＋ 使用者變數偏差
  // （configCSS，跟另外兩分頁同一套純函式）合成同一顆 <style>。
  const cssBody = configCSS(c)
  const styleBody = [assets.css, cssBody].filter(Boolean).join('')
  const styleLines = styleBody ? [`<style>\n${styleBody}</style>`] : []

  /**
   * han.min.js 經 esbuild minify 後內部名稱被改寫（例如
   * `export{Co as transpileRuby}`）——貼完原始碼直接呼叫裸露的
   * `transpileRuby(...)` 抓不到（那是 export-only 的名字，不是模組作用域裡的
   * 變數）。改用 Blob URL 動態 import：瀏覽器回傳的是標準的模組 namespace
   * 物件，一律用「匯出名」查找，不管內部被改寫成什麼名字都拿得到。
   */
  const blobScript = (passes) => [
    '<script type="module">',
    `  const src = ${JSON.stringify(assets.hanJs)}`,
    `  const mod = await import(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })))`,
    ...passes.map((p) => `  mod.${p.call}`),
    '</script>',
  ].join('\n')

  // 每個區塊各自 gate 在自己那份 asset 上——呼叫端可能只抓到其中一支（或還
  // 在抓），少一支不該連帶讓另一支消失。
  const jsPasses = selectedPasses(c)
  const manual = c.fallbacks && c.jsMode === 'manual'
  const scriptBlocks = [
    ...(manual && jsPasses.length && assets.hanJs ? [blobScript(jsPasses)] : []),
    // side-effect-only 的貼法（無 export 需要取用）——貼進去原樣執行，跟
    // `<script type="module" src="…han.auto.min.js">` 效果相同。
    ...(!manual && c.fallbacks && assets.autoJs ? [`<script type="module">\n${assets.autoJs}</script>`] : []),
    ...(!manual && c.legacyRuby && assets.hanJs ? [blobScript([PASSES.find((p) => p.id === 'ruby')])] : []),
  ]

  const htmlLines = [...linkLines, ...styleLines, ...scriptBlocks]
  return htmlLines.length ? [{ lang: 'html', code: htmlLines.join('\n') }] : []
}
