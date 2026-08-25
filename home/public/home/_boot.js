/**
 * home/ 自己的啟動點——`scripts/port-from-manual.mjs` **不覆寫這一份**，
 * 其餘 `home/*.js` 每次搬運都是從 `manual/` 整份複製過來的。
 *
 * 舊站的 `home.js` 一次點名十幾個模組，那張清單連同它的啟動時序（字體閘門
 * 開了才動態 import 主控台之類）都還沒搬。這裡只放「已經搬進來、而且需要有
 * 人呼叫一次」的模組：自啟動的（`fonts-gate.js`）與自己註冊的（元件）都不
 * 經過這裡。搬完之後這一份跟著搬運腳本一起刪，換成真正的入口。
 */
import { initSettle } from './settle.js'
import { initModuleState } from './module-state.js'
import { initBreath } from './breath.js'
import { initLens } from './lens.js'
import { initLeadForme } from './lead-forme.js'
import { initPunctLang } from './punct-lang.js'
import { initPaperReader } from './paper-reader.js'
import { initStripNav } from './strip-nav.js'
import { initPlayground } from './playground.js'

/* 入場動畫演完就退場：`fill: both` 的動畫結束後仍持有合成層，而疊在上面的
   站台會被連帶提升（實測合成層 35 → 14）。掛在最前面，才收得到最早演完的。 */
initSettle()

/* 站台裡的模組開關是主控台對應開關的代理，狀態的唯一真相在主控台。四站都有
   （語意、行的調整、散文、遊樂場），少了它那些開關撥了沒反應。 */
initModuleState()

/* 站③的呼吸：捲到才播，離開就停。 */
initBreath()

/* 放大鏡。四份報紙、散文、遊樂場的樣張都掛了 `data-lens`，`.LensHint` 那句
   「雙擊樣張開關放大鏡」在它沒搬進來之前是句空話。 */
initLens()

/* 站②的鉛字盤：整座等角字盤是這一支建出來的，沒有它那個 figure 是空的。 */
initLeadForme()

/* 站②的標點語言示範：四顆 <select> 是主控台對應控件的遙控器，狀態的唯一
   真相在主控台，這一支只做雙向鏡射。 */
initPunctLang()

/* 站①的四語全文閱讀器：把接排線升級成 lightbox。沒有它，那條連結仍然靠
   `:target` 原地展開全文——這一支只是讓它更好讀。 */
initPaperReader()

/* 四語長帶的左右箭頭：一按捲三分之一個可視段，到底就 disabled。 */
initStripNav()

/* 站⑤的遊樂場。預覽每次重繪都是一棵新子樹，han.js 的包裹得重跑，
   `*.with-js.css` 才有東西可選——走主控台的 `reapplyFallbacks` 而不是直接
   叫 `installFallbacks`，讀者的「JS 後備」開關才算話。 */
initPlayground(($target) => document.querySelector('han-console')?.reapplyFallbacks($target))

/* ── 遊樂場：打出子集沒有的字，就換回完整的切片套件 ──────────────
 *
 * 這一頁的字族槽位指的是首頁專用子集（`_port.css`），而子集只裝這一頁自己
 * 排得出來的字——包含遊樂場的**預設稿**，因為那也是載入時就會排的東西。
 * 讀者打進來的是 UGC，字表管不到：子集的 `unicode-range` 是照它真有的字碼
 * 修過的，所以缺字會**落到堆疊下一位**（系統字），不是豆腐塊——但系統字正是
 * 這個專案不想給讀者看的字形。
 *
 * 所以缺字就把那一子樹的槽位換回 ziano 的完整切片。切片的 `@font-face` 本來
 * 就宣告在頁面上（宣告幾乎不花錢：實測 229 條 ＋5 MB，而且完全不下載也是
 * 同一個數字），貴的是**被字族串點名**——所以「換名字」就是這裡要做的全部，
 * 不必動態插入樣式表。切回去之後那一子樹的描述會開始列 109 片，只有真的在
 * 編輯的讀者付這筆帳。
 *
 * 覆蓋率要問**字體自己宣告的 `unicode-range`**，不要問
 * `document.fonts.check()`：那支 API 回答的是「這段文字要不要等某個 webfont
 * 載完」，不是「這個字體有沒有這個字」——子集載好之後它對任何字都回 true
 * （實測「鑫」回 true，而子集裡沒有它）。而 `unicode-range` 正是瀏覽器用來
 * 決定回退的那份清單，也是 ziano 照字體真實 cmap 修過的，所以它就是答案。
 *
 * 子集的樣式表與頁面同源（`/subset/*`），所以 `cssRules` 讀得到。 */
const SUBSET_FAMILIES = ['Han Home Serif', 'Han Home Sans', 'Han Home Kai']

const isHan = (cp) =>
  (cp >= 0x3400 && cp <= 0x9fff) || (cp >= 0xf900 && cp <= 0xfaff) || cp >= 0x20000

/** 逐族的碼位集合，從各自 `@font-face` 的 `unicode-range` 解析出來。 */
const subsetCoverage = () => {
  const covered = new Map(SUBSET_FAMILIES.map((family) => [family, new Set()]))
  for (const sheet of document.styleSheets) {
    let rules
    try {
      rules = sheet.cssRules
    } catch {
      continue // 跨來源的樣式表讀不到，那些不是我們的子集
    }
    for (const rule of rules) {
      if (!(rule instanceof CSSFontFaceRule)) continue
      const family = rule.style.fontFamily.replace(/["']/g, '')
      const set = covered.get(family)
      if (!set) continue
      for (const part of (rule.style.unicodeRange || '').split(',')) {
        const token = part.trim().replace(/^U\+/i, '')
        if (!token) continue
        const [lo, hi] = token.includes('-')
          ? token.split('-').map((t) => Number.parseInt(t, 16))
          : [Number.parseInt(token.replace(/\?/g, '0'), 16),
             Number.parseInt(token.replace(/\?/g, 'F'), 16)]
        for (let cp = lo; cp <= hi; cp++) set.add(cp)
      }
    }
  }
  return covered
}

/** 逐元素、各查自己的堆疊——不是拿根元素的堆疊去查整棵子樹。
 *
 *  兩個理由：字要用哪一份子集，看的是**排它的那個元素**的字族串（預覽裡的
 *  大標與正文不是同一族）；而三份子集的字表大小差很多（明體 1,100 字、楷體
 *  171 字，因為楷體只服務三體樣張那一小塊），拿錯的那一份去問，預設稿在載入
 *  當下就會被判成缺字。 */
const outsideSubset = (covered, $root) => {
  const missing = ($el) => {
    const stack = getComputedStyle($el).fontFamily
    const families = SUBSET_FAMILIES.filter((family) => stack.includes(family))
    if (!families.length) return false
    for (const node of $el.childNodes) {
      if (node.nodeType !== 3) continue
      for (const ch of node.data) {
        const cp = ch.codePointAt(0)
        if (!isHan(cp)) continue
        if (!families.some((family) => covered.get(family)?.has(cp))) return true
      }
    }
    return false
  }
  if (missing($root)) return true
  for (const $el of $root.querySelectorAll('*')) if (missing($el)) return true
  return false
}

const watchPlaygroundCoverage = () => {
  const $station = document.querySelector('#station-playground')
  const $preview = $station?.querySelector('[data-pg-preview]')
  if (!$station || !$preview) return

  const covered = subsetCoverage()
  const check = () => {
    if ($station.dataset.pgFonts === 'ziano') return // 一去不回，換回來沒有意義
    if (outsideSubset(covered, $preview)) {
      $station.dataset.pgFonts = 'ziano'
    }
  }
  /* 預覽每次重繪都是一棵新子樹，所以看 childList／characterData，不是 input
     ——`initPlayground` 的重繪是非同步的，input 當下讀到的還是舊內容。 */
  new MutationObserver(check).observe($preview, {
    childList: true, subtree: true, characterData: true,
  })
  check()
}
watchPlaygroundCoverage()
