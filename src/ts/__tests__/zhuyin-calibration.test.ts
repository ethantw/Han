import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'

import {
  calibrateZhuyinRubyWithEnvironment,
  clearZhuyinRubyCalibration,
  clearZhuyinRubyCalibrationCache,
  formatZhuyinRubyShift,
  type ZhuyinCalibrationEnvironment,
  type ZhuyinFontDescriptor,
} from '../semantics/zhuyin-calibration.ts'

beforeEach(() => clearZhuyinRubyCalibrationCache())

test('converts a base-em optical delta into the rt-em public variable', () => {
  assert.equal(formatZhuyinRubyShift(-.09, .3), '-.3em')
  assert.equal(formatZhuyinRubyShift(.075, .3), '.25em')
  assert.equal(formatZhuyinRubyShift(0, .3), '0em')
  assert.throws(() => formatZhuyinRubyShift(.1, 0), /positive/)
})

const setup = () => {
  const window = new Window()
  window.document.body.innerHTML = `
    <section id="scope">
      <ruby class="zhuyin" data-font="low" data-size="16">永<rt>ㄩㄥˇ</rt></ruby>
      <ruby class="zhuyin" data-font="low" data-size="60">學<rt>ㄒㄩㄝˊ</rt></ruby>
      <ruby class="zhuyin" data-font="seat" data-size="16">知<rt>ㄓ</rt></ruby>
      <ruby class="zhuyin" data-font="low" data-mode="over">行<rt>ㄒㄧㄥˊ</rt></ruby>
      <ruby class="zhuyin" data-font="low" data-writing="vertical-rl">直<rt>ㄓˊ</rt></ruby>
      <ruby data-font="low">外<rt>ㄨㄞˋ</rt></ruby>
    </section>
  `
  return {
    document: window.document,
    scope: window.document.querySelector('#scope') as unknown as Element,
  }
}

const descriptorFor = (element: Element): ZhuyinFontDescriptor => {
  const ruby = element.tagName.toLowerCase() === 'rt' ? element.parentElement! : element
  const family = ruby.getAttribute('data-font') === 'seat' ? 'Seat Fixture' : 'Low Fixture'
  const size = Number(ruby.getAttribute('data-size') ?? 16)
  return {
    family,
    style: ruby.getAttribute('data-style') ?? 'normal',
    weight: ruby.getAttribute('data-weight') ?? '400',
    stretch: ruby.getAttribute('data-stretch') ?? '100%',
    variationSettings: ruby.getAttribute('data-variation') ?? 'normal',
    opticalSizing: ruby.getAttribute('data-optical') ?? 'none',
    featureSettings: ruby.getAttribute('data-features') ?? 'normal',
    language: ruby.getAttribute('data-lang') ?? 'zh-Hant',
    sizePx: element.tagName.toLowerCase() === 'rt' ? size * .3 : size,
  }
}

const fakeEnvironment = () => {
  const measured: string[] = []
  const loaded: string[] = []
  let readyCalls = 0
  const environment: ZhuyinCalibrationEnvironment = {
    ready: async () => { readyCalls++ },
    load: async (font, sample) => { loaded.push(`${font.family}:${sample}`) },
    describe: descriptorFor,
    getWritingMode: (ruby) => ruby.getAttribute('data-writing') ?? 'horizontal-tb',
    getRubyPosition: (ruby) => ruby.getAttribute('data-mode') ?? 'inter-character',
    measureInkDescent: (font, sample) => {
      measured.push(`${font.family}:${sample}`)
      return font.family === 'Low Fixture' ? .165 : .075
    },
  }
  return { environment, loaded, measured, readyCalls: () => readyCalls }
}

test('waits for fonts, scopes candidates, groups equal font conditions, and applies direct shifts', async () => {
  const { scope } = setup()
  const fake = fakeEnvironment()

  const result = await calibrateZhuyinRubyWithEnvironment(scope, {}, fake.environment)

  assert.equal(fake.readyCalls(), 1)
  assert.deepEqual(fake.loaded, ['Low Fixture:永', 'Seat Fixture:永'])
  assert.deepEqual(fake.measured, ['Low Fixture:永', 'Seat Fixture:永'])
  assert.equal(result.calibrated, 3)
  assert.equal(result.skipped, 2)
  assert.equal(result.measuredGroups, 2)

  const calibrated = [...scope.querySelectorAll('ruby')].slice(0, 3) as HTMLElement[]
  assert.equal(calibrated[0]!.style.getPropertyValue('--han-ruby-zhuyin-baseline-shift'), '-.3em')
  assert.equal(calibrated[1]!.style.getPropertyValue('--han-ruby-zhuyin-baseline-shift'), '-.3em')
  assert.equal(calibrated[2]!.style.getPropertyValue('--han-ruby-zhuyin-baseline-shift'), '0em')

  for (const ruby of [...scope.querySelectorAll('ruby')].slice(3)) {
    assert.equal((ruby as HTMLElement).style.getPropertyValue('--han-ruby-zhuyin-baseline-shift'), '')
  }
})

test('reuses normalized measurements across calls and base sizes until cache is cleared', async () => {
  const first = setup()
  const secondScope = first.document.createElement('section')
  secondScope.innerHTML = (first.scope as HTMLElement).innerHTML
  first.document.body.append(secondScope)
  const fake = fakeEnvironment()

  await calibrateZhuyinRubyWithEnvironment(first.scope, {}, fake.environment)
  await calibrateZhuyinRubyWithEnvironment(
    secondScope as unknown as Element,
    {},
    fake.environment,
  )
  assert.equal(fake.measured.length, 2)

  clearZhuyinRubyCalibrationCache()
  await calibrateZhuyinRubyWithEnvironment(
    secondScope as unknown as Element,
    {},
    fake.environment,
  )
  assert.equal(fake.measured.length, 4)
})

test('does not reuse a family-name cache entry across documents', async () => {
  const first = setup()
  const second = setup()
  const fake = fakeEnvironment()

  await calibrateZhuyinRubyWithEnvironment(first.scope, {}, fake.environment)
  await calibrateZhuyinRubyWithEnvironment(second.scope, {}, fake.environment)

  assert.equal(fake.measured.length, 4)
})

test('clear restores the pre-calibration inline value and priority', async () => {
  const { scope } = setup()
  const ruby = scope.querySelector('ruby') as HTMLElement
  ruby.style.setProperty('--han-ruby-zhuyin-baseline-shift', '.1em', 'important')

  await calibrateZhuyinRubyWithEnvironment(scope, {}, fakeEnvironment().environment)
  assert.equal(ruby.style.getPropertyValue('--han-ruby-zhuyin-baseline-shift'), '-.3em')

  clearZhuyinRubyCalibration(scope)
  assert.equal(ruby.style.getPropertyValue('--han-ruby-zhuyin-baseline-shift'), '.1em')
  assert.equal(ruby.style.getPropertyPriority('--han-ruby-zhuyin-baseline-shift'), 'important')
})

test('refresh bypasses the measurement cache without changing grouping', async () => {
  const { scope } = setup()
  const fake = fakeEnvironment()

  await calibrateZhuyinRubyWithEnvironment(scope, {}, fake.environment)
  await calibrateZhuyinRubyWithEnvironment(scope, { refresh: true }, fake.environment)

  assert.equal(fake.measured.length, 4)
})

test('a different target or rt ratio reuses raw descent but recomputes the public value', async () => {
  const { scope } = setup()
  const fake = fakeEnvironment()

  await calibrateZhuyinRubyWithEnvironment(scope, {}, fake.environment)
  const second = await calibrateZhuyinRubyWithEnvironment(
    scope,
    { targetInkDescent: .165 },
    fake.environment,
  )

  assert.equal(fake.measured.length, 2)
  const lowItems = second.items.filter(item => item.ruby.dataset.font === 'low')
  assert.equal(lowItems.length, 2)
  for (const item of lowItems) {
    assert.equal(item.cssValue, '0em')
    assert.equal(item.cssDeclaration, '')
  }
})

test('fontSizeSensitive separates base sizes while static measurements remain shared', async () => {
  const { scope } = setup()
  const low = [...scope.querySelectorAll('ruby[data-font="low"][data-size]')]
  low.forEach(ruby => ruby.setAttribute('data-optical', 'auto'))
  const fake = fakeEnvironment()

  await calibrateZhuyinRubyWithEnvironment(
    scope,
    { fontSizeSensitive: true },
    fake.environment,
  )

  assert.deepEqual(fake.measured, [
    'Low Fixture:永',
    'Low Fixture:永',
    'Seat Fixture:永',
  ])
})

test('scope may itself be a ruby', async () => {
  const { scope } = setup()
  const ruby = scope.querySelector('ruby')!
  const result = await calibrateZhuyinRubyWithEnvironment(
    ruby,
    {},
    fakeEnvironment().environment,
  )

  assert.equal(result.calibrated, 1)
  assert.equal((ruby as HTMLElement).style.getPropertyValue(
    '--han-ruby-zhuyin-baseline-shift',
  ), '-.3em')
  assert.equal(clearZhuyinRubyCalibration(ruby), 1)
})

test('font-shaping conditions and sample text separate measurement groups', async () => {
  const { document, scope } = setup()
  const first = scope.querySelector('ruby')!
  for (const [attribute, value] of [
    ['data-weight', '500'],
    ['data-style', 'italic'],
    ['data-stretch', '75%'],
    ['data-variation', '"wght" 650'],
    ['data-features', '"locl" 0'],
    ['data-lang', 'ja'],
  ] as const) {
    const clone = first.cloneNode(true) as Element
    clone.setAttribute(attribute, value)
    scope.append(clone)
  }
  const fake = fakeEnvironment()

  const result = await calibrateZhuyinRubyWithEnvironment(
    scope,
    { selector: 'ruby[data-font="low"]' },
    fake.environment,
  )
  assert.equal(result.measuredGroups, 7)

  const otherScope = document.createElement('section')
  otherScope.innerHTML = (first as HTMLElement).outerHTML
  document.body.append(otherScope)
  const second = await calibrateZhuyinRubyWithEnvironment(
    otherScope as unknown as Element,
    { sample: '學' },
    fake.environment,
  )
  assert.equal(second.measuredGroups, 1)
  assert.equal(fake.measured.at(-1), 'Low Fixture:學')
})

test('rejects an empty representative sample before measuring', async () => {
  const { scope } = setup()
  const fake = fakeEnvironment()

  await assert.rejects(
    calibrateZhuyinRubyWithEnvironment(scope, { sample: '' }, fake.environment),
    /sample/,
  )
  assert.equal(fake.measured.length, 0)
})

test('measurement failure is atomic and writes no partial inline shifts', async () => {
  const { scope } = setup()
  const fake = fakeEnvironment()
  fake.environment.measureInkDescent = (font) => {
    if (font.family === 'Seat Fixture') throw new Error('fixture failure')
    return .165
  }

  await assert.rejects(
    calibrateZhuyinRubyWithEnvironment(scope, {}, fake.environment),
    /fixture failure/,
  )
  for (const ruby of scope.querySelectorAll('ruby')) {
    assert.equal((ruby as HTMLElement).style.getPropertyValue(
      '--han-ruby-zhuyin-baseline-shift',
    ), '')
  }
})
