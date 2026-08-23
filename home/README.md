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
| CSS | `public/home.css` 串起 `common/` 12 份 ＋ `home/` 18 份 ＋ `_port.css`；`/han/*.css` 由設定檔直餵倉庫根的 `dist/` |
| 區塊 | manifesto、語意、字體、工法、遊樂場、引用碼、closing；其餘兩站在 HTML 裡留註解佔位 |
| JS | 字體閘門 ＋ `<han-console>` 那一支模組圖。舊站其餘的 `home/*.js` 都沒搬 |

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

## 字體閘門與 漢 水印

`<head>` 的第一支 module script 是 `/home/fonts-gate.js`，**位置就是它的一半
功能**：module script 依文件順序執行，排在主控台後面會先繼承它整張模組圖的
網路等待（舊站量過，3G 上是好幾秒），而閘門的節拍器必須在第一趟描線將盡時
醒來才接得上第二趟。

它同時把 manifesto 的 漢 水印**建出來**：輪廓是從商標的 `.BrandGlyph` 複製
筆畫來的，所以整份 HTML 裡那個字形只有一處源頭。沒有它，`.Outline` 就是個
空的 span。

配套是 `<html data-fonts-gate="loading">` 的 pre-paint 印記，`gate.css` 靠它
把正文先設成透明、字體落地才放行。少了印記，閘門會走「沒有典禮」那條路——
水印照建，但不描線、不等字體。所以印記、`gate.css`、腳本三者要嘛一起在，
要嘛一起不在。

實測一次冷載：DCL 時 `gate=loading`、12 條筆畫已建、正文透明；4.5 秒字體落地
`gate=ready`、正文現形；8.5 秒第二趟描完，蓋上 `data-han-traced`，筆畫 24 條。

## 主控台，以及 han.js 走的那條路

`<head>` 另外掛兩行：`<han-console>` 元件，以及 `window.__hanCdn` 的版本號
（`codegen.js` 讀它，缺了會退回 `latest`，引用碼站就會印出與本頁不一致的
版本）。元件連上 DOM 就自己起來——採用 shadow 樣式表、注入模板、接上
`main`、發第一次 `han-config-change`。舊站是在字體閘門開啟後才動態 import
它，那是為了把它的模組圖挪出開場；這裡沒有閘門，直接靜態載入。

**沒有 `han.auto.js`。** 回落層由主控台呼叫：`console-config.js` 的
`applyFallbacks` 自己 `import('/han/han.js')` 再 `installFallbacks($target)`，
所以讀者的「JS 後備」開關才算話。auto 版會在元件之外先套一次，兩邊打架。

搬進來的模組圖只有七個檔：`components/{han-console,console-config,
console-metrics}.js` ＋ 兩份 shadow 樣式表、`common/icon.js`、
`home/codegen.js`。主控台的 shadow 模板沒有源檔——`manual/vite.config.js`
由 `home/console.html` × 五種語言生成，只存在於 `manual/dist/`——搬運腳本
照抄並削成只剩繁體（118KB → 23KB）。

實測：元件註冊、shadow 319 節點／60 個控件；撥「語意樣式標準化」，`:root`
的 `--han-semantics` 由 `on` 變 `off`；開場即由主控台裝上 140 個 `h-char`
（舊站同一支路徑是 698，區塊多、報導四份，比例對得上）。`h-hangable`／
`h-word`／`h-ruby` 兩站都是 0，那是函式庫的常態，不是搬漏。

`/han/*` 由 `vite.config.js` 的中介層直餵倉庫根的 `dist/`，副檔名白名單
`.css/.js/.json/.map/.woff2`——改了樣式庫、重跑 `node build/library`，這一頁
下一次重新整理就是新的。

## `_port.css` — 唯一一份搬運不碰的樣式

`home/*.css` 每次搬運都是從 `manual/` 整份複製，所以「因為還沒搬完才需要」
的規則不能寫進去——寫了下一次就沒了，而且兩邊看起來像同一份卻不同步。那類
規則一律寫 `public/home/_port.css`，它由 `home/` 自己維護，排在入口最後一行，
永遠壓得過搬進來的那些。搬完連同 `scripts/` 一起刪。

## 沒有 JS 就是空的（預期內）

站②的鉛字盤與標點示範、站①的四語全文閱讀器已經連同它們的模組搬進來了
（`lead-forme.js`、`punct-lang.js`、`paper-reader.js`，在 `_boot.js` 裡各叫
一次）。其餘搬進來的站仍是靜態外殼，
內容由各自的模組填：遊樂場的預覽窗（`playground.js`）、
引用碼的代碼窗（`snippet.js`＋`codegen.js`，連元素都是執行時建的，所以那顆
「JS 後備」開關也還不在）、工法的字體帳（`ledger.js`）。標題、公式、範例與
報紙樣張是寫死的標記，都在。

## 沒搬的東西，與為什麼

- **語言切換**。要 JS，這一輪不搬。
- **其餘七站的 CSS**。`public/home.css` 裡的 `@import` 留成註解，搬回哪一站
  就把哪一行的註解拿掉。

## 搬回一站的作法

1. `manual/home/<name>.html` 的 i18n 區塊取 `hant` 展開，貼進 `index.html`
   對應的註解佔位。
2. `public/home.css` 取消該站 `@import` 的註解，把 CSS 從
   `manual/public/home/` 複製過來。
3. 量一次再搬下一站——這個目錄存在的理由就是每一層都有數字。
