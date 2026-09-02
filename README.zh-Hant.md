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
| **語意樣式標準化** | `han-semantics` | 語意元素在漢字排版下應有的樣式：著重號（`--han-em-symbol`、`--han-em-dot-position`）、書名號（`--han-cite-title-marks`）、專名號、注音、引文與清單共用的縮排格線（`--han-structural-indent`），並取消偽斜體 |
| **行的調整** | `han-lines` | 行內的分寸：標點擠壓與行尾懸掛（`--han-punctuation-refinement`）、跨文種間隙（`--han-text-autospace`） |
| **段落間距調整** | `han-prose` | 塊軸的節奏：標題與所屬內文之間的留白、引文的楷體（`--han-prose`，預設只作用在`<article>`） |
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

### 三、公共樣式易於覆寫

公共預設與語意目標通常以零權重的`:where()`編寫。pseudo-element仍保留自己的type specificity，作者要改同一個pseudo時本來就會打平這部分；`<h-char>`／`<h-layer>`是私有fallback markup。更關鍵的是框架規則全在layer內，普通未分層的作者CSS自然位於其上：

```css
@layer han-semantics, han-lines, han-prose, han-fonts, app;
```

## JavaScript補全是可選的

**不引JS也完全可用。** 四模組的核心機能是純CSS；`installFallbacks`補上標點擠壓與懸掛的DOM層回落、跨文種間隙及相鄰行底線間距。原生擠壓與autospace以feature check和環境探針選擇；Safari雖宣稱支援原生`hanging-punctuation`，目前實作實際不可用，因此懸掛在所有引擎仍走JS。

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
| `han.basic.css` | 精簡包：semantics＋lines＋prose三模組的純CSS部分；無fonts模組、無JS配套樣式、無注音字體 |
| `han.zhuyin.css` | 搭配`han.basic.css`選用的注音`@font-face` |
| `han.js` | JS主入口（ESM），純named exports，不自動執行 |
| `han.auto.js` | 自動安裝入口，載入即補全並re-export主API |

各檔皆有`.min`版與source map。

## 瀏覽器支援

支援現代常青瀏覽器。核心機制（style query、`:where()`、`@layer`、`@property`）以近年Baseline為準；行內排版上個別引擎尚未實作的特性（`text-autospace`、`text-spacing-trim`）由JavaScript補全按需回落。

## 從 v3 遷移

v4整套退役了v3的JavaScript runtime——每一項機能都改由瀏覽器或字體的原生行為承接，可選的JS補全只填引擎尚缺的部分。撤下的API與其替代：

| v3 | 替代 |
|----|------|
| `Han.init()`／`Han(ctx).render()` | 無需啓動——CSS載入即生效；要JS回落時才`installFallbacks()`（或`/auto`入口） |
| `renderHWS()`——跨文種間隙 | 原生`text-autospace`；`installFallbacks()`的`<h-iss>`回落 |
| `renderJiya()`／`renderHanging()`——標點擠壓／懸掛 | 原生`text-spacing-trim`可取代擠壓JS。Safari雖宣稱支援`hanging-punctuation`，目前實作實際不可用，因此懸掛在所有引擎仍走JS |
| `renderEm()`／`renderElem()` | 純CSS——語意模組 |
| `renderDecoLine()` | `text-decoration-inset`＋CSS／JS相鄰行回落 |
| `renderRuby()`／`substCombLigaWithPUA` | 原生`ruby-position`＋注音字體GPOS；舊式`<rb>`／`<rtc>`標記跑`transpileRuby()`降級 |
| `locale/normalize`——地域字形 | `lang`感知字體的OpenType `locl`特性 |
| `jinzify` | `text-justify: inter-character` |
| `Han.support`／`Han.detectFont()` | `CSS.supports()`＋內建探針（`runProbes`） |

v3的class同路退役——`.han-init`→`/auto`入口、`.pn`→直接用`<u>`。逐步指南含Sass變量對照表：[hanzi.pro/manual/migration.html](https://hanzi.pro/manual/migration.html)。

## 文檔

完整文檔與互動遊樂場——貼上你的文字、調整面板、複製生成的引用碼——都在 **[hanzi.pro](https://hanzi.pro)**。參考手冊目前以繁體中文為準，英文涵蓋簡介與安裝，日文、韓文陸續補上。

若想先看純粹的排版結果，可直接打開**[完整示例頁](https://hanzi.pro/specimen.html)**：它不帶本站的版面樣式，只呈現漢.css本身。

## 授權

[MIT](./LICENSE) © 2012–2026 Chen Yijun。內建注音字體改封裝自BopomofoRuby1909（© 2018 But Ko），採OFL 1.1——見[LICENSE-FONTS](./LICENSE-FONTS)。傳承字形Web字體另行遞送，各自沿用上游授權，詳見各字體套件。
