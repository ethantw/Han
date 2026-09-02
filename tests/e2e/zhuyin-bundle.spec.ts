import { test, expect } from '@playwright/test'

test('basic keeps the Zhuyin role placeholder while the optional bundle ships the face', async ({ request }) => {
  const basic = await request.get('/han/han.basic.css')
  expect(basic.ok()).toBe(true)
  const basicCss = await basic.text()
  expect(basicCss).toContain('--han-font-zhuyin-serif: "Han Zhuyin Serif"')
  expect(basicCss).not.toContain('@font-face')
  expect(basicCss).not.toContain('zhuyin.serif.woff2')

  const optional = await request.get('/han/han.zhuyin.css')
  expect(optional.ok()).toBe(true)
  const optionalCss = await optional.text()
  expect(optionalCss).toContain('font-family: "Han Zhuyin Serif"')
  expect(optionalCss).toContain('url("./zhuyin.serif.woff2")')
  expect(optionalCss).toContain('sourceMappingURL=han.zhuyin.css.map')

  const sourceMap = await request.get('/han/han.zhuyin.css.map')
  expect(sourceMap.ok()).toBe(true)

  const font = await request.get('/han/zhuyin.serif.woff2')
  expect(font.ok()).toBe(true)
  expect(font.headers()['content-type']).toMatch(/font\/woff2|application\/octet-stream/)
  expect((await font.body()).byteLength).toBeGreaterThan(0)
})
