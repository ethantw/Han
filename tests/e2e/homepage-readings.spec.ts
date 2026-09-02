import { test, expect } from '@playwright/test'

declare global {
  interface Window {
    __rubyReadingsAudio: string[]
    __rubyReadingsSpeech: Array<{ lang: string, text: string }>
  }
}

const languages = [
  ['minnan', 'zh-nan-Hant-TW', 'nan-Bopo-TW', 'Diantenjeom Serif MOE'],
  ['mandarin', 'zh-Hant-TW', 'zh-Bopo-TW', 'Diantenjeom Serif MOE'],
  ['japanese', 'ja', 'ja-Kana', 'Diantenjeom Serif JIS'],
  ['korean', 'ko', 'ko-Hani', 'Diantenjeom Serif KLR'],
] as const

test('the complete default station is readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')

  await expect(page.locator('#story-title > h2[lang="zh-nan-Hant-TW"]')).toBeVisible()
  await expect(page.locator('.Dispatch[lang="zh-nan-Hant-TW"]')).toBeVisible()
  await expect(page.locator('.Dispatch[lang="zh-nan-Hant-TW"] ruby > rt').first()).toBeVisible()
  await expect(page.locator('button[name="speak-element"]')).toHaveCount(4)
  expect(await page.locator('button[name="speak-element"]').evaluateAll(
    buttons => buttons.map(button => (button as HTMLButtonElement).value),
  )).toEqual(['Y', 'Nb', 'Mo', 'B'])
  await expect(page.locator('button[name="speak-element"] ruby.zhuyin > rt[lang="nan-Bopo-TW"]')).toHaveCount(4)
  await expect(page.locator('.ElementPrimer dl > div')).toHaveCount(4)
  await expect(page.locator('.ElementPrimer')).toContainText('磁噴嘴，不是一只金屬漏斗')
  await expect(page.locator('[data-language], [data-zhuyin], [data-speech], [data-reading]')).toHaveCount(0)

  await context.close()
})

test('the reading station is native homepage content in every edition', async ({ page, request }) => {
  const editions = [
    ['/', '一字，多層注文'],
    ['/hans/', '一字，多层注文'],
    ['/en/', 'One character, layered readings'],
    ['/ja/', '一字に、幾層ものルビ'],
    ['/ko/', '한 글자에 여러 겹의 <ruby>讀音'],
  ] as const

  for (const [url, heading] of editions) {
    const response = await request.get(url)
    expect(response.ok(), url).toBe(true)
    const html = await response.text()
    expect(html).toContain('id="station-readings"')
    expect(html).toContain(heading)
  }

  await page.goto('/')
  const station = page.locator('#station-readings')
  await expect(station).toHaveCount(1)
  expect(await station.evaluate((element) => ({
    before: element.previousElementSibling?.id,
    after: element.nextElementSibling?.id,
  }))).toEqual({ before: 'station-prose', after: 'station-craft' })

  expect((await request.get('/demo/ruby-readings.html')).status()).toBe(404)
})

for (const viewport of [
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`the ${viewport.name} page clips at the document while the station rail scrolls`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await page.locator('#station-readings').scrollIntoViewIfNeeded()

    const geometry = await page.locator('#station-readings > .Rail').evaluate((rail) => ({
      railClient: rail.clientWidth,
      railScroll: rail.scrollWidth,
      documentClient: document.documentElement.clientWidth,
      documentScroll: document.documentElement.scrollWidth,
    }))
    expect(geometry.railScroll).toBeGreaterThan(geometry.railClient)
    expect(geometry.documentScroll).toBeLessThanOrEqual(geometry.documentClient + 1)
  })
}

test('each localized heading resolves the alternative stack on its own lang boundary', async ({ page }) => {
  await page.goto('/')

  for (const [mode, lang, , family] of languages) {
    await page.locator(`[name="reading-mode"][value="${mode}"]`).check({ force: true })
    const heading = page.locator(`#story-title > h2[lang="${lang}"]`)

    await expect(heading).toBeVisible()
    await expect(heading).toHaveCSS('font-family', new RegExp(family))
  }

  const minnan = page.locator('#story-title > h2[lang="zh-nan-Hant-TW"]')
  expect(await minnan.evaluate(element => element.matches(':lang(zh)'))).toBe(true)
})

test('localized headline annotations retain their HTML-authored language and face', async ({ page }) => {
  await page.goto('/')

  for (const [mode, contentLang, annotationLang] of languages) {
    await page.locator(`[name="reading-mode"][value="${mode}"]`).check({ force: true })
    const annotations = page.locator(
      `#story-title > h2[lang="${contentLang}"] rt[lang="${annotationLang}"]`,
    )

    await expect(annotations.first()).toBeVisible()
    if (mode === 'minnan' || mode === 'mandarin') {
      await expect(annotations.first()).toHaveCSS('font-family', /Han Zhuyin Serif/)
    }
  }
})

test('layout switches leave authored ruby markup untouched', async ({ page }) => {
  await page.goto('/')
  const dispatch = page.locator('.Dispatch[lang="zh-nan-Hant-TW"]')
  const authoredRuby = () => dispatch.locator('ruby').evaluateAll(
    rubies => rubies.map(ruby => ruby.outerHTML),
  )
  const before = await authoredRuby()

  await page.locator('[name="annotation-position"][value="over"]').check({ force: true })
  await page.locator('[name="writing-mode"][value="vertical"]').check({ force: true })

  expect(await authoredRuby()).toEqual(before)
})

test('the element table and primer follow the writing-mode switch', async ({ page }) => {
  await page.goto('/')
  const tile = page.locator('button[name="speak-element"] > ruby').first()
  const primer = page.locator('.ElementPrimer')

  await expect(tile).toHaveCSS('writing-mode', 'horizontal-tb')
  await expect(primer).toHaveCSS('writing-mode', 'horizontal-tb')

  await page.locator('[name="writing-mode"][value="vertical"]').check({ force: true })
  await expect(tile).toHaveCSS('writing-mode', 'vertical-rl')
  await expect(primer).toHaveCSS('writing-mode', 'vertical-rl')
})

test('the element speaker follows the end of its heading', async ({ page }) => {
  await page.goto('/')
  const heading = page.locator('#elements-title')
  const speaker = page.locator('figure[aria-labelledby="elements-title"] > header > button[name="speak"]')

  const horizontal = await Promise.all([heading.boundingBox(), speaker.boundingBox()])
  expect(horizontal[0]).not.toBeNull()
  expect(horizontal[1]).not.toBeNull()
  expect(horizontal[1]!.x - (horizontal[0]!.x + horizontal[0]!.width)).toBeLessThanOrEqual(20)

  await page.locator('[name="writing-mode"][value="vertical"]').check({ force: true })
  const vertical = await Promise.all([heading.boundingBox(), speaker.boundingBox()])
  expect(vertical[0]).not.toBeNull()
  expect(vertical[1]).not.toBeNull()
  expect(vertical[1]!.y - (vertical[0]!.y + vertical[0]!.height)).toBeLessThanOrEqual(20)
})

test('Minnan speakers select the recorded direction, group, and element tracks', async ({ page }) => {
  await page.addInitScript(() => {
    window.__rubyReadingsAudio = []
    class AudioMock extends EventTarget {
      src: string

      constructor(source: string) {
        super()
        this.src = source
      }

      play() {
        window.__rubyReadingsAudio.push(this.src)
        return Promise.resolve()
      }

      pause() {}
    }
    Object.defineProperty(window, 'Audio', { configurable: true, value: AudioMock })
  })
  await page.goto('/')

  await page.locator('button[name="speak"][value="story"]').click()
  await page.locator('[name="writing-mode"][value="vertical"]').check({ force: true })
  await page.locator('button[name="speak"][value="story"]').click()
  await page.locator('button[name="speak"][value="elements"]').click()
  const symbols = await page.locator('button[name="speak-element"]').evaluateAll((buttons) => {
    buttons.forEach((button) => (button as HTMLButtonElement).click())
    return buttons.map((button) => (button as HTMLButtonElement).value)
  })

  expect(await page.evaluate(() => window.__rubyReadingsAudio)).toEqual([
    '/audio/ruby-readings/dispatch-minnan.mp3',
    '/audio/ruby-readings/dispatch-minnan-left.mp3',
    '/audio/ruby-readings/elements-minnan/all.mp3',
    ...symbols.map(symbol => `/audio/ruby-readings/elements-minnan/${symbol}.mp3`),
  ])
})

test('browser speech is crawled from the active HTML ruby', async ({ page }) => {
  await page.addInitScript(() => {
    window.__rubyReadingsSpeech = []
    window.__rubyReadingsAudio = []

    class UtteranceMock extends EventTarget {
      lang = ''
      rate = 1
      text: string
      voice = null

      constructor(text: string) {
        super()
        this.text = text
      }
    }
    class AudioMock extends EventTarget {
      constructor(public src: string) {
        super()
      }

      play() {
        window.__rubyReadingsAudio.push(this.src)
        return Promise.resolve()
      }

      pause() {}
    }
    const speechSynthesisMock = {
      addEventListener() {},
      cancel() {},
      getVoices: () => [],
      speak(utterance: UtteranceMock) {
        window.__rubyReadingsSpeech.push({ lang: utterance.lang, text: utterance.text })
      },
    }

    Object.defineProperty(window, 'Audio', { configurable: true, value: AudioMock })
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: UtteranceMock })
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: speechSynthesisMock })
  })
  await page.goto('/')

  await page.locator('[name="reading-mode"][value="mandarin"]').check({ force: true })
  await page.locator('button[name="speak"][value="story"]').click()
  await page.locator('button[name="speak-element"][value="Y"]').click()

  await page.locator('[name="reading-mode"][value="japanese"]').check({ force: true })
  await page.locator('button[name="speak"][value="story"]').click()
  await page.locator('button[name="speak-element"][value="Y"] > ruby > rt[lang="ja"]').evaluate((rt) => {
    rt.textContent = 'HTMLからの読み'
  })
  await page.locator('button[name="speak-element"][value="Y"]').click()

  await page.locator('[name="reading-mode"][value="korean"]').check({ force: true })
  await page.locator('button[name="speak"][value="story"]').click()

  const spoken = await page.evaluate(() => window.__rubyReadingsSpeech)
  expect(spoken[0].lang).toBe('zh-TW')
  expect(spoken[0].text).toMatch(/^巴星採礦/)
  expect(spoken[0].text).toContain('江為')
  expect(spoken[0].text).toContain('十垓頓')
  expect(spoken[0].text).not.toMatch(/[將噸]/)
  expect(spoken[1]).toEqual({ lang: 'zh-TW', text: '釔' })

  expect(spoken[2].lang).toBe('ja-JP')
  expect(spoken[2].text).toContain('バーナード星')
  expect(spoken[2].text).toContain('イチロクハチシチ')
  expect(spoken[2].text).toContain('ダイジプ')
  expect(spoken[2].text).toContain('ジプガイ')
  expect(spoken[2].text).toContain('のとおり。これらの材料')
  expect(spoken[2].text).not.toMatch(/一六八七|第十|十垓/)
  expect(spoken[2].text).not.toContain('：')
  expect(spoken[3]).toEqual({ lang: 'ja-JP', text: 'HTMLからの読み' })

  expect(spoken[4].lang).toBe('ko-KR')
  expect(spoken[4].text).toContain('바너드성')
  expect(await page.evaluate(() => window.__rubyReadingsAudio)).toEqual([])
})

test('Minnan recording assets are served by the manual', async ({ request }) => {
  const manifestResponse = await request.get('/audio/ruby-readings/elements-minnan/manifest.json')
  expect(manifestResponse.ok()).toBe(true)
  const manifest = await manifestResponse.json() as { order: string[] }
  expect(manifest.order).toEqual(['Y', 'Nb', 'Mo', 'B'])
  const paths = [
    '/audio/ruby-readings/dispatch-minnan.mp3',
    '/audio/ruby-readings/dispatch-minnan-left.mp3',
    '/audio/ruby-readings/dispatch-minnan.wav',
    '/audio/ruby-readings/dispatch-minnan-left.wav',
    '/audio/ruby-readings/elements-minnan/all.mp3',
    ...manifest.order.map(symbol => `/audio/ruby-readings/elements-minnan/${symbol}.mp3`),
  ]

  for (const path of paths) {
    const response = await request.get(path)
    expect(response.ok(), path).toBe(true)
    expect(response.headers()['content-type'], path).toBe(path.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg')
    expect((await response.body()).byteLength, path).toBeGreaterThan(1_000)
  }

  expect((await request.get('/audio/ruby-readings/elements-minnan/He.mp3')).status()).toBe(404)
})

test('emphasized dual readings use nested ruby shapes authored in HTML', async ({ page }) => {
  await page.goto('/')

  for (const lang of ['zh-nan-Hant-TW', 'zh-Hant-TW']) {
    const emphasis = page.locator(`.Dispatch[lang="${lang}"] em.Identifier`).first()
    await expect(emphasis.locator(':scope > ruby.zhuyin')).toHaveCount(4)
    await expect(emphasis.locator('xpath=..')).toHaveJSProperty('tagName', 'RUBY')
    await expect(emphasis.locator('xpath=../rt')).toHaveCount(1)
  }

  const koreanEmphasis = page.locator('.Dispatch[lang="ko"] em.Identifier').first()
  const koreanInnerRuby = koreanEmphasis.locator(':scope > ruby')
  const koreanOuterRuby = koreanEmphasis.locator('xpath=..')
  await expect(koreanInnerRuby.locator(':scope > rt[lang="ko-Hani"]')).toHaveCount(1)
  await expect(koreanOuterRuby).toHaveJSProperty('tagName', 'RUBY')
  await expect(koreanOuterRuby.locator(':scope > rt[lang="ko-Latn"]')).toHaveCount(1)
  await expect(koreanInnerRuby).toHaveCSS('ruby-position', 'over')
  await expect(koreanOuterRuby).toHaveCSS('ruby-position', 'under')
})

test('the offscreen sky suspends continuous layout and style animation work', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  const station = page.locator('#station-readings')

  const state = () => station.evaluate((element) => {
    const sky = element.querySelector('.Sky') as SVGSVGElement
    const cssAnimations = element.getAnimations({ subtree: true })
    return {
      active: element.hasAttribute('data-sky-active'),
      smilPaused: sky.animationsPaused(),
      cssCount: cssAnimations.length,
      cssRunning: cssAnimations.every(animation => animation.playState === 'running'),
    }
  })

  await expect.poll(state).toMatchObject({
    active: false,
    smilPaused: true,
    cssCount: 0,
  })

  await station.scrollIntoViewIfNeeded()
  await expect.poll(state).toMatchObject({
    active: true,
    smilPaused: false,
    cssCount: 108,
    cssRunning: true,
  })

  await page.evaluate(() => scrollTo(0, 0))
  await expect.poll(state).toMatchObject({ active: false, smilPaused: true, cssCount: 0 })
  await page.waitForTimeout(1_000)

  const cdp = await context.newCDPSession(page)
  await cdp.send('Performance.enable')
  const metrics = async () => Object.fromEntries(
    (await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]),
  ) as Record<string, number>
  const before = await metrics()
  await page.waitForTimeout(1_000)
  const after = await metrics()

  // Before the visibility lifecycle the SVG motion alone forced about 120
  // layouts per second while thousands of pixels below the viewport. The CSS
  // half is covered above by asserting that no station animation exists while
  // inactive; RecalcStyleCount is page-global and includes other stations.
  expect(after.LayoutCount - before.LayoutCount).toBeLessThan(10)

  // Re-entering the station recreates the CSS animations, but must not retain
  // their animation objects, DOM nodes, documents, or listeners after exit.
  await cdp.send('HeapProfiler.collectGarbage')
  const memoryBefore = await cdp.send('Memory.getDOMCounters')
  await page.evaluate(async () => {
    const station = document.querySelector('#station-readings') as HTMLElement
    const wait = (duration: number) => new Promise(resolve => setTimeout(resolve, duration))
    for (let index = 0; index < 10; index++) {
      station.scrollIntoView()
      await wait(40)
      scrollTo(0, 0)
      await wait(40)
    }
  })
  await page.waitForTimeout(250)
  await cdp.send('HeapProfiler.collectGarbage')
  const memoryAfter = await cdp.send('Memory.getDOMCounters')
  expect(memoryAfter.documents).toBe(memoryBefore.documents)
  expect(memoryAfter.jsEventListeners).toBe(memoryBefore.jsEventListeners)
  expect(memoryAfter.nodes - memoryBefore.nodes).toBeLessThan(32)
  await expect.poll(state).toMatchObject({ active: false, smilPaused: true, cssCount: 0 })
})

test('writing-direction input does not synchronously force rail layout', async ({ page }) => {
  await page.goto('/')
  await page.locator('#station-readings').scrollIntoViewIfNeeded()

  const durations = await page.locator('#station-readings').evaluate((station) => {
    const values = ['vertical', 'horizontal']
    return Array.from({ length: 20 }, (_, index) => {
      const input = station.querySelector(
        `[name="writing-mode"][value="${values[index % values.length]}"]`,
      ) as HTMLInputElement
      const start = performance.now()
      input.checked = true
      input.dispatchEvent(new Event('change', { bubbles: true }))
      return performance.now() - start
    })
  })
  durations.sort((a, b) => a - b)
  expect(durations[Math.floor(durations.length * 0.95)]).toBeLessThan(10)
})
