# 由 console 勾選算出的打包帳（＋站伍加法式、選擇器輪播）

> 狀態：**已落地**（2026-08-03）。原計畫保留在下，實作時的三處偏離記在文末
> 〈落地紀錄〉。

## 一句話

腳本不再靠 CSS 旗標決定「做什麼」，改回最平常的辦法：**要嘛 auto，要嘛自己
具名匯入**。console 讓讀者勾選要哪幾個函式，站伍即時算出這套組合打包後多大，
並用一條**加法式**把 CSS 與 JS 各項與總和攤開。

## 為什麼撤掉 `--han-install`

8/2 加它時的量測結論是「逐 pass 開關省不了體積」（三道 pass 共用約 6.5KB 的
hyperly ＋ helpers 地板），所以當時定調成「行為開關，不是體積開關」。但那讓
console 上出現一組**勾了也不會變小**的開關——對一個以體積為賣點的站，這是自打
嘴巴。真正能少付的路一直都是具名匯入 ＋ bundler 搖樹，那就讓 console 直接走
那條路。

⇒ 刪 `src/han.install.ts`、`--han-install` 的註冊與解析、`installTokens()`、
console 的四顆子開關、`package.json` 裡 `han.install` 的 sideEffects 條目、
`FRAMEWORK_ASSETS` 與 codegen 的相關分支、以及 `docs/api-js.md` 那一節。
`han.auto.ts` 回到單純的「載入即全套安裝」。

## 要做的四件事

### ① console：auto ／ 具名兩種模式

- 一顆 `jsMode: 'auto' | 'manual' | 'none'`。
- `manual` 時展開函式清單（各自一顆 checkbox），至少涵蓋
  `refinePunctuation` / `applyISS` / `markAdjacentLines` / `runProbes` /
  `transpileRuby` / `uninstallFallbacks`。
- codegen 依此輸出 `import { … } from '@hanzi.pro/han.css'` ＋ 呼叫，而不是
  `--han-install` 宣告。

### ② 每個函式的**邊際體積**要 build 期實測

這是唯一有技術風險的一步。組合是 2ⁿ，不可能每種都預先打包，所以改成**測地板
＋ 測邊際**：

- 對每個函式各打一次「只 import 它並呼叫」的 entry，得 `size(f)`；
- 另打一次空殼（只 import hyperly）得 `base`；
- 邊際 `Δf = size(f) − base`。

站上顯示的就是 `base + ΣΔf`。**這是估計值，不是實測合計**（函式間共用的
helper 會被重複計入），所以誤差方向是**高估**——寧可報大不報小。實作時要：

- 在加法式旁註明「估計，實際 bundler 會再搖掉共用部分」；
- 另外打一次「全選」的真實 bundle 作為上界校正，若 `base + ΣΔ` 與實測差超過
  ~15%，build 期就 warn，不要放著漂。

已知數字（8/2 實測，brotli）：hyperly 地板 4.1KB；單一 pass 6.8–7.9KB；
三道 pass ＋ probes 合起來 8.4KB。所以 Δ 落在 0.2–1.0KB，地板佔絕大部分——
**加法式必須把地板單列一行**，否則讀者會以為勾掉一個函式能省很多。

### ③ 站伍：CSS ＋ JS 的加法式

取代現在「兩本帳各自結算 ＋ 一行合計」的排法：

```
han-semantics   1.0KB
han-lines       0.8KB
han-prose       0.4KB
han-fonts       1.2KB
hyperly 地板    4.1KB
refinePunctuation +0.4KB
applyISS          +0.9KB
─────────────────────
合計            8.8KB
```

- 未勾選的項目仍然列出、置灰，且不進加總（沿用現行 `data-off` ＋ `ledger.js`
  的作法：數字從印在格子裡的文字讀回來加總，不另存一份在 JS 裡）。
- 三種壓縮（未壓／brotli／gzip）維持，單位一律大寫 KB／MB。
- **SSR 註記排在加法式後面**，並改寫成下面這版（擁有者定稿，2026-08-03）：

  > 雖然JS體積小，但在客戶端渲染必然有swap的現象。最佳做法是靠SSR讓文字在後端
  > 就變成漢.css可用的格式，如此還能省下客戶端的JS體積與請求數。惟React、Vue等
  > 需要重渲染的前端框架，仍需在mount後執行JS。

  兩個實作時要留意的分寸：

  1. **「必然」要斟酌。** 三道 pass 在瀏覽器裡都是 gated 的——原生支援時 JS 根本
     不動手，也就沒有 swap。準確的說法是「凡是 JS 真的要動手的地方，客戶端渲染
     就會有一次改版重排」。要嘛照這個意思調整，要嘛在別處講清楚 gate 的存在，
     不要讓讀者以為載了 JS 就一定閃一下。
  2. **「swap」是借 font-swap 的詞。** 對照 FOUT 能懂的人會秒懂，但中文讀者未必
     連得上；文案定稿時考慮補半句白話（「插入包裹造成的那一次重排」）。
- 字體帳維持獨立，不進這條加法式。

### ④ 選擇器輪播

式5.1 底下的例子改成可切換的一組，讓「任意選擇器」這個全稱量詞看得見。

- **讀者驅動，不自動輪播。** 那一行是要讀的算式，不是跑馬燈；
  `prefers-reduced-motion` 下連轉場都不做。
- 權重三元組**build 期實算**（把 `docs/notes/2026-08-02-where-specificity-census.md`
  那支普查腳本接進 `vite.config.js`），不寫死。
- 候選（跨模組、形狀差異大）：

  | 選擇器 | 權重 | 出處 |
  |---|---|---|
  | `:is(u, ins, cite:lang(zh)):has(+ u, + ins, + cite:lang(zh))` | (0,2,2) | 書名號乙式鄰行間距 |
  | `[data-adjacent-lines-refined] :where(u,ins,s,del,cite):not([data-followed-by-adjacent-line])` | (0,2,1) | JS 標記過的子樹 |
  | `:lang(ko):not(:lang(ko-Hant))` | (0,2,0) | 非漢字韓文引號 |
  | `h1:has(+ h2, + h3, + h4, + h5, + h6, + blockquote, + p, + ol, + ul, + section)` | 待算 | **prose**・連續標題 |
  | `ruby:is(.zhuyin, .mps), ruby:has(> rt:is(.zhuyin, .mps))` | (0,1,1) | 注音 ruby |

  prose 採用擁有者提的連續標題那條，而不是 `:first-child`：輪播要展示的是
  「再長再兇的選擇器也一樣歸零」，**長度就是說服力**，那條光看就夠嚇人。

## 順序

②→①→③→④。② 是唯一有不確定性的，先把數字生出來，其餘都是接線。

## 收尾時要一併處理的既有債

- `console.html` 的 `<option value="KV" selected>` 沒跟上 `DEFAULTS` 的 `'KLR'`
  ——a11y e2e 兩條紅燈的根因（`↺` 按鈕永久顯形 → nested-interactive）。
- homepage-v2 的 watermark 一條仍紅（station-semantics 那批改動）。
- ~~首頁 lede「一百〇九個〇」是舊量測~~ **已處理（8/3）**：改成一百一十三個〇
  ／113，五語同步。量測腳本 `build/census.js`（不依賴 postcss，可直接
  `node build/census.js`），發布前再跑一次即可。
- dev 模式下 `_moduleLedgerCache` 會把帳目凍在 server 起來那一刻，改了格式要重啟
  才看得到——這輪順手處理掉。


## 落地紀錄（2026-08-03）

四步都做完了。三處偏離原計畫，都是量了之後才知道非改不可：

### ② 改成 2ⁿ 全打包，不做邊際估計

計畫要的「地板 ＋ ΣΔ」有兩個破口：

- `runProbes` 根本不引 hyperly（單獨打包 0.41KB），對地板的邊際是**負的**；
- `refinePunctuation` 與 `applyISS` 共用約 1.5KB 的 line-adjustment helper，
  兩者相加比實測的組合高估 20%——超過計畫自己設的 15% 警戒線。

但實測發現**所有組合全部真打包只要不到兩秒**（esbuild 共用一個 service
process），於是改成打完整查表：`build/pass-sizes.js` 產出
`dist/pass-sizes.json`，每一種選擇都對應一個真的存在過的 bundle。估計誤差這
一整類問題就此消失，加法式也才真的加得起來。

`build/library.js` 在 prod build 尾端呼叫它；`manual/vite.config.js` 讀它取
地板數字；`home/ledger.js` 執行期讀它算鏈式拆解。

### 併掉 `runProbes`（擁有者中途指示）

探針只剩 `detectAutospaceBoundaryBug` 一支，而讀它的只有混排間隙那一道 pass，
所以它併回 `applyISSWithProbe`，不再單獨匯出、不上 console、不進加法式。
console 的 `iss` 那一格因此改指 `applyISSWithProbe`——不然讀者自選 `applyISS`
會靜默失去 Safari 的修正。可選函式從六支收成五支，組合數 63 → 31。

### 加法式的合計改為「重讀印出來的那一欄」

原本合計是拿未四捨五入的 KB 相加，與印出來的一位小數逐列相加差了 0.1KB。現在
footing 掃 `tbody tr:not([hidden]):not([data-off])` 把格子裡的數字讀回來加，
所以讀者自己用手加也會得到同一個數，且「置灰」與「不計入」在實作上是同一件事。

### 其餘

- ④ 的權重改由 `manual/_specificity.js` 於 build 期實算（Selectors-4 §17，
  `:is()`／`:has()`／`:not()` 取引數中最重的一支、`:where()` 恆零），填進
  `<code data-spec>`。輪播五條的權重 (0,2,2)／(0,0,2)／(0,2,1)／(0,1,2)／
  (0,2,0) 全部與普查筆記對得上。
- 版面上，計畫說的「取代兩本帳」照做了：`.LayerMap` 四張卡與 `.ScriptLedger`
  合併成單一 `.Sum` 加法表，字體帳仍獨立。
- 既有債清掉三項：console 的 `KV` → `KLR` 補完（a11y 兩條紅燈轉綠）、
  `openGroupOf`／`openScriptSpecifics` 兩個測試 helper 改成等到元件掛載再判斷
  開合（原本 `:not([open])` 在「已經開著」時匹配不到而空等到逾時）、
  `webfonts-genki-gothic` 改為實際的套件名 `webfonts-genki-sans-yue`。
  chromium e2e 由 15 紅收到 8 紅，剩下的八條在 HEAD 上同樣是紅的
  （首頁 hero／lead-forme 一族與 watermark），與這輪無關。
- 仍未處理：watermark、首頁 lede「一百〇九個〇」的重數、dev 模式
  `_moduleLedgerCache` 的凍結。
