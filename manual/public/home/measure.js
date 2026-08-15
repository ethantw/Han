/**
 * measure.js — 量測驅動的版面共用的三條紀律：**放手才算**、**看不到不算**、
 * **先全部讀完再寫**。
 *
 * 這一頁有三處「觀察尺寸 → 讀幾何 → 寫變數」的迴路（破折號柱的裁切、校樣的
 * 欄解、放大鏡的複本）。三條紀律各治一段，都是從 owner 的 trace 逼出來的：
 *
 *   放手才算  `ResizeObserver` 與 `resize` 每一幀都叫一次，而每次呼叫都因為
 *             先讀 rect 而逼出一次同步版面。實測連續 24 步改寬：203 次
 *             Layout（每步 8.5）；把三個迴路都拿掉只剩 46 次（每步 1.9 ＝
 *             瀏覽器自己那一次）。這三件事沒有一件需要在拖曳過程中正確
 *             ——裁切線是裝飾、欄解在放手後才有意義、複本只在指標停下時被
 *             讀——所以一律等尺寸不再變 `SETTLE_MS` 才算。降到 50 次。
 *
 *   看不到不算 `content-visibility: auto` 的站台在畫面外沒有版面，那裡量到的
 *             是 `contain-intrinsic-size` 的佔位尺寸：既錯又貴。
 *             `checkVisibility()`（Baseline 2024）問的正是這件事；推回畫面時
 *             以 `contentvisibilityautostatechange` 補算。
 *
 *   先讀再寫  三個回呼各自「讀→寫」交錯時，前一個的**寫**弄髒版面，後一個的
 *             **讀**就得把它算完。第二份 trace 抓到這一段：柱的裁切一寫，
 *             1,804 個字節點的 SVG 全髒（`dirty 3107`），下一次讀花 250ms，
 *             三次共 0.8 秒。所以三者共用一個時鐘：同一次 flush 裡先跑完所有
 *             `read`，再跑所有 `write`，中間沒有人插隊弄髒。
 */

/* 比一次 rAF 長、比人放開滑鼠的反應短。120ms 之內的連續 resize 算同一次拖曳
   ——macOS 拖窗邊每秒送 60 次以上，這個窗口足以把整段吃掉。 */
const SETTLE_MS = 120

const rendered = ($watch) =>
  !$watch
  || typeof $watch.checkVisibility !== 'function'
  || $watch.checkVisibility({ contentVisibilityAuto: true })

/* 同一次 flush 的工作表。以 job 物件本身作鍵：同一個來源連按多次只留一份，
   而順序照第一次登記的先後——`write` 沒有先後之分，只有「都在讀完之後」。 */
const pending = new Set()
let timer = 0

const flush = () => {
  const jobs = [...pending].filter((job) => rendered(job.watch))
  pending.clear()
  /* 一次讀完：這一輪只會逼出一次版面。 */
  const values = jobs.map((job) => job.read?.())
  /* 再一次寫完：弄髒了也沒有人在後面讀。 */
  jobs.forEach((job, i) => job.write?.(values[i]))
}

/**
 * 登記一件「尺寸安定之後才做」的量測。`read` 只讀、`write` 只寫；不能拆的
 * （例如多趟解算）就整支放進 `write`，它會排在所有讀之後。
 * 回傳一個可以任意頻率呼叫的觸發器。
 */
export const settled = (job) => () => {
  pending.add(job)
  clearTimeout(timer)
  timer = setTimeout(flush, SETTLE_MS)
}

/** 被跳過的站台推回畫面的那一刻補算一次——否則它停在佔位尺寸算出來的值。 */
export const onRendered = ($watch, fn) => {
  $watch?.addEventListener?.('contentvisibilityautostatechange', (event) => {
    if (!event.skipped) fn()
  })
}
