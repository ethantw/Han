# 擠壓與懸掛的 DOM 後備機制——filler ＋ 行緣塌縮，一套原理兩種用法

2026-08-09，自 `lines.with-js.css` 的行間註解整併而來（該檔只留骨架）。
這裡是機制的完整推導與量測；改動那兩個區塊前先讀這份。

## 共同原理：讓 CSS 的「行緣空白塌縮」替我們付錢

兩個後備都不用 JS 量幾何。它們把一顆**真的空白字元**（U+0020，經
`Han Em Space` 校準到已知寬度）塞進 pseudo-element，然後利用 CSS Text
的既有規則：**行首／行尾的可塌縮空白會被移除**。於是同一份標記在行中與
行緣自動長出兩種樣子，切換由斷行位置本身觸發——沒有觀察者、沒有重排監聽。

### 擠壓（標點擠壓，`text-spacing-trim` 後備）

CJK 標點字形在該貼緊鄰字的那一側烤了約 ½em 的空白。行中要保留、行緣與
連續標點之間要吃掉。兩件零件協作：

1. `margin-inline-start|end: -.5em` 無條件把字形拉進去 ½em；
2. `::before`／`::after` 放一顆**隱形的 ½em 空白 filler**（真空白字元，
   `font-size-adjust: ic-width 0.5` 校準），推回 ½em。

行中：−.5 ＋ .5 ＝ 0，看不出來。行首（開括號）：filler 的空白是該行的
行首空白，**被行緣規則塌縮**，只剩負 margin ⇒ 字形貼齊欄邊。行尾鏡射
同理。**沒有 filler 的話，負 margin 會在行中也生效**——修剪就變成全域
擠壓，這是這個設計唯一的支點。

連續標點串（`data-punct~="consecutive"`）只保留串的最外緣修剪，內緣
恢復自然 ½em——否則相鄰標點黏成一團。

### 懸掛（標點懸掛，`hanging-punctuation` 後備）

鏡射同一招：

- `::after` 是一顆 **1em 的隱形 filler**，在欄尾佔住 1em；
- `<h-layer>` 是**零寬的 inline-block**：盒子不佔行內空間，字形從盒子
  溢出、畫在 filler 上面。

行中：filler 佔位、字形蓋上去 ⇒ 視覺原位。恰在這顆標點斷行：filler 的
空白是行尾最後一顆空白，**塌縮**⇒ 1em 從行進方向消失、欄尾收回來；
零寬盒此刻剛好落在欄邊，溢出的字形畫出欄外——這就是懸掛。零寬盒自己
永遠塞得下，斷行器總是偏好 filler 那個較晚的斷點，所以標點不會落到
行首（320→120px 掃寬實測，三引擎）。

**為什麼是 inline-block 不是 abspos**：上一版 abspos 的錨點是行盒邊緣
而不是基線，行盒不對稱長高（如 ja 的上置著重號）時標記跟著飄
（實測 −14px @ line-height 1.75）。全文與修法見
`2026-08-06-hangable-baseline-vs-static-position.md`；`overflow` 必須維持
`visible`——inline-block 一設 overflow，基線就掉到下 margin 邊。

## filler 字體的一課：`size-adjust` 會放大縱向度量，`line-height` 必須釘死

`Han Em Space` 是 `local(Courier)` ＋ `size-adjust: 166.667%`（把 U+0020
撐到 1em 進寬）。CSS Fonts 5 §6.5：`size-adjust` **連縱向度量一起縮放**
——Courier 的 asc/desc ~0.83/0.30em 變成 ~1.38/0.50em。而行內盒的
`line-height: normal` 以**自己字體**的度量解析（≈1.88em），會把
`<h-char>` 的行盒撐得比周圍 CJK 的 strut 高，字形垂直漂移數 px。

修法一行：filler pseudo 上 `line-height: 1`，把縮放怪相封在自己的盒裡。
**通則：placeholder pseudo 只要用了帶 `size-adjust`／`font-size-adjust`
的字體，`line-height` 一律給數值，別信 `normal`。**

## 擠壓 × 懸掛的接縫修理（只在 declared `auto`）

`<h-layer>` 是原子行內盒，而 pair-squeeze 死於原子盒（workspace ledger:
pair-squeeze-and-markup.md）——引擎擠不了懸掛標點**兩側**的鄰居。兩個
修理，各付各的 ½em：

- **後側**（`，「`）：後面的開括號是裸文字節點（原生 trim 路徑）碰不到，
  改由懸掛標點自己付——把自己的 1em filler 換成 ½em 面孔
  （`Han Half Em Space`），後面那顆的整 em 疊上來恰好 1.5em。
  **不能用負 margin**：`text-align: justify` 下負 margin 會拖動標點前的
  正文（24em 欄實測 ~0.45em 漂移）；filler 是誠實佔位的內容，零漂移。
- **前側**（`」，`）：前面的閉括號留在文流裡（`wrapHangablePairs` 把它
  包成帶 `data-followed-by="hangable"` 的普通行內 `<h-char>`），用
  `letter-spacing: -.5em` 付——行尾的 trailing letter-spacing 會被修剪，
  懸掛不受影響，也沒有 justify 漂移（han v3 的老配方）。

兩個修理都閘在 **declared** `auto`（cascade 變數載的是宣告模式，不是
降級後的 `hang`）：明選 `hang` 的人要的是不擠壓的懸掛，`」，` 就該全寬。

## 懸掛開關的推導：為什麼每一支都同時寫 `on` 與 `off`

`--han-state-hanging-punctuation` 由各語言自己的標點慣例變數推導，
規則是「**排除唯一已知置中的 MOE**，其餘（含 `off`＝字形回落本文字體，
形狀未知但多半偏邊）一律懸掛」。`hant` 例外：`off` 時本文字體可由
`--han-use-heritage-glyphs-for-hant` 得知——`webfont`（尚古／源起，置中）
與 `off`（國標系統字，置中）不懸，`system-ja`（JP 慣例，偏邊）懸。

每一支都**明寫 on 與 off 兩個分支**，不能只寫 `on` 讓 `off` 靠「查無
宣告」落出來。原因是 style query 的自查缺口：在某元素上覆寫慣例變數，
該元素自己的 query 問的是**祖先**（仍是舊值），於是它替自己算出過期的
`on`；它的後代 query 正確但從 on-only 規則拿不到任何宣告，只能**繼承**
包裝元素那個錯的 `on`。兩個值都明寫，真宣告永遠蓋過繼承，過期的判定
就漏不過包裝元素那一層。

主開關（refinement 非 auto/hang ⇒ 全域 off）寫成
`not (style(A) or style(B))`——寫成 `not A and B` 不但語法歧義，邏輯也
反了：單值變數的 `A and B` 恆假，`not(…)` 恆真，等於一道靜默的空門。
