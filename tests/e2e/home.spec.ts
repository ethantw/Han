import { test, expect, type Page } from '@playwright/test'

/**
 * Homepage-as-playground e2e (HP-5).
 *
 * `/` is a whole-page playground: topbar + configurator rail
 * (`body[data-rail="side"|"top"]`, floating chooser persisting to
 * `localStorage['han-rail-form']`, <52rem bottom-sheet) + `<main
 * class="han">` with six stations (Manifesto, station-semantics,
 * station-type, station-lines, station-snippet, Closing). Station④
 * hosts the snippet generator (`[data-pg-views]` / `[data-out-pm]` /
 * `[data-out-copy]` / `[data-out-code]`); the rail carries all 21
 * `data-cfg-key` controls in an accordion of `details.ControlGroup`
 * (字體／標點 groups open by default, others closed), three metric
 * sliders (`[data-pg-sliders]`), and `[data-rail-reset]`.
 *
 * `/old.html` is the frozen pre-rebuild homepage, fully self-contained
 * under `/old-assets/`.
 */

const LOCALES = [
  { path: '/',      htmlLang: 'zh-Hant', label: 'hant' },
  { path: '/hans/', htmlLang: 'zh-Hans', label: 'hans' },
  { path: '/en/',   htmlLang: 'en',      label: 'en'   },
  { path: '/ja/',   htmlLang: 'ja',      label: 'ja'   },
  { path: '/ko/',   htmlLang: 'ko',      label: 'ko'   },
] as const

/** 配置群組是 <details> 手風琴——收合組裡的控件要先展開才可見。 */
const openGroupOf = (page: Page, cfgKey: string) =>
  page
    .locator(`details.ControlGroup:not([open]):has([data-cfg-key="${cfgKey}"]) > summary`)
    .click()

for (const { path, htmlLang, label } of LOCALES) {
  test(`${label}: homepage renders — topbar, rail, all six stations`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)

    await expect(page.locator('html')).toHaveAttribute('lang', htmlLang)
    await expect(page.locator('body.home')).toHaveAttribute('data-locale', label)

    await expect(page.locator('.Topbar .Brand')).toBeVisible()
    await expect(page.locator('main.han')).toHaveCount(1)
    await expect(page.locator('aside.Rail')).toBeVisible()

    // Six stations, in document order: Manifesto, semantics, type,
    // lines, snippet, Closing.
    await expect(page.locator('main.han > .Manifesto')).toBeVisible()
    await expect(page.locator('#station-semantics')).toBeVisible()
    await expect(page.locator('#station-type')).toBeVisible()
    await expect(page.locator('#station-lines')).toBeVisible()
    await expect(page.locator('#station-snippet')).toBeVisible()
    await expect(page.locator('main.han > .Closing')).toBeVisible()
  })
}

test('lang switcher: button opens menu, outside click closes', async ({ page }) => {
  await page.goto('/')

  const switcher = page.locator('[data-lang-switcher]').first()
  const button = switcher.locator('button[aria-haspopup="true"]')

  await expect(button).toHaveAttribute('aria-expanded', 'false')
  await button.click()
  await expect(button).toHaveAttribute('aria-expanded', 'true')

  // Outside click should collapse the menu.
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await expect(button).toHaveAttribute('aria-expanded', 'false')
})

test('lang switcher menu lists all 5 locales (with the active one flagged)', async ({ page }) => {
  await page.goto('/')
  const switcher = page.locator('[data-lang-switcher]').first()
  await switcher.locator('button[aria-haspopup="true"]').click()

  const links = switcher.locator('a[data-lang]')
  await expect(links).toHaveCount(5)

  const slugs = await links.evaluateAll(els =>
    els.map(el => el.getAttribute('data-lang')),
  )
  expect(new Set(slugs)).toEqual(new Set(['hant', 'hans', 'en', 'ja', 'ko']))
  await expect(switcher.locator('a[data-lang="hant"]')).toHaveClass(/is-active/)
})

test('old.html: 200, provenance marker, own frozen snippet renders', async ({ page, request }) => {
  const response = await page.goto('/old.html')
  expect(response?.status()).toBe(200)

  // The provenance comment sits between <!doctype> and <html> — not part
  // of the parsed DOM subtree `page.content()` serializes, so fetch the
  // raw source instead.
  const raw = await (await request.get('/old.html')).text()
  expect(raw).toContain('frozen snapshot of the pre-rebuild homepage')

  // The old page's own configurator/codegen (frozen under /old-assets/)
  // still boots and dumps a bundler-tab snippet with the install line.
  const code = page.locator('[data-out-code]').first()
  await expect(code).toContainText('pnpm add @hanzi.pro/han.css')
})

test.describe('rail forms — chooser + persistence', () => {
  test('chooser switches body[data-rail] and persists across reload', async ({ page }) => {
    await page.goto('/')
    const body = page.locator('body')
    await expect(body).toHaveAttribute('data-rail', 'side')

    await page.locator('[data-rail-chooser] [data-rail-form="top"]').click()
    await expect(body).toHaveAttribute('data-rail', 'top')
    expect(await page.evaluate(() => localStorage.getItem('han-rail-form'))).toBe('top')

    await page.reload()
    await expect(body).toHaveAttribute('data-rail', 'top')

    await page.locator('[data-rail-chooser] [data-rail-form="side"]').click()
    await expect(body).toHaveAttribute('data-rail', 'side')
    expect(await page.evaluate(() => localStorage.getItem('han-rail-form'))).toBe('side')
  })
})

test.describe('whole-page configuration', () => {
  test('rail toggle drives inline var on main.han; station④ snippet reflects it', async ({ page }) => {
    await page.goto('/')
    const main = page.locator('main.han')

    await openGroupOf(page, 'squeeze')
    await page.locator('[data-cfg-key="squeeze"]').uncheck()
    await expect
      .poll(() => main.evaluate(el => el.style.getPropertyValue('--han-punctuation-refinement')))
      .toBe('hang')

    // Radios in the ViewTabs are sr-only — click the label, not the input.
    await page.locator('[data-pg-views] label:has(input[value="cdn"])').click()
    await expect(page.locator('[data-out-code]'))
      .toContainText('--han-punctuation-refinement: hang')
  })
})

test.describe('rail reset', () => {
  test('reset clears inline vars and restores metric sliders + main font-size', async ({ page }) => {
    await page.goto('/')
    const main = page.locator('main.han')

    await openGroupOf(page, 'squeeze')
    await page.locator('[data-cfg-key="squeeze"]').uncheck()
    await expect
      .poll(() => main.evaluate(el => el.style.getPropertyValue('--han-punctuation-refinement')))
      .toBe('hang')

    const sizeSlider = page.locator('[data-pg-sliders] [data-metric="size"] input[type="range"]')
    await sizeSlider.fill('22')
    await sizeSlider.dispatchEvent('input')
    await expect(main).toHaveCSS('font-size', '22px')

    await page.locator('[data-rail-reset]').click()

    await expect
      .poll(() => main.evaluate(el => el.style.getPropertyValue('--han-punctuation-refinement')))
      .toBe('')
    await expect(sizeSlider).toHaveValue('17')
    await expect(main).toHaveCSS('font-size', '17px')
  })
})

test.describe('mobile bottom sheet', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('grip visible; keyboard focus + Space expands the sheet', async ({ page }) => {
    await page.goto('/')
    const grip = page.locator('[data-rail-grip]')
    await expect(grip).toBeVisible()

    const scroll = page.locator('.RailScroll')
    const collapsedHeight = await scroll.evaluate(el => el.getBoundingClientRect().height)

    const toggle = page.locator('.RailSheetToggle')
    await toggle.focus()
    await page.keyboard.press('Space')

    await expect
      .poll(async () => scroll.evaluate(el => el.getBoundingClientRect().height))
      .toBeGreaterThan(collapsedHeight)
  })
})

test.describe('fallbacks — JS layer', () => {
  test('checking fallbacks installs h-iss on main.han; unchecking removes them', async ({ page }) => {
    await page.goto('/')
    const main = page.locator('main.han')

    await openGroupOf(page, 'fallbacks')
    const fallbacks = page.locator('[data-cfg-key="fallbacks"]')

    await fallbacks.check()
    await expect
      .poll(() => main.locator('h-iss').count())
      .toBeGreaterThan(0)

    await fallbacks.uncheck()
    await expect
      .poll(() => main.locator('h-iss').count())
      .toBe(0)
  })
})
