/**
 * Snap strips — a row of panes that scrolls one pane at a time, with a group
 * of pills that says which one you are on and takes you to another.
 *
 * The scrolling and the snapping are CSS; this only keeps the two halves
 * honest: a pill click scrolls the strip, and scrolling the strip lights the
 * pill. Station①'s four editions use it (`data-snap-pills="papers"` beside
 * `data-snap-strip="papers"`).
 *
 * No-JS degrades to what the markup already is: the pills are real in-page
 * links, so they jump to their pane, and the strip still scrolls and snaps.
 */

/** The pane a pill points at — same document, and the id is in the href. */
const paneOf = ($strip, $pill) =>
  $strip.querySelector(`:scope > ${CSS.escape('#')}${CSS.escape($pill.hash.slice(1))}`)
  || $strip.querySelector(`:scope > [id="${$pill.hash.slice(1)}"]`)

const mount = ($pills) => {
  const name = $pills.dataset.snapPills
  const $strip = document.querySelector(`[data-snap-strip="${name}"]`)
  if (!$strip) return

  const links = [...$pills.querySelectorAll('a[href^="#"]')]
  const panes = new Map(links.map(($a) => [paneOf($strip, $a), $a]).filter(([$p]) => $p))
  if (!panes.size) return

  /* Scroll rather than jump: following the link would move the page to the
     pane's top as well — the reader asked for a different edition, not for a
     different scroll position.

     And scroll the STRIP by hand rather than via `scrollIntoView`. `block:
     'nearest'` is only a no-op while the pane already fits the viewport; a
     full edition is taller than one screen, so `nearest` still had to scroll
     the page to bring it into view (measured: the page moved 120px on the
     first pill press). Nudging the strip's own scroll offset touches one
     axis of one box, which is the whole ask.

     And an ABSOLUTE target, not a relative nudge. `scrollBy` adds a measured
     difference to wherever the strip happens to be — and while a smooth
     scroll or a mandatory-snap settle is still in flight, that is a moving
     target, so the sum overshoots and the strip lands a pane too far. It is
     intermittent by nature: it needs a press to arrive during motion. Reading
     the offset and the current position in the SAME instant and scrolling to
     their sum is immune, because whatever the animation has done so far is
     already inside both terms.

     The reference edge is the SNAPPORT's, not the box's: a strip that bleeds
     past the plate's gutter carries a `scroll-padding` so every pane still
     stops on the text column's line, and that inset is exactly what the box
     edge doesn't know about. Leaving it out is off by one gutter — mandatory
     snapping happens to absorb an error that small, which is luck, not
     correctness: widen the gutter or narrow the panes and it lands a pane
     over.

     `scrollTo` takes physical axes, so read the strip's own writing mode:
     in 直排 the strip's inline axis IS the block axis of the screen. */
  const inlineTarget = ($pane) => {
    const style = getComputedStyle($strip)
    const strip = $strip.getBoundingClientRect()
    const pane = $pane.getBoundingClientRect()
    const inset = (value) => parseFloat(value) || 0    /* `auto` ⇒ 0 */
    return style.writingMode.startsWith('vertical')
      ? { top: $strip.scrollTop + (pane.top - strip.top) - inset(style.scrollPaddingTop) }
      : { left: $strip.scrollLeft + (pane.left - strip.left) - inset(style.scrollPaddingLeft) }
  }

  for (const [$pane, $a] of panes) {
    $a.addEventListener('click', (e) => {
      e.preventDefault()
      /* 先點亮，再捲。燈是「你按的是這一顆」的回覆，不該等平滑捲動走完才
         亮；捲完之後觀察器會自己再算一次，結論相同。 */
      light($pane)
      $strip.scrollTo({ ...inlineTarget($pane), behavior: 'smooth' })
    })
  }

  /* Which pane is showing is the strip's own business, so read it from the
     strip. The rule (owner call): a pane earns the light only if it is
     showing its FULL width and its start edge sits in the leading half of
     the run; of those, the one nearest the start wins.

     Ratio alone can't say this. At the end of the run the strip stops with
     the last two panes both entirely visible — both at ratio 1, so the
     winner came down to which entry the observer happened to list first, and
     pressing 日 lit 한. Fullness answers「這一版讀得完嗎」and the leading-half
     test answers「是這一版，還是它右邊那個」; together they name exactly one.

     Fallback: a pane wider than the run can never be fully visible, and a
     light that goes out reads as broken — so if nobody qualifies, the pane
     showing the most wins. `aria-current` is the state, CSS dresses it. */
  /* 標記兩處：藥丸掛 `aria-current`（它是控件，那是它的狀態），版面自己掛
     `data-current`（樣式要據此放大縮小，而 `aria-current` 在版面上沒有那個
     意思）。 */
  const light = ($current) => {
    for (const [$pane, $a] of panes) {
      $a.toggleAttribute('aria-current', $pane === $current)
      $pane.toggleAttribute('data-current', $pane === $current)
    }
  }

  const vertical = () => getComputedStyle($strip).writingMode.startsWith('vertical')

  /* 沿長帶的**行內軸**取起點、終點與長度：直排時那條軸是螢幕的縱軸。 */
  const span = (rect, isVertical) => isVertical
    ? { start: rect.top, end: rect.bottom, size: rect.height }
    : { start: rect.left, end: rect.right, size: rect.width }

  const current = () => {
    const isVertical = vertical()
    const run = span($strip.getBoundingClientRect(), isVertical)
    const middle = run.start + run.size / 2
    let winner = null
    let widest = null
    for (const $pane of panes.keys()) {
      const pane = span($pane.getBoundingClientRect(), isVertical)
      /* 1px 的寬容：捲動位置與版寬都可能落在次像素上。 */
      const whole = pane.start >= run.start - 1 && pane.end <= run.end + 1
      const shown = Math.max(0, Math.min(pane.end, run.end) - Math.max(pane.start, run.start))
      if (!widest || shown > widest.shown) widest = { $pane, shown }
      if (!whole || pane.start >= middle) continue
      if (!winner || pane.start < winner.start) winner = { $pane, start: pane.start }
    }
    return (winner ?? widest)?.$pane
  }

  let queued = false
  const sync = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      const $now = current()
      if ($now) light($now)
    })
  }

  $strip.addEventListener('scroll', sync, { passive: true })
  addEventListener('resize', sync, { passive: true })
  sync()
}

export const initSnapStrips = () => {
  document.querySelectorAll('[data-snap-pills]').forEach(mount)
}
