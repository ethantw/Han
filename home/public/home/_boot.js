/**
 * home/ 自己的啟動點——`scripts/port-from-manual.mjs` **不覆寫這一份**，
 * 其餘 `home/*.js` 每次搬運都是從 `manual/` 整份複製過來的。
 *
 * 舊站的 `home.js` 一次點名十幾個模組，那張清單連同它的啟動時序（字體閘門
 * 開了才動態 import 主控台之類）都還沒搬。這裡只放「已經搬進來、而且需要有
 * 人呼叫一次」的模組：自啟動的（`fonts-gate.js`）與自己註冊的（元件）都不
 * 經過這裡。搬完之後這一份跟著搬運腳本一起刪，換成真正的入口。
 */
import { initSnapStrips } from './snap.js'
import { initLeadForme } from './lead-forme.js'
import { initPunctLang } from './punct-lang.js'

/* 藥丸只該動 X 軸。`<a href="#paper-…">` 的預設行為會把整頁捲到那一版的
   頂端——讀者要的是換一版，不是換一個捲動位置；`snap.js` 攔下預設行為，改
   用 `scrollIntoView({ inline: 'start', block: 'nearest' })`，只推長帶自己。 */
initSnapStrips()

/* 站②的鉛字盤：整座等角字盤是這一支建出來的，沒有它那個 figure 是空的。 */
initLeadForme()

/* 站②的標點語言示範：四顆 <select> 是主控台對應控件的遙控器，狀態的唯一
   真相在主控台，這一支只做雙向鏡射。 */
initPunctLang()
