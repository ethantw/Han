import { test, expect, type Locator, type Page } from '@playwright/test'

type DialogCase = {
  name: string
  opener: string
  dialog: string
  panel: string
}

const cases: DialogCase[] = [
  {
    name: 'quickstart',
    opener: '[data-quickstart-open]',
    dialog: '[data-quickstart-dialog]',
    panel: '.Panel',
  },
  {
    name: 'transfer size',
    opener: '.OpenSizeDialog',
    dialog: '.SizeDialog',
    panel: '.Panel',
  },
  {
    name: 'article reader',
    opener: '[data-article]',
    dialog: 'dialog.Reader',
    panel: '.Stage',
  },
]

const open = async (page: Page, item: DialogCase) => {
  const opener = page.locator(item.opener).first()
  await opener.scrollIntoViewIfNeeded()
  await opener.evaluate((element: HTMLElement) => element.click())
  const dialog = page.locator(item.dialog)
  await expect(dialog).toBeVisible()
  if (item.name === 'article reader') {
    await expect(dialog).toHaveAttribute('data-stage-visible', '')
  }
  return { dialog, panel: dialog.locator(item.panel) }
}

const frames = (locator: Locator) => locator.evaluate((element) =>
  element.getAnimations().flatMap((animation) => animation.effect!.getKeyframes()))

for (const item of cases) {
  test(`${item.name} flies from the viewport bottom behind a fading mask`, async ({ page }) => {
    const height = 700
    await page.setViewportSize({ width: 900, height })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.goto('/')
    // Keep the transition alive long enough for the test to inspect its
    // generated keyframes after asynchronous reader/module setup.
    await page.addStyleTag({ content: `
      dialog:is(.QuickstartDialog, .SizeDialog, .Reader) >
        :is(.Panel, .Stage),
      dialog:is(.QuickstartDialog, .SizeDialog, .Reader)::backdrop {
        transition-duration: 10s !important;
      }
    ` })

    const { dialog, panel } = await open(page, item)
    const panelFrames = await frames(panel)
    expect(panelFrames.some((frame) => {
      const distance = /^0px ([\d.]+)px$/.exec(String(frame.translate))?.[1]
      return Number(distance) >= height - 1
    })).toBe(true)
    expect(panelFrames.some((frame) => frame.translate === '0px')).toBe(true)

    const backdropFrames = await dialog.evaluate((element) =>
      document.getAnimations()
        .filter((animation) => animation.effect?.target === element
          && animation.effect.pseudoElement === '::backdrop')
        .flatMap((animation) => animation.effect!.getKeyframes()))
    expect(backdropFrames.some((frame) => frame.opacity === '0')).toBe(true)
    expect(backdropFrames.some((frame) => frame.opacity === '1')).toBe(true)
  })
}

test('the vertical article reader flies from left to right', async ({ page }) => {
  const width = 900
  await page.setViewportSize({ width, height: 700 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('han-paper-reader-writing', 'vertical'))
  await page.addStyleTag({ content: `
    dialog.Reader > .Stage { transition-duration: 10s !important; }
  ` })

  const { panel } = await open(page, cases[2])
  const panelFrames = await frames(panel)
  expect(panelFrames.some((frame) => {
    const distance = /^-([\d.]+)px(?: 0px)?$/.exec(String(frame.translate))?.[1]
    return Number(distance) >= width - 1
  })).toBe(true)
  expect(panelFrames.some((frame) => frame.translate === '0px')).toBe(true)
})

test('the article toolbar drops in quickly without overshooting the mask', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await page.addStyleTag({ content: `
    dialog.Reader > .Chrome { transition-duration: 10s !important; }
  ` })

  const { dialog } = await open(page, cases[2])
  const chrome = dialog.locator('.Chrome')
  const chromeFrames = await frames(chrome)
  expect(chromeFrames.some((frame) => {
    const value = String(frame.translate)
    const distance = /^0px -([\d.]+)px$/.exec(value)?.[1]
    return value === '0px -100%' || Number(distance) >= 63
  })).toBe(true)
  expect(chromeFrames.some((frame) => frame.translate === '0px')).toBe(true)

  const timing = await chrome.evaluate((element) => getComputedStyle(element).transitionTimingFunction)
  expect(timing).toContain('cubic-bezier(0.16, 1, 0.3, 1)')
})

test('the article shell shows a viewport-wide loading pulse and its mask can cancel the fetch', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  let releaseArticle!: () => void
  const articleGate = new Promise<void>((resolve) => { releaseArticle = resolve })
  await page.route('**/articles/**', async (route) => {
    await articleGate
    await route.continue()
  })
  await page.goto('/')

  await page.locator('[data-article]').first().evaluate((element: HTMLElement) => element.click())
  const dialog = page.locator('dialog.Reader')
  const loading = dialog.locator('.Loading')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('data-chrome-visible', '')
  await expect(dialog).toHaveAttribute('data-reader-loading', '')
  await expect(dialog).not.toHaveAttribute('data-stage-visible', '')
  await expect(loading).toHaveAttribute('aria-hidden', 'false')
  const geometry = await loading.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      top: rect.top,
      width: rect.width,
      height: rect.height,
      animation: getComputedStyle(element, '::after').animationName,
    }
  })
  expect(geometry).toEqual({ top: 0, width: 900, height: 3, animation: 'reader-loading' })

  await dialog.evaluate((element: HTMLElement) => element.click())
  await expect(dialog).toBeHidden()
  releaseArticle()
})

test('a cached article still waits 250ms after the shell before flying in', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const link = page.locator('[data-article]').first()
  await link.evaluate((element: HTMLElement) => element.click())
  const dialog = page.locator('dialog.Reader')
  await expect(dialog).toHaveAttribute('data-stage-visible', '')
  await dialog.locator('.Close').click()
  await expect(dialog).toBeHidden()

  const elapsed = await page.evaluate(async () => {
    const reader = document.querySelector('dialog.Reader')!
    const jump = document.querySelector<HTMLElement>('[data-article]')!
    const stageVisible = new Promise<number>((resolve) => {
      const observer = new MutationObserver(() => {
        if (!reader.hasAttribute('data-stage-visible')) return
        observer.disconnect()
        resolve(performance.now())
      })
      observer.observe(reader, { attributes: true, attributeFilter: ['data-stage-visible'] })
    })
    const started = performance.now()
    jump.click()
    return (await stageVisible) - started
  })
  expect(elapsed).toBeGreaterThanOrEqual(240)
})

test('the article leaves before its toolbar and mask retract', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await page.addStyleTag({ content: `
    dialog.Reader > .Stage,
    dialog.Reader > .Chrome,
    dialog.Reader::backdrop { transition-duration: 100ms !important; }
  ` })
  const { dialog } = await open(page, cases[2])

  await dialog.locator('.Close').click({ noWaitAfter: true })
  await expect(dialog).not.toHaveAttribute('data-stage-visible', '')
  await expect(dialog).toHaveAttribute('data-chrome-visible', '')
  await expect(dialog).toHaveAttribute('open', '')

  await expect(dialog).not.toHaveAttribute('data-chrome-visible', '')
  await expect(dialog).toHaveAttribute('open', '')
  await expect(dialog).toBeHidden()
})

test('shared dialogs remain immediately usable with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')

  for (const item of cases) {
    const { dialog, panel } = await open(page, item)
    expect(await frames(panel)).toHaveLength(0)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  }
})
