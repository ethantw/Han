import { test, expect } from '@playwright/test'

/** Station② compares three roles across two heritage families and three texts. */
test.describe('heritage three-face specimen', () => {
  test('switches family, copy and the matching report link', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 })
    await page.goto('/')

    const rows = page.locator('.Faces > li')
    await expect(rows).toHaveCount(3)
    expect(await rows.evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.face)))
      .toEqual(['sans', 'serif', 'cursive'])
    await expect(page.locator('.Faces input')).toHaveCount(0)

    const controls = page.locator('.FacesSwitch')
    await expect(controls.locator('input[name="faces-family"]')).toHaveCount(2)
    await expect(controls.locator('input[name="faces-copy"]')).toHaveCount(3)
    await expect(controls.locator('input[name="faces-size"]')).toHaveAttribute('min', '10')
    await expect(controls.locator('input[name="faces-size"]')).toHaveAttribute('max', '32')
    await expect(controls.locator('input[name="faces-size"]')).toHaveValue('24')
    await expect(rows.first().locator('[data-faces-copy="a"]')).toBeVisible()
    await expect(rows.first().locator('[data-faces-copy="b"]')).toBeHidden()

    await controls.locator('label:has(input[name="faces-copy"][value="b"])').click()
    await expect(page.locator('.Illust[data-variant="faces"]'))
      .toHaveAttribute('data-faces-copy-selected', 'b')
    await expect(rows.first().locator('[data-faces-copy="a"]')).toBeHidden()
    await expect(rows.first().locator('[data-faces-copy="b"]'))
      .toContainText('官方標準只能回答合不合規')
    await expect(rows.locator('[data-faces-copy="a"] .PaperJump')).toHaveCount(3)
    await expect(rows.locator('[data-faces-copy="a"] .PaperJump').first()).toBeHidden()
    await expect(rows.locator('[data-faces-copy="b"] .PaperJump')).toHaveCount(3)
    await expect(rows.locator('[data-faces-copy="b"] .PaperJump').first()).toBeVisible()
    await expect(rows.locator('[data-faces-copy="b"] .PaperJump').first())
      .toHaveAttribute('data-article', 'standard-glyph-revival')

    await controls.locator('label:has(input[name="faces-copy"][value="c"])').click()
    await expect(page.locator('.Illust[data-variant="faces"]'))
      .toHaveAttribute('data-faces-copy-selected', 'c')
    await expect(rows.first().locator('[data-faces-copy="c"]'))
      .toContainText('意念沒有標點　嘴巴有')
    await expect(rows.locator('[data-faces-copy="c"] .PaperJump')).toHaveCount(3)
    await expect(rows.locator('[data-faces-copy="c"] .PaperJump').first()).toBeVisible()
    await expect(rows.locator('[data-faces-copy="c"] .PaperJump').first())
      .toHaveAttribute('data-article', 'telepathy-speech-rehab')

    await controls.locator('label:has(input[name="faces-family"][value="genki"])').click()
    await expect(page.locator('.Illust[data-variant="faces"]'))
      .toHaveAttribute('data-faces-family-selected', 'genki')
    await expect(rows.first()).toHaveCSS('font-family', /Genki Sans/)
    await expect(rows.nth(1)).toHaveCSS('font-family', /Genki Serif/)
    await expect(rows.nth(2)).toHaveCSS('font-family', /Han Home Kai|LXGW WenKai/)

    await controls.locator('input[name="faces-size"]').fill('10')
    await expect(rows.first()).toHaveCSS('font-size', '10px')
    await expect(controls.locator('output[for="faces-size"]')).toHaveText('10px')
    await controls.locator('input[name="faces-size"]').fill('32')
    await expect(rows.first()).toHaveCSS('font-size', '32px')
    await controls.locator('input[name="faces-weight"]').fill('700')
    await expect(rows.first().locator('[data-faces-copy="c"]')).toHaveCSS('font-weight', '700')
    await expect(controls.locator('output[for="faces-weight"]')).toHaveText('700')

    await expect(page.locator('.Illust[data-variant="faces"] + .FormeRail'))
      .toHaveCSS('margin-block-start', '200px')
  })

  test('DTJ cover flow carries all punctuation and heritage cards', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto('/')

    const cards = page.locator('.TwoEmDashes .Specimens ul > [data-specimen]')
    await expect(cards).toHaveCount(15)
    expect(await cards.evaluateAll(nodes => nodes.map(node => (node as HTMLElement).dataset.specimen)))
      .toEqual([
        'interpunct', 'ideographic-comma-pair', 'comma-pair', 'full-stop-pair',
        'dash', 'ellipsis',
        'bone', 'door', 'beauty', 'walk', 'tai', 'north', 'rain', 'hall', 'nurture',
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
    await expect(page.locator('[data-specimen][data-kind="glyph"]').first())
      .toHaveCSS('background-clip', /text/)
  })

  test('vertical four-language specimen always becomes one carousel rail', async ({ page }) => {
    await page.setViewportSize({ width: 1728, height: 1000 })
    await page.goto('/')

    const figure = page.locator('.PunctLang')
    await page.locator('input[name="pl-writing"][value="vertical"]').evaluate((input: HTMLInputElement) => {
      input.checked = true
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await expect(figure).toHaveClass(/\bRail\b/)
    await expect(figure.locator(':scope > ul')).not.toHaveAttribute('data-strip')
    await expect(figure.locator(':scope > ul')).toHaveCSS('overflow-x', 'auto')
    await expect(figure.locator(':scope > ul > li').first()).toHaveCSS('overflow', 'visible')
    await expect(figure.locator(':scope > ul > li > p').first()).toHaveCSS('overflow', 'visible')
    const [figureBox, railBox] = await Promise.all([
      figure.boundingBox(),
      figure.locator(':scope > ul').boundingBox(),
    ])
    /* The current rail owns overflow at the figure boundary; each language
       card grows to its vertical content instead of spawning a cramped inner
       scroller. It no longer pretends to be full-viewport when the whole run
       already fits. */
    expect(figureBox && railBox && Math.abs(railBox.x - figureBox.x)).toBeLessThan(1)
    expect(figureBox && railBox && Math.abs(railBox.width - figureBox.width)).toBeLessThan(1)
  })

  test('four-language punctuation follows the newspaper locale order', async ({ page }) => {
    const cases = [
      ['/', ['zh-Hant', 'zh-Hans', 'ja', 'ko-Kore']],
      ['/hans/', ['zh-Hans', 'zh-Hant', 'ja', 'ko-Kore']],
      ['/ja/', ['ja', 'ko-Kore', 'zh-Hant', 'zh-Hans']],
      ['/ko/', ['ko-Kore', 'ja', 'zh-Hant', 'zh-Hans']],
    ] as const

    for (const [url, expected] of cases) {
      await page.goto(url)
      const order = await page.locator('.PunctLang > ul > li').evaluateAll((cards) => (
        cards
          .map((card) => ({ lang: card.getAttribute('lang'), order: Number(getComputedStyle(card).order) }))
          .sort((a, b) => a.order - b.order)
          .map(({ lang }) => lang)
      ))
      expect(order).toEqual(expected)
    }
  })

  test('the forme still answers the pointer on its slugs', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    const slug = page.locator('.LeadForme .Slug').first()
    await slug.scrollIntoViewIfNeeded()
    await expect(slug).toHaveCSS('pointer-events', 'auto')
    await expect(page.locator('.LeadForme .Controls')).toHaveCSS('pointer-events', 'auto')

    const jump = page.locator('.LeadForme svg .FormePaperJump')
    await expect(jump).toHaveCount(1)
    await expect(jump).toHaveAttribute('data-article', 'hyperloop-12sec')
    await expect(jump).toHaveAttribute('data-edition', 'hant')
    await expect(jump).toHaveAttribute('href', '/articles/hyperloop-12sec/hant.html')
    await expect(jump.locator('.PaperSlug .SlugLift > polygon')).toHaveCount(3)
    await expect(jump.locator('.lbl-press')).toHaveCount(2)
    await expect(jump.locator('.lbl-press').first()).toHaveText('按看看')
    expect(await jump.locator('.PaperMark').first().evaluate((mark) => {
      const values = mark.getAttribute('transform')
        ?.match(/matrix\(([^)]+)\)/)?.[1]
        .trim().split(/\s+/).map(Number)
      return values ? values[0] * values[3] - values[1] * values[2] : 0
    })).toBeLessThan(0)

    await jump.locator('.PaperHit').click()
    await expect(page.locator('.Reader')).toHaveAttribute('open', '')
  })
})
