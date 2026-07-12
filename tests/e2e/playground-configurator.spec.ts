import { test, expect } from '@playwright/test'

test.describe('playground configurator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('掛標點開關 → 預覽變數 + 生成碼同步', async ({ page }) => {
    const body = page.locator('[data-pg-body]')
    await page.locator('[data-cfg-key="squeeze"]').uncheck()
    await expect
      .poll(() => body.evaluate((el) => el.style.getPropertyValue('--han-punctuation-refinement')))
      .toBe('hang')

    await page.locator('[data-out-tab="cdn"]').click()
    await expect(page.locator('[data-out-code]'))
      .toContainText('--han-punctuation-refinement: hang')
  })

  test('DTJ hant 換 GB → 生成碼含覆寫；全預設 → 無 :root', async ({ page }) => {
    const code = page.locator('[data-out-code]')
    await expect(code).not.toContainText(':root') // 初始＝全預設
    await page.locator('[data-cfg-key="punct.hant"]').selectOption('GB')
    await expect(code).toContainText('--han-punctuation-hant: GB')
  })

  test('換傳承家族 → 注入對應 webfont link', async ({ page }) => {
    await expect(page.locator('link[href*="webfonts-genki-gothic"]')).toHaveCount(0)
    await page.locator('[data-cfg-key="heritageSans"]').selectOption('genki')
    await expect(
      page.locator('link[href*="webfonts-genki-gothic"]').first(),
    ).toBeAttached()
  })

  test('勾後備 → CDN 頁出現 han.auto script 行', async ({ page }) => {
    await page.locator('[data-cfg-key="fallbacks"]').check()
    await page.locator('[data-out-tab="cdn"]').click()
    await expect(page.locator('[data-out-code]')).toContainText('han.auto.min.js')
  })
})
