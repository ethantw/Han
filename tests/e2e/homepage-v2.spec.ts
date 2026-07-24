import { test, expect } from '@playwright/test'

/**
 * Homepage redesign v2 — the station-plate system, marginalia gate, the
 * constant-dark snippet station, and the reduced-motion reveal guard.
 *
 * Contract: docs/plans/homepage-v2-implementation.md. These are smoke-level
 * structural checks (not pixel baselines): the seven content stations each
 * carry a watermark glyph (語／字／行／段／層／格／碼) rendered from `data-wm`;
 * the var-name marginalia is a ≥68rem-only rail (hidden where it would only
 * repeat names); station 柒・引用碼 sits on a CONSTANT-dark ground in BOTH
 * page themes; and reveal.js must hand every station its `[data-revealed]`
 * hook immediately under a reduced-motion preference (settled state, no
 * animation), so nothing is ever left hidden.
 */

// The seven `.Station` sections in document order — Closing (data-wm="漢") is
// a `.Closing`, not a `.Station`, so it is deliberately excluded.
const STATION_WM = ['語', '字', '行', '段', '層', '格', '碼']

test('the seven stations each carry a watermark glyph 語字行段層格碼', async ({ page }) => {
  await page.goto('/')

  const stations = page.locator('main.han .Station[data-wm]')
  await expect(stations).toHaveCount(7)

  const marks = await stations.evaluateAll((els) =>
    els.map((el) => el.getAttribute('data-wm')),
  )
  expect(marks).toEqual(STATION_WM)
})

test('station 柒・引用碼 sits on a constant-dark ground in the LIGHT theme', async ({ page }) => {
  await page.goto('/')

  // Page defaults to light (no dark-mode checkbox) …
  await expect(page.locator('input[name="dark-mode"]')).not.toBeChecked()

  // … yet the snippet station is constant-dark: `color-scheme: dark`
  // re-resolves its light-dark() tokens, so its ground is the ink primitive
  // (--color-ink = #0e0e10) regardless of the page theme.
  const snippet = page.locator('#station-snippet')
  await expect(snippet).toHaveCSS('color-scheme', 'dark')
  await expect(snippet).toHaveCSS('background-color', 'rgb(14, 14, 16)')
})

test('reduced-motion: every station is revealed immediately (settled, not animated)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  // reveal.js guards on reduced-motion: it stamps [data-revealed] on all
  // targets up-front (skipping the IntersectionObserver), so the hero and
  // every station are in their settled — fully visible — state at once,
  // without scrolling.
  const revealed = page.locator('main.han .Station[data-revealed]')
  await expect(revealed).toHaveCount(7)
  await expect(page.locator('.Manifesto[data-revealed]')).toHaveCount(1)

  // a below-the-fold station is visible without ever scrolling to it
  await expect(page.locator('#station-snippet')).toBeVisible()
})

test('station 伍・工法: the container-scope demo really re-skins the 著重號', async ({ page }) => {
  await page.goto('/')

  // Two identical samples; the second cell's WRAPPER carries an inline
  // `--han-em-symbol: sesame`, the first inherits the :root default (circle).
  // The custom property inherits down to each cell's <em>, so han-semantics'
  // `text-emphasis: var(--han-em-symbol)` renders sesame dots on the second
  // and circles on the first — one container variable, no markup change.
  const cells = page.locator('#station-craft .ScopeCompare .Sample')
  await expect(cells).toHaveCount(2)

  const symOf = (i: number) =>
    cells.nth(i).evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--han-em-symbol').trim(),
    )

  expect(await symOf(0)).toBe('circle')
  expect(await symOf(1)).toBe('sesame')
})

test('station 伍・工法: the four layer chips carry build-computed gzip sizes', async ({ page }) => {
  await page.goto('/')

  // Each of the four cascade-layer chips (han-semantics/-lines/-prose/-fonts)
  // rides a <small> with its gzipped weight, baked by vite's
  // computeModuleLedger — proving the per-module dist files were found and
  // measured (a missing file would render '—', not a 'N.Nk' figure).
  const sizes = page.locator('#station-craft .LayerMap li small')
  await expect(sizes).toHaveCount(4)

  const texts = await sizes.allInnerTexts()
  for (const text of texts) {
    const t = text.trim()
    expect(t).not.toBe('—')
    expect(t).toMatch(/^\d+(\.\d+)?k$/)
  }
})
