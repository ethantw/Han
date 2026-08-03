# 由 console 勾選算出的打包帳（＋站伍加法式、選擇器輪播）

> 狀態：**待審**。2026-08-03 擬。動工前請先過目——這份計畫會撤掉 8/2 才做進去的
> `han.install` 與 `--han-install`。

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
- **SSR 的那一句註記排在加法式後面**（現行文案照用：「寫成SSR也可以，如此甚至
  不需要客戶端的JS。惟不適合React／Vue等需要重渲染的框架。」）。
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
- 首頁 lede「一百〇九個〇」是舊量測，現況 135 分支／116 個零；發布前重數並統一
  五語。
- dev 模式下 `_moduleLedgerCache` 會把帳目凍在 server 起來那一刻，改了格式要重啟
  才看得到——這輪順手處理掉。
