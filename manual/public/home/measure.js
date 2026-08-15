/**
 * measure.js — 量測驅動的版面共用的五條紀律：**放手才算**、**看不到不算**、
 * **先全部讀完再寫**、**改尺寸不是演出的理由**、**拖曳中看不到的就不要排**。
 * 前三條治這一頁自己的量測迴路，後兩條治拖曳期間的引擎開銷；五條都是從
 * owner 的 trace 逼出來的。
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

/* 拖曳中：`<html data-resizing>`。
 *
 * 第四條紀律，也是從 owner 的 trace 逼出來的一條：**改尺寸不是演出的理由**。
 * 站①的入場編舞刻意鍵在 `@container` 旗標的翻轉上（樣張裡有註明），而 console
 * 在 52rem 那道門檻讓 `body` 的行首內距一次跳 15rem——容器寬度隨之跳 240px，
 * 旗標翻面，整套入場就被當成「該演了」。實測拖過那道門檻：放手當下 49 支動畫
 * 同時起跑，之後還一路串到第三秒（`startTime` 為證，不是 `fill: both` 留下的
 * 屍體），期間每一幀都在改樣式與版面——看起來就是「醜好幾秒才到位」。同一批
 * 裡還有二十條斷點自己改值引發的 transition，頁首那幾條最顯眼。
 *
 * 壓成 0 秒而不是 `animation: none`：這些動畫多數 `both` 填充，終態才是靜止態
 * （`--settle` 的 `initial-value: 1` 就是這個契約），事後抽掉會讓少數已填充的
 * 值掉回去——實測 851 顆像素變色。0 秒則讓重觸發**瞬間落在原本的終態**，畫面
 * 與演完一模一樣，只是不演。hover 重播不受影響——沒有人在拖曳中 hover。
 *
 * 旗標要蓋過整段編舞，不是只蓋拖曳：0 秒讓動畫「當場演完」，但那只在旗標掛
 * 著時成立——一撤掉，時長還原，還在延遲期的那些等於重新上膛（實測撤旗那一刻
 * 50 支同時起跑）。所以撐到最長一支（cue 1400ms ＋ 1000ms）算完為止，還原時
 * 它們早已過期。 */
const HOLD_MS = SETTLE_MS + 2600

/* 第五條紀律：**拖曳期間，看不到的就不要排**。
 *
 * `content-visibility: auto` 只掛在 `main > section` 上，而站台很高——你人在
 * 頁首，站①的上緣露出來就算「可見」，於是它下面兩千像素外的四份報紙每一步
 * 都跟著重排。實測站①一站就佔每步 55ms 裡的 33ms，其中報紙 18ms。
 *
 * 所以拖曳一開始就親手凍住「視窗下緣以下」的塊：站台整個在下方就凍站台，
 * 跨到畫面內就退一層去看它的子元素，最多三層（第二層拿到絕大部分效益，第三
 * 層只多一點，再深下去凍的塊數暴增而效益持平）。**只凍下方**——凍上方會讓
 * 可見內容在拖曳中位移。尺寸先釘進 `contain-intrinsic-size` 再凍，否則塊一
 * 縮，整頁往上補位，量到與看到的都是別人的帳。
 *
 * 每步版面：頁首 55 → 30ms，停在站① 102 → 54ms。 */
const PARK_DEPTH = 3
const parked = []

const parkBelowFold = () => {
  const vh = innerHeight
  const found = []
  /* 先只讀。這一趟共逼出一次版面，寫在後面一次做完。 */
  const scan = ($el, depth) => {
    for (const $child of $el.children) {
      const rect = $child.getBoundingClientRect()
      if (!rect.height || rect.bottom <= 0) continue
      if (rect.top >= vh) found.push([$child, rect.width, rect.height])
      else if (depth > 1) scan($child, depth - 1)
    }
  }
  const $main = document.querySelector('main')
  if ($main) scan($main, PARK_DEPTH)

  for (const [$child, width, height] of found) {
    parked.push([$child, $child.style.containIntrinsicSize])
    $child.style.containIntrinsicSize = `${width}px ${height}px`
    $child.setAttribute('data-park', '')
  }
}

const unpark = () => {
  for (const [$child, previous] of parked) {
    $child.style.containIntrinsicSize = previous
    $child.removeAttribute('data-park')
  }
  parked.length = 0
}

/* 兩支時鐘、兩個旗標，因為兩件事該撐的長度不同：
   `data-dragging` 一放手就撤——凍結要解（拖完馬上往下捲的人不該看到空白），
   放大鏡也要立刻回來；`data-resizing` 要撐到整段入場編舞過期才撤。 */
let holdTimer = 0
let parkTimer = 0
let holding = false

addEventListener(
  'resize',
  () => {
    /* 已經掛著就別再寫一次——`setAttribute` 同值也會讓整份樣式失效，而這個
       事件每秒來六十次以上。凍結同理，只在第一次算一遍。 */
    if (!holding) {
      holding = true
      document.documentElement.dataset.resizing = ''
      document.documentElement.dataset.dragging = ''
      parkBelowFold()
    }
    clearTimeout(parkTimer)
    parkTimer = setTimeout(() => {
      holding = false
      delete document.documentElement.dataset.dragging
      unpark()
    }, SETTLE_MS)
    clearTimeout(holdTimer)
    holdTimer = setTimeout(() => {
      delete document.documentElement.dataset.resizing
    }, HOLD_MS)
  },
  { passive: true },
)

/** 被跳過的站台推回畫面的那一刻補算一次——否則它停在佔位尺寸算出來的值。 */
export const onRendered = ($watch, fn) => {
  $watch?.addEventListener?.('contentvisibilityautostatechange', (event) => {
    if (!event.skipped) fn()
  })
}
