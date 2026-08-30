import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/e2e/fixtures/ruby.html')
  await expect(page.locator('body[data-ready="true"]')).toBeVisible()
})

test('renders rt above its ruby base', async ({ page }) => {
  const positions = await page.locator('#target ruby').evaluate((ruby: HTMLElement) => {
    const base = ruby.firstElementChild as HTMLElement // not reliable across UAs; use rb-fallback
    const rt  = ruby.querySelector('rt') as HTMLElement
    const rubyBox = ruby.getBoundingClientRect()
    const rtBox = rt.getBoundingClientRect()
    return { rubyTop: rubyBox.top, rtTop: rtBox.top, rtHeight: rtBox.height }
  })
  // rt should sit at or above the top of the ruby element.
  expect(positions.rtTop).toBeLessThanOrEqual(positions.rubyTop + 1)
  expect(positions.rtHeight).toBeGreaterThan(0)
})

test('matches the ruby visual baseline', async ({ page }) => {
  await expect(page.locator('#target')).toHaveScreenshot('ruby.png', {
    maxDiffPixelRatio: 0.01,
  })
})

test('inter-character zhuyin keeps its default track and optical seat for one to three symbols', async ({ page }) => {
  await page.evaluate(() => document.fonts.ready)
  const boxes = await page.locator('#zhuyin-target ruby').evaluateAll((rubies: HTMLElement[]) => {
    const baseline = (document.querySelector('#zhuyin-baseline-probe') as HTMLElement)
      .getBoundingClientRect().top
    return rubies.map((ruby) => {
      const rt = ruby.querySelector('rt') as HTMLElement
      const baseBox = ruby.getBoundingClientRect()
      const rtBox = rt.getBoundingClientRect()
      return {
        symbols: ruby.dataset.symbols,
        baseEm: Number.parseFloat(getComputedStyle(ruby).fontSize),
        rtFontSize: Number.parseFloat(getComputedStyle(rt).fontSize),
        rtInlineSize: rtBox.height,
        sideGapEm: ((rtBox.left - baseBox.left) / Number.parseFloat(getComputedStyle(ruby).fontSize)) - 1,
        topFromBaselineEm: (rtBox.top - baseline)
          / Number.parseFloat(getComputedStyle(ruby).fontSize),
        bottomFromBaselineEm: (rtBox.bottom - baseline)
          / Number.parseFloat(getComputedStyle(ruby).fontSize),
      }
    })
  })

  expect(boxes.map(({ symbols }) => symbols)).toEqual(['1', '2', '3'])
  for (const box of boxes) {
    expect(box.rtFontSize / box.baseEm).toBeCloseTo(.3, 4)
    expect(box.rtInlineSize / box.baseEm).toBeCloseTo(.9, 3)
    expect(box.sideGapEm).toBeCloseTo(.05, 2)
    expect(box.topFromBaselineEm).toBeCloseTo(-.825, 3)
    expect(box.bottomFromBaselineEm).toBeCloseTo(.075, 3)
  }
})

test('ideographic ink seat is independent of the base font metrics', async ({ page }) => {
  const deltas = await page.evaluate(async () => {
    await document.fonts.ready

    const host = document.createElement('section')
    host.lang = 'zh-Hant'
    host.style.setProperty('--han-zhuyin-ruby-position', 'inter-character')
    host.style.fontSize = '40px'
    host.style.lineHeight = '2'
    host.innerHTML = [
      'serif',
      'sans-serif',
      'system-ui',
      'monospace',
    ].map((family) => `
      <div style="font-family:${family}">
        <i style="display:inline-block;inline-size:0;block-size:0;vertical-align:baseline"></i><ruby class="zhuyin">研<rt>ㄧㄢˊ</rt></ruby>
      </div>
    `).join('')
    document.body.append(host)

    const result = [...host.querySelectorAll('div')].map((line) => {
      const probe = line.querySelector('i') as HTMLElement
      const rt = line.querySelector('rt') as HTMLElement
      return (rt.getBoundingClientRect().bottom - probe.getBoundingClientRect().top)
        / Number.parseFloat(getComputedStyle(line).fontSize)
    })
    host.remove()
    return result
  })

  expect(deltas).toHaveLength(4)
  for (const delta of deltas) expect(delta).toBeCloseTo(.075, 3)
})

test('Han composite stacks use Han Metrics before DTJ or fallback glyph fonts', async ({ page }) => {
  const geometry = await page.evaluate(async () => {
    await document.fonts.ready
    const host = document.createElement('section')
    host.lang = 'zh-Hant'
    host.style.cssText = [
      'font-size:60px',
      'line-height:1',
      '--han-zhuyin-ruby-position:inter-character',
    ].join(';')
    const variants = {
      songti: "--han-font-punctuation-serif:HanNone;--han-font-cjk-serif:'Songti TC'",
      dtjSongti: "--han-font-punctuation-serif:'Diantenjeom Serif MOE';--han-font-cjk-serif:'Songti TC'",
      shanggu: "--han-font-punctuation-serif:'Diantenjeom Serif MOE';--han-font-cjk-serif:'Shanggu Serif'",
      pingfang: "--han-font-punctuation-serif:HanNone;--han-font-cjk-serif:'PingFang TC'",
    }
    host.innerHTML = Object.entries(variants).map(([name, style]) => `
      <div data-font="${name}" style="font-family:var(--han-serif);${style}">
        <span>知</span><ruby class="zhuyin">鈽<rt>ㄅㄨˋ</rt></ruby>
        <i style="display:inline-block;inline-size:0;block-size:0;vertical-align:baseline"></i>
      </div>
    `).join('')
    document.body.append(host)
    const result = [...host.children].map((line) => {
      const copy = line.querySelector('span') as HTMLElement
      const ruby = line.querySelector('ruby') as HTMLElement
      const rt = line.querySelector('rt') as HTMLElement
      const probe = line.querySelector('i') as HTMLElement
      const baseline = probe.getBoundingClientRect().top
      return {
        family: getComputedStyle(line).fontFamily,
        copyHeight: copy.getBoundingClientRect().height,
        rubyHeight: ruby.getBoundingClientRect().height,
        rtBottom: (rt.getBoundingClientRect().bottom - baseline) / 60,
      }
    })
    host.remove()
    return result
  })

  expect(geometry).toHaveLength(4)
  const [reference] = geometry
  for (const line of geometry) {
    expect(line.family).toMatch(/^"Han Metrics"/)
    // Metric overrides land on device pixels; exact used height may be 60 or
    // 61px at a 60px font size, but MUST be identical across fallback stacks.
    expect(line.copyHeight).toBe(reference.copyHeight)
    expect(line.rubyHeight).toBe(reference.rubyHeight)
    expect(line.rtBottom).toBeCloseTo(.075, 3)
  }
})

test('Han Metrics can be disabled with the public metrics mode', async ({ page }) => {
  const result = await page.evaluate(() => {
    const host = document.createElement('section')
    host.lang = 'zh-Hant'
    host.innerHTML = `
      <span data-mode="default" style="font-family:var(--han-serif)">知</span>
      <section style="--han-use-metrics:off">
        <span data-mode="off" style="font-family:var(--han-serif)">知</span>
      </section>
    `
    document.body.append(host)
    const family = (mode: string) => getComputedStyle(
      host.querySelector(`[data-mode="${mode}"]`) as HTMLElement,
    ).fontFamily
    const result = {
      default: family('default'),
      off: family('off'),
      modes: getComputedStyle(host).getPropertyValue('--han-use-metrics').trim(),
    }
    host.remove()
    return result
  })

  expect(result.modes).toBe('on')
  expect(result.default).toMatch(/^"Han Metrics"/)
  expect(result.off).toMatch(/^HanNone/)
})

test('Han Metrics supplies only the strut and never paints Latin or digits', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const host = document.createElement('div')
    host.lang = 'zh-Hant'
    host.style.cssText = 'position:fixed;visibility:hidden;font:60px/1 var(--han-serif)'
    document.body.append(host)

    const composite = getComputedStyle(host).fontFamily
    const withoutMetrics = composite.replace(/^"Han Metrics",\s*/, '')
    const makeSample = (family: string) => {
      const span = document.createElement('span')
      span.style.cssText = `display:inline-block;font-family:${family}`
      span.textContent = '30ABCxyz'
      host.append(span)
      return span
    }
    const withMetrics = makeSample(composite)
    const without = makeSample(withoutMetrics)
    await document.fonts.ready
    const widths = [withMetrics, without].map(($el) => $el.getBoundingClientRect().width)
    host.remove()
    return { composite, widths }
  })

  expect(result.composite).toMatch(/^"Han Metrics"/)
  expect(result.widths[0]).toBeCloseTo(result.widths[1], 4)
})

test('ideographic ink seat stays in base-em when the rt font-size changes', async ({ page }) => {
  const target = page.locator('#zhuyin-target')
  const positions: number[] = []

  for (const size of ['.2em', '.6em']) {
    await target.evaluate((element: HTMLElement, value) => {
      element.style.setProperty('--han-ruby-zhuyin-font-size', value)
    }, size)
    positions.push(await target.locator('ruby').first().evaluate((ruby: HTMLElement) => {
      const rt = ruby.querySelector('rt') as HTMLElement
      const probe = document.querySelector('#zhuyin-baseline-probe') as HTMLElement
      return (rt.getBoundingClientRect().bottom - probe.getBoundingClientRect().top)
        / Number.parseFloat(getComputedStyle(ruby).fontSize)
    }))
  }

  expect(positions).toEqual([
    expect.closeTo(.075, 3),
    expect.closeTo(.075, 3),
  ])
})

test('empty baseline marker preserves opening and closing punctuation line breaking', async ({ page }) => {
  const result = await page.evaluate(() => {
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

    const failures: number[] = []
    for (let width = 50; width <= 400; width += 2) {
      host.style.width = `${width}px`
      host.innerHTML = '甲乙<span data-open>「</span><ruby class="zhuyin">知<rt>ㄓ</rt></ruby><span data-close>，</span>丙丁'

      const ruby = host.querySelector('ruby') as HTMLElement
      const opening = host.querySelector('[data-open]') as HTMLElement
      const closing = host.querySelector('[data-close]') as HTMLElement
      const line = (element: HTMLElement) => Math.round(element.getBoundingClientRect().top)
      if (line(opening) !== line(ruby) || line(closing) !== line(ruby)) failures.push(width)
    }

    const ruby = host.querySelector('ruby') as HTMLElement
    const display = getComputedStyle(ruby).display
    host.remove()
    return { display, failures }
  })

  expect(result.display).toBe('ruby')
  expect(result.failures).toEqual([])
})

test('public zhuyin variables expose defaults and tune fallback geometry', async ({ page }) => {
  const target = page.locator('#zhuyin-target')
  const defaults = await page.locator('html').evaluate((root) => {
    const style = getComputedStyle(root)
    return Object.fromEntries([
      'font-size',
      'baseline-shift',
      'over-gap',
      'letter-spacing',
    ].map((name) => [name, style.getPropertyValue(`--han-ruby-zhuyin-${name}`).trim()]))
  })

  expect(defaults).toEqual({
    'font-size': '.3em',
    'baseline-shift': '0em',
    'over-gap': '.25em',
    'letter-spacing': '-.05em',
  })

  await target.evaluate((element: HTMLElement) => {
    element.style.setProperty('--han-ruby-zhuyin-font-size', '.4em')
    element.style.setProperty('--han-ruby-zhuyin-baseline-shift', '.25em')
    element.style.setProperty('--han-ruby-zhuyin-letter-spacing', '-.05em')
  })

  const geometry = await target.locator('ruby').last().evaluate((ruby: HTMLElement) => {
    const rt = ruby.querySelector('rt') as HTMLElement
    const baseBox = ruby.getBoundingClientRect()
    const rtBox = rt.getBoundingClientRect()
    const baseline = (document.querySelector('#zhuyin-baseline-probe') as HTMLElement)
      .getBoundingClientRect().top
    const baseEm = Number.parseFloat(getComputedStyle(ruby).fontSize)
    return {
      sizeRatio: Number.parseFloat(getComputedStyle(rt).fontSize) / baseEm,
      trackRatio: rtBox.height / baseEm,
      sideGap: (rtBox.left - (baseBox.left + baseEm)) / baseEm,
      bottomFromBaseline: (rtBox.bottom - baseline) / baseEm,
      rubySpacing: Number.parseFloat(getComputedStyle(ruby).letterSpacing) / baseEm,
      rtSpacing: Number.parseFloat(getComputedStyle(rt).letterSpacing)
        / Number.parseFloat(getComputedStyle(rt).fontSize),
      lineHeight: Number.parseFloat(getComputedStyle(rt).lineHeight)
        / Number.parseFloat(getComputedStyle(rt).fontSize),
    }
  })

  expect(geometry.sizeRatio).toBeCloseTo(.4, 4)
  expect(geometry.trackRatio).toBeCloseTo(1.2, 3)
  expect(geometry.sideGap).toBeCloseTo(.0667, 2)
  expect(geometry.bottomFromBaseline).toBeCloseTo(-.025, 3)
  expect(geometry.rubySpacing).toBeCloseTo(2 / 3, 3)
  expect(geometry.rtSpacing).toBeCloseTo(-.05, 3)
  expect(geometry.lineHeight).toBeCloseTo(1, 3)
})

test('shared zhuyin rt variables apply to over ruby in horizontal and vertical writing', async ({ page }) => {
  const targets = page.locator('#zhuyin-over-horizontal, #zhuyin-over-vertical')
  await targets.evaluateAll((elements: HTMLElement[]) => {
    for (const element of elements) {
      element.style.setProperty('--han-ruby-zhuyin-font-size', '.4em')
      element.style.setProperty('--han-ruby-zhuyin-letter-spacing', '.125em')
    }
  })

  const styles = await targets.locator('rt').evaluateAll((annotations: HTMLElement[]) =>
    annotations.map((rt) => {
      const style = getComputedStyle(rt)
      const fontSize = Number.parseFloat(style.fontSize)
      return {
        fontSize,
        lineHeight: Number.parseFloat(style.lineHeight) / fontSize,
        letterSpacing: Number.parseFloat(style.letterSpacing) / fontSize,
        marginBlockEnd: Number.parseFloat(style.marginBlockEnd) / fontSize,
        rubyAlign: style.rubyAlign,
      }
    }),
  )

  expect(styles).toHaveLength(2)
  for (const style of styles) {
    expect(style.fontSize / 32).toBeCloseTo(.4, 4)
    expect(style.lineHeight).toBeCloseTo(1, 3)
    expect(style.letterSpacing).toBeCloseTo(.125, 3)
    expect(style.marginBlockEnd).toBeCloseTo(.25, 3)
    expect(style.rubyAlign).toBe('center')
  }
})

test('zhuyin rt applies the configured block-end margin in every ruby mode', async ({ page }) => {
  const margins = await page.locator([
    '#zhuyin-target rt',
    '#zhuyin-over-horizontal rt',
    '#zhuyin-over-vertical rt',
  ].join(', ')).evaluateAll((annotations: HTMLElement[]) => annotations.map((rt) => {
    const style = getComputedStyle(rt)
    return Number.parseFloat(style.marginBlockEnd) / Number.parseFloat(style.fontSize)
  }))

  expect(margins).toHaveLength(5)
  for (const margin of margins) expect(margin).toBeCloseTo(.25, 3)
})
