/**
 * Rail metric sliders — 字級 / 行距 / 字距. Pure inline style on
 * `main.han` (font-size / line-height / letter-spacing); the fill bar
 * and value <output> are driven the same way the old playground.js
 * did it, minus the meta-line bookkeeping (no preview header anymore
 * — the sliders act on the whole page, not a boxed specimen).
 */
const METRIC_DEFAULTS = { size: 17, leading: 1.85, tracking: 0.02 }

export function initMetrics(main) {
  if (!main) return

  const sliders = [...document.querySelectorAll('[data-pg-sliders] .MetricSlider')]
  const state = { ...METRIC_DEFAULTS }

  const apply = () => {
    const { size, leading, tracking } = state
    main.style.fontSize = `${size}px`
    main.style.lineHeight = String(leading)
    main.style.letterSpacing = `${tracking}em`
  }

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
      state[metric] = v
      const fmt = v.toFixed(precision)
      valEl.textContent = unit ? `${fmt} ${unit}` : fmt
      fill.style.width = `${((v - min) / (max - min)) * 100}%`
      apply()
    }
    input.addEventListener('input', sync)
    slider._sync = sync   // 供 reset 重跑（值先寫回 input 再 sync）
    sync()
  })

  // 「回到預設」也歸位度量——與 configurator.js 各自監聽同一顆按鈕，
  // 兩模組保持解耦。
  document.querySelector('[data-rail-reset]')?.addEventListener('click', () => {
    Object.assign(state, METRIC_DEFAULTS)
    sliders.forEach(slider => {
      const input = slider.querySelector('input[type="range"]')
      input.value = String(METRIC_DEFAULTS[slider.dataset.metric])
      slider._sync?.()
    })
    apply()
  })

  apply()
}
