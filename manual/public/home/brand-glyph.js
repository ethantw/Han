/**
 * `.Glyph` baseline alignment — the one measurement CSS can't do.
 *
 * The wordmark's 漢 is an absolutely-positioned inline `<svg>` overlaying the
 * (transparent) real text, and abspos can only anchor BOX EDGES. Where the
 * baseline sits inside that box, though, is decided by the first available
 * font's line metrics (hhea/win ascent · descent) — a value CSS cannot read,
 * and one that CHANGES the moment the webfont swaps in:
 *
 *   serif fallback (Hiragino Mincho ProN)  baseline at 0.750em from box top
 *   Shanggu Serif VF                       baseline at 0.933em
 *
 * So a hard-coded offset can only be right on one side of the swap. With
 * Shanggu's numbers baked into the CSS, the glyph hung 0.182em (4.4px at the
 * Topbar's 24px) below the text during loading and snapped up when the font
 * landed — the sink-then-jump this module removes.
 *
 * The measurement: a zero-size inline-block on the baseline reports the
 * baseline's own position (its box bottom IS the baseline, and with zero
 * height its top is the same point). The glyph's em box wants to start
 * `--brand-glyph-baseline` (0.88em, Shanggu's sTypoAsc 880) above it. Result
 * is written in `em`, so it survives every font-size the console's 字級 slider
 * throws at the mark — one measurement per state, no re-run on resize.
 *
 * Runs at DCL (fallback state, so the glyph is right on the first frame),
 * again once `document.fonts.ready` settles (webfont state), and once more
 * per mark when that mark first comes on screen — a mark whose section has
 * not been rendered yet cannot be measured at all, and the first two passes
 * both fall inside that window for anything below the fold. Nothing else
 * triggers it: `--brand-glyph-baseline` is a property of the SVG paths, not
 * of the page.
 *
 * Related: docs/notes/2026-07-21-svg-glyph-baseline-alignment.md (why the two
 * metric systems can't be reconciled in CSS, and why an inline `<svg>` can't
 * simply be `vertical-align`ed instead — Chrome puts its baseline ~0.066em
 * above its bottom edge, and this `<path>` must stay a real inline SVG for
 * fonts-gate.js to clone for the stroke ceremony).
 */

const EM_BOX_ASCENT = 0.88   // = --brand-glyph-baseline (sTypoAsc 880 / upem)

/** Pin one mark's glyph to its measured baseline.
 *  Returns whether a measurement was actually taken — see the guard. */
const alignOne = ($mark) => {
  const $probe = document.createElement('span')
  // zero-size, baseline-aligned: its box top === the text baseline
  $probe.style.cssText = 'display:inline-block;inline-size:0;block-size:0;vertical-align:baseline'
  $mark.append($probe)
  const probeTop = $probe.getBoundingClientRect().top
  const markRect = $mark.getBoundingClientRect()
  $probe.remove()

  const em = parseFloat(getComputedStyle($mark).fontSize)
  if (!em) return false

  const baseline = probeTop - markRect.top
  /* The baseline lies inside the mark's own box, always. Anything else means
     no measurement happened at all: where a subtree's rendering is being
     SKIPPED — `content-visibility: auto`, which `main > section` carries for
     every station (frame.css) — a node inserted just now has no box and
     reports an all-zero rect, while `$mark` still reports the off-screen one
     it was last laid out at. Subtracting those gives the scroll offset, not a
     baseline: measured 4104px, written out as `128.2294em`, which threw the
     glyph a page and a half down the document where the station's `overflow:
     clip` swallowed it. The wordmark's 漢 was simply gone — and the gap it
     left looked normal, because the width belongs to the transparent real 漢
     beside it, not to this SVG.

     Refusing to write is always the safe direction: the CSS `calc()` fallback
     stands, which is the correct offset once the webfont is there, and the
     observer below measures for real the moment the subtree renders. */
  if (!(markRect.height > 0 && baseline > 0 && baseline <= markRect.height)) return false

  $mark.style.setProperty('--brand-glyph-top', `${(baseline / em - EM_BOX_ASCENT).toFixed(4)}em`)
  return true
}

export const initBrandGlyph = ($root = document) => {
  const $marks = [...$root.querySelectorAll('.Brand .Mark:has(.Glyph)')]
  const alignAll = () => $marks.forEach(alignOne)

  alignAll()
  // the swap moves the baseline — re-measure, don't guess
  document.fonts?.ready.then(alignAll)

  /* Both passes above can land while a mark is inside a skipped subtree, and
     then neither of them measures anything (see the guard) — station④'s five
     wordmarks are off screen at load by construction, and the hero's is too
     on any reload that restores a mid-page scroll. Measure again the first
     time each mark is genuinely on screen, which is also the first moment its
     section is guaranteed rendered, and stop watching once one lands. */
  if (!('IntersectionObserver' in window)) return
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries)
      if (entry.isIntersecting && alignOne(entry.target)) io.unobserve(entry.target)
  })
  $marks.forEach(($mark) => io.observe($mark))
}
