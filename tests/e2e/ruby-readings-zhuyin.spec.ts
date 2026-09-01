import { test, expect } from '@playwright/test'

test('each localized heading resolves the alternative stack on its own lang boundary', async ({ page }) => {
  await page.goto('/demo/ruby-readings.html')

  const expected = [
    ['minnan', 'nan-Hant-TW', 'Diantenjeom Serif MOE'],
    ['mandarin', 'zh-Hant-TW', 'Diantenjeom Serif MOE'],
    ['japanese', 'ja', 'Diantenjeom Serif JIS'],
    ['korean', 'ko', 'Diantenjeom Serif KLR'],
  ] as const

  for (const [mode, lang, family] of expected) {
    await page.locator(`[name="reading-mode"][value="${mode}"]`).check({ force: true })
    const heading = page.locator(`#story-title > h2[data-language="${mode}"]`)

    await expect(heading).toHaveAttribute('lang', lang)
    await expect(heading).toBeVisible()
    await expect(heading).toHaveCSS('font-family', new RegExp(family))
  }

  const minnan = page.locator('#story-title > h2[data-language="minnan"]')
  expect(await minnan.evaluate(element => element.matches(':lang(nan)'))).toBe(true)
  expect(await minnan.evaluate(element => element.matches(':lang(zh)'))).toBe(false)
})

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

test('emphasized dual readings use nested ruby shapes', async ({ page }) => {
  await page.goto('/demo/ruby-readings.html')

  for (const mode of ['minnan', 'mandarin']) {
    await page.locator(`[name="reading-mode"][value="${mode}"]`).check({ force: true })
    const emphasis = page.locator('.Dispatch em[data-emphasis="id"]').first()
    await expect(emphasis.locator(':scope > ruby.zhuyin')).toHaveCount(4)
    await expect(emphasis.locator('xpath=..')).toHaveJSProperty('tagName', 'RUBY')
    await expect(emphasis.locator('xpath=../rt')).toHaveCount(1)
  }

  await page.locator('[name="reading-mode"][value="korean"]').check({ force: true })
  const koreanEmphasis = page.locator('.Dispatch em[data-emphasis="id"]').first()
  const koreanInnerRuby = koreanEmphasis.locator(':scope > ruby')
  const koreanOuterRuby = koreanEmphasis.locator('xpath=..')
  await expect(koreanInnerRuby.locator(':scope > rt[lang="ko-Hani"]')).toHaveCount(1)
  await expect(koreanOuterRuby).toHaveJSProperty('tagName', 'RUBY')
  await expect(koreanOuterRuby.locator(':scope > rt[lang="ko-Latn"]')).toHaveCount(1)
  await expect(koreanInnerRuby).toHaveCSS('ruby-position', 'over')
  await expect(koreanOuterRuby).toHaveCSS('ruby-position', 'under')
})
