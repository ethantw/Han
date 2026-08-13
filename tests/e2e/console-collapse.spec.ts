import { test, expect, type Page } from '@playwright/test'

/**
 * Task B — the collapsible full-height side console — and Task A — the
 * restructured 字體 group.
 *
 * Collapse: the `.ConsoleToggle` handle is a real checkbox (dark-mode
 * recipe): checked = collapsed, layout is pure CSS via
 * `body:has(.ConsoleToggle input:checked)` — the body grid animates its
 * left column to 0 so header + main slide LEFT to fill (never an
 * overlay). The choice persists to `localStorage['han-console-collapsed']`
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

test.describe('Task B — collapsible side console', () => {
  test('handle closes the aside column; main shifts left + widens; console never overlays main', async ({ page }) => {
    await page.goto('/')

    const $console = page.locator('han-console')
    const toggle = page.locator('.ConsoleToggle')
    const checkbox = toggle.locator('input[type="checkbox"]')
    await expect($console).toBeVisible()
    await expect(toggle).toBeVisible()
    await expect(checkbox).not.toBeChecked()

    const mainBefore = await box(page, 'main')
    expect(mainBefore.x).toBeGreaterThan(100) // console column occupies the left

    // the input is visually hidden — click the label
    await toggle.click()
    await expect(checkbox).toBeChecked()

    // Column animates to 0 → main slides left and widens. Poll past the
    // 250ms transition.
    await expect
      .poll(async () => (await box(page, 'main')).x)
      .toBeLessThan(2)
    const mainAfter = await box(page, 'main')
    expect(mainAfter.width).toBeGreaterThan(mainBefore.width)

    // Not an overlay — but the mechanism changed (d4bb37a): the console is a
    // FIXED panel that stays put at 0..280; collapsing removes the body's
    // padding so header + main slide left OVER it. The invariant that
    // matters is z-order: anywhere in the old console column, hit-testing
    // must reach main's content, never the console.
    const covered = await page.evaluate(() => {
      const hits = [200, 400, 600].map((y) => document.elementFromPoint(140, y))
      return hits.every(($el) => $el !== null && !$el.closest('han-console'))
    })
    expect(covered).toBe(true)
  })

  test('state persists across reload (restored pre-paint, collapsed on first frame)', async ({ page }) => {
    await page.goto('/')
    await page.locator('.ConsoleToggle').click()
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('han-console-collapsed')))
      .toBe('1')

    await page.reload()

    // The pre-paint inline script restores the checkbox synchronously as
    // it's parsed, so the page lays out collapsed with no flash.
    await expect(page.locator('.ConsoleToggle input')).toBeChecked()
    await expect
      .poll(async () => (await box(page, 'main')).x)
      .toBeLessThan(2)

    // reopening clears the stored flag
    await page.locator('.ConsoleToggle').click()
    await expect(page.locator('.ConsoleToggle input')).not.toBeChecked()
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('han-console-collapsed')))
      .toBe('0')
  })
})

test.describe('the floating panel form (<52rem)', () => {
  test('costs the layout nothing, opens from the same handle, closes on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const $panel = page.locator('.ConsolePanel')
    const $toggle = page.locator('.ConsoleToggle')
    // 面板預設關著——一支蓋在正文上的面板不能是初見的第一印象。而不管開沒開，
    // 版面都不該讓位：整個窗寬都是站台的。
    await expect($panel).toBeHidden()
    const full = await box(page, 'main')
    expect(full.x).toBeLessThan(2)

    await $toggle.click()
    await expect($panel).toBeVisible()
    expect((await box(page, 'main')).width).toBe(full.width)

    await page.keyboard.press('Escape')
    await expect($panel).toBeHidden()
  })
})

test.describe('Task A — 各文種專項 group', () => {
  // 各文種專項 is a <details> holding one flat <section> per script. Wait for
  // it to exist (the console mounts asynchronously), then open it only if it
  // is closed — an unconditional click would CLOSE a group that some earlier
  // step already sprung open, and a bare `:not([open])` selector matches
  // nothing in that case and waits until the test times out.
  const openScriptSpecifics = async (page: Page) => {
    const $summary = page
      .locator('details.ControlGroup:has([data-cfg-key="punct.hant"]) > summary')
      .first()
    await $summary.waitFor()
    if (!(await $summary.evaluate(($el) => ($el.parentElement as HTMLDetailsElement).open))) {
      await $summary.click()
    }
  }

  test('per-script sub-sections group each script’s heritage + punct; 注音 is its own section', async ({ page }) => {
    await page.goto('/')
    await openScriptSpecifics(page)

    // 繁體專項 <section> holds hant heritage + punct together.
    const hant = page.locator('section.ControlGroup:has([data-cfg-key="heritage.hant"])')
    await expect(hant.locator('[data-cfg-key="punct.hant"]')).toHaveCount(1)
    // 注音ruby專項 is a SEPARATE section — the zhuyin toggle is no longer
    // inside the 繁體 section.
    await expect(hant.locator('[data-cfg-key="zhuyinWebfont"]')).toHaveCount(0)
    await expect(page.locator('[data-cfg-key="zhuyinWebfont"]')).toBeVisible()
  })

  test('簡日韓 each get a sub-section pairing heritage + punct, brand credit intact', async ({ page }) => {
    await page.goto('/')
    await openScriptSpecifics(page)

    for (const loc of ['hans', 'ja', 'ko']) {
      const sec = page.locator(`section.ControlGroup:has([data-cfg-key="heritage.${loc}"])`)
      await expect(sec.locator(`[data-cfg-key="punct.${loc}"]`)).toHaveCount(1)
    }
    // brand credit survived on each punct row
    await expect(
      page.locator('.Field:has([data-cfg-key="punct.hans"]) small'),
    ).toHaveText('Diantenjeom')
  })

  // Relies on the default webfontDelivery='cdn': under 'none' the punct
  // selects are forced to 'off' + disabled by the cascade, so this must
  // run before any delivery change (default cdn keeps them live).
  test('all four punct selects emit their data-cfg-key as han-config-change source', async ({ page }) => {
    await page.addInitScript(() => {
      ;(window as unknown as { __src: string[] }).__src = []
      document.addEventListener('han-config-change', (e: Event) => {
        ;(window as unknown as { __src: string[] }).__src.push((e as CustomEvent).detail.source)
      })
    })
    await page.goto('/')
    await openScriptSpecifics(page)

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
