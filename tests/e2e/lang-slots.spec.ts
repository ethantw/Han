import { test, expect, type Page } from '@playwright/test'

const family = (page: Page, id: string) => page.locator(`#${id}`).evaluate(
  (element) => getComputedStyle(element).fontFamily,
)

const slot = (page: Page, id: string, name: string) => page.locator(`#${id}`).evaluate(
  (element, property) => getComputedStyle(element).getPropertyValue(property).trim(),
  name,
)

test.describe('font roles at explicit language boundaries', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/e2e/fixtures/lang-slots.html')
  })

  test('bare document and default containers use locale sans stacks', async ({ page }) => {
    const body = await page.locator('body').evaluate((element) => getComputedStyle(element).fontFamily)
    expect(body).toContain('Diantenjeom Sans MOE')
    expect(body).toContain('Shanggu Sans')
    expect(body).not.toContain('HanNone')

    expect(await family(page, 'default-hant')).toMatch(/Diantenjeom Sans MOE.*Shanggu Sans.*system-ui, sans-serif/)
    expect(await family(page, 'default-ja')).toMatch(/Diantenjeom Sans JIS.*HanNone, system-ui, sans-serif/)
    expect(await family(page, 'default-ko')).toMatch(/Diantenjeom Sans KLR.*HanNone, system-ui, sans-serif/)
  })

  test('alternative role survives zh-Hant, ja and ko boundaries', async ({ page }) => {
    expect(await family(page, 'alternative-hant')).toMatch(/Diantenjeom Serif MOE.*Shanggu Serif.*serif$/)
    expect(await family(page, 'alternative-ja')).toMatch(/Diantenjeom Serif JIS.*HanNone, serif$/)
    expect(await family(page, 'alternative-ko')).toMatch(/Diantenjeom Serif KLR.*HanNone, serif$/)
  })

  test('accent role survives zh-Hant, ja and ko boundaries', async ({ page }) => {
    expect(await family(page, 'accent-hant')).toMatch(/Diantenjeom Serif MOE.*LXGW WenKai TC.*cursive, serif$/)
    expect(await family(page, 'accent-ja')).toMatch(/Diantenjeom Serif JIS.*Klee.*cursive, serif$/)
    expect(await family(page, 'accent-ko')).toMatch(/Diantenjeom Serif KLR.*HanNone, cursive, serif$/)
  })

  test('nested boundaries re-resolve each locale without losing serif role', async ({ page }) => {
    expect(await family(page, 'nested-hant')).toContain('Diantenjeom Serif MOE')
    expect(await family(page, 'nested-ja')).toContain('Diantenjeom Serif JIS')
    expect(await family(page, 'nested-ko')).toContain('Diantenjeom Serif KLR')
    for (const id of ['nested-hant', 'nested-ja', 'nested-ko']) {
      expect(await family(page, id), id).toMatch(/serif$/)
      expect(await page.locator(`#${id}`).evaluate(
        (element) => getComputedStyle(element).getPropertyValue('--han-font-role').trim(),
      )).toBe('alternative')
    }
  })

  test('custom role preserves an opaque author stack verbatim', async ({ page }) => {
    for (const id of ['custom-hant', 'custom-ja', 'custom-ko']) {
      expect(await family(page, id), id).toBe('"Author Face", fantasy')
    }
  })

  test('foreign-language subtrees do not inherit the TC heritage slots', async ({ page }) => {
    for (const name of ['--han-font-cjk-sans', '--han-font-cjk-serif']) {
      expect(await slot(page, 'default-hant', name)).toContain('Shanggu')
    }

    for (const id of ['default-ja', 'default-ko']) {
      for (const name of ['--han-font-cjk-sans', '--han-font-cjk-serif']) {
        expect(await slot(page, id, name), `${id} ${name}`).toBe('HanNone')
      }
    }

    expect(await slot(page, 'default-ko', '--han-font-cjk-cursive')).toBe('HanNone')
  })
})

test('han.basic.css inherits static roles and custom stacks without locale resets', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/lang-slots-basic.html')

  for (const id of ['default-hant', 'default-ja', 'default-ko']) {
    expect(await family(page, id), id).toMatch(/system-ui, sans-serif$/)
  }
  for (const id of ['alternative-hant', 'alternative-ja', 'alternative-ko', 'nested-hant', 'nested-ja', 'nested-ko']) {
    expect(await family(page, id), id).toMatch(/serif$/)
    expect(await family(page, id), id).not.toContain('sans-serif')
  }
  for (const id of ['accent-hant', 'accent-ja', 'accent-ko']) {
    expect(await family(page, id), id).toMatch(/cursive, serif$/)
  }
  for (const id of ['custom-hant', 'custom-ja', 'custom-ko']) {
    expect(await family(page, id), id).toBe('"Author Face", fantasy')
  }
})

test('ruby readings headline carries its alternative role through all language copies', async ({ page }) => {
  await page.goto('/demo/ruby-readings.html')

  const headline = page.locator('#story-title')
  await expect(headline).toHaveCSS('font-family', /Diantenjeom Serif MOE/)
  expect(await headline.evaluate(
    (element) => getComputedStyle(element).getPropertyValue('--han-font-role').trim(),
  )).toBe('alternative')

  const expected = [
    ['nan-Hant-TW', 'Diantenjeom Serif MOE'],
    ['zh-Hant-TW', 'Diantenjeom Serif MOE'],
    ['ja', 'Diantenjeom Serif JIS'],
    ['ko', 'Diantenjeom Serif KLR'],
  ] as const
  for (const [lang, punctuation] of expected) {
    const value = await headline.locator(`:scope > [lang="${lang}"]`).evaluate(
      (element) => getComputedStyle(element).fontFamily,
    )
    expect(value, lang).toContain(punctuation)
    expect(value, lang).toMatch(/serif$/)
    expect(value, lang).not.toContain('Sans')
  }
})
