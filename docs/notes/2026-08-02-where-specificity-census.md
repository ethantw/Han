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

  兩條路：把那幾個 `:is()` 也換成 `:where()`（匹配不變、權重歸零），或把文案
  的說法收窄。**尚未決定，未動。**

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
