---
title: 段落間距調整
---

# 段落間距調整

`han-prose`模組管塊軸方向的節奏：標題與所屬內文的距離、引文的字體，讓數位長文舒適易讀。它是唯一**預設不全域生效**的模組：長文的排版主張不該波及介面，故只在`<article>`（及你指定的容器）裡開。

> 區塊縮排（引文、圖表、清單）曾經住在這裡，現已移入[語意樣式標準化](./semantics)。理由是作用範圍：縮排改寫的是UA本來就有的縮排，凡中日韓內容都該套，不該以「這裡是不是文章」為條件。

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

## 連續標題——間距歸零

標題與其緊接的下一塊之間，間距預設收成零：標題與所屬內文讀作一體，連續的標題（眉題貼主標）尤其如此；容器頂端的標題也不留上緣空隙。

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-prose-consecutive-headings-a-block-end` | `<length>` | `0` |
| `--han-prose-consecutive-headings-b-block-start` | `<length>` | `0` |

兩個變量分別是同一處間距的上下兩半，合起來把標題與下一塊之間的間距收攏：

- **`-a-block-end`**：前一個標題的`margin-block-end`。當一個標題後面緊跟着另一個標題（同級或更低級）或任何內文（`p`／`blockquote`／`ol`／`ul`／`section`）時，其下緣間距取此值。
- **`-b-block-start`**：後接元素的`margin-block-start`。標題之後緊跟的那一塊、以及容器裡的第一個標題，其上緣間距取此值。

兩者預設皆`0`，故間距完全歸零。要留一道小空隙（而非緊貼），把任一或兩者設為非零長度即可。

## 與fonts的接點

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-prose-fonts` | `on`｜`off` | `on` |

prose範圍內的`<blockquote>`預設換用強調字族（`--han-font-accent`，通常是楷體家族），引文以字體區別於正文，是漢字排版的既有慣例。這是prose與[fonts模組](./fonts.html)刻意留的耦合點（變量名明言`prose-fonts`），故：

- 引文內的`<dfn>`／`<i>`／`<var>`會**還原**為預設字族（`--han-font-default`），不隨引文一起變楷體，否則它們在楷體引文裡就失去了各自的語意區別（見[語意樣式標準化](./semantics.html)：`<i>`／`<var>`本就以楷體表意）。
- 只在中日韓語境套用（`:lang(zh, ja, ko)`）。

不要這層字體耦合就關掉它：

```css
article { --han-prose-fonts: off; }
```

> `--han-prose-fonts`是少數**預設`on`**的`@property`註冊變量（多數機能開關預設`off`）。因為引文換楷體在舊版本是無條件行為，翻成新的opt-in預設會是一次無聲的破壞性改動，故保留`on`以續前行為。它巢狀在`--han-prose: on`之下，僅在prose開啓時有意義。
