---
title: 語意樣式標準化
---

# 語意樣式標準化

`han-semantics`模組重新定義語意元素在漢字排版下應有的樣式：`<em>`是著重號不是斜體、`<cite>`是書名號、`<u>`是專名號、引號隨語言慣例——使用正確的元素，即手可得，繁簡日韓各有所依。

## 開關與作用域

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-semantics` | `on`｜`off` | `on` |

全域預設開啓。關閉某個子樹：

```css
.legacy-content { --han-semantics: off; }
```

> **作用域通則（全站適用）**：漢.css的機能變量以style query（`@container style()`）讀取，而style query查的是**祖先**——變量要設在目標元素的祖先（或`:root`）上，設在目標元素自身不生效。本頁及後續各模組頁的變量皆同此理。

唯一例外：`:root`層級的文件基礎樣式（預設字體、底線偏移基準）不受此開關管轄。

## 著重號——`<em>`

漢字的強調不是斜體，是文字旁的著重號。`<em>`在中日韓語境下自動渲染為著重號：

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-em-symbol` | `circle`｜`dot`｜`sesame`｜`triangle`等（`text-emphasis`合法值） | `circle` |
| `--han-em-dot-position` | `under right`｜`over right`等（`text-emphasis-position`合法值） | `under right`（日文為`over right`） |

```css
article { --han-em-symbol: sesame; }
```

## 書名號——`<cite>`

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-cite-title-marks` | `none`｜`bracket`｜`wavy` | `none` |
| `--han-title-marks` | 引號字符序列 | `《》〈〉` |

`bracket`（乙式）以引號字符包夾書名，字符組可用`--han-title-marks`自訂；`wavy`（甲式）為字下曲線專名號式。日文與韓文（漢字圈）語境下`--han-title-marks`自動改指向該語言的引號慣例。

## 引號——`<q>`

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-quotes` | 引號字符序列 | `“”‘’` |

按`:lang`自動切換：英式、中文、日文、韓文（含漢字直式）各有預設，也可自訂覆寫。

## 底線與刪除線

底線（`<u>`專名號、`<ins>`）與刪除線在漢字下的兩個講究：與字保持距離、相鄰兩行的線不得黏連。

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-underline-offset` | `<length>` | `.125em` |
| `--han-text-decoration-inset` | `<length>`｜`auto` | `auto` |
| `--han-adjacent-lines-skip-gap-fallback` | `<length>` | `.125em` |

相鄰行標記需要JS配套（`installFallbacks`會為相鄰的裝飾行打上標記，CSS據此縮進）；引擎原生支援`text-decoration-inset`後回落自動讓位。

## 注音——`<ruby>`

注音符號（zhuyin）ruby以專用字體渲染（`--han-font-zhuyin-serif`，內建`Han Zhuyin Serif`webfont），縱向聲調位置正確。舊式`<rb>`／`<rtc>`表格式ruby標記可用[`transpileRuby`](./api-js.html)降級為現代引擎可正確渲染的形式。

## 字體掛鉤

semantics模組定義了一組字體堆疊變量的基礎值（`--han-font-default`／`--han-font-alternative`／`--han-font-accent`等，預設指向系統泛型）；[fonts模組](./fonts.html)載入時會以四層composite堆疊逐元素覆寫它們。兩個模組因此可獨立使用：只要semantics，字體交給系統；加上fonts，傳承字形與標點字體全套接管。
