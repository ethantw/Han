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
    const lines = page.locator('[data-cfg-key="lines"]')
    const squeeze = page.locator('[data-cfg-key="squeeze"]')
    const refinement = () =>
      page.evaluate(() =>
        document.documentElement.style.getPropertyValue('--han-punctuation-refinement'))

    // deviate inside the lines module: squeeze off → refinement:hang.
    await openGroupOf(page, 'squeeze')
    await squeeze.uncheck()
    await expect.poll(refinement).toBe('hang')

    // lines module off: the layer isn't imported → the config var drops and
    // the module's own off flag (`none`, MODULE_MECHANISM) takes the slot on
    // :root; the details greys — but the squeeze value is retained.
    await lines.uncheck()
    await expect(page.locator('details[data-module="lines"]')).toHaveAttribute('data-module-off', '')
    await expect.poll(refinement).toBe('none')
    await expect.poll(() => squeeze.evaluate((el: HTMLInputElement) => el.checked)).toBe(false)

    // re-enabling restores the var from the retained value.
    await lines.check()
    await expect.poll(() => squeeze.evaluate((el: HTMLInputElement) => el.checked)).toBe(false)
    await expect.poll(refinement).toBe('hang')
  })
})

/**
 * How «off» is expressed per module.
 *
 * Three of the four ride han.css's own flags rather than unloading their
 * stylesheet, because `link.disabled` costs ~400ms of blocked main thread
 * regardless of module size — it is the price of re-collecting the document's
 * stylesheets, not of the module's rules (measured:
 * docs/plans/module-switch-css-vars.md §5). What must not regress is the
 * MAPPING: which module uses which mechanism, and that a flagged module's
 * `<link>` is left alone. Deliberately coarse on the visual result — one
 * observable per module is enough; the plan's §6 table is where the
 * per-property fidelity lives.
 */
const rootStyle = (page: Page, prop: string) =>
  page.evaluate((p) => document.documentElement.style.getPropertyValue(p), prop)

test.describe('module switches · off is a flag, not an unloaded sheet', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('lines off writes both knobs on :root and leaves its <link> loaded', async ({ page }) => {
    // Two knobs, not one: `--han-text-autospace` covers 混排間隙,
    // `--han-punctuation-refinement` covers 擠壓 + 懸掛. han.js reads the same
    // two off the cascade, so flipping them stands CSS and JS down together.
    await page.locator('[data-cfg-key="lines"]').uncheck()
    await expect.poll(() => rootStyle(page, '--han-text-autospace')).toBe('no-autospace')
    await expect.poll(() => rootStyle(page, '--han-punctuation-refinement')).toBe('none')
    expect(await moduleLinkDisabled(page, 'lines')).toBe(false)

    await page.locator('[data-cfg-key="lines"]').check()
    await expect.poll(() => rootStyle(page, '--han-text-autospace')).toBe('')
    await expect.poll(() => rootStyle(page, '--han-punctuation-refinement')).toBe('')
  })

  test('lines off hands 擠壓 back to the browser rather than switching it off too', async ({
    page,
  }) => {
    // `refinement: none` lands on `text-spacing-trim: space-all`, which is
    // MORE than a missing import does — Chromium's UA default is `normal` and
    // squeezes on its own. common/module-state.css reverts it. Asserted on
    // the computed value rather than a measured width: the width depends on
    // the loaded webfont, the flag does not.
    const trim = () => page.$eval('article p', (el) => getComputedStyle(el).textSpacingTrim)

    expect(await trim()).toBe('trim-start')
    await page.locator('[data-cfg-key="lines"]').uncheck()
    await expect.poll(trim).toBe('normal')
    await page.locator('[data-cfg-key="lines"]').check()
    await expect.poll(trim).toBe('trim-start')
  })

  test('prose off reaches <article>, which :root alone cannot', async ({ page }) => {
    // prose.css seeds `--han-prose: on` on `:where(article)`, so a flag on
    // `:root` is shadowed inside every article. The reach comes from
    // common/module-state.css keying on the mirrored root attribute — this
    // asserts the pair works end to end, since the flag alone would silently
    // do nothing.
    // Observable: the heading-rhythm rule, which welds a heading to the text
    // it introduces (`--han-prose-consecutive-headings-b-block-start: 0`).
    // Measured rather than read off `--han-prose`, because the flag alone
    // proves nothing about whether any rule saw it.
    const gap = () =>
      page.$eval('article h2 + p', (el) => getComputedStyle(el).marginBlockStart)

    expect(await gap()).toBe('0px')
    await page.locator('[data-cfg-key="prose"]').uncheck()
    await expect.poll(gap).not.toBe('0px')
    expect(await moduleLinkDisabled(page, 'prose')).toBe(false)

    await page.locator('[data-cfg-key="prose"]').check()
    await expect.poll(gap).toBe('0px')
  })

  test('only fonts unloads its stylesheet', async ({ page }) => {
    for (const mod of ['semantics', 'lines', 'prose', 'fonts']) {
      await page.locator(`[data-cfg-key="${mod}"]`).uncheck()
    }
    await expect.poll(() => moduleLinkDisabled(page, 'fonts')).toBe(true)
    for (const mod of ['semantics', 'lines', 'prose']) {
      expect(await moduleLinkDisabled(page, mod), `${mod} must stay loaded`).toBe(false)
    }
  })

  test('a module switched off, reloaded, and switched back on actually comes back', async ({
    page,
  }) => {
    // The pre-paint restore in `_home.html` re-applies the saved config before
    // the console upgrades, and it has its own copy of the mechanism table
    // (inline script, can't import). When the two disagreed, the symptom was
    // exactly this: reload with semantics off → the sheet gets `disabled` by
    // the pre-paint script → applyModules only ever clears the FLAG → the
    // module can never be switched back on until the next reload.
    await page.locator('[data-cfg-key="semantics"]').uncheck()
    await expect.poll(() => rootStyle(page, '--han-semantics')).toBe('off')

    await page.reload()
    await expect.poll(() => rootStyle(page, '--han-semantics')).toBe('off')
    expect(await moduleLinkDisabled(page, 'semantics')).toBe(false)

    await page.locator('[data-cfg-key="semantics"]').check()
    await expect.poll(() => rootStyle(page, '--han-semantics')).toBe('')
    expect(await moduleLinkDisabled(page, 'semantics')).toBe(false)
  })
})
