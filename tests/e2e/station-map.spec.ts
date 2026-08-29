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
  test('one ordered metadata list owns all seven native fragment links', async ({ page }) => {
    await page.goto('/')
    const links = page.locator('.StationMapList a')
    await expect(links).toHaveCount(7)
    expect(await links.evaluateAll(els => els.map(el => el.getAttribute('href'))))
      .toEqual(stationIds.map(id => `#${id}`))
    for (const id of stationIds) await expect(page.locator(`#${id}`)).toHaveCount(1)
  })

  test('IntersectionObserver marks the station in the reading band', async ({ page }) => {
    await page.goto('/')
    await page.locator('#station-craft').evaluate(el => el.scrollIntoView())
    await expect(page.locator('.StationMapList a[href="#station-craft"]'))
      .toHaveAttribute('aria-current', 'location')
    await expect(page.locator('.StationMapCurrentNo')).toHaveText('伍／柒')
    await expect(page.locator('.StationMapCurrentName')).toHaveText('工法')
  })

  test('native hashes survive reload and browser Back', async ({ page }) => {
    await page.goto('/')
    await page.locator('.StationMapList a[href="#station-craft"]').click()
    await expect(page).toHaveURL(/#station-craft$/)
    await page.locator('.StationMapList a[href="#station-snippet"]').click()
    await expect(page).toHaveURL(/#station-snippet$/)

    await page.goBack()
    await expect(page).toHaveURL(/#station-craft$/)
    await expect(page.locator('.StationMapList a[href="#station-craft"]'))
      .toHaveAttribute('aria-current', 'location')

    await page.reload()
    await expect(page).toHaveURL(/#station-craft$/)
    await expect(page.locator('.StationMapList a[href="#station-craft"]'))
      .toHaveAttribute('aria-current', 'location')
  })

  test('compact map discloses the task directory and closes on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const toggle = page.locator('.StationMapCurrent')
    const list = page.locator('.StationMapList')
    await expect(toggle).toBeVisible()
    await expect(toggle.locator('.StationMapCurrentNo')).toHaveText('壹／柒')
    await expect(toggle.locator('.StationMapCurrentName')).toHaveText('語意')
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
})
