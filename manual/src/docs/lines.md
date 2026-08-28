---
title: 行的調整
---

# 行的調整

`han-lines`模組管行內的三件事：標點擠壓、行尾懸掛、跨文種間隙。三件事對應三種瀏覽器能力：跨文種間隙走原生`text-autospace`、標點擠壓走原生`text-spacing-trim`，而行尾懸掛**至今無廣泛落地的原生屬性**，永遠由[JavaScript補全](./api-js.html)以標記回落實現。原生支援處直接走原生，缺處才由JS補上；不引JS，本模組退化為引擎能力所及的部分，設定仍然有效，僅覆蓋面較小。

## 跨文種間隙

漢字與Latin、希臘、西里爾字母、數字相鄰處，自動生成約¼字寬的間隙；正文**不手動輸入空格字元**，間隙由CSS生成。值原封不動傳給原生`text-autospace`。

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-text-autospace` | `normal`｜`insert`｜`replace`｜`strict`｜`no-autospace` | `normal` |

- `normal`：引擎原生`text-autospace`優先。現代Chromium／WebKit／Gecko在此模式下已自行插入間隙；長尾瀏覽器由JS（`insertISS`）補。
- `insert`：在漢字↔西文之間**沒有空格**處插入約¼字寬的間隙。即CSS Text 4的`insert`語意。
- `replace`：原文**已有**手打空格時，JS吃掉該空格、換上定寬的`<h-iss>`間隙節點。即CSS Text 4的`replace`語意，目前無引擎原生支援。
- `strict`：insert＋replace並行，全由JS處理，原生autospace讓位。
- `no-autospace`：關閉。

```css
:root { --han-text-autospace: strict; }
.code-sample { --han-text-autospace: no-autospace; }
```

> WebKit（Safari ≤18.x）在有行內元素的漢西接縫會漏套原生autospace。安裝時的探針（`detectAutospaceBoundaryBug`）測出此病，就把`normal`升級走strict路徑（改注入`<h-iss>`間隙），使間隙照樣現形。

## 標點擠壓與行尾懸掛

相鄰全形標點擠去多餘的半格；標點行至末端懸出行外，字距不因禁則換行而鬆動。此變量控制的是**JS回落**該產出哪種標記，與上面的原生開關獨立。

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-punctuation-refinement` | `auto`｜`compress`｜`hang`｜`none` | `auto` |

- `auto`：瀏覽器下，原生已處理的部分（依`CSS.supports('text-spacing-trim' / 'hanging-punctuation')`）跳過，只補缺的；SSR下，擠壓＋懸掛兩種標記一次產齊。
- `compress`：不論原生支援與否，強制只吐擠壓標記。
- `hang`：強制只吐懸掛標記。
- `none`：完全不做JS標點修飾。

擠壓的原生底子是`text-spacing-trim: trim-start`（模組在`:root`設好）；`none`與`hang`會把它改回`space-all`（即不擠壓的基準線）。懸掛沒有原生底子，全靠JS標記。

## 懸掛的自動判準

`auto`之下，行尾懸掛不是一律開啓，它跟着各語言的標點字體慣例走（由[fonts模組](./fonts.html)的`--han-punctuation-*`推導）：**置中式標點不懸掛，偏倚式標點懸掛**。判準逐語言：

- **繁中（`:lang(zh)`）**：除MOE（教育部置中）外皆懸掛。標點設`off`（Diantenjeom不畫、字形回落到CJK正文字體）時再依`--han-use-heritage-glyphs-for-hant`細分：`webfont`（尚古／源起，置中）不懸掛、`system-ja`（日文系統字體，偏倚）懸掛、`off`（國標系統字體，置中）不懸掛。
- **簡中（`:lang(zh-Hans)`）／日文（`:lang(ja)`）**：除MOE外皆懸掛（`off`亦視為偏倚而懸掛）。
- **韓文漢字混寫（`:lang(ko-Kore)`）**：與其他語言同一條規則——`--han-punctuation-ko`除MOE外皆懸掛（KLR的`。、`貼角、偏倚，照懸）。標點慣例開放給四語言之前，ko只有`KLR｜off`兩值、無置中選項而一律懸掛；現在可設MOE，便也跟着不懸掛。

要繞過整套自動判準，直接指定`hang`或`compress`。

## 運作方式與DOM產物

JS回落不改變你的文字內容，只包上惰性標記元素，皆`hidden`／`user-select: none`／對輔助科技透明，不污染複製貼上：

- `<h-char data-punct="…">`：擠壓與懸掛的字元包裹層。`data-punct`標明類型（`open`／`close`／`end`／`middle`／`hangable`／`consecutive`）。
- `<h-layer>`：懸掛層，零寬`inline-block`——盒不佔行內空間、字形沿行內方向溢出畫在佔位符上，基線由自己的文字對齊，讓標點視覺上掛出行外。
- `<h-iss>`：跨文種間隙節點（`replace`／`strict`模式）。

擠壓的原理：全形標點的em-box裡本就帶有約半字寬的空白；行首行尾與連續標點處，用負邊距收回這半格、再以隱形佔位還原，靠CSS「行邊空白塌縮」規則讓收縮只發生在行緣、行中維持原樣。連續標點串裡只收最外緣，內側保留自然半格，相鄰標點不致黏連。

## 懸掛與偽元素

行尾懸掛的DOM層回落以零寬`inline-block`的`<h-layer>`實現（早期為絕對定位，因static position錨在行盒邊而非基線，over著重號撐大行盒時標點會上浮，已改），對少數CSS特性有可觀測的影響，如實列明：

- **`::first-line`**：不會為懸掛標記改樣式——first-line樣式不繼承進原子行內盒的內容。
- **`::first-letter`**：理論上受影響，實際上永遠撞不到，懸掛標記只落在收尾標點（逗號、句號、收合括號），這類字符結構上不可能是段落第一個字。
- **`::selection`、Custom Highlight API、結構型選擇器**（`:first-child`、`:has()`、`:lang()`等）：不受影響，它們查的是文字range與DOM樹，與定位無關。

## 與JS的關係

`installFallbacks`一次裝好本模組的兩套回落：`refinePunctuation`（`punctuation.ts`，依`--han-punctuation-refinement`與各語言判準，包出`<h-char>`／`<h-layer>`）與inter-script spacing（`iss.ts`，依`--han-text-autospace`，`replaceISS`吃空格換`<h-iss>`、`insertISS`補間隙）。兩者都在原生支援對應能力時自動跳過該部分。`uninstallFallbacks`可完整撤除所有標記。詳見[JavaScript API](./api-js.html)。
