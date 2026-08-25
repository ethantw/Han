/**
 * 演完就退場——把已經結束的入場動畫從元素身上移除。
 *
 * 一支 `fill: both` 的動畫演完之後**還算「活著」**：Blink 保留它的合成元素，
 * 於是那個元素一直帶著自己的合成層。這一頁的入場編舞散在十幾個元素上，量到
 * 二十個這樣的殘留層，而它們又讓**疊在上面的東西一併被提升**（Chrome 的
 * overlap testing）——整座站台因此各自成層：實測 `section#station-fonts`
 * 2318×6726、`section#station-semantics` 2318×3281，成層原因都是 `Overlap`。
 * 掃掉殘留之後合成層 35 → 14。
 *
 * `commitStyles()` 先把終態寫成行內樣式再取消，因為這些動畫的**終態就是靜止
 * 態**——直接取消會讓已填充的值掉回去（前人量過：851 個像素變色）。
 *
 * 兩道防線，因為「取消一支動畫」不是每次都無害：
 *
 *  • **只認入場詞彙**（`-in`／`-settle`／`-rise`／`-draw`／`-drop`／`-once`／
 *    `-split`／`fade-in`）。hover 觸發的動畫若被寫進行內，元素就會永遠停在
 *    「被指到」的樣子——所以寧可漏掉幾支，不要誤傷一支。新的入場動畫照這套
 *    命名，就自動被收；沒照的就留著，代價只是那個層。
 *  • **跳過偽元素**。`commitStyles()` 寫不進 `::before`／`::after`（沒有地方
 *    放行內樣式），會擲例外；那幾支只能留著。
 */

/* 入場動畫的命名詞彙。與 home/*.css 的 `@keyframes` 名稱是同一份約定，改名字
   的時候兩邊要一起改——漏了不會壞掉，只是那一支不再退場。 */
const ENTRANCE = /(?:^fade-in$|-in$|-in-\w+$|-settle$|-rise$|-draw$|-drop$|-once$|-split$)/

const isEntrance = (anim) =>
  typeof anim.animationName === 'string' && ENTRANCE.test(anim.animationName)

const retire = (anim) => {
  if (!isEntrance(anim) || anim.playState !== 'finished') return false
  if (anim.effect?.pseudoElement) return false
  try {
    anim.commitStyles()
    anim.cancel()
    return true
  } catch {
    /* 未渲染的元素（被 `content-visibility` 跳過的站台）寫不進行內樣式。那裡
       本來也沒有層，留著沒有代價；等它進畫面演完，`animationend` 會再來。 */
    return false
  }
}

/**
 * 掛上「演完就退場」。回傳一個可以手動再掃一次的函式（測試用）。
 */
export const initSettle = () => {
  const sweep = () => {
    let n = 0
    for (const anim of document.getAnimations()) if (retire(anim)) n++
    return n
  }

  /* 逐支收：`animationend` 冒泡，所以一個監聽器管整頁。事件到達時該支還沒
     進入 finished，等一拍再收。 */
  addEventListener(
    'animationend',
    (event) => {
      requestAnimationFrame(() => {
        for (const anim of event.target.getAnimations?.() ?? []) retire(anim)
      })
    },
    { capture: true, passive: true },
  )

  /* 掛上之前就演完的那些收不到事件，所以開場補掃兩次：字體落地會讓一批動畫
     重新起跑（閘門開了才描第二趟），所以第二次要排在那之後。 */
  sweep()
  document.fonts?.ready?.then?.(() => setTimeout(sweep, 1200))
  setTimeout(sweep, 10000)

  return sweep
}
