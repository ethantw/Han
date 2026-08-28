/**
 * dash-clip.js — publishes station②'s 破折號 column and copy anchors.
 *
 * The column is deliberately not clipped: it paints below the lead forme, so
 * the type itself hides the opening glyph. This module only measures anchors
 * that CSS cannot relate across the forme, the vertical sentence and sticky
 * copy: the column's left edge, the first dash, 交換 and 體量. The same
 * anchors drive the DTJ specimen sequence without reading layout on scroll.
 *
 * It goes through `measure.js` rather than measuring in the observer callback,
 * and that is not a nicety: reading a rect straight from a `ResizeObserver`
 * forces a synchronous layout, and this column is the single most expensive box
 * on the page to lay out. Collapsing the console (which animates the plate's
 * width) fired it once per frame — 10 calls, 149ms, worst 93ms of the toggle's
 * 361ms (2026-08-27 trace). `settled` gives it the module's three disciplines
 * for free: 放手才算, 看不到不算, 先讀再寫.
 */

import { onRendered, settled } from './measure.js'

/** Align station②'s dash column and publish its sticky-copy timeline. */
export const initDashClip = ($root = document) => {
  const $col = $root.querySelector('.DashColumn')
  const $problem = $root.querySelector('.DashNote')
  const $noteStage = $problem?.closest('.DashNoteStage')
  const $noteEnd = $col?.querySelector('.DashNoteEnd')
  const $copy = $root.querySelector('.TwoEmDashes')
  const $specimenStage = $root.querySelector('[data-dash-specimens]')
  const specimenCards = [...($specimenStage?.querySelectorAll('[data-specimen]') ?? [])]
  const $punctLang = $root.querySelector('.PunctLang')
  const $forme = $root.querySelector('#station-fonts .LeadForme svg')
  const $page = $col?.closest('main')
  if (!$col || !$problem || !$copy || !$forme) return

  let specimenStart = 0
  let specimenEnd = 0
  let specimenFrame = 0
  let specimenOffsets = []

  const paintSpecimens = () => {
    specimenFrame = 0
    if (!$specimenStage || specimenEnd <= specimenStart) return

    const progress = (scrollY - specimenStart) / (specimenEnd - specimenStart)
    /* The measured timeline owns both edges. Keeping the final card alive past
       its endpoint made the flow linger over the following punctuation rail. */
    const active = progress >= -.002 && progress <= 1.002
    if (active) $specimenStage.dataset.active = ''
    else delete $specimenStage.dataset.active

    const clamped = Math.max(0, Math.min(1, progress))
    const cardProgress = clamped * Math.max(0, specimenCards.length - 1)
    const before = Math.floor(cardProgress)
    const after = Math.min(before + 1, specimenCards.length - 1)
    const fraction = cardProgress - before
    const offset = specimenOffsets[before]
      + (specimenOffsets[after] - specimenOffsets[before]) * fraction
    const center = Math.round(cardProgress)
    $specimenStage.style.setProperty('--dtj-progress', String(clamped))
    if (Number.isFinite(offset)) {
      $specimenStage.style.setProperty('--dtj-offset', `${offset}px`)
    }
    specimenCards.forEach(($card, index) => {
      if (active && index === center) $card.dataset.center = ''
      else delete $card.dataset.center
    })
  }

  const queueSpecimenPaint = () => {
    if (!$specimenStage || specimenFrame) return
    specimenFrame = requestAnimationFrame(paintSpecimens)
  }

  const measureSpecimenTimeline = () => {
    if (!$specimenStage || !$noteStage || !$punctLang) return
    const note = $noteStage.getBoundingClientRect()
    const punctuation = $punctLang.getBoundingClientRect()
    const coverBlockSize = Math.max(0, ...specimenCards.map(($card) => $card.offsetHeight))
    /* Start exactly when the copy reaches its CSS sticky inset (30vh).
       Finish one rendered cover before the next rail reaches the viewport,
       leaving a measured hand-off gap instead of an arbitrary scroll delay. */
    specimenStart = scrollY + note.top - innerHeight * .3
    specimenEnd = scrollY + punctuation.top - innerHeight - coverBlockSize
    /* Cards 4–6 are deliberately double width.  Equal-width arithmetic would
       centre their left half and progressively drift every later card.  Read
       each rendered centre once per settled layout, then interpolate between
       those real centres during scrolling (the scroll handler remains read-free). */
    specimenOffsets = specimenCards.map(($card) => $card.offsetLeft + $card.offsetWidth / 2)
    paintSpecimens()
  }

  /* Both ends move for their own reasons: the forme reflows with the viewport,
     and the column's top follows its own font-size (a `vw` clamp). Watching the
     station covers the forme between them growing or shrinking as well. */
  const $station = $col.closest('[data-station]') ?? $forme

  /* 柱的**橫向**也照算：左緣對齊版框的左緣（＝ SVG 盒的左緣），柱就站在左下那塊
     空氣的最左邊。`.TwoEmDashes` 與 `.LeadForme` 都是站台的子元素，但 figure 自己
     還有一圈 `--lf-air` 的內距，所以兩者的行首差幾個像素——量一次比猜一次準。 */
  const sync = settled({
    watch: $station,
    read: () => {
      const col = $col.getBoundingClientRect()
      const copy = $copy.getBoundingClientRect()
      const page = $page?.getBoundingClientRect()
      const forme = $forme.getBoundingClientRect()
      const noteEnd = $noteEnd?.getBoundingClientRect()
      const offsetLeft = $col.offsetParent?.getBoundingClientRect().left ?? col.left
      const geometry = getComputedStyle($forme.closest('.LeadForme'))
      return {
        formeLeft: forme.left - offsetLeft,
        formeTop: forme.top - copy.top,
        formeWidth: forme.width,
        pageLeft: (page?.left ?? 0) - offsetLeft,
        columnAnchor: Number.parseFloat(geometry.getPropertyValue('--lf-column-anchor')) || 0,
        columnStart: Number.parseFloat(geometry.getPropertyValue('--lf-column-start')) || 0,
        problemSize: $problem.getBoundingClientRect().height,
        noteEnd: noteEnd ? noteEnd.top + noteEnd.height / 2 - copy.top : null,
      }
    },
    write: ({ formeLeft, formeTop, formeWidth, pageLeft, columnAnchor, columnStart, problemSize, noteEnd }) => {
      /* 橫向那個數寫在**包含塊**上，不寫在柱上：柱讀得到（自訂屬性會繼承），而
         那一格自己也要用它——文案的欄從柱的右緣起算（dash-fuse.css §
         .TwoEmDashes 的 `padding-inline-start`）。 */
      const $owner = $col.offsetParent ?? $col
      $owner.style.setProperty('--df-forme-left', `${formeLeft}px`)
      $owner.style.setProperty('--df-forme-top', `${formeTop}px`)
      $owner.style.setProperty('--df-forme-width', `${formeWidth}px`)
      $owner.style.setProperty('--df-page-left', `${pageLeft}px`)
      $owner.style.setProperty('--df-column-anchor', String(columnAnchor))
      $owner.style.setProperty('--df-column-start', String(columnStart))
      $copy.style.setProperty('--df-problem-size', `${Math.round(problemSize)}px`)
      if (noteEnd != null) $copy.style.setProperty('--df-note-end', `${noteEnd}px`)
      $copy.dataset.dashMeasured = ''
      requestAnimationFrame(measureSpecimenTimeline)
    },
  })

  const watch = new ResizeObserver(sync)
  watch.observe($station)
  watch.observe($forme)
  /* …and the plate, because what actually moves is a POSITION, not a size.
     Collapsing the console re-centres the plate: the station's content box and
     the card both keep their 1087px, the station keeps its height — and yet
     `.TwoEmDashes` (the column's containing block) slid 81px up the page, so its
     anchors were stale with nothing in the observed boxes to say so. `main` is
     the nearest box whose SIZE says "the page's geometry changed" (1160 →
     1440), which is exactly the trigger this needs. */
  const $plate = $page
  if ($plate) watch.observe($plate)
  /* 鉛字是 **transform** 落下的（lead-forme.css § lf-drop），而 ResizeObserver
     看不到 transform。三個補算的時機
     一起掛上，`settled` 會把它們併成一次：鉛字落地（動畫結束，每顆各自送）、
     讀者停手（`scrollend`，Baseline 2024——落下正是捲到它時才開始的），以及停手
     之後一秒（整盤四十幾顆，最後一顆落得比 `scrollend` 晚）。 */
  $forme.addEventListener('animationend', sync)
  $forme.addEventListener('transitionend', sync)
  addEventListener('scrollend', () => {
    sync()
    setTimeout(sync, 1000)
  }, { passive: true })
  addEventListener('scroll', queueSpecimenPaint, { passive: true })

  /* 站台被 `content-visibility` 跳過時量到的是佔位尺寸，推回畫面要補算一次。 */
  onRendered($station, sync)
  sync()
}
