/**
 * specimen.html 的組裝根——控制台的開合、語言三層對齊、直排、深色、生成碼。
 *
 * 模組 `link[data-han-module]` 的 disabled 切換、`:root` 變數落地、JS 後備
 * 的 reapply，全都是 <han-console>（console-config.js）的內建行為，本檔
 * 不重複、也不得重複——雙寫就是漂移的起點。
 */
import '/components/han-console.js'
import { renderCDN } from '/home/codegen.js'
// 首頁站捌同一支高亮器（Highlight API，不動 DOM——碼仍是純文字，複製得到原樣）
import { highlightAll } from '/home/highlight.js'

const CONSOLE_LANG = { 'zh-Hant': 'hant', 'zh-Hans': 'hans', ja: 'ja', ko: 'ko' }

/* 這一份腳本服務兩張樣張。`data-han-ssr` 由生成端掛在 `<html>` 上
 * （vite.config.js § ssrSpecimen），本檔只讀它一處：生成碼的 JS 那一塊。
 * 其餘行為兩頁相同——JS 後備的不跑是 `<han-console no-fallbacks>` 的事，
 * 不在這裡開分支。 */
const SSR = document.documentElement.hasAttribute('data-han-ssr')

/* 伺服器端送法沒有 CDN／模組選項可配（那些是瀏覽器的事），所以是一段定文，
 * 不經 codegen。與本頁的產生方式逐字一致——`installFallbacks()` 吃字串、
 * `html()` 序列化回字串。 */
const SSR_JS = [
  '// 伺服器端：Node（Vercel Functions／建置腳本／任何 SSR 框架）',
  "import { installFallbacks } from '@hanzi.pro/han.css'",
  "import { html } from 'hyperly/fp'",
  '',
  '// source ＝ 這一頁的 HTML 字串；輸出已含 <h-char>／<h-iss>／<h-layer>',
  'const rendered = html(installFallbacks(source))',
].join('\n')

/* 《太陽中文報》永遠是一百年後的報紙——年份現算，別寫死。標記裡留著
 * 上一個算出來的值當無 JS 時的門面。 */
const futureYear = String(new Date().getFullYear() + 100)
document.querySelectorAll('[data-future-year]')
  .forEach(($y) => { $y.textContent = futureYear })

const $select = document.querySelector('#content-lang')
const $console = document.querySelector('han-console')
const $main = document.querySelector('main')
const $tools = document.querySelector('#tools')
const $open = document.querySelector('#tools-open')

/* ── 控制台開合 ──
 * `show()` 而非 `showModal()`：沒有 backdrop、不鎖焦點——撥一個開關就看得
 * 到文字重排，模態會把 playground 的命根子拿掉。代價有二，都自己補：
 * Esc 不會自動關（下面補），以及它**不進 top layer**（那是 showModal()
 * 專有）——所以脫離文流與疊層順序都由 CSS 的 position: fixed ＋ z-index
 * 負責，見 specimen.html § .Tools。 */
const setOpen = (open) => {
  if (open) $tools.show()
  else $tools.close()
  $open.setAttribute('aria-expanded', String(open))
}

$open.addEventListener('click', () => setOpen(!$tools.open))
document.querySelector('#tools-close').addEventListener('click', () => setOpen(false))
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $tools.open) setOpen(false)
})
setOpen(true)

/* ── 語言三層對齊：<html lang>、console UI locale、語言包顯隱 ── */
const applyLang = (lang) => {
  document.documentElement.lang = lang
  $console.setAttribute('lang', CONSOLE_LANG[lang])
  document.querySelectorAll('[data-lang-pack]').forEach(($pack) => {
    $pack.toggleAttribute('hidden', $pack.getAttribute('lang') !== lang)
  })
}

/* 三個語言包在初載時就由 console 的內建安裝一次裝好（target="main"；
 * 12,251 個節點的分塊由 han.js 的 installFallbacks 自理），所以切語言
 * 不必補跑，本檔也沒有任何 JS 後備邏輯——雙寫就是漂移的起點。 */
$select.addEventListener('input', () => applyLang($select.value))

/* ── 示例開關 ──
 * 五顆開關住在 console 的 shadow 裡（`<han-console demo>`），狀態由元件鏡射
 * 成 <html data-demo-*>，畫面幾乎全部交給 CSS。這裡只接三件 CSS 做不到的
 * 事：直排要套真的 writing-mode 與鏡射變數、捲軸要回行首、深色要寫回偏好。
 *
 * 直排**不進 config、不進生成碼**：鏡射變數的落點依標記而定（要寫在自己的
 * 直排容器上，不是無腦 :root），把它做成全域設定會教錯人。這裡是預覽，
 * 落在 main 與 :root 剛好對——因為整頁就是那個直排容器。 */
const applyVertical = (on) => {
  $main.style.writingMode = on ? 'vertical-rl' : ''
  // 凡寫 writing-mode 處鏡射一行——注音的 salt 與 inter-character 讓位都讀它
  document.documentElement.style.setProperty('--han-writing-mode', on ? 'vertical-rl' : 'horizontal-tb')
  /* 捲軸帶回行首：直排 vertical-rl 的起點在**右**邊，沿用原本的位置會落在
   * 文末。等一幀讓重排先算完（實測當場捲會被夾回 0）。 */
  requestAnimationFrame(() => {
    scrollTo({ left: on ? document.documentElement.scrollWidth : 0, top: 0 })
  })
}

addEventListener('han-demo-change', (e) => {
  const { key, on } = e.detail
  if (key === 'vertical') applyVertical(on)
  if (key === 'dark') {
    try {
      localStorage.setItem('theme', on ? 'dark' : 'light')
    } catch { /* 存取被封鎖：本次仍生效，只是不留到下次 */ }
  }
})

/* ── 生成碼 ── */
const $codeHtml = document.querySelector('#code-html')
const $codeJs = document.querySelector('#code-js')
const $codeCss = document.querySelector('#code-css')

addEventListener('han-config-change', (e) => {
  /* 度量鏡射到 `:root`。元件把 `--console-metric-*` 寫在 `body` 上（與生成碼
   * 的 `body { … }` 同層），而繼承只往下走——`:root` 讀不到自己子孫身上的
   * 變數。從 config 取值再寫一份上去，rem 與 em 制的東西（正文行長、標註
   * 字級）才會跟著拖桿走。 */
  const { size, leading, weight } = e.detail.config.metrics
  const $root = document.documentElement
  $root.style.setProperty('--console-metric-size', `${size}px`)
  $root.style.setProperty('--console-metric-leading', String(leading))
  $root.style.setProperty('--console-metric-weight', String(weight))

  /* 度量拖桿只動 CSS，不必重算生成碼以外的東西（JS 後備的 reapply 是
   * console 的內建行為，本檔不插手）。 */
  if (e.detail.source === 'metrics') return

  // 配好就能複製走——renderCDN 是首頁站⑥同一支 codegen，不另寫一份。
  const blocks = renderCDN(e.detail.config)
  const html = blocks.find((b) => b.lang === 'html')?.code ?? ''
  /* HTML 那塊裡混著 `<script>`——它是 JS 的送法，跟 `<link>` 不是同一件事，
     分兩塊貼才不會讓人把整段連 script 一起塞進 <head> 的樣式區。切在行上，
     不動 codegen 的輸出（那支首頁站⑥也在用，改它會牽動兩邊）。 */
  const lines = html.split('\n')
  const js = lines.filter((l) => l.startsWith('<script'))
  $codeHtml.textContent = lines.filter((l) => !l.startsWith('<script')).join('\n')
  /* 關掉 JS 後備時 codegen 一行 script 也不發——那時兩頁都該是空的，
     SSR 頁不例外（伺服器端不跑，就是不跑）。 */
  $codeJs.textContent = js.length === 0 ? '' : SSR ? SSR_JS : js.join('\n')
  $codeCss.textContent = blocks.find((b) => b.lang === 'css')?.code ?? ''
  highlightAll('#codegen pre > code')
})

document.querySelector('#copy-code').addEventListener('click', async (e) => {
  e.preventDefault()   // <summary> 裡的按鈕：別讓點擊順手摺疊 details
  const $btn = e.currentTarget
  const code = [$codeHtml.textContent, $codeJs.textContent, $codeCss.textContent].filter(Boolean).join('\n\n')
  try {
    await navigator.clipboard.writeText(code)
    $btn.textContent = '已複製'
  } catch {
    $btn.textContent = '複製失敗'
  }
  setTimeout(() => { $btn.textContent = '複製' }, 1600)
})
