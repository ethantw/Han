/**
 * icon.js — 圖標元素的唯一產地（JS 側）。
 *
 * 樣式全在 `common/icons.css`：這裡只負責吐出那個空盒。圖標一律
 * `aria-hidden`——可及名稱留在按鈕的 `aria-label` 或同層的文字上，圖標本身
 * 不該被讀出來。
 *
 * CSS 生成內容那一路（console 的收合角標、`<details>` 的展合號）不經過這裡，
 * 直接讀 `--icon-*`。
 */
export const icon = (name, dir) => {
  const $icon = document.createElement('span')
  $icon.dataset.icon = name
  if (dir) $icon.dataset.dir = dir
  $icon.setAttribute('aria-hidden', 'true')
  return $icon
}
