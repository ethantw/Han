/**
 * bare.html 的組裝根——控制台的開合、語言三層對齊、直排、深色、生成碼。
 *
 * 模組 `link[data-han-module]` 的 disabled 切換、`:root` 變數落地、JS 後備
 * 的 reapply，全都是 <han-console>（console-config.js）的內建行為，本檔
 * 不重複、也不得重複——雙寫就是漂移的起點。
 */
import '/components/han-console.js'
import { renderCDN, selectedPasses } from '/home/codegen.js'

const CONSOLE_LANG = { 'zh-Hant': 'hant', ja: 'ja', ko: 'ko' }

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
const $vertical = document.querySelector('#vertical')
const $dark = document.querySelector('#dark')

/* ── 控制台開合 ──
 * `show()` 而非 `showModal()`：沒有 backdrop、不鎖焦點——撥一個開關就看得
 * 到文字重排，模態會把 playground 的命根子拿掉。代價有二，都自己補：
 * Esc 不會自動關（下面補），以及它**不進 top layer**（那是 showModal()
 * 專有）——所以脫離文流與疊層順序都由 CSS 的 position: fixed ＋ z-index
 * 負責，見 bare.html § .Tools。 */
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

/* 三個語言包在初載時就一次裝好（見下方分塊安裝），所以切語言不必補跑。 */
$select.addEventListener('input', () => applyLang($select.value))

/* ── 分塊安裝 JS 後備 ──
 * han.js 的 DOM 走訪是遞迴的，單次呼叫**約 7,500 個節點**就爆
 * `RangeError: Maximum call stack size exceeded`（2026-08-05 實測；與巢狀
 * 深度無關——本頁最深才 10 層，純看節點數）。本頁三個語言包合計 12,251
 * 節點，整包一次裝必爆，所以逐**區塊**安裝：每個語言包的頂層子元素各一次
 * （最大的一塊 3,324 節點，離門檻很遠）。
 *
 * 切在頂層子元素而不是任意切碎，是因為 `markAdjacentLines` 要看兄弟關係——
 * 相鄰的 <u>／<ins> 對必須落在同一次呼叫裡，才不會在切點上漏判。article 與
 * section 的邊界天然不會有跨界的相鄰裝飾線對。
 *
 * console 的內建安裝已由不存在的 `target` 停用（見 bare.html），這裡改用
 * 它的 `selectedPasses`——同一份 PASSES 定義，jsMode／逐支勾選的語意不會
 * 跟 console 漂移。 */
const AUTO_PASSES = ['refinePunctuation', 'applyISSWithProbe', 'markAdjacentLines']
const chunks = () => document.querySelectorAll('[data-lang-pack] > *')

let han = null
const applyFallbacksChunked = async (config) => {
  han ??= await import('/han/han.js')
  han.uninstallFallbacks($main)
  if (!config.fallbacks) return
  const passes = config.jsMode === 'manual'
    ? selectedPasses(config).filter((p) => p.id !== 'uninstall').map((p) => p.fn)
    : AUTO_PASSES
  for (const $chunk of chunks()) {
    for (const fn of passes) han[fn]($chunk)
  }
}

/* ── 直排 ──
 * checkbox 不自己動手——它撥 console 的書寫方向控件、由 console 的單一
 * 管線（cssVars → :root ＋ han-config-change）落地，兩個入口永不漂移；
 * 事件回來時再同步 checkbox 狀態。 */
const setConsoleWritingMode = (mode) => {
  const $ctl = $console.shadowRoot?.querySelector('[data-cfg-key="writingMode"]')
  if (!$ctl || $ctl.value === mode) return
  $ctl.value = mode
  $ctl.dispatchEvent(new Event('input', { bubbles: true }))
}

$vertical.addEventListener('input', () => {
  setConsoleWritingMode($vertical.checked ? 'vertical-rl' : 'horizontal-tb')
})

/* ── 深色 ──
 * 畫面由 CSS 的 :root:has(input[name='dark-mode']:checked) 負責；初值由
 * 控制台裡的 pre-paint script 還原。這裡只寫回偏好（'theme' 鍵與首頁
 * ／手冊共用，跨站帶著走）。 */
$dark.addEventListener('input', () => {
  try {
    localStorage.setItem('theme', $dark.checked ? 'dark' : 'light')
  } catch { /* 存取被封鎖：本次仍生效，只是不留到下次 */ }
})

/* ── 直排狀態同步 ＋ 生成碼 ── */
const $codeHtml = document.querySelector('#code-html')
const $codeCss = document.querySelector('#code-css')

/* 前一次的書寫方向。不能拿 checkbox 的狀態來比——從 checkbox 發動時，
 * 原生點擊早在事件繞一圈回來之前就把它勾好了，比出來永遠是「沒變」。 */
let lastWritingMode = 'horizontal-tb'

addEventListener('han-config-change', (e) => {
  const vertical = e.detail.config.writingMode === 'vertical-rl'
  const changed = e.detail.config.writingMode !== lastWritingMode
  lastWritingMode = e.detail.config.writingMode
  $main.style.writingMode = vertical ? 'vertical-rl' : ''
  $vertical.checked = vertical
  // 切了方向就把捲軸帶回行首：直排 vertical-rl 的起點在**右**邊，沿用
  // 原本的捲動位置會落在文末，看起來像跳到別的地方去了。
  // 必須等分塊安裝跑完再捲：那一輪會改寫上萬個節點，重排會把先捲好的位置
  // 洗掉（實測——當場捲或只等一幀，都會被夾回 0）。
  /* 度量鏡射到 `:root`。元件把 `--console-metric-*` 寫在 `body` 上（與生成碼
   * 的 `body { … }` 同層），而繼承只往下走——`:root` 讀不到自己子孫身上的
   * 變數。從 config 取值再寫一份上去，rem 與 em 制的東西（正文行長、標註
   * 字級）才會跟著拖桿走。 */
  const { size, leading, weight } = e.detail.config.metrics
  const $root = document.documentElement
  $root.style.setProperty('--console-metric-size', `${size}px`)
  $root.style.setProperty('--console-metric-leading', String(leading))
  $root.style.setProperty('--console-metric-weight', String(weight))

  /* 拖度量拖桿不必重裝 JS 後備——度量純粹是 CSS，一個 wrapper 都不會變，
   * 而重裝要走一萬兩千個節點，每一格都跑會卡死。 */
  if (e.detail.source === 'metrics') return

  applyFallbacksChunked(e.detail.config).then(() => {
    if (!changed) return
    scrollTo({ left: vertical ? document.documentElement.scrollWidth : 0, top: 0 })
  })

  // 配好就能複製走——renderCDN 是首頁站⑥同一支 codegen，不另寫一份。
  const blocks = renderCDN(e.detail.config)
  $codeHtml.textContent = blocks.find((b) => b.lang === 'html')?.code ?? ''
  $codeCss.textContent = blocks.find((b) => b.lang === 'css')?.code ?? ''
})

document.querySelector('#copy-code').addEventListener('click', async (e) => {
  e.preventDefault()   // <summary> 裡的按鈕：別讓點擊順手摺疊 details
  const $btn = e.currentTarget
  const code = [$codeHtml.textContent, $codeCss.textContent].filter(Boolean).join('\n\n')
  try {
    await navigator.clipboard.writeText(code)
    $btn.textContent = '已複製'
  } catch {
    $btn.textContent = '複製失敗'
  }
  setTimeout(() => { $btn.textContent = '複製' }, 1600)
})
