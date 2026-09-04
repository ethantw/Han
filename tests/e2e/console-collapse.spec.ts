import { test, expect, type Page } from '@playwright/test'

/**
 * Task B — the collapsible full-height side console — and Task A — the
 * restructured 字體 group.
 *
 * Collapse: `#console-collapsed` is the CSS state bit; `.ConsoleToggle` is
 * the native disclosure button. On desktop checked = collapsed, and layout
 * is pure CSS via `body:has(#console-collapsed:checked)`. Main keeps a fixed measure and
 * translates half a console-width between centres. Header stays 100vw: its
 * right nav is fixed while its toggle/logo move one full console-width.
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
  test('inline prose controls open the console, then flash its visible surface', async ({ page }) => {
    await page.goto('/')

    const prompts = page.locator('[data-console-prompt]')
    const toggle = page.locator('.ConsoleToggle')
    const checkbox = page.locator('#console-collapsed')
    const sideConsole = page.locator('body > .ConsolePanel han-console')
    await expect(prompts).toHaveCount(2)

    // The desktop console starts open. An inline request therefore points to
    // the already-visible surface instead of changing the layout again.
    const animationNames = async () => sideConsole.evaluate(($surface) => new Promise<string[]>((resolve) => {
      const names = new Set<string>()
      const onStart = (event: AnimationEvent) => {
        names.add(event.animationName)
        if (names.size === 2) {
          clearTimeout(timeout)
          $surface.removeEventListener('animationstart', onStart)
          resolve([...names])
        }
      }
      const timeout = setTimeout(() => {
        $surface.removeEventListener('animationstart', onStart)
        resolve([...names])
      }, 1000)
      $surface.addEventListener('animationstart', onStart)
    }))

    const firstFlash = await Promise.all([
      animationNames(),
      prompts.first().click(),
    ])
    expect(firstFlash[0]).toEqual(expect.arrayContaining([
      'console-border-flash', 'console-surface-flash',
    ]))

    await toggle.click()
    await expect(checkbox).toBeChecked()
    const openedFlash = await Promise.all([
      animationNames(),
      prompts.nth(1).click(),
    ])
    await expect(checkbox).not.toBeChecked()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(openedFlash[0]).toEqual(expect.arrayContaining([
      'console-border-flash', 'console-surface-flash',
    ]))
  })

  test('handle closes the aside column; main shifts half while only header left chrome shifts a full column', async ({ page }) => {
    await page.goto('/')

    const $console = page.locator('han-console')
    const toggle = page.locator('.ConsoleToggle')
    const checkbox = page.locator('#console-collapsed')
    await expect($console).toBeVisible()
    await expect(toggle).toBeVisible()
    await expect(checkbox).not.toBeChecked()
    await expect(toggle).toHaveRole('button')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(toggle).toHaveAttribute('aria-label', '關閉排版面板')

    const mainBefore = await box(page, 'main')
    const headerBefore = await box(page, 'body > header')
    const logoBefore = await box(page, 'body > header > .Logo')
    const navBefore = await box(page, 'body > header > nav')
    expect(mainBefore.x).toBeGreaterThan(100) // console column occupies the left

    // the input is state-only — click the visible disclosure button
    await toggle.click()
    await expect(checkbox).toBeChecked()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toHaveAttribute('aria-label', '打開排版面板')
    await expect(page.locator('#typesetting-console')).toHaveAttribute('inert', '')

    // Both fixed-measure columns move left by half the 280px console.
    await expect
      .poll(async () => (await box(page, 'main')).x)
      .toBeCloseTo(mainBefore.x - 140, 0)
    const mainAfter = await box(page, 'main')
    const headerAfter = await box(page, 'body > header')
    const logoAfter = await box(page, 'body > header > .Logo')
    const navAfter = await box(page, 'body > header > nav')
    expect(mainAfter.width).toBeCloseTo(mainBefore.width, 5)
    expect(headerAfter.width).toBeCloseTo(headerBefore.width, 5)
    expect(headerAfter.width).toBeCloseTo(1280, 0)
    expect(headerAfter.x).toBeCloseTo(headerBefore.x, 0)
    expect(logoAfter.x).toBeCloseTo(logoBefore.x - 280, 0)
    expect(navAfter.x).toBeCloseTo(navBefore.x, 0)

    // Once collapsed, hit-testing in the old console column must reach page
    // content, never the off-stage console.
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
    await expect(page.locator('#console-collapsed')).toBeChecked()
    const collapsed = await box(page, 'main')
    expect(collapsed.x).toBeGreaterThan(0)

    // reopening clears the stored flag
    await page.locator('.ConsoleToggle').click()
    await expect(page.locator('#console-collapsed')).not.toBeChecked()
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('han-console-collapsed')))
      .toBe('0')
  })
})

test.describe('the floating panel form (<52rem)', () => {
  test('inline prose control opens the floating panel', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const prompt = page.locator('[data-console-prompt]').first()
    const panel = page.locator('body > .ConsolePanel')
    await expect(panel).toBeHidden()
    await prompt.click()
    await expect(panel).toBeVisible()
  })

  test('costs the layout nothing, opens from the same handle, closes on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const $panel = page.locator('.ConsolePanel')
    const $toggle = page.locator('.ConsoleToggle')
    const $box = page.locator('#console-collapsed')
    const $hint = $toggle.locator('.Label')
    // 面板預設關著——一支蓋在正文上的面板不能是初見的第一印象。而不管開沒開，
    // 版面都不該讓位：整個窗寬都是站台的。
    await expect($panel).toBeHidden()
    await expect($hint).toBeVisible()
    await expect($hint).toHaveText('調整排版')
    await expect($toggle).toHaveAttribute('aria-expanded', 'false')
    await expect($toggle).toHaveAttribute('aria-label', '打開排版面板')
    const full = await box(page, 'main')
    expect(full.x).toBeLessThan(2)

    await $toggle.click()
    await expect($panel).toBeVisible()
    await expect($hint).toBeHidden()
    await expect($toggle).toHaveAttribute('aria-expanded', 'true')
    await expect($toggle).toHaveAttribute('aria-label', '關閉排版面板')
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('han-console-discovered')))
      .toBe('1')
    expect((await box(page, 'main')).width).toBe(full.width)

    await page.locator('.ConsolePanel .Close').focus()
    await page.keyboard.press('Escape')
    await expect($panel).toBeHidden()
    await expect($toggle).toHaveAttribute('aria-expanded', 'false')
    await expect($toggle).toBeFocused()

    // Discovery is permanent: returning visitors get the compact icon even
    // though the floating panel itself still defaults to closed.
    await page.reload()
    await expect(page.locator('.ConsoleToggle .Label')).toBeHidden()
    await expect(page.locator('.ConsoleToggle')).toHaveAttribute('aria-expanded', 'false')
  })

  test('close button closes the panel and returns focus to its trigger', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await page.locator('.ConsoleToggle').click()
    await page.locator('.ConsolePanel .Close').click()
    await expect(page.locator('.ConsolePanel')).toBeHidden()
    await expect(page.locator('.ConsoleToggle')).toBeFocused()
  })

  test('keyboard activation opens and closes from the visible trigger', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const $toggle = page.locator('.ConsoleToggle')
    await $toggle.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.ConsolePanel')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.ConsolePanel')).toBeHidden()
    await expect($toggle).toBeFocused()
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
