import { test, expect } from '@playwright/test'

test.describe('homepage keyboard and scroll contracts', () => {
  test('the mobile lead-type rail is keyboard focusable and scrolls along its RTL run', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const rail = page.locator('.FormeRail')
    await rail.scrollIntoViewIfNeeded()
    await rail.focus()
    await expect(rail).toBeFocused()
    await expect(rail).toHaveAttribute('aria-label', '鉛字盤樣張，可水平捲動')

    const before = await rail.evaluate(el => el.scrollLeft)
    // The rail is right-to-left so its reading start sits at scrollLeft 0;
    // ArrowLeft moves into the overflow (negative scrollLeft in Chromium).
    await page.keyboard.press('ArrowLeft')
    await expect.poll(() => rail.evaluate(el => el.scrollLeft)).not.toBe(before)
  })

  test('the selector carousel announces its page and removes hidden examples from interaction', async ({ page }) => {
    await page.goto('/')

    const next = page.locator('.SelNav [data-sel-step="1"]')
    await next.scrollIntoViewIfNeeded()
    await expect(page.locator('.SelNav [data-sel-count]')).toHaveText('1／5')
    await next.focus()
    await page.keyboard.press('Enter')

    await expect(page.locator('.SelNav [data-sel-count]')).toHaveText('2／5')
    await expect(page.locator('.DemoRing > [data-case="cite"]')).toHaveAttribute('data-current', '')
    await expect(page.locator('.SelRing > [data-case="cite"]')).not.toHaveAttribute('aria-hidden', 'true')
    await expect(page.locator('.SelRing > [data-case="heading"]')).toHaveAttribute('aria-hidden', 'true')
    await expect(page.locator('.SelRing > [data-case="heading"]')).toHaveAttribute('inert', '')
  })

  test('vertical wheel input over the playground rail remains page scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 700 })
    await page.goto('/')

    const rail = page.locator('[data-pg-panes]')
    await rail.scrollIntoViewIfNeeded()
    await page.waitForTimeout(700)
    const box = await rail.boundingBox()
    expect(box).not.toBeNull()
    await page.mouse.move(box!.x + box!.width - 100, box!.y + 100)
    const before = await page.evaluate(() => scrollY)
    await page.mouse.wheel(0, 360)
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before)
  })

  test('the prose newspapers align their shared seam before entering', async ({ page }) => {
    await page.goto('/')
    const strip = page.locator('#station-prose .Prose[data-strip-start="seam"]')
    const lens = page.locator('#station-prose [data-mag-lens]')
    await strip.scrollIntoViewIfNeeded()
    await expect(strip).toHaveAttribute('data-strip-ready', '')

    const offset = await strip.evaluate(($strip) => {
      const halves = [...$strip.children]
        .map(($el) => $el.getBoundingClientRect())
        .sort((a, b) => a.left - b.left)
      const run = $strip.getBoundingClientRect()
      const seam = (halves[0].right + halves[1].left) / 2
      return seam - (run.left + run.width / 2)
    })
    expect(Math.abs(offset)).toBeLessThanOrEqual(1)
    await expect(lens).toHaveAttribute('data-lens-arrived', '')
    await expect(lens).toBeVisible()
  })

  test('both prose strip controls keep the shared circular navigation style', async ({ page }) => {
    await page.goto('/')
    const controls = await page.locator('#station-prose .Nav').evaluateAll((navs) =>
      navs.map((nav) => {
        const previous = nav.querySelector<HTMLElement>('[data-scroll="prev"]')!
        const nextIcon = nav.querySelector<HTMLElement>('[data-scroll="next"] [data-icon]')!
        const style = getComputedStyle(previous)
        return {
          width: style.inlineSize,
          height: style.blockSize,
          borderRadius: style.borderRadius,
          borderWidth: style.borderWidth,
          nextRotation: getComputedStyle(nextIcon).rotate,
        }
      }),
    )

    expect(controls).toHaveLength(2)
    expect(controls.every((control) =>
      control.width === '44px'
      && control.height === '44px'
      && control.borderRadius === '50%'
      && control.borderWidth === '0px'
      && control.nextRotation === '180deg')).toBe(true)
  })

  test('the quickstart dialog opens and closes from the keyboard, restoring focus', async ({ page }) => {
    await page.goto('/')

    const opener = page.locator('[data-quickstart-open]')
    const setupSkill = 'https://github.com/hanzipro/han.css/blob/main/skills/han-setup/SKILL.md'
    await expect(opener).toHaveAttribute('href', setupSkill)
    await opener.focus()
    await page.keyboard.press('Enter')
    const dialog = page.locator('[data-quickstart-dialog]')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('footer a')).toHaveAttribute('href', setupSkill)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(opener).toBeFocused()
  })

  test('opening the mobile console removes the station map from hit testing', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    await page.locator('.ConsoleToggle').click()
    await expect(page.locator('.ConsolePanel')).toBeVisible()
    await expect.poll(() => page.locator('.StationMap').evaluate(el => {
      const style = getComputedStyle(el)
      return { opacity: style.opacity, pointerEvents: style.pointerEvents }
    })).toEqual({ opacity: '0', pointerEvents: 'none' })
  })
})
