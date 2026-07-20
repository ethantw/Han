---
title: 簡介
subtitle: 漢.css v4・像素間的活字美學
---

# 簡介

漢.css是為漢字網頁而生的CSS排版集：或擠壓或懸掛的標點、強調文本旁的著重號、為漢字標上的注音與拼音、文種之間的分寸——鉛字時代的匠人工藝，透過CSS自訂屬性與少量JavaScript回落，在螢幕上一一重現。

v4是一次徹底的原生化重寫：**沒有Sass、沒有建構步驟、沒有框架**。整個庫就是四個獨立的CSS模組加一支可選的JavaScript補全，全部機能以CSS自訂屬性（俗稱CSS變量）開關與調校。

## 心智模型

三件事讀完，就掌握了整個庫：

### 一、四個模組，各管一事

| 模組 | cascade layer | 管什麼 |
|------|--------------|--------|
| [語意樣式標準化](./semantics.html) | `han-semantics` | 語意元素在漢字排版下應有的樣式——著重號、書名號、專名號、注音，與偽斜體的告別 |
| [行的調整](./lines.html) | `han-lines` | 行內的分寸——標點擠壓、行尾懸掛、跨文種間隙 |
| [段落間距調整](./prose.html) | `han-prose` | 塊軸的節奏——標題、段落、清單之間的留白，以字為尺的縮排 |
| [字體](./fonts.html) | `han-fonts` | 字體堆疊與Web字體——傳承字形、標點字體、楷體家族 |

四個模組互相獨立，可以全裝、也可以只挑一個。每個模組住在自己的cascade layer裡（`han-semantics`／`han-lines`／`han-prose`／`han-fonts`），與你的樣式井水不犯河水。

### 二、一切機能都是CSS變量

每個機能對應一個`--han-*`變量。在任何選擇器上設定它，機能就在那個範圍內生效——這不是漢.css發明的機制，是原生CSS的繼承與style query（`@container style()`）：

```css
/* 整份文件開啓著重號的芝麻點樣式 */
:root { --han-emphasis-symbol: sesame; }

/* 只有這個區塊關掉標點擠壓 */
.quoted-legacy-text { --han-punctuation-squeeze: off; }
```

沒有class要背、沒有JavaScript API要呼叫——選擇器就是作用域，變量就是開關。每個模組的變量清單見各模組頁。

### 三、選擇器權重是〇

漢.css所有樣式都包在`:where()`裡——選擇器權重歸零。你的任何規則，哪怕只是一個元素選擇器，都能覆寫框架提供的樣式；配合`@layer`，模組順序也由你定義。框架不與作者爭權。

## 瀏覽器支援

支援現代常青瀏覽器。核心機制（style query、`:where()`、`@layer`、`light-dark()`）以近年Baseline為準；個別引擎的排版差異（如`text-autospace`、`text-spacing-trim`的實作進度）由JavaScript補全按需回落，見[JavaScript API](./api-js.html)。

## 下一步

- [安裝與啓用](./install.html)——npm、CDN、單檔內嵌三種引用方式。
- 首頁的[遊樂場](/#station-playground)——貼上你的文字，撥面板即時預覽全部機能，並生成對應的引用碼。
