---
title: 字體
---

# 字體

`han-fonts`模組接管字體堆疊：傳承字形webfont、依語言慣例的標點字體、楷體家族——填補系統字體在千萬終端上的美學空缺。

## 四層堆疊

每一份堆疊由四層組成，各層只認自己該管的字符：

1. **標點層**——Diantenjeom標點字體（只含標點碼位），按語言慣例選變體；
2. **Latin層**——web-safe西文字體，字形銳利、不含漢字，漢字自動穿透；
3. **CJK層**——傳承字形webfont（尚古黑體／明體等，`unicode-range`切片）或系統回落；
4. **通用字族**——`sans-serif`等兜底。

模組把這套堆疊在**每個元素**上組裝（而非只在`:root`——各層槽位變量因此能在任何子樹替換），最終產出四份composite：`--han-system-ui`／`--han-sans`／`--han-serif`／`--han-cursive`，並映射到三個語意角色：

| 角色變量 | 預設指向 | 用在 |
|----------|---------|------|
| `--han-font-default` | `--han-system-ui` | 文件與多數元素 |
| `--han-font-alternative` | `--han-serif` | 替代字體（標題等） |
| `--han-font-accent` | `--han-cursive` | 重點（`<i>`、prose引文等） |

## 標點字體

同一組Unicode標點碼位，各地慣例的字形與位置不同（置中vs偏倚、鈎形差異）。四個模式變量按語言選慣例：

| 變量 | 值 | 預設 | 作用語言 |
|------|----|------|---------|
| `--han-punctuation-hant` | `JIS`｜`MOE`｜`GB`｜`off` | `MOE` | `:lang(zh)`（繁中） |
| `--han-punctuation-hans` | `JIS`｜`MOE`｜`GB`｜`off` | `GB` | `:lang(zh-Hans)` |
| `--han-punctuation-ja` | `JIS`｜`MOE`｜`GB`｜`off` | `JIS` | `:lang(ja)` |
| `--han-punctuation-vertical-ko` | `KV`｜`off` | `KV` | `:lang(ko)`直排 |

`JIS`日規偏倚、`MOE`教育部置中、`GB`國標偏倚、`KV`韓文直排——任意搭配（例如簡中文本配置中標點），玩出排版新花樣。這組設定同時參與[行尾懸掛的自動判準](./lines.html)。

## 傳承字形

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-use-heritage-glyphs-for-hant` | `webfont`｜`system`｜`off` | `webfont` |
| `--han-use-cursive` | `webfont`｜`system`｜`off` | `webfont` |

- `webfont`——CJK層使用傳承字形webfont（繁中）／楷體webfont（`--han-use-cursive`）。
- `system`——CJK層改用風格相配的系統日文字體（Hiragino／Yu系）回落——覆蓋面較窄但零下載。
- `off`——不干預，交給系統預設。

### 換字體家族

webfont槽位是可換的：

| 變量 | 預設 |
|------|------|
| `--han-webfont-heritage-glyphs-sans` | `'Shanggu Sans', 'Shanggu Sans TC', 'Genki Gothic TC', 'Genki Gothic'` |
| `--han-webfont-heritage-glyphs-serif` | `'Shanggu Serif', 'Shanggu Serif TC', 'Genki Min TC', 'Genki Min'` |
| `--han-webfont-cursive-hant` | `'LXGW WenKai TC'` |

```css
/* 楷體換芫荽 */
:root { --han-webfont-cursive-hant: 'Iansui'; }
```

Latin層同樣可換：`--han-font-latin-sans`（預設`'Avenir Next', 'Segoe UI Variable', 'Segoe UI', Roboto`）、`--han-font-latin-serif`（`Palatino, Cambria`）、`--han-font-latin-cursive`。

## Web字體遞送

fonts模組只定義**家族名與堆疊**；woff2從哪來由你決定。傳承字形建議掛ziano CDN切片（依使用頻率分割、`unicode-range`按需下載），見[安裝與啓用](./install.html)；Diantenjeom標點字體同理（`@hanzi.pro/diantenjeom`）。模組自帶兩個小型字體資產：全形空格校準字體（`em-space.woff2`，供行內回落定寬）與注音字體（`zhuyin.serif.woff2`）。

## 永不喊卡的堆疊

所有槽位變量以`@property`註冊、預設哨兵值——某層沒配置時堆疊靜默跳過該層而不是整組失效。這讓「只用標點字體、不用傳承字形」這類部分配置天然成立。
