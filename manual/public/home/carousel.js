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

  // One item = one whole cascade pair (han.css's rule ＋ the reader's), so the
  // selector, the declarations and both weights swap together. Anything less
  // and a half-swapped state would show a property being overridden by a
  // declaration that does not mention it.
  const $items = [...$ring.children]
  const $nav = $root.querySelector('.SelNav')
  const $count = $nav?.querySelector('[data-sel-count]')
  if ($items.length < 2 || !$nav) return

  // Each annotation `<b>` names the attribute it mirrors, so the two weights
  // cannot be crossed by position.
  const OUTS = [
    ['data-spec', 'spec', 'data-spec-out'],
    ['data-mine-spec', 'mineSpec', 'data-mine-out'],
  ]

  const show = (i) => {
    $items.forEach(($el, n) => $el.toggleAttribute('data-current', n === i))
    for (const [attr, prop, out] of OUTS) {
      const spec = $items[i].querySelector(`[${attr}]`)?.dataset[prop]
      if (spec) $root.querySelectorAll(`[${out}]`).forEach(($b) => ($b.textContent = spec))
    }
    const $item = $items[i]
    for (const [role, attr] of [['framework', 'data-spec'], ['mine', 'data-mine-spec']]) {
      const $rule = $item.querySelector(`.Rule[data-role="${role}"]`)
      const spec = $rule?.querySelector(`[${attr}]`)?.getAttribute(attr)
      if (!$rule || !spec) continue
      let $out = $rule.querySelector(':scope > .RuleSpec')
      if (!$out) {
        $out = document.createElement('output')
        $out.className = 'RuleSpec'
        $rule.append($out)
      }
      $out.textContent = role === 'framework' ? `:where${spec}→(0,0,0)` : spec
    }
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
