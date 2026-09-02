import { test, expect } from '@playwright/test'

test('public specimens share the homepage brand and responsive console shell', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/demo/punctuation-visual.html')

  await expect(page.locator('.DemoHeroBrand .Brand .Glyph')).toHaveCount(1)
  await expect(page.locator('.DemoHeroBrandTitle')).toHaveText('標點字體樣張')
  await expect(page.locator('.Controls')).toHaveCSS('width', '280px')
  await expect(page.locator('.Hero')).toHaveCSS('--demo-hero-mark-block', '1rem')

  await page.setViewportSize({ width: 900, height: 900 })
  await expect(page.locator('.Controls')).toHaveCSS('width', '240px')

  await page.setViewportSize({ width: 390, height: 844 })
  const dialog = page.locator('#punctuation-console')
  const opener = page.locator('[data-demo-console-open]')
  await expect(dialog).toBeHidden()
  await opener.click()
  await expect(dialog).toBeVisible()
  await expect(opener).toHaveAttribute('aria-expanded', 'true')
})
