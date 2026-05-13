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
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)

    await expect(page.locator('html')).toHaveAttribute('lang', htmlLang)
    await expect(page.locator('main h1').first()).toContainText(heading)
  })
}

test('docs chrome ships sidebar / crumbs / pager / page-toc / colophon', async ({ page }) => {
  await page.goto('/manual/')
  await expect(page.locator('header.Masthead')).toBeVisible()
  await expect(page.locator('nav.LangSwitcher')).toBeVisible()
  await expect(page.locator('nav.Sidebar')).toBeVisible()
  await expect(page.locator('nav.Crumbs')).toBeVisible()
  await expect(page.locator('nav.Pager')).toBeVisible()
  await expect(page.locator('aside.PageToc')).toBeVisible()
  await expect(page.locator('footer.Colophon')).toBeVisible()
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

test('lang switcher in docs chrome offers en + ja for the intro page', async ({ page }) => {
  // / has en/ja translations available; hans/ko intros also exist
  // post-2026-04-30. So the switcher should expose 4 alternates.
  await page.goto('/manual/')
  const switcher = page.locator('nav.LangSwitcher a[hreflang]')
  await expect(switcher).toHaveCount(4)
  const tags = await switcher.evaluateAll(els =>
    els.map(el => el.getAttribute('hreflang')),
  )
  expect(new Set(tags)).toEqual(new Set(['en', 'ja', 'zh-Hans', 'ko']))
})

test('hans/ko intro page exists (built from src/docs/<loc>/index.md stubs)', async ({ page }) => {
  for (const path of ['/hans/manual/', '/ko/manual/']) {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    // Stub pages still render the Sidebar / Pager chrome.
    await expect(page.locator('nav.Sidebar')).toBeVisible()
  }
})
