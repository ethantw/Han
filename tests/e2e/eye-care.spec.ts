import { test, expect } from '@playwright/test'

/**
 * 護眼模式 — station②'s three-face specimen carries a checkbox that hides the
 * two 對照組 rows (the visitor's own national-standard system faces, grey).
 * Pure CSS: `:has(input:checked)` + `display: none`, no JS.
 *
 * The click-through case is the load-bearing one. The lead-type forme below is
 * lifted so its empty corner tucks under this card, and that negative margin
 * collapses out of the forme's wrapper `<div>` — so the wrapper's box starts up
 * over the card and, as a later sibling, wins the hit test. The toggle sits
 * exactly in that overlap. It only stays clickable because the card is raised
 * (station-fonts.css) and the forme is pointer-transparent outside its slugs
 * and controls (lead-forme.css). Both are invisible in a screenshot; this test
 * is the only thing that notices when one goes away.
 */
test.describe('護眼模式 — hiding the system-face 對照組 rows', () => {
  const rows = (page: import('@playwright/test').Page) =>
    page.locator('.Faces > li:visible').evaluateAll(
      ns => ns.map(n => (n as HTMLElement).dataset.face),
    )

  test('the toggle is reachable where the forme overlaps, and drops the grey rows', async ({ page }) => {
    // wide enough for the two-column specimen AND for the forme's lift to bite
    await page.setViewportSize({ width: 1600, height: 1000 })
    await page.goto('/')

    const card = page.locator('.Illust[data-variant="faces"]')
    await card.scrollIntoViewIfNeeded()
    expect(await rows(page)).toEqual(['sans', 'system', 'serif', 'system-ming', 'cursive'])

    // a real click, not `.check({ force: true })` — the point is that nothing
    // intercepts it. Playwright fails the actionability check otherwise.
    await page.locator('.Toggle.for-eyecare input').click()
    expect(await rows(page)).toEqual(['sans', 'serif', 'cursive'])

    await page.locator('.Toggle.for-eyecare input').click()
    expect(await rows(page)).toEqual(['sans', 'system', 'serif', 'system-ming', 'cursive'])
  })

  test('the forme still answers the pointer on its slugs', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 })
    await page.goto('/')

    // pointer-events is handed back on .Slug / .Controls; a hover-lift there
    // is what makes the forme a plaything rather than a picture.
    const slug = page.locator('.LeadForme .Slug').first()
    await slug.scrollIntoViewIfNeeded()
    await expect(slug).toHaveCSS('pointer-events', 'auto')
    await expect(page.locator('.LeadForme .Controls')).toHaveCSS('pointer-events', 'auto')
  })
})
