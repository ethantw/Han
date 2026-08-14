/**
 * measure.js — 量測驅動的版面共用的兩條紀律：**放手才算**，以及**看不到不算**。
 *
 * 這一頁有三處「觀察尺寸 → 讀幾何 → 寫變數」的迴路（破折號柱的裁切、校樣的
 * 欄解、放大鏡的複本），而 `ResizeObserver` 與 `resize` 每一幀都會叫一次。每
 * 一次呼叫都因為「先讀 rect、再寫變數」而逼出一次同步版面，而這一頁的一次版面
 * 在 owner 的機器上要 27ms。實測（拖著窗邊連續 24 步改寬）：
 *
 *     現況              203 次 Layout（每步 8.5）
 *     拿掉 ResizeObserver 140 次
 *     拿掉 resize 監聽     110 次
 *     兩者都拿掉           46 次（每步 1.9 ＝ 瀏覽器自己那一次）
 *
 * 也就是說那三個迴路自己製造了 157 次額外的版面：拖曳一次多出四秒，放手好幾秒
 * 後才停。
 *
 * 治法不是「合併到一幀一次」——那仍然是每幀一次。**這三件事沒有一件需要在拖曳
 * 過程中正確**：裁切線是裝飾、欄解在放手後才有意義、放大鏡的複本只在指標停下來
 * 時被讀。所以一律等到尺寸不再變（`SETTLE_MS`）才算一次。代價說明白：拖曳中它們
 * 停在上一次的值，放手後一幀補上。
 *
 * 第二條紀律是省下另一半：`content-visibility: auto` 的站台在畫面外沒有版面，
 * 那裡量到的是 `contain-intrinsic-size` 的佔位尺寸——既錯又貴。`checkVisibility()`
 * 正是問這件事的 API（Baseline 2024）；它說不在畫面上就連量都不量，等
 * `contentvisibilityautostatechange` 把站台推回畫面時再補算。
 */

/* 比一次 rAF 長、比人放開滑鼠的反應短。120ms 之內的連續 resize 事件算同一次
   拖曳——macOS 拖窗邊每秒送 60 次以上，這個窗口足以把整段吃掉。 */
const SETTLE_MS = 120

const rendered = ($watch) =>
  !$watch
  || typeof $watch.checkVisibility !== 'function'
  || $watch.checkVisibility({ contentVisibilityAuto: true })

/**
 * 回傳一個可以任意頻率呼叫的函式：它只在「呼叫停止 SETTLE_MS」之後跑一次 `fn`，
 * 而且 `$watch` 不在畫面上時連跑都不跑。
 */
export const settled = (fn, $watch) => {
  let timer = 0
  return () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      if (rendered($watch)) fn()
    }, SETTLE_MS)
  }
}

/** 被跳過的站台推回畫面的那一刻補算一次——否則它停在佔位尺寸算出來的值。 */
export const onRendered = ($watch, fn) => {
  $watch?.addEventListener?.('contentvisibilityautostatechange', (event) => {
    if (!event.skipped) fn()
  })
}
