import { test, expect } from '@playwright/test'

/**
 * Homepage redesign v2 — the station-plate system, marginalia gate, the
 * snippet station's own paper ground, and the reduced-motion reveal guard.
 *
 * Contract: docs/plans/homepage-v2-implementation.md. These are smoke-level
 * structural checks (not pixel baselines): the content stations carry a
 * full-viewport ground rendered by `::before`, with no watermark glyphs;
 * the var-name marginalia is a ≥68rem-only console (hidden where it would only
 * repeat names); station 柒・引用碼 sits on the one non-grey station ground
 * (稿紙米黃, following the page theme); and reveal.js must hand every station
 * its `[data-revealed]` hook immediately under a reduced-motion preference
 * (settled state, no animation), so nothing is ever left hidden.
 */

test('the stations and closing carry no watermark data', async ({ page }) => {
  await page.goto('/')

  await expect(page.locator('main [data-station]')).toHaveCount(7)
  await expect(page.locator('main [data-wm]')).toHaveCount(0)
})

test('station 柒・引用碼 returns to the shared neutral ground and follows the page theme', async ({ page }) => {
  await page.goto('/')

  // Page defaults to light (no dark-mode checkbox) …
  await expect(page.locator('input[name="dark-mode"]')).not.toBeChecked()

  // … and the station is light with it. It used to be constant-dark, then
  // briefly carried a one-off buff ground. The terminal already supplies the
  // code metaphor, so the station now rejoins the shared A/B neutral rhythm.
  const snippet = page.locator('#station-snippet')
  await expect(snippet).toHaveCSS('color-scheme', 'light')
  await expect.poll(() => snippet.evaluate((el) =>
    getComputedStyle(el, '::before').backgroundColor,
  )).toBe('rgb(250, 250, 247)')

  // The code panes stay terminal-dark in BOTH themes — that part IS constant
  // (--code-bg = --palette-ink). A light station with a dark terminal on it is
  // the point; the station no longer goes dark to keep the terminal company.
  // (the ground is painted by `figure.CodePane`, not the `<pre>` inside it)
  await expect(snippet.locator('figure[data-component="code-pane"]').first())
    .toHaveCSS('background-color', 'rgb(14, 14, 16)')

  // Dark theme: the same shared station token's dark side.
  // via the label: the checkbox itself is a visually-hidden `.Toggle` input,
  // so a direct .check() has nothing to hit.
  await page.locator('label.for-theme').click()
  await expect(page.locator('input[name="dark-mode"]')).toBeChecked()
  await expect(snippet).toHaveCSS('color-scheme', 'dark')
  await expect.poll(() => snippet.evaluate((el) =>
    getComputedStyle(el, '::before').backgroundColor,
  )).toBe('rgb(24, 23, 26)')
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
  // 站台是 `content-visibility: auto`（home/frame.css）：畫面外的內容沒有版面，
  // 於是 `innerText` 讀出來是空字串。捲到它面前——讀者本來也是這樣讀的。
  await page.locator('#station-craft').scrollIntoViewIfNeeded()

  // Four style rows ＋ the delivery-mode script rows, all figures baked by
  // vite (computeModuleLedger for the CSS, dist/pass-sizes.json for the
  // floor) — a missing dist file would render '—', not a 'N.NKB' figure.
  const table = page.locator('#station-craft .Sum table')
  await expect(table).toHaveCount(1)

  // Column order is load-bearing: it matches the equation array's row order
  // below the plate, and only the last one carries the accent.
  expect(await table.locator('thead th').allInnerTexts())
    .toEqual(['項目', 'minified', 'gzip', 'brotli'])

  // Line items are grouped now — CSS, then han.js — so each group opens with
  // a `<th scope="rowgroup">` row that carries no figures.
  await expect(table.locator('.GroupHead th')).toHaveText(['CSS', 'han.js'])
  const styleRows = table.locator('tbody[data-group="css"] tr:not(.GroupHead)')
  await expect(styleRows).toHaveCount(4)
  // The module NAME only — each head also carries the human name in a
  // trailing <small>, the same string the console's own switch uses.
  expect(await styleRows.locator('th label').allInnerTexts())
    .toEqual(['han-semantics', 'han-lines', 'han-prose', 'han-fonts'])
  const human = await styleRows.locator('th small').allInnerTexts()
  expect(human.every((t) => t.trim().length > 0)).toBe(true)

  // Three columns a row — raw, brotli, gzip — and compression has to make
  // the file smaller, or the columns were measured against different files.
  for (const row of await styleRows.all()) {
    // Columns run minified → gzip → brotli (compression strength, so the eye
    // finishes on the one a CDN actually serves).
    const [raw, gz, br] = (await row.locator('td').allInnerTexts())
      .map((t) => Number(t.trim().match(/^(\d+(?:\.\d+)?)KB$/)?.[1]))
    expect(raw).toBeGreaterThan(br)
    expect(gz).toBeGreaterThanOrEqual(br)
  }

  // The console's default is `auto`, so the auto row is the visible script
  // line and the manual-mode rows are not part of this build at all.
  await expect(table.locator('tr[data-js-row="auto"]')).toBeVisible()
  await expect(table.locator('tr[data-js-row="pass"]')).toHaveCount(5)

  // The footing is the sum of the visible column, to the printed precision.
  const kb = async (loc) =>
    (await loc.allInnerTexts()).map((t) => Number(t.trim().replace('KB', '')))
  const styles = await kb(styleRows.locator('td:nth-child(4)'))
  const [autoBr] = await kb(table.locator('tr[data-js-row="auto"] td:nth-child(4)'))
  const [total] = await kb(table.locator('tfoot [data-total="brotli"]'))
  const cssKb = styles.reduce((a, b) => a + b, 0)
  expect(total).toBeCloseTo(cssKb + autoBr, 5)

  // …and the caption's MathML array says the same thing, once per
  // compression. If these ever disagree with the table the plate lies twice.
  // `textContent`, not `innerText`: these are MathML `<mn>`s, and a
  // MathMLElement has no innerText.
  const eq = async (name) =>
    Number((await page.locator(`#station-craft [data-sum="${name}"]`)
      .evaluate((el) => el.textContent)).trim().replace('KB', ''))
  expect(await eq('br-css')).toBeCloseTo(cssKb, 5)
  expect(await eq('br-js')).toBeCloseTo(autoBr, 5)
  expect(await eq('br-all')).toBeCloseTo(total, 5)

  // The other two rows are the same sum over the other two columns — and
  // every row has to add up on its own.
  for (const [row, col] of [['raw', 2], ['gz', 3]] as const) {
    const parts = await kb(styleRows.locator(`td:nth-child(${col})`))
    const [js] = await kb(table.locator(`tr[data-js-row="auto"] td:nth-child(${col})`))
    expect(await eq(`${row}-css`)).toBeCloseTo(parts.reduce((a, b) => a + b, 0), 5)
    expect(await eq(`${row}-all`)).toBeCloseTo(await eq(`${row}-css`) + js, 5)
  }
})

test('station 伍・工法: 例5.1 is a cascade stack over real library rules', async ({ page }) => {
  await page.goto('/')
  // 站台是 `content-visibility: auto`（home/frame.css）：畫面外的內容沒有版面，
  // 於是 `innerText` 讀出來是空字串。捲到它面前——讀者本來也是這樣讀的。
  await page.locator('#station-craft').scrollIntoViewIfNeeded()

  const items = page.locator('#station-craft .SelRing > li')
  await expect(items).toHaveCount(5)

  // Each item is a PAIR — han.css's rule and the reader's — and every weight
  // is build-computed from the selector text beside it
  // (manual/_specificity.js), never typed in, so it cannot drift.
  const specs = await items
    .locator('[data-role="framework"] code[data-spec]')
    .evaluateAll((els) => els.map((el) => (el as HTMLElement).dataset.spec))
  expect(specs).toEqual(['(0,0,2)', '(0,2,2)', '(0,2,1)', '(0,1,1)', '(0,0,1)'])

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

  // The checkbox is not decorative DevTools chrome: it switches the real
  // declaration applied to the witness.  The first case is deliberately easy
  // to measure—the author's 2rem heading margin wins while checked, then the
  // zero-specificity framework rule takes back its 0 when unchecked.
  const author = items.first().locator('[data-author-toggle]')
  const heading = page.locator('#station-craft .DemoRing > li[data-current] h1')
  await expect(author).toBeChecked()
  await expect(heading).toHaveCSS('margin-bottom', '32px')
  await author.uncheck()
  await expect(items.first().locator('[data-role="framework"] .RuleDecl'))
    .toHaveCSS('text-decoration-line', 'none')
  await expect(items.first().locator('[data-role="mine"] .RuleDecl'))
    .toHaveCSS('text-decoration-line', 'line-through')
  await expect(heading).toHaveCSS('margin-bottom', '0px')
  await author.check()

  // Reader-driven: the nav is hidden in the markup and only carousel.js
  // unhides it, so a no-JS page never offers a button that does nothing.
  const next = page.locator('#station-craft [data-sel-step="1"]')
  await expect(next).toBeVisible()
  const shown = page.locator('#station-craft .SelRing > li[data-current]')
  await expect(shown).toHaveCount(1)

  // …and BOTH printed triples travel with the pair, for EVERY item.  The
  // framework output must visibly show :where() erasing its original weight;
  // the author's output must remain the actual non-zero selector weight.
  for (let i = 0; i < 5; i++) {
    const state = await page.evaluate(() => {
      const li = document.querySelector('#station-craft .SelRing > li[data-current]')!
      const t = (s: string, root: ParentNode = li) =>
        root.querySelector(s)?.textContent?.trim()
      return {
        panelLib: li.querySelector<HTMLElement>('[data-role="framework"] code[data-spec]')!.dataset.spec,
        panelMine: li.querySelector<HTMLElement>('[data-role="mine"] code[data-mine-spec]')!.dataset.mineSpec,
        shownLib: t('[data-role="framework"] [data-part="rule-spec"]'),
        shownMine: t('[data-role="mine"] [data-part="rule-spec"]'),
      }
    })
    expect(state.shownLib, `item ${i + 1}: erased framework weight`)
      .toBe(`:where${state.panelLib}→(0,0,0)`)
    expect(state.shownMine, `item ${i + 1}: author weight`).toBe(state.panelMine)
    await next.click()
  }
})

test('station 伍・工法: full transfer and font ledgers live in the lightweight dialog', async ({ page }) => {
  await page.goto('/')
  // 站台是 `content-visibility: auto`（home/frame.css）：畫面外的內容沒有版面，
  // 於是 `innerText` 讀出來是空字串。捲到它面前——讀者本來也是這樣讀的。
  await page.locator('#station-craft').scrollIntoViewIfNeeded()

  // The old inline <details> made the station read like an endless ledger.
  // The same real figures now live in the small modal, while its mask owns
  // any page-length scroll.
  await expect(page.locator('#station-craft .FontDetails')).toHaveCount(0)
  await page.locator('#station-craft [data-size-dialog-open]').click()
  const dialog = page.locator('#station-craft [data-size-dialog]')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('.TransferDetails table')).toHaveCount(2)
  await dialog.locator('[data-part="size-dialog-panel"]').evaluate((panel) =>
    Promise.all(panel.getAnimations().map((animation) => animation.finished.catch(() => undefined))))

  const breathingRoom = await dialog.evaluate((element) => {
    const panel = element.querySelector<HTMLElement>('[data-part="size-dialog-panel"]')!
    const style = getComputedStyle(element)
    return {
      viewportHeight: innerHeight,
      paddingStart: Number.parseFloat(style.paddingBlockStart),
      paddingEnd: Number.parseFloat(style.paddingBlockEnd),
      scrollTop: element.scrollTop,
      panelOffset: panel.offsetTop,
      panelTop: panel.getBoundingClientRect().top,
      roomAfterPanel: element.scrollHeight - panel.offsetTop - panel.offsetHeight,
    }
  })
  expect(breathingRoom.paddingStart)
    .toBe(Math.max(breathingRoom.viewportHeight * 0.2, 96))
  expect(breathingRoom.scrollTop).toBe(0)
  expect(breathingRoom.panelOffset).toBe(breathingRoom.paddingStart)
  expect(breathingRoom.panelTop).toBe(breathingRoom.paddingStart)
  expect(breathingRoom.paddingEnd).toBe(160)
  expect(breathingRoom.roomAfterPanel).toBe(160)

  await dialog.evaluate((element) => {
    const panel = element.querySelector<HTMLElement>('[data-part="size-dialog-panel"]')!
    element.scrollTo({ top: panel.offsetTop + 200, behavior: 'instant' })
  })
  await expect.poll(() => dialog.locator('.SizeDialogHead').evaluate((header) =>
    header.getBoundingClientRect().bottom)).toBeLessThan(0)

  const typography = await dialog.evaluate((element) => {
    const family = (selector: string) =>
      getComputedStyle(element.querySelector(selector)!).fontFamily
    return {
      sans: getComputedStyle(element).fontFamily,
      prose: [
        family('.SizeDialogHead h3'),
        family('[data-part="size-dialog-body"] h4'),
        family('.TransferDetails caption'),
        family('.SsrNote'),
        family('.FontLedger tbody th'),
        family('.FontLedger figcaption'),
      ],
      code: family('.TransferDetails tbody code'),
      codeCount: element.querySelectorAll('code').length,
    }
  })
  expect(typography.prose.every((family) => family === typography.sans)).toBe(true)
  expect(typography.code).not.toBe(typography.sans)
  expect(typography.codeCount).toBe(18)

  const ledger = dialog.locator('.FontLedger')
  await expect(ledger.locator('table')).toHaveCount(3)
  await expect(ledger.locator('tbody tr')).toHaveCount(8 + 4 + 3)

  const figures = await ledger.locator('tbody td').allInnerTexts()
  expect(figures.length).toBe(8 * 3 + 4 * 2 + 3)
  for (const text of figures) expect(text.trim()).toMatch(/^\d+(\.\d+)?(KB|MB)$|^\d+(×\d+)?$/)

  // …and the framework's own addition never quotes a font weight — the two
  // sets of books stay separate, which is the reason there are two.
  const sumCells = await page.locator('#station-craft .Sum td').allInnerTexts()
  expect(sumCells.some((t) => t.includes('MB'))).toBe(false)

  await dialog.evaluate((element) =>
    element.dispatchEvent(new MouseEvent('click', { bubbles: true })))
  await expect(dialog).toBeHidden()
})

test('station 伍・工法: the addition follows the console, auto ⇄ manual', async ({ page }) => {
  await page.goto('/')
  // 站台是 `content-visibility: auto`（home/frame.css）：畫面外的內容沒有版面，
  // 於是 `innerText` 讀出來是空字串。捲到它面前——讀者本來也是這樣讀的。
  await page.locator('#station-craft').scrollIntoViewIfNeeded()
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

  // Switch to 自選函式 — the auto row leaves the plate and the per-function
  // rows take over. There is no separate 「floor」 row: the shared runtime is
  // billed to the first ticked pass, which is why that one is the expensive
  // line and the rest are cheap.
  await set('jsMode', 'manual')
  await expect(table.locator('tr[data-js-row="auto"]')).toBeHidden()
  const ticked = table.locator('tr[data-js-row="pass"]:not([data-off])')
  await expect(ticked).toHaveCount(3)   // punctuation / iss / adjacentLines

  // The column has to ADD UP — that is why pass-sizes.json bundles every
  // selection for real instead of summing marginals.
  const parts = [
    ...(await kb(table.locator('tbody[data-group="css"] tr:not([data-off]) td:nth-child(4)'))),
    ...(await kb(ticked.locator('td:nth-child(4)'))),
  ]
  expect(await total()).toBeCloseTo(parts.reduce((a, b) => a + b, 0), 5)

  // Unticking a pass must make the build smaller — the claim the whole
  // manual mode exists to support.
  const manualAll = await total()
  await set('fn.punctuation', false)
  await expect(table.locator('tr[data-pass="punctuation"][data-off]')).toHaveCount(1)
  expect(await total()).toBeLessThan(manualAll)

  // …and the plate's OWN box does the same thing, because it drives the
  // console's control rather than setting config behind its back. Ticking it
  // here must move the switch in the left column, not just the row.
  await table.locator('tr[data-pass="punctuation"] input[data-toggle]').check()
  await expect(table.locator('tr[data-pass="punctuation"][data-off]')).toHaveCount(0)
  expect(await total()).toBeCloseTo(manualAll, 5)
  expect(await page.evaluate(() =>
    document.querySelector('han-console')!.shadowRoot!
      .querySelector<HTMLInputElement>('[data-cfg-key="fn.punctuation"]')!.checked,
  )).toBe(true)
})

test('station 伍・工法: the plate\u2019s own boxes drive the console', async ({ page }) => {
  await page.goto('/')
  // 站台是 `content-visibility: auto`（home/frame.css）：畫面外的內容沒有版面，
  // 於是 `innerText` 讀出來是空字串。捲到它面前——讀者本來也是這樣讀的。
  await page.locator('#station-craft').scrollIntoViewIfNeeded()
  await page.waitForFunction(() => 'pgReady' in document.documentElement.dataset)

  const table = page.locator('#station-craft .Sum table')
  const consoleBox = (key: string) =>
    page.evaluate((k) => document.querySelector('han-console')!.shadowRoot!
      .querySelector<HTMLInputElement>(`[data-cfg-key="${k}"]`)!.checked, key)

  // Untick a style module from the plate → the console's switch follows, the
  // row greys, and the footing drops. One writer: the plate never sets
  // config, it presses the console's control (see home/ledger.js).
  const before = Number((await table.locator('tfoot [data-total="brotli"]').innerText())
    .trim().replace('KB', ''))
  await table.locator('tr[data-cfg="prose"] input[data-toggle]').uncheck()
  expect(await consoleBox('prose')).toBe(false)
  await expect(table.locator('tr[data-cfg="prose"][data-off]')).toHaveCount(1)
  const after = Number((await table.locator('tfoot [data-total="brotli"]').innerText())
    .trim().replace('KB', ''))
  expect(after).toBeLessThan(before)

  // …and back, from the console this time — the two stay in step both ways.
  await page.evaluate(() => {
    const $c = document.querySelector('han-console')!.shadowRoot!
      .querySelector<HTMLInputElement>('[data-cfg-key="prose"]')!
    $c.checked = true
    $c.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(table.locator('tr[data-cfg="prose"][data-off]')).toHaveCount(0)
  await expect(table.locator('tr[data-cfg="prose"] input[data-toggle]')).toBeChecked()
})
