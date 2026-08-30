import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/demo/ruby-zhuyin-config.html')
  await page.evaluate(() => localStorage.removeItem('han:taisol-ruby:controls:v3'))
  await page.evaluate(() => localStorage.removeItem('han:taisol-ruby:controls:v2'))
  await page.reload()
})

test('ships with calibrated defaults and no redundant CSS output', async ({ page }) => {
  await expect(page.locator('#font-source-shanggu')).toBeChecked()
  await expect(page.locator('#type-size')).toHaveValue('16')
  await expect(page.locator('#type-weight')).toHaveValue('400')
  await expect(page.locator('#zhuyin-size')).toHaveValue('0.3')
  await expect(page.locator('#zhuyin-baseline')).toHaveValue('0')
  await expect(page.locator('#over-gap')).toHaveValue('0.25')
  await expect(page.locator('#rt-letter-spacing')).toHaveValue('-0.05')
  await expect(page.locator('[data-css-result]')).toHaveText('')
  await expect(page.locator('[data-css-panel]')).toBeHidden()
  await expect(page.locator('[data-css-empty]')).toBeVisible()
})

test('migrates v2 settings but resets its incompatible top-based baseline value', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.removeItem('han:taisol-ruby:controls:v3')
    localStorage.setItem('han:taisol-ruby:controls:v2', JSON.stringify({
      font: 'sans',
      'type-size': '24',
      'zhuyin-size': '.4',
      'zhuyin-baseline': '-.6',
    }))
  })
  await page.reload()

  await expect(page.locator('#font-sans')).toBeChecked()
  await expect(page.locator('#type-size')).toHaveValue('24')
  await expect(page.locator('#zhuyin-size')).toHaveValue('0.4')
  await expect(page.locator('#zhuyin-baseline')).toHaveValue('0')

  const migrated = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('han:taisol-ruby:controls:v3') ?? '{}'),
  )
  expect(migrated['zhuyin-baseline']).toBe('0')
})

test('switches Ming and Sans between Shanggu, system Japanese, and generic fallback stacks', async ({ page }) => {
  const copy = page.locator('.copy').first()

  await expect(copy).toHaveCSS('font-family', /Shanggu Serif/)

  await page.locator('#font-source-system-ja').check()
  await expect(copy).toHaveCSS('font-family', /Hiragino Mincho ProN/)
  await expect(copy).not.toHaveCSS('font-family', /Shanggu/)

  await page.locator('#font-sans').check()
  await expect(copy).toHaveCSS('font-family', /Hiragino Sans/)

  await page.locator('#font-source-shanggu').check()
  await expect(copy).toHaveCSS('font-family', /Shanggu Sans/)

  await page.locator('#font-source-off').check()
  await expect(copy).not.toHaveCSS('font-family', /Shanggu|Hiragino|Yu Gothic|Noto Sans CJK JP/)
  await expect(copy).toHaveCSS('font-family', /sans-serif$/)

  await page.reload()
  await expect(page.locator('#font-source-off')).toBeChecked()
  await expect(page.locator('#font-sans')).toBeChecked()
})

test('generates only ruby variables that differ from defaults', async ({ page }) => {
  await page.locator('#type-size').fill('24')
  await page.locator('#type-weight').fill('700')
  await expect(page.locator('[data-css-result]')).toHaveText('')

  await page.locator('#zhuyin-size').fill('0.31')
  await page.locator('#over-gap').fill('0.65')
  await page.locator('#rt-letter-spacing').fill('-0.0625')
  await expect(page.locator('[data-css-result]')).toHaveText([
    ':root {',
    '  --han-ruby-zhuyin-font-size: .31em;',
    '  --han-ruby-zhuyin-over-gap: .65em;',
    '  --han-ruby-zhuyin-letter-spacing: -.0625em;',
    '}',
  ].join('\n'))
  await expect(page.locator('[data-css-panel]')).toBeVisible()
  await expect(page.locator('[data-css-empty]')).toBeHidden()

  await page.locator('#zhuyin-size').fill('0.3')
  await page.locator('#over-gap').fill('0.25')
  await page.locator('#rt-letter-spacing').fill('-0.05')
  await expect(page.locator('[data-css-result]')).toHaveText('')
  await expect(page.locator('[data-css-panel]')).toBeHidden()
})
