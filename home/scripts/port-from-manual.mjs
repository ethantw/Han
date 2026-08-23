/**
 * 從 `manual/` 搬一層到 `home/`——遷移期間的鷹架，搬完就刪。
 *
 * 為什麼要一支腳本而不是手貼：搬進來的是**展開後**的產物（`{{ token }}`
 * 取 `hant`、i18n 區塊拿掉、`<script>` 全清），手貼一次就等於在兩份檔案之間
 * 開一條沒有人維護的分岔。腳本可以重跑，所以舊站改了什麼，這邊照著再跑一次
 * 就同步——而「搬回一站」也只剩改兩個清單。
 *
 * 用法：`node home/scripts/port-from-manual.mjs`（在倉庫根執行）。
 * 它會覆寫 `home/index.html`、`home/public/home.css`，並補齊 CSS 分部檔。
 */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync } from 'node:fs'

const SRC = 'manual'
const OUT = 'home'
const LOCALE = 'hant'

/* 搬進來的區塊，順序即 `<main>` 的順序。清單以外的都在 HTML 裡留註解佔位。 */
const SECTIONS = ['manifesto', 'station-semantics', 'station-fonts', 'station-craft',
  'station-playground', 'station-snippet', 'closing']

/* 搬進來的 `home/*.css`。入口裡其餘的 `@import` 會被註解掉。
   前六份是版框與主控台，其後是各站及它們用到的組件：
   ledger（station-craft 的 .FontLedger）、lens（station-playground 的 .LensHint）。 */
const STYLES = [
  'root', 'frame', 'manifesto', 'closing', 'console', 'console-loader',
  'station-semantics', 'semantics-specimen', 'envelope', 'gate',
  'station-fonts', 'lead-forme', 'dash-fuse',
  'station-craft', 'station-playground', 'station-snippet', 'ledger', 'lens',
]

/* 舊模版裡出現、但這一輪不搬的區塊 token，照原順序留註解。 */
const PARKED = [
  ['stationLinesSection', ''],
  ['stationProseSection', ''],
]

/* ── i18n：每個模版自帶一塊 `<script type="text/x-i18n">`，內容是物件字面量，
   或是一段以 `return` 收尾的函式體（`_shared.html` 那種）。 ── */
const readI18n = (html) => {
  const block = html.match(/<script type="text\/x-i18n">([\s\S]*?)<\/script>/)
  if (!block) return {}
  const body = block[1].trim()
  return new Function(body.startsWith('{') ? `return (${body})` : body)()
}
const pick = (dict) => Object.fromEntries(
  Object.entries(dict).map(([k, v]) => [k, typeof v === 'string' ? v : (v[LOCALE] ?? v['*'] ?? '')]),
)
const stripI18n = (html) => html.replace(/<script type="text\/x-i18n">[\s\S]*?<\/script>\s*/, '')
const fill = (html, ctx) => html.replace(/\{\{\s*(\w+)\s*\}\}/g, (all, k) => (k in ctx ? ctx[k] : all))

const camel = (name) => name.replace(/-(\w)/g, (_, c) => c.toUpperCase())

/* CDN 版本本來由 vite 從 `manual/.env` 代入；這裡沒有那條管線，寫死。 */
const CDN = '0.2.0-rc.0'


const shared = pick(readI18n(readFileSync(`${SRC}/home/_shared.html`, 'utf8')))
const render = (name) => {
  const raw = readFileSync(`${SRC}/home/${name}.html`, 'utf8')
  const out = fill(stripI18n(raw), { ...shared, ...pick(readI18n(raw)) })
  return out
}

/* ── 版面 ── */
const layoutRaw = readFileSync(`${SRC}/_home.html`, 'utf8')
const ctx = {
  ...shared,
  ...pick(readI18n(layoutRaw)),
  htmlLang: 'zh-Hant',
  locale: LOCALE,
  homeUrl: '/',
  docsUrl: 'https://hanzi.pro/docs/',
  langSwitcher: '<!-- 語言切換要 JS，這一輪不搬 -->',
  ...Object.fromEntries(SECTIONS.map((n) => [`${camel(n)}Section`, render(n)])),
  ...Object.fromEntries(PARKED.map(([token, note]) =>
    [token, `<!-- {{ ${token} }} — 這一輪先不搬${note ? `（${note}）` : ''} -->`])),
}

let html = fill(stripI18n(layoutRaw), ctx).replace(/%VITE_ZIANO_VERSION%|%VITE_DIANTENJEOM_VERSION%/g, CDN)

/* 頁面自己的 JS 全不搬：module 入口與 pre-paint 還原一併清掉，留下的互動只有
   兩顆 checkbox（主題、主控台收合）與空殼 `<han-console>`，兩者本來就是純
   CSS。 */
html = html.replace(/[ \t]*<script(?![^>]*type="text\/x-i18n")[\s\S]*?<\/script>\n?/g, '')

/* 掛回來的腳本只有兩行，而且都不是「頁面的」JS。
 *
 * 一是字體閘門，**放在最前面**。module script 依文件順序執行，排在主控台後面
 * 會先繼承它整張模組圖的網路等待（舊站量過，3G 上是好幾秒），而閘門的節拍器
 * 必須在第一趟描線將盡時醒來才接得上第二趟。它自啟動，也順便把 manifesto 的
 * 漢 水印**建出來**——輪廓是從商標的 `.BrandGlyph` 複製筆畫來的，所以整份
 * HTML 裡那個字形只有一處源頭。沒有它，`.Outline` 就是個空的 span。
 *
 * 配套的是 `<html data-fonts-gate="loading">` 這個 pre-paint 印記：`gate.css`
 * 靠它把正文先設成透明，字體落地才放行。少了印記，閘門會走「沒有典禮」那條
 * 路——水印照建，但不描線、不等字體。所以印記與腳本要嘛一起在，要嘛一起不在。
 *
 * 二是主控台元件：`<han-console>` 連上 DOM 就自己起來（採用 shadow 樣式表 →
 * 注入模板 → 接上 `main` → 發第一次 `han-config-change`）。舊站是在閘門開啟後
 * 才動態 import 它，為的是把它的模組圖挪出開場；這裡順序已經由上面那條保證，
 * 直接靜態載入。
 *
 * 三是 CDN 版本號。`codegen.js` 從 `window.__hanCdn` 讀，缺了會退回
 * `latest`——那會讓引用碼站產出與本頁不一致的版本，所以照舊站補上。
 *
 * **不掛 `han.auto.js`**：回落層由主控台呼叫 `installFallbacks`，讀者的
 * 「JS 後備」開關才算話（`console-config.js` 的 applyFallbacks 就是那條路，
 * 它自己 `import('/han/han.js')`）。auto 版會在元件之外先套一次，兩邊打架。 */
html = html.replace('</head>', [
  '<script>document.documentElement.dataset.fontsGate = \'loading\'</script>',
  '<script type="module" src="/home/fonts-gate.js"></script>',
  `<script>window.__hanCdn = { ziano: '${CDN}', diantenjeom: '${CDN}' }</script>`,
  '<script type="module" src="/components/han-console.js"></script>',
  '<script type="module" src="/home/_boot.js"></script>',
  '</head>',
].join('\n'))
/* 入場揭示的**已就位**態直接寫進標記。
   `frame.css` 在 `prefers-reduced-motion: no-preference` 底下給
   `[data-station] > *` 一個 `opacity: 0` 的起始態，只有 `reveal.js` 蓋上
   `data-revealed` 才會落定——所以沒有 JS 的頁面，每一站都是空白的（舊站在
   讀者停用 JS 時亦然）。這一輪不搬 `reveal.js`，就由標記自己說它已經就位。

   兩種來源都要蓋：站台（`data-station`），以及自己掛了 `data-reveal-at`
   的元件。後者是另一套門檻——站②的鉛字盤就在自己身上等這顆標記，少蓋一種，
   那座字盤畫得出來卻停在 `opacity: 0`（實測 1,847 個節點全在，畫面全白）。 */
html = html.replace(
  /<(\w+)\b(?=[^>]*\b(?:data-station|data-reveal-at)=)/g,
  (all, tag) => `<${tag} data-revealed`,
)


writeFileSync(`${OUT}/index.html`, html)

/* ── CSS ── */
mkdirSync(`${OUT}/public/common`, { recursive: true })
mkdirSync(`${OUT}/public/home`, { recursive: true })
for (const f of readdirSync(`${SRC}/public/common`)) {
  if (f.endsWith('.css')) copyFileSync(`${SRC}/public/common/${f}`, `${OUT}/public/common/${f}`)
}
for (const n of STYLES) copyFileSync(`${SRC}/public/home/${n}.css`, `${OUT}/public/home/${n}.css`)
for (const f of readdirSync(`${SRC}/public/img`)) copyFileSync(`${SRC}/public/img/${f}`, `${OUT}/public/img/${f}`)

/* ── JS：只有主控台元件那一支模組圖 ──
   舊站的 `home/*.js`（reveal、lens、playground…）一支都不搬；這裡搬的是
   `<han-console>` 自己，以及它 import 的東西。回落層走它那條路
   （`console-config.js` 動態 `import('/han/han.js')` 再 `installFallbacks`），
   所以 han.js 也就一起活過來了，而且是讀者的開關說了算。 */
const SCRIPTS = [
  'home/fonts-gate.js',
  'home/snap.js',
  'home/lead-forme.js',
  'home/punct-lang.js',
  'components/han-console.js',
  'components/console-config.js',
  'components/console-metrics.js',
  'components/console.css',
  'components/tokens.css',
  'common/icon.js',
  'home/codegen.js',
]
mkdirSync(`${OUT}/public/components`, { recursive: true })
for (const f of SCRIPTS) copyFileSync(`${SRC}/public/${f}`, `${OUT}/public/${f}`)

/* 主控台的 shadow 模板沒有源檔——`manual/vite.config.js` 由 `home/console.html`
   × 五種語言生出來，只存在於 `manual/dist/`。這裡照抄，並削成只剩繁體：
   118KB → 一種語言，其餘四種本來就沒有入口能選到。 */
const templates = readFileSync(`${SRC}/dist/home/console-templates.js`, 'utf8')
const only = new Function(`${templates.replace('export const TEMPLATES', 'const TEMPLATES')}; return TEMPLATES`)()
writeFileSync(`${OUT}/public/home/console-templates.js`,
  `// 由 home/scripts/port-from-manual.mjs 從 manual/dist/ 搬來，只留 ${LOCALE}。\n`
  + `// 源頭是 manual/vite.config.js 用 home/console.html × HOME_I18N 生的，別手改。\n`
  + `export const TEMPLATES = ${JSON.stringify({ [LOCALE]: only[LOCALE] }, null, 0)}\n`)

/* 入口的匯入順序即層疊順序，所以照抄舊站的那一份，只把沒搬的註解掉。
   最後補一行 `_port.css`——那是遷移期間 home/ 自己維護的規則，這支腳本不
   複製也不覆寫它，排在最後所以永遠壓得過搬進來的那些。 */
const entry = readFileSync(`${SRC}/public/home.css`, 'utf8')
  .replace(/^@import url\('\.\/home\/(.+?)\.css'\);$/gm, (line, n) =>
    STYLES.includes(n) ? line : `/* ${line} */`)
writeFileSync(`${OUT}/public/home.css`, `${entry}\n/* ── 遷移期間 home/ 自己的規則，搬完連同 scripts/ 一起刪 ── */\n@import url('./home/_port.css');\n`)

const parkedCount = (html.match(/這一輪先不搬/g) ?? []).length
console.log(`index.html ${html.length} bytes・區塊 ${SECTIONS.length} 搬／${parkedCount} 留註解`)
console.log(`CSS home/ ${STYLES.length} 份・殘留 <script> ${(html.match(/<script/g) ?? []).length}`)
