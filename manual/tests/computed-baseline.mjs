/**
 * Computed-style baseline for the homepage CSS refactor.
 *
 * The refactor (docs/plans/home-css-station-ownership.md) moves rules between
 * files without changing what they say. The check that proves that is not a
 * screenshot — the homepage is one long entrance animation and a pixel diff
 * would be red every run — it's the COMPUTED VALUE of every element under
 * `<main>`, which must come out identical after each move.
 *
 * Eight variants: light/dark × 橫排/直排 × 1280/390 wide.
 *
 * Animations are frozen before reading, not disabled: `prefers-reduced-motion`
 * has its own CSS branches on this page, so emulating it would measure the
 * branch the reader mostly doesn't see. Instead every animation is paused at
 * its END (finite) or at time 0 (infinite — station③'s breath), which is the
 * settled state the copy is read in.
 *
 * Usage (from the repo root, after `pnpm --filter han-manual build`):
 *
 *   node manual/tests/computed-baseline.mjs --out before.json
 *   node manual/tests/computed-baseline.mjs --out after.json
 *   node manual/tests/computed-baseline.mjs --diff before.json after.json
 *
 * Writes to `manual/tests/.baseline/` (gitignored) when --out is a bare name.
 */

import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..')
const OUT_DIR = path.join(ROOT, 'manual', 'tests', '.baseline')
const PORT = 5274 // not 5273 — leave the e2e server's port alone
const BASE_URL = `http://localhost:${PORT}`

/* The properties the refactor could plausibly break: everything inheritable
 * (step 5 deletes inherited re-declarations) plus the box, so a rule that
 * silently stops matching after a move shows up as a geometry change. */
const PROPS = [
  'font-family',
  'font-size',
  'line-height',
  'font-weight',
  'font-style',
  'letter-spacing',
  'text-align',
  'color',
  'background-color',
  'display',
  'margin-block-start',
  'margin-block-end',
  'margin-inline-start',
  'margin-inline-end',
  'padding-block-start',
  'padding-block-end',
  'padding-inline-start',
  'padding-inline-end',
  'border-block-start-width',
  'border-block-end-width',
  'border-inline-start-width',
  'border-inline-end-width',
  'opacity',
  'writing-mode',
]

const VARIANTS = [
  { name: 'light-h-wide',   theme: 'light', writing: 'horizontal', width: 1280 },
  { name: 'light-h-narrow', theme: 'light', writing: 'horizontal', width: 390 },
  { name: 'light-v-wide',   theme: 'light', writing: 'vertical',   width: 1280 },
  { name: 'light-v-narrow', theme: 'light', writing: 'vertical',   width: 390 },
  { name: 'dark-h-wide',    theme: 'dark',  writing: 'horizontal', width: 1280 },
  { name: 'dark-h-narrow',  theme: 'dark',  writing: 'horizontal', width: 390 },
  { name: 'dark-v-wide',    theme: 'dark',  writing: 'vertical',   width: 1280 },
  { name: 'dark-v-narrow',  theme: 'dark',  writing: 'vertical',   width: 390 },
]

// ── page-side collector (runs in the browser) ────────────────────────────

/* Every element under <main> gets a positional key — `main>2.section#station-
 * lines>0.hgroup>1.p` — built from the child index plus tag/id/class. The DOM
 * doesn't change in this refactor, so the key is stable; the class list is in
 * there to make a diff line readable without opening devtools. */
const collect = (props) => {
  const key = ($el) => {
    const parts = []
    for (let $n = $el; $n && $n.tagName !== 'BODY'; ) {
      const $parent = $n.parentElement
      const i = $parent ? [...$parent.children].indexOf($n) : 0
      const id = $n.id ? `#${$n.id}` : ''
      const cls = $n.classList.length ? `.${[...$n.classList].join('.')}` : ''
      parts.unshift(`${i}.${$n.tagName.toLowerCase()}${id}${cls}`)
      // Climb out of a shadow root through its host, so a shadow key can
      // never collide with a light-DOM one.
      if (!$parent) {
        const $host = $n.getRootNode()?.host
        if (!$host) break
        parts.unshift('⟨shadow⟩')
        $n = $host
      } else $n = $parent
    }
    return parts.join('>')
  }

  const out = {}
  /* The wordmark's stroke ceremony builds and tears down its own <path>s, so
     the SVG's child COUNT differs run to run (measured: 12 vs 24). Nothing
     inside it is styled by the sheets this refactor touches — record the host
     span, skip the subtree, and the tool stays deterministic. */
  const $skip = [...document.querySelectorAll('.Outline svg')]
  const skipped = ($el) => $skip.some(($s) => $s.contains($el))

  /* The whole light DOM, not just `<main>`: the Topbar is `body > header` and
     the refactor moves rules that reach it. Shadow roots are walked too —
     `common/controls.css` is adopted by <han-console>'s shadow, so a move
     there has to be provable as well. */
  const walk = function* ($root) {
    for (const $el of $root.querySelectorAll('*')) {
      yield $el
      if ($el.shadowRoot) yield* walk($el.shadowRoot)
    }
  }

  for (const $el of walk(document.body)) {
    if (skipped($el)) continue
    // Shadow hosts: the component owns its interior, and the plan does not
    // touch components/. Record the host box, skip inside.
    const cs = getComputedStyle($el)
    const rect = $el.getBoundingClientRect()
    const row = {}
    for (const p of props) row[p] = cs.getPropertyValue(p)
    // One decimal, not two: SVG <text> advance widths jitter in the last
    // hundredth between runs (measured on the mark diagram, 201.6 vs 201.59)
    // and that noise would show up in every diff from here on.
    row['@rect'] = [rect.width, rect.height].map((n) => Math.round(n * 10) / 10).join('×')
    out[key($el)] = row
  }
  return out
}

/* Park every animation at the state the copy is actually read in. */
const freezeAnimations = () => {
  for (const a of document.getAnimations()) {
    const timing = a.effect?.getComputedTiming?.() ?? {}
    // Infinite (station③'s breath, the loaders) has no end to sit at — 0 is
    // the only reproducible point on the timeline.
    if (timing.iterations === Infinity || !Number.isFinite(timing.endTime)) {
      a.pause()
      a.currentTime = 0
      continue
    }
    // `endTime`, not `activeDuration`: currentTime runs from the start of the
    // DELAY, so seeking to activeDuration on a delayed animation lands mid-
    // flight (caught it: a variable-weight <dfn> settling at 670.75 instead
    // of 700). finish() does the right arithmetic for us.
    a.finish()
    a.pause()
  }
}

// ── driver ───────────────────────────────────────────────────────────────

const serve = () =>
  new Promise((resolve, reject) => {
    const proc = spawn('node', ['build/serve.js'], {
      cwd: ROOT,
      env: { ...process.env, PORT: String(PORT) },
      stdio: ['ignore', 'pipe', 'inherit'],
    })
    proc.stdout.on('data', (b) => {
      if (String(b).includes(String(PORT))) resolve(proc)
    })
    proc.on('error', reject)
    setTimeout(() => resolve(proc), 3000) // serve.js may not announce
  })

const snapshot = async (browser, variant) => {
  const context = await browser.newContext({
    viewport: { width: variant.width, height: 900 },
    deviceScaleFactor: 1,
  })
  // Seed the theme before first paint, the same way a returning reader would
  // arrive — the pre-paint script in _home.html reads this key.
  await context.addInitScript(
    `try { localStorage.setItem('theme', ${JSON.stringify(variant.theme)}) } catch (e) {}`,
  )
  const page = await context.newPage()
  await page.goto(BASE_URL, { waitUntil: 'load' })

  // The fonts gate holds the copy hidden; everything downstream (reveal
  // stamps, the playground boot) is queued behind it.
  await page.waitForFunction(() => document.documentElement.dataset.fontsGate === 'ready')
  await page.waitForFunction(() => 'pgReady' in document.documentElement.dataset)
  await page.evaluate(() => document.fonts.ready)

  /* 直排 is stamped straight onto `main` — the hook every vertical CSS branch
     keys on (`main[data-writing="vertical"]`). Not via the floating pill:
     its markup (`[data-writing-switch]`) is gone from `_home.html`, so
     `home/writing-switch.js` is a no-op today and the only way left to reach
     those branches is the attribute itself. Also recorded in the plan. */
  if (variant.writing === 'vertical')
    await page.evaluate(() => {
      document.querySelector('main').dataset.writing = 'vertical'
    })

  // Tour the page so every station gets its [data-revealed] stamp, then go
  // back to the top so sticky/scroll-linked geometry reads the same each run.
  await page.evaluate(async () => {
    // scrollIntoView per target, not a scrollTo ladder down the Y axis: in
    // 直排 the page scrolls on the INLINE axis and a Y ladder never moves it,
    // so every station would need force-stamping instead of revealing (and a
    // force-stamped station is captured before its settle animations have
    // even been created — measured, they come out at their start values).
    for (const $t of document.querySelectorAll('.Manifesto, [data-station]')) {
      $t.scrollIntoView({ block: 'center', inline: 'center' })
      await new Promise((r) => setTimeout(r, 90))
    }
    scrollTo(0, 0)
    await new Promise((r) => setTimeout(r, 600))
  })
  /* Force-stamp whatever the tour couldn't reach, and say so. At 390px the
     three tallest stations never reveal on their own — reveal.js's default
     cue is `threshold: 0.1`, and a target 17,000px tall in a 900px viewport
     tops out at an intersection ratio of 0.053, so the observer never fires
     and `[data-station] > * { opacity: 0 }` stands forever (station-frame.css
     § reveal). That is a real page bug, not a measurement artefact; it is
     recorded in docs/plans/home-css-station-ownership.md. Here we stamp past
     it so all eight variants measure the same SETTLED state. */
  const forced = await page.evaluate(() =>
    [...document.querySelectorAll('main [data-station]:not([data-revealed])')].map(($s) => {
      $s.setAttribute('data-revealed', '')
      return $s.id
    }),
  )
  if (forced.length) console.log(`     ↑ force-revealed: ${forced.join(', ')}`)
  // let the one-shot transitions run out before freezing
  await page.waitForTimeout(700)

  await page.evaluate(freezeAnimations)
  const data = await page.evaluate(collect, PROPS)
  await context.close()
  return data
}

const run = async (outArg) => {
  const out = path.isAbsolute(outArg) || outArg.includes('/') ? outArg : path.join(OUT_DIR, outArg)
  mkdirSync(path.dirname(out), { recursive: true })
  const server = await serve()
  const browser = await chromium.launch()
  const all = {}
  try {
    for (const v of VARIANTS) {
      all[v.name] = await snapshot(browser, v)
      console.log(`  ${v.name.padEnd(16)} ${Object.keys(all[v.name]).length} elements`)
    }
  } finally {
    await browser.close()
    server.kill()
  }
  writeFileSync(out, JSON.stringify(all, null, 1))
  console.log(`→ ${out}`)
}

const diff = (aPath, bPath) => {
  const read = (p) => JSON.parse(readFileSync(path.isAbsolute(p) || p.includes('/') ? p : path.join(OUT_DIR, p), 'utf8'))
  const [a, b] = [read(aPath), read(bPath)]
  let changed = 0
  for (const variant of Object.keys(a)) {
    const lines = []
    const keys = new Set([...Object.keys(a[variant] ?? {}), ...Object.keys(b[variant] ?? {})])
    for (const k of keys) {
      const [ra, rb] = [a[variant]?.[k], b[variant]?.[k]]
      if (!ra) { lines.push(`  + ${k}`); continue }
      if (!rb) { lines.push(`  - ${k}`); continue }
      for (const p of Object.keys(ra))
        if (ra[p] !== rb[p]) lines.push(`  ~ ${k}\n      ${p}: ${ra[p]}  →  ${rb[p]}`)
    }
    changed += lines.length
    if (lines.length) console.log(`\n${variant} (${lines.length})\n${lines.join('\n')}`)
  }
  console.log(changed ? `\n${changed} differences` : '\nidentical')
  process.exitCode = changed ? 1 : 0
}

const args = process.argv.slice(2)
if (args[0] === '--diff') diff(args[1], args[2])
else if (args[0] === '--out') await run(args[1])
else {
  console.error('usage: --out <file> | --diff <before> <after>')
  process.exitCode = 2
}
