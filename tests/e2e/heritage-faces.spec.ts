import { test, expect } from '@playwright/test'

/** Station② keeps only the three Shanggu faces; the lifted forme must not
 * obscure their text or steal pointer events from its own controls. */
test.describe('Shanggu three-face specimen', () => {
  test('contains exactly sans, serif and cursive heritage rows', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 })
    await page.goto('/')

    const rows = page.locator('.Faces > li')
    await expect(rows).toHaveCount(3)
    expect(await rows.evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.face)))
      .toEqual(['sans', 'serif', 'cursive'])
    await expect(page.locator('.Faces input')).toHaveCount(0)
  })

  test('DTJ cover flow carries all punctuation and heritage cards', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/')

    const cards = page.locator('[data-specimen-flow] > [data-specimen]')
    await expect(cards).toHaveCount(14)
    expect(await cards.evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.specimen)))
      .toEqual([
        'interpunct', 'ideographic-comma-pair', 'comma-pair', 'full-stop-pair',
        'dash', 'ellipsis',
        'bone', 'door', 'beauty', 'walk', 'tai', 'rain', 'hall', 'nurture',
      ])
    await expect(page.locator('[data-convention="moe"]').first())
      .toHaveCSS('font-family', /Diantenjeom Serif MOE/)
    await expect(page.locator('[data-convention="klr"]').first())
      .toHaveCSS('font-family', /Diantenjeom Serif KLR/)

    const normal = await cards.first().boundingBox()
    const pair = await cards.nth(1).boundingBox()
    const pairGlyphs = page.locator('[data-kind="conventions"]').first().locator('span')
    const left = await pairGlyphs.first().boundingBox()
    const right = await pairGlyphs.nth(1).boundingBox()
    expect(normal && pair && Math.abs(pair.width - normal.width * 2)).toBeLessThan(1)
    expect(left && right && Math.abs((left.x + left.width) - right.x)).toBeLessThan(1)
    await expect(page.locator(
      '[data-specimen][data-kind="punctuation"] > span, '
      + '[data-specimen][data-kind="glyph"] > span',
    )).toHaveCount(0)
  })

  test('the forme still answers the pointer on its slugs', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 })
    await page.goto('/')

    const slug = page.locator('.LeadForme .Slug').first()
    await slug.scrollIntoViewIfNeeded()
    await expect(slug).toHaveCSS('pointer-events', 'auto')
    await expect(page.locator('.LeadForme .Controls')).toHaveCSS('pointer-events', 'auto')
  })
})
