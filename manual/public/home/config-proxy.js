/**
 * config-proxy.js — 頁面側控件 ⇄ console 的**單值**設定（`data-han-cfg-proxy`）。
 *
 * 分工同 module-state.js：console 是設定的唯一擁有者，這支只按它的按鈕，再把
 * 它廣播回來的值撥正。差別在管的東西——module-state 管四個模組的布林開關
 * （撥的是「要不要 import 這一層」），這支管「一個 key 一個值」的設定；目前
 * 只有站②尾巴那顆 `baseGeneric`（正文騎 sans-serif 還是 serif）。
 *
 * 為什麼不能像直排 pill 那樣純頁面側處理：行向是**預覽**狀態（writing-switch.js
 * 只寫 main 的 data-writing，跟 han.css 無關），而 baseGeneric 是**設定**——它
 * 同時決定 console 套在 main 上的 font-family 與生成碼裡 `body { … }` 那一行。
 * 兩者必須同一個真相來源，否則站台撥了、生成碼沒跟上。
 *
 * 控件是一組同名 radio，`value` 直接寫設定值（DOM 即資料）；巢狀 key
 * （`punct.hant` 那種）不在這裡處理——那是 punct-lang.js 的地盤。
 */

/** console 的對應控件（開放式 shadow root，同 module-state.js 的走法）。 */
const consoleControl = (key) =>
  document.querySelector('han-console')?.shadowRoot
    ?.querySelector(`[data-cfg-key="${key}"]`) ?? null

export const initConfigProxy = ($root = document) => {
  const $inputs = [...$root.querySelectorAll('input[data-han-cfg-proxy]')]
  if (!$inputs.length) return

  /* 頁面 → console：驅動 console 自己的控件並補一個 input 事件，讓元件照原路
     更新 config、套用到 main、再廣播出來。這裡不自己算任何東西。 */
  $inputs.forEach(($input) =>
    $input.addEventListener('change', () => {
      if (!$input.checked) return
      const $control = consoleControl($input.dataset.hanCfgProxy)
      if (!$control || $control.value === $input.value) return
      $control.value = $input.value
      $control.dispatchEvent(new Event('input', { bubbles: true }))
    }))

  /* console → 頁面：`han-config-change` 是 composed 的，穿得出 shadow root，
     所以聽 document 就好。元件連接時會先廣播一次目前的 config——那一次順便
     把控件從 localStorage 還原的設定撥正，所以這裡不必自己讀初始值。 */
  document.addEventListener('han-config-change', (e) => {
    const config = e.detail?.config
    if (!config) return
    $inputs.forEach(($input) => {
      const value = config[$input.dataset.hanCfgProxy]
      if (value != null) $input.checked = $input.value === value
    })
  })
}
