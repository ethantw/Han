import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/hanging.html')
})

test('auto-installs h-layer wrappers for every hangable mark', async ({ page }) => {
  // 5 hangable marks in the fixture: ， ， 。 、 。
  await expect(page.locator('#target h-layer')).toHaveCount(5)
  await expect(page.locator('#target h-char[data-punct~="hangable"]')).toHaveCount(5)
})

test('h-layer is positioned absolutely so it can overflow the line', async ({ page }) => {
  // The hanging-fallback CSS now has a Firefox-friendly named-size-
  // query mirror (see src/css/with-js/line-adjustments.css ~line 220),
  // so this test runs on all 3 engines.
  await expect(page.locator('#target h-layer').first()).toBeAttached()
  const position = await page
    .locator('#target h-layer')
    .first()
    .evaluate(el => getComputedStyle(el).position)
  expect(position).toBe('absolute')
})

test('matches the hanging-punctuation visual baseline', async ({ page }) => {
  await expect(page.locator('#target h-layer').first()).toBeAttached()
  await expect(page.locator('#target')).toHaveScreenshot('hanging.png', {
    maxDiffPixelRatio: 0.01,
  })
})

test('mirror: a close bracket before a hangable mark pays its ½em via letter-spacing', async ({ page }) => {
  // `」，` — the close bracket keeps its trailing ½em because the following
  // comma's glyph goes out of flow, so native trim can't squeeze it. On the
  // auto→hang (native) path the squeezer is wrapped as a PLAIN inline h-char
  // and pays the ½em with letter-spacing (v3's recipe: no justify drift, and
  // trimmed at the line end). It must stay in flow — no margin, no abspos —
  // so its own left-side squeeze survives.
  await page.goto('/tests/e2e/fixtures/hanging-mirror.html')

  const squeezer = page.locator('#target h-char[data-followed-by="hangable"]')
  await expect(squeezer).toHaveCount(1)
  await expect(squeezer).toHaveText('」')
  await expect(squeezer).toHaveAttribute('data-punct', /close/)
  // −0.5em at 18px = −9px, applied as letter-spacing (not a margin).
  await expect(squeezer).toHaveCSS('letter-spacing', '-9px')
  await expect(squeezer).toHaveCSS('margin-inline-end', '0px')
  await expect(squeezer).toHaveCSS('position', 'static')

  // the following comma is the wrapped hangable it repairs.
  await expect(
    squeezer.locator('+ h-char[data-punct~="hangable"] h-layer'),
  ).toHaveCount(1)
})

test('the pair repair rides the ½em spacer, never a margin', async ({ page }) => {
  // `，『` loses its pair squeeze when the comma's glyph goes out of flow, and
  // the h-char pays that half em back itself. It MUST do so through the
  // spacer's width: a negative margin makes the line's content measure short,
  // so `text-align: justify` stretches the line to make it up and drags every
  // character before the mark along with it (~0.45em, measured).
  await page.goto('/tests/e2e/fixtures/hanging-justify.html')
  const mark = page.locator('#target h-char[data-followed-by="open"]')
  await expect(mark).toHaveCount(1)
  await expect(mark).toHaveCSS('margin-inline-end', '0px')
  const family = await mark.evaluate(el => getComputedStyle(el, '::after').fontFamily)
  expect(family).toContain('Han Half Em Space')
})
