# 漢字標準格式 Han.css

[English](./README.md) · **繁體中文** · [日本語](./README.ja.md) · [한국어](./README.ko.md)


**像素間的活字美學，<br />講究螢幕上的每一個漢字**

專為CJK網頁精選的一套CSS排版集：行尾懸掛與擠壓的標點、傍著文字的著重號、注音與拼音的ruby、跨文種之間的髮絲間隙、傳承字形——鉛字時代的排版講究，以CSS自訂屬性在螢幕上重現，輔以少量JavaScript回落。

v4是一次徹底的原生化重寫：**沒有CSS預處理器、沒有必需的 JavaScript（有的話效果更佳）。** 整個庫就是四個獨立的CSS模組，加一支可選的JavaScript補全，全部機能都以一個`--han-*`自訂屬性開關與調校。

```
pnpm add @hanzi.pro/han.css
```

```js
import '@hanzi.pro/han.css/styles'   // 四模組全上
import '@hanzi.pro/han.css/auto'     // 可選的JS補全（回落）
```

或直接掛CDN，完全免建構：

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest/dist/han.min.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest/dist/han.auto.min.js"></script>
```

這就是全部的安裝——語意HTML自此會自己排版。`<em>`得到的是著重號，不是斜體；`<cite>`得到書名號；標點會擠壓與懸掛；漢字與西文之間得到恰當的間隙。

## 心智模型

三件事讀完，就掌握了整個庫。

### 一、四個模組，各管一事

| 模組 | cascade layer | 管什麼 |
|------|--------------|--------|
| **語意樣式標準化** | `han-semantics` | 語意元素在漢字排版下應有的樣式：著重號（`--han-em-symbol`、`--han-em-dot-position`）、書名號（`--han-cite-title-marks`）、專名號、注音，並取消偽斜體 |
| **行的調整** | `han-lines` | 行內的分寸：標點擠壓與行尾懸掛（`--han-punctuation-refinement`）、跨文種間隙（`--han-text-autospace`） |
| **段落間距調整** | `han-prose` | 塊軸的節奏：標題、段落、清單之間的留白，以字為尺的縮排（`--han-prose`、`--han-prose-indent`，預設只作用在`<article>`） |
| **字體** | `han-fonts` | 字體堆疊與Web字體：傳承字形（`--han-use-heritage-glyphs-for-hant`）、標點字體、楷體家族（`--han-use-cursive`） |

四個模組互相獨立，可以全裝、也可以只挑一個。每個住在自己的cascade layer裡，與你的樣式互不干涉。按模組挑選：

```js
import '@hanzi.pro/han.css/styles/semantics'
import '@hanzi.pro/han.css/styles/lines'
import '@hanzi.pro/han.css/styles/prose'
import '@hanzi.pro/han.css/styles/fonts'
```

### 二、一切機能都是CSS變量

每個機能對應一個`--han-*`變量。在任何選擇器上設定它，機能就在那個範圍內生效。這不是漢.css發明的機制，是原生CSS的繼承與style query（`@container style()`）：

```css
/* 整份文件的著重號改用芝麻點 */
:root { --han-em-symbol: sesame; }

/* 只在這個區塊關掉標點修飾（擠壓與懸掛） */
.quoted-legacy-text { --han-punctuation-refinement: none; }
```

無須記憶任何class、無須呼叫JavaScript API：選擇器就是作用域，變量就是開關。style query讀的是**祖先**，所以請把變量設在目標內容的祖先（或`:root`）上。各模組的完整變量清單見文檔站。

### 三、選擇器權重是〇

漢.css所有樣式都包在`:where()`裡，選擇器權重歸零。你的任何規則，哪怕只是一個元素選擇器，都能覆寫框架提供的樣式；配合`@layer`，模組順序也由你定：

```css
@layer han-semantics, han-lines, han-prose, han-fonts, app;
```

## JavaScript補全是可選的

**不引JS也完全可用。** 四模組的核心機能是純CSS；`installFallbacks`只做引擎尚未原生支援的部分——標點擠壓與懸掛的DOM層回落、`text-autospace`未實作時的跨文種間隙、相鄰行底線間距的標記。每一項都以`CSS.supports`與環境探針逐項把關，待引擎原生支援便自動讓位。

```js
import '@hanzi.pro/han.css/auto'                 // 載入即在DOMContentLoaded執行

import { installFallbacks } from '@hanzi.pro/han.css'
installFallbacks(document.body)                  // 或自行控制時機與範圍
```

講究行內排版細節，引入`auto`；只需要語意樣式與段落間距，純CSS即可。

## Web字體（傳承字形）

字體模組定義字體堆疊與家族名；傳承字形（尚古黑體／明體等）的woff2**遞送**由你選擇，最簡單是掛ziano CDN切片：

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/webfonts-shanggu-sans@latest/swap.css">
```

也可以完全不引入——`--han-use-heritage-glyphs-for-hant: system`改用系統字體回落。

## 產物一覽

| 檔案 | 內容 |
|------|------|
| `han.css` | 整包：四模組＋JS配套樣式＋內建字體資產（全形空格校準字體、注音字體） |
| `han.{semantics,lines,prose,fonts}.css` | 單模組包，各住自己的cascade layer，總和＝整包 |
| `han.basic.css` | 精簡包：semantics＋lines＋prose三模組的純CSS部分；無fonts模組、無JS配套樣式、無字體資產 |
| `han.js` | JS主入口（ESM），純named exports，不自動執行 |
| `han.auto.js` | 自動安裝入口，載入即補全並re-export全部API |

各檔皆有`.min`版與source map。

## 瀏覽器支援

支援現代常青瀏覽器。核心機制（style query、`:where()`、`@layer`、`@property`）以近年Baseline為準；行內排版上個別引擎尚未實作的特性（`text-autospace`、`text-spacing-trim`）由JavaScript補全按需回落。

## 文檔

完整文檔與互動遊樂場——貼上你的文字、調整面板、複製生成的引用碼——都在 **[hanzi.pro](https://hanzi.pro)**。參考手冊目前以繁體中文為準，英文涵蓋簡介與安裝，日文、韓文陸續補上。

## 授權

[MIT](./LICENSE) © 2012–2026 Chen Yijun。內建與傳承Web字體各自沿用上游授權（OFL 1.1），詳見各字體套件。
