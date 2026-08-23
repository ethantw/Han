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

     `scrollBy` takes physical axes, so read the strip's own writing mode:
     in 直排 the strip's inline axis IS the block axis of the screen. */
  const inlineDelta = ($pane) => {
    const strip = $strip.getBoundingClientRect()
    const pane = $pane.getBoundingClientRect()
    return getComputedStyle($strip).writingMode.startsWith('vertical')
      ? { top: pane.top - strip.top }
      : { left: pane.left - strip.left }
  }

  for (const [$pane, $a] of panes) {
    $a.addEventListener('click', (e) => {
      e.preventDefault()
      $strip.scrollBy({ ...inlineDelta($pane), behavior: 'smooth' })
    })
  }

  /* Which pane is showing is the strip's own business, so read it from the
     strip: the pane covering most of the visible run wins. `aria-current` is
     the state, and CSS dresses it — no class bookkeeping. */
  const light = ($current) => {
    for (const [$pane, $a] of panes) {
      if ($pane === $current) $a.setAttribute('aria-current', 'true')
      else $a.removeAttribute('aria-current')
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const best = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (best) light(best.target)
    },
    { root: $strip, threshold: [0.5, 0.75, 1] },
  )
  for (const $pane of panes.keys()) observer.observe($pane)
  light([...panes.keys()][0])
}

export const initSnapStrips = () => {
  document.querySelectorAll('[data-snap-pills]').forEach(mount)
}
