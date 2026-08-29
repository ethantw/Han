import { test, expect, type Page } from '@playwright/test'

const rootStyle = (page: Page, name: string) =>
  page.evaluate((property) => document.documentElement.style.getPropertyValue(property), name)

test.describe('adoption path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  for (const station of ['craft', 'playground']) {
    test(`${station} hands the live configuration to the code generator`, async ({ page }) => {
      await page.locator('[data-cfg-key="semantics"]').uncheck()
      await expect.poll(() => rootStyle(page, '--han-semantics')).toBe('off')

      const link = page.locator(`#station-${station} .AdoptPrompt a`)
      await link.scrollIntoViewIfNeeded()
      await expect(link).toBeVisible()
      await link.click()

      await expect(page).toHaveURL(/#station-snippet$/)
      await expect(page.locator('#station-snippet')).toBeInViewport()
      await expect(page.locator('[data-cfg-key="semantics"]')).not.toBeChecked()
      await expect.poll(() => rootStyle(page, '--han-semantics')).toBe('off')
    })
  }

  test('footer separates the three primary routes from related projects', async ({ page }) => {
    const routes = page.locator('.ClosingRoutes > a')
    await expect(routes).toHaveCount(3)
    await expect(routes.nth(0)).toHaveAttribute('href', '#station-snippet')
    await expect(routes.nth(1)).toHaveAttribute('href', '/manual/')
    await expect(routes.nth(2)).toHaveAttribute('href', 'https://github.com/hanzipro/han.css')

    await expect(page.locator('.Closing .Siblings > a')).toHaveCount(2)
    await expect(page.locator('.Closing .Siblings')).not.toContainText('GitHub')
  })

  test('header and footer share the canonical GitHub repository', async ({ page }) => {
    const repository = 'https://github.com/hanzipro/han.css'
    await expect(page.locator('body > header nav > a', { hasText: 'GitHub' }))
      .toHaveAttribute('href', repository)
    await expect(page.locator('.ClosingRoutes > a').nth(2))
      .toHaveAttribute('href', repository)
  })
})
