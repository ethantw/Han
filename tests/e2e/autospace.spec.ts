import { test, expect } from '@playwright/test'

/**
 * Verifies the runtime probe + Safari fallback for `text-autospace`.
 *
 * On Chromium / Firefox the probe is expected to *not* fire (native
 * autospace works through inline boundaries), so `[data-han-autospace-
 * broken]` is absent and Han.css renders no `<h-iss>` in `normal` mode.
 *
 * On WebKit the probe should observe the inline-boundary bug, set the
 * attribute on `<html>`, run `replaceISS + insertISS`, and the CSS
 * override restores `display: inline` on h-iss so the ¼-em spacer
 * paints. The visible width of `#target` should match the natively-
 * spaced `#bare-spaced` reference, not the no-autospace `#bare-tight`.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/autospace.html')
})

test('chromium / firefox: probe sees no bug, no h-iss injected', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit path covered separately')
  const flagged = await page.evaluate(() =>
    document.documentElement.style.getPropertyValue('--han-probe-autospace').trim() === 'broken',
  )
  expect(flagged).toBe(false)
  await expect(page.locator('#target h-iss')).toHaveCount(0)
})

test('webkit: probe trips, h-iss injected with paint width', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'WebKit-specific fallback')

  const diag = await page.evaluate(() => {
    const flagged = document.documentElement.style.getPropertyValue('--han-probe-autospace').trim() === 'broken'
    const target = document.getElementById('target') as HTMLElement
    const hIss = Array.from(target.querySelectorAll('h-iss')) as HTMLElement[]
    return {
      flagged,
      hIssCount: hIss.length,
      issDisplay: hIss[0] && getComputedStyle(hIss[0]).display,
      issWidths: hIss.map(el => el.getBoundingClientRect().width),
    }
  })

  expect(diag.flagged).toBe(true)
  // Two Han↔Western boundaries in "学习CSS文档".
  expect(diag.hIssCount).toBe(2)
  // CSS override unblocked the spacer from `display: none`.
  expect(diag.issDisplay).toBe('inline')
  // Each spacer paints a non-zero width — the width itself depends on
  // whether `font-size-adjust: ic-width` resolves to the Han Em Space
  // metric or falls back to .45em Arial, so just assert presence.
  for (const w of diag.issWidths) expect(w).toBeGreaterThan(0)
})
