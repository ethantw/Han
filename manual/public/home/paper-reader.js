/**
 * paper-reader.js — station①'s four editions, read full-length in a lightbox.
 *
 * The strip carries an ABSTRACT and a jump line («（下轉第七版）», the real
 * newspaper device); the full text lives in a `<dialog class="Full">` beside
 * it. That element is the whole progressive-enhancement story: without this
 * module it is `display: none` until `:target` opens it in place, so the jump
 * line is a working in-page link and the article is readable with no script
 * at all. Here it merely gets promoted — `showModal()` moves the same
 * element to the top layer, so nothing is cloned and nothing is duplicated
 * (the loupe already taught us what a second copy of these four costs).
 *
 * Stepping to another edition brings its card into view behind the reader, so
 * closing leaves the page on the edition you ended on. Where the four fit in
 * one row that is a no-op; only the narrow strip actually scrolls.
 */

/** The editions, in the order they sit in the markup (繁簡日韓). */
const EDITIONS = ['hant', 'hans', 'ja', 'ko']

/* 讀者自己調字級：點一下紙就換一段，14 → 16 → 10 → 14…（px，`--reader-fs`）。
   放大鏡與縮小鏡的游標由 CSS 依 `data-size` 決定，所以這個環的順序也是那兩枚
   游標的順序：14 與 10 是「還能更大」（zoom-in），16 是「該收回去了」
   （zoom-out）。整張紙一起變——報頭的尺寸全是 `em`（station-semantics.css §
   .ReaderSheet）。 */
const SIZES = [14, 16, 10]

const setSize = ($dialog, px) => {
  $dialog.dataset.size = String(px)
  $dialog.style.setProperty('--reader-fs', `${px}px`)
}

const cycleSize = ($dialog) => {
  const at = SIZES.indexOf(Number($dialog.dataset.size))
  setSize($dialog, SIZES[(at + 1) % SIZES.length])
}

/* 開場的捲動位置：文章的**起點**。橫排在左上，直排在右上——直排的紙往左長，
   起點因此在最右邊（燈箱自己是捲動容器）。 */
const toStart = ($dialog) => {
  const vertical = $dialog.dataset.writing === 'vertical'
  $dialog.scrollTo({
    top: 0,
    left: vertical ? $dialog.scrollWidth - $dialog.clientWidth : 0,
    behavior: 'instant',
  })
}

const dialogOf = (key) => document.querySelector(`#paper-${key}-full`)
const paneOf = (key) => document.querySelector(`#paper-${key}`)

const keyOf = ($dialog) => {
  const match = /^paper-(.+)-full$/.exec($dialog.id ?? '')
  return match ? match[1] : null
}

/* Open one edition and leave the page on it. `block: 'nearest'` keeps the page
   still when the card is already on screen — the reader asked for a different
   edition, not for a different scroll position. */
const open = (key, vertical = false, size = SIZES[0]) => {
  const $dialog = dialogOf(key)
  if (!$dialog?.showModal) return
  paneOf(key)?.scrollIntoView({ inline: 'start', block: 'nearest' })
  if (!$dialog.open) $dialog.showModal()
  setSize($dialog, size)
  setWriting($dialog, vertical)
  toStart($dialog)
}

/* 換版。工具條上四語各一顆，所以這裡只是「去那一版」——不再是上一版／下一版的
   環（2026-08-28：箭頭換成四語導覽，讀者要哪一版就按哪一版，不必數幾下）。
   行向與字級跟著讀者走：他把報紙轉直、把字調大，換一版不該把這兩件事忘掉。 */
const goTo = ($dialog, key) => {
  if (!EDITIONS.includes(key) || key === keyOf($dialog)) return
  const vertical = $dialog.dataset.writing === 'vertical'
  const size = Number($dialog.dataset.size) || SIZES[0]
  $dialog.close()
  open(key, vertical, size)
}

/* 直排／橫排。狀態掛在 `<dialog>` 上而不是版心上：兩側的換版鈕與右上的控件
   都要知道現在是哪一種，而它們是對話框的直接子元素。按鈕上寫的是**要切去的
   那一種**，不是現在這一種——一顆按鈕只有一句話的空間，寫「按了會變成什麼」
   比寫「現在是什麼」有用。 */
const setWriting = ($dialog, vertical) => {
  const $button = $dialog.querySelector('[data-reader="writing"]')
  $dialog.dataset.writing = vertical ? 'vertical' : ''
  /* 報頭跟著轉：直排報紙的報頭也是直排的（《朝日新聞》《聯合報》的報標都在
     右上角，其餘沿行內軸往下排）。那一套版式住在共用零件裡，開關是標記上的
     `data-vertical`（home/paper-head.css § 直排）。 */
  const $head = $dialog.querySelector('.PaperHead')
  if ($head) $head.toggleAttribute('data-vertical', vertical)
  if ($button) {
    $button.textContent = vertical ? '橫排' : '直排'
    $button.setAttribute('aria-pressed', String(vertical))
  }
}

const flip = ($dialog) => {
  const vertical = $dialog.dataset.writing !== 'vertical'
  setWriting($dialog, vertical)
  /* 轉向之後捲軸換了一個軸，原本的捲動位置沒有意義——回到文章的起點。 */
  toStart($dialog)
}

export const initPaperReader = () => {
  /* The jump line stays a real link — we only intercept it when we can offer
     something better, and `preventDefault` runs only on that branch, so a
     browser without `<dialog>` still follows the href to `:target`. */
  document.querySelectorAll('.Jump a[href^="#"]').forEach(($a) => {
    $a.addEventListener('click', (event) => {
      const $dialog = document.querySelector($a.getAttribute('href'))
      if (!$dialog?.showModal) return
      event.preventDefault()
      const key = keyOf($dialog)
      if (key) open(key)
    })
  })

  /* 網址帶著 `#paper-*-full` 進來（分享出去的連結、重新整理）時，`:target`
     的無 JS 退路會就地展開那一份全文——有 JS 的時候那看起來就是「彈窗漏餡」，
     半份報紙攤在長帶底下。所以開機先問一次：認得的話就升成燈箱，並把 hash
     從網址上收掉，`:target` 才不再命中（`replaceState`，不留一筆歷史）。 */
  const booted = document.querySelector(`dialog.Full${location.hash || '#none'}`)
  if (booted?.showModal) {
    history.replaceState(null, '', location.pathname + location.search)
    const key = keyOf(booted)
    if (key) open(key)
  }

  document.querySelectorAll('dialog.Full').forEach(($dialog) => {
    $dialog.addEventListener('click', (event) => {
      const $control = event.target.closest?.('[data-reader]')
      if ($control?.dataset.reader === 'writing') return flip($dialog)
      if ($control?.dataset.reader === 'edition') return goTo($dialog, $control.dataset.edition)
      if ($control) return
      /* 點在紙上就換一段字級。拖出來的選取不算——放開滑鼠時瀏覽器照樣送 click，
         若它也換一段，讀者反白到一半整張報紙就跳一次大小（同 lens.js 的作法）。 */
      if (event.target.closest?.('.ReaderSheet')) {
        if (getSelection()?.isCollapsed === false) return
        return cycleSize($dialog)
      }
      /* Click on the backdrop closes. The dialog's own box is the sheet, so
         a hit that lands on the dialog element itself — not on anything
         inside it — is a hit on the backdrop. */
      if (event.target === $dialog) $dialog.close()
    })
  })
}
