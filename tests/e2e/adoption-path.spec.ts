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

  test('footer separates the four primary routes from related projects', async ({ page }) => {
    const routes = page.locator('.ClosingRoutes > a')
    await expect(routes).toHaveCount(4)
    await expect(routes.nth(0)).toHaveAttribute('href', '#station-snippet')
    await expect(routes.nth(1)).toHaveAttribute('href', '/specimen.html')
    await expect(routes.nth(1)).toContainText('查看完整示例')
    await expect(routes.nth(2)).toHaveAttribute(
      'href',
      'https://github.com/hanzipro/han.css/blob/main/skills/han-setup/SKILL.md',
    )
    await expect(routes.nth(2)).toContainText('完整設定指南Skill')
    await expect(routes.nth(3)).toHaveAttribute('href', 'https://github.com/hanzipro/han.css')

    await expect(page.locator('.Closing .Siblings > a')).toHaveCount(2)
    await expect(page.locator('.Closing .Siblings')).not.toContainText('GitHub')
  })

  test('header and footer share the canonical GitHub repository', async ({ page }) => {
    const repository = 'https://github.com/hanzipro/han.css'
    await expect(page.locator('body > header nav > a', { hasText: 'GitHub' }))
      .toHaveAttribute('href', repository)
    await expect(page.locator('.ClosingRoutes > a').nth(3))
      .toHaveAttribute('href', repository)
  })

  test('the masthead sheds secondary routes before labels wrap', async ({ page }) => {
    const manual = page.locator('body > header .ManualLink')
    const repository = page.locator('body > header .GitHubLink')
    const brandDetails = page.locator('body > header .Logo small')

    await expect(manual).toBeHidden()
    await expect(repository).toBeVisible()
    await expect(brandDetails.first()).toBeVisible()

    await page.setViewportSize({ width: 800, height: 800 })
    await expect(repository).toBeHidden()
    await expect(brandDetails.first()).toBeVisible()

    await page.setViewportSize({ width: 600, height: 800 })
    await expect(brandDetails.first()).toBeHidden()
  })
})
