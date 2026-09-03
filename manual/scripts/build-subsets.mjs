/**
 * 建首頁專用的字體子集——呼叫 ziano 的 `pagesubset`，產物落在 `manual/.fonts/`。
 *
 * 為什麼產物不進版控：那是別的 repo 的建置輸出，複製進來等於把產物提交，而且
 * 會與 ziano 的字體版本悄悄分岔。`vite.config.js` 有一條 `/subset/*` 的中介層
 * 直接餵這個目錄，跟 `/han/*` 餵倉庫根的 `dist/` 是同一個道理。
 *
 * 字表由 `collect-chars.mjs` 產生（渲染五種語言的首頁，讀回實際排出來的字）。這一支只負責
 * 「字表 → 套件」，而且**要求全覆蓋**：一個字漏了，那個字會變成豆腐塊而不是
 * 退到系統字（ziano 的 `pagesubset` 檔頭說明了為什麼），所以寧可建置失敗。
 *
 * 用法：`node manual/scripts/build-subsets.mjs`（在 han 的根執行，需要 ziano
 * 在隔壁；`ZIANO=../ziano` 可以覆寫）。
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import path from 'node:path'

const ZIANO = process.env.ZIANO ?? '../ziano'
const OUT = path.resolve('manual/.fonts')

/* 每一族一行：從哪個 ziano 套件切、字表在哪、產出的 CSS 字族叫什麼。
 *
 * 字族名刻意都掛 `Han Home`：它同時是 CSS 的 `font-family` 與寫進字體名表的
 * 名字，而**不能**與 ziano 已發布的任何字族同名——同名的兩組 `@font-face`
 * 會合併成一族，每一種點名它的字體描述都要把子集與完整套件一起列進去，省的
 * 全還回去（ziano `pagesubset` 會擋下來）。 */
const SUBSETS = [
  { base: 'shanggu-serif', family: 'Han Home Serif', zh: '首頁明體' },
  { base: 'shanggu-sans', family: 'Han Home Sans', zh: '首頁黑體' },
  { base: 'genki-serif-yue', family: 'Han Home Genki Serif', zh: '首頁源起明體' },
  { base: 'genki-sans-yue', family: 'Han Home Genki Sans', zh: '首頁源起黑體' },
  { base: 'lxgw-wenkai-tc', family: 'Han Home Kai', zh: '首頁楷體' },
]

const ID_SUFFIX = 'han-home'

if (!existsSync(ZIANO)) {
  console.error(`找不到 ziano（${ZIANO}）。設 ZIANO=<path> 指給它。`)
  process.exit(1)
}
mkdirSync(OUT, { recursive: true })

for (const { base, family, zh } of SUBSETS) {
  const chars = path.resolve(`manual/chars/${base}.txt`)
  if (!existsSync(chars)) {
    console.error(`缺字表 ${chars}——先跑 node manual/scripts/collect-chars.mjs`)
    process.exit(1)
  }
  const out = execFileSync('uv', [
    'run', 'python', '-m', 'ziano.pagesubset', base,
    '--chars', chars,
    '--family', family,
    '--family-zh', zh,
    '--id-suffix', ID_SUFFIX,
    '--slices', '1',
    '--dest', OUT,
    '--version', '0.0.0-han-home',
    '--require-full-coverage',
  ], { cwd: ZIANO, encoding: 'utf8' })
  process.stdout.write(out)
}

/* 建完就同步到 `manual/public/subset/`。
 *
 * 那個目錄是這裡的**副本**（`vite.config.js` § syncSubsets），而同步只在開發
 * 伺服器啟動時跑一次：伺服器開著的時候重建子集，瀏覽器拿到的還是舊字體檔——
 * CSS 是新的、`unicode-range` 也是新的，就只有字形沒跟上，於是新加的字安靜地
 * 掉到系統字。那正是 2026-08-28 的「報頭字體不對」：字表對、`--check` 也過，
 * 錯的是沒人重新複製。既然這裡知道自己剛剛動了什麼，就由這裡收尾。 */
const PUBLIC_SUBSET = path.resolve('manual/public/subset')

for (const { base } of SUBSETS) {
  const id = `${base}-${ID_SUFFIX}`
  const from = path.join(OUT, id)
  const to = path.join(PUBLIC_SUBSET, id)
  if (!existsSync(from)) continue
  mkdirSync(path.join(to, 'files'), { recursive: true })
  copyFileSync(path.join(from, 'swap.css'), path.join(to, 'swap.css'))
  for (const f of readdirSync(path.join(from, 'files'))) {
    copyFileSync(path.join(from, 'files', f), path.join(to, 'files', f))
  }
}
console.log(`同步到 ${PUBLIC_SUBSET}（開發伺服器開著也吃得到）`)
