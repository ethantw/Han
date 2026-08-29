import { test, expect, type Locator, type Page } from '@playwright/test'

const viewports = [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 1440, height: 900 },
]

const rect = (locator: Locator) => locator.evaluate((element) => {
  const box = element.getBoundingClientRect()
  return { left: box.left, right: box.right, top: box.top, bottom: box.bottom }
})

const expectInsideViewport = async (page: Page, locator: Locator) => {
  const [box, width] = await Promise.all([
    rect(locator),
    page.evaluate(() => innerWidth),
  ])
  expect(box.left).toBeGreaterThanOrEqual(-1)
  expect(box.right).toBeLessThanOrEqual(width + 1)
}

for (const viewport of viewports) {
  test(`homepage chrome and primary actions fit at ${viewport.width}px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.setViewportSize(viewport)
    await page.goto('/')

    await expect.poll(() => page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }))).toEqual({ viewport: viewport.width, document: viewport.width })

    // The masthead may shed secondary labels, but its remaining controls must
    // never wrap through or clip one another at the four release widths.
    const chrome = page.locator('body > header :is(.ConsoleToggle, .Logo, nav > a, nav > button):visible')
    const boxes = await chrome.evaluateAll((elements) => elements.map((element) => {
      const box = element.getBoundingClientRect()
      return {
        name: `${element.tagName.toLowerCase()}.${element.className}`,
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
      }
    }))
    for (const box of boxes) {
      expect(box.left).toBeGreaterThanOrEqual(-1)
      expect(box.right).toBeLessThanOrEqual(viewport.width + 1)
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const overlapInline = Math.min(boxes[i].right, boxes[j].right)
          - Math.max(boxes[i].left, boxes[j].left)
        const overlapBlock = Math.min(boxes[i].bottom, boxes[j].bottom)
          - Math.max(boxes[i].top, boxes[j].top)
        expect(
          Math.min(overlapInline, overlapBlock),
          `${boxes[i].name} ${JSON.stringify(boxes[i])} overlaps ${boxes[j].name} ${JSON.stringify(boxes[j])}`,
        ).toBeLessThanOrEqual(1)
      }
    }

    for (const selector of [
      '.StationMapCurrent',
      '.Manifesto h1',
      '.Manifesto .ProductDefinition',
      '.Manifesto .HeroActions',
    ]) {
      await expectInsideViewport(page, page.locator(selector))
    }

    // The route map is one disclosure at every width; its sheet may be tall,
    // but it must never fall off the inline edge of a narrow phone.
    await page.locator('.StationMapCurrent').click()
    await expect(page.locator('.StationMapList')).toBeVisible()
    await expectInsideViewport(page, page.locator('.StationMapList'))
    await page.keyboard.press('Escape')

    // The full viewport dialog owns scrolling.  Its light panel stays a
    // normal document fragment rather than becoming a cramped inner scroller.
    await page.locator('[data-quickstart-open]').click()
    const dialog = page.locator('[data-quickstart-dialog]')
    const panel = dialog.locator('.QuickstartPanel')
    await expect(dialog).toBeVisible()
    await expectInsideViewport(page, panel)
    const scrolling = await page.evaluate(() => {
      const dialog = document.querySelector<HTMLElement>('[data-quickstart-dialog]')!
      const panel = dialog.querySelector<HTMLElement>('.QuickstartPanel')!
      return {
        dialog: getComputedStyle(dialog).overflowY,
        panel: getComputedStyle(panel).overflowY,
      }
    })
    expect(scrolling.dialog).toBe('auto')
    expect(scrolling.panel).not.toMatch(/auto|scroll/)
    await page.keyboard.press('Escape')

    // Narrow layouts keep the DevTools comparison intact as a horizontal
    // rail; wide layout shows both columns without inventing page overflow.
    await page.locator('#station-craft').scrollIntoViewIfNeeded()
    const craft = await page.locator('#station-craft .Example').evaluate((element) => ({
      client: element.clientWidth,
      scroll: element.scrollWidth,
      overflow: getComputedStyle(element).overflowX,
    }))
    if (viewport.width < 960) {
      expect(craft.scroll).toBeGreaterThan(craft.client)
      expect(craft.overflow).toBe('auto')
    } else {
      expect(craft.scroll).toBeLessThanOrEqual(craft.client + 1)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBe(viewport.width)
  })
}
