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
/** 第一次要用的時候才把續版建出來。
 *
 *  四份續版合計 1,943 個節點，佔整頁的 22%，而 `display: none` 並不能讓它們
 *  免費——被隱藏的元素照樣有計算樣式，而這一頁的計算樣式每個節點要 20 KB
 *  （見 docs/notes/2026-08-25-computed-style-memory.md）。`<template>` 的內容
 *  不在文件樹裡，一份樣式都不算。
 *
 *  `append(content)` 是**搬**不是複製，所以模板一次就空了；建完就把空殼移除，
 *  下次 `querySelector` 找不到它，這支函式自然變成 no-op。 */
const hydrate = ($dialog) => {
  const $template = $dialog.querySelector(':scope > template[data-reader-sheet]')
  if (!$template) return
  $dialog.append($template.content)
  $template.remove()
}

const open = (key, vertical = false) => {
  const $dialog = dialogOf(key)
  if (!$dialog?.showModal) return
  hydrate($dialog)
  paneOf(key)?.scrollIntoView({ inline: 'start', block: 'nearest' })
  if (!$dialog.open) $dialog.showModal()
  setWriting($dialog, vertical)
  fitColumns($dialog)
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

/* 直排時的欄數要算，這是 CSS 說不出來的那一句。
 *
 * 多欄的欄沿**行內軸**排，而直排的行內軸是縱的——所以 `block-size` 一封住
 * 每欄的行數，欄就會往下疊，文章沿 Y 延伸（owner call：不要攤成一條往左長
 * 的帶子）。問題在於「要幾欄」：欄數由容器的行內尺寸決定，而直排的行內尺寸
 * 是**高**，一寫 `auto` 就被畫面撐滿、欄數就此封頂，多出來的內容無處可去。
 * `max-content` 也不行，它算的是「不用分欄也放得下」的尺寸，實測給出十七欄。
 *
 * 所以量兩次：先讓它單欄不封行數，看這篇直排起來有多長；再除以一欄的行數，
 * 得到欄數，寫回行內尺寸。開啟、換向、改視窗各算一次，代價是兩次版面。
 */
const fitColumns = ($dialog) => {
  const $sheet = $dialog.querySelector('.ReaderBody')
  const $last = $sheet?.lastElementChild
  if (!$sheet || !$last) return

  $sheet.style.removeProperty('inline-size')
  $sheet.style.removeProperty('column-count')
  if ($dialog.dataset.writing !== 'vertical') return

  const style = getComputedStyle($sheet)
  const column = parseFloat(style.columnWidth)
  const gap = parseFloat(style.columnGap)
  /* 內距在兩種量法裡都各算一次，扣掉才比得準。 */
  const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
  const perColumn = $sheet.getBoundingClientRect().width - padding

  /* 起點：這篇直排起來有多長，除以一欄裝得下多少。量的時候必須明寫行內尺寸
     為一欄的行長，否則它退回 CSS 的 `max-content`，自己又分成好幾欄，量到的
     只是其中一欄。 */
  $sheet.style.columns = 'auto'
  $sheet.style.blockSize = 'auto'
  $sheet.style.inlineSize = `${column}px`
  const natural = $sheet.getBoundingClientRect().width - padding
  $sheet.style.removeProperty('columns')
  $sheet.style.removeProperty('block-size')

  /* 這個起點一定偏小：多欄只在段落邊界斷，每欄都裝不滿，所以「總長÷欄容量」
     系統性地少算，末欄就溢出紙外。所以往上加到裝得下為止——四語的段落長度
     不同，欄數本來就不會一樣（實測繁簡日韓各異）。
     判準是最後一段的行內終點有沒有越過版心：直排的行內軸朝下，越過就是溢出。 */
  let count = Math.max(1, Math.ceil(natural / perColumn))
  for (let guard = 0; guard < 12; guard++) {
    $sheet.style.columnCount = String(count)
    $sheet.style.inlineSize = `${count * (column + gap) - gap}px`
    if ($last.getBoundingClientRect().bottom <= $sheet.getBoundingClientRect().bottom + 1) break
    count += 1
  }
}

/* 直排／橫排。狀態掛在 `<dialog>` 上而不是版心上：兩側的換版鈕與右上的控件
   都要知道現在是哪一種，而它們是對話框的直接子元素。按鈕上寫的是**要切去的
   那一種**，不是現在這一種——一顆按鈕只有一句話的空間，寫「按了會變成什麼」
   比寫「現在是什麼」有用。 */
const setWriting = ($dialog, vertical) => {
  const $button = $dialog.querySelector('[data-reader="writing"]')
  $dialog.dataset.writing = vertical ? 'vertical' : ''
  if ($button) {
    $button.textContent = vertical ? '橫排' : '直排'
    $button.setAttribute('aria-pressed', String(vertical))
  }
}

const flip = ($dialog) => {
  const vertical = $dialog.dataset.writing !== 'vertical'
  setWriting($dialog, vertical)
  fitColumns($dialog)
  /* 轉向之後捲軸換了一個軸，原本的捲動位置沒有意義——回到開頭。 */
  $dialog.scrollTo({ top: 0, left: 0 })
}

export const initPaperReader = () => {
  /* 改視窗會改變每欄的行數上限，欄數得跟著重算。 */
  addEventListener('resize', () => {
    document.querySelectorAll('dialog.Full[open]').forEach(fitColumns)
  }, { passive: true })

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
