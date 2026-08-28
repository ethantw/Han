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
 * midpoint left the gap 68px off centre).
 *
 * Re-aimed whenever either half changes size, and NOT on `document.fonts.ready`
 * alone: that promise settles while the cards are still moving — han.js wraps
 * the prose in `<h-char>` at gate-open and the subset faces land later still,
 * and either one re-wraps a card (measured: the seam sat 21px off, and a
 * one-pixel window resize snapped it back to 0). Never on scroll, though, and
 * never again once the reader has moved the strip themselves — the aim is the
 * layout's starting point, not a leash.
 */

import { settled } from './measure.js'
import { DEV_RESET } from '/home/dev-reset.js'

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

const mount = ($navs) => {
  const name = $navs[0]?.dataset.stripNav
  const $strip = name && document.querySelector(`[data-strip="${name}"]`)
  if (!$strip) return
  const $visibilityRoot = $strip.closest('[data-station]') ?? $strip

  const controls = $navs.map(($nav) => ({
    $nav,
    $prev: $nav.querySelector('[data-scroll="prev"]'),
    $next: $nav.querySelector('[data-scroll="next"]'),
  }))

  const sync = () => {
    const axis = axisOf($strip)
    const at = $strip[axis.pos] * axis.way
    /* 1px 的寬容：捲動位置與內容尺寸都可能落在次像素上，差一點點就把「到底了」
       判成「還沒到」，那顆按鈕會停在能按卻不動的狀態。 */
    const end = $strip[axis.full] - $strip[axis.size] - 1
    for (const { $nav, $prev, $next } of controls) {
      if ($prev) $prev.disabled = at <= 0
      if ($next) $next.disabled = at >= end
    /* 捲不動就整條收起來：兩顆都 disabled 的箭頭什麼也不說，只是佔一行。判準
       就寫成「兩顆都廢了」，不另外算一次可捲量——量出 1px 的餘裕時兩顆都會是
       disabled，而那一行仍舊會留在版面上（實測站①四版就是這樣：餘裕 1px、
       兩顆皆廢、整條卻還在）。
       版面的斷點決定不了這件事——同一個寬度下，長帶會不會溢出還要看字體落地後
       的重排。所以由這裡量，CSS 只負責認 `[hidden]`（display 有值的規則會蓋掉
       UA 的 `[hidden]`，四條長帶的樣式都補了那一行）。 */
      $nav.hidden = ($prev?.disabled ?? true) && ($next?.disabled ?? true)
    }
  }

  /* 讀者自己動過這條長帶之後就不再自動歸位（見檔頭）。程式自己捲的那一下也會
     發 scroll 事件，所以先舉旗再捲，由**收到的那個事件**把旗放下——不能用
     rAF 放旗：scroll 事件是非同步派送的，旗子先落地，那一下就被記成讀者動的，
     後面的重排也就再也不歸位了（實測縫停在 22px 偏差）。旗只在真的捲得動時
     才舉，否則沒有事件來收它，會吃掉讀者的下一次捲動。 */
  let touched = false
  let selfScroll = false

  const by = (sign) => {
    const axis = axisOf($strip)
    $strip.scrollBy({
      [axis.key]: sign * axis.way * $strip[axis.size] * STEP,
      behavior: 'smooth',
    })
  }

  /* 箭頭也算讀者動過：他按了，就別再把他拉回縫上。 */
  for (const { $prev, $next } of controls) {
    $prev?.addEventListener('click', () => by(-1))
    $next?.addEventListener('click', () => by(1))
  }

  let queued = false
  const schedule = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      /* 畫面外的站台沒有版面，量到的是 `contain-intrinsic-size` 的佔位尺寸
         ——既錯又貴（measure.js § 看不到不算）。 */
      /* A sticky descendant can be painted while its own very tall containing
         block reports skipped. The station is the content-visibility boundary
         and therefore the reliable visibility key for all of its strips. */
      if ($visibilityRoot.checkVisibility?.({ contentVisibilityAuto: true }) === false) return
      sync()
    })
  }

  /* 對縫走 measure.js 的紀律（放手才算、看不到不算、先讀再寫）：讀 rect 這件事
     從觀察器的回呼裡直接做會逼出一次同步版面，而這一頁的版面很貴——收合主控台
     那一下（版心的寬真的在變）曾經讓這支每幀跑一次。量測與捲動因此拆成 read／
     write 兩半交給同一口時鐘。 */
  const center = settled({
    watch: $strip,
    read: () => {
      if ($strip.dataset.stripStart !== 'seam') return 0
      const axis = axisOf($strip)
      /* 依**視覺**順序取兩半，不是 DOM 順序：直排那張用 `order` 排到了前面。 */
      const halves = [...$strip.children]
        .map(($el) => span($el.getBoundingClientRect(), axis))
        .sort((a, c) => a.start - c.start)
      if (halves.length !== 2) return 0
      const run = span($strip.getBoundingClientRect(), axis)
      const seam = (halves[0].end + halves[1].start) / 2
      return Math.round(seam - (run.start + run.size / 2))
    },
    /* `instant`：這是版面的起始位置，不是一次捲動。平滑捲會讓頁面自己動起來，
       讀者會以為是他碰到了什麼。 */
    write: (by) => {
      if (!by || touched) return
      selfScroll = true
      $strip.scrollBy({ [axisOf($strip).key]: by, behavior: 'instant' })
    },
  })

  $strip.addEventListener('scroll', () => {
    if (selfScroll) selfScroll = false
    else touched = true
    schedule()
  }, { passive: true })

  const aim = () => {
    center()
    schedule()
  }

  /* Some strips acquire overflow by changing their internal track layout
     while their own border box stays the same. ResizeObserver cannot see that
     scroll-range-only change, so the layout owner announces it explicitly. */
  $strip.addEventListener('han-strip-layout', aim)

  addEventListener('resize', aim, { passive: true })

  /* 卡片自己會變：han.js 在開幕時把正文包成 `<h-char>`、子集字體又更晚落地，
     兩者都會讓一張卡重排（實測直排那張 984 → 991 → 970，縫因此偏 22px）。
     ResizeObserver 掛了也接不到那一下——那張卡是 `vertical-rl`，變的是它的
     block 軸，而長帶自己的盒一動也沒動（實測整段開機只收到掛載時那一次回呼）
     ⇒ 不能只靠它。真正管用的是**進畫面時再對一次**：讀者看不見的時候縫偏多少
     都無妨，而他捲到這一站時版面早已落定（實測進場後偏差 0）。 */
  const watch = new ResizeObserver(aim)
  watch.observe($strip)
  for (const $half of $strip.children) watch.observe($half)

  new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) aim()
  }).observe($strip)

  /* Shift+M（home/dev-reset.js）：回到起點——捲回 0，並且把「讀者動過」那面旗
     放下，起始對位（縫居中）才會再算一次。 */
  document.addEventListener(DEV_RESET, () => {
    touched = false
    selfScroll = true
    $strip.scrollTo({ [axisOf($strip).key]: 0, behavior: 'instant' })
    aim()
  })

  center()
  sync()
}

export const initStripNav = () => {
  const groups = new Map()
  document.querySelectorAll('[data-strip-nav]').forEach(($nav) => {
    const name = $nav.dataset.stripNav
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name).push($nav)
  })
  groups.forEach(mount)
}
