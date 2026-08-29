# 首頁 Console 設定切換效能修復

2026-08-29。本文記錄首頁 `<han-console>` 的模組開關、「行的調整」、
CSS 變數選單與度量 slider 由幾百毫秒至數秒停頓，收旂到一幀左右
回應的調查、修法與驗證。

## 症狀

- 首頁初期，四個模組 toggle 及細項控件可即時切換。
- 首頁增長到約 8,400 個 `main` 內元素、11,000 個 layout object 後，
  任一設定都可能停頓幾秒。
- 第一輪修正後，四個模組開關已變快，但「標點擠壓」、「標點
  懸掛」、「漢字西文間距」仍會卡住，表示還有另一條與模組開關
  無關的昂貴路徑。

## 量測方法

- Chromium，1440×900，實際首頁 `http://localhost:7700/`。
- 直接驅動 shadow DOM 裡的真實控件，不以代理元素猜測。
- 同時記錄：
  - `input` event 同步 dispatch 時間；
  - 接下來數幀的間隔；
  - `PerformanceObserver({ type: 'longtask' })`；
  - CDP trace 的 `Recalculate Style`、`Layout` 與 JS call stack。
- 分別在頁首與「叁・行的調整」真正可見時量測；只在頁首測會
  漏掉「前後巨型站台剛好位於瀏覽器預渲染區」的主因。

## 根因

### 1. 每次 input 都先撤掉全部 CSS 變數，再全數寫回

舊 `applyTarget` 對每個設定都做「全部 `removeProperty`→全部 `setProperty`」。
就算只改一個選單，仍會製造多輪繼承變數失效。

修正為保留上次的 `Map`，只收回消失的屬性，且只寫入真正變動的值。
模組開關的預覽旗標也併入同一張有效變數表，避免先寫一次設定、
再寫一次模組狀態。

### 2. 任一設定都全頁 `uninstallFallbacks()` ＋ `installFallbacks()`

這是最大的 JS 問題。純字體或語意變數變動，原本也會：

1. 掃過整棵 `main`；
2. 拆掉所有 `<h-char>` / `<h-iss>` 與配對屬性；
3. 重新跑標點、quote boundary、ISS、adjacent-line 四道 pass；
4. 產生大量 DOM mutation，隨即觸發全頁 style/layout。

修正後：

- fallback 有自己的 desired/applied plan；
- 純 CSS 設定不再觸發 fallback；
- 關閉已存在的能力時，wrapper 由 cascade 休眠，不同步拆 DOM；
- 只有新開啟尚未建立的能力才重建；
- autospace mode 變動只清理與重跑 `<h-iss>`，不重跑其他三道 pass；
- 非初始 fallback 在一幀畫出後才進入 idle slot，快速連撥時舊 generation
  直接作廢。

### 3. 站內模組代理開關還有人為 520ms 延遲

這段延遲原本用來讓動畫先播完，避開同步 fallback 重建。fallback
已不再堵在輸入事件裡後，它只剩下可見的操作延遲，因此刪除。

### 4. 繼承自訂屬性仍會迫使巨型離屏站台排版

前三項修正後，`input` dispatch 已降到約 1–5ms，但 CDP trace 仍看到
200–320ms 的延後 layout。一次 `squeeze` trace 裡：

- `Layout`: 316.7ms；
- layout root: `#document`；
- 只有約 55 個 dirty object，但總 layout object 約 11,003。

原因是設定寫在 `:root`，又是可繼承自訂屬性。即使當下只看一站，
頁面其餘數千個元素仍參與失效與排版。

首頁因此在 `han-config-will-apply` 時先做離屏停車：

- 先讀取尺寸，再統一寫入，不讀寫交錯；
- `contain-intrinsic-size` 使用 content box，不把 padding/border 重複加入；
- 視窗外的區塊以精確佔位尺寸配合 `content-visibility:hidden` 凍結；
- 拖曳 slider 的連續 input 共用同一份 viewport workset，不每次重掃幾何；
- 區塊進入 viewport 時才解凍。

### 5. 共用量測器把「瀏覽器願意預渲染」誤當成「使用者看得到」

這是第一輪後三個行 toggle 仍卡的直接原因。

`measure.js` 原本只問：

```js
element.checkVisibility({ contentVisibilityAuto: true })
```

Blink 對 `content-visibility:auto` 有很大的預渲染區。在站叁中，前一個
7,200px 高的字體站已完全移到視窗上方，後一個散文站仍在下方，
`checkVisibility` 卻對兩者都回答 `true`。

於是行 toggle 之後 120ms，ResizeObserver 排程的量測又被全數唤醒。
實測其中一次離屏 `station-fonts` 幾何讀取單獨花約 100ms，接著
還有兩個放大鏡各約 10–14ms 的寫入。

修法是增加一個共用 `IntersectionObserver`：

- observer 的結果作為真正的 viewport 狀態，不在 flush 裡讀 rect；
- 離開 viewport 的 job 在 flush 時被過濾；
- 被略過的 watch 重新進入 viewport 時，observer 會自動重排該 job；
- 因此不是永久丟掉量測，只是把它搬到讀者真正快要需要的時刻。

## `src/` library 具體改了什麼

本次 `src/` 只改了 `src/css/lines.with-js.css`；沒有改 TypeScript API、
DOM fallback 分類或 install/uninstall 演算法。

### A. `no-autospace` 立即使既有 `<h-iss>` 失效

新增：

```css
@container style(--han-text-autospace: no-autospace) {
  :where(h-iss) {
    display: none;
  }
}
```

以前 `--han-text-autospace:no-autospace` 只能阻止下一次 JS pass 插入 spacer；
已存在 DOM 的 `<h-iss>` 仍要等 `uninstallFallbacks()` 拆掉才消失。這使
「修改一個公開 CSS 變數」被迫變成「同步改寫整棵 DOM」。

新規則讓公開 opt-out 自己就能立即停用既有 spacer。JS 稍後清理 DOM
是資源回收，不再是畫面正確的前置條件。

### B. 擠壓 fallback 只在 `auto | compress` 時生效

原本在不支援 `text-spacing-trim:trim-start` 的瀏覽器中，只要 DOM 裡有
`h-char[data-punct]`，擠壓用的負 margin 與 pseudo filler 就無條件生效。

現在整塊包在：

```css
@container
  style(--han-punctuation-refinement: auto) or
  style(--han-punctuation-refinement: compress)
{
  /* compress fallback */
}
```

因此宣告 `hang` 或 `none` 時，已存在的 punctuation wrapper 不會繼續
付出擠壓 margin。開回 `compress` / `auto` 又可直接復用同一批 wrapper。

這兩項不只服務首頁。既然 library 對外公開的是可繼承 CSS 變數，
動態改變這些變數就應先得到正確的 cascade 結果，不應要求應用程式
立刻做全局 DOM transaction。首頁的效能問題只是把這個動態設定缺口放大了。

## 其他模組修正

| 檔案 | 修正 |
|---|---|
| `manual/public/components/console-config.js` | 變數差量寫入、fallback plan/generation、延後重建、ISS-only path、冪等模組狀態。 |
| `manual/public/components/console-metrics.js` | slider 改寫繼承度量前先發 `han-config-will-apply`。 |
| `manual/public/home/module-state.js` | 刪除代理開關的 520ms 人為延遲。 |
| `manual/public/home/measure.js` | 精確尺寸離屏停車、viewport workset 快取、用 IntersectionObserver 過濾離屏量測並於進場時補算。 |

## 效能結果

### 修正前

| 操作 | 同步 input dispatch |
|---|---:|
| `citeTitleMarks` | 約 977ms |
| `punct.hant` | 約 1,078ms |
| `semantics` | 約 1,037ms |
| `fonts` | 約 940ms |

第一輪去掉全變數重寫與全 fallback 重建後，dispatch 已約 1–5ms，
但「行的調整」站可見時還會有約 83–260ms 的首次排版，之後再來
一波約 100ms 離屏量測。

### 最終

在「叁・行的調整」真正可見時：

| 控件 | dispatch | 下一幀 | long task |
|---|---:|---:|---:|
| 標點擠壓 | ~1.7ms | ~16.6ms | 0 |
| 標點懸掛 | ~1.7ms | ~16.8ms | 0 |
| 漢字西文間距 | ~1.7ms | ~15.8ms | 0 |

模組、語意細項、字體、四語標點、度量 slider 與一般 CSS 變數選單也逐項
檢查。常用控件的同步事件大多為 1–6ms，沒有再出現「每個控件都重建
全頁 fallback」的停頓。

## 刻意保留的重工作

進階「手動 JS pass」不是純 cascade 預覽：它就是要真實示範某一支
DOM transformer 有沒有被打包。切換 `jsMode` 或個別 pass 仍可能在首幀畫出後
產生約 100–400ms 的背景 DOM 工作。

這不再堵住 toggle 本身，但也不應被報成已消失。若以後要繼續降低，
應在 library 層新增可 `await` / 可中斷的 pass chunk scheduler，而不是再把一個
同步 `installFallbacks(main)` 搬到另一個 timer 裡假裝它變快。

## 正確性與風險

- 快速連續切換只允許最新 generation 落地，舊 async import / idle job 不得回寫舊狀態。
- 關閉擠壓、懸掛、autospace 時可保留 wrapper，但 cascade 必須立即使它無作用；
  `src/css/lines.with-js.css` 的兩項修正就是該不變條件。
- 離屏塊必須以 content-box 尺寸佔位；用 border-box 會把 padding 重複計算，
  造成每次設定都移動頁面。
- 被 viewport filter 略過的量測不可永久消失；進場 callback 必須重排。
- 本次不改生成引用碼；生成碼仍照公開 API 寫 `:root` / `body`，離屏停車
  是首頁專用的渲染策略。

## 驗證

- `pnpm test`：245 passed。
- `pnpm --filter han-manual test`：64 passed。
- `pnpm build`：通過。
- `pnpm --filter han-manual build`：通過。
- 依首頁尚未完工期間的規約，本輪未執行 E2E suite；效能數據來自直接
  Chromium/CDP 量測。
