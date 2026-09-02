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
      '.Current',
      '.Manifesto h1',
      '.Manifesto .ProductDefinition',
      '.Manifesto .HeroActions',
    ]) {
      await expectInsideViewport(page, page.locator(selector))
    }

    // The route map is one disclosure at every width; its sheet may be tall,
    // but it must never fall off the inline edge of a narrow phone.
    await page.locator('.Current').click()
    await expect(page.locator('.List')).toBeVisible()
    await expectInsideViewport(page, page.locator('.List'))
    await page.keyboard.press('Escape')

    // The full viewport dialog owns scrolling.  Its light panel stays a
    // normal document fragment rather than becoming a cramped inner scroller.
    await page.locator('[data-quickstart-open]').click()
    const dialog = page.locator('[data-quickstart-dialog]')
    const panel = dialog.locator('.Panel')
    await expect(dialog).toBeVisible()
    await expectInsideViewport(page, panel)
    const scrolling = await page.evaluate(() => {
      const dialog = document.querySelector<HTMLElement>('[data-quickstart-dialog]')!
      const panel = dialog.querySelector<HTMLElement>('.Panel')!
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

test('station IV keeps the full four-column newspapers at every width', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const station = page.locator('#station-prose')
  await station.scrollIntoViewIfNeeded()
  const newspapers = station.locator(':scope > .Prose > article.Dispatch')

  await expect(newspapers).toHaveCount(2)
  await expect(newspapers.locator(':scope > [data-prose]')).toHaveCount(2)
  await expect(newspapers.locator('[data-prose="brief"], [data-prose="full"]')).toHaveCount(0)
  await expect(newspapers.locator('p', { hasText: '【本報地月特派員　柳康豪　日內瓦─月城連線報導】' })).toHaveCount(2)
  await expect(newspapers.locator('h1', { hasText: '太空電梯挖鼻屎引爆地月危機　二十場《世紀帝國》定勝負' })).toHaveCount(0)

  const newspaperStyle = () => newspapers.first().evaluate((article) => {
    const articleStyle = getComputedStyle(article)
    const headStyle = getComputedStyle(article.querySelector('.PaperHead')!)
    const rail = article.parentElement!
    return {
      fontSize: articleStyle.fontSize,
      inlineSize: articleStyle.inlineSize,
      columns: articleStyle.columnCount,
      headSize: headStyle.fontSize,
      railScrolls: rail.scrollWidth > rail.clientWidth + 1,
    }
  })

  const narrow = await newspaperStyle()
  expect(narrow).toMatchObject({
    fontSize: '8px',
    inlineSize: '768px',
    columns: '4',
    headSize: '20px',
    railScrolls: true,
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  const wide = await newspaperStyle()
  expect(wide).toMatchObject({
    fontSize: narrow.fontSize,
    inlineSize: narrow.inlineSize,
    columns: narrow.columns,
    headSize: narrow.headSize,
  })
})

test('the narrow dash sequence keeps all three hand-offs visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.locator('#station-fonts').scrollIntoViewIfNeeded()
  await expect(page.locator('.TwoEmDashes')).toHaveAttribute('data-dash-measured', '')
  await expect.poll(() => page.locator('.TwoEmDashes').evaluate((copy) => {
    const punctuation = copy.querySelector<HTMLElement>('.PunctLang')!
    const note = copy.querySelector<HTMLElement>('.Note')!
      .getBoundingClientRect()
    const stage = copy.querySelector<HTMLElement>('.NoteStage')!
      .getBoundingClientRect()
    const copyBox = copy.getBoundingClientRect()
    return Math.round(
      punctuation.offsetTop
      - (stage.bottom - copyBox.top)
      + note.height / 2,
    )
  })).toBe(120)

  const geometry = await page.locator('.TwoEmDashes').evaluate((copy) => {
    const main = document.querySelector<HTMLElement>('main')!.getBoundingClientRect()
    const columnElement = copy.querySelector<HTMLElement>('.Column')!
    const column = columnElement.getBoundingClientRect()
    const cells = copy.querySelectorAll<HTMLElement>('.Cell')
    const firstDash = cells[0].getBoundingClientRect()
    const lastDash = cells[cells.length - 1].getBoundingClientRect()
    const closingText = cells[cells.length - 1].previousSibling!
    const closingRange = document.createRange()
    closingRange.selectNodeContents(closingText)
    const closingTextBox = closingRange.getBoundingClientRect()
    const note = copy.querySelector<HTMLElement>('.Note')!.getBoundingClientRect()
    const noteStage = copy.querySelector<HTMLElement>('.NoteStage')!
      .getBoundingClientRect()
    const punctuation = copy.querySelector<HTMLElement>('.PunctLang')!
    const copyBox = copy.getBoundingClientRect()
    const cover = copy.querySelector<HTMLElement>('.Specimens')!
    return {
      columnAtMain: column.left - main.left,
      colourClearance: note.left - firstDash.right,
      dashSize: Number.parseFloat(getComputedStyle(columnElement).fontSize),
      closingJoin: lastDash.top - closingTextBox.bottom,
      closingGap: copyBox.bottom - lastDash.bottom,
      releaseGap:
        punctuation.offsetTop
        - (noteStage.bottom - copyBox.top)
        + note.height / 2,
      coverDisplay: getComputedStyle(cover).display,
      coverWidth: cover.getBoundingClientRect().width,
      documentWidth: document.documentElement.scrollWidth,
    }
  })

  expect(Math.abs(geometry.columnAtMain)).toBeLessThanOrEqual(1)
  expect(geometry.colourClearance).toBeGreaterThanOrEqual(1)
  expect(geometry.colourClearance).toBeLessThanOrEqual(2)
  expect(geometry.dashSize).toBe(128)
  expect(Math.abs(geometry.closingJoin)).toBeLessThanOrEqual(1)
  expect(Math.abs(geometry.closingGap)).toBeLessThanOrEqual(1)
  expect(Math.abs(geometry.releaseGap - 120)).toBeLessThanOrEqual(1)
  expect(geometry.coverDisplay).not.toBe('none')
  expect(geometry.coverWidth).toBeGreaterThan(0)
  expect(geometry.documentWidth).toBe(390)

  // Once sticky, the copy stays below the floating station directory. Its
  // left edge may cover pale dash glyphs, but neither floating UI may cover
  // the copy itself.
  const stickyProbe = await page.locator('.TwoEmDashes .NoteStage').evaluate((stage) => {
    const box = stage.getBoundingClientRect()
    return scrollY + box.top + 1000
  })
  await page.evaluate((top) => scrollTo(0, top), stickyProbe)
  await expect.poll(() => page.locator('.TwoEmDashes .Note').evaluate((note) => {
    const noteBox = note.getBoundingClientRect()
    const mapBox = document.querySelector<HTMLElement>('.Current')!
      .getBoundingClientRect()
    return Math.round(noteBox.top - mapBox.bottom)
  })).toBeGreaterThanOrEqual(15)

  const specimenStart = await page.locator('.TwoEmDashes .NoteStage').evaluate((stage) => {
    const box = stage.getBoundingClientRect()
    return scrollY + box.top - innerHeight * 0.3
  })
  await page.evaluate((top) => scrollTo(0, top), specimenStart)
  await expect(page.locator('.TwoEmDashes .Specimens')).toHaveClass(/\bActive\b/)
  await expect(page.locator('[data-specimen].Center')).toBeVisible()
})

test('a roomy narrow dash rail spends its spare width on copy clearance', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 640, height: 900 })
  await page.goto('/')
  await page.locator('#station-fonts').scrollIntoViewIfNeeded()
  await expect(page.locator('.TwoEmDashes')).toHaveAttribute('data-dash-measured', '')

  const geometry = await page.locator('.TwoEmDashes').evaluate((copy) => {
    const note = copy.querySelector<HTMLElement>('.Note')!
    const dash = copy.querySelector<HTMLElement>('.Cell')!
    return {
      clearance: note.getBoundingClientRect().left - dash.getBoundingClientRect().right,
      fontSize: getComputedStyle(note).fontSize,
      documentWidth: document.documentElement.scrollWidth,
    }
  })

  expect(geometry.clearance).toBeGreaterThanOrEqual(31)
  expect(geometry.clearance).toBeLessThanOrEqual(33)
  expect(geometry.fontSize).toBe('14px')
  expect(geometry.documentWidth).toBe(640)
})

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
