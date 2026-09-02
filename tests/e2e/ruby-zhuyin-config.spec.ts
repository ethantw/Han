import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/demo/ruby-zhuyin-config.html')
  await page.evaluate(() => localStorage.removeItem('han:taisol-ruby:controls:v3'))
  await page.evaluate(() => localStorage.removeItem('han:taisol-ruby:controls:v2'))
  await page.evaluate(() => localStorage.removeItem('han:ruby-zhuyin-config:html:v1'))
  await page.reload()
})

test('ships with calibrated defaults and no redundant CSS output', async ({ page }) => {
  await expect(page.locator('.DemoHeroBrand .Brand .Glyph')).toHaveCount(1)
  await expect(page.locator('.DemoHeroBrandTitle')).toHaveText('注音字體樣張')
  await expect(page.locator('#font-source')).toHaveValue('ziano')
  await expect(page.locator('#font')).toHaveValue('serif')
  await expect(page.locator('#ruby-position')).toHaveValue('inter-character')
  await expect(page.locator('#punctuation-hant')).toHaveValue('MOE')
  await expect(page.locator('#writing')).toHaveValue('horizontal')
  await expect(page.locator('#ruby-visibility')).toBeChecked()
  await expect(page.locator('[data-preview-controls] select')).toHaveCount(5)
  expect(await page.locator('[data-preview-controls] select').evaluateAll((selects) =>
    selects.map(select => select.getAttribute('name')),
  )).toEqual(['font-source', 'font', 'ruby-position', 'punctuation-hant', 'writing'])
  await expect(page.locator('[data-metric-group="base"] input[type="range"]')).toHaveCount(2)
  await expect(page.locator('[data-metric-group="annotation"] input[type="range"]')).toHaveCount(4)
  await expect(page.locator('[data-calibration]').locator('xpath=..').locator('h2')).toHaveText('注文定位校正')
  await expect(page.locator('#type-size')).toHaveValue('16')
  await expect(page.locator('#type-weight')).toHaveValue('400')
  await expect(page.locator('#zhuyin-size')).toHaveValue('0.3')
  await expect(page.locator('#zhuyin-baseline')).toHaveValue('0')
  await expect(page.locator('#over-gap')).toHaveValue('0.25')
  await expect(page.locator('#rt-letter-spacing')).toHaveValue('-0.05')
  await expect(page.locator('[data-css-result]')).toHaveText('')
  await expect(page.locator('[data-css-panel]')).toBeHidden()
  await expect(page.locator('[data-css-empty]')).toBeVisible()
})

test('positions baseline guides from the real alphabetic baseline', async ({ page }) => {
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

test('migrates v2 settings but resets its incompatible top-based baseline value', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.removeItem('han:taisol-ruby:controls:v3')
    localStorage.setItem('han:taisol-ruby:controls:v2', JSON.stringify({
      font: 'sans',
      'type-size': '24',
      'zhuyin-size': '.4',
      'zhuyin-baseline': '-.6',
    }))
  })
  await page.reload()

  await expect(page.locator('#font')).toHaveValue('sans')
  await expect(page.locator('#type-size')).toHaveValue('24')
  await expect(page.locator('#zhuyin-size')).toHaveValue('0.4')
  await expect(page.locator('#zhuyin-baseline')).toHaveValue('0')

  const migrated = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('han:taisol-ruby:controls:v3') ?? '{}'),
  )
  expect(migrated['zhuyin-baseline']).toBe('0')
})

test('switches Ming, Sans, and Kai between Ziano, system Japanese, and generic stacks', async ({ page }) => {
  const copy = page.locator('.copy').first()

  await expect(copy).toHaveCSS('font-family', /Shanggu Serif/)

  await page.locator('#font-source').selectOption('system-ja')
  await expect(copy).toHaveCSS('font-family', /Hiragino Mincho ProN/)
  await expect(copy).not.toHaveCSS('font-family', /Shanggu/)

  await page.locator('#font').selectOption('sans')
  await expect(copy).toHaveCSS('font-family', /Hiragino Sans/)

  await page.locator('#font-source').selectOption('ziano')
  await expect(copy).toHaveCSS('font-family', /Shanggu Sans/)

  await page.locator('#font').selectOption('cursive')
  await expect(copy).toHaveCSS('font-family', /^"?LXGW WenKai TC"?, cursive$/)

  await page.locator('#font-source').selectOption('system-ja')
  await expect(copy).toHaveCSS('font-family', /^"?Klee One"?, Klee, cursive$/)

  await page.locator('#font-source').selectOption('off')
  await expect(copy).toHaveCSS('font-family', 'cursive')

  await page.reload()
  await expect(page.locator('#font-source')).toHaveValue('off')
  await expect(page.locator('#font')).toHaveValue('cursive')
  await expect(copy).toHaveCSS('font-family', 'cursive')
})

test('loads and switches the Diantenjeom punctuation faces', async ({ page }) => {
  const copy = page.locator('.copy').first()
  const dtj = page.locator('link[data-dtj]')

  await expect(dtj).toHaveAttribute('href', /@hanzi\.pro\/diantenjeom@[^/]+\/dist\/diantenjeom\.css$/)

  for (const convention of ['JIS', 'MOE', 'GB', 'KLR']) {
    await page.locator('#punctuation-hant').selectOption(convention)
    await expect(copy).toHaveCSS('font-family', new RegExp(`Diantenjeom Serif ${convention}`))
    await expect.poll(() => page.evaluate((family) =>
      [...document.fonts].some(face => face.family.replaceAll('"', '') === family),
    `Diantenjeom Serif ${convention}`)).toBe(true)
    await page.evaluate((family) => document.fonts.load(
      `16px "${family}"`,
      '，。！？「」',
    ), `Diantenjeom Serif ${convention}`)
    await expect.poll(() => page.evaluate((family) =>
      document.fonts.check(`16px "${family}"`, '，。！？「」'),
    `Diantenjeom Serif ${convention}`)).toBe(true)
  }

  await page.locator('#punctuation-hant').selectOption('off')
  await expect(copy).not.toHaveCSS('font-family', /Diantenjeom/)
})

test('migrates the former Shanggu source value to Ziano', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('han:taisol-ruby:controls:v3', JSON.stringify({
      'font-source': 'shanggu',
      font: 'cursive',
    }))
  })
  await page.reload()

  await expect(page.locator('#font-source')).toHaveValue('ziano')
  await expect(page.locator('#font')).toHaveValue('cursive')
  await expect(page.locator('.copy').first()).toHaveCSS('font-family', /^"?LXGW WenKai TC"?, cursive$/)
  await expect.poll(() => page.evaluate(() =>
    JSON.parse(localStorage.getItem('han:taisol-ruby:controls:v3') ?? '{}')['font-source'],
  )).toBe('ziano')
})

test('generates only ruby variables that differ from defaults', async ({ page }) => {
  await page.locator('#type-size').fill('24')
  await page.locator('#type-weight').fill('700')
  await expect(page.locator('[data-css-result]')).toHaveText('')

  await page.locator('#zhuyin-size').fill('0.31')
  await page.locator('#over-gap').fill('0.65')
  await page.locator('#rt-letter-spacing').fill('-0.0625')
  await expect(page.locator('[data-css-result]')).toHaveText([
    ':root {',
    '  --han-ruby-zhuyin-font-size: .31em;',
    '  --han-ruby-zhuyin-over-gap: .65em;',
    '  --han-ruby-zhuyin-letter-spacing: -.0625em;',
    '}',
  ].join('\n'))
  await expect(page.locator('[data-css-panel]')).toBeVisible()
  await expect(page.locator('[data-css-empty]')).toBeHidden()

  await page.locator('#zhuyin-size').fill('0.3')
  await page.locator('#over-gap').fill('0.25')
  await page.locator('#rt-letter-spacing').fill('-0.05')
  await expect(page.locator('[data-css-result]')).toHaveText('')
  await expect(page.locator('[data-css-panel]')).toBeHidden()
})

test('sanitizes, previews, persists, and resets editable ruby HTML', async ({ page }) => {
  const source = page.locator('[data-html-source]')
  const preview = page.locator('[data-html-preview]')
  const custom = '<p lang="zh-Hant"><ruby class="zhuyin" onclick="alert(1)">永<rt>ㄩㄥˇ</rt></ruby><script>window.bad = true</script></p>'

  await source.fill(custom)
  await expect.poll(() => preview.locator('ruby.zhuyin').count()).toBe(1)
  await expect(preview.locator('ruby.zhuyin')).toHaveText('永ㄩㄥˇ')
  await expect(preview.locator('script')).toHaveCount(0)
  await expect(preview.locator('ruby')).not.toHaveAttribute('onclick')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('han:ruby-zhuyin-config:html:v1'))).toBe(custom)

  await page.reload()
  await expect(source).toHaveValue(custom)
  await expect(preview.locator('ruby.zhuyin rt')).toHaveText('ㄩㄥˇ')

  await page.locator('[data-editor-reset]').click()
  await expect(source).not.toHaveValue(custom)
  await expect(page.locator('[data-editor-reset]')).toHaveText('復原內容')
  await page.locator('[data-editor-reset]').click()
  await expect(source).toHaveValue(custom)
})

test('uploads, replaces, and calibrates a local font without persisting its binary state', async ({ page }) => {
  const fontInput = page.locator('[data-font-file]')
  const firstCopy = page.locator('.copy').first()

  await expect(page.locator('[data-calibrate-font]')).toHaveCount(2)

  await fontInput.setInputFiles('tests/e2e/fixtures/fonts/zhuyin-ink-low.woff2')
  await expect(page.locator('[data-font-status]')).toContainText('已在本機套用 zhuyin-ink-low.woff2')
  await expect(firstCopy).toHaveCSS('font-family', /Han Ruby Upload/)
  await expect(page.locator('#zhuyin-baseline')).toHaveValue('0')

  await page.locator('[data-calibrate-font-main]').click()

  await expect(page.locator('#zhuyin-baseline')).toHaveValue('-0.5')
  await expect(page.locator('[data-calibration-status]').first()).toContainText('已套用 -.5em')
  await expect(page.locator('[data-calibration-status]').last()).toContainText('已套用 -.5em')
  await expect(page.locator('[data-css-result]')).toContainText(
    '--han-ruby-zhuyin-baseline-shift: -.5em;',
  )

  const inkSeat = await page.locator('.size-sample[data-size="current"] ruby').first().evaluate((ruby) => {
    const rootStyle = getComputedStyle(document.documentElement)
    const guideStyle = getComputedStyle(ruby.closest('.diagnostic-copy')!, '::after')
    return {
      resolvedShift: rootStyle.getPropertyValue('--demo-ideographic-ink-seat-shift').trim(),
      shadowOffsetY: Number.parseFloat(guideStyle.boxShadow.match(
        /rgba?\([^)]*\)\s+[-\d.]+px\s+([-\d.]+)px/,
      )?.[1] ?? 'NaN'),
    }
  })
  expect(inkSeat.resolvedShift).toBe('-0.15em')
  expect(inkSeat.shadowOffsetY).toBeCloseTo(3.6, 1)

  expect(await page.evaluate(() =>
    JSON.parse(localStorage.getItem('han:taisol-ruby:controls:v3') ?? '{}')['zhuyin-baseline'],
  )).toBe('0')

  await fontInput.setInputFiles('tests/e2e/fixtures/fonts/zhuyin-ink-reference.woff2')
  await expect(page.locator('[data-font-status]')).toContainText('已在本機套用 zhuyin-ink-reference.woff2')
  await expect(page.locator('#zhuyin-baseline')).toHaveValue('0')
  await page.locator('[data-calibrate-font-main]').click()
  await expect(page.locator('[data-calibration-status]').last()).toContainText('不需要生成校正變量')
  await expect(page.locator('[data-css-result]')).toHaveText('')

  await page.locator('[data-font-clear]').click()
  await expect(page.locator('[data-font-status]')).toContainText('已移除自訂字體')
  await expect(firstCopy).not.toHaveCSS('font-family', /Han Ruby Upload/)
})

test('rejects an invalid local font without replacing the active stack', async ({ page }) => {
  const before = await page.locator('.copy').first().evaluate(element => getComputedStyle(element).fontFamily)
  await page.locator('[data-font-file]').setInputFiles({
    name: 'not-a-font.woff2',
    mimeType: 'font/woff2',
    buffer: Buffer.from('definitely not a font'),
  })
  await expect(page.locator('[data-font-status]')).toContainText('字體簽名無法辨識')
  await expect(page.locator('[data-font-clear]')).toBeHidden()
  expect(await page.locator('.copy').first().evaluate(element => getComputedStyle(element).fontFamily)).toBe(before)
})

test('uses 280px and 240px side consoles before switching to a mobile dialog', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(page.locator('#controls')).toHaveCSS('width', '280px')

  await page.setViewportSize({ width: 900, height: 900 })
  await expect(page.locator('#controls')).toHaveCSS('width', '240px')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()

  const dialog = page.locator('#ruby-console')
  const opener = page.locator('[data-demo-console-open]')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeVisible()
  await opener.click()
  await expect(dialog).toBeVisible()
  await expect(opener).toHaveAttribute('aria-expanded', 'true')

  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    consolePosition: getComputedStyle(document.querySelector('#controls')!).position,
  }))
  expect(layout.scrollWidth).toBe(layout.clientWidth)
  expect(layout.consolePosition).toBe('static')

  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(opener).toBeFocused()

  const editor = await page.locator('.editor-pane').boundingBox()
  const preview = await page.locator('.preview-pane').boundingBox()
  expect(editor).not.toBeNull()
  expect(preview).not.toBeNull()
  expect(preview!.y).toBeGreaterThanOrEqual(editor!.y + editor!.height - 1)
})

test('keeps font upload below the HTML editor and shares one calibration result', async ({ page }) => {
  const editor = await page.locator('[data-html-source]').boundingBox()
  const fontLab = await page.locator('.font-lab').boundingBox()
  expect(editor).not.toBeNull()
  expect(fontLab).not.toBeNull()
  expect(fontLab!.y).toBeGreaterThanOrEqual(editor!.y + editor!.height - 1)

  await page.locator('[data-calibrate-font-console]').click()
  const messages = await page.locator('[data-calibration-status]').allTextContents()
  expect(messages).toHaveLength(2)
  expect(messages[0]).toBe(messages[1])
})
