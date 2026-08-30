import { test, expect } from '@playwright/test'

/**
 * 樣張雙生：`/specimen.html`（JS 後備跑在瀏覽器）與 `/specimen.ssr.html`
 * （跑在伺服器，建置時就把 wrapper 烤進 HTML）。
 *
 * 只驗**兩頁的差別確實是那一件事**，不驗長相——長相靠手測。
 */

test('client specimen ships bare markup; the shims arrive with the JS', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto('/specimen.html')
  await expect(page.locator('main h-char')).toHaveCount(0)
  await ctx.close()
})

test('server specimen typesets with JavaScript disabled', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto('/specimen.ssr.html')
  // 建置時裝好的三種 wrapper，一支瀏覽器 JS 都沒跑。
  expect(await page.locator('main h-char').count()).toBeGreaterThan(100)
  expect(await page.locator('main h-iss').count()).toBeGreaterThan(100)
  await ctx.close()
})

test('server specimen never loads han.js in the browser', async ({ page }) => {
  const urls: string[] = []
  page.on('request', (r) => urls.push(r.url()))
  await page.goto('/specimen.ssr.html')
  // 控制台是 UI，照樣掛載；不該被載的是排版庫自己。
  await expect(page.locator('han-console')).toHaveAttribute('no-fallbacks', '')
  expect(urls.some((u) => /\/han\/han(\.auto)?\.js/.test(u))).toBe(false)
})

test('demo default typeface switches --han-font-default on both specimens', async ({ page }) => {
  for (const url of ['/specimen.html', '/specimen.ssr.html']) {
    await page.goto(url)
    const $select = page.locator('han-console [data-demo-key="default-font"]')
    const $sample = page.locator('main [data-lang-pack][lang="zh-Hant"]')

    await expect($select).toHaveValue('sans')
    await expect(page.locator('html')).toHaveAttribute('data-demo-default-font', 'sans')
    const sans = await $sample.evaluate(($el) => getComputedStyle($el).fontFamily)
    expect(sans.trim()).toMatch(/sans-serif$/)

    await $select.selectOption('serif')
    await expect(page.locator('html')).toHaveAttribute('data-demo-default-font', 'serif')
    const serif = await $sample.evaluate(($el) => getComputedStyle($el).fontFamily)
    expect(serif.trim()).toMatch(/serif$/)
    expect(serif).not.toContain('sans-serif')
  }
})
