import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { defineConfig } from 'vite'

const here = path.dirname(fileURLToPath(import.meta.url))

/**
 * `/han/*` 直接餵倉庫根的 `dist/`——樣式庫自己的建置產物。
 *
 * 不複製一份進 `public/`：那是 `node build/library` 產的東西，複製等於把
 * 產物提交進版本控制，而且會在改了樣式庫之後悄悄過期。首頁是這個庫的樣張，
 * 讀的就該是當下那一份。
 *
 * 自己寫這十幾行而不是裝 `sirv`：要送的就是 `dist/` 底下平坦的一層，
 * `path.basename` 一刀切掉任何路徑穿越——多一個相依換不到什麼。
 */
const TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
}

const serveLibrary = (server) => {
  const dir = path.resolve(here, '../dist')
  server.middlewares.use('/han', (req, res, next) => {
    const name = path.basename(req.url?.split('?')[0] ?? '')
    const type = TYPES[path.extname(name)]
    const file = path.join(dir, name)
    if (!type || !fs.existsSync(file)) return next()
    res.setHeader('Content-Type', type)
    fs.createReadStream(file).pipe(res)
  })
}

/**
 * `/subset/*` — 首頁專用的字體子集，直接從 `home/.fonts/` 送。
 *
 * 理由同 `/han/*`：那是 `home/scripts/build-subsets.mjs` 叫 ziano 產的東西，
 * 複製進 `public/` 等於把別的 repo 的建置產物提交進版本控制，而且會與 ziano
 * 的字體版本悄悄分岔。路徑是 `<id>/<file>`，兩段都用 `path.basename` 切掉任何
 * 穿越，副檔名走同一張白名單（`.css` 與 `.woff2` 都在裡面）。
 */
const serveSubsets = (server) => {
  const dir = path.resolve(here, '.fonts')
  server.middlewares.use('/subset', (req, res, next) => {
    const parts = (req.url?.split('?')[0] ?? '').split('/').filter(Boolean)
    if (parts.length < 2) return next()
    const name = path.basename(parts.at(-1))
    const pkg = path.basename(parts[0])
    const type = TYPES[path.extname(name)]
    /* 套件裡的 woff2 住在 `files/` 底下，CSS 在根；兩層都只有這兩種形狀。 */
    const file = parts.length > 2
      ? path.join(dir, pkg, 'files', name)
      : path.join(dir, pkg, name)
    if (!type || !fs.existsSync(file)) return next()
    res.setHeader('Content-Type', type)
    fs.createReadStream(file).pipe(res)
  })
}

const subsets = () => ({
  name: 'han-font-subsets',
  configureServer: serveSubsets,
  configurePreviewServer: serveSubsets,
})

const hanLibrary = () => ({
  name: 'han-library',
  configureServer: serveLibrary,
  configurePreviewServer: serveLibrary,
})

/**
 * `/vendor/*` — 遊樂場要的兩個第三方模組，直接從 `node_modules` 送。
 *
 * 不複製進 `public/`，理由同 `/han/*`：那是別人的建置產物，複製等於把它提交
 * 進版本控制，而且會與 `package.json` 裡寫的版本悄悄分岔。名字是白名單，
 * 所以 `/vendor/` 底下不會意外暴露整個 `node_modules`。
 */
const VENDOR = {
  'marked.esm.js': 'marked/lib/marked.esm.js',
  'purify.esm.js': 'dompurify/dist/purify.es.mjs',
}

const serveVendor = (server) => {
  server.middlewares.use('/vendor', (req, res, next) => {
    const name = path.basename(req.url?.split('?')[0] ?? '')
    const rel = VENDOR[name]
    const file = rel && path.resolve(here, 'node_modules', rel)
    if (!file || !fs.existsSync(file)) return next()
    res.setHeader('Content-Type', TYPES['.js'])
    fs.createReadStream(file).pipe(res)
  })
}

const vendor = () => ({
  name: 'han-vendor',
  configureServer: serveVendor,
  configurePreviewServer: serveVendor,
})

/**
 * han.css 首頁——重寫版的開發設定。
 *
 * 這一份刻意只有幾十行。`manual/vite.config.js` 有一千五百行，因為它同時是
 * Markdown 管線、五語 i18n 渲染器、SSR 樣張產生器與資產雜湊器；首頁不需要
 * 其中任何一項。`index.html` 是一份寫死的靜態檔（由舊模版展開而來，繁體
 * 一種語言），CSS 是 `public/` 底下用原生 `@import` 串起來的分部檔，所以
 * dev 與 build 走同一條解析路徑，沒有第二套真相。
 *
 * `public/` 原樣複製，所以 `/home.css`、`/img/*` 的路徑與舊站一致——樣式檔
 * 搬過來不必改一個字。
 */
export default defineConfig({
  plugins: [hanLibrary(), subsets(), vendor()],
  server: {
    port: 7770,
    strictPort: true,
  },
  preview: {
    port: 7770,
    strictPort: true,
  },
})
