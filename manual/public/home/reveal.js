/**
 * reveal.js — one-shot entrance cue for the hero + stations.
 *
 * An IntersectionObserver stamps `data-revealed` on each target the first
 * time it scrolls into view, then unobserves it — no looping (direction-doc
 * rule). The CSS keys the copy rise and kicker-hairline scaleX off
 * `[data-revealed]`, all inside `@media (prefers-reduced-motion:
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
 *
 * `data-reveal-at="0.6"` — an opt-in, LATER cue for a target that is a
 * spectacle rather than a paragraph: hold the entrance until that fraction
 * of it is actually on screen. Station②'s lead-type forme uses it; the
 * default sliver-cue would spend the whole drop ceremony off screen while
 * the reader is still on the three-face specimen above.
 */

// The hero (`.Manifesto`) reveals too — its own entrance CSS is owned by
// the hero module; here we only hand it the `[data-revealed]` hook.
const REVEAL_SELECTOR = '.Manifesto, [data-station], [data-reveal-at]'

/* the default cue: a sliver on screen, minus a tenth of the fold.
   `threshold: 0`, and it MUST be 0 — intersectionRatio is measured against
   the TARGET, so a station taller than the viewport can never reach a
   fractional threshold at all. It read 0.1 until 2026-08-05, which meant
   that at 390px wide station①（17,075px tall, ratio ≤ 0.053）, station②
   （0.071）and station⑦（0.029）never fired, and `[data-station] > * {
   opacity: 0 }` stood forever — three of seven stations blank on a phone.
   The callback only ever asks `isIntersecting`, which is exactly what
   「a sliver」means, so 0 is also the honest spelling of the intent.
   (The same trap is already documented for `data-reveal-at` below, which
   is why THAT path measures against min(target, viewport).) */
const SLIVER = { rootMargin: '0px 0px -10% 0px', threshold: 0 }

/* A `data-reveal-at` observer can't just pass that fraction as `threshold`:
   IntersectionObserver measures the ratio against the TARGET, so a target
   taller than the viewport never reaches 0.6 and would never fire. Measure
   each axis against whichever is SMALLER, the target or the viewport —
   "that much of it" when it fits on screen, "that much of the screen" when
   it doesn't — and take the tighter of the two axes, which is whichever one
   the scroll is currently clipping. Both axes rather than the block one so
   the same reading holds in 直排, where the page scrolls inline.

   (Not a single area comparison: a target NARROWER than the viewport can
   never cover that share of the viewport's AREA without covering far more of
   its height — measured, the forme at 1600×600 wanted 91% of the fold to
   reach three quarters by area.) */
const THRESHOLDS = Array.from({ length: 51 }, (_, i) => i / 50)

const covered = (seen, box, root) => (box > 0 ? seen / Math.min(box, root) : 0)

const coveredEnough = (entry, at) => {
  const root = entry.rootBounds ?? { width: innerWidth, height: innerHeight }
  const seen = entry.intersectionRect
  const box = entry.boundingClientRect
  return (
    covered(seen.width, box.width, root.width) >= at &&
    covered(seen.height, box.height, root.height) >= at
  )
}

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
    SLIVER,
  )

  // one observer per distinct fraction — the callback still has to do the
  // area sum, but a dense threshold list is what wakes it up on the way in.
  const deep = new Map()
  const deepObserver = (at) =>
    deep.get(at) ??
    deep
      .set(
        at,
        new IntersectionObserver(
          (entries, obs) =>
            entries.forEach((entry) => {
              if (!coveredEnough(entry, at)) return
              reveal(entry.target)
              obs.unobserve(entry.target)
            }),
          { threshold: THRESHOLDS },
        ),
      )
      .get(at)

  $targets.forEach(($el) => {
    const at = Number.parseFloat($el.dataset.revealAt)
    // NaN / out-of-range ⇒ the default cue, not a silently dead target.
    ;(at > 0 && at <= 1 ? deepObserver(at) : observer).observe($el)
  })
}
