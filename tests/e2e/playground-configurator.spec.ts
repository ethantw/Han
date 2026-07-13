import { test, expect, type Page } from '@playwright/test'

/**
 * Configurator behavior, ported to the whole-page rail (HP-5): controls
 * live in `<aside class="Rail">` behind `details.ControlGroup`
 * accordions (open a collapsed group before touching its controls),
 * apply target is `main.han` (there's no more boxed preview
 * `<article>`), and the output pane is station④'s ViewTabs
 * (`[data-pg-views]` / `[data-out-code]`) — no "live preview" tab
 * anymore, since the whole page is the preview.
 */
const openGroupOf = (page: Page, cfgKey: string) =>
  page
    .locator(`details.ControlGroup:not([open]):has([data-cfg-key="${cfgKey}"]) > summary`)
    .click()

test.describe('playground configurator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('掛標點開關 → 頁面變數 + 生成碼同步', async ({ page }) => {
    const main = page.locator('main.han')
    await openGroupOf(page, 'squeeze')
    await page.locator('[data-cfg-key="squeeze"]').uncheck()
    await expect
      .poll(() => main.evaluate((el) => el.style.getPropertyValue('--han-punctuation-refinement')))
      .toBe('hang')

    await page.locator('[data-pg-views] label:has(input[value="cdn"])').click()
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
    // heritage 系家族選單搬進了預設收合的「繁體專項」組——先展開。
    await openGroupOf(page, 'heritageSans')
    await page.locator('[data-cfg-key="heritageSans"]').selectOption('genki')
    await expect(
      page.locator('link[href*="webfonts-genki-gothic"]').first(),
    ).toBeAttached()
  })

  test('勾後備 → CDN 頁出現 han.auto script 行', async ({ page }) => {
    await openGroupOf(page, 'fallbacks')
    await page.locator('[data-cfg-key="fallbacks"]').check()
    await page.locator('[data-pg-views] label:has(input[value="cdn"])').click()
    await expect(page.locator('[data-out-code]')).toContainText('han.auto.min.js')
  })
})
