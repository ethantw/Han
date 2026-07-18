# `--han-font-*` composite 凍結 bug — 調査記錄（2026-07-16）

## 症狀

首頁 `.Manifesto h1` 的 computed `font-family` 是
`HanNone, Palatino, Cambria, HanNone, serif`——CJK／標點字體的 slot 全部卡在
`HanNone` 佔位符，只有 Latin fallback（Palatino, Cambria）跟最終的 `serif`
是真的。

## 根因（一般性原則，不是這次才有的規則）

CSS 自訂屬性的 `var()` 代換，發生在**宣告它的那個元素**的 computed-value
階段——代換完的字串才是往下繼承的東西，不是那串 `var(...)` token 本身繼續
往下傳、讓每個子孫各自重新代換。

`--han-sans`／`--han-serif`／`--han-cursive`（`fonts.css`）與
`--han-font-default`／`-alternative`／`-accent`（`semantics.css`）都是
「comma-join 好幾個 slot 變數」的 **composite**。如果這種 composite 只宣告在
`:where(:root)`：

1. `:root` 沒有祖先，`@container style(--mode: …)` 這種靠祖先容器判斷值的
   規則，在 `:root` 上永遠找不到容器可查——所以 slot 變數
   （`--han-font-cjk-serif`、`--han-font-punctuation-sans`……）在 `:root`
   這一層卡死在 `@property` 的 `HanNone` fallback，不會被任何 per-lang／
   per-mode 規則覆寫。
2. composite 在 `:root` 用這些卡死的 slot 算出一個「污染過」的字串，這個
   字串就是 `:root` 的 computed value。
3. 因為 composite **只宣告在 `:root`**，其他元素沒有自己的宣告，只能
   **繼承** `:root` 那個已經算好、凍結住的字串——不管它們自己的 slot
   變數其實已經正確解出真實字體。

修法：composite 必須宣告在 `:where(*)`（每個元素都算一次），讓每個元素用
**自己**當下有效的 slot 值重新代換，而不是繼承 `:root` 凍結過的結果。

## 這次抓到的兩個實際 bug

1. **`src/css/fonts.css`**——加 `--han-system-ui` 中繼變數那次改動，把組合
   `--han-sans`／`--han-serif`／`--han-cursive` 的規則從 `:where(*)` 寫成了
   `:where(:root)`，跟正上方自己的 comment（解釋「必須是 `:where(*)`」）
   自相矛盾。是這次改動帶進去的真退化。
2. **`src/css/semantics.css`**——組合 `--han-font-default`／`-alternative`／
   `-accent`／`-zhuyin-serif` 的規則，從一開始就只寫在 `:where(:root)`，
   從沒被搬到 `:where(*)` 過，是同一個坑在外面再犯一次。

兩處都改成 `:where(*)` 後，實測 `.Manifesto h1` 的 `font-family` 才真正解析
成完整字體堆疊。

（後來確認：最終方案是把 `--han-font-default` 等四個變數的組合邏輯，直接搬
進 `fonts.css` 自己的 `:where(*)` 規則裡，跟 `--han-sans`／`--han-serif`／
`--han-cursive` 放在一起，一次到位；`semantics.css` 的 `:where(:root)` 只留
一份「沒載入 `fonts.css` 時的靜態 fallback」，本身沒有 per-lang 變化，不受
凍結問題影響。）

## 為什麼 `:where(body)` 不是安全的替代方案

`:where(*)` 唯一的「代價」是每個元素都多算一次 `var()` 代換，成本很低
（zero specificity，custom-property 運算很便宜）。有人可能會想：既然
`:root` 特殊，改成 `:where(body)` 是不是就好、還能省一點？

**不是。** 這些 mode 變數（`--han-punctuation-hant`、
`--han-use-heritage-glyphs-for-hant`、`--han-use-cursive`……）設計上**可以
在任意祖先上覆寫**，不是只能在 `:root`／`body` 設一次。專案裡已經有活生生
的例子——`station-type.html` 的 `.PunctCompare`：

```html
<li style="--han-punctuation-hant: GB">
  <span lang="zh-Hant">…</span>
</li>
```

這是在很深的巢狀節點上覆寫。如果 composite 只宣告在 `:where(body)`，這個
`<li>` 底下的元素不會有自己的宣告，只會繼承 `body` 那份沒被 GB 覆寫過的
composite——三種標點規範對照的 demo 會直接失效。

實測驗證過（`slot`／`--mode` 本身在巢狀 `<div style="--mode: GB">` 下面
正確變成 GB，但只宣告在 root 層的 composite 依然吐出 root 那份 MOE 版本）：

```
root-level（沒被覆寫）: MOE-FONT   ✓
nested-gb（巢狀覆寫成 GB）: MOE-FONT   ✗ 應為 GB-FONT
```

`:where(body)`、`:where(:root)` 都只是把「凍結點」搬到某一層固定的地方，
無法解決「任何一層都可能改變 slot 值」這件事——只有 `:where(*)`（每一層都
重算）才對。

## 未來：CSS `if()` 上了之後，這個結論會變嗎？

`fonts.css` 的 `TODO(css-if)` comment 已經規劃了 slot 賦值規則從
`@container style()` 遷移到 `if(style())` 的方案。這個遷移**會**修掉一件
事，但**不會**修掉另一件事：

- **會修掉**：`@container style()` 讀的是「最近的祖先容器」的值，`:root`
  沒有祖先，永遠查不到——這是 slot 變數在 `:root` 卡死的直接原因。
  `if(style())` 讀的是**元素自己**（繼承後）的值,不需要祖先,所以 slot 變數
  一旦搬進 `if()`,在 `:root` 上也能正確算出真實值,`@container` 的這個限制
  就不存在了。
- **不會修掉**：composite 的凍結問題,跟賦值規則是用 `@container` 還是
  `if()` 完全無關——它是「自訂屬性的值只在宣告它的那個元素算一次、算完的
  字串直接繼承下去」這個更底層的機制,`if()` 不會讓這個規則消失。就算 slot
  在 `:root` 能正確算出真實值,只要 composite 規則只寫在 `:where(:root)`,
  composite 依然只在 `:root` 算一次然後凍結——`.PunctCompare` 那個巢狀覆寫
  一樣會被吃掉。

實測驗證（slot 用 `if()`、composite 跟 slot 全部只放在 `:where(:root)`）：

```
root-level（沒被覆寫）: MOE-FONT   ← 對，if() 讓 slot 在 :root 也生效了
nested-gb（外層巢狀覆寫成 GB）: MOE-FONT   ← 錯！該是 GB-FONT
```

**結論：`if()` 上線後,slot 賦值規則可以从 `@container` 換成 `if()`,不再需要
祖先容器；但 composite（`--han-sans`／`--han-serif`／`--han-cursive`，以及
`--han-font-default` 這一層）永遠要留在 `:where(*)`，不能因為 if() 就搬回
`:where(:root)`。**

## 一句話版本

> Custom property 的繼承,傳的是「算好的字串」,不是「算的公式」。任何
> composite（會 comma-join 好幾個可能因祖先而異的 slot 變數的變數),都得
> 宣告在 `:where(*)`,讓每個元素用自己的祖先鏈重新代換一次——沒有 `:root`／
> `body`／`if()` 這種捷徑可以省略這件事。
