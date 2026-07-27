import { test, expect, type Page } from '@playwright/test'

/**
 * Station⑤ playground (user-content editor) e2e.
 *
 * The station (`#station-playground`) hosts a `<textarea data-pg-src>`
 * (Code tab) whose Markdown/HTML is rendered — marked → DOMPurify →
 * `<article data-pg-preview>` (Preview tab, default). The preview lives
 * inside `main.han`, so the console's `--han-*` vars inherit into it. Text
 * persists to `localStorage['han-playground-src']`; the console's Reset never
 * touches it.
 */

const KEY = 'han-playground-src'

const $preview = (page: Page) => page.locator('#station-playground [data-pg-preview]')
const $src = (page: Page) => page.locator('#station-playground [data-pg-src]')
const showCode = (page: Page) =>
  page.locator('#station-playground [data-pg-editor-views] label:has(input[value="code"])').click()
const showPreview = (page: Page) =>
  page.locator('#station-playground [data-pg-editor-views] label:has(input[value="preview"])').click()

/** Type source into the (hidden-under-Preview) textarea: reveal Code, fill,
 *  back to Preview so assertions see the rendered result. */
const setSource = async (page: Page, src: string) => {
  await showCode(page)
  await $src(page).fill(src)
  await showPreview(page)
}

/** 配置群組是 shadow 內的 <details> 手風琴——收合組裡的控件先展開。 */
const openGroupOf = (page: Page, cfgKey: string) =>
  page
    .locator(`details.ControlGroup:not([open]):has([data-cfg-key="${cfgKey}"]) > summary`)
    .click()

test.describe('station⑤ playground', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Playground boots after the fonts gate opens (perf: its 190KB
    // vendor is deferred past the stroke ceremony). Wait for the ready
    // signal instead of racing the deferred dynamic import.
    await page.waitForSelector('html[data-pg-ready]')
  })

  test('default sample renders in the preview (Markdown → h2 + em dots)', async ({ page }) => {
    // Preview is the default tab; the shipped sample is Markdown with an
    // <em>, so parsing must yield an <h2> and at least one <em>.
    await expect($preview(page).locator('h2')).toHaveCount(1)
    await expect($preview(page).locator('em').first()).toBeVisible()
  })

  test('typing Markdown + inline HTML updates the preview', async ({ page }) => {
    await setSource(page, '## 標題\n\n這是<strong>粗體</strong>與*斜體*。')
    await expect($preview(page).locator('h2')).toHaveText('標題')
    await expect($preview(page).locator('strong')).toHaveText('粗體')
    await expect($preview(page).locator('em')).toHaveText('斜體')
  })

  test('XSS attempts are neutralized (no script / onerror / javascript: href)', async ({ page }) => {
    await setSource(
      page,
      [
        '<script>window.__pwned = 1</script>',
        '<img src=x onerror="window.__pwned = 1">',
        '<a href="javascript:window.__pwned = 1">click</a>',
      ].join('\n\n'),
    )

    // No script element survives.
    await expect($preview(page).locator('script')).toHaveCount(0)
    // No element retains an onerror handler.
    expect(
      await $preview(page).evaluate((el) => el.querySelectorAll('[onerror]').length),
    ).toBe(0)
    // No javascript: href survives.
    expect(
      await $preview(page).evaluate((el) =>
        [...el.querySelectorAll('a')].some((a) =>
          (a.getAttribute('href') ?? '').trim().toLowerCase().startsWith('javascript:')),
      ),
    ).toBe(false)
    // The handler never fired.
    expect(await page.evaluate(() => (window as Record<string, unknown>).__pwned ?? null)).toBeNull()
  })

  test('formatting surface survives sanitization (ruby / lang / data-*)', async ({ page }) => {
    await setSource(
      page,
      '<span lang="ja">日本語</span>\n\n<ruby>漢<rt>かん</rt></ruby>\n\n<span data-foo="bar">x</span>',
    )
    await expect($preview(page).locator('span[lang="ja"]')).toHaveText('日本語')
    await expect($preview(page).locator('ruby rt')).toHaveText('かん')
    await expect($preview(page).locator('[data-foo="bar"]')).toHaveCount(1)
  })

  test('text persists to localStorage and is restored across reload', async ({ page }) => {
    const marker = '# PERSIST-' + Date.now()
    await setSource(page, marker)
    await expect
      .poll(() => page.evaluate((k) => localStorage.getItem(k), KEY))
      .toContain(marker)

    await page.reload()
    await expect($src(page)).toHaveValue(marker)
    await expect($preview(page).locator('h1')).toHaveText(marker.slice(2))
  })

  test('console interplay: a console control writes --han-* on main.han; the preview inherits it', async ({ page }) => {
    const main = page.locator('main.han')

    // The preview must be a descendant of main.han (so it inherits config).
    expect(await main.locator('[data-pg-preview]').count()).toBe(1)

    await openGroupOf(page, 'squeeze')
    await page.locator('[data-cfg-key="squeeze"]').uncheck()

    await expect
      .poll(() => main.evaluate((el) => el.style.getPropertyValue('--han-punctuation-refinement')))
      .toBe('hang')

    // Inherited all the way down to the preview article (computed value).
    await expect
      .poll(() =>
        $preview(page).evaluate((el) =>
          getComputedStyle(el).getPropertyValue('--han-punctuation-refinement').trim()),
      )
      .toBe('hang')
  })
})
