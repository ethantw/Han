# home/ — 首頁重寫

`manual/` 之外的獨立 Vite 專案，`pnpm --filter han-home dev`，**port 7770**。

舊首頁是 `manual/` 的一部分，因此吃下整條文件站管線：Markdown、五語 i18n
渲染、SSR 樣張、資產雜湊——`manual/vite.config.js` 一千五百行。首頁不需要
其中任何一項。這裡重來一次，每一層都只搬需要的東西，搬一層驗一層。

## 現況

| 層 | 狀態 |
| --- | --- |
| Vite 設定 | 二十行，只指定 port 7770 |
| HTML | `index.html`，繁體一種語言，靜態展開，無模版引擎 |
| CSS | `public/home.css` 串起 `common/` 12 份 ＋ `home/` 14 份 ＋ `_port.css`；`/han/*.css` 由設定檔直餵倉庫根的 `dist/` |
| 區塊 | manifesto、語意、工法、遊樂場、引用碼、closing；其餘三站在 HTML 裡留註解佔位 |
| JS | 頁面自己的一支都沒有；只掛樣式庫的 `/han/han.auto.js`。互動只有兩顆 checkbox（主題、主控台收合），純 CSS |

`index.html` 由 `scripts/port-from-manual.mjs` 從舊模版展開而來：`{{ token }}`
取 `hant`，`<script type="text/x-i18n">` 區塊與所有 `<script>` 一併移除，CDN
版本寫死。那支腳本可以重跑，所以舊站改了什麼再跑一次就同步；搬回一站只要改
它開頭的兩個清單（`SECTIONS` 與 `STYLES`）。

它還做一件必要的事：把 `data-revealed` 寫進每個 `<section data-station>`。
`frame.css` 在 `prefers-reduced-motion: no-preference` 底下給
`[data-station] > *` 一個 `opacity: 0` 的起始態，只有 `reveal.js` 會蓋上那個
屬性——**所以沒有 JS 的頁面每一站都是空白的**，舊站在讀者停用 JS 時亦然。

`<han-console>` 是空殼——沒有腳本註冊這個名字，所以它是未定義元素，只有
light DOM 的載入中字徽會畫出來。收合仍然有效，因為那一路本來就是
`body:has(.ConsoleToggle input:checked)`，不經過 JS。

## 為什麼是 `han.auto.js`，不是 `han.js`

舊站在 `<head>` 掛的是 `/han/han.js`——那只是函式庫模組，載進來不會動任何
DOM；真正呼叫 `installFallbacks` 的是主控台，在讀者撥開關的時候。這裡沒有
主控台，所以改掛 auto 版：它在 `DOMContentLoaded` 自己跑一次
`installFallbacks(document.documentElement)`，正好是「頁面零 JS、樣式庫照常
工作」要的形狀。實測裝上 140 個 `h-char`。

`/han/*` 由 `vite.config.js` 的中介層直餵倉庫根的 `dist/`，副檔名白名單
`.css/.js/.json/.map/.woff2`——所以改了樣式庫、重跑 `node build/library`，
這一頁下一次重新整理就是新的。

## `_port.css` — 唯一一份搬運不碰的樣式

`home/*.css` 每次搬運都是從 `manual/` 整份複製，所以「因為還沒搬完才需要」
的規則不能寫進去——寫了下一次就沒了，而且兩邊看起來像同一份卻不同步。那類
規則一律寫 `public/home/_port.css`，它由 `home/` 自己維護，排在入口最後一行，
永遠壓得過搬進來的那些。搬完連同 `scripts/` 一起刪。

目前它只有一條：三份未搬報導的佔位字樣。

## 語意站的四份報導

只搬繁體那一份。其餘三份留下 `<header>`（報頭與報眉），正文換成一行自己語言
的佔位——欄還是四欄、藥丸還有得跳、版面形狀不變，被拿掉的正是量起來最貴的
那一塊（繁體那份 502 字／871px，三份佔位各 29–39 字／137px）。

## 沒有 JS 就是空的（預期內）

搬進來的三站是靜態外殼，內容由各自的模組填：遊樂場的預覽窗（`playground.js`）、
引用碼的代碼窗（`codegen.js`，連元素都是執行時建的）、工法的字體帳
（`ledger.js`）。標題、公式、範例與報紙樣張是寫死的標記，都在。

## 沒搬的東西，與為什麼

- **字體閘門**（`home/gate.css` ＋ `fonts-gate.js`）。閘門靠 JS 打開，沒有
  JS 就永遠不開，正文會一直是透明的。整組不搬。
- **manifesto 的 漢 水印**。`.Outline` 的輪廓由 `fonts-gate.js` 執行時複製
  SVG 進去，所以現在那個 span 是空的——版面位置留著，圖沒有。
- **語言切換**。要 JS，這一輪不搬。
- **其餘七站的 CSS**。`public/home.css` 裡的 `@import` 留成註解，搬回哪一站
  就把哪一行的註解拿掉。

## 搬回一站的作法

1. `manual/home/<name>.html` 的 i18n 區塊取 `hant` 展開，貼進 `index.html`
   對應的註解佔位。
2. `public/home.css` 取消該站 `@import` 的註解，把 CSS 從
   `manual/public/home/` 複製過來。
3. 量一次再搬下一站——這個目錄存在的理由就是每一層都有數字。
