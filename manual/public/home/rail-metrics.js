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
 *
 * ts-style note: `stateRef` is the one-mutable-cell pattern (see
 * `configurator.js`'s file header) — `.current` is replaced wholesale,
 * never patched in place. Per-slider re-sync callbacks live in
 * `syncBySlider` (a `Map`), not a `slider._sync` DOM-object patch.
 */
const METRIC_DEFAULTS = { size: 17, leading: 1.85, weight: 400 }
const WRITING_DEFAULT = 'horizontal'

export const initMetrics = ($main) => {
  if (!$main) return

  const $sliders = [...document.querySelectorAll('[data-pg-sliders] .MetricSlider')]
  const stateRef = { current: { ...METRIC_DEFAULTS } }
  const syncBySlider = new Map()

  const apply = () => {
    const { size, leading, weight } = stateRef.current
    $main.style.fontSize = `${size}px`
    $main.style.lineHeight = String(leading)
    $main.style.fontWeight = String(weight)
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

  // 直排/橫排——radio pair，寫 main.han 的 dataset.writing；純 CSS 消費
  // （stations.css 的 `main.han[data-writing="vertical"]`），與字級/
  // 行距/字重的 inline-style 寫法並存不衝突（不同屬性）。
  const $writingGroup = document.querySelector('[data-pg-writing]')
  const applyWriting = (value) => { $main.dataset.writing = value }
  $writingGroup?.addEventListener('input', () => {
    const $checked = $writingGroup.querySelector('input:checked')
    if ($checked) applyWriting($checked.value)
  })
  applyWriting(WRITING_DEFAULT)

  // 「回到預設」也歸位度量——與 configurator.js 各自監聽同一顆按鈕，
  // 兩模組保持解耦。
  document.querySelector('[data-rail-reset]')?.addEventListener('click', () => {
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
  })

  apply()
}
