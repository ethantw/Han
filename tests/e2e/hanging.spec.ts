import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/hanging.html')
})

test('auto-installs h-layer wrappers for every hangable mark', async ({ page }) => {
  // 5 hangable marks in the fixture: ， ， 。 、 。
  await expect(page.locator('#target h-layer')).toHaveCount(5)
  await expect(page.locator('#target h-char[data-punct~="hangable"]')).toHaveCount(5)
})

test('h-layer is positioned absolutely so it can overflow the line', async ({ page }) => {
  // The hanging-fallback CSS now has a Firefox-friendly named-size-
  // query mirror (see src/css/with-js/line-adjustments.css ~line 220),
  // so this test runs on all 3 engines.
  await expect(page.locator('#target h-layer').first()).toBeAttached()
  const position = await page
    .locator('#target h-layer')
    .first()
    .evaluate(el => getComputedStyle(el).position)
  expect(position).toBe('absolute')
})

test('matches the hanging-punctuation visual baseline', async ({ page }) => {
  await expect(page.locator('#target h-layer').first()).toBeAttached()
  await expect(page.locator('#target')).toHaveScreenshot('hanging.png', {
    maxDiffPixelRatio: 0.01,
  })
})
