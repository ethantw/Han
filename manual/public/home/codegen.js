/**
 * Playground 配置器 · 純生成核心。
 * config in → string out，零 DOM——單測直跑 node --test。
 * 變數 API 對照 docs/plans/playground-configurator-impl.md 表格。
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

/** 實際用到的套件：han 恆在；ziano 依家族/楷體；dtj 依標點是否全關。 */
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

export const zianoUrl = (id) => `${CDN}${SCOPE}webfonts-${id}@latest/swap.css`
const DTJ_URL = `${CDN}${SCOPE}diantenjeom@latest/dist/diantenjeom.css`
const HAN_CSS_URL = `${CDN}${SCOPE}han.css@latest/dist/han.min.css`
const HAN_AUTO_URL = `${CDN}${SCOPE}han.css@latest/dist/han.auto.min.js`
const HAN_JS_URL = `${CDN}${SCOPE}han.css@latest/dist/han.min.js`

const styleUrls = (c) => {
  const { ziano, dtj } = packages(c)
  return [HAN_CSS_URL, ...ziano.map(zianoUrl), ...(dtj ? [DTJ_URL] : [])]
}

/* ── 3 · 三分頁 ───────────────────────────────────────────── */

export const renderCDN = (c) => {
  const parts = []
  parts.push(
    `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>`,
    ...styleUrls(c).map((u) => `<link rel="stylesheet" href="${u}">`),
  )
  const css = configCSS(c)
  if (css) parts.push(`<style>\n${css}\n</style>`)
  if (c.fallbacks)
    parts.push(`<script type="module" src="${HAN_AUTO_URL}"></script>`)
  if (c.legacyRuby)
    parts.push(
      `<script type="module">\n` +
      `  import { convertLegacyRuby } from '${HAN_JS_URL}'\n` +
      `  convertLegacyRuby(document.body)\n` +
      `</script>`,
    )
  return parts.join('\n')
}

const PM = { npm: 'npm i', pnpm: 'pnpm add', yarn: 'yarn add' }

export const renderBundler = (c, pm = 'pnpm') => {
  const { ziano, dtj } = packages(c)
  const deps = [
    `${SCOPE}han.css`,
    ...ziano.map((id) => `${SCOPE}webfonts-${id}`),
    ...(dtj ? [`${SCOPE}diantenjeom`] : []),
  ]
  const lines = [`${PM[pm]} ${deps.join(' \\\n  ')}`, '']
  lines.push('// main.js')
  lines.push(`import '${SCOPE}han.css/styles'`)
  for (const id of ziano) lines.push(`import '${SCOPE}webfonts-${id}'`)
  if (dtj) lines.push(`import '${SCOPE}diantenjeom'`)
  if (c.fallbacks) lines.push(`import '${SCOPE}han.css/auto'`)
  if (c.legacyRuby)
    lines.push(
      `import { convertLegacyRuby } from '${SCOPE}han.css'`,
      `convertLegacyRuby(document.body)`,
    )
  const css = configCSS(c)
  if (css) lines.push('', '/* styles.css — 放進全域樣式表，勿貼進 main.js */', css)
  return lines.join('\n')
}

// @import 走 node_modules 裸 specifier（vite／postcss 等打包器解析）：
// CDN URL 進 @import 會 render-block，CDN 情境本就該用 <link>（見 CDN 分頁）。
export const renderImport = (c) => {
  const { ziano, dtj } = packages(c)
  const lines = [
    `@import '${SCOPE}han.css/styles';`,
    ...ziano.map((id) => `@import '${SCOPE}webfonts-${id}';`),
    ...(dtj ? [`@import '${SCOPE}diantenjeom';`] : []),
  ]
  const css = configCSS(c)
  if (css) lines.push('', css)
  if (c.fallbacks || c.legacyRuby)
    lines.push('', `/* JS 需另外以 <script type="module"> 引入——@import 帶不動 JS。 */`)
  return lines.join('\n')
}
