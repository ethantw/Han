/**
 * Rail metric sliders — 字級 / 行距 / 字距. Pure inline style on
 * `main.han` (font-size / line-height / letter-spacing); the fill bar
 * and value <output> are driven the same way the old playground.js
 * did it, minus the meta-line bookkeeping (no preview header anymore
 * — the sliders act on the whole page, not a boxed specimen).
 */
export function initMetrics(main) {
  if (!main) return

  const sliders = [...document.querySelectorAll('[data-pg-sliders] .MetricSlider')]
  const state = { size: 17, leading: 1.85, tracking: 0.02 }

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
    sync()
  })

  apply()
}
