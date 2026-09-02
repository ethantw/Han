import { test, expect } from '@playwright/test'

test('workbench source switch leaves off Kai to the browser cursive generic', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'this suite records the Safari/WebKit path')
  await page.goto('/demo/ruby-zhuyin-config.html')

  const copy = page.locator('.copy').first()
  await page.locator('#font').selectOption('cursive')
  await expect(copy).toHaveCSS('font-family', /^"?LXGW WenKai TC"?, cursive$/)

  await page.locator('#font-source').selectOption('system-ja')
  await expect(copy).toHaveCSS('font-family', /^"?Klee One"?, Klee, cursive$/)

  await page.locator('#font-source').selectOption('off')
  await expect(copy).toHaveCSS('font-family', 'cursive')
})

test('workbench loads and calibrates an uploaded font in WebKit', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'this suite records the Safari/WebKit path')
  await page.goto('/demo/ruby-zhuyin-config.html')
  await page.locator('[data-font-file]').setInputFiles('tests/e2e/fixtures/fonts/zhuyin-ink-low.woff2')
  await expect(page.locator('[data-font-status]')).toContainText('已在本機套用')

  const ruby = page.locator('[data-measure-ruby]')
  const readAnnotation = () => ruby.evaluate((element) => {
    const rt = element.querySelector('rt')!
    const rtRange = document.createRange()
    rtRange.selectNodeContents(rt.firstChild!)
    const baseRange = document.createRange()
    baseRange.selectNode(element.firstChild!)
    return {
      top: rtRange.getBoundingClientRect().top - baseRange.getBoundingClientRect().top,
      em: Number.parseFloat(getComputedStyle(rt).fontSize),
    }
  })
  const before = await readAnnotation()
  await page.locator('[data-calibrate-font-main]').click()
  await expect(page.locator('#zhuyin-baseline')).toHaveValue('-0.5')
  await expect(page.locator('[data-css-result]')).toContainText('--han-ruby-zhuyin-baseline-shift: -.5em;')
  const after = await readAnnotation()
  expect((after.top - before.top) / before.em).toBeCloseTo(.5, 2)
})

test('workbench measures Safari generic CJK fallback in the connected document', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'Safari resolves a detached canvas generic differently')
  await page.goto('/demo/ruby-zhuyin-config.html')
  await page.locator('#font-source').selectOption('off')
  await page.locator('#font').selectOption('serif')

  const expected = await page.locator('[data-measure-ruby]').evaluate((ruby) => {
    const rt = ruby.querySelector('rt')!
    const style = getComputedStyle(ruby)
    const canvas = document.createElement('canvas')
    canvas.lang = ruby.closest('[lang]')?.getAttribute('lang') ?? ''
    Object.assign(canvas.style, {
      position: 'fixed',
      visibility: 'hidden',
      pointerEvents: 'none',
      width: '0',
      height: '0',
    })
    document.body.append(canvas)
    const context = canvas.getContext('2d')!
    context.font = `${style.fontStyle} ${style.fontWeight} 1000px ${style.fontFamily}`
    const measuredInkDescent = context.measureText('永').actualBoundingBoxDescent / 1000
    canvas.remove()
    return {
      measuredInkDescent,
      rtRatio: Number.parseFloat(getComputedStyle(rt).fontSize)
        / Number.parseFloat(style.fontSize),
    }
  })

  await page.locator('[data-calibrate-font-main]').click()
  await expect(page.locator('[data-calibration-status]').last()).toContainText('已套用')

  const result = await page.locator('.size-sample[data-size="current"] .diagnostic-copy')
    .evaluate((copy) => ({
      shift: Number((document.querySelector('#zhuyin-baseline') as HTMLInputElement).value),
      fontSize: Number.parseFloat(getComputedStyle(copy).fontSize),
      inkOffset: Number.parseFloat(getComputedStyle(copy, '::after').boxShadow.match(
        /rgba?\([^)]*\)\s+[-\d.]+px\s+([-\d.]+)px/,
      )?.[1] ?? 'NaN'),
    }))

  expect(result.shift).toBeCloseTo((.075 - expected.measuredInkDescent) / expected.rtRatio, 5)
  expect(result.inkOffset / result.fontSize).toBeCloseTo(expected.measuredInkDescent, 3)
})

test('workbench baseline and ink-seat guides follow the real base baseline', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'this suite records the Safari/WebKit path')
  await page.goto('/demo/ruby-zhuyin-config.html')
  await page.evaluate(async () => {
    await document.fonts.ready
    window.dispatchEvent(new Event('resize'))
  })
  await expect.poll(() => page.locator('.diagnostic-copy').first().evaluate((copy) =>
    (copy as HTMLElement).style.getPropertyValue('--demo-base-baseline-offset'),
  )).not.toBe('')

  const rows = await page.locator('.diagnostic-copy').evaluateAll((copies) => copies.map((copy) => {
    const ruby = copy.querySelector('ruby')!
    const probe = document.createElement('i')
    Object.assign(
      probe.style,
      {
        display: 'inline-block',
        width: '0',
        height: '0',
        verticalAlign: 'baseline',
      },
    )
    copy.prepend(probe)
    const expected = probe.getBoundingClientRect().top - copy.getBoundingClientRect().top
    probe.remove()
    const guide = getComputedStyle(copy, '::after')
    return {
      fontSize: Number.parseFloat(getComputedStyle(ruby).fontSize),
      expected,
      actual: Number.parseFloat((copy as HTMLElement).style.getPropertyValue(
        '--demo-base-baseline-offset',
      )),
      inkOffset: Number.parseFloat(guide.boxShadow.match(
        /rgba?\([^)]*\)\s+[-\d.]+px\s+([-\d.]+)px/,
      )?.[1] ?? 'NaN'),
    }
  }))

  expect(rows.map(row => row.fontSize)).toEqual([12, 16, 60])
  for (const row of rows) {
    expect(row.actual).toBeCloseTo(row.expected, 1)
    expect(row.inkOffset / row.fontSize).toBeCloseTo(.075, 2)
  }
})

test('workbench baseline guide preserves native bidirectional calibration', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'native inter-character path is WebKit-only')
  await page.goto('/demo/ruby-zhuyin-config.html')
  await expect(page.locator('[name="rt-baseline"]')).toBeChecked()

  const ruby = page.locator('[data-measure-ruby]')
  const relativeTextTop = () => ruby.evaluate((element) => {
    const rt = element.querySelector('rt')!
    const rtRange = document.createRange()
    rtRange.selectNodeContents(rt.firstChild!)
    const baseRange = document.createRange()
    baseRange.selectNode(element.firstChild!)
    return {
      top: rtRange.getBoundingClientRect().top - baseRange.getBoundingClientRect().top,
      em: Number.parseFloat(getComputedStyle(rt).fontSize),
    }
  })

  await page.locator('#zhuyin-baseline').fill('0')
  const zero = await relativeTextTop()
  await page.locator('#zhuyin-baseline').fill('0.25')
  const positive = await relativeTextTop()
  await page.locator('#zhuyin-baseline').fill('-0.25')
  const negative = await relativeTextTop()

  expect((positive.top - zero.top) / zero.em).toBeCloseTo(-.25, 2)
  expect((negative.top - zero.top) / zero.em).toBeCloseTo(.25, 2)
})
