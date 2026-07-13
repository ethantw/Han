/**
 * <han-rail> metric sliders — 字級 / 行距 / 字重, + 直排/橫排 switch.
 * Pure inline style / dataset on the `target` (`main.han`): font-size /
 * line-height / font-weight / dataset.writing. Preview-state only — none
 * of it enters the generated snippet (codegen.js is untouched), so this
 * module never dispatches `han-config-change`; the component wires its
 * `reset()` alongside the config core's.
 *
 * Moved from `home/rail-metrics.js` into the component and re-scoped:
 * sliders + the writing switch are queried from the shadow `root`, the
 * apply target is passed in. The letter-spacing slider stays removed
 * (owner call).
 *
 * ts-style note: `stateRef` is the one-mutable-cell pattern — `.current`
 * replaced wholesale. Per-slider re-sync callbacks live in a `Map`.
 */
const METRIC_DEFAULTS = { size: 17, leading: 1.85, weight: 400 }
const WRITING_DEFAULT = 'horizontal'

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
      apply()
    }
    $input.addEventListener('input', sync)
    syncBySlider.set($slider, sync)
    sync()
  })

  // 直排/橫排——radio pair，寫 target 的 dataset.writing（純 CSS 消費）。
  const $writingGroup = root.querySelector('[data-pg-writing]')
  const applyWriting = (value) => { if (target) target.dataset.writing = value }
  $writingGroup?.addEventListener('input', () => {
    const $checked = $writingGroup.querySelector('input:checked')
    if ($checked) applyWriting($checked.value)
  })
  applyWriting(WRITING_DEFAULT)

  const reset = () => {
    stateRef.current = { ...METRIC_DEFAULTS }
    $sliders.forEach(($slider) => {
      const $input = $slider.querySelector('input[type="range"]')
      $input.value = String(METRIC_DEFAULTS[$slider.dataset.metric])
      syncBySlider.get($slider)?.()
    })
    apply()

    if ($writingGroup) {
      const $default = $writingGroup.querySelector(`input[value="${WRITING_DEFAULT}"]`)
      if ($default) $default.checked = true
    }
    applyWriting(WRITING_DEFAULT)
  }

  apply()

  return { reset }
}
