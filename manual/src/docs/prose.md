---
title: 段落間距調整
---

# 段落間距調整

`han-prose`模組管塊軸方向的間距：標題與所屬內文的距離、以字為單位的縮排、段落對齊——讓數位長文舒適易讀。它是唯一**預設不全域生效**的模組：長文的排版設定不該波及介面，故只在`<article>`（及你指定的容器）裡開。

## 開關與作用域

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-prose` | `on`｜`off` | `off`（`:where(article)`預設`on`） |

`--han-prose`本身出廠`off`；模組只對`<article>`預宣告`on`。擴大或縮小範圍都是一個變量：

```css
/* 讓某個非 article 容器也吃 prose 樣式 */
section.essay { --han-prose: on; }

/* article 裡的某塊退出（如評論區、示範框） */
article .comments { --han-prose: off; }
```

> **作用域通則（全站適用）**：機能變量以style query（`@container style()`）讀取，查的是**祖先**——`--han-prose`要設在目標容器（或其祖先）上，其下所有後代一併生效或退出。

## 縮排——以字為尺

西文字母寬窄錯落，漢字方塊成格。中日韓縮排捨UA的40像素預設，改用漢字整數倍的空間——引文、圖表、清單共用同一縮排單位，版面縱橫對齊。

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-prose-indent` | `<length>` | `2em` |

此縮排單位作用於：

- **`<blockquote>`**——左右各縮一個單位（兩端各2em）。
- **`<figure>`**——同上，左右各縮一個單位。
- **`<ol>`／`<ul>`**——行首縮一個單位（`margin-inline-start`）。
- **`.poem-like`**——詩詞類段落，其`<p>`（或本身即`<p>`者）行首縮一個單位。

兩個巢狀特例，避免縮排疊加失衡：

- **巢狀`<blockquote>`**——引文中的引文只縮**半個單位**（`--han-prose-indent / 2`），退得比外層淺，層次才分明。
- **`<blockquote>`裡的`<figure>`**——縮排歸零（`initial`）。引文已經內縮，其中的圖表不再疊一層，以免縮排層層疊加。

因為以`em`計，縮排隨字級等比縮放，不必為響應式另設斷點。

## 對齊

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-prose-alignment-for-article-p` | `text-align`合法值 | `justify` |

prose範圍內的`<p>`預設兩端對齊（`justify`），漢字段落的右緣因此齊整、不參差。要回到齊頭散尾：設為`start`。

```css
article { --han-prose-alignment-for-article-p: start; }
```

> 變量名帶`article-p`是歷史沿革；實際作用於prose範圍內的**所有**`<p>`，不限字面上的`<article>`。

## 連續標題——間距歸零

標題與其緊接的下一塊之間，間距預設收成零——標題與所屬內文讀作一體，連續的標題（眉題貼主標）尤其如此；容器頂端的標題也不留上緣空隙。

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-prose-consecutive-headings-a-block-end` | `<length>` | `0` |
| `--han-prose-consecutive-headings-b-block-start` | `<length>` | `0` |

兩個變量分別是同一處間距的上下兩半，合起來把標題與下一塊之間的間距收攏：

- **`-a-block-end`**——前一個標題的`margin-block-end`。當一個標題後面緊跟着另一個標題（同級或更低級）或任何內文（`p`／`blockquote`／`ol`／`ul`／`section`）時，其下緣間距取此值。
- **`-b-block-start`**——後接元素的`margin-block-start`。標題之後緊跟的那一塊、以及容器裡的第一個標題，其上緣間距取此值。

兩者預設皆`0`，故間距完全歸零。要留一道小空隙（而非緊貼），把任一或兩者設為非零長度即可。

## 與fonts的接點

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-prose-fonts` | `on`｜`off` | `on` |

prose範圍內的`<blockquote>`預設換用強調字族（`--han-font-accent`，通常是楷體家族）——引文以字體區別於正文，是漢字排版的既有慣例。這是prose與[fonts模組](./fonts.html)刻意留的耦合點（變量名明言`prose-fonts`），故：

- 引文內的`<dfn>`／`<i>`／`<var>`會**還原**為預設字族（`--han-font-default`），不隨引文一起變楷體——否則它們在楷體引文裡就失去了各自的語意區別（見[語意樣式標準化](./semantics.html)：`<i>`／`<var>`本就以楷體表意）。
- 只在中日韓語境套用（`:lang(zh, ja, ko)`）。

不要這層字體耦合就關掉它：

```css
article { --han-prose-fonts: off; }
```

> `--han-prose-fonts`是少數**預設`on`**的`@property`註冊變量（多數機能開關預設`off`）。因為引文換楷體在舊版本是無條件行為，翻成新的opt-in預設會是一次無聲的破壞性改動——故保留`on`以續前行為。它巢狀在`--han-prose: on`之下，僅在prose開啓時有意義。
