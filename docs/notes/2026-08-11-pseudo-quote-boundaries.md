# pseudo 生成的引號與標點擠壓／懸掛——量測與結論

2026-08-11。`<q>`／`<cite>` 的括號來自 `::before`／`::after`
（`content: open-quote`），DOM 裡沒有那個字元，所以 `refinePunctuation`
在那些接縫上的每一個判斷都少算一個字。這份記的是**量測**，以及量測把修法
的範圍縮到多小。同期的機制推導見
`2026-08-09-hang-compress-dom-mechanism.md`。

## 結論先講

1. **pair-squeeze 完全跨得過 pseudo 邊界**——所以「pseudo 打斷擠壓」這個
   假設是錯的，不需要為它補任何東西。
2. **`trim-start` 對 pseudo 生成的開括號與真字元行為一致**——行緣修剪在原生
   引擎上不需要補。
3. **真正壞掉的只有兩件事**：JS 對「後面是不是閉括號」的判斷（誤把
   `<q>…。</q>` 的句號判成可懸掛），以及 `<h-layer>` 這個原子盒本來就會打斷
   的那半個 em——後者與 DOM 鄰居的情況完全同型，用同兩套既有機制付帳即可。

## 方法

Chrome headless（`--headless=new`）＋本機 `http.server`，
`--virtual-time-budget=15000 --dump-dom`，`document.fonts.ready` 之後用
`getBoundingClientRect()` 讀寬度。字體 `NotoSansCJKtc-VF.otf`（有 `chws`，
且漢字與標點同一支，滿足 Chrome han_kerning 的字體一致性閘）。
`font-size: 100px`，於是 0.5em ＝ 50px，捨入誤差不存在。

基準線用 **`text-spacing-trim: space-all`，不是 `normal`**——`normal` 並非
「不修剪」（workspace ledger: `pair-squeeze-and-markup.md`）。正對照
（同一個文字節點裡的 `，「`、`」「`）都由 200 縮到 150px，證明整組裝置有效；
沒有這個正對照，全部 null result 會被誤讀成「pseudo 擋住了擠壓」。

## M2 — 擠壓跨不跨 pseudo 邊界

| 形狀 | space-all | normal | Δ |
|---|---|---|---|
| `，「` 同一文字節點（正對照） | 200 | 150 | 50 |
| `，` ＋ `q::before{'「'}` | 300 | 250 | 50 |
| `，<span>「字</span>`（純元素邊界） | 300 | 250 | 50 |
| `」「` 同一文字節點（正對照） | 200 | 150 | 50 |
| `q::after{'」'}` ＋ `「` | 300 | 250 | 50 |
| `cite::after{'》'}` × `q::before{'「'}` | 400 | 350 | 50 |
| 上列第二式再多包一層 `<span>` | 300 | 250 | 50 |

進 `::before`、出 `::after`、pseudo 對 pseudo、隔一層包裝元素——**每一種都
恰好擠壓 0.5em，與同節點對照逐像素相同**。只要維持普通行內流，生成內容不是
擠壓的屏障。

## M1 — 生成的開括號在行首會不會被修剪

5em 欄，五個漢字填滿第一行，`「` 開第二行；量它**後面那個字**距欄左緣的 x
（未修剪 ＝ 100px，修剪 ＝ 50px）。

| | space-all | trim-start |
|---|---|---|
| `「` 是真文字節點字元 | 100 | 50 |
| `「` 來自 `q::before` | 100 | 50 |

一致。

## M3 — 原子盒誤判，pseudo 版

行中的 `「`＋`字`（未修剪 200px），祖先設 trim 模式：

| q 的 display | space-all | trim-start |
|---|---|---|
| `inline` | 200 | 200 |
| `inline-block` | 200 | **150** |

**原子行內盒的起邊被當成行首**這個既知誤判（手冊
`station-semantics.css` § 乙式 踩過），對生成內容一樣成立。han.css 的
`<cite>`／`<q>` 目前是 `display: inline`，安全——**但這是一條會被無意破壞的
不變式**：任何人為了 transform 或裝飾把它們改成 `inline-block`／`-flex`，
行中的開括號就會被削成半形，而且不會有任何錯誤訊息。

## 修法為什麼是「JS 記結構、CSS 判模式」

`--han-cite-title-marks` 是 `inherits: true` 的 `@property`（預設 `none`），
手冊與 playground 會即時切換；`q` 的 CJK 括號還依 `:lang()` 而定
（`zh-Hans` 用 `“”`）。JS 不可能凍結這兩件事，所以
`markQuoteBoundaries`（`src/ts/line-adjustments/quote-boundary.ts`）只記
**結構事實**——`data-followed-by-quote`，由近而遠列出每一層生成者——CSS 再用
`~=` 做 OR，配上 mode 與 lang 的閘決定當下哪一層真的畫。與
`markAdjacentLines` 對 `<cite>` 波浪線的分工同型。

**刻意沒做：把引號實體化進 DOM。** 讓 JS 讀 `quotes` ＋ 自算巢狀深度、插入真的
`<h-char>` 再 `content: none` 關掉 pseudo，會讓上述問題**全部**消失，連複製
貼上都會帶引號。不採用有三個理由：模式反應性歸零（每次切換都要重跑並回收
節點）、改變 `q.textContent`（作者腳本與 AT 讀到的東西都變了）、SSR 拿不到
cascade 只能猜。記在這裡是為了讓下一個人不要「修好」它。

## 附帶發現：hyperly 的比對會跨元素邊界

`<q>今天真好。</q>、然後` 裡的 `。` 與 `、` 會被當成**同一串連續標點**
（`data-punct~="consecutive"`、`data-consecutive-pos`），因為 hyperly 是在
攤平後的文字上比對的——但畫面上它們之間隔著一個 `」`。此例中「不可懸掛」的
結論恰好正確（`」` 本來就擋），但 run 的分類本身是錯的。影響僅限於 fallback
引擎裡連續串內緣 trim 的取消與否，目前未修；真要修得讓標點 pass 自己認得
元素邊界，成本遠高於收益。
