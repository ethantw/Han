import { test, expect } from '@playwright/test'

/**
 * Homepage redesign v2 — the station-plate system, marginalia gate, the
 * constant-dark snippet station, and the reduced-motion reveal guard.
 *
 * Contract: docs/plans/homepage-v2-implementation.md. These are smoke-level
 * structural checks (not pixel baselines): the content stations carry a
 * watermark glyph rendered from `data-wm` — six of the seven, since
 * station②・字體排印 hands its corner to the lead-type forme instead;
 * the var-name marginalia is a ≥68rem-only console (hidden where it would only
 * repeat names); station 柒・引用碼 sits on a CONSTANT-dark ground in BOTH
 * page themes; and reveal.js must hand every station its `[data-revealed]`
 * hook immediately under a reduced-motion preference (settled state, no
 * animation), so nothing is ever left hidden.
 */

// The seven stations in document order — Closing (data-wm="漢") is not a
// `[data-station]`, so it is deliberately excluded. station②・字體排印 carries
// NO watermark: its corner belongs to the lead-type forme (lead-forme.css
// § corner), so the glyph list has six entries for seven stations.
const STATION_WM = ['語', '行', '段', '層', '格', '碼']

test('the stations carry their watermark glyphs 語行段層格碼 (station② has none)', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('main [data-station]')).toHaveCount(7)
  await expect(page.locator('main #station-fonts[data-wm]')).toHaveCount(0)

  const stations = page.locator('main [data-station][data-wm]')
  await expect(stations).toHaveCount(6)

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
  const revealed = page.locator('main [data-station][data-revealed]')
  await expect(revealed).toHaveCount(7)
  await expect(page.locator('.Manifesto[data-revealed]')).toHaveCount(1)

  // a below-the-fold station is visible without ever scrolling to it
  await expect(page.locator('#station-snippet')).toBeVisible()
})

test('station 伍・工法: the addition prices every part, measured', async ({ page }) => {
  await page.goto('/')

  // Four style rows ＋ the delivery-mode script rows, all figures baked by
  // vite (computeModuleLedger for the CSS, dist/pass-sizes.json for the
  // floor) — a missing dist file would render '—', not a 'N.NKB' figure.
  const table = page.locator('#station-craft .Sum table')
  await expect(table).toHaveCount(1)

  // Line items are grouped now — CSS, then han.js — so each group opens with
  // a `<th scope="rowgroup">` row that carries no figures.
  await expect(table.locator('.GroupHead th')).toHaveText(['CSS', 'han.js'])
  const styleRows = table.locator('tbody[data-group="css"] tr:not(.GroupHead)')
  await expect(styleRows).toHaveCount(4)
  expect(await styleRows.locator('th').allInnerTexts())
    .toEqual(['han-semantics', 'han-lines', 'han-prose', 'han-fonts'])

  // Three columns a row — raw, brotli, gzip — and compression has to make
  // the file smaller, or the columns were measured against different files.
  for (const row of await styleRows.all()) {
    const [raw, br, gz] = (await row.locator('td').allInnerTexts())
      .map((t) => Number(t.trim().match(/^(\d+(?:\.\d+)?)KB$/)?.[1]))
    expect(raw).toBeGreaterThan(br)
    expect(gz).toBeGreaterThanOrEqual(br)
  }

  // The console's default is `auto`, so the auto row is the visible script
  // line and the manual-mode rows are not part of this build at all.
  await expect(table.locator('tr[data-js-row="auto"]')).toBeVisible()
  await expect(table.locator('tr[data-js-row="floor"]')).toBeHidden()
  await expect(table.locator('tr[data-js-row="pass"]')).toHaveCount(5)

  // The footing is the sum of the visible column, to the printed precision.
  const kb = async (loc) =>
    (await loc.allInnerTexts()).map((t) => Number(t.trim().replace('KB', '')))
  const styles = await kb(styleRows.locator('td:nth-child(3)'))
  const [autoBr] = await kb(table.locator('tr[data-js-row="auto"] td:nth-child(3)'))
  const [total] = await kb(table.locator('tfoot [data-total="brotli"]'))
  const cssKb = styles.reduce((a, b) => a + b, 0)
  expect(total).toBeCloseTo(cssKb + autoBr, 5)

  // …and the caption's MathML says the same thing as one line. Same numbers,
  // same source — if these two ever disagree the plate is lying twice.
  // `textContent`, not `innerText`: these are MathML `<mn>`s, and a
  // MathMLElement has no innerText.
  const eq = async (name) =>
    Number((await page.locator(`#station-craft [data-sum="${name}"]`)
      .evaluate((el) => el.textContent)).trim().replace('KB', ''))
  expect(await eq('css')).toBeCloseTo(cssKb, 5)
  expect(await eq('js')).toBeCloseTo(autoBr, 5)
  expect(await eq('all')).toBeCloseTo(total, 5)
})

test('station 伍・工法: 例5.1 is a cascade stack over real library rules', async ({ page }) => {
  await page.goto('/')

  const items = page.locator('#station-craft .SelRing > li')
  await expect(items).toHaveCount(5)

  // Each item is a PAIR — han.css's rule and the reader's — and every weight
  // is build-computed from the selector text beside it
  // (manual/_specificity.js), never typed in, so it cannot drift.
  const specs = await items
    .locator('[data-role="framework"] code[data-spec]')
    .evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.spec))
  expect(specs).toEqual(['(0,2,2)', '(0,0,2)', '(0,2,1)', '(0,1,2)', '(0,2,0)'])

  // The reader's selector must actually outrank zero in every pair — the
  // claim the whole plate is making.
  const mine = await items
    .locator('[data-role="mine"] code[data-mine-spec]')
    .evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.mineSpec))
  expect(mine).toHaveLength(5)
  for (const m of mine) expect(m).not.toBe('(0,0,0)')

  // The framework declaration is struck through — it lost, and that is the
  // signal a devtools reader already knows how to read.
  await expect(
    items.first().locator('[data-role="framework"] .RuleDecl'),
  ).toHaveCSS('text-decoration-line', 'line-through')

  // Reader-driven: the nav is hidden in the markup and only carousel.js
  // unhides it, so a no-JS page never offers a button that does nothing.
  const next = page.locator('#station-craft [data-sel-step="1"]')
  await expect(next).toBeVisible()
  const shown = page.locator('#station-craft .SelRing > li[data-current]')
  await expect(shown).toHaveCount(1)

  // …and BOTH printed triples travel with the pair.
  const framework = page.locator('#station-craft [data-spec-out]').first()
  const yours = page.locator('#station-craft [data-mine-out]').first()
  await expect(framework).toHaveText('(0,2,2)')
  await expect(yours).toHaveText('(0,1,1)')
  await next.click()
  await expect(framework).toHaveText('(0,0,2)')
  await expect(yours).toHaveText('(0,0,2)')
})

test('station 伍・工法: the font ledger is a second, separate set of books', async ({ page }) => {
  await page.goto('/')

  // The webfont figures are constants (the fonts live on the CDN, not in
  // this repo — see the markup comment), so this only guards the SHAPE: the
  // ledger stays out of the framework's four-card figure, and every cell is
  // a real 'N.Nk' / 'N.NNM' / slice-count figure rather than an empty
  // placeholder left behind by a mustache token that never resolved.
  const ledger = page.locator('#station-craft .FontLedger')
  await expect(ledger.locator('table')).toHaveCount(3)
  await expect(ledger.locator('tbody tr')).toHaveCount(8 + 4 + 3)

  const figures = await ledger.locator('tbody td').allInnerTexts()
  expect(figures.length).toBe(8 * 3 + 4 * 2 + 3)
  for (const text of figures) expect(text.trim()).toMatch(/^\d+(\.\d+)?(KB|MB)$|^\d+(×\d+)?$/)

  // …and the framework's own addition never quotes a font weight — the two
  // sets of books stay separate, which is the reason there are two.
  const sumCells = await page.locator('#station-craft .Sum td').allInnerTexts()
  expect(sumCells.some((t) => t.includes('MB'))).toBe(false)
})

test('station 伍・工法: the addition follows the console, auto ⇄ manual', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => 'pgReady' in document.documentElement.dataset)

  const table = page.locator('#station-craft .Sum table')
  const kb = async (loc) =>
    (await loc.allInnerTexts()).map((t) => Number(t.trim().replace('KB', '')))
  const total = async () => (await kb(table.locator('tfoot [data-total="brotli"]')))[0]

  const before = await total()

  // Drop two style modules, straight through the console's own controls —
  // this station never writes config, it only reflects it.
  const set = (key: string, value: string | boolean) =>
    page.evaluate(([k, v]) => {
      const root = document.querySelector('han-console')!.shadowRoot!
      const $c = root.querySelector<HTMLInputElement>(`[data-cfg-key="${k}"]`)!
      if (typeof v === 'boolean') $c.checked = v
      else $c.value = v as string
      $c.dispatchEvent(new Event('input', { bubbles: true }))
    }, [key, value] as const)

  await set('prose', false)
  await set('fonts', false)
  await expect(table.locator('tbody:first-of-type tr[data-off]')).toHaveCount(2)
  await expect(table.locator('tr[data-cfg="prose"][data-off]')).toHaveCount(1)
  expect(await total()).toBeLessThan(before)

  // Switch to 自選函式 — the auto row leaves the plate and the floor plus the
  // per-function rows take over. This is the addition the plan is for: the
  // floor is its own line, so no reader mistakes a marginal for the price.
  await set('jsMode', 'manual')
  await expect(table.locator('tr[data-js-row="auto"]')).toBeHidden()
  await expect(table.locator('tr[data-js-row="floor"]')).toBeVisible()
  const ticked = table.locator('tr[data-js-row="pass"]:not([data-off])')
  await expect(ticked).toHaveCount(3)   // punctuation / iss / adjacentLines

  // The column has to ADD UP — that is why pass-sizes.json bundles every
  // selection for real instead of summing marginals.
  const parts = [
    ...(await kb(table.locator('tbody[data-group="css"] tr:not([data-off]) td:nth-child(3)'))),
    ...(await kb(table.locator('tr[data-js-row="floor"] td:nth-child(3)'))),
    ...(await kb(ticked.locator('td:nth-child(3)'))),
  ]
  expect(await total()).toBeCloseTo(parts.reduce((a, b) => a + b, 0), 5)

  // Unticking a pass must make the build smaller — the claim the whole
  // manual mode exists to support.
  const manualAll = await total()
  await set('fn.punctuation', false)
  await expect(table.locator('tr[data-pass="punctuation"][data-off]')).toHaveCount(1)
  expect(await total()).toBeLessThan(manualAll)
})

