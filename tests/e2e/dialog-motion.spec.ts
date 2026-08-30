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
    panel: '[data-part="reader-sheet"]',
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
        :is(.QuickstartPanel, [data-part="size-dialog-panel"], [data-part="reader-sheet"]),
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
