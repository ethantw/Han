import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/punctuation-squeeze.html')
  await expect(page.locator('body[data-ready]')).toBeVisible()
})

test('runtime and real Node SSR hit every horizontal geometry contract', async ({ page }) => {
  const rows = page.locator('[data-case]')

  await expect(rows).toHaveCount(19)
  await expect(page.locator('[data-path="ssr"][data-node-rendered]')).toHaveCount(19)
  await expect(page.locator('.Fail')).toHaveCount(0)

  // The regression that motivated the SSR repair: the close mark immediately
  // before atomic `，` must carry both the native and fallback seam facts.
  await expect(page.locator(
    '[data-case="ssr-close-hangable"] [data-path="ssr"] '
    + 'h-char[data-followed-by="hangable"][data-squeeze-next="hangable"]',
  )).toHaveCount(1)

  // Broad `middle` classification must not make a fullwidth slash squeezable.
  await expect(page.locator(
    '[data-case="noncompressible"] [data-path="ssr"] h-char[data-squeeze-next]',
  )).toHaveCount(0)
})

test('hydrating SSR markup is idempotent and keeps pair geometry', async ({ page }) => {
  const before = await page.locator('[data-path="ssr"] .Measure').evaluateAll((nodes) =>
    nodes.map((node) => node.getBoundingClientRect().width),
  )

  await page.locator('[data-path="ssr"] .Measure').evaluateAll(async (nodes) => {
    const { refinePunctuation, markQuoteBoundaries } = await import('/han/han.js')
    for (const node of nodes) {
      refinePunctuation(node)
      markQuoteBoundaries(node)
    }
  })

  const after = await page.locator('[data-path="ssr"] .Measure').evaluateAll((nodes) =>
    nodes.map((node) => node.getBoundingClientRect().width),
  )
  expect(after).toEqual(before)
  await expect(page.locator(
    '[data-case="ssr-close-hangable"] [data-path="ssr"] '
    + 'h-char[data-followed-by="hangable"]',
  )).toHaveCount(1)
})

test('vertical geometry passes on the JS fallback path', async ({ page }) => {
  const nativeTrim = await page.evaluate(() =>
    CSS.supports('text-spacing-trim', 'trim-start'),
  )
  test.skip(nativeTrim, 'native vertical text-spacing-trim is outside the JS fallback contract')

  await page.locator('#vertical').check()
  await expect(page.locator('html')).toHaveAttribute('data-writing', 'vertical')
  await expect(page.locator('.Fail')).toHaveCount(0)
})

test('fallback squeezes dividing-mark + close only in horizontal GB', async ({ page }) => {
  const nativeTrim = await page.evaluate(() =>
    CSS.supports('text-spacing-trim', 'trim-start'),
  )
  test.skip(nativeTrim, 'the regional JS fallback matrix applies only without native trim')

  await page.locator('body').evaluate(async (body) => {
    const { refinePunctuationWithMode } = await import('/han/han.js')
    const host = document.createElement('div')
    host.id = 'dividing-close-matrix'
    host.lang = 'zh-Hant'
    host.innerHTML = '<span>：」</span><span>；」</span><span>？》</span><span>！》</span>'
    body.append(host)
    for (const pair of host.querySelectorAll('span'))
      refinePunctuationWithMode('compress')(pair)
  })

  const cases = [
    ['MOE', 'horizontal-tb', false],
    ['MOE', 'vertical-rl', false],
    ['JIS', 'horizontal-tb', false],
    ['JIS', 'vertical-rl', false],
    ['GB', 'horizontal-tb', true],
    ['GB', 'vertical-rl', false],
    ['KLR', 'horizontal-tb', false],
    ['KLR', 'vertical-rl', false],
  ] as const

  for (const [convention, writingMode, squeezes] of cases) {
    await page.locator('#dividing-close-matrix').evaluate((host, config) => {
      host.style.setProperty('--han-punctuation-hant', config.convention)
      host.style.setProperty('--han-writing-mode', config.writingMode)
      host.style.writingMode = config.writingMode
    }, { convention, writingMode })

    const spacings = await page
      .locator('#dividing-close-matrix span > h-char:first-child')
      .evaluateAll((chars) => chars.map((char) => {
        const style = getComputedStyle(char)
        return {
          letterSpacing: style.letterSpacing,
          fontSize: Number.parseFloat(style.fontSize),
        }
      }))
    for (const { letterSpacing, fontSize } of spacings) {
      if (squeezes)
        expect(Number.parseFloat(letterSpacing) / fontSize, `${convention} ${writingMode}`).toBeCloseTo(-.5)
      else
        expect(letterSpacing, `${convention} ${writingMode}`).toBe('normal')
    }
  }
})
