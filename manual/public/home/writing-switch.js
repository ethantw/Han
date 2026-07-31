/**
 * 橫排/直排 preview switch — `[data-writing-switch]`，markup 在
 * `home/station-type.html` 的站②尾巴（.PreviewSwitch 的第一個 fieldset，
 * 與正文字體那顆並排）。
 *
 * Writing mode is PREVIEW state, not a han.css variable — that's why it
 * lives outside the `<han-console>` configurator (owner call): the console
 * configures the framework, this flips how you look at the page. Sets
 * `main`'s `data-writing`; the vertical layout is pure CSS
 * (stations.css `main[data-writing="vertical"]`). Not persisted —
 * a fresh load reads horizontal, like any preview.
 *
 * 翻完要把讀者放回原地。行向一轉，捲動的軸跟著轉：直排下 `main` 自己是橫向
 * 捲動容器（實測 765px 的視窗裝 51888px 的內容），而 vertical-rl 的起點在
 * **最右邊**——翻過去 scrollLeft 仍是 0，等於直接跳到全文的尾端，畫面一片
 * 空白。所以翻完把當下這一站捲回眼前，`inline: 'start'`＝該站的開頭（直排
 * 下是右緣、橫排下是頂端），兩態都是「翻完還站在同一站的起點」。
 *
 * 捲的是站台而不是開關本身：直排下這顆開關被抬成浮動的
 * （station-fonts.css § PreviewSwitch），fixed 元素捲不動任何東西。
 *
 * `instant` 是刻意的：橫跨數萬像素的平滑捲動只會讓人暈。首次 apply（頁面
 * 載入）不捲——那時什麼都還沒翻。
 */
export const initWritingSwitch = () => {
  const $main = document.querySelector('main')
  const $switch = document.querySelector('[data-writing-switch]')
  if (!$main || !$switch) return

  const apply = () => {
    const $checked = $switch.querySelector('input:checked')
    if ($checked) $main.dataset.writing = $checked.value
  }
  $switch.addEventListener('input', () => {
    apply()
    const $here = $switch.closest('[data-station]') ?? $switch
    $here.scrollIntoView({ block: 'start', inline: 'start', behavior: 'instant' })
  })
  apply()
}
