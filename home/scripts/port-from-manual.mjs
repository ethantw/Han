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
const SECTIONS = ['manifesto', 'station-craft', 'station-playground', 'station-snippet', 'closing']

/* 搬進來的 `home/*.css`。入口裡其餘的 `@import` 會被註解掉。
   前六份是版框與主控台，其後是各站及它們用到的組件：
   ledger（station-craft 的 .FontLedger）、lens（station-playground 的 .LensHint）。 */
const STYLES = [
  'root', 'frame', 'manifesto', 'closing', 'console', 'console-loader',
  'station-craft', 'station-playground', 'station-snippet', 'ledger', 'lens',
]

/* 舊模版裡出現、但這一輪不搬的區塊 token，照原順序留註解。 */
const PARKED = [
  ['stationSemanticsSection', '舊站的 _home.html 目前把這一行拿掉了，是 owner 的實驗，位置照原順序留著'],
  ['stationFontsSection', ''],
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

const shared = pick(readI18n(readFileSync(`${SRC}/home/_shared.html`, 'utf8')))
const render = (name) => {
  const raw = readFileSync(`${SRC}/home/${name}.html`, 'utf8')
  return fill(stripI18n(raw), { ...shared, ...pick(readI18n(raw)) })
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

let html = fill(stripI18n(layoutRaw), ctx)

/* JS 全不搬：module 入口與 pre-paint 還原一併清掉，留下的互動只有兩顆
   checkbox（主題、主控台收合）與空殼 `<han-console>`，兩者本來就是純 CSS。 */
html = html.replace(/[ \t]*<script(?![^>]*type="text\/x-i18n")[\s\S]*?<\/script>\n?/g, '')
/* 入場揭示的**已就位**態直接寫進標記。
   `frame.css` 在 `prefers-reduced-motion: no-preference` 底下給
   `[data-station] > *` 一個 `opacity: 0` 的起始態，只有 `reveal.js` 蓋上
   `data-revealed` 才會落定——所以沒有 JS 的頁面，每一站都是空白的（舊站在
   讀者停用 JS 時亦然）。這一輪不搬 JS，就由標記自己說它已經就位。 */
html = html.replace(/<section\b(?=[^>]*\bdata-station=)/g, '<section data-revealed')

/* CDN 版本本來由 vite 從 `manual/.env` 代入；這裡沒有那條管線，寫死。 */
const CDN = '0.2.0-rc.0'
html = html.replace(/%VITE_ZIANO_VERSION%|%VITE_DIANTENJEOM_VERSION%/g, CDN)

writeFileSync(`${OUT}/index.html`, html)

/* ── CSS ── */
mkdirSync(`${OUT}/public/common`, { recursive: true })
mkdirSync(`${OUT}/public/home`, { recursive: true })
for (const f of readdirSync(`${SRC}/public/common`)) {
  if (f.endsWith('.css')) copyFileSync(`${SRC}/public/common/${f}`, `${OUT}/public/common/${f}`)
}
for (const n of STYLES) copyFileSync(`${SRC}/public/home/${n}.css`, `${OUT}/public/home/${n}.css`)
for (const f of readdirSync(`${SRC}/public/img`)) copyFileSync(`${SRC}/public/img/${f}`, `${OUT}/public/img/${f}`)

/* 入口的匯入順序即層疊順序，所以照抄舊站的那一份，只把沒搬的註解掉。 */
const entry = readFileSync(`${SRC}/public/home.css`, 'utf8')
  .replace(/^@import url\('\.\/home\/(.+?)\.css'\);$/gm, (line, n) =>
    STYLES.includes(n) ? line : `/* ${line} */`)
writeFileSync(`${OUT}/public/home.css`, entry)

const parkedCount = (html.match(/這一輪先不搬/g) ?? []).length
console.log(`index.html ${html.length} bytes・區塊 ${SECTIONS.length} 搬／${parkedCount} 留註解`)
console.log(`CSS home/ ${STYLES.length} 份・殘留 <script> ${(html.match(/<script/g) ?? []).length}`)
