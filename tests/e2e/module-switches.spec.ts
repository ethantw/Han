import { test, expect, type Page } from '@playwright/test'

/**
 * Module switches (模組開關) — four toggles in a non-collapsible block
 * under 度量 that decide whether each han.css layer's CSS is imported at
 * all: semantics / lines / prose / fonts. Flipping one rewrites the
 * generated snippet (single `han.min.css` entry ⇄ per-module
 * `han.<mod>.min.css` lines) and, on the live page, toggles the matching
 * `<link data-han-module="<mod>">`.disabled in the document.
 *
 * The switch is a whether-imported control, distinct from the細項 inside
 * each module's own `details.ControlGroup`: turning a module off greys
 * (data-module-off) and closes its details but keeps every sub-control's
 * value; turning it back on auto-opens the details and the values return.
 * "off" is expressed by the import's absence — the old
 * `--han-semantics: off` / `--han-prose: off` vars are gone.
 *
 * Playwright pierces the open shadow root for CSS locators, so the console's
 * shadow controls are reachable by their `data-cfg-key` directly.
 */

/** 配置群組是 shadow 內的 <details> 手風琴——收合組裡的控件先展開。 */
const openGroupOf = (page: Page, cfgKey: string) =>
  page
    .locator(`details.ControlGroup:not([open]):has([data-cfg-key="${cfgKey}"]) > summary`)
    .click()

const pane = (page: Page, lang: string) =>
  page.locator(`[data-out-panes] pre[data-lang="${lang}"] code`)

const moduleLinkDisabled = (page: Page, mod: string) =>
  page.evaluate(
    (m) =>
      (document.querySelector(`link[data-han-module="${m}"]`) as HTMLLinkElement | null)?.disabled,
    mod,
  )

test.describe('module switches', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('all four module toggles are visible without opening any accordion (non-collapsible block)', async ({ page }) => {
    for (const key of ['semantics', 'prose', 'lines', 'fonts']) {
      await expect(page.locator(`[data-cfg-key="${key}"]`)).toBeVisible()
    }
  })

  test('unchecking fonts closes + greys its details and disables the module link; rechecking restores + auto-opens', async ({ page }) => {
    const details = page.locator('details[data-module="fonts"]')
    // 字體 ships open (only group that does).
    await expect.poll(() => details.evaluate((el: HTMLDetailsElement) => el.open)).toBe(true)

    const fonts = page.locator('[data-cfg-key="fonts"]')
    await fonts.uncheck()

    // flip OFF closes the details and applyVisibility greys it.
    await expect.poll(() => details.evaluate((el: HTMLDetailsElement) => el.open)).toBe(false)
    await expect(details).toHaveAttribute('data-module-off', '')
    // page-side preview: the per-module <link> is disabled in the document.
    await expect.poll(() => moduleLinkDisabled(page, 'fonts')).toBe(true)

    await fonts.check()
    // flip ON auto-opens the details, un-greys it, re-enables the link.
    await expect.poll(() => details.evaluate((el: HTMLDetailsElement) => el.open)).toBe(true)
    await expect.poll(() => details.evaluate((el: Element) => el.hasAttribute('data-module-off'))).toBe(false)
    await expect.poll(() => moduleLinkDisabled(page, 'fonts')).toBe(false)
  })

  test('unchecking semantics switches the snippet to per-module imports (cdn html pane)', async ({ page }) => {
    // module toggles sit in the non-collapsible block — nothing to open.
    await page.locator('[data-cfg-key="semantics"]').uncheck()
    await page.locator('[data-pg-views] label:has(input[value="cdn"])').click()

    const html = pane(page, 'html')
    // enabled three, in bundle order (semantics dropped).
    await expect(html).toContainText('han.lines.min.css')
    await expect(html).toContainText('han.prose.min.css')
    await expect(html).toContainText('han.fonts.min.css')
    await expect(html).not.toContainText('han.semantics')
    await expect(html).not.toContainText('han.min.css')

    // all-on → the single han.min.css entry returns.
    await page.locator('[data-cfg-key="semantics"]').check()
    await expect(pane(page, 'html')).toContainText('han.min.css')
    await expect(pane(page, 'html')).not.toContainText('han.lines.min.css')
  })

  test('css pane never emits the deleted --han-semantics var after toggling semantics off', async ({ page }) => {
    await page.locator('[data-cfg-key="semantics"]').uncheck()
    await page.locator('[data-pg-views] label:has(input[value="cdn"])').click()
    // off is the import's absence now, not a `--han-semantics: off` flag.
    await expect(page.locator('[data-out-panes]')).not.toContainText('--han-semantics')
  })

  test('module off greys but keeps its control values; re-enabling restores the vars (lines / squeeze)', async ({ page }) => {
    const main = page.locator('main.han')
    const lines = page.locator('[data-cfg-key="lines"]')
    const squeeze = page.locator('[data-cfg-key="squeeze"]')
    const refinement = () =>
      main.evaluate((el) => el.style.getPropertyValue('--han-punctuation-refinement'))

    // deviate inside the lines module: squeeze off → refinement:hang.
    await openGroupOf(page, 'squeeze')
    await squeeze.uncheck()
    await expect.poll(refinement).toBe('hang')

    // lines module off: the layer isn't imported → its var drops from
    // main.han, and the details greys — but the squeeze value is retained.
    await lines.uncheck()
    await expect(page.locator('details[data-module="lines"]')).toHaveAttribute('data-module-off', '')
    await expect.poll(refinement).toBe('')
    await expect.poll(() => squeeze.evaluate((el: HTMLInputElement) => el.checked)).toBe(false)

    // re-enabling restores the var from the retained value.
    await lines.check()
    await expect.poll(() => squeeze.evaluate((el: HTMLInputElement) => el.checked)).toBe(false)
    await expect.poll(refinement).toBe('hang')
  })
})
