import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/ruby-zhuyin-calibration.html')
  await expect(page.locator('body[data-ready="true"]')).toBeVisible()
})

test('fixed webfonts expose the intended outline descents', async ({ page }) => {
  const descents = await page.evaluate(() => {
    const context = document.createElement('canvas').getContext('2d')!
    const measure = (family: string) => {
      context.font = `1000px "${family}"`
      return context.measureText('永').actualBoundingBoxDescent / 1000
    }
    return {
      reference: measure('Han Test Zhuyin Ink Reference'),
      low: measure('Han Test Zhuyin Ink Low'),
    }
  })

  expect(descents.reference).toBeCloseTo(.075, 3)
  expect(descents.low).toBeCloseTo(.225, 3)
  expect(descents.low - descents.reference).toBeCloseTo(.15, 3)
})

test('calibrates each font group once and reuses base-em measurements across sizes', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const api = (window as any).zhuyinCalibration
    api.clearZhuyinRubyCalibrationCache()
    return api.calibrateZhuyinRuby(document.querySelector('#scope'))
  })

  expect(result.calibrated).toBe(4)
  expect(result.skipped).toBe(2)
  expect(result.measuredGroups).toBe(2)
  expect(result.groups).toHaveLength(2)

  const values = await page.locator('#scope ruby.zhuyin').evaluateAll((rubies: HTMLElement[]) =>
    rubies.map(ruby => ({
      id: ruby.id,
      size: Number.parseFloat(getComputedStyle(ruby).fontSize),
      value: ruby.style.getPropertyValue('--han-ruby-zhuyin-baseline-shift'),
    })),
  )
  expect(values.slice(0, 4)).toEqual([
    { id: 'reference', size: 16, value: '0em' },
    { id: '', size: 12, value: '-.5em' },
    { id: '', size: 16, value: '-.5em' },
    { id: '', size: 60, value: '-.5em' },
  ])
  expect(values.slice(4)).toEqual([
    { id: 'over', size: 16, value: '' },
    { id: 'vertical', size: 16, value: '' },
  ])
  await expect(page.locator('#plain')).not.toHaveAttribute('style', /baseline-shift/)
  await expect(page.locator('#outside')).not.toHaveAttribute('style', /baseline-shift/)
})

test('applied fallback geometry follows each font outline seat and clear restores state', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'native inter-character displacement is covered separately')

  await page.evaluate(async () => {
    const api = (window as any).zhuyinCalibration
    await api.calibrateZhuyinRuby(document.querySelector('#scope'), { refresh: true })
  })

  const rows = await page.locator('#scope .row:has(.probe):has(ruby.low)')
    .evaluateAll((elements: HTMLElement[]) => elements.map((row) => {
      const ruby = row.querySelector('ruby') as HTMLElement
      const rt = ruby.querySelector('rt') as HTMLElement
      const probe = row.querySelector('.probe') as HTMLElement
      const em = Number.parseFloat(getComputedStyle(ruby).fontSize)
      return {
        em,
        seat: (rt.getBoundingClientRect().bottom - probe.getBoundingClientRect().top) / em,
      }
    }))

  expect(rows.map(row => row.em)).toEqual([12, 16, 60])
  for (const row of rows) expect(row.seat).toBeCloseTo(.225, 2)

  const restored = await page.evaluate(() => {
    const api = (window as any).zhuyinCalibration
    return api.clearZhuyinRubyCalibration(document.querySelector('#scope'))
  })
  expect(restored).toBe(4)
  for (const ruby of await page.locator('#scope ruby').all()) {
    expect(await ruby.evaluate((element: HTMLElement) =>
      element.style.getPropertyValue('--han-ruby-zhuyin-baseline-shift'))).toBe('')
  }
})

test('native inter-character maps both shift signs without changing ruby reservation', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'native inter-character path is WebKit-only')

  const geometry = await page.locator('#reference').evaluate((ruby: HTMLElement) => {
    const rt = ruby.querySelector('rt') as HTMLElement
    const text = rt.firstChild!
    const range = document.createRange()
    range.selectNodeContents(text)
    const rtEm = Number.parseFloat(getComputedStyle(rt).fontSize)
    const read = () => ({
      textTop: range.getBoundingClientRect().top,
      ruby: ruby.getBoundingClientRect().toJSON(),
      computedPosition: getComputedStyle(ruby).rubyPosition,
      rtDisplay: getComputedStyle(rt).display,
      rtWritingMode: getComputedStyle(rt).writingMode,
    })

    ruby.style.setProperty('--han-ruby-zhuyin-baseline-shift', '0em')
    const zero = read()
    ruby.style.setProperty('--han-ruby-zhuyin-baseline-shift', '.25em')
    const positive = read()
    ruby.style.setProperty('--han-ruby-zhuyin-baseline-shift', '-.25em')
    const negative = read()
    return { supported: CSS.supports('ruby-position', 'inter-character'), rtEm, zero, positive, negative }
  })

  expect(geometry.supported).toBe(true)
  expect(geometry.zero.computedPosition).toBe('inter-character')
  expect(geometry.zero.rtDisplay).toBe('ruby-text')
  expect(geometry.zero.rtWritingMode).toMatch(/^vertical-/)
  expect((geometry.positive.textTop - geometry.zero.textTop) / geometry.rtEm).toBeCloseTo(-.25, 2)
  expect((geometry.negative.textTop - geometry.zero.textTop) / geometry.rtEm).toBeCloseTo(.25, 2)
  expect(geometry.positive.ruby).toEqual(geometry.zero.ruby)
  expect(geometry.negative.ruby).toEqual(geometry.zero.ruby)
})

test('native shift remains proportional across base size, rt scale, and annotation length', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'native inter-character path is WebKit-only')

  const samples = await page.evaluate(() => {
    const host = document.createElement('section')
    host.lang = 'zh-Hant'
    host.style.setProperty('--han-zhuyin-ruby-position', 'inter-character')
    document.body.append(host)
    const results: Array<{ delta: number; shift: number }> = []

    for (const baseSize of [12, 16, 60]) {
      for (const rtScale of [.2, .3, .6]) {
        for (const [annotation, shift] of [['ㄓ', .25], ['ㄧㄢ', -.25]] as const) {
          const ruby = document.createElement('ruby')
          ruby.className = 'zhuyin'
          ruby.style.fontSize = `${baseSize}px`
          ruby.style.setProperty('--han-ruby-zhuyin-font-size', `${rtScale}em`)
          ruby.append('永')
          const rt = document.createElement('rt')
          rt.textContent = annotation
          ruby.append(rt)
          host.append(ruby, document.createTextNode(' '))

          const range = document.createRange()
          range.selectNodeContents(rt.firstChild!)
          ruby.style.setProperty('--han-ruby-zhuyin-baseline-shift', '0em')
          const zero = range.getBoundingClientRect().top
          ruby.style.setProperty('--han-ruby-zhuyin-baseline-shift', `${shift}em`)
          const moved = range.getBoundingClientRect().top
          results.push({
            delta: (moved - zero) / Number.parseFloat(getComputedStyle(rt).fontSize),
            shift,
          })
        }
      }
    }
    host.remove()
    return results
  })

  expect(samples).toHaveLength(18)
  for (const sample of samples) expect(sample.delta).toBeCloseTo(-sample.shift, 2)
})

test('native spacers do not disturb strict punctuation line breaking', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'native inter-character path is WebKit-only')

  const failures = await page.evaluate(() => {
    const host = document.createElement('div')
    host.lang = 'zh-Hant'
    Object.assign(host.style, {
      fontFamily: 'serif',
      fontSize: '40px',
      lineHeight: '1.5',
      lineBreak: 'strict',
      position: 'fixed',
      visibility: 'hidden',
      wordBreak: 'normal',
    })
    host.style.setProperty('--han-zhuyin-ruby-position', 'inter-character')
    document.body.append(host)

    const failures: Array<{ shift: number; width: number }> = []
    for (const shift of [-.5, 0, .5]) {
      host.style.setProperty('--han-ruby-zhuyin-baseline-shift', `${shift}em`)
      for (let width = 50; width <= 400; width += 2) {
        host.style.width = `${width}px`
        host.innerHTML = '甲乙<span data-open>「</span><ruby class="zhuyin">知<rt>ㄓ</rt></ruby><span data-close>，</span>丙丁'
        const ruby = host.querySelector('ruby')!
        const baseRange = document.createRange()
        baseRange.selectNode(ruby.firstChild!)
        const line = (element: Element) => Math.round(element.getBoundingClientRect().top)
        const baseLine = Math.round(baseRange.getBoundingClientRect().top)
        if (
          line(host.querySelector('[data-open]')!) !== baseLine
          || line(host.querySelector('[data-close]')!) !== baseLine
        ) failures.push({ shift, width })
      }
    }
    host.remove()
    return failures
  })

  expect(failures).toEqual([])
})

test('native shift stands down for horizontal over and vertical ruby', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'native inter-character path is WebKit-only')

  const deltas = await page.locator('#over, #vertical').evaluateAll((rubies: HTMLElement[]) =>
    rubies.map((ruby) => {
      const rt = ruby.querySelector('rt')!
      const range = document.createRange()
      range.selectNodeContents(rt.firstChild!)
      ruby.style.setProperty('--han-ruby-zhuyin-baseline-shift', '0em')
      const zero = range.getBoundingClientRect().toJSON()
      ruby.style.setProperty('--han-ruby-zhuyin-baseline-shift', '-.5em')
      const shifted = range.getBoundingClientRect().toJSON()
      return { id: ruby.id, x: shifted.x - zero.x, y: shifted.y - zero.y }
    }),
  )

  expect(deltas).toEqual([
    { id: 'over', x: 0, y: 0 },
    { id: 'vertical', x: 0, y: 0 },
  ])
})
