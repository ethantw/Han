/**
 * <han-console> metric sliders — 字級 / 行距 / 字重.
 * Two effects, both fed by the same slider state: the live inline style
 * on the `target` (`main`: font-size / line-height / font-weight),
 * AND — new — the values now ride `config.metrics` into the generated
 * snippet. This module owns the DOM (sliders), the config core owns the
 * canonical `metrics` and the `han-config-change` broadcast; the two
 * meet through `onChange(metricsSnapshot)`, so a slider move dispatches
 * with source 'metrics' via that core (codegen emits a `body { }` rule
 * only when a metric deviates from its factory baseline).
 *
 * Moved from `home/console-metrics.js` into the component and re-scoped:
 * sliders are queried from the shadow `root`, the apply target is
 * passed in. The letter-spacing slider stays removed (owner call); the
 * 橫排/直排 switch moved OUT to page chrome (`home/writing-switch.js`)
 * — writing mode is a preview of the page, not a han.css config.
 *
 * ts-style note: `stateRef` is the one-mutable-cell pattern — `.current`
 * replaced wholesale. Per-slider re-sync callbacks live in a `Map`.
 * `METRIC_DEFAULTS` is DEFAULTS.metrics — single source of truth (the
 * config core seeds the same object, codegen gates on the same baseline).
 *
 * Notification discipline: the mount-time sync loop must NOT fire
 * `onChange` (it only paints initial state); a user `input` notifies once
 * after that slider syncs; the group-↺ and reset() batch-sync all sliders
 * then notify ONCE — never three events for one click.
 */
import { DEFAULTS } from '/home/codegen.js'

const METRIC_DEFAULTS = DEFAULTS.metrics

export const mountConsoleMetrics = ({ root, target, initial, onChange }) => {
  const $sliders = [...root.querySelectorAll('[data-pg-sliders] .MetricSlider')]
  const stateRef = { current: { ...METRIC_DEFAULTS } }
  const syncBySlider = new Map()

  // 補水起始 metrics 進 slider input——在 mount sync 迴圈「之前」，讓 sync()
  // 讀到補水後的值。lang 重渲染會換上全新模板，其 input 停在 markup 預設；
  // 沒有這步，偏差的滑桿會被靜默重置回預設（此前的既有 bug）。
  if (initial) {
    $sliders.forEach(($slider) => {
      const $input = $slider.querySelector('input[type="range"]')
      const v = initial[$slider.dataset.metric]
      if (v != null) $input.value = String(v)
    })
  }

  // config core 通知回呼——快照傳出（呼叫端不得動我方 state）。
  const notify = () => onChange?.({ ...stateRef.current })

  const apply = () => {
    if (!target) return
    const { size, leading, weight } = stateRef.current
    // Metrics ride CSS custom properties, NOT direct font-* inline styles —
    // so the live console and the pre-paint config restore (_home.html) share
    // one declarative mechanism. The consuming rule lives on `main`
    // (stations.css / manual.css) as `font-size: var(--console-metric-…,
    // inherit)`, so an unset var reverts to the page's own inherited value.
    target.style.setProperty('--console-metric-size', `${size}px`)
    target.style.setProperty('--console-metric-leading', String(leading))
    target.style.setProperty('--console-metric-weight', String(weight))
  }

  // 度量群組的「使用預設値」——群組標頭一顆（owner call：每個群組，
  // 不是每支 slider），任一 metric 偏離即現身，按下三支全回預設。
  // 文案讀模板的 data-label-default。
  const $groupDefault = document.createElement('button')
  $groupDefault.type = 'button'
  $groupDefault.className = 'Default'
  const defaultLabel = root.querySelector('.Controls')?.dataset.labelDefault ?? 'Use default'
  $groupDefault.textContent = `↺ ${defaultLabel}`
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
      $val.textContent = unit ? `${fmt}${unit}` : fmt
      $fill.style.width = `${((v - min) / (max - min)) * 100}%`
      updateGroupDefault()
      apply()
    }
    // 使用者拖動：sync 後通知「一次」。mount-time 的 sync() 不通知（下）。
    $input.addEventListener('input', () => { sync(); notify() })
    syncBySlider.set($slider, sync)
    sync()
  })

  // 群組 ↺：三支滑桿一併回預設再「通知一次」（不是每支各發一次）。
  $groupDefault.addEventListener('click', () => {
    $sliders.forEach(($slider) => {
      const $input = $slider.querySelector('input[type="range"]')
      $input.value = String(METRIC_DEFAULTS[$slider.dataset.metric])
      syncBySlider.get($slider)?.()
    })
    notify()
  })

  const reset = () => {
    stateRef.current = { ...METRIC_DEFAULTS }
    $sliders.forEach(($slider) => {
      const $input = $slider.querySelector('input[type="range"]')
      $input.value = String(METRIC_DEFAULTS[$slider.dataset.metric])
      syncBySlider.get($slider)?.()
    })
    apply()
    notify()
  }

  apply()

  return { reset }
}
