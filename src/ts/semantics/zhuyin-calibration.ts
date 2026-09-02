const BASELINE_SHIFT_PROPERTY = '--han-ruby-zhuyin-baseline-shift'
const DEFAULT_SAMPLE = '永'
const DEFAULT_TARGET_INK_DESCENT = .075
const DEFAULT_SELECTOR = 'ruby:is(.zhuyin, .mps), ruby:has(> rt:is(.zhuyin, .mps))'

export interface ZhuyinCalibrationOptions {
  /** Restrict candidates inside `scope`; defaults to zhuyin/mps ruby. */
  selector?: string
  /** Representative base glyph measured for its visible lower edge. */
  sample?: string
  /** Desired visible descent below the alphabetic baseline, in base em. */
  targetInkDescent?: number
  /** Ignore normalized measurements already held by this module. */
  refresh?: boolean
  /**
   * Measure at each used base size and include it in the cache key. Enable
   * this for variable fonts whose optical-size axis changes the outline.
   * Static fonts default to one high-resolution, size-independent measure.
   */
  fontSizeSensitive?: boolean
}

export interface ZhuyinFontDescriptor {
  family: string
  style: string
  weight: string
  stretch: string
  variationSettings: string
  opticalSizing: string
  featureSettings: string
  language: string
  sizePx: number
}

export interface ZhuyinCalibrationEnvironment {
  ready(document: Document): Promise<void>
  load(font: ZhuyinFontDescriptor, sample: string, document: Document): Promise<void>
  describe(element: Element): ZhuyinFontDescriptor
  getWritingMode(ruby: Element): string
  getRubyPosition(ruby: Element): string
  /** Return actual glyph descent normalized to the base font's em. */
  measureInkDescent(
    font: ZhuyinFontDescriptor,
    sample: string,
    document: Document,
    fontSizeSensitive: boolean,
  ): number
}

export interface ZhuyinCalibrationGroupResult {
  key: string
  font: ZhuyinFontDescriptor
  count: number
  sample: string
  measuredInkDescent: number
  baseShift: number
  fromCache: boolean
}

export interface ZhuyinCalibrationItemResult {
  ruby: HTMLElement
  groupKey: string
  baselineShift: number
  cssValue: string
  /** Empty when the computed correction is zero. */
  cssDeclaration: string
}

export interface ZhuyinCalibrationResult {
  calibrated: number
  skipped: number
  measuredGroups: number
  groups: readonly ZhuyinCalibrationGroupResult[]
  items: readonly ZhuyinCalibrationItemResult[]
}

interface SavedInlineValue {
  value: string
  priority: string
}

interface Candidate {
  ruby: HTMLElement
  rt: HTMLElement
  font: ZhuyinFontDescriptor
  rtFont: ZhuyinFontDescriptor
  key: string
}

interface ResolvedGroup {
  key: string
  candidates: Candidate[]
  measuredInkDescent: number
  fromCache: boolean
}

let measurementCaches = new WeakMap<Document, Map<string, number>>()
const savedInlineValues = new WeakMap<HTMLElement, SavedInlineValue>()

const cacheFor = (document: Document): Map<string, number> => {
  const existing = measurementCaches.get(document)
  if (existing) return existing
  const cache = new Map<string, number>()
  measurementCaches.set(document, cache)
  return cache
}

const rounded = (value: number): number => {
  const result = Math.round(value * 1_000_000) / 1_000_000
  return Object.is(result, -0) ? 0 : result
}

const formatNumber = (value: number): string => {
  const result = rounded(value)
  if (result === 0) return '0'
  return String(result).replace(/^(-?)0\./, '$1.')
}

/** Convert a base-em optical correction into the rt-em public variable. */
export const formatZhuyinRubyShift = (baseShift: number, rtToBaseRatio: number): string => {
  if (!Number.isFinite(rtToBaseRatio) || rtToBaseRatio <= 0) {
    throw new RangeError('Zhuyin ruby font-size ratio must be a positive finite number.')
  }
  if (!Number.isFinite(baseShift)) {
    throw new RangeError('Zhuyin ruby baseline shift must be a finite number.')
  }
  return `${formatNumber(baseShift / rtToBaseRatio)}em`
}

const fontKey = (
  font: ZhuyinFontDescriptor,
  sample: string,
  fontSizeSensitive: boolean,
): string => JSON.stringify([
  font.family,
  font.style,
  font.weight,
  font.stretch,
  font.variationSettings,
  font.opticalSizing,
  font.featureSettings,
  font.language,
  sample,
  fontSizeSensitive ? rounded(font.sizePx) : null,
])

const isDirectRt = (element: Element): element is HTMLElement =>
  element.tagName.toLowerCase() === 'rt'

const directRt = (ruby: Element): HTMLElement | null =>
  [...ruby.children].find(isDirectRt) ?? null

const collectMatches = (scope: Element, selector: string): Element[] => {
  const matches = [...scope.querySelectorAll(selector)]
  if (scope.matches(selector)) matches.unshift(scope)
  return matches
}

const getCandidates = (
  scope: Element,
  options: ZhuyinCalibrationOptions,
  environment: ZhuyinCalibrationEnvironment,
): { candidates: Candidate[]; skipped: number } => {
  const selector = options.selector ?? DEFAULT_SELECTOR
  const sample = options.sample ?? DEFAULT_SAMPLE
  const fontSizeSensitive = options.fontSizeSensitive ?? false
  const candidates: Candidate[] = []
  let skipped = 0

  for (const element of collectMatches(scope, selector)) {
    if (element.tagName.toLowerCase() !== 'ruby') {
      skipped++
      continue
    }
    const ruby = element as HTMLElement
    const rt = directRt(ruby)
    if (
      !rt
      || environment.getWritingMode(ruby) !== 'horizontal-tb'
      || environment.getRubyPosition(ruby) !== 'inter-character'
    ) {
      skipped++
      continue
    }

    const font = environment.describe(ruby)
    const rtFont = environment.describe(rt)
    if (
      !Number.isFinite(font.sizePx)
      || font.sizePx <= 0
      || !Number.isFinite(rtFont.sizePx)
      || rtFont.sizePx <= 0
    ) {
      skipped++
      continue
    }
    candidates.push({
      ruby,
      rt,
      font,
      rtFont,
      key: fontKey(font, sample, fontSizeSensitive),
    })
  }
  return { candidates, skipped }
}

const restoreInlineValue = (ruby: HTMLElement, saved: SavedInlineValue): void => {
  if (saved.value) ruby.style.setProperty(BASELINE_SHIFT_PROPERTY, saved.value, saved.priority)
  else ruby.style.removeProperty(BASELINE_SHIFT_PROPERTY)
}

/** Internal dependency-injection seam used by deterministic Node tests. */
export const calibrateZhuyinRubyWithEnvironment = async (
  scope: Element,
  options: ZhuyinCalibrationOptions,
  environment: ZhuyinCalibrationEnvironment,
): Promise<ZhuyinCalibrationResult> => {
  const document = scope.ownerDocument
  if (!document) throw new TypeError('Zhuyin ruby calibration requires an element in a document.')

  const sample = options.sample ?? DEFAULT_SAMPLE
  if (!sample.trim()) throw new RangeError('Zhuyin calibration sample must not be empty.')
  const target = options.targetInkDescent ?? DEFAULT_TARGET_INK_DESCENT
  if (!Number.isFinite(target)) {
    throw new RangeError('targetInkDescent must be a finite base-em number.')
  }
  await environment.ready(document)

  const { candidates, skipped } = getCandidates(scope, options, environment)
  const byKey = new Map<string, Candidate[]>()
  for (const candidate of candidates) {
    const group = byKey.get(candidate.key) ?? []
    group.push(candidate)
    byKey.set(candidate.key, group)
  }

  const groups: ZhuyinCalibrationGroupResult[] = []
  const items: ZhuyinCalibrationItemResult[] = []
  const resolvedGroups: ResolvedGroup[] = []
  const pendingCacheEntries: Array<readonly [string, number]> = []
  const cache = cacheFor(document)
  let measuredGroups = 0

  for (const [key, group] of byKey) {
    const first = group[0]!
    const cached = options.refresh ? undefined : cache.get(key)
    if (cached === undefined) await environment.load(first.font, sample, document)
    const measuredInkDescent = cached ?? environment.measureInkDescent(
      first.font,
      sample,
      document,
      options.fontSizeSensitive ?? false,
    )
    if (!Number.isFinite(measuredInkDescent)) {
      throw new TypeError(`Could not measure a finite ink descent for ${first.font.family}.`)
    }
    const fromCache = cached !== undefined
    if (!fromCache) {
      pendingCacheEntries.push([key, measuredInkDescent])
      measuredGroups++
    }
    resolvedGroups.push({
      key,
      candidates: group,
      measuredInkDescent,
      fromCache,
    })
  }

  // Do not expose a partial calibration when one font group fails. Cache and
  // inline writes both commit only after every required measurement succeeds.
  for (const [key, descent] of pendingCacheEntries) cache.set(key, descent)

  for (const resolved of resolvedGroups) {
    const { key, candidates: group, measuredInkDescent, fromCache } = resolved
    const first = group[0]!
    const baseShift = target - measuredInkDescent
    groups.push({
      key,
      font: first.font,
      count: group.length,
      sample,
      measuredInkDescent,
      baseShift,
      fromCache,
    })

    for (const candidate of group) {
      const rtRatio = candidate.rtFont.sizePx / candidate.font.sizePx
      const cssValue = formatZhuyinRubyShift(baseShift, rtRatio)
      if (!savedInlineValues.has(candidate.ruby)) {
        savedInlineValues.set(candidate.ruby, {
          value: candidate.ruby.style.getPropertyValue(BASELINE_SHIFT_PROPERTY),
          priority: candidate.ruby.style.getPropertyPriority(BASELINE_SHIFT_PROPERTY),
        })
      }
      candidate.ruby.style.setProperty(BASELINE_SHIFT_PROPERTY, cssValue)
      items.push({
        ruby: candidate.ruby,
        groupKey: key,
        baselineShift: rounded(baseShift / rtRatio),
        cssValue,
        cssDeclaration: cssValue === '0em' ? '' : `${BASELINE_SHIFT_PROPERTY}: ${cssValue};`,
      })
    }
  }

  return {
    calibrated: candidates.length,
    skipped,
    measuredGroups,
    groups,
    items,
  }
}

const computedDescriptor = (element: Element): ZhuyinFontDescriptor => {
  const view = element.ownerDocument.defaultView
  if (!view) throw new TypeError('Zhuyin ruby calibration requires a browsing context.')
  const style = view.getComputedStyle(element)
  return {
    family: style.fontFamily,
    style: style.fontStyle,
    weight: style.fontWeight,
    stretch: style.fontStretch,
    variationSettings: style.fontVariationSettings,
    opticalSizing: style.fontOpticalSizing,
    featureSettings: style.fontFeatureSettings,
    language: element.closest('[lang]')?.getAttribute('lang') ?? '',
    sizePx: Number.parseFloat(style.fontSize),
  }
}

const canvasStretch = (stretch: string): CanvasFontStretch => {
  const percentage = Number.parseFloat(stretch)
  if (!Number.isFinite(percentage)) return 'normal'
  if (percentage <= 56.25) return 'ultra-condensed'
  if (percentage <= 68.75) return 'extra-condensed'
  if (percentage <= 81.25) return 'condensed'
  if (percentage <= 93.75) return 'semi-condensed'
  if (percentage < 106.25) return 'normal'
  if (percentage < 118.75) return 'semi-expanded'
  if (percentage < 137.5) return 'expanded'
  if (percentage < 175) return 'extra-expanded'
  return 'ultra-expanded'
}

const fontShorthand = (font: ZhuyinFontDescriptor, size: number): string =>
  `${font.style} ${font.weight} ${size}px ${font.family}`

const browserEnvironment: ZhuyinCalibrationEnvironment = {
  ready: async (document) => {
    await document.fonts?.ready
  },
  load: async (font, sample, document) => {
    await document.fonts?.load(fontShorthand(font, font.sizePx), sample)
  },
  describe: computedDescriptor,
  getWritingMode: (ruby) =>
    ruby.ownerDocument.defaultView?.getComputedStyle(ruby).writingMode ?? '',
  getRubyPosition: (ruby) => {
    const style = ruby.ownerDocument.defaultView!.getComputedStyle(ruby)
    return style.getPropertyValue('--han-zhuyin-ruby-position').trim()
      || style.rubyPosition
  },
  measureInkDescent: (font, sample, document, fontSizeSensitive) => {
    const canvas = document.createElement('canvas')
    canvas.lang = font.language
    canvas.hidden = true

    /* Safari resolves a detached canvas's generic `serif` independently of
     * the document language. On a zh-Hant page that can measure Hiragino
     * while the ruby itself renders in Songti TC. Connecting the canvas makes
     * WebKit use the same locale-sensitive fallback as the DOM; it is removed
     * synchronously, before it can participate in paint. */
    const measurementHost = document.body ?? document.documentElement
    measurementHost.append(canvas)
    try {
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Zhuyin ruby calibration requires a Canvas 2D context.')
      const size = fontSizeSensitive ? font.sizePx : 1000
      context.font = fontShorthand(font, size)
      context.fontStretch = canvasStretch(font.stretch)
      context.textBaseline = 'alphabetic'
      return context.measureText(sample).actualBoundingBoxDescent / size
    } finally {
      canvas.remove()
    }
  },
}

/**
 * Optically align horizontal inter-character zhuyin for an unverified base
 * font. The default han.css font stacks do not require this opt-in pass.
 */
export const calibrateZhuyinRuby = (
  scope: Element,
  options: ZhuyinCalibrationOptions = {},
): Promise<ZhuyinCalibrationResult> =>
  calibrateZhuyinRubyWithEnvironment(scope, options, browserEnvironment)

/** Restore inline shifts previously replaced by this module within `scope`. */
export const clearZhuyinRubyCalibration = (scope: Element): number => {
  let restored = 0
  for (const element of collectMatches(scope, 'ruby')) {
    const ruby = element as HTMLElement
    const saved = savedInlineValues.get(ruby)
    if (!saved) continue
    restoreInlineValue(ruby, saved)
    savedInlineValues.delete(ruby)
    restored++
  }
  return restored
}

/** Drop normalized canvas measurements; already-applied inline shifts remain. */
export const clearZhuyinRubyCalibrationCache = (): void => {
  measurementCaches = new WeakMap<Document, Map<string, number>>()
}
