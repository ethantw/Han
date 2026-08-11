import { test, expect, type Page } from '@playwright/test'

/**
 * Station⑤ playground (user-content editor) e2e.
 *
 * The station (`#station-playground`) hosts a `<textarea data-pg-src>`
 * (Code tab) whose Markdown/HTML is rendered — marked → DOMPurify →
 * `<article data-pg-preview>` (Preview tab, default). The preview lives
 * inside `main`, so the console's `--han-*` vars inherit into it. Text
 * persists to `localStorage['han-playground-src']`; the console's Reset never
 * touches it.
 */

const KEY = 'han-playground-src'

const $preview = (page: Page) => page.locator('#station-playground [data-pg-preview]')
const $src = (page: Page) => page.locator('#station-playground [data-pg-src]')
const $tabs = (page: Page) => page.locator('#station-playground [data-pg-editor-views]')

/** Tab clicks are only a thing in the NARROW panel. From 48rem of panel width
 *  the editor is two-pane (playground.css § 夠寬就不必分頁): both source and
 *  preview are on screen at once and the whole tab strip is `display: none`,
 *  so clicking it would just hang. The default e2e viewport (1280) IS
 *  two-pane — measured: 936px of panel — hence the guard rather than a
 *  narrow-only assumption. */
const showTab = async (page: Page, value: 'code' | 'preview') => {
  if (!(await $tabs(page).isVisible())) return
  await $tabs(page).locator(`label:has(input[value="${value}"])`).click()
}
const showCode = (page: Page) => showTab(page, 'code')
const showPreview = (page: Page) => showTab(page, 'preview')

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

  test('default sample renders in the preview (a whole 太陽中文報 piece, marked up)', async ({ page }) => {
    // The shipped sample is one full taisol article (zh/trump-sashimi.md) with
    // han-semantics elements applied — headline and four sections; the
    // dateline is paper chrome, asserted below.
    await expect($preview(page).locator('h1')).toHaveCount(1)
    await expect($preview(page).locator('h2')).toHaveCount(4)
    await expect($preview(page).locator('em').first()).toBeVisible()

    // …and it exercises the elements han.semantics.css actually styles, which
    // is the whole point of shipping a real article rather than a snippet.
    for (const sel of ['u', 'q', 'dfn', 'i[lang]', 'ruby.zhuyin > rt', 'blockquote'])
      expect(await $preview(page).locator(sel).count()).toBeGreaterThan(0)

    // The dateline is card CHROME above the editable article (so it can't
    // be pickled into a localStorage draft), rewritten on boot to «today +
    // 100 years» — the same instant station①'s newspaper datelines carry
    // (home/papers-dateline.js owns the date; the playground borrows it).
    const plus100 = new Date().getFullYear() + 100
    const $time = page.locator('#station-playground [data-pg-dateline]')
    await expect($time).toHaveAttribute('datetime', new RegExp(`^${plus100}-`))
    await expect($time).toContainText('中華民國')
    await expect($time).toContainText('夏曆')
    await expect($time).toContainText('弘宙元年')
    await expect($time).toContainText('西元')
  })

  test('typing Markdown + inline HTML updates the preview', async ({ page }) => {
    await setSource(page, '## 標題\n\n這是<strong>粗體</strong>與*斜體*。')
    /* ARRAY form on purpose. The render is debounced, so the first poll still
       sees the shipped sample — a whole article with four <h2> and five <em>
       — and `toHaveText('…')` against a multi-element locator is a strict-mode
       violation, which THROWS instead of retrying. The list form is defined
       over «all matches», so it just fails that poll and waits. */
    await expect($preview(page).locator('h2')).toHaveText(['標題'])
    await expect($preview(page).locator('strong')).toHaveText(['粗體'])
    await expect($preview(page).locator('em')).toHaveText(['斜體'])
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

  test('the two content buffers are independent, and a blanked one refills', async ({ page }) => {
    // 報導 and 自訂內容 are separate pages, each with its own default.
    const tab = (label: string) =>
      page.locator('#station-playground [data-pg-content-tabs] label').filter({ hasText: label }).click()

    await tab('自訂內容')
    await expect($src(page)).toHaveValue(/在這裡寫你自己的字/)

    const mine = '# MINE-' + Date.now()
    await setSource(page, mine)
    await tab('報導')
    await expect($src(page)).toHaveValue(/太陽中文報/)   // the article, untouched
    await tab('自訂內容')
    await expect($src(page)).toHaveValue(mine)

    // Emptying a buffer is how a reader says「從頭來過」: the blank must not
    // come back as a saved draft — the default does.
    await setSource(page, '   \n  ')
    await page.reload()
    await tab('自訂內容')
    await expect($src(page)).toHaveValue(/在這裡寫你自己的字/)
  })

  test('the content tabs follow the panes into 認真模式', async ({ page }) => {
    // One fieldset, moved — not a second copy kept in sync.
    await page.locator('#station-playground [data-pg-focus]').click()
    await expect(page.locator('[data-pg-studio-head] [data-pg-content-tabs]')).toBeVisible()

    await page.locator('[data-pg-studio] [data-pg-content-tabs] label')
      .filter({ hasText: '自訂內容' }).click()
    await expect($src(page)).toHaveValue(/在這裡寫你自己的字/)

    await page.locator('[data-pg-studio-close]').click()
    await expect(page.locator('.PgControls > [data-pg-content-tabs]')).toBeVisible()
  })

  test('a re-render re-installs the JS fallbacks, so *.with-js.css has wrappers to select', async ({ page }) => {
    // `innerHTML` replaces the whole preview subtree, and han.js's wrappers
    // live IN it — without a second pass over the new nodes, `<h-char>` /
    // `<h-iss>` are simply gone and every `han.*.with-js.css` rule matches
    // nothing. Fallbacks are on by default (codegen DEFAULTS.fallbacks), so
    // typing must leave wrappers behind (playground.js § scheduleRender).
    await setSource(page, '這一行有「引號」，還有句讀。')
    await expect
      .poll(() => $preview(page).locator('h-char').count())
      .toBeGreaterThan(0)
  })

  test('console interplay: a console control writes --han-* on :root; the preview inherits it', async ({ page }) => {
    const main = page.locator('main')

    // The preview must be a descendant of main (so it inherits config).
    expect(await main.locator('[data-pg-preview]').count()).toBe(1)

    await openGroupOf(page, 'squeeze')
    await page.locator('[data-cfg-key="squeeze"]').uncheck()

    await expect
      .poll(() => page.evaluate(() =>
        document.documentElement.style.getPropertyValue('--han-punctuation-refinement')))
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
