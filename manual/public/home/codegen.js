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

const CURSIVE_PKGS = ['lxgw-wenkai-tc', 'lxgw-wenkai', 'klee-one']

export const DEFAULTS = {
  semantics: true,
  citeTitleMarks: 'none',        // none|bracket|wavy（僅 semantics on 時輸出）
  emSymbol: 'circle',            // circle|dot|sesame|triangle（同上）
  emPosition: 'auto',            // auto|under|over → '<v> right'（同上）
  prose: true,
  proseScope: 'article',
  hang: true,
  squeeze: true,
  autospace: 'normal',            // normal|insert|replace|strict|off
  heritage: 'webfont',            // webfont|system|off
  heritageSans: 'shanggu',
  heritageSerif: 'shanggu',
  cursive: 'webfont',             // webfont|system|off
  punct: { hant: 'MOE', hans: 'GB', ja: 'JIS', ko: 'KV' },
  zhuyinWebfont: true,
  baseGeneric: 'sans-serif',      // sans-serif|serif — which composite the body rides
  fallbacks: false,
  legacyRuby: false,
  // Request B — ziano webfont delivery only (han.css/diantenjeom keep
  // their existing per-tab delivery: npm on bundler, CDN on cdn).
  zianoDelivery: 'cdn',           // cdn|npm — CDN is ziano's 方法一, slice-on-demand is its point
  zianoCdnSource: 'jsdelivr',     // jsdelivr|unpkg|esmsh
}

/* ── 1 · 變數偏差 ─────────────────────────────────────────── */

const refinement = ({ hang, squeeze }) =>
  hang && squeeze ? 'auto' : hang ? 'hang' : squeeze ? 'compress' : 'none'

/** 只回傳偏離出廠預設的 [prop, value] 對，順序固定。 */
export const cssVars = (c) => {
  const out = []
  if (!c.semantics) out.push(['--han-semantics', 'off'])
  if (c.semantics) {          // 語意細項：layer 關掉即失效，不輸出
    if (c.citeTitleMarks !== 'none') out.push(['--han-cite-title-marks', c.citeTitleMarks])
    if (c.emSymbol !== 'circle') out.push(['--han-em-symbol', c.emSymbol])
    if (c.emPosition !== 'auto') out.push(['--han-em-dot-position', `${c.emPosition} right`])
  }
  if (!c.prose) out.push(['--han-prose', 'off'])
  const refine = refinement(c)
  if (refine !== 'auto') out.push(['--han-punctuation-refinement', refine])
  if (c.autospace !== 'normal')
    out.push(['--han-text-autospace', c.autospace === 'off' ? 'no-autospace' : c.autospace])
  if (c.heritage !== 'webfont') out.push(['--han-use-heritage-glyphs-for-hant', c.heritage])
  if (c.heritage === 'webfont') {
    if (c.heritageSans !== 'shanggu')
      out.push(['--han-webfont-heritage-glyphs-sans', HERITAGE[c.heritageSans].sans.stack])
    if (c.heritageSerif !== 'shanggu')
      out.push(['--han-webfont-heritage-glyphs-serif', HERITAGE[c.heritageSerif].serif.stack])
  }
  if (c.cursive !== 'webfont') out.push(['--han-cursive', c.cursive])
  for (const [key, def] of [['hant', 'MOE'], ['hans', 'GB'], ['ja', 'JIS']])
    if (c.punct[key] !== def) out.push([`--han-punctuation-${key}`, c.punct[key]])
  if (c.punct.ko !== 'KV') out.push(['--han-punctuation-vertical-ko', c.punct.ko])
  if (!c.zhuyinWebfont) out.push(['--han-font-zhuyin-serif', 'cursive, serif'])
  return out
}

/** :root 區塊（含 prose 自訂作用域的附加規則）；無偏差回空字串。 */
const configCSS = (c, indent = '  ') => {
  const vars = cssVars(c)
  const scope = c.proseScope.replace(/[<>{};/]/g, '').trim()
  // baseGeneric：body 騎哪個複合字體——serif 換上 --han-font-alternative；
  // sans-serif（出廠）本就是 --han-font-default，無需輸出。單獨判斷（不進
  // cssVars()）——這不是 --han-* 變數偏差，是 body 本身的 font-family 覆寫。
  const rules = [
    ...(vars.length
      ? [`:root {\n${vars.map(([k, v]) => `${indent}${k}: ${v};`).join('\n')}\n}`]
      : []),
    ...(c.prose && scope && scope !== 'article' ? [`${scope} { --han-prose: on; }`] : []),
    ...(c.baseGeneric === 'serif' ? [`body { font-family: var(--han-font-alternative); }`] : []),
  ]
  return rules.join('\n')
}

/* ── 2 · 套件清單 ─────────────────────────────────────────── */

/** 實際用到的（webfont）套件族：han 恆在；ziano 依家族/楷體；dtj 依標點是否
 *  全關。與 zianoDelivery 無關——那只決定「怎麼送」，這裡只算「要不要」。 */
export const packages = (c) => {
  // serif 家族與 sans 家族重疊的套件不重複列出（兩者常同源，如尚古）。
  const heritagePkgs = c.heritage === 'webfont'
    ? [
        ...HERITAGE[c.heritageSans].sans.pkgs,
        ...HERITAGE[c.heritageSerif].serif.pkgs.filter(
          (p) => !HERITAGE[c.heritageSans].sans.pkgs.includes(p),
        ),
      ]
    : []
  const ziano = [
    ...heritagePkgs,
    ...(c.cursive === 'webfont' ? CURSIVE_PKGS : []),
  ]
  const dtj = Object.values(c.punct).some((v) => v !== 'off')
  return { ziano, dtj }
}

/* ── 2b · CDN 來源（Request B）───────────────────────────────
 * han.css／diantenjeom 恆走 jsdelivr（各方法頁既有行為不變）；只有 ziano
 * webfont 套件的來源可由 zianoCdnSource 切換——鏡射 ziano/demo/src/cdn/cdn.ts
 * 的 ORIGIN 表。 */
const ORIGIN = {
  jsdelivr: 'https://cdn.jsdelivr.net/npm/',
  unpkg: 'https://unpkg.com/',
  esmsh: 'https://esm.sh/',
}

export const zianoUrl = (id, source = 'jsdelivr') =>
  `${ORIGIN[source]}${SCOPE}webfonts-${id}@latest/swap.css`

const preconnectHost = (source) => new URL(ORIGIN[source]).origin

const DTJ_URL = `${CDN}${SCOPE}diantenjeom@latest/dist/diantenjeom.css`
const HAN_CSS_URL = `${CDN}${SCOPE}han.css@latest/dist/han.min.css`
const HAN_AUTO_URL = `${CDN}${SCOPE}han.css@latest/dist/han.auto.min.js`
const HAN_JS_URL = `${CDN}${SCOPE}han.css@latest/dist/han.min.js`

const styleUrls = (c) => {
  const { ziano, dtj } = packages(c)
  return [
    HAN_CSS_URL,
    ...ziano.map((id) => zianoUrl(id, c.zianoCdnSource)),
    ...(dtj ? [DTJ_URL] : []),
  ]
}

// jsdelivr 恆需要（han.css／diantenjeom）；ziano 來源不同時再加一個 preconnect
// （相同時 Set 會去重，維持單一 preconnect 行）。
const preconnectLines = (c) => {
  const { ziano } = packages(c)
  const hosts = new Set(['https://cdn.jsdelivr.net'])
  if (ziano.length) hosts.add(preconnectHost(c.zianoCdnSource))
  return [...hosts].map((h) => `<link rel="preconnect" href="${h}" crossorigin>`)
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
  const npmZiano = c.zianoDelivery === 'npm' ? ziano : []
  const cdnZiano = c.zianoDelivery === 'cdn' ? ziano : []

  const deps = [
    `${SCOPE}han.css`,
    ...npmZiano.map((id) => `${SCOPE}webfonts-${id}`),
    ...(dtj ? [`${SCOPE}diantenjeom`] : []),
  ]
  const bash = { lang: 'bash', code: `${PM[pm]} ${deps.join(' \\\n  ')}` }

  const jsLines = [
    '// main.js',
    `import '${SCOPE}han.css/styles'`,
    ...npmZiano.map((id) => `import '${SCOPE}webfonts-${id}'`),
    ...(dtj ? [`import '${SCOPE}diantenjeom'`] : []),
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

  // zianoDelivery=cdn：ziano 家族不進 install/import，改在這裡出一段 <link>
  // ——它不再走 npm，這段 CDN 引用是唯一的取得方式。
  const htmlLines = cdnZiano.length
    ? [
        `<link rel="preconnect" href="${preconnectHost(c.zianoCdnSource)}" crossorigin>`,
        ...cdnZiano.map((id) => `<link rel="stylesheet" href="${zianoUrl(id, c.zianoCdnSource)}">`),
      ]
    : []
  const html = htmlLines.length ? { lang: 'html', code: htmlLines.join('\n') } : null

  return [bash, js, ...(css ? [css] : []), ...(html ? [html] : [])]
}
