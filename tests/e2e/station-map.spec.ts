import { test, expect } from '@playwright/test'

const stationIds = [
  'station-semantics',
  'station-fonts',
  'station-lines',
  'station-prose',
  'station-craft',
  'station-playground',
  'station-snippet',
]

test.describe('seven-station route map', () => {
  test('starts closed before JavaScript runs', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.locator('.Current')).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('.List')).toBeHidden()
    await context.close()
  })

  test('one ordered metadata list owns all seven native fragment links', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav.StationMap')).toHaveCount(1)
    await expect(page.locator('div.StationMap')).toHaveCount(0)
    const links = page.locator('.List a')
    await expect(links).toHaveCount(7)
    expect(await links.evaluateAll(els => els.map(el => el.getAttribute('href'))))
      .toEqual(stationIds.map(id => `#${id}`))
    for (const id of stationIds) await expect(page.locator(`#${id}`)).toHaveCount(1)
  })

  test('IntersectionObserver marks the station in the reading band', async ({ page }) => {
    await page.goto('/')
    await page.locator('#station-craft').evaluate(el => el.scrollIntoView())
    await expect(page.locator('.List a[href="#station-craft"]'))
      .toHaveAttribute('aria-current', 'location')
    await expect(page.locator('.No')).toHaveText('七之五')
    await expect(page.locator('.Name')).toHaveText('工法')
  })

  test('native hashes survive reload and browser Back', async ({ page }) => {
    await page.goto('/')
    await page.locator('.Current').click()
    await page.locator('.List a[href="#station-craft"]').click()
    await expect(page).toHaveURL(/#station-craft$/)
    await page.locator('.Current').click()
    await page.locator('.List a[href="#station-snippet"]').click()
    await expect(page).toHaveURL(/#station-snippet$/)

    await page.goBack()
    await expect(page).toHaveURL(/#station-craft$/)
    await expect(page.locator('.List a[href="#station-craft"]'))
      .toHaveAttribute('aria-current', 'location')

    await page.reload()
    await expect(page).toHaveURL(/#station-craft$/)
    await expect(page.locator('.List a[href="#station-craft"]'))
      .toHaveAttribute('aria-current', 'location')
  })

  for (const viewport of [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    test(`the same task directory discloses on ${viewport.name} and closes on Escape`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')
      const toggle = page.locator('.Current')
      const list = page.locator('.List')
      await expect(toggle).toBeVisible()
      await expect(toggle.locator('.No')).toHaveText('七之一')
      await expect(toggle.locator('.Name')).toHaveText('語意')
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await expect(list).toBeHidden()

      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      await expect(list).toBeVisible()
      await expect(list.locator('small')).toHaveCount(7)

      await page.keyboard.press('Escape')
      await expect(list).toBeHidden()
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await expect(toggle).toBeFocused()
    })
  }
})
