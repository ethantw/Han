import { test, expect, type Page } from '@playwright/test'

/**
 * <han-console> web component — the two contracts the homepage specs don't
 * cover: (a) it stands alone on a bare page (no home.css) with token
 * fallbacks painting and control writes reaching the target, and (b) the
 * public `han-config-change` event's shape / initial dispatch / source
 * key. Structural selectors pierce the open shadow root (Playwright does
 * this for CSS locators by default).
 *
 * `detail.config` keys must equal codegen.js's DEFAULTS — the唯一
 * cross-boundary interface (<han-snippet>, npm, browser extension all
 * consume this one event). Kept in sync by hand here on purpose: a drift
 * fails this test loudly.
 *
 * These are the 23 config-object keys (what the event carries), not the
 * 26 `data-cfg-key` DOM controls — `punct` is one config key spread over
 * four selects (hant/hans/ja/ko), `autospace` is one key behind the
 * autospaceOn + autospaceMode pair, and `metrics` (size/leading/weight)
 * rides in from the 度量 sliders with no `data-cfg-key` control at all.
 * `semantics`/`prose` are now the
 * module switches themselves (the old per-group 啟用 rows are gone —
 * still one control each). `lines`/`fonts` joined as module switches, and
 * the merged Web字體來源 replaced the ziano-only pair
 * (webfontDelivery/webfontCdnSource ⇐ zianoDelivery/zianoCdnSource).
 */
const DEFAULT_KEYS = [
  'semantics', 'citeTitleMarks', 'emSymbol', 'emPosition',
  'prose', 'proseScope', 'lines', 'hang', 'squeeze', 'autospace',
  'fonts', 'heritage', 'heritageFamily', 'cursive', 'cursiveHant', 'punct',
  'zhuyinWebfont', 'baseGeneric', 'fallbacks',
  // `--han-install` 的逐 pass 取捨，掛在 fallbacks 底下
  'fbPunctuation', 'fbIss', 'fbAdjacentLines', 'fbProbes',
  'legacyRuby',
  'webfontDelivery', 'webfontCdnSource', 'metrics',
]

/** 配置群組是 shadow 內的 <details> 手風琴——收合組裡的控件先展開。 */
const openGroupOf = (page: Page, cfgKey: string) =>
  page
    .locator(`details.ControlGroup:not([open]):has([data-cfg-key="${cfgKey}"]) > summary`)
    .click()

test.describe('bare fixture — no home.css', () => {
  test('renders, token fallbacks paint, a control write reaches the target', async ({ page }) => {
    await page.goto('/tests/e2e/fixtures/console-fixture.html')

    const $console = page.locator('han-console')
    await expect($console).toBeVisible() // upgraded → :not(:defined) guard released

    // Token fallback: with no `--palette-*` on the page, `:host`'s
    // `--_panel` resolves to its literal light-dark() fallback
    // (color-paper-deep #fafaf7 in light) — the console actually paints.
    const bg = await $console.evaluate(el => getComputedStyle(el).backgroundColor)
    expect(bg).toBe('rgb(250, 250, 247)')

    // A control change still writes `--han-*` onto `:root` — the same
    // landing spot the generated snippet's `:root { … }` rule uses
    // (console-config.js § applyTarget explains why it can't be lower).
    await openGroupOf(page, 'squeeze')
    await page.locator('[data-cfg-key="squeeze"]').uncheck()
    await expect
      .poll(() => page.evaluate(() =>
        document.documentElement.style.getPropertyValue('--han-punctuation-refinement')))
      .toBe('hang')
  })
})

test.describe('han-config-change event contract', () => {
  // Capture events from before any page script runs, so we see the
  // component's connect-time `init` dispatch.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as unknown as { __events: unknown[] }).__events = []
      document.addEventListener('han-config-change', (e: Event) => {
        const { detail } = e as CustomEvent
        ;(window as unknown as { __events: unknown[] }).__events.push({
          source: detail.source,
          keys: Object.keys(detail.config),
          frozen: Object.isFrozen(detail.config),
          varsIsPairs: Array.isArray(detail.vars)
            && detail.vars.every((v: unknown) => Array.isArray(v) && v.length === 2),
        })
      })
    })
  })

  const events = (page: Page) =>
    page.evaluate(() => (window as unknown as { __events: unknown[] }).__events)

  test('fires once on connect (source:init) with a frozen DEFAULTS-shaped detail', async ({ page }) => {
    await page.goto('/')
    await expect.poll(async () => (await events(page)).length).toBeGreaterThan(0)

    const [first] = await events(page) as Array<{
      source: string; keys: string[]; frozen: boolean; varsIsPairs: boolean
    }>
    expect(first.source).toBe('init')
    expect(first.frozen).toBe(true)
    expect(first.varsIsPairs).toBe(true)
    expect(new Set(first.keys)).toEqual(new Set(DEFAULT_KEYS))
  })

  test('source carries the triggering data-cfg-key; reset broadcasts source:reset', async ({ page }) => {
    await page.goto('/')
    await expect.poll(async () => (await events(page)).length).toBeGreaterThan(0)

    // punct.hant 在「各文種專項 › 繁體專項」，該 <details> 預設收合——先展開。
    await openGroupOf(page, 'punct.hant')
    await page.locator('[data-cfg-key="punct.hant"]').selectOption('GB')
    await expect
      .poll(async () => ((await events(page)).at(-1) as { source: string }).source)
      .toBe('punct.hant')

    // the global reset BUTTON is gone (per-control ↺ defaults replaced
    // it), but reset() stays public component API — the source:'reset'
    // broadcast is part of the event contract.
    await page.locator('han-console').evaluate((el: HTMLElement & { reset(): void }) => el.reset())
    await expect
      .poll(async () => ((await events(page)).at(-1) as { source: string }).source)
      .toBe('reset')
  })
})
