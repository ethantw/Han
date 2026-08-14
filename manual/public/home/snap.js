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

  /* Scroll rather than jump: `scrollIntoView` moves the STRIP, while
     following the link would move the page to the pane's top as well — the
     reader asked for a different edition, not for a different scroll
     position. */
  for (const [$pane, $a] of panes) {
    $a.addEventListener('click', (e) => {
      e.preventDefault()
      $pane.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'smooth' })
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
