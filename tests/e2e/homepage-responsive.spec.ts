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
      theorem: element.closest('.Theorem')!.clientWidth,
    }))
    if (craft.theorem < 960) {
      expect(craft.scroll).toBeGreaterThan(craft.client)
      expect(craft.overflow).toBe('auto')
    } else {
      expect(craft.scroll).toBeLessThanOrEqual(craft.client + 1)
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth))
      .toBe(viewport.width)
  })
}

test('craft responds to its container and keeps the DevTools pane inside its rail', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1200, height: 900 })
  await page.goto('/')
  await page.locator('#station-craft').scrollIntoViewIfNeeded()

  const state = await page.locator('#station-craft .Example').evaluate((element) => {
    const rules = element.querySelector<HTMLElement>('.SelRing')!
    const theorem = element.closest<HTMLElement>('.Theorem')!
    const rail = element.getBoundingClientRect()
    const rulesBox = rules.getBoundingClientRect()
    const cases = Array.from(rules.children, (item) => ({
      top: item.getBoundingClientRect().top,
      visibility: getComputedStyle(item).visibility,
    }))
    return {
      viewport: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      theoremWidth: theorem.clientWidth,
      railClient: element.clientWidth,
      railScroll: element.scrollWidth,
      overflow: getComputedStyle(element).overflowX,
      rulesPeek: Math.min(rail.right, rulesBox.right) - Math.max(rail.left, rulesBox.left),
      cases,
    }
  })

  // The side console narrows main while the viewport itself remains wide.
  // The rail must therefore follow the theorem container, never @media.
  expect(state.theoremWidth).toBeLessThan(960)
  expect(state.overflow).toBe('auto')
  expect(state.railScroll).toBeGreaterThan(state.railClient)
  expect(state.rulesPeek).toBeGreaterThanOrEqual(79)
  expect(state.documentWidth).toBe(state.viewport)

  const visibleCases = state.cases.filter(({ visibility }) => visibility === 'visible')
  expect(visibleCases).toHaveLength(1)
  expect(new Set(state.cases.map(({ top }) => Math.round(top))).size).toBe(1)
})

test('craft axioms become one column from theorem width, not viewport width', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 900, height: 844 })
  await page.goto('/')

  const state = await page.locator('#station-craft .Theorem').evaluate((theorem) => {
    const axioms = theorem.querySelector<HTMLElement>('.Axioms')!
    const cells = Array.from(axioms.querySelectorAll<HTMLElement>('.Ax'))
    return {
      width: theorem.clientWidth,
      columns: getComputedStyle(axioms).gridTemplateColumns,
      lefts: cells.map((cell) => Math.round(cell.getBoundingClientRect().left)),
      separators: cells.slice(1).map((cell) => ({
        block: getComputedStyle(cell).borderBlockStartWidth,
        inline: getComputedStyle(cell).borderInlineStartWidth,
      })),
    }
  })

  expect(state.width).toBeLessThan(768)
  expect(state.columns.split(' ')).toHaveLength(1)
  expect(new Set(state.lefts).size).toBe(1)
  for (const separator of state.separators) {
    expect(separator.block).toBe('1px')
    expect(separator.inline).toBe('0px')
  }
})

test('ledger keeps the transparent equation beside the table on wide screens', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')

  const state = await page.locator('#station-craft .Sum').evaluate((sum) => {
    const table = sum.querySelector<HTMLElement>('[data-plate="items"]')!
    const equation = sum.querySelector<HTMLElement>('figcaption')!
    const sumBox = sum.getBoundingClientRect()
    const tableBox = table.getBoundingClientRect()
    const equationBox = equation.getBoundingClientRect()
    return {
      columns: getComputedStyle(sum).gridTemplateColumns.split(' ').length,
      background: getComputedStyle(sum).backgroundColor,
      equationDisplay: getComputedStyle(equation).display,
      equationBackground: getComputedStyle(equation).backgroundColor,
      tableTop: Math.round(tableBox.top),
      equationTop: Math.round(equationBox.top),
      sumRight: Math.round(sumBox.right),
      equationRight: Math.round(equationBox.right),
    }
  })

  expect(state.columns).toBe(2)
  expect(state.background).toBe('rgba(0, 0, 0, 0)')
  expect(state.equationDisplay).toBe('flex')
  expect(state.equationBackground).toBe('rgba(0, 0, 0, 0)')
  expect(state.tableTop).toBe(state.equationTop)
  expect(Math.abs(state.equationRight - state.sumRight)).toBeLessThanOrEqual(1)
})

test('ledger uses a full-width table without a rail or equation on small screens', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const state = await page.locator('#station-craft .SumRail').evaluate((rail) => {
    const sum = rail.querySelector<HTMLElement>('.Sum')!
    const table = sum.querySelector<HTMLElement>('[data-plate="items"]')!
    const equation = sum.querySelector<HTMLElement>('figcaption')!
    return {
      railClient: rail.clientWidth,
      railScroll: rail.scrollWidth,
      railOverflow: getComputedStyle(rail).overflowX,
      columns: getComputedStyle(sum).gridTemplateColumns.split(' ').length,
      sumWidth: Math.round(sum.getBoundingClientRect().width),
      tableWidth: Math.round(table.getBoundingClientRect().width),
      equationDisplay: getComputedStyle(equation).display,
    }
  })

  expect(state.railScroll).toBeLessThanOrEqual(state.railClient + 1)
  expect(state.railOverflow).not.toMatch(/auto|scroll/)
  expect(state.columns).toBe(1)
  expect(state.tableWidth).toBeGreaterThanOrEqual(state.sumWidth - 2)
  expect(state.equationDisplay).toBe('none')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390)
})
