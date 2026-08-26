/**
 * dash-clip.js — publishes where station②'s 破折號 column gets cut off.
 *
 * The column (`.DashColumn`, dash-fuse.css) is 62 cells of 128px type and runs
 * far above the page's top edge; only the station's own `overflow: clip` stops
 * it, and that cuts at the station's top — so the topmost characters crawl over
 * the「超迴路運行廿載」specimen card. The cut belongs at that card's BOTTOM
 * edge (the card itself — see the selector below), and the distance from there
 * down to the column's top is decided by
 * content (a whole lead-type forme sits in between), so CSS cannot express it.
 *
 * Anchor positioning looks like it should retire this module and doesn't: for a
 * clip to bite, the clipping box has to be the column's containing block, while
 * `anchor()` only accepts anchors that are DESCENDANTS of that containing block
 * — mutually exclusive here, and nothing to do with support
 * (docs/notes/2026-08-26-anchor-positioning-vs-clipping.md).
 *
 * One number, republished when the geometry moves; with no JS the registered
 * initial value of 0 means「don't clip」, which is how the page looked before.
 */

/** Cut station②'s dash column off at the specimen card above it. */
export const initDashClip = ($root = document) => {
  const $col = $root.querySelector('.DashColumn')
  /* The card, not the <figure>: station②'s faces figure carries a figcaption
     (the 護眼模式 switch) that stretches the whole figure box 167px past the
     white card's bottom edge, and the card's edge is the one a reader sees. */
  const $ceiling = $root.querySelector('#station-fonts .Illust[data-variant="faces"] .Faces')
  if (!$col || !$ceiling) return

  /* clip-path never changes a layout box, so reading the column back after
     writing the property cannot feed the observer — no loop to guard against. */
  const sync = () => {
    const cut = $ceiling.getBoundingClientRect().bottom - $col.getBoundingClientRect().top
    $col.style.setProperty('--df-clip-top', `${Math.max(0, Math.round(cut))}px`)
  }

  /* Both ends move for their own reasons: the card reflows with the viewport,
     and the column's top follows its own font-size (a `vw` clamp). Watching the
     station covers the forme between them growing or shrinking as well. */
  const $station = $col.closest('[data-station]') ?? $ceiling
  new ResizeObserver(sync).observe($station)
  new ResizeObserver(sync).observe($ceiling)
  sync()
}
