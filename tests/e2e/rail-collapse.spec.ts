import { test, expect, type Page } from '@playwright/test'

/**
 * Task B — the collapsible full-height side rail — and Task A — the
 * restructured 字體 group.
 *
 * Collapse: the `.RailToggle` handle flips `<han-rail collapsed>`, and the
 * body grid animates its left column to 0 so header + main slide LEFT to
 * fill (never an overlay — content is never covered). The choice persists
 * to `localStorage['han-rail-collapsed']` and is restored pre-paint by an
 * inline script in `_home.html`.
 *
 * 字體 group: zhuyinWebfont + punct.hant moved into the collapsed 繁體專項
 * accordion (both hant-only); punct.hans/ja/ko are now flat rows in the
 * open 字體 group; all four punct selects still emit their data-cfg-key as
 * the `han-config-change` source.
 *
 * Default Desktop Chrome viewport (1280×720) ≥ 64rem → side form, handle
 * visible.
 */

/** 配置群組是 shadow 內的 <details> 手風琴——收合組裡的控件先展開。 */
const openGroupOf = (page: Page, cfgKey: string) =>
  page
    .locator(`details.ControlGroup:not([open]):has([data-cfg-key="${cfgKey}"]) > summary`)
    .click()

const box = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { x: r.x, right: r.right, width: r.width }
  })

test.describe('Task B — collapsible side rail', () => {
  test('handle closes the aside column; main shifts left + widens; rail never overlays main', async ({ page }) => {
    await page.goto('/')

    const rail = page.locator('han-rail')
    const toggle = page.locator('[data-rail-collapse]')
    await expect(rail).toBeVisible()
    await expect(toggle).toBeVisible()

    const mainBefore = await box(page, 'main.han')
    expect(mainBefore.x).toBeGreaterThan(100) // rail column occupies the left

    await toggle.click()
    await expect(rail).toHaveAttribute('collapsed', '')

    // Column animates to 0 → main slides left and widens. Poll past the
    // 250ms transition.
    await expect
      .poll(async () => (await box(page, 'main.han')).x)
      .toBeLessThan(2)
    const mainAfter = await box(page, 'main.han')
    expect(mainAfter.width).toBeGreaterThan(mainBefore.width)

    // Not an overlay: the rail is clipped to ~0 width, so it can't sit on
    // top of main's content.
    const railAfter = await box(page, 'han-rail')
    expect(railAfter.width).toBeLessThan(2)
    expect(railAfter.right).toBeLessThanOrEqual(mainAfter.x + 2)

    // aria-expanded tracks state.
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  test('state persists across reload (restored pre-paint, collapsed on first frame)', async ({ page }) => {
    await page.goto('/')
    await page.locator('[data-rail-collapse]').click()
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('han-rail-collapsed')))
      .toBe('1')

    await page.reload()

    // The pre-paint inline script sets the attribute synchronously as the
    // node is parsed, so the page lays out collapsed with no flash.
    const rail = page.locator('han-rail')
    await expect(rail).toHaveAttribute('collapsed', '')
    await expect(page.locator('[data-rail-collapse]')).toHaveAttribute('aria-expanded', 'false')
    await expect
      .poll(async () => (await box(page, 'main.han')).x)
      .toBeLessThan(2)

    // reopening clears the stored flag
    await page.locator('[data-rail-collapse]').click()
    await expect(rail).not.toHaveAttribute('collapsed', '')
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('han-rail-collapsed')))
      .toBe('0')
  })
})

test.describe('Task A — restructured 字體 group', () => {
  test('zhuyinWebfont + punct.hant live inside the collapsed 繁體專項 accordion', async ({ page }) => {
    await page.goto('/')

    // Collapsed by default → both hant-only controls are hidden until the
    // 繁體專項 group is opened.
    await expect(page.locator('[data-cfg-key="zhuyinWebfont"]')).toBeHidden()
    await expect(page.locator('[data-cfg-key="punct.hant"]')).toBeHidden()

    await openGroupOf(page, 'zhuyinWebfont')
    await expect(page.locator('[data-cfg-key="zhuyinWebfont"]')).toBeVisible()
    await expect(page.locator('[data-cfg-key="punct.hant"]')).toBeVisible()

    // Same accordion holds heritage — proves the grouping.
    const group = page.locator('details.ControlGroup:has([data-cfg-key="zhuyinWebfont"])')
    await expect(group.locator('[data-cfg-key="heritage"]')).toHaveCount(1)
  })

  test('punct.hans/ja/ko are flat rows in the open 字體 group (no accordion to open)', async ({ page }) => {
    await page.goto('/')
    for (const key of ['punct.hans', 'punct.ja', 'punct.ko']) {
      await expect(page.locator(`[data-cfg-key="${key}"]`)).toBeVisible()
    }
    // brand credit survived on each punct row
    await expect(
      page.locator('.Field:has([data-cfg-key="punct.hans"]) small'),
    ).toHaveText('Diantenjeom')
  })

  test('all four punct selects emit their data-cfg-key as han-config-change source', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as unknown as { __src: string[] }).__src = []
      document.addEventListener('han-config-change', (e: Event) => {
        ;(window as unknown as { __src: string[] }).__src.push((e as CustomEvent).detail.source)
      })
    })
    await page.goto('/')

    const lastSource = () =>
      page.evaluate(() => (window as unknown as { __src: string[] }).__src.at(-1))

    await openGroupOf(page, 'punct.hant')
    await page.locator('[data-cfg-key="punct.hant"]').selectOption('GB')
    await expect.poll(lastSource).toBe('punct.hant')

    await page.locator('[data-cfg-key="punct.hans"]').selectOption('off')
    await expect.poll(lastSource).toBe('punct.hans')

    await page.locator('[data-cfg-key="punct.ja"]').selectOption('off')
    await expect.poll(lastSource).toBe('punct.ja')

    await page.locator('[data-cfg-key="punct.ko"]').selectOption('off')
    await expect.poll(lastSource).toBe('punct.ko')
  })
})
