---
title: 簡介
subtitle: 漢.css v4・像素間的活字美學
---

# 簡介

漢.css是為漢字網頁而生的CSS排版集，涵蓋標點擠壓與行尾懸掛、著重號、注音與拼音、跨文種間隙等漢字排版的固有講究，以CSS自訂屬性配置，輔以少量JavaScript回落。

v4是一次徹底的原生化重寫：**沒有CSS預處理器、沒有必需的JavaScript（有的話效果更佳）**。整個庫就是四個獨立的CSS模組加一支可選的JavaScript補全，全部機能以CSS自訂屬性（俗稱CSS變量）開關與調校。

## 心智模型

三件事讀完，就掌握了整個庫：

### 一、四個模組，各管一事

| 模組 | cascade layer | 管什麼 |
|------|--------------|--------|
| [語意樣式標準化](./semantics.html) | `han-semantics` | 語意元素在漢字排版下應有的樣式：著重號、書名號、專名號、注音，並取消偽斜體 |
| [行的調整](./lines.html) | `han-lines` | 行內的分寸：標點擠壓、行尾懸掛、跨文種間隙 |
| [段落間距調整](./prose.html) | `han-prose` | 塊軸的節奏：標題、段落、清單之間的留白，以字為尺的縮排 |
| [字體](./fonts.html) | `han-fonts` | 字體堆疊與Web字體：傳承字形、標點字體、楷體家族 |

四個模組互相獨立，可以全裝、也可以只挑一個。每個模組住在自己的cascade layer裡（見上表），與你的樣式互不干涉。

### 二、一切機能都是CSS變量

每個機能對應一個`--han-*`變量。在任何選擇器上設定它，機能就在那個範圍內生效。這不是漢.css發明的機制，是原生CSS的繼承與style query（`@container style()`）：

```css
/* 整份文件的著重號改用芝麻點 */
:root { --han-em-symbol: sesame; }

/* 只有這個區塊關掉標點修飾（擠壓與懸掛） */
.quoted-legacy-text { --han-punctuation-refinement: none; }
```

無須記憶任何class、無須呼叫JavaScript API：選擇器就是作用域，變量就是開關。每個模組的變量清單見各模組頁。

### 三、選擇器權重是〇

漢.css所有樣式都包在`:where()`裡，選擇器權重歸零。你的任何規則，哪怕只是一個元素選擇器，都能覆寫框架提供的樣式；配合`@layer`，模組順序也由你定義。

## 瀏覽器支援

支援現代常青瀏覽器。核心機制（style query、`:where()`、`@layer`、`@property`）以近年Baseline為準；個別引擎尚未實作的排版特性由JavaScript補全按需回落，詳見[JavaScript API](./api-js.html)。

## 下一步

- [安裝與啓用](./install.html)：npm、CDN、單檔內嵌三種引用方式。
- 首頁的[遊樂場](/#station-playground)：貼上你的文字，調整面板即時預覽全部機能，並生成對應的引用碼。
