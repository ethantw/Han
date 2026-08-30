import { test, expect } from '@playwright/test'

/**
 * Docs chrome smoke. Verifies every locale renders the expected
 * sidebar / breadcrumb / pager scaffolding, the active page picks up
 * `aria-current="page"`, and that pages outside the current locale
 * (translated subset only) gracefully fall back via the chrome's
 * available-pages filter.
 */

const DOCS_ROUTES = [
  { path: '/manual/',                  htmlLang: 'zh-Hant', heading: '簡介'        },
  { path: '/manual/install.html',      htmlLang: 'zh-Hant', heading: '安裝與啓用'  },
  { path: '/en/manual/',               htmlLang: 'en',      heading: 'Introduction' },
  { path: '/ja/manual/',               htmlLang: 'ja',      heading: '紹介'        },
  { path: '/hans/manual/',             htmlLang: 'zh-Hans', heading: '简介'        },
  { path: '/ko/manual/',               htmlLang: 'ko',      heading: '소개'        },
] as const

for (const { path, htmlLang, heading } of DOCS_ROUTES) {
  test(`${path} renders with html[lang="${htmlLang}"]`, async ({ page }) => {
    // This contract is the server-rendered document (status, lang, heading),
    // not the completion time of every font and deferred asset. Waiting for
    // full `load` made one route randomly consume the whole 30s test budget
    // under the four-worker homepage suite even though its HTML had arrived.
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)

    await expect(page.locator('html')).toHaveAttribute('lang', htmlLang)
    await expect(page.locator('main h1').first()).toContainText(heading)
  })
}

test('docs chrome ships sidebar / crumbs / pager / page-toc / colophon', async ({ page }) => {
  await page.goto('/manual/')
  await expect(page.locator('header.Masthead')).toBeVisible()
  // The switcher is the dropdown `div.LangSwitcher` (same component as
  // the homepage), not the old `nav` — updated 2026-07-20.
  await expect(page.locator('.LangSwitcher')).toBeVisible()
  await expect(page.locator('nav.Sidebar')).toBeVisible()
  await expect(page.locator('nav.Crumbs')).toBeVisible()
  await expect(page.locator('nav.Pager')).toBeVisible()
  await expect(page.locator('aside.PageToc')).toBeVisible()
  await expect(page.locator('footer.Colophon')).toBeVisible()
})

test('search results use content elements and keep keyboard dismissal', async ({ page }) => {
  await page.goto('/manual/')
  const search = page.locator('.SiteSearch input[type="search"]')
  await search.fill('標點')

  const result = page.locator('.SiteSearch .Result').first()
  await expect(result).toBeVisible()
  await expect(result.locator(':scope > strong.Title')).toHaveCount(1)
  await expect(result.locator(':scope > p.Snippet')).toHaveCount(1)
  await expect(page.locator('.SiteSearch .Status')).toHaveAttribute('role', 'status')
  await expect(page.locator('.SiteSearch footer.Foot')).toHaveCount(1)

  await page.keyboard.press('Escape')
  await expect(page.locator('.SiteSearch > .Panel')).toBeHidden()
})

test('active sidebar entry on /manual/ has aria-current="page"', async ({ page }) => {
  await page.goto('/manual/')
  const active = page.locator('nav.Sidebar a[aria-current="page"]')
  await expect(active).toHaveCount(1)
  await expect(active).toHaveAttribute('href', /\/manual\/?$/)
})

test('active sidebar entry on /manual/install.html has aria-current="page"', async ({ page }) => {
  await page.goto('/manual/install.html')
  const active = page.locator('nav.Sidebar a[aria-current="page"]')
  await expect(active).toHaveCount(1)
  await expect(active).toHaveAttribute('href', /install/)
})

test('breadcrumb on /manual/install.html names section + page', async ({ page }) => {
  await page.goto('/manual/install.html')
  const crumbs = page.locator('nav.Crumbs')
  await expect(crumbs).toContainText('文檔')
  await expect(crumbs).toContainText('從何開始')
  await expect(crumbs).toContainText('安裝與啓用')
})

test('pager links to next page on /manual/ (intro → install)', async ({ page }) => {
  await page.goto('/manual/')
  const pager = page.locator('nav.Pager')
  // Intro is the first page, so prev is missing/disabled and next is install.
  const next = pager.locator('a').last()
  await expect(next).toHaveAttribute('href', /install/)
})

test('lang switcher in docs chrome lists all five locales for the intro page', async ({ page }) => {
  // The dropdown switcher lists every locale with an available page —
  // intro exists in all five — including the active one (marked
  // aria-current). Updated 2026-07-20 for the dropdown chrome.
  await page.goto('/manual/')
  const switcher = page.locator('.LangSwitcher a[hreflang]')
  await expect(switcher).toHaveCount(5)
  const tags = await switcher.evaluateAll(els =>
    els.map(el => el.getAttribute('hreflang')),
  )
  expect(new Set(tags)).toEqual(new Set(['zh-Hant', 'en', 'ja', 'zh-Hans', 'ko']))
  await expect(page.locator('.LangSwitcher a[aria-current]')).toHaveAttribute('hreflang', 'zh-Hant')
})

test('hans/ko intro page exists (built from src/docs/<loc>/index.md stubs)', async ({ page }) => {
  for (const path of ['/hans/manual/', '/ko/manual/']) {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    // Stub pages still render the Sidebar / Pager chrome.
    await expect(page.locator('nav.Sidebar')).toBeVisible()
  }
})
