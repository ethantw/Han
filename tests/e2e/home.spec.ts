import { test, expect, type Page } from '@playwright/test'

/**
 * Homepage-as-playground e2e (HP-5).
 *
 * `/` is a whole-page playground: topbar + the `<han-console>` configurator
 * web component (shadow DOM; `form="side"|"top"` attr, <52rem
 * bottom-sheet) + `<main
 * class="han">` with six stations (Manifesto, station-semantics,
 * station-fonts, station-lines, station-snippet, Closing). Station④
 * hosts the snippet generator (`[data-pg-views]` / `[data-out-pm]` /
 * `[data-out-panes]`, one `<figure class="CodePane">` per codegen.js
 * pane — no more global `[data-out-copy]`/single `[data-out-code]`);
 * the console carries all 26 `data-cfg-key` controls (four module switches
 * — semantics/prose/lines/fonts — in a non-collapsible block, and the
 * merged Web字體來源 pair webfontDelivery + webfontCdnSource under 字體,
 * Request B — replacing the old zianoDelivery/zianoCdnSource and the
 * per-group 啟用 rows) in an accordion of `details.ControlGroup` (only
 * the 字體 group ships open; 語意／長文／行調整／JavaScript closed; 度量
 * and 模組 are flat non-collapsible sections), three metric sliders (the 直排/橫排 switch is
 * page chrome now — a floating pill, writing-switch.js)
 * (`[data-pg-sliders]`), each control row with its own ↺ default button. A separate
 * `[data-demo-lang]` chip row (top-right of `<main>`) switches which
 * language the specimen copy demonstrates, independent of the page's
 * own UI locale.
 */

const LOCALES = [
  { path: '/', htmlLang: 'zh-Hant', label: 'hant' },
  { path: '/hans/', htmlLang: 'zh-Hans', label: 'hans' },
  { path: '/en/', htmlLang: 'en', label: 'en' },
  { path: '/ja/', htmlLang: 'ja', label: 'ja' },
  { path: '/ko/', htmlLang: 'ko', label: 'ko' },
] as const

/** console 的 CSS 落點是 `:root` ＋ `body`，逐字鏡射生成碼的兩條規則；模式變數
 *  不能再低（`body` 的 font-family 一代換就定型，見 console-config.js
 *  § applyTarget）。度量另外走 `body`，但消費規則在 `main` 上讀繼承值，所以下面
 *  的 font-size 斷言照樣量 main。 */
const refinementOnRoot = (page: Page) =>
  page.evaluate(() =>
    document.documentElement.style.getPropertyValue('--han-punctuation-refinement'))

/** 配置群組是 <details> 手風琴——收合組裡的控件要先展開才可見。 */
const openGroupOf = (page: Page, cfgKey: string) =>
  page
    .locator(`details.ControlGroup:not([open]):has([data-cfg-key="${cfgKey}"]) > summary`)
    .click()

const chooseSnippetView = async (page: Page, value: string) => {
  const station = page.locator('#station-snippet')
  await station.scrollIntoViewIfNeeded()
  await station.locator(`label:has(input[value="${value}"])`).click()
}

for (const { path, htmlLang, label } of LOCALES) {
  test(`${label}: homepage renders — topbar, console, all six stations`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)

    await expect(page.locator('html')).toHaveAttribute('lang', htmlLang)
    await expect(page.locator('body.home')).toHaveAttribute('data-locale', label)

    await expect(page.locator('body > header .Brand')).toBeVisible()
    await expect(page.locator('main')).toHaveCount(1)
    // The console is now the <han-console> web component (shadow DOM).
    await expect(page.locator('han-console')).toBeVisible()

    // Six stations, in document order: Manifesto, semantics, type,
    // lines, snippet, Closing.
    await expect(page.locator('main > .Manifesto')).toBeVisible()
    await expect(page.locator('#station-semantics')).toBeVisible()
    await expect(page.locator('#station-fonts')).toBeVisible()
    await expect(page.locator('#station-lines')).toBeVisible()
    await expect(page.locator('#station-snippet')).toBeVisible()
    await expect(page.locator('main > .Closing')).toBeVisible()
  })
}

test('lang switcher: button opens menu, outside click closes', async ({ page }) => {
  await page.goto('/')

  const switcher = page.locator('.LangSwitcher').first()
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
  const switcher = page.locator('.LangSwitcher').first()
  await switcher.locator('button[aria-haspopup="true"]').click()

  const links = switcher.locator('a[data-lang]')
  await expect(links).toHaveCount(5)

  const slugs = await links.evaluateAll(els =>
    els.map(el => el.getAttribute('data-lang')),
  )
  expect(new Set(slugs)).toEqual(new Set(['hant', 'hans', 'en', 'ja', 'ko']))
  await expect(switcher.locator('a[data-lang="hant"]')).toHaveClass(/is-active/)
})

test.describe('console form attribute', () => {
  // `form` stays public component API (side|top); the page ships side and
  // no longer exposes a picker (the old owner-tooling chooser is gone).
  // Flipping the attribute programmatically must still relayout via
  // `body:has(han-console[form=…])` + `:host([form="top"])` — both pure CSS.
  test('form="top" flips the shadow skeleton without a reload', async ({ page }) => {
    await page.goto('/')
    const $console = page.locator('han-console')
    await expect($console).toHaveAttribute('form', 'side')

    await $console.evaluate((el) => el.setAttribute('form', 'top'))
    await expect($console).toHaveAttribute('form', 'top')
    await expect(page.locator('han-console .Controls')).toBeVisible()
  })
})

test.describe('whole-page configuration', () => {
  test('console toggle drives inline var on :root; station④ snippet reflects it', async ({ page }) => {
    await page.goto('/')

    await openGroupOf(page, 'squeeze')
    await page.locator('[data-cfg-key="squeeze"]').uncheck()
    await expect.poll(() => refinementOnRoot(page)).toBe('hang')

    // Radios in the ViewTabs are sr-only — click the label, not the input.
    await chooseSnippetView(page, 'cdn')
    await expect(page.locator('[data-out-panes] pre[data-lang="css"] code'))
      .toContainText('--han-punctuation-refinement: hang')
  })
})

test.describe('per-group 使用預設値 buttons', () => {
  // The global reset button is gone (owner call) — every ControlGroup
  // head carries its own ↺ default button (每個 details 群組，不是每個
  // 細項), visible only while any control in the group deviates.
  test('deviating shows the group button; clicking restores that group only', async ({ page }) => {
    await page.goto('/')
    const main = page.locator('main')
    const linesDefault = page.locator(
      'details.ControlGroup:has([data-cfg-key="squeeze"]) > summary .RestoreDefaults',
    )

    await openGroupOf(page, 'squeeze')
    await expect(linesDefault).toBeHidden()

    await page.locator('[data-cfg-key="squeeze"]').uncheck()
    await expect.poll(() => refinementOnRoot(page)).toBe('hang')
    await expect(linesDefault).toBeVisible()

    // an unrelated deviation in another group so we can prove the
    // restore is group-scoped
    const sizeSlider = page.locator('[data-pg-sliders] [data-metric="size"] input[type="range"]')
    await sizeSlider.fill('22')
    await sizeSlider.dispatchEvent('input')
    await expect(main).toHaveCSS('font-size', '22px')

    await linesDefault.click()
    await expect.poll(() => refinementOnRoot(page)).toBe('')
    await expect(linesDefault).toBeHidden()
    // the accordion must not have been toggled shut by the click
    await expect(page.locator('[data-cfg-key="squeeze"]')).toBeVisible()
    await expect(main).toHaveCSS('font-size', '22px') // other group untouched
  })

  test('metrics group button restores all three sliders', async ({ page }) => {
    await page.goto('/')
    const main = page.locator('main')
    const metricsDefault = page.locator('.ControlGroup:has([data-pg-sliders]) > header .RestoreDefaults')
    const sizeSlider = page.locator('[data-pg-sliders] [data-metric="size"] input[type="range"]')

    await expect(metricsDefault).toBeHidden()
    await sizeSlider.fill('22')
    await sizeSlider.dispatchEvent('input')
    await expect(metricsDefault).toBeVisible()

    await metricsDefault.click()
    await expect(sizeSlider).toHaveValue('16')
    await expect(main).toHaveCSS('font-size', '16px')
    await expect(metricsDefault).toBeHidden()
  })
})

test.describe('the narrow form is a panel, not a drawer', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('no grip, and the controls are NOT collapsed by the window being narrow', async ({ page }) => {
    await page.goto('/')

    // The bottom sheet is retired (owner call, 2026-08-13): below 52rem the
    // console is a floating panel the page positions — open/close/Escape are
    // asserted in console-collapse.spec.ts. What this guards is the bug that
    // made the drawer worth retiring: its styles were keyed on the WINDOW, so
    // the controls collapsed whenever the window was narrow, however much room
    // the console actually had (the specimen page's 338×704 panel came up as a
    // 172px stub).
    await expect(page.locator('[data-console-grip]')).toBeHidden()

    await page.locator('.ConsoleToggle').click()
    // .Controls lives in the <han-console> shadow — Playwright pierces open
    // shadow roots for CSS locators.
    const scroll = page.locator('han-console .Controls')
    await expect(scroll).toBeVisible()
    await expect
      .poll(() => scroll.evaluate((el) => el.getBoundingClientRect().height))
      .toBeGreaterThan(200)
  })
})

// demo-lang chips（.DemoLangSwitch）已在首頁改版移除（e1c32a0 § Step 10）
// ——樣張語言不再有頁面級切換，對應測試一併退役。

test.describe('metrics — weight slider', () => {
  test('字重 slider fill 700 → main font-weight 700', async ({ page }) => {
    await page.goto('/')
    const main = page.locator('main')
    const weightSlider = page.locator('[data-pg-sliders] [data-metric="weight"] input[type="range"]')
    await weightSlider.fill('700')
    await weightSlider.dispatchEvent('input')
    await expect(main).toHaveCSS('font-weight', '700')
  })

  // 直排 pill（[data-writing-switch]）已退役——首頁不再提供整頁直排預覽
  // （直排示範歸 bare.html 的示例開關），對應測試刪除。
})

test.describe('fallbacks — JS layer', () => {
  test('checking fallbacks installs h-char on main; unchecking removes them', async ({ page }) => {
    // 探針用 h-char 不用 h-iss：Chromium 已原生支援 text-autospace，
    // ISS pass 依設計讓位（CSS.supports gate）、一顆 h-iss 都不會出。
    // 懸掛（hanging-punctuation）Chromium 仍無原生 ⇒ h-char 穩定存在。
    await page.goto('/')
    const main = page.locator('main')

    await openGroupOf(page, 'fallbacks')
    const fallbacks = page.locator('[data-cfg-key="fallbacks"]')

    await fallbacks.check()
    await expect
      .poll(() => main.locator('h-char').count())
      .toBeGreaterThan(0)

    await fallbacks.uncheck()
    await expect
      .poll(() => main.locator('h-char').count())
      .toBe(0)
  })
})
