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
      const $step = event.target.closest?.('[data-reader]')
      if ($step) return step($dialog, $step.dataset.reader === 'next' ? 1 : -1)
      /* Click on the backdrop closes. The dialog's own box is the sheet, so
         a hit that lands on the dialog element itself — not on anything
         inside it — is a hit on the backdrop. */
      if (event.target === $dialog) $dialog.close()
    })
  })
}
