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
 * Which edition you are on is ONE piece of state, and the pills already own
 * it: stepping to the next edition clicks its pill rather than reaching into
 * the strip, so the strip scrolls, the pill lights, and closing the reader
 * leaves the page on the edition you ended on. No second source of truth.
 */

/** The editions, in the order they sit in the markup (繁簡日韓). */
const EDITIONS = ['hant', 'hans', 'ja', 'ko']

const dialogOf = (key) => document.querySelector(`#paper-${key}-full`)
const pillOf = (key) => document.querySelector(`.PaperPills a[href="#paper-${key}"]`)

const keyOf = ($dialog) => {
  const match = /^paper-(.+)-full$/.exec($dialog.id ?? '')
  return match ? match[1] : null
}

/* Open one edition and leave the page on it. The pill click is what moves the
   strip — see the note above about one piece of state. */
const open = (key) => {
  const $dialog = dialogOf(key)
  if (!$dialog?.showModal) return
  pillOf(key)?.click()
  if (!$dialog.open) $dialog.showModal()
}

const step = ($dialog, by) => {
  const at = EDITIONS.indexOf(keyOf($dialog))
  if (at < 0) return
  /* Wrap around: four editions in a ring is what the two arrows imply, and a
     dead arrow on the last one would be the only place on this page where a
     control is present but inert. */
  const next = EDITIONS[(at + by + EDITIONS.length) % EDITIONS.length]
  $dialog.close()
  open(next)
}

/* 直排／橫排。狀態掛在 `<dialog>` 上而不是版心上：兩側的換版鈕與右上的控件
   都要知道現在是哪一種，而它們是對話框的直接子元素。按鈕上寫的是**要切去的
   那一種**，不是現在這一種——一顆按鈕只有一句話的空間，寫「按了會變成什麼」
   比寫「現在是什麼」有用。 */
const flip = ($dialog, $button) => {
  const vertical = $dialog.dataset.writing !== 'vertical'
  $dialog.dataset.writing = vertical ? 'vertical' : ''
  $button.textContent = vertical ? '橫排' : '直排'
  $button.setAttribute('aria-pressed', String(vertical))
  /* 轉向之後捲軸換了一個軸，原本的捲動位置沒有意義——回到開頭。直排是
     右起，所以「開頭」在行首那端，交給瀏覽器自己算。 */
  $dialog.scrollTo({ top: 0, left: vertical ? $dialog.scrollWidth : 0 })
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

  document.querySelectorAll('dialog.Full').forEach(($dialog) => {
    $dialog.addEventListener('click', (event) => {
      const $control = event.target.closest?.('[data-reader]')
      if ($control?.dataset.reader === 'writing') return flip($dialog, $control)
      if ($control) return step($dialog, $control.dataset.reader === 'next' ? 1 : -1)
      /* Click on the backdrop closes. The dialog's own box is the sheet, so
         a hit that lands on the dialog element itself — not on anything
         inside it — is a hit on the backdrop. */
      if (event.target === $dialog) $dialog.close()
    })
  })
}
