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
    ['minnan', '巴星採礦告捷。超導磁噴嘴有望成真。'],
    ['mandarin', '巴星採礦告捷。超導磁噴嘴有望成真。'],
    ['japanese', 'バーナード星採鉱成功。超伝導磁気ノズル実現へ。'],
    ['korean', '바너드성 채광 성공. 초전도 자기 노즐 실현 눈앞.'],
  ] as const

  for (const [mode, headline] of expected) {
    await page.locator(`[name="reading-mode"][value="${mode}"]`).check({ force: true })
    await expect(page.locator('button[name="speak"][value="story"]')).toHaveAttribute(
      'data-speech',
      new RegExp(`^${headline}`),
    )
  }
})

test('element speech begins with each localized table title', async ({ page }) => {
  await page.goto('/demo/ruby-readings.html')

  const expected = [
    ['minnan', '巴納德任務元素表。'],
    ['mandarin', '巴納德任務元素表。'],
    ['japanese', 'バーナード任務元素表。'],
    ['korean', '바너드 임무 원소표. '],
  ] as const

  for (const [mode, title] of expected) {
    await page.locator(`[name="reading-mode"][value="${mode}"]`).check({ force: true })
    const speech = await page.locator('button[name="speak"][value="elements"]').getAttribute('data-speech')
    expect(speech?.startsWith(title), mode).toBe(true)
  }
})
