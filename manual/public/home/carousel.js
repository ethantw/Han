/**
 * carousel.js — station 伍's selector ring (例5.1).
 *
 * 式5.1 says「for ANY selector s」. A universal quantifier with one witness
 * beside it reads like a special case, so the example cycles through five real
 * selectors out of the library — different modules, wildly different shapes
 * and weights, same zero on the right.
 *
 * READER-DRIVEN. No timer, no autoplay: the thing moving is an equation the
 * reader is in the middle of parsing. `prefers-reduced-motion` drops the
 * transition too, so the swap is instantaneous rather than merely quick.
 *
 * The DOM is the data: the selectors and their computed weights (`data-spec`,
 * filled at build time from the selector's own text) live in the markup, and
 * the nav is `hidden` there — this module unhides it, which is what keeps the
 * no-JS page from offering buttons that do nothing.
 */

const wrap = (i, n) => ((i % n) + n) % n

export const initCarousel = ($root = document) => {
  const $ring = $root.querySelector('.SelRing')
  if (!$ring) return

  const $items = [...$ring.querySelectorAll('code')]
  const $nav = $root.querySelector('.SelNav')
  const $outs = [...$root.querySelectorAll('[data-spec-out]')]
  const $count = $nav?.querySelector('[data-sel-count]')
  if ($items.length < 2 || !$nav) return

  const show = (i) => {
    $items.forEach(($el, n) => $el.toggleAttribute('data-current', n === i))
    // The weight belongs to the selector, so it travels with it — otherwise
    // the first swap would leave a triple that describes the previous line.
    const spec = $items[i].dataset.spec
    if (spec) $outs.forEach(($b) => ($b.textContent = spec))
    if ($count) $count.textContent = `${i + 1}／${$items.length}`
  }

  const index = { current: 0 }
  $nav.addEventListener('click', (e) => {
    const step = Number(e.target.closest('[data-sel-step]')?.dataset.selStep)
    if (!step) return
    index.current = wrap(index.current + step, $items.length)
    show(index.current)
  })

  $nav.hidden = false
  show(0)
}
