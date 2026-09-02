import { test, expect } from '@playwright/test'

/**
 * Per-language font slots (`--han-font-cjk-*`).
 *
 * The heritage layer is a per-locale mode property, and `off` is the default
 * for hans / ja / ko. The slots are INHERITED custom properties, so "off"
 * only holds if the off state is written out: inside a zh-Hant document the
 * three off locales used to inherit the TC heritage stack from the ancestor
 * that the hant block matched, and rendered Japanese and Korean copy in a
 * Traditional Chinese heritage face — see src/css/fonts.css § `off` has to
 * be WRITTEN OUT.
 */
const slot = (id: string, name: string) =>
  `getComputedStyle(document.getElementById('${id}')).getPropertyValue('${name}').trim()`

test('foreign-language subtrees do not inherit the TC heritage stack', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/lang-slots.html')

  // 繁體：預設就是 webfont，傳承字族在最前
  for (const name of ['--han-font-cjk-sans', '--han-font-cjk-serif']) {
    expect(await page.evaluate(slot('hant', name))).toContain('Shanggu')
  }

  // 其餘三語：預設 off ＝ HanNone 哨兵，交給各自的系統字
  for (const id of ['hans', 'ja', 'ko']) {
    for (const name of ['--han-font-cjk-sans', '--han-font-cjk-serif']) {
      expect(await page.evaluate(slot(id, name)), `${id} ${name}`).toBe('HanNone')
    }
  }

  // 韓文沒有自己的行書層，也不該撿到中文的
  expect(await page.evaluate(slot('ko', '--han-font-cjk-cursive'))).toBe('HanNone')
})

test('font roles declared on a lang boundary rebuild with that boundary locale', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/lang-slots.html')

  const expected = [
    ['hant', 'Diantenjeom Sans MOE'],
    ['ja', 'Diantenjeom Sans JIS'],
    ['ko', 'Diantenjeom Sans KLR'],
    ['alternative-hant', 'Diantenjeom Serif MOE'],
    ['alternative-ja', 'Diantenjeom Serif JIS'],
    ['alternative-ko', 'Diantenjeom Serif KLR'],
    ['accent-ja', 'Diantenjeom Serif JIS'],
  ] as const

  for (const [id, family] of expected) {
    await expect(page.locator(`#${id}`)).toHaveCSS('font-family', new RegExp(family))
  }

  await expect(page.locator('#author-ja'))
    .toHaveCSS('font-family', /Boundary Author Test.*serif/)
  await expect(page.locator('body')).toHaveCSS('font-family', /Diantenjeom Sans MOE/)
  expect(await page.locator('body').evaluate(
    element => getComputedStyle(element).fontFamily.startsWith('HanNone'),
  )).toBe(false)
})

test('nested lang boundaries default locally unless the component reapplies its role', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/lang-slots.html')

  await expect(page.locator('#nested-unreapplied')).toHaveCSS(
    'font-family',
    /Diantenjeom Serif MOE/,
  )
  await expect(page.locator('#nested-unreapplied-ja')).toHaveCSS(
    'font-family',
    /Diantenjeom Sans JIS/,
  )

  await expect(page.locator('#nested-reapplied-ja')).toHaveCSS(
    'font-family',
    /Diantenjeom Serif JIS/,
  )
  await expect(page.locator('#nested-reapplied-ko')).toHaveCSS(
    'font-family',
    /Diantenjeom Serif KLR/,
  )
})

test('document serif recipe reapplies the role and resolves every locale boundary', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/lang-slots.html')
  await page.addStyleTag({ content: `
    :where(:root, body, [lang]):where(:lang(zh), :lang(ja), :lang(ko)) {
      font-family: var(--han-font-alternative);
    }
  ` })

  const expected = [
    ['hant', 'Diantenjeom Serif MOE'],
    ['hans', 'Diantenjeom Serif GB'],
    ['ja', 'Diantenjeom Serif JIS'],
    ['ko', 'Diantenjeom Serif KLR'],
  ] as const
  for (const [id, family] of expected) {
    await expect(page.locator(`#${id}`)).toHaveCSS('font-family', new RegExp(family))
  }
})

test('basic bundle keeps the boundary contract without locale webfont slots', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/lang-slots-basic.html')

  await expect(page.locator('#default-ja')).toHaveCSS('font-family', /system-ui.*sans-serif/)
  await expect(page.locator('#alternative-ja')).toHaveCSS('font-family', 'serif')
  await expect(page.locator('#author-ja'))
    .toHaveCSS('font-family', /Boundary Author Test.*serif/)
})

test('document serif recipe is portable to the basic bundle', async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/lang-slots-basic.html')
  await page.addStyleTag({ content: `
    :where(:root, body, [lang]):where(:lang(zh), :lang(ja), :lang(ko)) {
      font-family: var(--han-font-alternative);
    }
  ` })

  await expect(page.locator('body')).toHaveCSS('font-family', 'serif')
  await expect(page.locator('#default-ja')).toHaveCSS('font-family', 'serif')
})
