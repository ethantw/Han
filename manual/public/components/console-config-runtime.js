import { packages, selectedPasses, zianoUrl } from '../home/codegen.js'
import {
  ALL_CONFIG_VARS,
  FALLBACK_SYNCED_VARS,
  MODULE_MECHANISM,
  effectiveVars,
} from './console-config-state.js'

const loadedFonts = new Set()
const ensureFont = (id, source) => {
  const key = `${id}:${source}`
  if (loadedFonts.has(key)) return
  loadedFonts.add(key)
  document.head.insertAdjacentHTML(
    'beforeend',
    `<link rel="stylesheet" href="${zianoUrl(id, source)}">`,
  )
}

/** Clears fallback-resolved modes so inherited configuration can take over. */
export const clearFallbackModes = ($target) => {
  if (!$target || $target === document.documentElement) return
  FALLBACK_SYNCED_VARS.forEach((property) => $target.style.removeProperty(property))
}

/** Applies variables, font delivery and the base generic family. */
export const applyConfigTarget = (config, state) => {
  const $root = document.documentElement
  const $body = document.body
  const next = effectiveVars(config)
  const previous = state.vars

  if (!previous) {
    ALL_CONFIG_VARS.forEach((property) => $root.style.removeProperty(property))
  } else {
    [...previous.keys()]
      .filter((property) => !next.has(property))
      .forEach((property) => $root.style.removeProperty(property))
  }
  for (const [property, value] of next) {
    if (previous?.get(property) !== value) $root.style.setProperty(property, value)
  }
  state.vars = next

  packages(config).ziano.forEach((id) => ensureFont(id, config.webfontCdnSource))
  if (state.baseGeneric !== config.baseGeneric) {
    config.baseGeneric === 'serif'
      ? ($body.style.fontFamily = 'var(--han-font-alternative)')
      : $body.style.removeProperty('font-family')
    state.baseGeneric = config.baseGeneric
  }
}

/** Applies module and webfont availability to document-owned resources. */
export const applyConfigModules = (config) => {
  const { dataset } = document.documentElement
  for (const [name] of Object.entries(MODULE_MECHANISM)) {
    const on = config[name] !== false
    const key = `hanModule${name[0].toUpperCase()}${name.slice(1)}`
    if (on && key in dataset) delete dataset[key]
    else if (!on && dataset[key] !== 'off') dataset[key] = 'off'
  }
  document.querySelectorAll('link[data-han-module]').forEach(($link) => {
    if (MODULE_MECHANISM[$link.dataset.hanModule] !== 'link') return
    const disabled = !config[$link.dataset.hanModule]
    if ($link.disabled !== disabled) $link.disabled = disabled
  })
  document.querySelectorAll('link[data-han-webfont]').forEach(($link) => {
    const disabled = config.webfontDelivery === 'none'
    if ($link.disabled !== disabled) $link.disabled = disabled
  })
}

const moduleRef = { current: null }

/** Applies the complete fallback plan to a target subtree. */
export const applyFallbacks = async (config, $target, isCurrent = () => true) => {
  if (!$target || !isCurrent()) return
  clearFallbackModes($target)
  if (!config.fallbacks) {
    moduleRef.current?.uninstallFallbacks($target)
    return
  }
  const module = moduleRef.current ??= await import('/han/han.js')
  if (!isCurrent()) return
  module.uninstallFallbacks($target)
  if (config.jsMode !== 'manual') {
    module.installFallbacks($target)
    return
  }
  selectedPasses(config)
    .filter((pass) => pass.id !== 'uninstall')
    // Chunk manual passes because the library walker has a finite recursion depth.
    .forEach((pass) => module.runPassChunked($target, ($chunk) => module[pass.fn]($chunk)))
}

const applyISSFallback = async (config, $target, isCurrent = () => true) => {
  if (!$target || !isCurrent()) return
  const module = moduleRef.current ??= await import('/han/han.js')
  if (!isCurrent()) return
  $target.querySelectorAll('h-iss').forEach(($iss) => {
    $iss.dataset.mode === 'replace' ? $iss.replaceWith(' ') : $iss.remove()
  })
  const enabled = config.fallbacks
    && config.lines
    && (config.jsMode !== 'manual' || config.fn.iss)
  if (enabled)
    module.runPassChunked($target, ($chunk) => module.applyISSWithProbe($chunk))
}

/** Schedules a generation-safe fallback run after rendering work. */
export const scheduleFallbacks = (config, $target, kind, generationRef, onApplied) => {
  const generation = ++generationRef.current
  const snapshot = structuredClone(config)
  requestAnimationFrame(() => {
    const run = async () => {
      if (generation !== generationRef.current) return
      const apply = kind === 'iss' ? applyISSFallback : applyFallbacks
      await apply(snapshot, $target, () => generation === generationRef.current)
      if (generation === generationRef.current) onApplied()
    }
    if ('requestIdleCallback' in globalThis) requestIdleCallback(run, { timeout: 180 })
    else setTimeout(run, 0)
  })
}
