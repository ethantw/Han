/**
 * Playground section — sample chips, metric sliders, and the custom
 * Markdown mode. The configurator (`configurator.js`) owns the
 * layer/font/punctuation controls and the snippet output panel;
 * this module only handles what's specific to swapping the preview's
 * source HTML and its live typographic metrics.
 *
 * The preview's two layers of state, ordered by re-install cost:
 *
 *   1. Sliders            — pure inline style (font-size, line-height,
 *                           letter-spacing).  Free.
 *   2. Sample / Markdown  — replace the preview's innerHTML, then re-run
 *                           installFallbacks on the new subtree.
 *
 * Custom-mode MD render is debounced so installFallbacks doesn't fire
 * on every keystroke.
 */

import { installFallbacks } from '/han/han.js'
import { initConfigurator } from '/home/configurator.js'

export function initPlayground() {
  const root = document.querySelector('[data-pg]')
  if (!root) return

  const body      = root.querySelector('[data-pg-body]')
  const stage     = root.querySelector('[data-part="stage"]')
  const textarea  = root.querySelector('[data-pg-custom-input]')
  const meta      = root.querySelector('[data-pg-meta]')
  const chips     = [...root.querySelectorAll('[data-pg-chips] [data-sample]')]
  const sliders   = [...root.querySelectorAll('[data-pg-sliders] .MetricSlider')]
  const samples   = readSamples(root)

  const state = {
    sample:  'zh-Hant',     // active chip key
    metrics: { size: 17, leading: 1.85, tracking: 0.02 },
  }

  let mdRender = null  // lazy-loaded on first custom-mode entry

  /* ── samples / custom mode ─────────────────────────────────── */

  const applySample = key => {
    state.sample = key
    chips.forEach(c => c.classList.toggle('is-active', c.dataset.sample === key))

    if (key === 'custom') {
      stage.classList.add('is-custom')
      textarea.hidden = false
      if (!textarea.value) textarea.value = samples['custom-default']?.text ?? ''
      ensureMdLoaded().then(renderCustom)
      return
    }

    stage.classList.remove('is-custom')
    textarea.hidden = true
    const s = samples[key]
    if (!s) return
    body.innerHTML = s.html
    body.lang = s.lang
    installFallbacks(body)
    updateMeta(s.meta)
  }

  const ensureMdLoaded = async () => {
    if (mdRender) return mdRender
    const mod = await import('/home/playground-md.js')
    mdRender = mod.default
    return mdRender
  }

  const renderCustom = () => {
    if (!mdRender) return
    body.innerHTML = mdRender(textarea.value)
    body.lang = samples['custom-default']?.lang ?? 'zh-Hant'
    installFallbacks(body)
    updateMeta(samples['custom-default']?.meta ?? 'custom・Markdown')
  }

  let mdTimer = 0
  textarea.addEventListener('input', () => {
    clearTimeout(mdTimer)
    mdTimer = setTimeout(renderCustom, 140)
  })

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.sample
      if (key === state.sample) return
      applySample(key)
    })
  })

  /* ── sliders ──────────────────────────────────────────────── */

  sliders.forEach(slider => {
    const metric    = slider.dataset.metric
    const unit      = slider.dataset.unit ?? ''
    const precision = +(slider.dataset.precision ?? 0)
    const input     = slider.querySelector('input[type="range"]')
    const fill      = slider.querySelector('[data-pg-slider-fill]')
    const valEl     = slider.querySelector('[data-pg-slider-val]')
    const min       = +input.min
    const max       = +input.max

    const sync = () => {
      const v = +input.value
      state.metrics[metric] = v
      const fmt = v.toFixed(precision)
      valEl.textContent = unit ? `${fmt} ${unit}` : fmt
      fill.style.width = `${((v - min) / (max - min)) * 100}%`
      applyMetrics()
      if (metric === 'size') updateMetaSize(v)
    }
    input.addEventListener('input', sync)
    sync()
  })

  function applyMetrics() {
    const { size, leading, tracking } = state.metrics
    body.style.fontSize      = `${size}px`
    body.style.lineHeight    = String(leading)
    body.style.letterSpacing = `${tracking}em`
  }

  /* ── meta line ────────────────────────────────────────────── */

  function updateMeta(label) {
    const { size } = state.metrics
    meta.dataset.label = label
    meta.textContent = `${label}・${size} px`
  }
  function updateMetaSize(size) {
    const label = meta.dataset.label || 'zh-Hant'
    meta.textContent = `${label}・${size} px`
  }

  /* ── boot ─────────────────────────────────────────────────── */

  applyMetrics()
  applySample(state.sample)
  initConfigurator(root)
}

/**
 * Read inline `<template data-pg-sample="…">` blocks into a map.
 * Sample-key blocks export `.html` (parsed); the `custom-default`
 * block exports `.text` (raw markdown source) instead.
 */
function readSamples(root) {
  const out = {}
  root.querySelectorAll('template[data-pg-sample]').forEach(t => {
    const key = t.dataset.pgSample
    out[key] = {
      lang: t.dataset.lang || 'zh-Hant',
      meta: t.dataset.meta || '',
      html: t.innerHTML.trim(),
      text: dedent(t.textContent),
    }
  })
  return out
}

function dedent(s) {
  s = s.replace(/^\n+|\s+$/g, '')
  const lines = s.split('\n')
  const indent = Math.min(...lines.filter(l => l.trim()).map(l => l.match(/^ */)[0].length))
  return Number.isFinite(indent) && indent > 0
    ? lines.map(l => l.slice(indent)).join('\n')
    : s
}
