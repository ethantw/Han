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
 * 自己寫這十行而不是裝 `sirv`：要送的只有幾份 `.css`，而且路徑寫死在
 * `dist/` 底下一層——多一個相依換不到任何東西。
 */
const serveLibrary = (server) => {
  const dir = path.resolve(here, '../dist')
  server.middlewares.use('/han', (req, res, next) => {
    const name = path.basename(req.url?.split('?')[0] ?? '')
    const file = path.join(dir, name)
    if (!name.endsWith('.css') || !fs.existsSync(file)) return next()
    res.setHeader('Content-Type', 'text/css; charset=utf-8')
    fs.createReadStream(file).pipe(res)
  })
}

const hanLibrary = () => ({
  name: 'han-library',
  configureServer: serveLibrary,
  configurePreviewServer: serveLibrary,
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
  plugins: [hanLibrary()],
  server: {
    port: 7770,
    strictPort: true,
  },
  preview: {
    port: 7770,
    strictPort: true,
  },
})
