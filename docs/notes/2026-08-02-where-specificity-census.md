# `:where()` 權重普查 — 拆掉包裝後最重的幾個選擇器

給站伍（工法）展示用的素材。主張是「漢.css 放棄所有樣式的選擇器權重」，這份
清單回答的是：**如果沒放棄，最重的會是誰。**

量測日 2026-08-02，對象是 `dist/han.{semantics,lines,prose,fonts}.css`
（build 產物，含巢狀已展開）。腳本見文末。

## 方法：`:where(` → `:is(`，不是把它刪掉

`:where()` 與 `:is()` 匹配完全相同，差別只有一個——`:where()` 的權重恆為零。
所以「這個選擇器本來會有多重」＝ 把包裝改名成 `:is(` 再算。

**不可以用文字刪除。** `:where()` 常常只是複合選擇器的一部分：

```css
:where(h1, h2, h3, h4, h5, h6):is(:first-child)
```

刪掉包裝會變成 `h1, h2, …, h6:is(:first-child)`——一個**七個分支、且只有最後
一支帶 `:first-child`** 的選擇器，跟原本那個完全不是同一件事。改名則保持分組。

## 拆掉之後最重的七個

| 權重 | 選擇器 | 它在做什麼 |
|---|---|---|
| **0,2,2** | `:where(:is(u, ins, cite:lang(zh)):has(+ u, + ins, + cite:lang(zh)))` | 書名號**乙式**（波浪線）下，相鄰兩個標題之間補回被 `text-decoration-inset` 吃掉的間隙 |
| **0,2,1** | `:where([data-adjacent-lines-refined] :where(u, ins, s, del, cite):not([data-followed-by-adjacent-line]))` | JS 標記過的子樹裡，**沒有**鄰行的那些line收回間隙 |
| **0,2,0** | `:where(:lang(ko)):where(:not(:lang(ko-Hant)))` | 韓文（非漢字韓文）的引號改用西式彎引號 |
| **0,2,0** | `:where(:root):where(:lang(zh), :lang(ja), :lang(ko))` | 三個文種的根字體堆疊 |
| 0,1,2 | `:where(ruby:is(.zhuyin, .mps)) > rt` | 注音 ruby 的注音本體：字體 ＋ 直立字向 |
| 0,1,2 | `:where(h-iss[data-mode=replace])::before` | 原生 `text-autospace: replace` 可用時，撤掉 JS 補的混排間隙 |
| 0,1,2 | `:where(blockquote):is(:lang(zh), :lang(ja), :lang(ko)) :where(dfn, i, var)` | 引用段落內的 `dfn`／`i`／`var` 拉回正文字體 |

**第一名適合當展示主角。** `(0,2,2)` 的來源可以逐項拆給讀者看：

```
:is(u, ins, cite:lang(zh))          → 取最重的分支 cite:lang(zh)   (0,1,1)
:has(+ u, + ins, + cite:lang(zh))   → 取最重的分支 + cite:lang(zh) (0,1,1)
                                       ────────────────────────────
                                                                   (0,2,2)
```

`(0,2,2)` 比一個 class 重一倍有餘。它現在是 `0`；拆掉包裝，作者寫的
`.my-cite { margin-inline-end: 0 }` 就壓不過它了。

## 順帶查到的兩件事

### ① 「一百〇九個〇」是舊數字

現況：選擇器分支 **136** 個（去重 74），權重確實是 `(0,0,0)` 的 **111** 個
（去重 51）。CSS 有增減，這個數字會一直漂。**發布前重跑一次腳本、統一文案。**
已記進 `docs/plans/v4-rc-plan.md` 的發布前檢查。

### ② 有 25 個分支不是零，其中一個會真的跟作者打架

不是零的分兩類：

- **`h-char[data-punct]…` 一族**（`lines.with-js.css`），最重到 `(0,6,2)`。
  它們選的是 han.js 自己生出來的 `<h-char>`，作者不會寫這種標籤，所以
  「不跟你的 CSS 打架」精神上仍然成立。
- **`prose.css` 的兩處 `:is()`**，這個會打架：

  ```css
  :where(h1, h2, h3, h4, h5, h6):is(:first-child)          /* (0,1,0) */
  :where(blockquote):is(:lang(zh), :lang(ja), :lang(ko))   /* (0,1,0) */
  ```

  `(0,1,0)` **贏過**作者寫的 `h2 { margin-block-start: … }`（0,0,1）。站伍
  英文文案那句「one line of your own `h2 { }` overrides the whole framework」
  對 prose 模組的這幾條不成立。

  **已改**（2026-08-02）：兩處都換成 `:where()`。改前確認過沒有東西靠這個權重
  贏——標題那條是七個分支共用一條宣告、其餘六支本來就是零，`margin-block-start`
  在 prose 裡只有這一處；blockquote 的 `font-family` 在其他模組沒有競爭者，巢狀
  的 `:where(dfn, i, var)` 跟著等量下降、相對順序不變。零的分支 111 → 115。

## 目標：全部歸零（待辦）

擁有者定調：**權重要全部是 0。** 現況離目標還有 21 個分支：

### 十五個 `h-char` 一族（`lines.with-js.css`）——可以歸零

最重 `(0,6,2)`。純粹是沒包 `:where()`，包上去即可，匹配不變。要留意的是這一族
規則彼此之間**靠權重分勝負**（`[data-punct~=open]` 疊在 `[data-punct]` 之上、
`consecutive` 又疊在其上），全部歸零之後就只剩「源碼順序後者勝」——所以不能
無腦包，得逐條確認現有順序已經是由寬到窄，必要時重排。**這是真正的工作量所在。**

### `> rt` 可以歸零——但不是 `:where(> rt)`

擁有者提的寫法，三家引擎實測（`CSS.supports('selector(…)')`，Chromium／
WebKit／Firefox 一致）：

| 寫法 | Chromium | WebKit | Firefox |
|---|---|---|---|
| `:where(> rt)` | ✘ | ✘ | ✘ |
| **`:where(& > rt)`** | **✓** | **✓** | **✓** |
| `:where(a::before)` | ✘ | ✘ | ✘ |
| `:is(a::before)` | ✘ | ✘ | ✘ |
| `:where(&::before)` | ✘ | ✘ | ✘ |

`:where()` 收的是 `<complex-selector-list>`，**不收前導組合子**——收相對選擇器
的只有 `:has()`。但巢狀裡的 `&` 是合法的複合選擇器，所以 `:where(& > rt)`
成立、且權重為零。**`semantics.css` 那條 `> rt` 該這樣改。**

### 四個 `::before` / `::after`——真的歸不了零，但也輸不掉

```
:where(q)::before   :where(q)::after
:where(h-iss)::before   :where(h-iss[data-mode=replace])::before
```

偽元素**不允許**出現在 `:is()` / `:where()` 內（三家一致拒絕），而規則只要帶
`::before`，`c` 就至少是 1。這四個沒有辦法。

不過它們**不構成問題**：任何要跟它們爭同一個偽元素的作者規則，自己也必然帶
一個 `::before`（`q::before` 是 (0,0,2)、`.mine::before` 是 (0,1,1)），本來就
贏；就算寫成 `*::before` 打平，作者的宣告未分層、照樣勝出。

⇒ 終點是「**15 個 `h-char` ＋ 1 個 `> rt` 歸零，4 個偽元素殘留 `(0,0,1)`**」。
文案寫準：作者寫得出來的選擇器全數放棄權重；剩下的 1 是偽元素的地板，而且
那個 1 從來贏不過任何一條作者規則。

## 重跑

```js
// 每個規則展開巢狀 `&` → 逐分支算權重；`:where(` 改名 `:is(` 得到「本來的重量」
// :is()/:not()/:has() 取其引數中最重的一支
node <this-script> dist/han.semantics.css dist/han.lines.css dist/han.prose.css dist/han.fonts.css
```

腳本用 postcss 解析（`node_modules/.pnpm/postcss@*`），兩個容易踩的地方：

1. **算「現況權重」時 `:where(…)` 要連內容一起刪**，不能當普通偽類算——否則
   每個選擇器看起來都非零（第一版就是這樣錯的，111 個零被算成 0 個）。
2. **`:where()` 內的逗號是選擇器列表**，展開後要逐支排名，不能把整串當成一個
   選擇器加總——否則會得到 `(0,4,0)` 這種把三個選擇器加在一起的假數字。
