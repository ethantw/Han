import { test, expect } from '@playwright/test'

/**
 * Cross-page asset caching — the two halves of one contract:
 *
 *   1. Both the homepage and the docs link the framework as its FOUR
 *      modules, at the SAME URLs. That's what lets a home→docs hop serve
 *      the framework from cache (before, the docs pulled the combined
 *      `han.css`: identical rules, a different URL, downloaded twice),
 *      and it's what gives `<han-rail>`'s module switches something to
 *      toggle on the docs too (`applyModules` flips
 *      `link[data-han-module].disabled`).
 *   2. Those URLs are content-hashed under `/assets/`, the one prefix
 *      `public/_headers` marks `immutable` — so the URLs must carry a hash
 *      (a plain `/han/…` href would silently lose the immutable cache).
 *
 * Build-output contract, so it asserts on hrefs, not pixels. `hashLinkedSheets()`
 * in `manual/vite.config.js` is the producer.
 */

const HASHED = /^\/assets\/han\.\w+\.\w{8}\.css$/

const moduleLinks = (page) =>
  page.locator('link[data-han-module]').evaluateAll((els: HTMLLinkElement[]) =>
    els.map((el) => ({ mod: el.dataset.hanModule, href: el.getAttribute('href') })),
  )

test('homepage and docs link the same four hashed module sheets', async ({ page }) => {
  await page.goto('/')
  const home = await moduleLinks(page)
  await page.goto('/manual/')
  const docs = await moduleLinks(page)

  expect(home.map((l) => l.mod)).toEqual(['semantics', 'lines', 'prose', 'fonts'])
  expect(docs).toEqual(home)                      // same URLs → second page hits cache
  for (const { href } of docs) expect(href).toMatch(HASHED)
})

test('the docs page really parses all four module sheets', async ({ page }) => {
  const broken: string[] = []
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().endsWith('.css')) broken.push(`${r.status()} ${r.url()}`)
  })
  await page.goto('/manual/')

  // cssRules is readable (same-origin) and non-empty → the sheet loaded and parsed
  const ruleCounts = await page.evaluate(() =>
    [...document.styleSheets]
      .filter((s) => s.href?.includes('/assets/han.'))
      .map((s) => {
        try {
          return s.cssRules.length
        } catch {
          return -1
        }
      }),
  )
  expect(ruleCounts).toHaveLength(4)
  for (const n of ruleCounts) expect(n).toBeGreaterThan(0)
  expect(broken).toEqual([])
})

test('the page stylesheet is hashed too, on both pages', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('link[href^="/assets/home."]')).toHaveCount(1)
  await page.goto('/manual/')
  await expect(page.locator('link[href^="/assets/manual."]')).toHaveCount(1)
})
