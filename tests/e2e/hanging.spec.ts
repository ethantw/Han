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

test('the pair repair rides the ½em spacer, never a margin', async ({ page }) => {
  // `，『` loses its pair squeeze when the comma's glyph goes out of flow, and
  // the h-char pays that half em back itself. It MUST do so through the
  // spacer's width: a negative margin makes the line's content measure short,
  // so `text-align: justify` stretches the line to make it up and drags every
  // character before the mark along with it (~0.45em, measured).
  await page.goto('/tests/e2e/fixtures/hanging-justify.html')
  const mark = page.locator('#target h-char[data-followed-by="open"]')
  await expect(mark).toHaveCount(1)
  await expect(mark).toHaveCSS('margin-inline-end', '0px')
  const family = await mark.evaluate(el => getComputedStyle(el, '::after').fontFamily)
  expect(family).toContain('Han Half Em Space')
})
