---
title: 行的調整
---

# 行的調整

`han-lines`模組管行內的分寸：擠壓收其內，懸掛出其外，間隙勻乎文種之間。兩個模式變量控制全部機能；此模組的DOM層回落依賴[JavaScript補全](./api-js.html)，引擎原生支援處則直接走原生。

## 跨文種間隙

漢字與Latin、希臘、西里爾字母、數字相遇，其間自動勻出髮絲之隙——正文**永遠不手打空格字元**，間隙由CSS生成。

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-text-autospace` | `normal`｜`insert`｜`replace`｜`strict`｜`no-autospace` | `normal` |

- `normal`——引擎原生`text-autospace`優先，未支援則由JS回落。
- `insert`——JS主動插入間隙節點（原文無空格字元的常規情形）。
- `replace`——原文已有手打空格時，JS將其替換為正確寬度的間隙。
- `strict`——嚴格模式，insert＋replace並行。
- `no-autospace`——關閉。

```css
:root { --han-text-autospace: strict; }
.code-sample { --han-text-autospace: no-autospace; }
```

## 標點擠壓與行尾懸掛

相鄰全形標點擠去多餘的半格；句讀行至末端，懸而不入，字距不因禁則換行而鬆動。

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-punctuation-refinement` | `auto`｜`compress`｜`hang`｜`none` | `auto` |

- `auto`——擠壓恆開；行尾懸掛依語言與[fonts模組](./fonts.html)的標點字體設定自動決定（見下）。
- `compress`——只擠壓，不懸掛。
- `hang`——擠壓＋懸掛全開。
- `none`——關閉。

### 懸掛的自動判準

`auto`之下，行尾懸掛不是一律開啓——它跟着各語言的標點字體慣例走（由fonts模組的`--han-punctuation-*`變量推導）：置中式標點（如教育部MOE慣例）不懸掛，偏倚式標點（如JIS、GB）懸掛。繁中另按`--han-use-heritage-glyphs-for-hant`細分：傳承字形webfont為置中標點（不懸掛），系統日文字體回落為偏倚標點（懸掛）。要繞過整套自動判準，直接指定`hang`或`compress`。

## 懸掛與偽元素

行尾懸掛的DOM層回落以絕對定位的懸掛層實現，對少數CSS特性有可觀測的影響，如實列明：

- **`::first-line`**——會受影響：懸掛層脫離常規流，首行的組成因此改變。
- **`::first-letter`**——理論上受影響，實際上永遠撞不到：懸掛標記只落在收尾標點（逗號、句號、收合括號），這類字符結構上不可能是段落第一個字。
- **`::selection`、Custom Highlight API、結構型選擇器**（`:first-child`、`:has()`、`:lang()`等）——不受影響：它們查的是文字range與DOM樹，與定位無關。

## 與JS的關係

擠壓與懸掛的DOM層回落由`installFallbacks`實作（包裹標點字符、安裝懸掛層）；跨文種間隙在未實作`text-autospace`的引擎同理。不引JS時，本模組退化為引擎原生能力所及的部分——設定不會壞，只是覆蓋面小。詳見[JavaScript API](./api-js.html)。
