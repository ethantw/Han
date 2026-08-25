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
