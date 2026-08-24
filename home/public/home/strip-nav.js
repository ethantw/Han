/**
 * strip-nav.js — the two arrows beside a scrolling strip.
 *
 * A strip that overflows says so by cutting a card at its edge; the arrows
 * are for the reader who would rather press than swipe. They move the strip
 * by a THIRD of what is showing, not by one card: a card-sized jump has to
 * know where the cards are, and a fraction of the view is the same gesture
 * a trackpad flick already makes. At either end the matching arrow is
 * disabled — a control that cannot do anything should say so, not fail
 * silently.
 *
 * `[data-strip-nav="name"]` finds `[data-strip="name"]`. No-JS degrades to
 * what the markup already is: the strip still scrolls and snaps, and these
 * two buttons simply do nothing (they carry no href to break).
 */

/** How much of the visible run one press moves. */
const STEP = 1 / 3

/* The strip's own writing mode decides which axis is "along the run":
   in 直排 the inline axis is the screen's vertical one. */
const axisOf = ($strip) =>
  getComputedStyle($strip).writingMode.startsWith('vertical')
    ? { pos: 'scrollTop', size: 'clientHeight', full: 'scrollHeight', key: 'top' }
    : { pos: 'scrollLeft', size: 'clientWidth', full: 'scrollWidth', key: 'left' }

const mount = ($nav) => {
  const $strip = document.querySelector(`[data-strip="${$nav.dataset.stripNav}"]`)
  if (!$strip) return

  const $prev = $nav.querySelector('[data-scroll="prev"]')
  const $next = $nav.querySelector('[data-scroll="next"]')

  const sync = () => {
    const axis = axisOf($strip)
    const at = $strip[axis.pos]
    /* 1px 的寬容：捲動位置與內容尺寸都可能落在次像素上，差一點點就把「到底了」
       判成「還沒到」，那顆按鈕會停在能按卻不動的狀態。 */
    const end = $strip[axis.full] - $strip[axis.size] - 1
    if ($prev) $prev.disabled = at <= 0
    if ($next) $next.disabled = at >= end
  }

  const by = (sign) => {
    const axis = axisOf($strip)
    $strip.scrollBy({ [axis.key]: sign * $strip[axis.size] * STEP, behavior: 'smooth' })
  }

  $prev?.addEventListener('click', () => by(-1))
  $next?.addEventListener('click', () => by(1))

  let queued = false
  const schedule = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      sync()
    })
  }

  $strip.addEventListener('scroll', schedule, { passive: true })
  addEventListener('resize', schedule, { passive: true })
  sync()
}

export const initStripNav = () => {
  document.querySelectorAll('[data-strip-nav]').forEach(mount)
}
