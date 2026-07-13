import { test, expect, type Page } from '@playwright/test'

/**
 * Task B — the collapsible full-height side rail — and Task A — the
 * restructured 字體 group.
 *
 * Collapse: the `.RailToggle` handle is a real checkbox (dark-mode
 * recipe): checked = collapsed, layout is pure CSS via
 * `body:has(.RailToggle input:checked)` — the body grid animates its
 * left column to 0 so header + main slide LEFT to fill (never an
 * overlay). The choice persists to `localStorage['han-rail-collapsed']`
 * and is restored pre-paint by an inline script in `_home.html`.
 *
 * 字體 group: zhuyinWebfont + punct.hant live in the FLAT 繁體專項
 * sub-section (no accordion — owner call); punct.hans/ja/ko are flat
 * rows in the open 字體 group; all four punct selects still emit their
 * data-cfg-key as the `han-config-change` source.
 *
 * Default Desktop Chrome viewport (1280×720) ≥ 64rem → side form, handle
 * visible.
 */

const box = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { x: r.x, right: r.right, width: r.width }
  })

test.describe('Task B — collapsible side rail', () => {
  test('handle closes the aside column; main shifts left + widens; rail never overlays main', async ({ page }) => {
    await page.goto('/')

    const rail = page.locator('han-rail')
    const toggle = page.locator('.RailToggle')
    const checkbox = toggle.locator('input[type="checkbox"]')
    await expect(rail).toBeVisible()
    await expect(toggle).toBeVisible()
    await expect(checkbox).not.toBeChecked()

    const mainBefore = await box(page, 'main.han')
    expect(mainBefore.x).toBeGreaterThan(100) // rail column occupies the left

    // the input is visually hidden — click the label
    await toggle.click()
    await expect(checkbox).toBeChecked()

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
  })

  test('state persists across reload (restored pre-paint, collapsed on first frame)', async ({ page }) => {
    await page.goto('/')
    await page.locator('.RailToggle').click()
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('han-rail-collapsed')))
      .toBe('1')

    await page.reload()

    // The pre-paint inline script restores the checkbox synchronously as
    // it's parsed, so the page lays out collapsed with no flash.
    await expect(page.locator('.RailToggle input')).toBeChecked()
    await expect
      .poll(async () => (await box(page, 'main.han')).x)
      .toBeLessThan(2)

    // reopening clears the stored flag
    await page.locator('.RailToggle').click()
    await expect(page.locator('.RailToggle input')).not.toBeChecked()
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('han-rail-collapsed')))
      .toBe('0')
  })
})

test.describe('Task A — restructured 字體 group', () => {
  test('zhuyinWebfont + punct.hant live in the flat 繁體專項 sub-section (no accordion)', async ({ page }) => {
    await page.goto('/')

    // Flat sub-section (owner call) — both hant-only controls are visible
    // without opening anything.
    await expect(page.locator('[data-cfg-key="zhuyinWebfont"]')).toBeVisible()
    await expect(page.locator('[data-cfg-key="punct.hant"]')).toBeVisible()

    // Same sub-section holds heritage — proves the grouping.
    const group = page.locator('section.ControlGroup:has([data-cfg-key="zhuyinWebfont"])')
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
