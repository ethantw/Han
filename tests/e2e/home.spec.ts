import { test, expect, type Page } from '@playwright/test'

/**
 * Homepage smoke for all 5 locales:
 *   /        → zh-Hant (default)
 *   /hans/   → zh-Hans
 *   /en/     → en
 *   /ja/     → ja
 *   /ko/     → ko
 *
 * Verifies the homepage builds + serves for every locale, hero
 * scaffolding renders, the language switcher opens / closes, and the
 * 5 hero toggles drive real Han.css cascade vars on the Specimen (ruby = display-only attr).
 */

const LOCALES = [
  { path: '/',      htmlLang: 'zh-Hant', label: 'hant' },
  { path: '/hans/', htmlLang: 'zh-Hans', label: 'hans' },
  { path: '/en/',   htmlLang: 'en',      label: 'en'   },
  { path: '/ja/',   htmlLang: 'ja',      label: 'ja'   },
  { path: '/ko/',   htmlLang: 'ko',      label: 'ko'   },
] as const

for (const { path, htmlLang, label } of LOCALES) {
  test(`${label}: homepage renders with html[lang="${htmlLang}"]`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)

    await expect(page.locator('html')).toHaveAttribute('lang', htmlLang)
    await expect(page.locator('body.home')).toHaveAttribute('data-locale', label)

    // Hero scaffolding. The Specimen has a magnifier-clone sibling, so
    // use .first() to disambiguate.
    await expect(page.locator('.Hero .Brand[data-size="lg"]')).toBeVisible()
    await expect(page.locator('.Hero h1')).toBeVisible()
    await expect(page.locator('.Hero .Specimen').first()).toBeVisible()
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

  // Homepage switcher uses data-lang on each link (markup convention
  // distinct from the docs chrome's hreflang form). All 5 locales
  // appear, the active one is flagged with .is-active.
  const links = switcher.locator('a[data-lang]')
  await expect(links).toHaveCount(5)

  const slugs = await links.evaluateAll(els =>
    els.map(el => el.getAttribute('data-lang')),
  )
  expect(new Set(slugs)).toEqual(new Set(['hant', 'hans', 'en', 'ja', 'ko']))
  await expect(switcher.locator('a[data-lang="hant"]')).toHaveClass(/is-active/)
})

/* Hero toggles drive REAL Han.css cascade vars on the specimen's .han
 * block (punct + hang compose --han-punctuation-refinement). Ruby stays
 * a display-only data-attr — Han.css has no ruby-off variable. */
test('hero toggles drive Han.css vars on the specimen', async ({ page }) => {
  await page.goto('/')
  const box = (feat: string) =>
    page.locator(`.Toggle input[type="checkbox"][data-feat="${feat}"]`)
  const hanVar = (prop: string) =>
    page
      .locator('.Specimen:not(.is-magnified-clone) > .han')
      .evaluate((el, p) => el.style.getPropertyValue(p), prop)

  // 預設：擠壓 on、懸掛 off → compress
  await expect.poll(() => hanVar('--han-punctuation-refinement')).toBe('compress')
  await box('hang').click()   // 兩者皆開 → auto
  await expect.poll(() => hanVar('--han-punctuation-refinement')).toBe('auto')
  await box('punct').click()  // 只剩懸掛 → hang
  await expect.poll(() => hanVar('--han-punctuation-refinement')).toBe('hang')
  await box('hang').click()   // 全關 → none
  await expect.poll(() => hanVar('--han-punctuation-refinement')).toBe('none')

  await box('mix').click()
  await expect.poll(() => hanVar('--han-text-autospace')).toBe('no-autospace')
  await box('emph').click()
  await expect.poll(() => hanVar('--han-em-symbol')).toBe('none')

  const specimen = page.locator('.Specimen:not(.is-magnified-clone)')
  await expect(specimen).toHaveAttribute('data-feat-ruby', 'on')
  await box('ruby').click()
  await expect(specimen).toHaveAttribute('data-feat-ruby', 'off')
})

test('all 5 hero toggles render', async ({ page }) => {
  await page.goto('/')
  const checkboxes = page.locator('.Toggle input[type="checkbox"][data-feat]')
  await expect(checkboxes).toHaveCount(5)
})

/**
 * Playground section — sample chips, rule toggles, metric sliders.
 * Asserts behavior (data-* flips, lang swap, inline style writes) without
 * locking visual snapshots so the spec stays cheap to run.
 */
test('playground: sample chip swaps preview lang + meta', async ({ page }) => {
  await page.goto('/')
  const body = page.locator('[data-pg-body]')
  const meta = page.locator('[data-pg-meta]')

  await expect(body).toHaveAttribute('lang', 'zh-Hant')

  await page.locator('[data-pg-chips] [data-sample="ja"]').click()
  await expect(body).toHaveAttribute('lang', 'ja')
  await expect(meta).toContainText('ja')

  await page.locator('[data-pg-chips] [data-sample="ko"]').click()
  await expect(body).toHaveAttribute('lang', 'ko')
  await expect(meta).toContainText('ko')
})

test('playground: size slider writes inline font-size + updates meta', async ({ page }) => {
  await page.goto('/')
  const body = page.locator('[data-pg-body]')
  const meta = page.locator('[data-pg-meta]')
  const slider = page.locator('[data-pg-sliders] [data-metric="size"] input[type="range"]')

  // Initial state from playground.js boot.
  await expect(body).toHaveCSS('font-size', '17px')
  await expect(meta).toContainText('17 px')

  await slider.fill('22')
  await slider.dispatchEvent('input')
  await expect(body).toHaveCSS('font-size', '22px')
  await expect(meta).toContainText('22 px')
})

test('playground: custom chip flips into Markdown input mode', async ({ page }) => {
  await page.goto('/')
  const stage = page.locator('[data-pg] [data-part="stage"]')
  const textarea = page.locator('[data-pg-custom-input]')

  await expect(textarea).toBeHidden()
  await page.locator('[data-pg-chips] [data-sample="custom"]').click()
  await expect(stage).toHaveClass(/is-custom/)
  await expect(textarea).toBeVisible()
})
