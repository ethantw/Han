import { cssVars } from '../home/codegen.js'

/** Custom properties whose stale values must be cleared on first application. */
export const ALL_CONFIG_VARS = [
  '--han-semantics', '--han-prose', '--han-punctuation-refinement',
  '--han-text-autospace',
  '--han-use-heritage-glyphs-for-hant', '--han-use-heritage-glyphs-for-hans',
  '--han-use-heritage-glyphs-for-ja', '--han-use-heritage-glyphs-for-ko',
  '--han-webfont-heritage-family',
  '--han-use-cursive', '--han-webfont-cursive-hant',
  '--han-punctuation-hant', '--han-punctuation-hans',
  '--han-punctuation-ja', '--han-punctuation-ko',
  '--han-font-zhuyin-serif',
  '--han-zhuyin-ruby-position',
  '--han-cite-title-marks', '--han-em-symbol', '--han-em-dot-position',
]

/** Properties mirrored by DOM fallbacks and cleared before a rerun. */
export const FALLBACK_SYNCED_VARS = [
  '--han-punctuation-refinement',
  '--han-text-autospace',
  '--han-text-decoration-inset',
]

/** Cascade mechanism used when each optional CSS module is disabled. */
export const MODULE_MECHANISM = {
  semantics: { '--han-semantics': 'off' },
  lines: {
    '--han-text-autospace': 'no-autospace',
    '--han-punctuation-refinement': 'none',
  },
  prose: {},
  fonts: 'link',
}

/** Immutably replaces a dot-delimited configuration path. */
export const setConfigPath = (object, path, value) => {
  const [key, ...rest] = path.split('.')
  return rest.length
    ? { ...object, [key]: setConfigPath(object[key], rest.join('.'), value) }
    : { ...object, [key]: value }
}

/** Reads a dot-delimited configuration path. */
export const getConfigPath = (object, path) =>
  path.split('.').reduce((value, key) => value?.[key], object)

/** Resolves configured variables plus explicit module-off values. */
export const effectiveVars = (config) => {
  const disabled = Object.entries(MODULE_MECHANISM)
    .filter(([name, mechanism]) => config[name] === false && mechanism !== 'link')
    .flatMap(([, mechanism]) => Object.entries(mechanism))
  return new Map([...cssVars(config), ...disabled])
}

/** Projects configuration onto the fields that can require fallback DOM work. */
export const fallbackPlan = (config) => ({
  core: JSON.stringify({
    fallbacks: config.fallbacks,
    jsMode: config.jsMode,
    fn: config.jsMode === 'manual' ? config.fn : undefined,
  }),
  fallbacks: config.fallbacks,
  lines: config.lines,
  hang: config.lines && config.hang,
  squeeze: config.lines && config.squeeze,
  autospace: config.lines ? config.autospace : 'off',
})

/** Chooses the cheapest fallback run that can realize a changed plan. */
export const fallbackRunKind = (next, applied) => {
  if (!applied || next.core !== applied.core) return 'full'
  if (!next.fallbacks || !next.lines) return null
  if (!applied.lines) return 'full'
  if (next.hang && !applied.hang) return 'full'
  if (next.squeeze && !applied.squeeze) return 'full'
  return next.autospace !== 'off' && next.autospace !== applied.autospace
    ? 'iss'
    : null
}

/** Reports whether two fallback plans require the same DOM capabilities. */
export const sameFallbackPlan = (a, b) =>
  a?.core === b?.core
  && a?.lines === b?.lines
  && a?.hang === b?.hang
  && a?.squeeze === b?.squeeze
  && a?.autospace === b?.autospace
