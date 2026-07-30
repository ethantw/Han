import { test, expect, type Page } from '@playwright/test'

/**
 * The lead-type forme's entrance cue.
 *
 * Station② is three screenfuls (三體樣張 · 鉛字盤 · 標點), so the station-wide
 * `[data-revealed]` stamp fires while the reader is still on the specimen card
 * — the drop ceremony would be over before the forme scrolled into view. The
 * figure opts into a later cue with `data-reveal-at="0.6"` (reveal.js) and
 * gates its own animation on its own stamp (lead-forme.css § entrance).
 *
 * What's asserted is the RULE, not a scroll position: the stamp lands when
 * three fifths of `min(forme, fold)` is on screen — of the forme when it
 * fits, of the fold when it doesn't. Both cases are covered, because they take
 * different branches in reveal.js and the fold case is the one a plain
 * IntersectionObserver `threshold` could never express.
 */

const AT = 0.6

/** how much of the forme is on screen, as a fraction of min(forme, fold). */
const seen = (page: Page) =>
  page.locator('.LeadForme').evaluate(($f) => {
    const r = $f.getBoundingClientRect()
    const visible = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0))
    return {
      revealed: $f.hasAttribute('data-revealed'),
      ratio: visible / Math.min(r.height, innerHeight),
      svgOpacity: getComputedStyle($f.querySelector('svg')!).opacity,
    }
  })

/** scroll down in small steps; report the first step where the stamp lands. */
const scrollUntilRevealed = async (page: Page) => {
  for (let y = 0; y < 20_000; y += 25) {
    await page.evaluate((v) => scrollTo(0, v), y)
    await page.waitForTimeout(35)
    const now = await seen(page)
    if (now.revealed) return now
  }
  throw new Error('the forme was never revealed')
}

for (const [width, height, label] of [
  [1600, 1000, 'forme shorter than the fold — three fifths OF IT'],
  [1600, 600, 'forme taller than the fold — three fifths of the FOLD'],
] as const) {
  test(`entrance waits for ${AT * 100}% · ${label}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    await expect(page.locator('.LeadForme .Slug').first()).toBeAttached()

    // built, on the page, and deliberately not shown yet
    const before = await seen(page)
    expect(before.revealed).toBe(false)
    expect(before.svgOpacity).toBe('0')

    const at = await scrollUntilRevealed(page)
    expect(at.svgOpacity).toBe('1')
    // ≥ AT because it fired, and not far past it: the slack is one scroll
    // step, not a station's worth of scrolling. A regression to the station's
    // own cue would fire at a ratio near 0.
    expect(at.ratio).toBeGreaterThanOrEqual(AT - 0.01)
    expect(at.ratio).toBeLessThan(AT + 0.1)
  })
}

test('the pills and the note wait out the whole drop, then fly in', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/')
  await expect(page.locator('.LeadForme .Slug').first()).toBeAttached()

  const chrome = () =>
    page.locator('.LeadForme').evaluate(($f) => {
      const pill = $f.querySelector('.Controls fieldset')!
      const s = getComputedStyle(pill)
      return {
        revealed: $f.hasAttribute('data-revealed'),
        pillOpacity: Number(s.opacity),
        // real form controls: transparent is not enough, they must be out of
        // the tab order until they are actually there
        pillVisibility: s.visibility,
        capOpacity: Number(getComputedStyle($f.querySelector('figcaption')!).opacity),
        // held at the 0% frame through the delay, so this IS the fly-in offset
        capFrom: getComputedStyle($f.querySelector('figcaption')!).translate,
        pillFrom: s.translate,
        slugOpacity: Number(getComputedStyle($f.querySelector('.Slug.has-glyph')!).opacity),
      }
    })

  // before the cue: forme hidden, and so are the tools that operate it
  const before = await chrome()
  expect(before.pillOpacity).toBe(0)
  expect(before.pillVisibility).toBe('hidden')

  await scrollUntilRevealed(page)
  // mid-drop — slugs are arriving, the chrome is still held back
  await page.waitForTimeout(500)
  const during = await chrome()
  expect(during.slugOpacity).toBeGreaterThan(0)
  expect(during.pillOpacity).toBe(0)
  expect(during.pillVisibility).toBe('hidden')
  expect(during.capOpacity).toBe(0)

  // both rise from BELOW — a purely vertical offset, no inline component. The
  // note is 直排 in the pocket and used to slide in off the fore-edge instead;
  // one gesture for the whole chrome is the point, so `translate` is physical.
  for (const from of [during.capFrom, during.pillFrom]) {
    const [x, y] = from.split(' ').map(Number.parseFloat)
    expect(x).toBe(0)
    expect(y).toBeGreaterThan(0)
  }

  // …and once the last slug has landed, both ease in. Polled rather than
  // slept-through: the cue is derived from --lf-last-slug, so a re-laid
  // sentence moves it and a hard-coded wait would rot.
  await expect
    .poll(async () => (await chrome()).pillOpacity, { timeout: 9_000 })
    .toBe(1)
  const after = await chrome()
  expect(after.pillVisibility).toBe('visible')
  expect(after.capOpacity).toBeGreaterThan(0.9)
})

test('the station itself still reveals on the old sliver cue', async ({ page }) => {
  // the forme's later cue is an opt-in on one figure — it must not have moved
  // the stations, whose copy-rise still keys off a sliver of the section.
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/')
  const station = page.locator('#station-type')
  // its TOP edge, not scrollIntoViewIfNeeded — that would scroll a station
  // this tall until its BOTTOM shows, which is the forme's cue too.
  await station.evaluate(($s) => scrollTo(0, $s.getBoundingClientRect().top + scrollY))
  await page.waitForTimeout(200)
  await expect(station).toHaveAttribute('data-revealed', '')
  // …and the forme, only a screenful into a three-screen station, is not yet
  await expect(page.locator('.LeadForme')).not.toHaveAttribute('data-revealed', '')
})
