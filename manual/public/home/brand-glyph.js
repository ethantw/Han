/**
 * `.BrandGlyph` baseline alignment — the one measurement CSS can't do.
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
 * Runs twice: now (fallback state, so the glyph is right on the first frame)
 * and once `document.fonts.ready` settles (webfont state). Nothing else
 * triggers it — `--brand-glyph-baseline` is a property of the SVG paths, not
 * of the page.
 *
 * Related: docs/notes/2026-07-21-svg-glyph-baseline-alignment.md (why the two
 * metric systems can't be reconciled in CSS, and why an inline `<svg>` can't
 * simply be `vertical-align`ed instead — Chrome puts its baseline ~0.066em
 * above its bottom edge, and this `<path>` must stay a real inline SVG for
 * fonts-gate.js to clone for the stroke ceremony).
 */

const EM_BOX_ASCENT = 0.88   // = --brand-glyph-baseline (sTypoAsc 880 / upem)

const alignOne = ($mark) => {
  const $probe = document.createElement('span')
  // zero-size, baseline-aligned: its box top === the text baseline
  $probe.style.cssText = 'display:inline-block;inline-size:0;block-size:0;vertical-align:baseline'
  $mark.append($probe)
  const baseline = $probe.getBoundingClientRect().top - $mark.getBoundingClientRect().top
  $probe.remove()

  const em = parseFloat(getComputedStyle($mark).fontSize)
  if (!em) return
  $mark.style.setProperty('--brand-glyph-top', `${(baseline / em - EM_BOX_ASCENT).toFixed(4)}em`)
}

const alignAll = ($root) =>
  $root.querySelectorAll('.Brand [data-part="mark"]:has(.BrandGlyph)').forEach(alignOne)

export const initBrandGlyph = ($root = document) => {
  alignAll($root)
  // the swap moves the baseline — re-measure, don't guess
  document.fonts?.ready.then(() => alignAll($root))
}
