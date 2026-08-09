# 層先於權重：為什麼庫級 class 不給權重，以及真正護得住排版的是什麼

2026-08-09。起因：開發者一句 `ruby { ruby-position: under }` 會把注音的
標音位置翻掉，於是議「`.zhuyin`／`.poem-like` 這些庫級 class 是否該保留
權重 1、不進 `:where()`」。**否決**；本文記下實測依據與劃線原則，
免得下次重議時從頭再量。

## 核心事實：勝負在層，不在權重

CSS 比較兩條規則是過關制——先比 `@layer`（未分層永遠贏過分層），同層才比
權重，同權重才比先後。han.css 六個出貨 bundle 全部包在 `@layer han-*` 裡，
所以對上開發者未分層的日常 CSS，**第一關就輸定了，權重是第二關的事，
輪不到**。實測矩陣（Chromium，`ruby-position` 誰贏）：

| 開發者寫法 | 庫＝`:where()` (0,0,0) | 庫＝改成 (0,1,0) |
|---|---|---|
| `ruby{}` 未分層 | 開發者 | **開發者（提案救不到）** |
| `ruby{}` 寫進 `@layer han-semantics` 內 | 開發者 | 庫 |
| `ruby{}` 在 han 之後的層 | 開發者 | 開發者 |
| `ruby.zhuyin{}` 未分層 | 開發者 | 開發者 |

給 class 權重只改變「開發者鑽進我們的層裡寫」那一格——現實中不存在的寫法。

## 「那把注音規則挪出 @layer？」——擋得住，但代價找錯人付

未分層＋(0,1,0) 的庫規則確實贏過隨手一句 `ruby{}`（實測）。但同一條
「未分層贏過分層」不分敵我：**全站分層的開發者（最守紀律的那群）寫在
`@layer app` 裡的覆寫一條都打不進來**，只能破壞自己的架構或上 `!important`。
且保護依載入方式而異：`@import url(han.css) layer(vendor)` 會把未分層規則
**折進 vendor 層**，保護蒸發（實測：`<link>` 擋得住、`layer()` 擋不住）。
時靈時不靈的保證比沒有保證難除錯。否決。

## 劃線原則（既有的，確認自洽）

全庫 134 條選擇器分支、116 條零權重；**非零的全部是 JS 生成的私有標記**
（`h-char`／`h-iss`／`h-layer` 及 pseudo-element）。原則：

> 權重只留給**只有我們會寫的標記**；開發者打在自己 HTML 上的東西
> （`.zhuyin`／`.mps`／`.poem-like`）一律歸零——那是他的地盤。

## `@layer` 與 `:where()` 各管一半，砍誰都漏

- `@layer` 保證「開發者贏我們」——但它是**檔案的**性質。
- `:where()` 保證「贏得便宜」（同層對決一句 (0,0,1) 就通）、庫內部勝負只由
  書寫順序決定（加規則不必為了贏舊規則加長選擇器）、且是**每條規則自帶**
  的性質——規則被複製走、層被工具鏈攤平時，只有它跟著走。

## 真正的解法（已做）

1. `over` 模式明寫 `ruby-position: over`（semantics.css）——不是為了贏，
   是讓位置主張存在於一條看得見的宣告裡，被蓋時 devtools 有東西可回溯。
2. 文檔補**層序配方**（install.md 兩語）：reset 收進 han 之前的層，
   誤傷消失（實測 `* { margin: 0 }` 清掉詩行縮排 0px → 收層後 32px 回來），
   真心要蓋的寫 `app` 層照樣蓋得掉。
3. 文檔補**瞄準配方**（install.md＋semantics.md）：`ruby:not(.zhuyin, .mps)`。

## 週邊實測，反覆會用到

- **Chromium 今天對這句誤傷免疫是暫時的**：它還沒支援原生 `ruby-position:
  inter-character`，走 abspos 後備，`ruby-position` 打不動 abspos 的 `rt`。
  原生一落地就與 WebKit 同病（實測 WebKit：注音 Δy 2px → 22px，掉到字下）。
  兩個實驗旗標都測過，今天無法在 Chromium 預演；WebKit 就是預演。
- **把 `ruby-position` 宣告在 `<rt>` 上救不了**：三引擎計算值都變、
  **版面全不動**——該屬性作用於 ruby annotation container，`rt` 上的宣告
  到不了。標準的靜默失效形狀。
- **`@container style() { & { … } }` 巢在規則裡是合法且生效的**
  （Chromium／WebKit 實測落地；Firefox 整族 `style()` 查詢未支援，
  Bugzilla 1795622，與 `& {}` 無關）。真正的陷阱是元素**查不到自己**的
  custom property——query 永遠問祖先，變數設在被選元素自身上不會中。
