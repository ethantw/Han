/**
 * <han-rail> metric sliders — 字級 / 行距 / 字重.
 * Pure inline style on the `target` (`main.han`): font-size /
 * line-height / font-weight. Preview-state only — none of it enters the
 * generated snippet (codegen.js is untouched), so this module never
 * dispatches `han-config-change`; the component wires its `reset()`
 * alongside the config core's.
 *
 * Moved from `home/rail-metrics.js` into the component and re-scoped:
 * sliders are queried from the shadow `root`, the apply target is
 * passed in. The letter-spacing slider stays removed (owner call); the
 * 橫排/直排 switch moved OUT to page chrome (`home/writing-switch.js`)
 * — writing mode is a preview of the page, not a han.css config.
 *
 * ts-style note: `stateRef` is the one-mutable-cell pattern — `.current`
 * replaced wholesale. Per-slider re-sync callbacks live in a `Map`.
 */
const METRIC_DEFAULTS = { size: 16, leading: 1.75, weight: 400 }

export const mountRailMetrics = ({ root, target }) => {
  const $sliders = [...root.querySelectorAll('[data-pg-sliders] .MetricSlider')]
  const stateRef = { current: { ...METRIC_DEFAULTS } }
  const syncBySlider = new Map()

  const apply = () => {
    if (!target) return
    const { size, leading, weight } = stateRef.current
    target.style.fontSize = `${size}px`
    target.style.lineHeight = String(leading)
    target.style.fontWeight = String(weight)
  }

  // 度量群組的「使用預設値」——群組標頭一顆（owner call：每個群組，
  // 不是每支 slider），任一 metric 偏離即現身，按下三支全回預設。
  // 文案讀模板的 data-label-default。
  const $groupDefault = document.createElement('button')
  $groupDefault.type = 'button'
  $groupDefault.className = 'Default'
  $groupDefault.textContent = '↺'
  const defaultLabel = root.querySelector('.Controls')?.dataset.labelDefault ?? 'Use default'
  $groupDefault.setAttribute('aria-label', defaultLabel)
  $groupDefault.title = defaultLabel
  $groupDefault.hidden = true
  root.querySelector('[data-pg-sliders]')
    ?.closest('.ControlGroup')
    ?.querySelector(':scope > header')
    ?.append($groupDefault)

  const updateGroupDefault = () => {
    $groupDefault.hidden = Object.entries(METRIC_DEFAULTS)
      .every(([metric, v]) => stateRef.current[metric] === v)
  }

  $sliders.forEach(($slider) => {
    const metric    = $slider.dataset.metric
    const unit      = $slider.dataset.unit ?? ''
    const precision = +($slider.dataset.precision ?? 0)
    const $input    = $slider.querySelector('input[type="range"]')
    const $fill     = $slider.querySelector('[data-pg-slider-fill]')
    const $val      = $slider.querySelector('[data-pg-slider-val]')
    const min       = +$input.min
    const max       = +$input.max

    const sync = () => {
      const v = +$input.value
      stateRef.current = { ...stateRef.current, [metric]: v }
      const fmt = v.toFixed(precision)
      $val.textContent = unit ? `${fmt} ${unit}` : fmt
      $fill.style.width = `${((v - min) / (max - min)) * 100}%`
      updateGroupDefault()
      apply()
    }
    $input.addEventListener('input', sync)
    syncBySlider.set($slider, sync)
    sync()
  })

  $groupDefault.addEventListener('click', () => {
    $sliders.forEach(($slider) => {
      const $input = $slider.querySelector('input[type="range"]')
      $input.value = String(METRIC_DEFAULTS[$slider.dataset.metric])
      syncBySlider.get($slider)?.()
    })
  })

  const reset = () => {
    stateRef.current = { ...METRIC_DEFAULTS }
    $sliders.forEach(($slider) => {
      const $input = $slider.querySelector('input[type="range"]')
      $input.value = String(METRIC_DEFAULTS[$slider.dataset.metric])
      syncBySlider.get($slider)?.()
    })
    apply()
  }

  apply()

  return { reset }
}
