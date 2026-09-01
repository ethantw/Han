# `lang` 字體邊界契約：computed value、CSS `if()` 與 API 路線

**日期**：2026-09-01

**分支**：`v4/main-rewrite`

**起點**：`manual/demo/ruby-readings.html` 的四語標題

## 結論

原始案例不是核心規則壞掉，而是 demo 把四個**互斥的標題版本**包成同一個
`<h2>` 裡的四個 language spans。`h2` 的 alternative declaration 落在祖先，
`[lang]` 的 default declaration落在子元素；local declaration 本來就優先於
inherited value，兩者的 specificity 無從競爭。

正確 markup 是讓每個語言版本自己成為帶 `lang` 的 `<h2>`：

```html
<h2 class="story-title" lang="zh-Hant">…</h2>
<h2 class="story-title" lang="ja">…</h2>
<h2 class="story-title" lang="ko">…</h2>
```

```css
.story-title {
  font-family: var(--han-font-alternative);
}
```

han.css 的 `[lang]` font rule 是零 specificity；`.story-title` 在同一元素上自然
勝出，同時 `--han-font-alternative` 會用該元素自己的 MOE／JIS／KLR slots 解析。
因此保留全域 `[lang] { font-family: var(--han-font-default) }`：它是「顯式語言
邊界預設回到該 locale 正文字體」的公開設計，不移除，也不新增 `--han-font` API。

真正的 inline foreign-language run 仍遵守同一契約：若祖先使用非 default stack，
作者要讓 selector 同時命中該 `[lang]` boundary：

```css
.story-title,
.story-title :where([lang]) {
  font-family: var(--han-font-alternative);
}
```

原始閩南語標記 `nan-Hant-TW` 沒進 `:lang(zh)`，才看似「剛好正常」；但這個 tag
本身是正確的。曾考慮用 `zh-min-nan-Hant-TW` 強迫它進 zh rules，查核 BCP 47 後
否決：`zh-min-nan` 是已 deprecated 的完整 grandfathered tag，Preferred-Value
是 `nan`，不能再附加 `Hant`／`TW`。因此漢字、Bopomofo、Latin 分別保留
`nan-Hant-TW`、`nan-Bopo-TW`、`nan-Latn-TW`；是否讓 han.css 明確支援
`:lang(nan)` 另案設計。

下方 computed-value 與 `if()` 實驗仍是有效的機制研究，但其中「移除 `[lang]`
reset」與「導入 `--han-font`」的設計提案均已否決，不是 implementation plan。

## 原始重現（保留作機制分析）

頁面標題的外層：

```css
h2 {
  font-family: var(--han-font-alternative);
}
```

內容依序有：

```html
<span lang="nan-Hant-TW">…</span>
<span lang="zh-Hant-TW">…</span>
<span lang="ja">…</span>
<span lang="ko">…</span>
```

現行核心規則位於 `src/css/semantics.css`：

```css
:where(:root, body, [lang]):where(:lang(zh), :lang(ja), :lang(ko)) {
  font-family: var(--han-font-default);
}
```

實測結果：

| 節點 | computed stack 的角色 |
|---|---|
| `h2` | Serif MOE／Shanggu Serif |
| `nan-Hant-TW` | 繼承同一份 serif stack |
| `zh-Hant-TW` | Sans MOE／Shanggu Sans |
| `ja` | Sans JIS |
| `ko` | Sans KLR |

這不是尚古缺字或 font fallback 選錯，而是 `[lang]` 上有一條新的
`font-family` declaration；local declaration 永遠先於 inherited value，zero
specificity 並不會讓 inheritance 反過來勝出。

## 根因：繼承的是結果，不是公式

`--han-serif` 等 composite 會連接 punctuation、Latin、CJK 與 generic slots：

```css
--han-serif:
  var(--han-font-punctuation-serif),
  var(--han-font-latin-serif),
  var(--han-font-cjk-serif),
  serif;
```

Custom property 裡的 `var()` 在**宣告該 property 的元素**進入 computed-value 階段
時代換。往子孫繼承的是代換後的 computed token stream，不是仍可在子孫重新執行的
公式。`font-family` 本身也繼承父元素的 computed value。

所以兩個需求形成拉扯：

- `font-family: inherit` 能保留祖先的角色或作者 stack，但拿到的是祖先 locale
  已算好的整串，日韓不會換成 JIS／KLR slots。
- `font-family: var(--han-font-default)` 能在子元素以自己的 slots 重算，卻已先把
  角色選成 default。

規格依據：

- [CSS Custom Properties Level 1](https://www.w3.org/TR/css-variables-1/)
- [CSS Cascading and Inheritance Level 5](https://www.w3.org/TR/css-cascade-5/)
- repo 既有調查：
  [`2026-07-16-font-composite-freeze-bug.md`](2026-07-16-font-composite-freeze-bug.md)

## 為何原本的 `nan-Hant-TW` 剛好沒事

`:lang(zh)` 以語言 range 比對；`nan-Hant-TW` 的 primary language subtag 是
`nan`，不是 `zh`，所以不匹配目前的 zh／ja／ko 重設規則。它只是繼承
`h2` 已解析的繁中 MOE serif stack，恰好同時符合這個 demo 想要的角色與字形。

這不是閩南語已有獨立的 locale 重算機制，而是 `:lang()` 不會依 IANA 的
macrolanguage metadata 推論 `nan` 屬於 `zh`。`nan-Hant[-TW]` 是正規推薦寫法，
但它不匹配 `:lang(zh)`；若 han.css 要把它當作繁中排版目標，必須在規則中明寫
`:lang(nan)`，不能改造 language tag 來配合 selector。

IANA registry 同時記錄：`zh-min-nan` 已於 2009-07-29 deprecated，Preferred-Value
為 `nan`；`nan` 可作 primary language，另有 prefix 為 `zh` 的 extlang 記錄。
因此 `zh-nan-Hant-TW` 是可解析的相容形式，但 RFC 5646 與 W3C 都優先推薦較短的
primary form `nan-Hant-TW`。參考 [IANA Language Subtag Registry](https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry)、
[RFC 5646 §2.2.2](https://www.rfc-editor.org/rfc/rfc5646.html#section-2.2.2) 與
[W3C Choosing a Language Tag](https://www.w3.org/International/questions/qa-choosing-language-tags#extlangsubtag)。

## 影響範圍

| 情境 | `han.css` | `han.basic.css` |
|---|---|---|
| boundary 未另指定字體 | 回到當地 locale 的 default stack | 回到 generic default stack |
| 同一 boundary 指定 alternative | MOE／JIS／KLR serif slots | generic serif |
| 同一 boundary 指定 accent | 各 locale cursive slots | generic cursive |
| 同一 boundary 指定作者 stack | 作者 selector 勝出，原樣使用 | 同左 |
| 只有祖先指定非 default | boundary 的 local default 勝過 inherited value | 同左 |

`han.basic.css` 不含 `fonts.css`，所以沒有完整 bundle 的 locale punctuation／CJK
webfont slots；但它仍保留相同的「顯式 CJK `lang` boundary 預設回到 default」
語義契約。兩個 bundle 的必要差異是解析結果（locale-aware stack 對 generic
stack），不是作者 API。需要非 default 字體時，兩者都在帶 `lang` 的同一元素
重申即可。

## 實驗

### 三引擎的 computed-value 行為

用 Playwright Chromium、WebKit、Firefox 建立記憶體頁面，比較四種邊界規則：

1. 現況 default 重宣告。
2. `font-family: inherit`。
3. 祖先先寫 `--current: var(--han-font-alternative)`，邊界再消費
   `var(--current)`。
4. 邊界明寫 `var(--han-font-alternative)`。

三引擎的第 2、3 項都把同一份祖先 serif computed string 傳給 zh／ja／ko；替
custom property 再包一層不會延後解析。第 4 項只有在邊界已知角色時，才可能以
當地 slots 重組。

Chromium／WebKit 的第 4 項得到：

```text
zh-Hant-TW → Diantenjeom Serif MOE … Shanggu Serif … serif
ja         → Diantenjeom Serif JIS … serif
ko         → Diantenjeom Serif KLR … serif
```

Playwright Firefox 在現行 fonts architecture 的 custom-property container style
queries 上另行退回 `HanNone` slots；這是既有 feature-support degradation，與本篇
的 role provenance 缺失是兩個問題。它仍同樣證實：`inherit` 與中繼 custom
property 只會傳遞已算好的字串。

### 修正 demo 結構後的 production computed stacks

production build 以每個翻譯各自帶 `lang` 的 `<h2>`、並由同一條 `h2` rule 指定
alternative。Chromium 152 與 Playwright WebKit 實測一致：

```text
nan-Hant-TW → Diantenjeom Serif MOE … Shanggu Serif … serif（繼承繁中環境的 slots）
zh-Hant-TW  → Diantenjeom Serif MOE … Shanggu Serif … serif
ja          → Diantenjeom Serif JIS … serif
ko          → Diantenjeom Serif KLR … serif
```

Firefox 同樣保留 serif 角色；`nan-Hant-TW` 在三個引擎都**不**匹配 `:lang(zh)`。
Firefox 四語的低階 slots 都成為 `HanNone … serif`，是上段所述的既有
container-style-query 支援落差，不是 `[lang]` 把 alternative 改回 default。它需要
由 fonts architecture 的跨引擎 feature fallback 另案處理，不能在本案報告成已解決。

### Chrome 152 的 `if()`

本機版本：`Google Chrome 152.0.7977.65`。

Custom property condition 正常：

```css
.marker {
  --role: alternative;
  font-family: if(
    style(--role: alternative): "marker-if-works";
    else: "marker-if-failed"
  );
}
```

computed value 是 `marker-if-works`。

標準屬性 condition 尚未實作：

```css
.standard {
  font-family: serif;
  color: if(
    style(font-family: serif): rgb(1 2 3);
    else: rgb(4 5 6)
  );
}
```

computed `font-family` 是 `serif`，但 `color` 得到 `rgb(4, 5, 6)`。
`CSS.supports()` 對整條 declaration 回傳 true 只代表 forward-compatible grammar
接受它；unknown 的頂層 condition 依 Values 5 規則求值為 false。

把同一寫法套進 han.css：

```css
[lang] {
  font-family: if(
    style(font-family: var(--han-font-alternative)):
      var(--han-font-alternative);
    style(font-family: var(--han-font-default)):
      var(--han-font-default);
    else:
      inherit
  );
}
```

zh／ja／ko 全部走 `else`，繼承同一份 MOE serif stack；沒有得到 JIS／KLR。

但是 `if()` 不必反查 `font-family`。若角色本身以未解析 keyword 繼承，可以直接
查 custom property：

```css
:root {
  --han-font: default;
}

:where(body, body *) {
  font-family: if(
    style(--han-font: default): var(--han-font-default);
    style(--han-font: alternative): var(--han-font-alternative);
    style(--han-font: accent): var(--han-font-accent);
    else: var(--han-font)
  );
}

.headline { --han-font: alternative; }
.brand    { --han-font: "Brand Test", serif; }
```

Chrome 152 實測巢狀 zh → ja → ko：

```text
han.css / alternative:
zh → Serif MOE；ja → Serif JIS；ko → Serif KLR

han.css / "Brand Test", serif:
zh → Brand；ja → Brand；ko → Brand

han.basic.css / alternative:
zh → generic serif；ja → generic serif；ko → generic serif

han.basic.css / "Brand Test", serif:
zh → Brand；ja → Brand；ko → Brand
```

`alternative` 是簡單 custom-property token，繼承時不會變成某一 locale 的字體
字串；每個元素上的 `if()` 才消費當地的 `--han-font-alternative`。任意作者 stack
則由 `else` 直接使用，所以不需要額外的 `custom` enum。這證明 `if()` 能解問題，
前提是 API 傳遞的是**選擇本身**，不是事後猜 computed `font-family` 的來源。

參考：

- [Chrome：CSS conditionals with `if()`](https://developer.chrome.com/blog/if-article)
- [CSS Values and Units Level 5：`if()`](https://www.w3.org/TR/css-values-5/#if-notation)
- [CSS Conditional Level 5：style container features](https://drafts.csswg.org/css-conditional-5/#style-container)

## 考慮過的修法

| 修法 | 保留角色／作者 stack | locale 重組 | 判斷 |
|---|---:|---:|---|
| 刪除 `[lang]` 規則 | 是 | 否 | 凍結祖先 locale |
| `inherit`／`revert-layer` | 是 | 否 | 同上 |
| 繼承另一個含 `var()` 的 custom property | 是 | 否 | composite 已在祖先 computed |
| 維持 `var(--han-font-default)` boundary 預設 | 未重申時回 default | 是 | 保留為公開契約 |
| 邊界明寫 alternative／accent | 已知角色可 | 是 | 必須先有 provenance |
| `lang` 放在各翻譯 block，由 component selector 同時命中 | 是 | 是 | 本案例的正確結構 |
| nested inline boundary 由 component selector 一併命中 | 是 | 是 | 明示的作者 recipe |
| JavaScript 同步角色 | 可 | 可 | 不應成為排版核心前提 |
| 同名字族的 `@font-face` alias | 部分 | 否 | 重疊 CJK codepoints 無法依 `lang` 選 face |
| 現行 `if(style(font-family: …))` | 否 | 否 | 標準 property condition 尚未實作 |

## 未來的 computed-value 推斷路線

標準屬性 container style query 若跨引擎落地，可讓邊界查最近祖先的 computed
stack，而不是要求作者另帶 role marker：

```css
:where([lang]):where(:lang(zh), :lang(ja), :lang(ko)) {
  font-family: inherit;
}

@container style(font-family: var(--han-font-alternative)) {
  :where([lang]):where(:lang(zh), :lang(ja), :lang(ko)) {
    font-family: var(--han-font-alternative);
  }
}

@container style(font-family: var(--han-font-default)) {
  :where([lang]):where(:lang(zh), :lang(ja), :lang(ko)) {
    font-family: var(--han-font-default);
  }
}

@container style(font-family: var(--han-font-accent)) {
  :where([lang]):where(:lang(zh), :lang(ja), :lang(ko)) {
    font-family: var(--han-font-accent);
  }
}
```

Style-query 比較值中的 `var()` 會相對 query container 計算，所以它比較的是祖先
locale 的完整 role stack；命中後，branch 裡的 composite 則在子元素 locale
重新代入。任意作者 stack 不匹配三個已知 role，保留 `inherit`。巢狀邊界逐層
重複同一程序。

它只能辨認**值**，不能恢復來源，至少有兩個碰撞案例：

- 作者手寫的 stack 恰好等於某個 Han role，會被當成該 role 重組。
- default 與 alternative 在祖先 locale 被配置成同一 stack、在子 locale 又分開
  時，兩個 query 同時為真，CSS 無從知道祖先原先選的是哪一個 role。

所以這條路可讓一般頁面免顯式 role state，卻不能嚴格滿足「保留任意作者選擇及
role provenance」的全集。若契約要求零歧義，仍應傳遞選擇本身。

直接寫 `font-family: if(style(font-family: …): …)` 則同時查詢、設定同一元素的
同一 property，形成自我依賴；即使標準屬性 condition 上線，也不應把核心設計押
在這種循環上。查詢祖先 computed style 的 `@container` 資料流較清楚。

這一方案目前不能出貨：Chrome 152 尚未執行標準 property style condition，且
Firefox／WebKit 亦無可依賴的互通實作。Feature detection 也必須用行為 probe，不能
只看 `CSS.supports()` 的 parse 結果。

## 是否應簡化 API

這次案例**不需要新增 API**。把 `lang` 放在各翻譯的 semantic block 後，既有
component selector 與 language boundary 位於同一元素，原生 cascade 已完整表達
作者意圖。現在公開面仍有三層概念：

1. 低階 locale slots：`--han-font-punctuation-*`、`--han-font-cjk-*`。
2. 物理 composites：`--han-system-ui`、`--han-sans`、`--han-serif`、
   `--han-cursive`、`--han-monospace`。
3. 語義 roles：`--han-font-default`、`--han-font-alternative`、
   `--han-font-accent`。

Role vars 可以被當作「可重新指向的配置 token」，也可以直接放進
`font-family`。只有在 declaration 位於 boundary 的祖先、而不是 boundary 本身
時，才會因 computed-value inheritance 丟失可重新解析的 provenance；這個能力
邊界用 selector recipe 說清楚即可。

### 不建議：兩個值由作者手動同步

```css
.headline {
  --han-font-role: alternative;
  font-family: var(--han-font-alternative);
}
```

這會增加一個可能漂移的平行狀態：兩行可寫成不同角色，也容易只複製其中一行。
2026-09-01 曾試作並回退；未經 API 決策不應重新導入。

### 已否決的候選：單一 `--han-font` dispatcher

custom-property `if(style())` 到達支援基線後，技術上可以將套用 API 收成：

```css
.headline { --han-font: alternative; }
.product  { --han-font: "Brand Serif", serif; }
```

角色 keyword 保留 provenance；其他 token stream 就是任意 `font-family`。內部在
`:where(*)` 每元素 dispatch，讓語言邊界自然取得自己的 composite。這比
attribute 更貼近 CSS authoring，也把兩行同步縮成一行。

Keyword 集合仍需另案審查：

- `default | alternative | accent` 保留語義 role 與全站對調能力。
- 是否另收 `sans | serif | cursive | monospace`，決定物理 composites 能否安全
  用在跨語言 subtree。
- 任意 stack 走 `else: var(--han-font)`；若真有名為 default／alternative 的字體，
  加引號即可與 keyword 區分。

若採用這個 dispatcher，既有 `--han-font-default`／`alternative`／`accent` 屆時仍
可作為 role mapping 配置，但可能不再推薦直接放進 `font-family`。同理，若
`--han-font` 要選 locale-aware 的
`--han-serif`，應使用 `serif` keyword，而不是
`--han-font: var(--han-serif)`；後者仍會在宣告處先算成 frozen string。

這條 API 仍有明確邊界：作者若繼續只寫
`font-family: "Brand Serif", serif`，沒有改用 `--han-font`，庫端無法察覺它已
覆寫祖先 role。要嘛把 `--han-font` 定成 v4 的主要 subtree font API，要嘛接受
原生 `font-family` 跨顯式 `lang` 邊界不能透明保證。不能同時宣稱兩者都自動成立。

Chrome 152 已證明架構可行，但現在出貨會造成 Chrome 與 Firefox／WebKit 行為
分裂；更重要的是，它為已有原生 CSS 解法的案例增加另一套 font API。此案不納入
v4。`fonts.if.css` 僅保留為語法與未來 mode mapping 的研究樣本，不是可出貨入口。

### 現階段決策與後續順序

1. 保留 library 的全域零 specificity `[lang]` default reset；它是 locale boundary
   的公開契約，不再視為待修 bug。
2. 修正 demo：四個互斥翻譯各自使用帶 `lang` 的 `<h2>`，由既有 `h2` component
   selector 在同一元素套 alternative stack。
3. 文件與安裝 Skill 明載：需要 alternative／accent／作者 stack 時，在帶 `lang`
   的元素重新指定；真正的 nested inline run 讓 component selector 一併命中。
4. 閩南語維持正規 `nan-Hant[-TW]`；不用非法的 `zh-min-nan-Hant` 規避 selector
   能力邊界。正式 `:lang(nan)` 支援另案盤點。
5. 不新增 `--han-font`／role marker／class／attribute API。`if()` 研究保留，但不構成
   implementation plan。

## 回歸測試清單

固定以下契約：

- `han.css`：同一元素帶 component class 與 nan-Hant／zh-Hant／ja／ko 時，
  alternative declaration維持 serif；zh／ja／ko 分別重組 MOE／JIS／KLR，nan
  目前繼承所在 Hant 環境的 MOE slots。
- `han.css`：未另指定字體的 zh／ja／ko boundary 分別命中 locale default sans slots。
- 同一 boundary 上的 accent 或任意作者 selector 勝過 zero-specificity library rule。
- 巢狀 language boundary 未重申非 default role 時，依公開契約回到各自 locale
  default；使用 documented selector recipe 時，則逐層重組同一 alternative role。
- 裸 `han.css` 頁面仍由 body unfreezer 載入真實 slots，不回歸 root HanNone stack。
- `han.basic.css`：維持相同 boundary contract，但 alternative/default 只解析成
  generic serif/sans，沒有 fonts module 的 locale webfont slots。
- Chromium、WebKit 的同元素 cascade 與 locale slots 結果一致；Firefox 保留
  serif role，但目前呈現已知的 `HanNone` slot degradation，測試報告須明載。
