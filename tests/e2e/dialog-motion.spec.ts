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
    panel: '.QuickstartPanel',
  },
  {
    name: 'transfer size',
    opener: '[data-size-dialog-open]',
    dialog: '[data-size-dialog]',
    panel: '[data-part="size-dialog-panel"]',
  },
  {
    name: 'article reader',
    opener: '[data-article]',
    dialog: 'dialog.Full',
    panel: '[data-part="reader-stage"]',
  },
]

const open = async (page: Page, item: DialogCase) => {
  const opener = page.locator(item.opener).first()
  await opener.scrollIntoViewIfNeeded()
  await opener.evaluate((element: HTMLElement) => element.click())
  const dialog = page.locator(item.dialog)
  await expect(dialog).toBeVisible()
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
      dialog:is(.QuickstartDialog, .SizeDialog, .Full) >
        :is(.QuickstartPanel, [data-part="size-dialog-panel"], [data-part="reader-stage"]),
      dialog:is(.QuickstartDialog, .SizeDialog, .Full)::backdrop {
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
    dialog.Full > [data-part="reader-stage"] { transition-duration: 10s !important; }
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
    dialog.Full > [data-part="reader-chrome"] { transition-duration: 10s !important; }
  ` })

  const { dialog } = await open(page, cases[2])
  const chrome = dialog.locator('[data-part="reader-chrome"]')
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
