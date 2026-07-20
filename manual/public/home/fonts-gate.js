/**
 * fonts-gate.js — release the pre-paint fonts gate (`_home.html` stamp
 * + home.css § Fonts gate). Exports the singleton `gateOpened` promise
 * so home.js can chain post-reveal work (initReveal).
 *
 * Release = MAX of the two legs — a stroke pass, once begun, always
 * paints to its end before the copy appears:
 *   • fonts    — document.fonts.ready raced against a hard timeout:
 *     offline or a dead CDN must never strand the page; ugly-after-4s
 *     beats blank (ziano's gate rule).
 *   • passes   — the first fast watermark pass, complete, ALWAYS (also
 *     on cache hits: a font swap always flashes once, a fixed opening
 *     ceremony never does). Fonts ready within that first pass → no
 *     encore, the gate opens at its end. Otherwise the first sheet
 *     HOLDS (it never un-draws) and an encore begins: the strokes are
 *     cloned into a second, darker layer that slowly redraws on top
 *     (~3.9s a round, home.css owns the timing), rewound each round —
 *     JS keeps the beat because CSS alone can't loop a delay-staggered
 *     group in sync. Fonts landing mid-round → the round still paints
 *     to its end, then the gate opens and the encore sheet fades out
 *     (0.15s, home.css). Owner spec, 2026-07-19.
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

const FONTS_TIMEOUT_MS = 4_000
const HARD_CAP_MS = 12_000
const SVGNS = 'http://www.w3.org/2000/svg'

/* Build the Manifesto watermark from the brand logo's paths — the one
   source of the 漢 outline. The logo paths are stroke-ordered (baked by
   gen_partials.py), so the array index IS the draw order (--i). */
const buildWatermark = () => {
  const $outline = document.querySelector('.Manifesto .Outline')
  const $glyph = document.querySelector('.BrandGlyph')
  if (!$outline || !$glyph || $outline.querySelector('svg')) return
  const $svg = document.createElementNS(SVGNS, 'svg')
  $svg.setAttribute('viewBox', $glyph.getAttribute('viewBox'))
  $glyph.querySelectorAll('path').forEach(($path, i) => {
    const $stroke = document.createElementNS(SVGNS, 'path')
    $stroke.setAttribute('class', 'Stroke')
    $stroke.setAttribute('style', `--i: ${i}`)
    $stroke.setAttribute('pathLength', '1')
    $stroke.setAttribute('d', $path.getAttribute('d'))
    $svg.append($stroke)
  })
  $outline.append($svg)
}

const after = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

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
    }
  })

/* Encore: clone every stroke into the [data-encore] sheet (darker,
   home.css) and keep redrawing it round after round. All brushes land
   AT ONCE: every stroke draws at the same pen speed, so each clone's
   duration scales with its real path length (--encore-dur) and the
   longest stroke — the round's metronome — takes ENCORE_ROUND_S.
   Short strokes finish early and hold (fill: both); when the longest
   ends, the whole sheet rewinds and replays in sync. Resolves at the
   first round boundary where the fonts leg has settled — the round in
   flight always paints to its end. */
const ENCORE_ROUND_S = 1.8

const encoreUntilSettled = ($strokes, fonts) =>
  new Promise((resolve) => {
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
    const $metronome = $sheet[lengths.indexOf(longest)]
    $metronome.addEventListener('animationend', () => {
      if (fonts.settled) return resolve()
      $sheet.forEach(($stroke) =>
        $stroke.getAnimations().forEach((animation) => {
          animation.currentTime = 0
        }),
      )
    })
  })

const initFontsGate = () => {
  // Build the watermark first — the ceremony (and the settled hero
  // decoration) both need it, and only JS knows the logo's paths now.
  buildWatermark()

  const $root = document.documentElement
  if ($root.dataset.fontsGate !== 'loading') return Promise.resolve()

  const fonts = { settled: false }
  const fontsLeg = fontsSettled().then(() => {
    fonts.settled = true
  })
  const passesLeg = firstPass().then(($strokes) =>
    $strokes && !fonts.settled ? encoreUntilSettled($strokes, fonts) : undefined,
  )

  return Promise.race([
    Promise.all([fontsLeg, passesLeg]),
    after(HARD_CAP_MS),
  ]).then(() => {
    $root.dataset.fontsGate = 'ready'
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
