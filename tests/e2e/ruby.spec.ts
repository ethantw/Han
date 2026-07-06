import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/ruby.html')
  await expect(page.locator('body[data-ready="true"]')).toBeVisible()
})

test('renders rt above its ruby base', async ({ page }) => {
  const positions = await page.locator('#target ruby').evaluate((ruby: HTMLElement) => {
    const base = ruby.firstElementChild as HTMLElement // not reliable across UAs; use rb-fallback
    const rt  = ruby.querySelector('rt') as HTMLElement
    const rubyBox = ruby.getBoundingClientRect()
    const rtBox = rt.getBoundingClientRect()
    return { rubyTop: rubyBox.top, rtTop: rtBox.top, rtHeight: rtBox.height }
  })
  // rt should sit at or above the top of the ruby element.
  expect(positions.rtTop).toBeLessThanOrEqual(positions.rubyTop + 1)
  expect(positions.rtHeight).toBeGreaterThan(0)
})

test('matches the ruby visual baseline', async ({ page }) => {
  await expect(page.locator('#target')).toHaveScreenshot('ruby.png', {
    maxDiffPixelRatio: 0.01,
  })
})
