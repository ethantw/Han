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
