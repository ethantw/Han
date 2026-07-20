/**
 * reveal.js — one-shot entrance cue for the hero + stations.
 *
 * An IntersectionObserver stamps `data-revealed` on each target the first
 * time it scrolls into view, then unobserves it — no looping (direction-doc
 * rule). The CSS keys the watermark fade/rise and the kicker-hairline
 * scaleX off `[data-revealed]`, all inside `@media (prefers-reduced-motion:
 * no-preference)`, so the SETTLED state is the default: content is never
 * hidden when JS / IO is absent.
 *
 * Guards: no IntersectionObserver support, or a reduced-motion preference ⇒
 * stamp every target immediately (skip the observer, skip the animation).
 *
 * `opened` (the fonts-gate promise): observation starts NOW, but every
 * stamp routes through it. The fonts gate can hold the page for seconds
 * on a slow network, and the user scrolls meanwhile — start observing
 * only at gate-open and every station toured during the wait misses its
 * stamp forever (found on real 3G: fly-ins "gone"). Queued this way,
 * a station reached mid-gate stamps the instant the gate opens — still
 * on screen, it flies in right as the copy prints.
 */

// The hero (`.Manifesto`) reveals too — its own entrance CSS is owned by
// the hero module; here we only hand it the `[data-revealed]` hook.
const REVEAL_SELECTOR = '.Manifesto, .Station'

export const initReveal = (opened = Promise.resolve()) => {
  const reveal = ($el) => {
    opened.then(() => $el.setAttribute('data-revealed', ''))
  }
  const $targets = Array.from(document.querySelectorAll(REVEAL_SELECTOR))
  if (!$targets.length) return

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced || !('IntersectionObserver' in window)) {
    $targets.forEach(reveal)
    return
  }

  const observer = new IntersectionObserver(
    (entries, obs) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        reveal(entry.target)
        obs.unobserve(entry.target)
      }),
    {
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1,
    },
  )

  $targets.forEach(($el) => observer.observe($el))
}
