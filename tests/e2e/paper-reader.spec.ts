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
  const audit = await page.locator('a.PaperJump').evaluateAll((jumps) =>
    jumps.map((jump) => {
      const style = getComputedStyle(jump)
      const generated = getComputedStyle(jump, '::before')
      const parent = jump.parentElement!
      return {
        component: jump.classList.contains('PaperJump'),
        bemModifier: [...jump.classList].some((name) => name.includes('--')),
        sourceText: jump.textContent?.trim(),
        title: jump.getAttribute('title'),
        ariaLabel: jump.getAttribute('aria-label'),
        childImages: jump.querySelectorAll('img').length,
        generatedIcon: generated.content,
        generatedLineHeight: generated.lineHeight,
        generatedScale: Number.parseFloat(generated.scale),
        parent: parent.localName,
        lastInParent: parent.lastElementChild === jump,
        hasText: Boolean(parent.textContent?.trim()),
        display: style.display,
        position: style.position,
        float: style.cssFloat,
        translate: style.translate,
        textIndent: style.textIndent,
        expectedScale: Number.parseFloat(style.fontSize) / 16,
        baselineRatio: Number.parseFloat(style.verticalAlign) / Number.parseFloat(style.fontSize),
      }
    }))

  expect(audit).toHaveLength(16)
  expect(audit.every(({ component }) => component)).toBe(true)
  expect(audit.every((jump) => !jump.bemModifier
    && Boolean(jump.sourceText)
    && jump.sourceText === jump.title
    && jump.ariaLabel === null
    && jump.childImages === 0
    && jump.generatedIcon.includes('/home/paper-open.svg')
    && jump.generatedLineHeight === '0px'
    && jump.lastInParent
    && jump.hasText
    && jump.display === 'inline-block'
    && jump.position === 'static'
    && jump.float === 'none'
    && jump.translate === 'none'
    && jump.textIndent === '0px'
    && Math.abs(jump.generatedScale - jump.expectedScale) < 0.001
    && Math.abs(jump.baselineRatio - (-0.125)) < 0.001)).toBe(true)

  const iconIntrinsicSize = await page.evaluate(async () => {
    const source = await fetch('/home/paper-open.svg').then((response) => response.text())
    const svg = new DOMParser().parseFromString(source, 'image/svg+xml').documentElement
    return [svg.getAttribute('width'), svg.getAttribute('height')]
  })
  expect(iconIntrinsicSize).toEqual(['16', '16'])

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

test('newspaper headings avoid a column break on both the homepage and reader', async ({ page }) => {
  const homepageBreak = await page.locator('figure.Papers > article > h3').first()
    .evaluate((heading) => getComputedStyle(heading).breakAfter)
  const dialog = await openArticle(page)
  const readerBreak = await dialog.locator('[data-part="reader-body"] > h1').first()
    .evaluate((heading) => getComputedStyle(heading).breakAfter)

  expect(homepageBreak).toBe('avoid-column')
  expect(readerBreak).toBe('avoid-column')
})

test('turning reader punctuation hanging off restores ordinary punctuation boxes', async ({ page }) => {
  const dialog = await openArticle(page)
  const body = dialog.locator('[data-part="reader-body"]')
  const hangables = body.locator('h-char[data-punct~="hangable"]')
  const count = await hangables.count()
  expect(count).toBeGreaterThan(0)

  await dialog.locator('[data-reader="console"]').click()
  const mirror = dialog.locator('han-console[mirror]')
  await expect(mirror).toHaveAttribute('data-ready', '')
  await mirror.locator('[data-cfg-key="hang"]').evaluate((input: HTMLInputElement) => {
    input.checked = false
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect.poll(() => body.evaluate((element) =>
    getComputedStyle(element).getPropertyValue('--han-punctuation-refinement').trim(),
  )).toBe('compress')

  const audit = await body.evaluate((element) => {
    const chars = [...element.querySelectorAll('h-char[data-punct~="hangable"]')]
    return {
      refinement: getComputedStyle(element).getPropertyValue('--han-punctuation-refinement').trim(),
      chars: chars.length,
      layers: element.querySelectorAll('h-char[data-punct~="hangable"] h-layer').length,
      samples: chars.map((char) => {
        const layer = char.querySelector('h-layer')!
        return {
          state: getComputedStyle(char).getPropertyValue('--han-state-hanging-punctuation').trim(),
          layerDisplay: getComputedStyle(layer).display,
          after: getComputedStyle(char, '::after').content,
        }
      }),
    }
  })

  expect(audit.refinement).toBe('compress')
  expect(audit.chars).toBe(count)
  expect(audit.layers).toBe(count)
  expect(audit.samples.every(({ state, layerDisplay, after }) =>
    state === 'off' && layerDisplay !== 'inline-block' && after === 'none')).toBe(true)
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
      rowSeparator: (() => {
        const body = element.querySelector('[data-part="reader-body"]')!
        const field = element.querySelector('[data-part="reader-row-field"]')!
        const native = getComputedStyle(body).getPropertyValue('row-rule')
        return native && native !== 'none'
          ? native
          : getComputedStyle(field).backgroundImage
      })(),
      rowFieldWidth: rect('[data-part="reader-row-field"]').width,
      bodyWidth: rect('[data-part="reader-body"]').width,
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
  expect(geometry.rowFieldWidth).toBeCloseTo(geometry.bodyWidth, 1)
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

test('an oversized horizontal paper keeps an outer gutter at both scroll edges', async ({ page }) => {
  const width = 390
  await page.setViewportSize({ width, height: 844 })
  const dialog = await openArticle(page)
  await dialog.locator('[data-reader="scale"]').selectOption('1')

  const geometry = await dialog.evaluate((element) => {
    const stage = element.querySelector('[data-part="reader-stage"]')!
    const style = getComputedStyle(stage)
    const gutterValue = style.getPropertyValue('--reader-inline-gutter').trim()
    const gutter = Number.parseFloat(gutterValue)
      * (gutterValue.endsWith('rem')
        ? Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
        : 1)
    return {
      gutter,
      stageWidth: stage.getBoundingClientRect().width,
      startSpace: stage.offsetLeft,
      endSpace: element.scrollWidth - stage.offsetLeft - stage.offsetWidth,
    }
  })

  expect(geometry.stageWidth).toBeGreaterThan(width)
  expect(geometry.gutter).toBe(16)
  expect(geometry.startSpace).toBeGreaterThanOrEqual(geometry.gutter - 1)
  expect(geometry.endSpace).toBeGreaterThanOrEqual(geometry.gutter - 1)
})

test('reader chrome places tools left, editions in the viewport centre, and only close right', async ({ page }) => {
  const dialog = await openArticle(page)
  const geometry = await dialog.locator('[data-part="reader-chrome"]').evaluate((chrome) => {
    const rect = (selector: string) => chrome.querySelector(selector)!.getBoundingClientRect()
    return {
      tools: rect('[data-reader-group="tools"]'),
      editions: rect('[data-reader-group="editions"]'),
      actions: rect('[data-reader-group="actions"]'),
      close: rect('[data-reader="close"]'),
      actionCount: chrome.querySelectorAll('[data-reader-group="actions"] > *').length,
    }
  })

  expect(geometry.tools.right).toBeLessThan(geometry.editions.left)
  expect(geometry.editions.left + geometry.editions.width / 2).toBeCloseTo(1280 / 2, 0)
  expect(geometry.actions.left).toBeGreaterThan(geometry.editions.right)
  expect(geometry.actionCount).toBe(1)
  expect(1280 - geometry.close.right).toBeCloseTo(32, 0)
})

test('reader editions are visible and viewport-centred from 640px', async ({ page }) => {
  const width = 640
  await page.setViewportSize({ width, height: 800 })
  const dialog = await openArticle(page)
  const editions = dialog.locator('[data-reader-group="editions"]')
  const geometry = await editions.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      display: getComputedStyle(element).display,
      centre: rect.left + rect.width / 2,
    }
  })

  expect(geometry.display).toBe('flex')
  expect(geometry.centre).toBeCloseTo(width / 2, 0)
})

test('compact reader chrome hides editions while tools and close stay available', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const dialog = await openArticle(page)
  const geometry = await dialog.locator('[data-part="reader-chrome"]').evaluate((chrome) => {
    const rect = (selector: string) => chrome.querySelector(selector)!.getBoundingClientRect()
    const controls = chrome.querySelector('[data-part="reader-controls"]')!
    const actions = rect('[data-reader-group="actions"]')
    const consoleButton = rect('[data-reader="console"]')
    const close = rect('[data-reader="close"]')
    return {
      controlsOverflow: controls.scrollWidth > controls.clientWidth,
      editionsDisplay: getComputedStyle(
        chrome.querySelector('[data-reader-group="editions"]')!,
      ).display,
      controlsRight: controls.getBoundingClientRect().right,
      actionsLeft: actions.left,
      closeRight: close.right,
      consoleHit: chrome.querySelector('[data-reader="console"]')!.contains(
        document.elementFromPoint(consoleButton.left + consoleButton.width / 2, consoleButton.top + consoleButton.height / 2),
      ),
      closeHit: chrome.querySelector('[data-reader="close"]')!.contains(
        document.elementFromPoint(close.left + close.width / 2, close.top + close.height / 2),
      ),
    }
  })

  expect(geometry.controlsOverflow).toBe(false)
  expect(geometry.editionsDisplay).toBe('none')
  expect(geometry.controlsRight).toBeLessThanOrEqual(geometry.actionsLeft)
  expect(390 - geometry.closeRight).toBeCloseTo(16, 0)
  expect(geometry.consoleHit).toBe(true)
  expect(geometry.closeHit).toBe(true)
})

test('the reader toolbar opens a left-anchored console copy sharing the side config', async ({ page }) => {
  const sideConsole = page.locator('body > .ConsolePanel han-console')
  const sideSize = sideConsole.locator('.MetricSlider[data-metric="size"] input')
  await expect(sideSize).toHaveValue('16')
  const dialog = await openArticle(page)
  const toggle = dialog.locator('[data-reader="console"]')

  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.click()
  const panel = dialog.locator('.ConsolePanel[data-console-context="reader"]')
  const readerConsole = panel.locator('han-console[mirror]')
  const readerSize = readerConsole.locator('.MetricSlider[data-metric="size"] input')
  const sideGeneric = sideConsole.locator('[data-cfg-key="baseGeneric"]')
  const readerGeneric = readerConsole.locator('[data-cfg-key="baseGeneric"]')
  await expect(panel).toBeVisible()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('han-console')).toHaveCount(2)
  await expect(sideConsole).toHaveCount(1)
  await expect(readerConsole).toHaveCount(1)
  const anchors = await Promise.all([
    toggle.boundingBox(),
    panel.boundingBox(),
  ])
  expect(anchors[1]!.x).toBeCloseTo(anchors[0]!.x, 0)

  await readerSize.evaluate((input: HTMLInputElement) => {
    input.value = '18'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(sideSize).toHaveValue('18')
  await sideSize.evaluate((input: HTMLInputElement) => {
    input.value = '19'
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(readerSize).toHaveValue('19')
  await readerGeneric.selectOption('serif')
  await expect(sideGeneric).toHaveValue('serif')
  await sideGeneric.selectOption('sans-serif')
  await expect(readerGeneric).toHaveValue('sans-serif')
  await panel.locator('.ConsolePanelClose').click()

  await expect(panel).toBeHidden()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(sideConsole).toHaveCount(1)
  await expect(sideSize).toHaveValue('19')

  // The toolbar trigger itself toggles the panel both ways.
  await toggle.click()
  await expect(panel).toBeVisible()
  await toggle.click()
  await expect(panel).toBeHidden()

  // Escape dismisses only the console on its first press; the report remains.
  await toggle.click()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeVisible()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
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

test('the Hans homepage opens generic newspaper links in the Hans edition', async ({ page }) => {
  await page.goto('/hans/')
  const dialog = await openArticle(page, 'hyperloop-12sec')
  const body = dialog.locator('[data-part="reader-body"]')

  await expect(dialog).toHaveAttribute('lang', 'zh-Hans')
  await expect(dialog.locator('[data-reader="edition"][data-edition="hans"]'))
    .toHaveAttribute('aria-current', '')
  await expect(body).toContainText('超回路台北段今晨通车')
  await expect(body).not.toContainText('超迴路台北段今晨通車')
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
  const sheetWidth = await dialog.locator('[data-part="reader-sheet"]')
    .evaluate((element) => element.getBoundingClientRect().width)
  /* With no empty final column to crop, the stage adds only its deliberate
     3rem paper tail; with empty columns it is narrower than the sheet. */
  expect(geometry.stage.width).toBeLessThanOrEqual(sheetWidth + 48 * geometry.scale + 1)
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
