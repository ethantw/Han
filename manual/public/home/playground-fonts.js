/**
 * 遊樂場：讀者打出子集沒有的字，就把那一子樹換回完整的切片套件。
 *
 * 這一頁的字族槽位指的是首頁專用子集（`home/subset-fonts.css`），而子集只裝這一頁自己
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
 * 子集的樣式表與頁面同源（`/subset/*`），所以 `cssRules` 讀得到。子集沒建的
 * 頁面（`<html>` 沒有 `data-han-subset`）根本沒有那三族，`subsetCoverage()`
 * 收到的是三個空集合，於是一開場就判成缺字——所以那種頁面直接不裝。
 */
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

export const initPlaygroundFonts = () => {
  if (!document.documentElement.hasAttribute('data-han-subset')) return
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
