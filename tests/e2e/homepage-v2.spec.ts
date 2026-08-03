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

test('station 伍・工法: the four layer chips carry build-computed brotli sizes', async ({ page }) => {
  await page.goto('/')

  // Each of the four cascade-layer cards (han-semantics/-lines/-prose/-fonts)
  // carries a <b> with its brotli weight, baked by vite's
  // computeModuleLedger — proving the per-module dist files were found and
  // measured (a missing file would render '—', not a 'N.Nk' figure).
  const sizes = page.locator('#station-craft .LayerMap li b')
  await expect(sizes).toHaveCount(4)

  const texts = await sizes.allInnerTexts()
  for (const text of texts) {
    const t = text.trim()
    expect(t).not.toBe('—')
    expect(t).toMatch(/^\d+(\.\d+)?KB$/)
  }

  // …and each card also prints the module BEFORE brotli, which must be the
  // larger of the two — a raw figure smaller than its compressed twin would
  // mean the two columns were measured against different files.
  const raws = page.locator('#station-craft .LayerMap li small')
  await expect(raws).toHaveCount(4)

  const rawTexts = await raws.allInnerTexts()
  for (const [i, text] of rawTexts.entries()) {
    const kb = Number(text.trim().match(/(\d+(?:\.\d+)?)KB$/)?.[1])
    expect(kb).toBeGreaterThan(Number(texts[i].trim().replace('KB', '')))
  }
})

test('station 伍・工法: the script ledger prices all four JS bundles', async ({ page }) => {
  await page.goto('/')

  // build/library.js emits four bundles — two entry points (han / han.auto)
  // × the two `exports` conditions — and the ledger prices every one of them
  // in both compressions, build-computed like the layer map (a missing
  // dist/*.min.js would render '—').
  const ledger = page.locator('#station-craft .ScriptLedger')
  await expect(ledger.locator('table')).toHaveCount(1)

  // Rows are SOURCE ENTRIES, so han.ts appears in both plates — there is no
  // `src/han.browser.ts`; that file is han.ts compiled under the `browser`
  // condition, and the row's gloss names the artifact each cell emits.
  // Two entries, two artifacts. The browser-condition twins were cut from
  // the table: same code, near-identical weight, and「browser 條件」meant
  // nothing to a reader who has not read the exports map.
  const names = await ledger.locator('tbody th').allInnerTexts()
  expect(names.map((n) => n.split('\n')[0].trim())).toEqual(['han.ts', 'han.auto.ts'])
  const emitted = await ledger.locator('tbody th small').allInnerTexts()
  expect(emitted.map((t) => t.trim().split('・')[0])).toEqual(['→han.js', '→han.auto.js'])

  // three figures a row — before brotli, brotli, gzip — and compression has
  // to actually shrink things: raw > gzip > brotli, every row.
  const rows = ledger.locator('tbody tr')
  await expect(rows).toHaveCount(2)
  for (const row of await rows.all()) {
    const cells = await row.locator('td').allInnerTexts()
    expect(cells).toHaveLength(3)
    const [raw, brotli, gzip] = cells.map((c) => Number(c.trim().replace('KB', '')))
    expect(raw).toBeGreaterThan(gzip)
    expect(gzip).toBeGreaterThan(brotli)
  }
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

  // …and the framework's own cards never quote a font weight.
  await expect(page.locator('#station-craft .LayerMap table')).toHaveCount(0)
})

test('station 伍・工法: both ledgers price whatever the console has checked', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => 'pgReady' in document.documentElement.dataset)

  const totals = () =>
    page.evaluate(() =>
      Object.fromEntries(
        [...document.querySelectorAll('#station-craft [data-total]')].map(($el) => [
          ($el as HTMLElement).dataset.total,
          $el.textContent?.trim(),
        ]),
      ),
    )

  // Default console config: four modules on, `fallbacks` on (han.auto.js),
  // `legacyRuby` off. The server-rendered figures already say so — the line
  // is correct before this module has run a single sum.
  const before = await totals()
  expect(Number(before['all']!.replace('KB', ''))).toBeCloseTo(
    Number(before['css']!.replace('KB', '')) + Number(before['js']!.replace('KB', '')),
    5,
  )
  // `legacyRuby` is off by default, so its row starts greyed — and it is
  // greyed in the SERVER-RENDERED markup too, so the ledger reads right
  // before any script runs.
  await expect(page.locator('#station-craft [data-off]')).toHaveCount(1)
  await expect(page.locator('#station-craft .LayerMap [data-off]')).toHaveCount(0)

  // Drop two modules, add the other bundle, straight through the console's
  // own controls — this station never writes config, it only reflects it.
  await page.evaluate(() => {
    const root = document.querySelector('han-console')!.shadowRoot!
    for (const [key, on] of [['prose', false], ['fonts', false], ['legacyRuby', true]] as const) {
      const $c = root.querySelector<HTMLInputElement>(`[data-cfg-key="${key}"]`)!
      $c.checked = on
      $c.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })

  // the two dropped modules go grey; the han.js row comes back on
  await expect(page.locator('#station-craft [data-off]')).toHaveCount(2)
  await expect(page.locator('#station-craft .LayerMap [data-off]')).toHaveCount(2)
  await expect(page.locator('#station-craft .ScriptLedger [data-off]')).toHaveCount(0)
  await expect(page.locator('#station-craft .LayerMap li[data-cfg="prose"][data-off]')).toHaveCount(1)
  await expect(page.locator('#station-craft .ScriptLedger tr[data-cfg="legacyRuby"][data-off]')).toHaveCount(0)

  // …and the totals follow: styles lose han-prose + han-fonts, scripts gain
  // han.js, and the grand total is still the sum of the two.
  const after = await totals()
  const kb = (t: Record<string, string | undefined>, k: string) => Number(t[k]!.replace('KB', ''))
  expect(kb(after, 'css')).toBeLessThan(kb(before, 'css'))
  expect(kb(after, 'js')).toBeGreaterThan(kb(before, 'js'))
  expect(kb(after, 'all')).toBeCloseTo(kb(after, 'css') + kb(after, 'js'), 5)

  // Exactly the two bundles the console really hands out — han.install.js
  // for `fallbacks`, han.min.js for `legacyRuby`. The other three are the
  // same code repackaged (browser condition / the export-carrying auto
  // build); counting them would bill the reader twice.
  const summable = page.locator('#station-craft .ScriptLedger tr[data-in-total]')
  await expect(summable).toHaveCount(2)
  expect((await summable.locator('th small').allInnerTexts()).map((t) => t.trim().split('・')[0]))
    .toEqual(['→han.js', '→han.auto.js'])
})

test('station 伍・工法: §④\u2019s proof is live — the reader\u2019s rule really beats han.css', async ({ page }) => {
  await page.goto('/')

  // The proof table claims a bare `cite { margin-inline-end: 5em }` outranks
  // han.css's `:where(…)` rule for the same element. That is not a picture:
  // `.YourCite cite` is a real unlayered rule (station-craft.css § 示範用戶
  // 樣式・其二), so the second sample must actually carry the 5em while the
  // first does not — if han.css ever stopped wrapping that selector in
  // `:where()`, this is the assertion that would catch it.
  const rows = page.locator('#station-craft .ProofSample cite')
  await expect(rows).toHaveCount(2)

  const px = (i: number) =>
    rows.nth(i).evaluate((el) => parseFloat(getComputedStyle(el).marginInlineEnd))
  const fontSize = await rows.nth(1).evaluate((el) => parseFloat(getComputedStyle(el).fontSize))

  expect(await px(1)).toBeCloseTo(5 * fontSize, 0)   // 5em, the reader's rule
  expect(await px(0)).toBeLessThan(5 * fontSize)     // framework row untouched

  // …and the plate states the identity the proof rests on: 式5.1 spans the
  // top of .Axioms, with 5.2 / 5.3 under it (three equations, one plate).
  await expect(page.locator('#station-craft .Axioms .Ax')).toHaveCount(3)
  await expect(page.locator('#station-craft .Ax-lead .Formula')).toContainText(':where(')
  await expect(page.locator('#station-craft .Ax-lead .Zero')).toHaveText('0')
})
