/**
 * fonts-gate.js — release the pre-paint fonts gate (`_home.html` stamp
 * + home.css § Fonts gate). Exports the singleton `gateOpened` promise
 * so home.js can chain post-reveal work (initReveal).
 *
 * Release = THE FONTS, and only the fonts — plus one narrow exception:
 *   • fonts   — document.fonts.ready raced against a hard timeout:
 *     offline or a dead CDN must never strand the page; ugly-after-4s
 *     beats blank (ziano's gate rule). The moment they settle the copy
 *     flies in, even with the 漢 half-written behind it: the ceremony is
 *     decoration, and decoration must never hold the reader (owner spec,
 *     2026-07-27b — the earlier「描完才給字」made a warm cache wait ~4s).
 *   • the one exception — a dark round IN FLIGHT. If the pale sheet
 *     finished while the fonts were still out, the dark sheet takes over
 *     as the loading INDICATOR, looping (JS keeps the beat: CSS alone
 *     can't loop a delay-staggered group in sync). An indicator that
 *     vanishes half-drawn reads as a glitch, so that round always paints
 *     to its end — the copy comes up on a whole 漢 and the dark ink fades
 *     out as it rises.
 *
 * Either way the ceremony is TWO passes, always — even on a cache hit,
 * because a font swap always flashes once and a fixed opening ceremony
 * never does. Where the second one lands is all that moves: as the
 * indicator above, or (when the fonts beat the ink) as a flourish that
 * waits for the pale sheet to land AND the copy to finish arriving, then
 * writes the 漢 once in dark ink and fades back to the pale outline.
 *
 * The watermark itself is BUILT here, by cloning the brand logo's
 * stroke paths (`.BrandGlyph`, the single source in `_shared.html`'s
 * `logo` token) into `.Outline` — so the 漢 outline lives in exactly
 * one place in the shipped HTML and everything else derives from it.
 * Building it in JS also means this module creates AND starts the
 * animation together, with no paint-vs-JS start race to paper over.
 * Trade-off: the watermark is decorative (aria-hidden) and absent
 * without JS; the loading indicator appears at DCL, not first paint.
 *
 * Degradations: reduced-motion (the stroke animation never runs) or a
 * missing watermark/logo → the pass leg collapses and the fonts leg
 * alone gates. A hard cap covers pathologies where animationend never
 * fires (throttled background tab). no-JS never stamps the attribute,
 * so the gate is a no-op by absence (and the watermark simply isn't
 * built — the settled hero reads fine without its background glyph).
 */

/* The fonts leg's patience must OUTLAST the pale sheet (PASS_TOTAL_S,
   below) or the indicator branch is dead code: the leg would always give
   up first, `fonts.settled` would always be true when the sheet lands,
   and the dark pass could only ever be the flourish. So the two live in a
   fixed order — pass (~7.2s) < FONTS_TIMEOUT < one more round — which
   also means a genuinely slow network gets exactly one indicator round
   before the gate gives up on the webfont. It was 4s back when the copy
   waited for the whole ceremony; now the copy leaves at the fonts'
   arrival, so the wait is only ever spent watching the 漢 write itself,
   never a blank page (that was the point of the 4s rule). HARD_CAP is the
   frozen-tab backstop and has to clear the worst legitimate case
   (timeout, then the round boundary past it ≈ 11s). */
const FONTS_TIMEOUT_MS = 8_000
const HARD_CAP_MS = 14_000
const SVGNS = 'http://www.w3.org/2000/svg'

/* First pass, sequential — one hand writing one 漢. Each stroke's
   duration comes from its real measured length, and it starts where the
   previous one landed. The old fixed 0.35s/stroke on a flat 0.09s
   stagger gave every stroke the same time regardless of length: the 捺
   and the long 橫 blurred past while the dots dawdled, and the mismatch
   read as stutter (user report, 2026-07-27) — the strokes were never
   dropping frames, they were drawing at twelve different speeds.
   PASS_OVERLAP lets each stroke start slightly before the previous one
   lands: a real brush is already moving when it touches down, and a hard
   zero-overlap seam ticks.

   PASS_CONTRAST is the second half of that fix. A flat length→duration
   map (constant pen speed, exponent 1) is physically honest but reads as
   uniform: these paths are OUTLINE CONTOURS of the brush strokes, not
   centrelines, so a dot's closed loop is only ~5× shorter than the long
   捺's — and spread over a 2.2s pass that put every stroke inside a fifth
   of a second, below the threshold where the eye can tell them apart
   (user report: 「長筆畫、短筆畫還是一樣時長」). Weighting by
   length^1.6 stretches that 5× spread to ~15× — dots flick, long sweeps
   are drawn deliberately, which is how a hand actually writes — and the
   longer PASS_TOTAL_S gives the difference room to be seen. PASS_MIN_S
   floors the smallest contour so it strokes rather than pops (it makes
   the pass slightly longer than nominal; that's the cheap direction to
   be wrong in). */
const PASS_TOTAL_S = 7
const PASS_OVERLAP = 0.12
const PASS_CONTRAST = 1.6
const PASS_MIN_S = 0.25

/* Build the Manifesto watermark from the brand logo's paths — the one
   source of the 漢 outline. The logo paths are stroke-ordered (baked by
   gen_partials.py), so the array index IS the draw order (--i). */
const buildWatermark = () => {
  const $outline = document.querySelector('.Manifesto .Outline')
  const $glyph = document.querySelector('.BrandGlyph')
  if (!$outline || !$glyph || $outline.querySelector('svg')) return
  const $svg = document.createElementNS(SVGNS, 'svg')
  $svg.setAttribute('viewBox', $glyph.getAttribute('viewBox'))
  const $strokes = [...$glyph.querySelectorAll('path')].map(($path, i) => {
    const $stroke = document.createElementNS(SVGNS, 'path')
    $stroke.setAttribute('class', 'Stroke')
    $stroke.setAttribute('style', `--i: ${i}`)
    $stroke.setAttribute('pathLength', '1')
    // `data-pass` is what gate.css hangs the writing animation on — the
    // sheet's own state, NOT the gate's, because the gate can now open
    // mid-pass and keying on `[data-fonts-gate='loading']` would snap the
    // half-written 漢 to fully drawn at the reveal.
    $stroke.setAttribute('data-pass', 'writing')
    $stroke.setAttribute('d', $path.getAttribute('d'))
    $svg.append($stroke)
    return $stroke
  })
  $outline.append($svg)

  // getTotalLength() needs the path in the document — measure after the
  // append, and hand the timing to CSS as per-stroke custom properties
  // (gate.css reads them, with the flat stagger still as its fallback
  // for the no-JS / un-measured path).
  const weights = $strokes.map(($stroke) => $stroke.getTotalLength() ** PASS_CONTRAST)
  const total = weights.reduce((sum, w) => sum + w, 0)
  if (!total) return
  // durations first, then delays as their running sum: the pen can only
  // start a stroke once it has finished the last one (less the overlap)
  const durations = weights.map((w) => Math.max(PASS_MIN_S, (w / total) * PASS_TOTAL_S))
  let at = 0
  $strokes.forEach(($stroke, i) => {
    $stroke.style.setProperty('--pass-dur', `${durations[i].toFixed(3)}s`)
    $stroke.style.setProperty('--pass-delay', `${at.toFixed(3)}s`)
    at += durations[i] * (1 - PASS_OVERLAP)
  })
}

const after = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms))

const fontsSettled = () =>
  Promise.race([
    document.fonts.ready.then(() => undefined),
    after(FONTS_TIMEOUT_MS),
  ])

/* First pass: resolves with the stroke paths once the fast pass has
   fully played (DOM order = stroke order, so the last path finishes
   last), or with null when no pass will ever run (reduced-motion, no
   watermark). The animation starts at first PAINT; this module starts
   at DCL — on a slow network the pass may already be over when we
   wake, its animationend fired into the void (found on real 3G), so a
   `finished` animation counts as the completed pass. */
/* Backstop for a pass that never runs at all. `animationend` only fires if
   the animation STARTED, and a subtree whose rendering is skipped runs no
   animations — `content-visibility: auto` on the hero did exactly that on any
   reload that restored a mid-page scroll (frame.css now exempts `.Manifesto`,
   and a backgrounded tab can still throttle the pass away). Without this the
   promise hangs for the life of the page: `data-pass` never comes off the
   strokes and `data-han-traced` is never stamped, so station①'s envelope
   stays folded (envelope.css). Resolving late is harmless — the sheet lands
   on its settled `animation: none` frame, a fully written 漢, which is where
   the pass was headed anyway. Well clear of the longest legitimate pass
   (PASS_TOTAL_S plus the per-stroke floors plus the 0.7s head start). */
const PASS_BACKSTOP_MS = 12_000

const firstPass = () =>
  new Promise((resolve) => {
    const $strokes = Array.from(
      document.querySelectorAll('.Manifesto .Outline .Stroke'),
    )
    const $finalStroke = $strokes.at(-1)
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!$finalStroke || reduced) return resolve(null)
    const done = () => resolve($strokes)
    if ($finalStroke.getAnimations().some((a) => a.playState === 'finished')) {
      done()
    } else {
      $finalStroke.addEventListener('animationend', done, { once: true })
      setTimeout(done, PASS_BACKSTOP_MS)
    }
  })

/* The encore sheet — the SECOND, darker pass. Every stroke is cloned into
   a `[data-encore]` layer that redraws on top of the (holding) first
   sheet. All brushes land AT ONCE: every stroke draws at the same pen
   speed, so each clone's duration scales with its real path length
   (--encore-dur) and the longest stroke — the round's metronome — takes
   ENCORE_ROUND_S. Short strokes finish early and hold (fill: both).

   Born IDLE. The sheet is driven by its own `data-encore` value, NOT by
   the gate's state, because it has to be able to draw on both sides of
   the gate opening (see the two paths in initFontsGate): '' = fully
   drawn, dark, transparent; 'drawing' = one round; back to '' = fade out
   into the pale first sheet. gate.css owns every timing. */
const ENCORE_ROUND_S = 3.8

const buildEncore = ($strokes) => {
  const $svg = $strokes[0].ownerSVGElement
  // getTotalLength() reports true user-space length — the pathLength
  // ="1" normalization (dash bookkeeping) doesn't touch it.
  const lengths = $strokes.map(($stroke) => $stroke.getTotalLength())
  const longest = Math.max(...lengths)
  const $sheet = $strokes.map(($stroke, i) => {
    const $clone = $stroke.cloneNode()
    $clone.setAttribute('data-encore', '')
    $clone.style.setProperty(
      '--encore-dur',
      `${((lengths[i] / longest) * ENCORE_ROUND_S).toFixed(3)}s`,
    )
    $svg.append($clone)
    return $clone
  })
  return { $sheet, $metronome: $sheet[lengths.indexOf(longest)] }
}

const setEncore = ({ $sheet }, state) =>
  $sheet.forEach(($stroke) => $stroke.setAttribute('data-encore', state))

const rewind = ({ $sheet }) =>
  $sheet.forEach(($stroke) =>
    $stroke.getAnimations().forEach((animation) => {
      animation.currentTime = 0
    }),
  )

/* Slow path — fonts still in flight when the first pass ends, so the dark
   sheet becomes the loading indicator: round after round until the fonts
   leg settles. Resolves at the first round boundary past that, so the
   sheet is always a fully written 漢 when the gate opens. */
const encoreUntilSettled = (encore, fonts) =>
  new Promise((resolve) => {
    encore.$metronome.addEventListener('animationend', () =>
      fonts.settled ? resolve() : rewind(encore),
    )
    setEncore(encore, 'drawing')
  })

/* One dark pass, start to finish, then retire into the pale sheet. */
const performEncore = (encore) =>
  new Promise((resolve) => {
    encore.$metronome.addEventListener('animationend', resolve, { once: true })
    setEncore(encore, 'drawing')
  }).then(() => setEncore(encore, ''))

const COPY_REVEAL_S = 1.1   // manifesto-rise .6s + the last stagger .32s + slack

const initFontsGate = () => {
  // Build the watermark first — the ceremony (and the settled hero
  // decoration) both need it, and only JS knows the logo's paths now.
  buildWatermark()

  const $root = document.documentElement
  if ($root.dataset.fontsGate !== 'loading') {
    // no ceremony to wait for — release the trace-keyed decorations too
    $root.dataset.hanTraced = ''
    return Promise.resolve()
  }

  const fonts = { settled: false }
  const fontsLeg = fontsSettled().then(() => {
    fonts.settled = true
  })

  // Both held outside the chain: the hard-cap escape has to be able to
  // retire the sheet, and the reveal branch reads whether it has performed.
  let encore = null
  let looped = false
  // Non-null only while the dark sheet is looping as the loading
  // indicator; that's the one thing allowed to hold the gate shut past
  // the fonts' arrival, and only to the end of the round in flight.
  let round = null

  /* The pale sheet lands. The dark sheet is built here (not earlier: it's
     a clone of the finished paths) and, if the fonts are STILL out, takes
     over as the loading indicator. `data-pass` comes off so the settled
     `animation: none` rule owns the sheet from here on — the animation
     held it fully drawn, and dropping it reverts to the same frame. */
  const firstSheet = firstPass().then(($strokes) => {
    // The pale pass's final stroke is a beat other decorations key on:
    // station ①'s envelope rises out of the fold when the tracing ends
    // (station-semantics.css, `html[data-han-traced]`). Stamped on the
    // no-pass paths too (reduced-motion / no watermark resolve null,
    // immediately), so nothing downstream waits forever.
    $root.dataset.hanTraced = ''
    if (!$strokes) return null          // reduced-motion / no watermark
    $strokes.forEach(($stroke) => $stroke.removeAttribute('data-pass'))
    encore = buildEncore($strokes)
    if (!fonts.settled) {
      looped = true
      round = encoreUntilSettled(encore, fonts)
    }
    return $strokes
  })

  /* THE COPY WAITS FOR THE FONTS, NOT FOR THE INK (owner spec,
     2026-07-27b). The gate opens the moment the fonts settle — even
     mid-pass, with the outline still writing itself behind the text; the
     ink is decoration and has all the time in the world. The single
     exception is a dark round in flight: it IS the loading indicator, so
     it always paints to its end and the copy comes up on a whole 漢.
     (`round` is only ever set in the branch where the fonts were still
     out at the pale sheet's end, i.e. exactly when an indicator exists.) */
  return Promise.race([
    fontsLeg.then(() => round ?? undefined),
    after(HARD_CAP_MS),
  ]).then(() => {
    $root.dataset.fontsGate = 'ready'
    // Already performed as the indicator → it retires with the reveal, the
    // dark ink fading out as the copy rises.
    if (looped) return void (encore && setEncore(encore, ''))
    // Never seen → it still owes us its pass. Wait for BOTH the pale sheet
    // to land and the copy to finish flying in, whichever is later; the
    // gate promise deliberately doesn't wait for any of this, or home.js's
    // post-reveal boot would queue up behind a decoration.
    Promise.all([firstSheet, after(COPY_REVEAL_S * 1_000)]).then(
      ([$strokes]) => $strokes && encore && performEncore(encore),
    )
  })
}

/* Self-starting singleton. This module is mounted by its OWN
   <script type="module"> in _home.html, and deliberately FIRST in the
   script list: module scripts execute in document order, so behind
   han.js/home.js it would inherit their whole import graph's network
   wait (measured seconds on 3G) — but the metronome must wake near
   the first pass's end (~1.34s after first paint) to start the encore
   on beat. home.js imports this same URL — the browser dedupes
   modules, so both see the one promise. Module scripts run deferred,
   at DCL: the watermark DOM is parsed by then. */
export const gateOpened = initFontsGate()
