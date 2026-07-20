---
title: 段落間距調整
---

# 段落間距調整

`han-prose`模組管塊軸的節奏：標題、段落、清單之間的間距去蕪存菁，縮排以字為尺——數位長文也舒適易讀。

## 開關與作用域

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-prose` | `on`｜`off` | `off`（`<article>`預設`on`） |

與其他模組不同，prose**預設只作用在`<article>`**——長文樣式不該漫延到UI。擴大或縮小範圍都是一個變量：

```css
/* 讓某個非 article 容器也吃 prose 樣式 */
section.essay { --han-prose: on; }

/* article 裡的某塊退出 */
article .comments { --han-prose: off; }
```

## 縮排——以字為尺

西文字母寬窄錯落，漢字方塊成格。中日韓縮排捨40像素的UA預設，用漢字整數倍的空間代之——blockquote、figure、清單全部同一把尺，版面縱橫對齊。

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-prose-indent` | `<length>` | `2em` |

## 對齊

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-prose-alignment-for-article-p` | `text-align`合法值 | `justify` |

漢字段落預設兩端對齊成塊。要回到齊頭：設為`start`。

## 連續標題

眉題緊貼主標時，兩者間距歸零、讀作一體：

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-prose-consecutive-headings-a-block-end` | `<length>` | `0` |
| `--han-prose-consecutive-headings-b-block-start` | `<length>` | `0` |

前者是前一個標題的`margin-block-end`，後者是後一個標題的`margin-block-start`。

## 與fonts的接點

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-prose-fonts` | `on`｜`off` | `on` |

prose範圍內的`<blockquote>`預設換用重點字體（`--han-font-accent`，通常是楷體家族）——引文以字體區別於正文，是漢字排版的老慣例。不要這層耦合就關掉它。
