/**
 * Rail metric sliders — 字級 / 行距 / 字重, + 直排/橫排 switch. Pure
 * inline style / dataset on `main.han` (font-size / line-height /
 * font-weight / dataset.writing); the fill bar and value <output> are
 * driven the same way the old playground.js did it, minus the
 * meta-line bookkeeping (no preview header anymore — the sliders act
 * on the whole page, not a boxed specimen).
 *
 * 字距（letter-spacing）滑桿已依 owner 要求整體移除——不留任何對內文
 * letter-spacing 的寫入；字重與直排/橫排同樣是預覽態控制（不進生成
 * 碼，codegen.js 未變動）。
 */
const METRIC_DEFAULTS = { size: 17, leading: 1.85, weight: 400 }
const WRITING_DEFAULT = 'horizontal'

export function initMetrics(main) {
  if (!main) return

  const sliders = [...document.querySelectorAll('[data-pg-sliders] .MetricSlider')]
  const state = { ...METRIC_DEFAULTS }

  const apply = () => {
    const { size, leading, weight } = state
    main.style.fontSize = `${size}px`
    main.style.lineHeight = String(leading)
    main.style.fontWeight = String(weight)
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

  // 直排/橫排——radio pair，寫 main.han 的 dataset.writing；純 CSS 消費
  // （stations.css 的 `main.han[data-writing="vertical"]`），與字級/
  // 行距/字重的 inline-style 寫法並存不衝突（不同屬性）。
  const writingGroup = document.querySelector('[data-pg-writing]')
  const applyWriting = (value) => { main.dataset.writing = value }
  writingGroup?.addEventListener('input', () => {
    const checked = writingGroup.querySelector('input:checked')
    if (checked) applyWriting(checked.value)
  })
  applyWriting(WRITING_DEFAULT)

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

    if (writingGroup) {
      const def = writingGroup.querySelector(`input[value="${WRITING_DEFAULT}"]`)
      if (def) def.checked = true
    }
    applyWriting(WRITING_DEFAULT)
  })

  apply()
}
