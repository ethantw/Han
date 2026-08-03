---
title: 安裝與啓用
---

# 安裝與啓用

三種引用方式：npm、CDN、單檔內嵌。首頁[遊樂場](/#station-snippet)可按你的面板配置即時生成下列全部代碼；本頁講清楚每一行是什麼。

## npm

```bash
pnpm add @hanzi.pro/han.css
```

樣式整包引入，或按模組挑選：

```js
// 整包（四模組全上）
import '@hanzi.pro/han.css/styles'

// 或：只挑需要的模組
import '@hanzi.pro/han.css/styles/semantics'
import '@hanzi.pro/han.css/styles/lines'
import '@hanzi.pro/han.css/styles/prose'
import '@hanzi.pro/han.css/styles/fonts'
```

JavaScript補全（可選，見下方〈JavaScript的取捨〉）：

```js
// 自動安裝：載入即在DOMContentLoaded執行，零呼叫
import '@hanzi.pro/han.css/auto'

// 或：手動控制時機與範圍
import { installFallbacks } from '@hanzi.pro/han.css'
installFallbacks(document.body)
```

## CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest/dist/han.min.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest/dist/han.auto.min.js"></script>
```

也可只掛單模組：`dist/han.semantics.min.css`、`dist/han.lines.min.css`、`dist/han.prose.min.css`、`dist/han.fonts.min.css`。

## 產物一覽

| 檔案 | 內容 |
|------|------|
| `han.css` | 整包：四模組＋JS配套樣式＋內建字體資產（全形空格校準字體、注音字體） |
| `han.semantics.css`／`han.lines.css`／`han.prose.css`／`han.fonts.css` | 單模組包，各住自己的cascade layer，總和＝整包 |
| `han.basic.css` | 精簡包：semantics＋lines＋prose三模組的純CSS部分；無fonts模組、無JS配套樣式、無字體資產 |
| `han.js` | JS主入口（ESM）：純named exports，不自動執行 |
| `han.auto.js` | 自動安裝入口：載入即補全，並re-export主入口全部API |

各檔皆有`.min`版與source map。

## cascade layer

四個模組分別住在`han-semantics`／`han-lines`／`han-prose`／`han-fonts`四個layer。想明確控制與自家樣式的先後，可在引入前先宣告順序：

```css
@layer han-semantics, han-lines, han-prose, han-fonts, app;
```

漢.css所有選擇器權重為〇（`:where()`），即使不宣告layer順序，你的規則照樣能覆寫；layer宣告只是多一層確定性。

## JavaScript的取捨

**不引JS也完全可用。** 四模組的核心機能是純CSS；JavaScript補全（`installFallbacks`）只做引擎尚未原生支援的部分：

- 標點擠壓與行尾懸掛的DOM層回落（`--han-punctuation-refinement`）；
- 跨文種間隙在`text-autospace`未實作引擎上的回落（`--han-text-autospace`）；
- 相鄰行底線間距的標記。

待引擎原生支援，同一份代碼自動讓位：`installFallbacks`逐項以`CSS.supports`與環境探針把關，不重複做引擎已支援的事。取捨很單純：**講究行內排版細節，引入`auto`；只需要語意樣式與段落間距，純CSS即可。**

## Web字體（傳承字形）

fonts模組定義字體堆疊與家族名；傳承字形（尚古黑體／明體等）的woff2**遞送**由你選擇，最簡單是掛ziano CDN切片：

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/webfonts-shanggu-sans@latest/swap.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/webfonts-shanggu-sans-yue@latest/swap.css">
```

也可以不引入：`--han-use-heritage-glyphs-for-hant: system-ja`改用日文系統字體回落，詳見[字體](./fonts.html)。簡日韓的傳承字形預設關閉、亦可各自開啟（`--han-use-heritage-glyphs-for-hans`／`-ja`／`-ko`），家族可選尚古或源起，詳見[字體](./fonts.html)。

## Web字體（標點）

標點層同理，掛diantenjeom即可。**要0.2.0以上**：0.1.0的家族名還是`… KV`，對不上本模組的`… KLR`，掛上去等於沒掛（靜默退回正文字體自身的標點）。

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/diantenjeom@0.2.0/dist/diantenjeom.css">
```

整包含四套慣例；只用一套就改指`…/dist/moe.css`（或`jis`／`gb`／`klr`）。同版另附一個**著重號字體**`Diantenjeom Emphasis`，不隨上面的樣式表自動生效——它沒有`unicode-range`，須由你掛到`<em>`上，見[語意元素](./semantics.html)。

## 啓用範圍

裝好即生效：semantics與lines全域預設開啓，prose預設只作用在`<article>`。所有機能都能以CSS變量在任何選擇器上開關，各模組頁列有完整變量表。
