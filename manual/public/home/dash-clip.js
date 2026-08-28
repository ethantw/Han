/**
 * dash-clip.js — publishes where station②'s 破折號 column gets cut off.
 *
 * The column (`.DashColumn`, dash-fuse.css) is 52 cells of ~82px type and runs
 * far above the page's top edge; only the station's own `overflow: clip` stops
 * it, and that cuts at the station's top — so the topmost characters crawl over
 * the specimen card and the whole lead-type forme. The cut belongs at the
 * forme's BOTTOM-LEFT slug (owner 2026-08-28: 「從鉛字盤左下角的三角形開始」),
 * and the distance from there down to the column's top is decided by content,
 * so CSS cannot express it.
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
  const $forme = $root.querySelector('#station-fonts .LeadForme svg')
  if (!$col || !$forme) return

  /* 切線落在鉛字盤**左下角那顆鉛字**的下緣。不是整張盤的下緣：盤是等軸投影，
     最低點在正中那一顆，左下角那顆的底比它高一截，而讀者看到的「盤的左下角」
     正是這一顆。挑法是量出來的，不是寫死的索引——鉛字的顆數與排法會隨語言、
     字面、直橫排而變（lead-forme.js 每次重建整盤）：取最靠左那一欄（容差 40px，
     等軸投影下同一欄的鉛字 x 有幾像素差），再取其中最低的一顆。 */
  const bottomLeftSlug = () => {
    const slugs = [...$forme.querySelectorAll('.Slug')]
    if (!slugs.length) return null
    const boxes = slugs.map(($s) => $s.getBoundingClientRect())
    const minX = Math.min(...boxes.map((b) => b.x))
    return Math.max(...boxes.filter((b) => b.x < minX + 40).map((b) => b.bottom))
  }

  /* Both ends move for their own reasons: the forme reflows with the viewport,
     and the column's top follows its own font-size (a `vw` clamp). Watching the
     station covers the forme between them growing or shrinking as well. */
  const $station = $col.closest('[data-station]') ?? $forme

  const sync = settled({
    watch: $station,
    read: () => {
      const cut = bottomLeftSlug()
      return cut === null ? 0 : cut - $col.getBoundingClientRect().top
    },
    /* `clip-path` moves no layout box, so this write cannot feed the observer
       that scheduled it — but it does re-style the column (measured 10ms before
       the next rect read comes back clean), and the other loops on this page
       share the flush, so it belongs on the write side all the same. */
    write: (cut) => $col.style.setProperty('--df-clip-top', `${Math.max(0, Math.round(cut))}px`),
  })

  const watch = new ResizeObserver(sync)
  watch.observe($station)
  watch.observe($forme)
  /* …and the plate, because what actually moves is a POSITION, not a size.
     Collapsing the console re-centres the plate: the station's content box and
     the card both keep their 1087px, the station keeps its height — and yet
     `.TwoEmDashes` (the column's containing block) slid 81px up the page, so the
     cut was 81px stale with nothing in the observed boxes to say so. `main` is
     the nearest box whose SIZE says "the page's geometry changed" (1160 →
     1440), which is exactly the trigger this needs. */
  const $plate = $col.closest('main')
  if ($plate) watch.observe($plate)
  /* 鉛字是 **transform** 落下的（lead-forme.css § lf-drop），而 ResizeObserver
     看不到 transform：先收起主控台、再捲到這一站，量到的就是半空中的鉛字——切線
     偏高 149px，柱從鉛字上方露了出來（owner 2026-08-28 的截圖）。三個補算的時機
     一起掛上，`settled` 會把它們併成一次：鉛字落地（動畫結束，每顆各自送）、
     讀者停手（`scrollend`，Baseline 2024——落下正是捲到它時才開始的），以及停手
     之後一秒（整盤四十幾顆，最後一顆落得比 `scrollend` 晚）。 */
  $forme.addEventListener('animationend', sync)
  $forme.addEventListener('transitionend', sync)
  addEventListener('scrollend', () => {
    sync()
    setTimeout(sync, 1000)
  }, { passive: true })

  /* 站台被 `content-visibility` 跳過時量到的是佔位尺寸，推回畫面要補算一次。 */
  onRendered($station, sync)
  sync()
}
