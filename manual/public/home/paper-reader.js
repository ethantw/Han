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

const dialogOf = (key) => document.querySelector(`#paper-${key}-full`)
const paneOf = (key) => document.querySelector(`#paper-${key}`)

const keyOf = ($dialog) => {
  const match = /^paper-(.+)-full$/.exec($dialog.id ?? '')
  return match ? match[1] : null
}

/* Open one edition and leave the page on it. `block: 'nearest'` keeps the page
   still when the card is already on screen — the reader asked for a different
   edition, not for a different scroll position. */
const open = (key, vertical = false) => {
  const $dialog = dialogOf(key)
  if (!$dialog?.showModal) return
  paneOf(key)?.scrollIntoView({ inline: 'start', block: 'nearest' })
  if (!$dialog.open) $dialog.showModal()
  setWriting($dialog, vertical)
}

const step = ($dialog, by) => {
  const at = EDITIONS.indexOf(keyOf($dialog))
  if (at < 0) return
  /* 行向跟著讀者走，不跟著文章走：直排讀到一半換一版，換來的還是直排。
     每一版有自己的 `<dialog>`，所以這件事得交手，不會自己過去。 */
  const vertical = $dialog.dataset.writing === 'vertical'
  /* Wrap around: four editions in a ring is what the two arrows imply, and a
     dead arrow on the last one would be the only place on this page where a
     control is present but inert. */
  const next = EDITIONS[(at + by + EDITIONS.length) % EDITIONS.length]
  $dialog.close()
  open(next, vertical)
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
  /* 轉向之後捲軸換了一個軸，原本的捲動位置沒有意義——回到開頭。 */
  $dialog.scrollTo({ top: 0, left: 0 })
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
      if ($control) return step($dialog, $control.dataset.reader === 'next' ? 1 : -1)
      /* Click on the backdrop closes. The dialog's own box is the sheet, so
         a hit that lands on the dialog element itself — not on anything
         inside it — is a hit on the backdrop. */
      if (event.target === $dialog) $dialog.close()
    })
  })
}
