# 逐 pass 安裝 ＋ 精簡 auto 產物

> **狀態：①②③ 均已完成（2026-08-02）。** 實作結果與意外見文末〈落地紀錄〉。

把 `installFallbacks()` 的三道 pass（標點／混排間隙／鄰行間距）＋ probes 開放給
使用者逐一取捨，並砍掉 `<script src>` 路徑上白付的再匯出成本。

## 為什麼這樣切（量過才寫的）

esbuild 各別打包，minify＋brotli：

| 內容 | brotli |
|---|---|
| `hyperly/fp` 一個人 | 4.1k |
| 只有鄰行間距 | 6.8k |
| 只有標點 | 6.9k |
| 只有 probes | 7.1k |
| 只有混排間隙 | 7.9k |
| 標點＋混排 | 8.1k |
| 三道 pass、不含 probes | 8.2k |
| `installFallbacks` 全開 | 8.4k |
| **現行出貨的 `han.auto.min.js`** | **10.1k** |

兩個結論，決定了本計畫的形狀：

1. **逐 pass 勾選省不了體積。** 共用地板（hyperly ＋ helpers）就 6.5k 上下，每
   道 pass 的邊際成本只有 0.2–1.0k。最好的情況（只留鄰行間距）省 1.6k，常見的
   情況省 0.2–0.3k，卻要為每種組合預產一個 CDN 檔（8–16 個）。
   ⇒ **逐 pass 開關是「行為」開關，不是「體積」開關。** 文案與帳目都要照這個
   說法寫，不可暗示勾選會變小。
2. **真正白付的 1.5k 在別處。** `han.auto.js` 出貨 10.1k，副作用負載只有 8.6k；
   差額是 `export * from './han.ts'` 把整套具名 API 再匯出一次，而走
   `<script src>` 的人根本碰不到那些匯出。

## 三件事

### ① `sideEffects`（最便宜，先做）

`package.json` 目前**沒有** `sideEffects` 欄位 ⇒ 走 npm ＋ bundler 的人拿不到
可靠的 tree-shaking。補上之後，`import { refinePunctuation } from
'@hanzi.pro/han.css'` 由消費者自己的 bundler 搖掉其餘的 pass——這才是「逐函數
省體積」真正成立的路徑，且不需要我們預先枚舉組合。

- CSS 與 `han.auto*` 都有副作用，必須列在白名單裡。
- 驗收：一個只 import 單一 pass 的 fixture，經 bundler 後不含其餘 pass 的識別字。

### ② 無匯出的 auto 產物（−1.5k）

新增 entry：只跑副作用、不對外匯出，專供 `<script src>` / 貼進 `<script
type="module">` 的交付路徑。

- `dist/han.auto.js` **維持**整套再匯出（文件寫明是 `han.js` 的嚴格超集，不能
  破壞）。新產物是**另一個檔**，不是改現有的。
- `format: 'iife'` 走不通：hyperly 有 top-level await，esbuild 直接拒絕。作法是
  一個不 re-export 的 entry wrapper，仍出 ESM。
- 只需 browser 條件那一份（`<script src>` 本來就只在瀏覽器跑）。
- codegen 的 CDN URL 改指這個新檔。
- 驗收：新檔 brotli ≈ 8.6k；e2e 確認貼上後 fallback 仍生效。

### ③ 逐 pass 開關

**庫端**：`--han-install` 從關鍵字 enum 擴成 token 列表。
- 現行 `syntax: 'auto | fallbacks | probes | none'` → `'*'`，自己解析 token；
  `auto` / `fallbacks` / `probes` / `none` 全部保持有效（**不破壞相容**）。
- 新 token：`punctuation` / `iss` / `adjacent-lines` / `probes`，可並列，例如
  `--han-install: punctuation iss`。
- `han.auto.ts` 的 switch 改成集合判斷。

**console**：`fallbacks` 那顆開關底下長出四顆子開關（config keys 待定，比照
既有 `punct.*` 的巢狀鍵命名）。父開關關閉時子開關 disabled。

**codegen**：非全開時輸出 `--han-install: …`；全開時不輸出（保持預設 `auto`）。

**首頁腳本帳**：四顆子開關**不改任何數字**——那是行為開關。帳上要有一句話講
明這件事，否則讀者會以為勾選能省。置灰邏輯維持在 `fallbacks` / `legacyRuby`
這一層。

## 順序

①→②→③。①② 互不相干且可各自驗收；③ 依賴 ② 決定 codegen 要指哪個檔。

## 驗收

- `pnpm test`（單元）＋ `pnpm exec playwright test`（e2e）全綠。
- 新產物體積寫進首頁腳本帳（build 期現算，比照既有四份）。
- `docs/api-js.md` 補 `--han-install` 的新 token 表。


## 落地紀錄（2026-08-02）

### ① `sideEffects` — 一個會刪掉自家產物的雷

`"sideEffects"` 補上之後 `han.install.min.js` **打包出 0 bytes**。原因是
esbuild 對 `src/` 底下的檔案讀的是**同一個** `package.json`：白名單只寫了
`./dist/...`，`src/han.auto.ts` 因此被判定無副作用、整棵樹被搖光，`import
'./han.auto.ts'` 什麼都不剩。

⇒ 白名單必須同時涵蓋 `src/` 與 `dist/` 兩棵樹。現行值：

```json
"sideEffects": ["*.css", "**/han.auto.*", "**/han.install.*"]
```

`**/han.auto.*` 也涵蓋 `han.auto.browser.js`（glob 的 `*` 不在 `.` 停）。
以後在 `src/` 新增任何靠 import 副作用生效的檔案，記得同步這張表，否則它會
**安靜地**變成空檔——build 不報錯。

### ② `han.install`（−1.5k）

`src/han.install.ts` ＝ `import './han.auto.ts'`，不 re-export。實測
10.1k → **8.6k** brotli（26.9k 未壓縮）。`dist/han.auto.js` 維持整套再匯出，
API 契約沒破壞。

- 只出 browser 條件那一份（`<script src>` 不會在 Node 跑）。
- `exports` 加 `"./install"`；`FRAMEWORK_ASSETS` 同步進 `public/han/`。
- codegen 的 `<script src>` 與「內嵌貼上」兩條路改指它；**npm 那頁維持
  `…/auto`**，交給消費者的 bundler 搭配 `sideEffects` 自己搖。
- 驗證：`han.install.min.js` 仍含 `--han-install` / `registerProperty` /
  `DOMContentLoaded`，且 `transpileRuby`、`uninstallFallbacks` 這些取不到的
  匯出全數消失、`export {` 為 0 個。

### ③ 逐 pass 開關

- `--han-install` 的 `syntax` 由關鍵字 enum 改成 `'*'`，自行切 token；
  `auto` / `fallbacks` / `probes` / `none` 語意不變。新 token：
  `punctuation` / `iss` / `adjacent-lines`。`none` 一律優先。
- console：`fallbacks` 底下四顆子開關（`fbPunctuation` / `fbIss` /
  `fbAdjacentLines` / `fbProbes`），父開關關閉時整組靠 `:has()` 淡出——
  **不寫 `disabled`**，config 層才是控件狀態的唯一寫者。
- codegen：`installTokens()`，四顆全開回 `null`（出廠 `auto`，不輸出宣告）、
  全關回 `'none'`。`--han-install` 排在樣式模組的 gate 之外——它是腳本讀的
  旗標，樣式全關照樣有效。
- 首頁腳本帳：四顆**不動任何數字**，帳上與 console 各有一句話講明這是行為
  開關。

### 驗證到哪裡

瀏覽器實測（載入真的 `han.min.css`，逐 token 比對 DOM 痕跡）：

| `--han-install` | 混排間隙 | 鄰行間距 |
|---|---|---|
| `auto` / `fallbacks` | ✓ | ✓ |
| `none` / `probes` | — | — |
| `iss` | ✓ | — |
| `adjacent-lines` | — | ✓ |
| `iss adjacent-lines` | ✓ | ✓ |

⚠ **標點那道 pass 在這個 fixture 裡從未觸發**——`auto` 也一樣。它的 gate
（原生支援 ＋ 可懸掛的位置）在單行 `<p>` 上不成立，所以這張表只證明了
「逐 token 的分派與 `auto` 行為一致」，沒有證明標點 pass 本身。要真的驗它，
需要一個會產生 `<h-char>` 的版面 fixture——**待補**。
