/**
 * dash-clip.js — publishes where station②'s 破折號 column gets cut off.
 *
 * The column (`.DashColumn`, dash-fuse.css) is 62 cells of 128px type and runs
 * far above the page's top edge; only the station's own `overflow: clip` stops
 * it, and that cuts at the station's top — so the topmost characters crawl over
 * the「超迴路運行廿載」specimen card. The cut belongs at that card's BOTTOM
 * edge (the card itself — see the selector below), and the distance from there
 * down to the column's top is decided by content (a whole lead-type forme sits
 * in between), so CSS cannot express it.
 *
 * Anchor positioning looks like it should retire this module and doesn't: for a
 * clip to bite, the clipping box has to be the column's containing block, while
 * `anchor()` only accepts anchors that are DESCENDANTS of that containing block
 * — mutually exclusive here, and nothing to do with support
 * (docs/notes/2026-08-26-anchor-positioning-vs-clipping.md).
 *
 * One number, republished when the geometry settles; with no JS the registered
 * initial value of 0 means「don't clip」, which is how the page looked before.
 *
 * It goes through `measure.js` rather than measuring in the observer callback,
 * and that is not a nicety: reading a rect straight from a `ResizeObserver`
 * forces a synchronous layout, and this column is the single most expensive box
 * on the page to lay out. Collapsing the console (which animates the plate's
 * width) fired it once per frame — 10 calls, 149ms, worst 93ms of the toggle's
 * 361ms (2026-08-27 trace). `settled` gives it the module's three disciplines
 * for free: 放手才算, 看不到不算, 先讀再寫.
 */

import { onRendered, settled } from './measure.js'

/** Cut station②'s dash column off at the specimen card above it. */
export const initDashClip = ($root = document) => {
  const $col = $root.querySelector('.DashColumn')
  /* The card, not the <figure>: station②'s faces figure carries a figcaption
     (the 護眼模式 switch) that stretches the whole figure box 167px past the
     white card's bottom edge, and the card's edge is the one a reader sees. */
  const $ceiling = $root.querySelector('#station-fonts .Illust[data-variant="faces"] .Faces')
  if (!$col || !$ceiling) return

  /* Both ends move for their own reasons: the card reflows with the viewport,
     and the column's top follows its own font-size (a `vw` clamp). Watching the
     station covers the forme between them growing or shrinking as well. */
  const $station = $col.closest('[data-station]') ?? $ceiling

  const sync = settled({
    watch: $station,
    read: () => $ceiling.getBoundingClientRect().bottom - $col.getBoundingClientRect().top,
    /* `clip-path` moves no layout box, so this write cannot feed the observer
       that scheduled it — but it does re-style the column (measured 10ms before
       the next rect read comes back clean), and the other loops on this page
       share the flush, so it belongs on the write side all the same. */
    write: (cut) => $col.style.setProperty('--df-clip-top', `${Math.max(0, Math.round(cut))}px`),
  })

  const watch = new ResizeObserver(sync)
  watch.observe($station)
  watch.observe($ceiling)
  /* …and the plate, because what actually moves is a POSITION, not a size.
     Collapsing the console re-centres the plate: the station's content box and
     the card both keep their 1087px, the station keeps its height — and yet
     `.PunctFix` (the column's containing block) slid 81px up the page, so the
     cut was 81px stale with nothing in the observed boxes to say so. `main` is
     the nearest box whose SIZE says "the page's geometry changed" (1160 →
     1440), which is exactly the trigger this needs. */
  const $plate = $col.closest('main')
  if ($plate) watch.observe($plate)
  /* 站台被 `content-visibility` 跳過時量到的是佔位尺寸，推回畫面要補算一次。 */
  onRendered($station, sync)
  sync()
}
