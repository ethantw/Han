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

export const HERITAGE = {
  shanggu: {
    sans:  { stack: "'Shanggu Sans', 'Shanggu Sans TC'",  pkgs: ['shanggu-sans', 'shanggu-sans-tc'] },
    serif: { stack: "'Shanggu Serif', 'Shanggu Serif TC'", pkgs: ['shanggu-serif', 'shanggu-serif-tc'] },
  },
  // genyo（源樣）不提供：與源起同設計，源起的字型技術較新。
  genki: {
    sans:  { stack: "'Genki Gothic', 'Genki Gothic TC'", pkgs: ['genki-gothic', 'genki-gothic-tc'] },
    serif: { stack: "'Genki Min', 'Genki Min TC'",       pkgs: ['genki-min', 'genki-min-tc'] },
  },
}

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
  semantics: true,
  citeTitleMarks: 'none',        // none|bracket|wavy（僅 semantics on 時輸出）
  emSymbol: 'circle',            // circle|dot|sesame|triangle（同上）
  emPosition: 'auto',            // auto|under|over → '<v> right'（同上）
  prose: true,
  proseScope: 'article',
  lines: true,
  hang: true,
  squeeze: true,
  autospace: 'normal',            // normal|insert|replace|strict|off
  fonts: true,
  heritage: 'webfont',            // webfont|system|off
  heritageFamily: 'shanggu',      // shanggu|genki — 印刷字體（黑＋明一體選）
  cursive: 'webfont',             // webfont|system|off
  cursiveHant: 'lxgw',            // lxgw|iansui — 繁體楷體家族
  punct: { hant: 'MOE', hans: 'GB', ja: 'JIS', ko: 'KV' },
  zhuyinWebfont: true,
  baseGeneric: 'sans-serif',      // sans-serif|serif — which composite the body rides
  fallbacks: false,
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
  }
  if (c.lines) {              // 行的調整：標點refine ＋ 混排autospace
    const refine = refinement(c)
    if (refine !== 'auto') out.push(['--han-punctuation-refinement', refine])
    if (c.autospace !== 'normal')
      out.push(['--han-text-autospace', c.autospace === 'off' ? 'no-autospace' : c.autospace])
  }
  if (c.fonts) {              // 字體：heritage／cursive／punct／zhuyin 全歸此模組
    if (c.heritage !== 'webfont') out.push(['--han-use-heritage-glyphs-for-hant', c.heritage])
    if (c.heritage === 'webfont') {
      if (c.heritageFamily !== 'shanggu') {
        out.push(['--han-webfont-heritage-glyphs-sans', HERITAGE[c.heritageFamily].sans.stack])
        out.push(['--han-webfont-heritage-glyphs-serif', HERITAGE[c.heritageFamily].serif.stack])
      }
    }
    if (c.cursive !== 'webfont') out.push(['--han-cursive', c.cursive])
    if (c.cursive === 'webfont' && c.cursiveHant !== 'lxgw')
      out.push(['--han-webfont-cursive-hant', CURSIVE_HANT[c.cursiveHant].stack])
    for (const [key, def] of [['hant', 'MOE'], ['hans', 'GB'], ['ja', 'JIS']])
      if (c.punct[key] !== def) out.push([`--han-punctuation-${key}`, c.punct[key]])
    if (c.punct.ko !== 'KV') out.push(['--han-punctuation-vertical-ko', c.punct.ko])
    if (!c.zhuyinWebfont) out.push(['--han-font-zhuyin-serif', 'cursive, serif'])
  }
  return out
}

/** :root 區塊（含 prose 自訂作用域的附加規則）；無偏差回空字串。 */
const configCSS = (c, indent = '  ') => {
  const vars = cssVars(c)
  const scope = c.proseScope.replace(/[<>{};/]/g, '').trim()
  // baseGeneric：body 騎哪個複合字體——serif 換上 --han-font-alternative；
  // sans-serif（出廠）本就是 --han-font-default，無需輸出。單獨判斷（不進
  // cssVars()）——這不是 --han-* 變數偏差，是 body 本身的 font-family 覆寫；
  // 該變數來自 fonts.css，故 fonts off 時整條規則失去意義，一併 gate 掉。
  const rules = [
    ...(vars.length
      ? [`:root {\n${vars.map(([k, v]) => `${indent}${k}: ${v};`).join('\n')}\n}`]
      : []),
    ...(c.prose && scope && scope !== 'article' ? [`${scope} { --han-prose: on; }`] : []),
    ...(c.fonts && c.baseGeneric === 'serif' ? [`body { font-family: var(--han-font-alternative); }`] : []),
  ]
  return rules.join('\n')
}

/* ── 2 · 套件清單 ─────────────────────────────────────────── */

/** 實際用到的（webfont）套件族：ziano 依家族/楷體；dtj 依標點是否全關。
 *  fonts 模組 off ＝ 完全不需要字體套件。與 webfontDelivery 無關——那只決定
 *  「怎麼送」，這裡只算「要不要」。 */
export const packages = (c) => {
  if (!c.fonts) return { ziano: [], dtj: false }
  // 印刷字體＝同家族的黑＋明成對（heritageFamily 單選驅動兩者）。
  const heritagePkgs = c.heritage === 'webfont'
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

export const zianoUrl = (id, source = 'jsdelivr') =>
  `${ORIGIN[source]}${SCOPE}webfonts-${id}@latest/swap.css`

// diantenjeom 現在也隨 webfontCdnSource（han.css 本身仍恆 jsdelivr）。
export const dtjUrl = (source = 'jsdelivr') =>
  `${ORIGIN[source]}${SCOPE}diantenjeom@latest/dist/diantenjeom.css`

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

export const renderCDN = (c) => {
  const htmlLines = [
    ...preconnectLines(c),
    ...styleUrls(c).map((u) => `<link rel="stylesheet" href="${u}">`),
    ...(c.fallbacks ? [`<script type="module" src="${HAN_AUTO_URL}"></script>`] : []),
    ...(c.legacyRuby
      ? [
          `<script type="module">\n` +
          `  import { convertLegacyRuby } from '${HAN_JS_URL}'\n` +
          `  convertLegacyRuby(document.body)\n` +
          `</script>`,
        ]
      : []),
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
    ...(c.fallbacks ? [`import '${SCOPE}han.css/auto'`] : []),
    ...(c.legacyRuby
      ? [
          `import { convertLegacyRuby } from '${SCOPE}han.css'`,
          `convertLegacyRuby(document.body)`,
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
