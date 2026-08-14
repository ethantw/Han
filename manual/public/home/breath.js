/**
 * breath.js — 循環動畫的視窗閘：不在視窗裡的東西不呼吸。
 *
 * 站③的浮水印那口氣（station-lines.css § 行的呼吸）動的是
 * `font-variation-settings`，而那一支**每幀一次全文件重排**（2026-08-04
 * 量測：7.3ms × 62 次／秒，主執行緒 68%）。字重已在 CSS 那頭以 `round()`
 * 量化過，剩下的另一半是：讀者人在站①，沒有理由替站③的裝飾算重排。
 *
 * 契約與 reveal.js 相反——那支是**一次性**的入場章（進場即蓋、蓋完解除
 * 觀察），這支要**來回**跟著捲動開關，所以不 unobserve。蓋的也是反相的
 * 章：`data-breath-idle` ＝「此刻不必喘」，CSS 只在有章時 `paused`。反著
 * 寫是為了降級——無 JS ／ 無 IntersectionObserver ⇒ 章永遠不出現 ⇒ 一路
 * 呼吸，與加這道閘之前的行為逐幀相同（同 dash-fuse.js「無 JS 契約不變」）。
 *
 * 用 `animation-play-state` 而不是拆掉 `animation`：拆掉等於下次進場從
 * 0% 重跑，讀者會看到那口氣跳一下；暫停則從離場當下的值接回去。
 *
 * reduced-motion 下整支不裝：CSS 那頭的 keyframes 本來就關在
 * `@media (prefers-reduced-motion: no-preference)` 之內，沒有動畫可暫停。
 *
 * 目標由 DOM 自己宣告（`data-breath`），這裡不寫死站台選擇器——別的循環
 * 動畫要搭這道閘，加個屬性即可。
 */

/* 提前一點起跑、晚一點停：捲到站台邊緣時那口氣已經在走，而不是等它整個
   進畫面才從頭啟動。15% 視窗高約當半個 station 的 lede。 */
const IN_VIEW = { rootMargin: '15% 0px' }

/* 量的是**站台**，蓋的是動畫元素。這兩個不是同一顆，而且不能是：搭這道閘的
   東西都是巨型裝飾——站③的浮水印樣張、站②那根一萬多像素高的柱——它們自己
   幾乎在任何捲動位置都與視窗相交，於是「不在視窗裡」永遠不成立，閘門形同
   虛設（實測 `df-try` 在每一個捲動位置都 running，包括隔了兩站之外）。
   站台的高度才是「讀者在不在這裡」的誠實尺度。 */
const scopeOf = ($el) => $el.closest('[data-station], main > section') || $el

export const initBreath = () => {
  const $targets = Array.from(document.querySelectorAll('[data-breath]'))
  if (!$targets.length) return
  if (!('IntersectionObserver' in window)) return

  /* 一個站台可能掛著不只一個循環動畫，所以是 scope → targets 的多對一。 */
  const byScope = new Map()
  for (const $el of $targets) {
    const $scope = scopeOf($el)
    byScope.set($scope, [...(byScope.get($scope) || []), $el])
  }

  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        for (const $el of byScope.get(entry.target) || []) {
          $el.toggleAttribute('data-breath-idle', !entry.isIntersecting)
        }
      }),
    IN_VIEW,
  )
  byScope.forEach((_, $scope) => observer.observe($scope))
}
