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

  /* 拖度量拖桿不必重裝 JS 後備——度量純粹是 CSS，一個 wrapper 都不會變，
   * 而重裝要走一萬兩千個節點，每一格都跑會卡死。 */
  if (e.detail.source === 'metrics') return

  applyFallbacksChunked(e.detail.config)

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
