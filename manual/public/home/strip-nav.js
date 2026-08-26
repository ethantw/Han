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
 * Which way is "forward" is asked of the strip, not assumed: a strip whose
 * scroll origin sits at its right edge runs its scroll position the other way,
 * so both the jump and the end-of-run test are signed (see `axisOf`).
 *
 * `[data-strip-nav="name"]` finds `[data-strip="name"]`. No-JS degrades to
 * what the markup already is: the strip still scrolls and snaps, and these
 * two buttons simply do nothing (they carry no href to break).
 *
 * `[data-strip-start="seam"]` parks the strip with the GAP between its two
 * halves in the middle of the view, instead of at the start. One place wants
 * that: two prose specimens that read OUTWARD from the seam (直排 by 右→左,
 * 橫排 by 左→右), so the seam is where both first lines are.
 *
 * The seam, not the scroll range's midpoint: those coincide only when the two
 * halves are equally wide, and these are not (measured 647 vs 768 — the range
 * midpoint left the gap 68px off centre). Set on mount and on resize — never
 * on scroll, or it would haul the reader back every time they moved.
 */

/** How much of the visible run one press moves. */
const STEP = 1 / 3

/* The strip's own writing mode decides which axis is "along the run":
   in 直排 the inline axis is the screen's vertical one. */
/* 沿長帶行內軸的起點、終點與長度。 */
const span = (rect, axis) => axis.key === 'top'
  ? { start: rect.top, end: rect.bottom, size: rect.height }
  : { start: rect.left, end: rect.right, size: rect.width }

/* `way` 是「內容深處」在這根軸上的正負號。捲位不一定從 0 往正走：靠右對齊的
   長帶（站②的鉛字盤用 `direction: rtl` 把起點放在右緣）在 Chrome 底下
   `scrollLeft` 是從 0 走到負的可捲量。一個號同時修「按鈕往哪邊捲」與「到底了
   沒」，兩件事就不會各自為政。直排那根軸沒有這回事——`vertical-rl` 翻的是
   區塊軸，`scrollTop` 量的行內軸照樣從 0 往正走。 */
const axisOf = ($strip) => {
  const { writingMode, direction } = getComputedStyle($strip)
  return writingMode.startsWith('vertical')
    ? { pos: 'scrollTop', size: 'clientHeight', full: 'scrollHeight', key: 'top', way: 1 }
    : {
      pos: 'scrollLeft',
      size: 'clientWidth',
      full: 'scrollWidth',
      key: 'left',
      way: direction === 'rtl' ? -1 : 1,
    }
}

const mount = ($nav) => {
  const $strip = document.querySelector(`[data-strip="${$nav.dataset.stripNav}"]`)
  if (!$strip) return

  const $prev = $nav.querySelector('[data-scroll="prev"]')
  const $next = $nav.querySelector('[data-scroll="next"]')

  const sync = () => {
    const axis = axisOf($strip)
    const at = $strip[axis.pos] * axis.way
    /* 1px 的寬容：捲動位置與內容尺寸都可能落在次像素上，差一點點就把「到底了」
       判成「還沒到」，那顆按鈕會停在能按卻不動的狀態。 */
    const end = $strip[axis.full] - $strip[axis.size] - 1
    if ($prev) $prev.disabled = at <= 0
    if ($next) $next.disabled = at >= end
    /* 捲不動就整條收起來：兩顆都 disabled 的箭頭什麼也不說，只是佔一行。
       版面的斷點決定不了這件事——同一個寬度下，長帶會不會溢出還要看字體
       落地後的重排。所以由這裡量，CSS 只負責認 `[hidden]`（display 有值的
       規則會蓋掉 UA 的 `[hidden]`，四條長帶的樣式都補了那一行）。 */
    $nav.hidden = end < 0
  }

  const by = (sign) => {
    const axis = axisOf($strip)
    $strip.scrollBy({
      [axis.key]: sign * axis.way * $strip[axis.size] * STEP,
      behavior: 'smooth',
    })
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

  const center = () => {
    if ($strip.dataset.stripStart !== 'seam') return
    const axis = axisOf($strip)
    /* 依**視覺**順序取兩半，不是 DOM 順序：直排那張用 `order` 排到了前面。 */
    const halves = [...$strip.children]
      .map(($el) => span($el.getBoundingClientRect(), axis))
      .sort((a, c) => a.start - c.start)
    if (halves.length !== 2) return
    const run = span($strip.getBoundingClientRect(), axis)
    const seam = (halves[0].end + halves[1].start) / 2
    /* `instant`：這是版面的起始位置，不是一次捲動。平滑捲會讓頁面自己動起來，
       讀者會以為是他碰到了什麼。 */
    $strip.scrollBy({ [axis.key]: seam - (run.start + run.size / 2), behavior: 'instant' })
  }

  $strip.addEventListener('scroll', schedule, { passive: true })
  addEventListener('resize', () => {
    center()
    schedule()
  }, { passive: true })
  center()
  sync()
  /* 字型落地之後卡片會重排，掛載時對的縫就偏了（實測 14px）。等它一次。 */
  document.fonts?.ready?.then(() => {
    center()
    sync()
  })
}

export const initStripNav = () => {
  document.querySelectorAll('[data-strip-nav]').forEach(mount)
}
