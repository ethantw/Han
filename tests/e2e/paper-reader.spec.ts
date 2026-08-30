import { test, expect, type Page } from '@playwright/test'

const openArticle = async (page: Page, slug?: string) => {
  const link = page.locator(slug ? `[data-article="${slug}"]` : '[data-article]').first()
  await link.evaluate((element: HTMLElement) => element.click())
  const dialog = page.locator('dialog.Full')
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('[data-part="reader-body"]')).not.toHaveAttribute('aria-busy', 'true')
  return dialog
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
})

test('every newspaper jump follows the text on one shared inline baseline', async ({ page }) => {
  const audit = await page.locator('img[src="/home/paper-open.svg"]').evaluateAll((images) =>
    images.map((image) => {
      const jump = image.closest('a')!
      const style = getComputedStyle(jump)
      const parent = jump.parentElement!
      return {
        component: jump.classList.contains('PaperJump'),
        bemModifier: [...jump.classList].some((name) => name.includes('--')),
        parent: parent.localName,
        lastInParent: parent.lastElementChild === jump,
        hasText: Boolean(parent.textContent?.trim()),
        display: style.display,
        position: style.position,
        float: style.cssFloat,
        baselineRatio: Number.parseFloat(style.verticalAlign) / Number.parseFloat(style.fontSize),
      }
    }))

  expect(audit).toHaveLength(16)
  expect(audit.every(({ component }) => component)).toBe(true)
  expect(audit.every((jump) => !jump.bemModifier
    && jump.lastInParent
    && jump.hasText
    && jump.display === 'inline-block'
    && jump.position === 'static'
    && jump.float === 'none'
    && Math.abs(jump.baselineRatio - (-0.2)) < 0.001)).toBe(true)

  const punctLang = await page.locator('.PunctLang .PaperJump').evaluateAll((jumps) =>
    jumps.map((jump) => {
      const style = getComputedStyle(jump)
      return {
        parent: jump.parentElement!.localName,
        lastInParent: jump.parentElement!.lastElementChild === jump,
        float: style.cssFloat,
      }
    }))
  expect(punctLang).toHaveLength(4)
  expect(punctLang.every(({ parent, lastInParent, float }) =>
    parent === 'p'
    && lastInParent
    && float === 'none')).toBe(true)
})

test('the three homepage broadsheets use writing-aware capped column rows', async ({ page }) => {
  await page.waitForSelector('html[data-pg-ready]')
  const columns = await page.evaluate(() => {
    const read = (selector: string, paperSelector = selector) => {
      const style = getComputedStyle(document.querySelector(selector)!)
      const paperStyle = getComputedStyle(document.querySelector(paperSelector)!)
      return {
        heightInEm: Number.parseFloat(style.columnHeight) / Number.parseFloat(style.fontSize),
        rowGapInEm: Number.parseFloat(style.rowGap) / Number.parseFloat(style.fontSize),
        paddingEndInEm: Number.parseFloat(paperStyle.paddingBlockEnd)
          / Number.parseFloat(paperStyle.fontSize),
        wrap: style.columnWrap,
        rowSeparator: CSS.supports('row-rule', '1px solid')
          ? style.getPropertyValue('row-rule')
          : style.backgroundImage,
      }
    }
    return {
      horizontal: read('article.Dispatch:not(.vertical)'),
      vertical: read('article.Dispatch.vertical'),
      playground: read(
        '#station-playground [data-pg-preview]',
        '#station-playground [data-pg-paper]',
      ),
    }
  })

  expect(columns.horizontal).toMatchObject({ heightInEm: 54, rowGapInEm: 2, paddingEndInEm: 0.5, wrap: 'wrap' })
  expect(columns.vertical).toMatchObject({ heightInEm: 54, rowGapInEm: 2, paddingEndInEm: 0.5, wrap: 'wrap' })
  expect(columns.playground).toMatchObject({ heightInEm: 50, rowGapInEm: 2, paddingEndInEm: 0.5, wrap: 'wrap' })
  expect(columns.horizontal.rowSeparator).not.toBe('none')
  expect(columns.vertical.rowSeparator).not.toBe('none')
  expect(columns.playground.rowSeparator).not.toBe('none')
})

test('horizontal reader opens fitted at 100% or less with the masthead-sized toolbar', async ({ page }) => {
  const width = 700
  const height = 700
  await page.setViewportSize({ width, height })
  const dialog = await openArticle(page)

  const geometry = await dialog.evaluate((element) => {
    const rect = (selector: string) => element.querySelector(selector)!.getBoundingClientRect()
    const sheet = rect('[data-part="reader-sheet"]')
    const stage = rect('[data-part="reader-stage"]')
    const chrome = rect('[data-part="reader-chrome"]')
    const masthead = document.querySelector('body > header')!.getBoundingClientRect()
    const body = element.querySelector('[data-part="reader-body"]')!
    let inkBottom = -Infinity
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
    for (let text = walker.nextNode(); text; text = walker.nextNode()) {
      if (!text.textContent?.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(text)
      for (const line of range.getClientRects()) inkBottom = Math.max(inkBottom, line.bottom)
    }
    const scale = Number.parseFloat(getComputedStyle(element).getPropertyValue('--reader-scale'))
    return {
      scale,
      columnHeightInEm: Number.parseFloat(getComputedStyle(
        element.querySelector('[data-part="reader-body"]')!,
      ).columnHeight) / Number.parseFloat(getComputedStyle(
        element.querySelector('[data-part="reader-body"]')!,
      ).fontSize),
      columnWrap: getComputedStyle(
        element.querySelector('[data-part="reader-body"]')!,
      ).columnWrap,
      rowSeparator: CSS.supports('row-rule', '1px solid')
        ? getComputedStyle(element.querySelector('[data-part="reader-body"]')!)
          .getPropertyValue('row-rule')
        : getComputedStyle(element.querySelector('[data-part="reader-body"]')!).backgroundImage,
      trimmed: element.querySelector('[data-part="reader-stage"]')!
        .hasAttribute('data-reader-trimmed'),
      headlineSpan: getComputedStyle(
        element.querySelector('[data-part="reader-body"] > h1:first-of-type')!,
      ).columnSpan,
      paperPaddingEnd: Number.parseFloat(getComputedStyle(
        element.querySelector('[data-part="reader-stage"]')!,
      ).paddingBlockEnd),
      paperEndColor: getComputedStyle(
        element.querySelector('[data-part="reader-stage"]')!,
      ).backgroundColor,
      visiblePaperEnd: stage.bottom - inkBottom,
      sheet: { top: sheet.top, left: sheet.left, right: sheet.right },
      blockEndSpace: element.scrollHeight - stage.bottom,
      chrome: { top: chrome.top, height: chrome.height },
      masthead: { top: masthead.top, height: masthead.height },
    }
  })

  expect(geometry.scale).toBeLessThanOrEqual(1)
  expect(geometry.columnHeightInEm).toBe(44)
  expect(geometry.columnWrap).toBe('wrap')
  expect(geometry.rowSeparator).not.toBe('none')
  expect(geometry.trimmed).toBe(true)
  expect(geometry.headlineSpan).toBe('all')
  expect(geometry.paperPaddingEnd / geometry.scale).toBeCloseTo(48, 1)
  expect(geometry.paperEndColor).toBe('rgb(255, 255, 255)')
  expect(geometry.visiblePaperEnd).toBeGreaterThanOrEqual(48 * geometry.scale - 1)
  expect(geometry.sheet.top / height).toBeGreaterThanOrEqual(0.25)
  expect(geometry.sheet.top / height).toBeLessThanOrEqual(0.30)
  expect(geometry.sheet.left).toBeGreaterThanOrEqual(16 - 1)
  expect(width - geometry.sheet.right).toBeGreaterThanOrEqual(16 - 1)
  expect(geometry.blockEndSpace).toBeGreaterThanOrEqual(Math.max(160, height * 0.4) - 1)
  expect(geometry.chrome.top).toBe(geometry.masthead.top)
  expect(geometry.chrome.height).toBe(geometry.masthead.height)
})

test('the toolbar scale select transforms the sheet and clicking the paper does nothing', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 })
  const dialog = await openArticle(page)
  const sheet = dialog.locator('[data-part="reader-sheet"]')
  const select = dialog.locator('[data-reader="scale"]')
  const beforeFontSize = await sheet.evaluate((element) => getComputedStyle(element).fontSize)

  await select.selectOption('1.5')
  await expect(select).toHaveValue('1.5')
  await expect.poll(() => dialog.evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--reader-scale').trim())).toBe('1.5')
  await sheet.click({ position: { x: 10, y: 10 } })

  expect(await sheet.evaluate((element) => getComputedStyle(element).fontSize)).toBe(beforeFontSize)
  expect(await sheet.evaluate((element) => getComputedStyle(element).cursor)).not.toMatch(/^zoom-/)
  await expect(select).toHaveValue('1.5')
})

test('full articles omit the listing abstract and Hans uses its own simplified Markdown', async ({ page }) => {
  await page.route('**/articles/ark-europa-customs/hant.html', (route) => route.fulfill({
    contentType: 'text/html',
    body: '<h1>測試主標</h1><blockquote>列表摘要</blockquote><p>正文仍在，請繼續。</p>',
  }))
  const dialog = await openArticle(page, 'ark-europa-customs')
  const body = dialog.locator('[data-part="reader-body"]')
  await expect(body.locator(':scope > blockquote')).toHaveCount(0)
  await expect(body).not.toContainText('列表摘要')
  await expect(body).toContainText('正文仍在')
  await expect(body.locator(':scope > h1:first-of-type')).toHaveCSS('column-span', 'all')
  await expect.poll(() => body.locator('h-char').count()).toBeGreaterThan(0)

  await dialog.locator('[data-reader="edition"][data-edition="hans"]').click()
  await expect(dialog.locator('.Masthead')).toHaveText('太阳中文报')
  await expect(body).toContainText('欧罗巴居住域深海采矿局')
  await expect(body).not.toContainText('歐羅巴居住域深海採礦局')
  await expect(body.locator(':scope > blockquote')).toHaveCount(0)
  await expect.poll(() => body.locator('h-char').count()).toBeGreaterThan(0)
})

test('vertical reader auto-fits with reserved edges and persists its writing mode', async ({ page }) => {
  const width = 900
  const height = 700
  await page.setViewportSize({ width, height })
  let dialog = await openArticle(page, 'soviet-koi8-nuke')
  await dialog.locator('[data-reader="writing"]').click()

  await expect(dialog).toHaveAttribute('data-writing', 'vertical')
  await expect.poll(() => page.evaluate(() =>
    localStorage.getItem('han-paper-reader-writing'))).toBe('vertical')

  const geometry = await dialog.evaluate((element) => {
    const sheet = element.querySelector('[data-part="reader-sheet"]')!.getBoundingClientRect()
    const stage = element.querySelector('[data-part="reader-stage"]')!.getBoundingClientRect()
    const chrome = element.querySelector('[data-part="reader-chrome"]')!.getBoundingClientRect()
    const masthead = document.querySelector('body > header')!.getBoundingClientRect()
    return {
      scale: Number.parseFloat(getComputedStyle(element).getPropertyValue('--reader-scale')),
      sheet: { top: sheet.top, right: sheet.right, bottom: sheet.bottom },
      stage: { left: stage.left, width: stage.width },
      chrome: { top: chrome.top, height: chrome.height },
      masthead: { top: masthead.top, height: masthead.height },
    }
  })

  expect(geometry.scale).toBeLessThanOrEqual(1)
  expect(geometry.sheet.top).toBeGreaterThanOrEqual(geometry.chrome.height + 32 - 1)
  expect(height - geometry.sheet.bottom).toBeGreaterThanOrEqual(32 - 1)
  expect(width - geometry.sheet.right).toBeGreaterThanOrEqual(width * 0.30 - 1)
  expect(geometry.stage.width).toBeLessThan(
    await dialog.locator('[data-part="reader-sheet"]').evaluate((element) =>
      element.getBoundingClientRect().width),
  )
  expect(geometry.chrome.top).toBe(geometry.masthead.top)
  expect(geometry.chrome.height).toBe(geometry.masthead.height)

  await dialog.locator('[data-reader="scale"]').selectOption('1.5')
  await expect.poll(() => dialog.evaluate((element) => {
    const sheet = element.querySelector('[data-part="reader-sheet"]')!.getBoundingClientRect()
    return innerWidth - sheet.right
  })).toBeGreaterThanOrEqual(width * 0.30 - 1)

  await dialog.evaluate((element) => element.scrollTo({ left: 0, behavior: 'instant' }))
  await expect.poll(() => dialog.locator('[data-part="reader-stage"]').evaluate((element) =>
    element.getBoundingClientRect().left)).toBeGreaterThanOrEqual(Math.max(160, width * 0.4) - 1)

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await page.reload()
  dialog = await openArticle(page, 'hyperloop-12sec')
  await expect(dialog).toHaveAttribute('data-writing', 'vertical')
  await expect(dialog.locator('[data-reader="writing"]')).toHaveAttribute('aria-pressed', 'true')
})
