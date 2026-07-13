import { test, expect, type Page } from '@playwright/test'

/**
 * Configurator behavior, ported to the whole-page rail (HP-5): controls
 * live in `<aside class="Rail">` behind `details.ControlGroup`
 * accordions (open a collapsed group before touching its controls),
 * apply target is `main.han` (there's no more boxed preview
 * `<article>`), and the output pane is station④'s ViewTabs
 * (`[data-pg-views]` / `[data-out-panes]`) — no "live preview" tab
 * anymore, since the whole page is the preview.
 *
 * Request A: output is now split into per-lang `<figure class="CodePane">`
 * panes inside `[data-out-panes]` — assertions target a specific pane
 * (`pre[data-lang="…"] code`) instead of one flat `[data-out-code]` blob.
 * The CSS @import method tab was dropped (owner call) — only
 * bundler/npm ("bundler" radio value, label reads "npm") and cdn remain.
 */
const openGroupOf = (page: Page, cfgKey: string) =>
  page
    .locator(`details.ControlGroup:not([open]):has([data-cfg-key="${cfgKey}"]) > summary`)
    .click()

const pane = (page: Page, lang: string) =>
  page.locator(`[data-out-panes] pre[data-lang="${lang}"] code`)

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
    await expect(pane(page, 'css')).toContainText('--han-punctuation-refinement: hang')
  })

  test('DTJ hant 換 GB → css pane 含覆寫；全預設 → css pane 缺席', async ({ page }) => {
    await expect(page.locator('[data-out-panes] pre[data-lang="css"]')).toHaveCount(0) // 初始＝全預設
    await page.locator('[data-cfg-key="punct.hant"]').selectOption('GB')
    await expect(pane(page, 'css')).toContainText('--han-punctuation-hant: GB')
  })

  test('換傳承家族 → 注入對應 webfont link', async ({ page }) => {
    await expect(page.locator('link[href*="webfonts-genki-gothic"]')).toHaveCount(0)
    // heritage 系家族選單搬進了預設收合的「繁體專項」組——先展開。
    await openGroupOf(page, 'heritageFamily')
    await page.locator('[data-cfg-key="heritageFamily"]').selectOption('genki')
    await expect(
      page.locator('link[href*="webfonts-genki-gothic"]').first(),
    ).toBeAttached()
  })

  test('勾後備 → CDN 頁 html pane 出現 han.auto script 行', async ({ page }) => {
    await openGroupOf(page, 'fallbacks')
    await page.locator('[data-cfg-key="fallbacks"]').check()
    await page.locator('[data-pg-views] label:has(input[value="cdn"])').click()
    await expect(pane(page, 'html')).toContainText('han.auto.min.js')
  })

  test('每個 pane 各有自己的複製鍵；點擊後短暫顯示 ✓', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    const $figure = page.locator('[data-out-panes] figure').first()
    const $copy = $figure.locator('button')
    await expect($copy).toHaveText('⎘')
    await $copy.click()
    await expect($copy).toHaveText('✓')
  })
})

test.describe('ziano delivery (Request B)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('bundler：預設 zianoDelivery=cdn → bash pane 無 webfont 套件，html pane 有 jsdelivr <link>', async ({ page }) => {
    const bash = pane(page, 'bash')
    await expect(bash).not.toContainText('webfonts-shanggu-sans')
    const html = pane(page, 'html')
    await expect(html).toContainText('cdn.jsdelivr.net')
    await expect(html).toContainText('webfonts-shanggu-sans')
  })

  test('切 zianoDelivery=npm → bash pane 含 webfont 套件，html pane 消失', async ({ page }) => {
    // 字體 group 出廠即展開（<details open>），不需 openGroupOf。
    await page.locator('[data-cfg-key="zianoDelivery"]').selectOption('npm')
    await expect(pane(page, 'bash')).toContainText('webfonts-shanggu-sans')
    await expect(page.locator('[data-out-panes] pre[data-lang="html"]')).toHaveCount(0)
  })

  test('切回 cdn 後再切 zianoCdnSource=unpkg → html pane 連結改用 unpkg.com', async ({ page }) => {
    await page.locator('[data-cfg-key="zianoCdnSource"]').selectOption('unpkg')
    await expect(pane(page, 'html')).toContainText('unpkg.com')
  })

  test('zianoDelivery=npm 時，CDN 來源選單隱藏', async ({ page }) => {
    const $sourceField = page.locator('[data-cfg-ziano-cdn-source]')
    await expect($sourceField).toBeVisible()
    await page.locator('[data-cfg-key="zianoDelivery"]').selectOption('npm')
    await expect($sourceField).toBeHidden()
  })
})

test.describe('syntax highlight', () => {
  test('render 後 CSS Custom Highlight registry 非空', async ({ page }) => {
    await page.goto('/')
    const size = await page.evaluate(() => CSS.highlights?.size ?? 0)
    expect(size).toBeGreaterThan(0)
  })
})
