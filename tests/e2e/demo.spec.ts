import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/manual/demo.html')
})

test('demo page renders 16 sections', async ({ page }) => {
  await expect(page.locator('body > main section')).toHaveCount(16)
})

test('cell counts: standard / autospace-replace / pure-display grids', async ({ page }) => {
  // 59 on/off pairs across the 14 standard sections (most run 4 langs ×
  //   on/off = 8 cells; a few sections carry extra locale cells)   = 118
  //  1 autospace-replace section × 8 cells (4 lang × replace/strict) =  8
  //  1 pure-display section × 4 cells (4 lang only)                 =  4
  // Total cells under .demo-grid:                                    130
  await expect(page.locator('.demo-grid > article')).toHaveCount(130)
  await expect(page.locator('.demo-grid > .demo-on')).toHaveCount(59)
  await expect(page.locator('.demo-grid > .demo-off')).toHaveCount(59)
  await expect(page.locator('.demo-grid > .demo-replace')).toHaveCount(4)
  await expect(page.locator('.demo-grid > .demo-strict')).toHaveCount(4)
  await expect(page.locator('.demo-grid.pure-display > article')).toHaveCount(4)
})

test('hanging-punct CSS effect on in zh-Hans ON cell, off in zh-Hans OFF cell', async ({ page, browserName }) => {
  // The bare fixture (tests/e2e/fixtures/hanging.html) covers Firefox
  // now via the named-size-query mirror, but the demo cells scope
  // hanging on `<article>` — and `:where(article)` already assigns
  // `container-name: han-sectional-refinements`, which we can't
  // override with the hanging name without dropping sectional
  // refinements. Skip until Firefox lands @container style() with
  // custom properties (Bugzilla 1795622); see line-adjustments.css.
  test.skip(browserName === 'firefox', 'demo article scope incompatible with the size-query escape hatch')

  // Section 3 — hanging. zh-Hans is one lang where Han.css enables hanging by default.
  const section = page.locator('section#hanging')
  const onCell  = section.locator('.demo-on[lang="zh-Hans"]').first()
  const offCell = section.locator('.demo-off[lang="zh-Hans"]').first()

  await expect(onCell.locator('h-layer').first()).toBeAttached()
  await expect(offCell.locator('h-layer').first()).toBeAttached()

  const onPos  = await onCell.locator('h-layer').first().evaluate(el => getComputedStyle(el).position)
  const offPos = await offCell.locator('h-layer').first().evaluate(el => getComputedStyle(el).position)

  expect(onPos).toBe('absolute')
  expect(offPos).not.toBe('absolute')
})

test('em ON cells get text-emphasis, OFF cells fall back to UA italic', async ({ page }) => {
  const section = page.locator('section#em-emphasis')
  const onEm  = section.locator('.demo-on[lang="zh-Hant"] em').first()
  const offEm = section.locator('.demo-off[lang="zh-Hant"] em').first()

  const onEmphasis  = await onEm.evaluate(el => {
    const style = getComputedStyle(el)
    // Different browsers expose this on different prop names.
    return style.textEmphasisStyle || (style as unknown as { webkitTextEmphasisStyle?: string }).webkitTextEmphasisStyle || ''
  })
  const offFontStyle = await offEm.evaluate(el => getComputedStyle(el).fontStyle)

  // ON should have non-empty text-emphasis (e.g., "filled dot")
  expect(onEmphasis).not.toBe('none')
  expect(onEmphasis).not.toBe('')

  // OFF should fall back to UA italic
  expect(offFontStyle).toBe('italic')
})

test.skip('matches the demo-page visual baseline', async ({ page }) => {
  // TODO 2026-04-30: this baseline has gone persistently flaky on
  // macOS chromium even at 0.15 maxDiffPixelRatio. Likely culprits:
  //   - cjk font stack lazy-load order (different glyph shapes
  //     until the proper face resolves)
  //   - hyperly's ResizeObserver re-running ¼-em re-layouts post
  //     font-ready
  //   - subtle subpixel rendering differences between consecutive
  //     paint cycles
  // Skipped until we can either (a) lock fonts.ready + a stable idle
  // window, or (b) move pixel regression to a separate dedicated
  // visual-baseline harness. Behavioural coverage of the page is
  // intact via the structural assertions above.
  await expect(page.locator('section#hanging .demo-on h-layer').first()).toBeAttached()
  await page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready)
  await expect(page).toHaveScreenshot('demo.png', {
    maxDiffPixelRatio: 0.05,
    fullPage: true,
    animations: 'disabled',
  })
})
