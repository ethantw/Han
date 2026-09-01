import { test, expect } from '@playwright/test'

test('localized headline annotations retain the Han Zhuyin face', async ({ page }) => {
  await page.goto('/demo/ruby-readings.html')

  const expected = [
    ['minnan', 'nan-Bopo-TW'],
    ['mandarin', 'zh-Bopo-TW'],
  ] as const

  for (const [mode, lang] of expected) {
    await page.locator(`[name="reading-mode"][value="${mode}"]`).check({ force: true })
    const annotations = page.locator(`#story-title [data-language="${mode}"] ruby.zhuyin > rt`)

    await expect(annotations.first()).toHaveAttribute('lang', lang)
    await expect(annotations.first()).toHaveCSS('font-family', /Han Zhuyin Serif/)
    expect(await annotations.evaluateAll((elements) => elements.every(
      (element) => getComputedStyle(element).fontFamily.includes('Han Zhuyin Serif'),
    ))).toBe(true)
  }
})

test('read-all speech begins with each localized headline', async ({ page }) => {
  await page.goto('/demo/ruby-readings.html')

  const expected = [
    ['minnan', '巴納德星採礦團告捷。超導磁喉有望成真。'],
    ['mandarin', '巴納德星採礦團告捷。超導磁喉有望成真。'],
    ['japanese', 'バーナード星採鉱団、任務成功。超伝導磁気ノズル実現へ。'],
    ['korean', '바너드성 채광단 임무 성공. 초전도 자기 노즐 실현 눈앞.'],
  ] as const

  for (const [mode, headline] of expected) {
    await page.locator(`[name="reading-mode"][value="${mode}"]`).check({ force: true })
    await expect(page.locator('button[name="speak"][value="story"]')).toHaveAttribute(
      'data-speech',
      new RegExp(`^${headline}`),
    )
  }
})
