---
title: 字體
---

# 字體

`han-fonts`模組接管字體堆疊：傳承字形Web字體、依語言慣例的標點字體、楷體家族，以Web字體補足系統字體的字形缺失。原則是按字元各取所需：同一份堆疊裡，標點、西文、漢字各由專司的字體提供，避開碼位重疊的衝突。

## 四層堆疊與角色

每一份composite堆疊由四層組成，各層只認自己該管的字符：

1. **標點層**：Diantenjeom標點字體（只含標點碼位），按語言慣例選變體；
2. **Latin層**：web-safe西文字體，字形銳利、不含漢字，漢字自動穿透；
3. **CJK層**：傳承字形Web字體（尚古黑體／明體，`unicode-range`切片）或系統回落；
4. **通用字族**：`sans-serif`／`serif`／`cursive`作為最終回落。

四層合成四份composite：`--han-system-ui`／`--han-sans`／`--han-serif`／`--han-cursive`，結構一致（以`--han-serif`為例：標點serif＋Latin serif＋CJK serif＋`serif`），僅通用字族尾不同（`system-ui, sans-serif`／`sans-serif`／`serif`／`cursive, serif`）。四份composite再映射到三個語意角色（外加注音）：

| 角色變量 | 預設指向 | 用在 |
|----------|---------|------|
| `--han-font-default` | `--han-system-ui` | 文件與多數元素 |
| `--han-font-alternative` | `--han-serif` | 替代字體（明體／襯線替身） |
| `--han-font-accent` | `--han-cursive` | 重點（`<i>`、`<var>`、prose引文等） |
| `--han-font-zhuyin-serif` | `'Han Zhuyin Serif', cursive, serif` | 注音`<rt>` |

模組把這套堆疊在**每個元素**上組裝（`:where(*)`而非只在`:root`）：因為自訂屬性在宣告它的元素上一次算定、之後只繼承那個定字串；若只在`:root`宣告，各層槽位就凍結在根的值，子樹再改也沒用。逐元素重組，才能讓任何子樹替換某一層（如某個`<li>`單獨換標點慣例）真正生效。

## 標點字體

同一組Unicode標點碼位，各地慣例的字形與位置不同。四個模式變量按語言選慣例：

| 變量 | 值 | 預設 | 作用語言 |
|------|----|------|---------|
| `--han-punctuation-hant` | `JIS`｜`MOE`｜`GB`｜`off` | `MOE` | `:lang(zh)`（繁中） |
| `--han-punctuation-hans` | `JIS`｜`MOE`｜`GB`｜`off` | `GB` | `:lang(zh-Hans)` |
| `--han-punctuation-ja` | `JIS`｜`MOE`｜`GB`｜`off` | `JIS` | `:lang(ja)` |
| `--han-punctuation-vertical-ko` | `KV`｜`off` | `KV` | `:lang(ko)`直排 |

- `JIS`：日規（JIS X 0208），句末點號（，。、）靠格尾，其餘置中。
- `MOE`：教育部標準，主要標點一律置中於全形格。
- `GB`：國標（GB/T 15834），八個主要標點一律靠格尾。
- `KV`：韓文直排標準（僅涵蓋直排；橫排的韓漢混排不在Diantenjeom範圍）。
- `off`：關閉該語言的Diantenjeom，標點回落到正文字體自身的字形。

可任意搭配，例如簡中文本配置中式標點。這組設定同時參與[行尾懸掛的自動判準](./lines.html)：置中式（MOE）不懸掛、偏倚式（JIS／GB）懸掛。

## 傳承字形

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-use-heritage-glyphs-for-hant` | `webfont`｜`system`｜`off` | `webfont` |

繁中（`:lang(zh-Hant)`）的CJK層由此變量控制：

- `webfont`：用尚古黑體／明體webfont為主；載入失敗時回落到Hiragino（macOS／iOS）、Yu Gothic／Yu Mincho（Windows）、Noto CJK JP（Android），皆為風格相配、最接近傳承字形的系統字體。
- `system`：跳過Web字體，直接用上述日文系統字體當CJK層，覆蓋面較窄但零下載。
- `off`：不設CJK層，交給通用字族或瀏覽器預設。

> 僅作用於繁中。簡中的傳承字形尚未實作對應開關；簡中作者可暫時直接覆寫`--han-font-cjk-sans`／`--han-font-cjk-serif`。

## 楷體

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-use-cursive` | `webfont`｜`system`｜`off` | `webfont` |

控制`--han-font-accent`的CJK層（`<i>`、`<var>`、prose引文等用的楷體），逐語言各有堆疊：

- `webfont`：繁中霞鶩文楷TC為主，回落Klee／BiauKai／DFKai-SB／Kaiti TC／Hiragino Mincho／Yu Mincho；簡中霞鶩文楷／Kaiti SC；日文Klee。
- `system`：跳過Web字體，直接用上列系統楷體。
- `off`：不設楷體CJK層，`--han-font-accent`回落到通用`cursive`。

## 換字體家族

各Web字體槽位是可換的：

| 變量 | 預設 |
|------|------|
| `--han-webfont-heritage-glyphs-sans` | `'Shanggu Sans', 'Shanggu Sans TC', 'Genki Gothic TC', 'Genki Gothic'` |
| `--han-webfont-heritage-glyphs-serif` | `'Shanggu Serif', 'Shanggu Serif TC', 'Genki Min TC', 'Genki Min'` |
| `--han-webfont-cursive-hant` | `'LXGW WenKai TC'` |

```css
/* 楷體換芫荽 */
:root { --han-webfont-cursive-hant: 'Iansui'; }
```

Latin層同樣可換：`--han-font-latin-sans`（預設`'Avenir Next', 'Segoe UI Variable', 'Segoe UI', Roboto`）、`--han-font-latin-serif`（`Palatino, Cambria`）、`--han-font-latin-cursive`（預設同serif）。更底層的六個槽位變量（`--han-font-punctuation-*`／`--han-font-cjk-*`）一般由上述模式開關驅動，但也可直接覆寫。

## Web字體遞送

fonts模組只定義**家族名與堆疊**；woff2從哪來由你決定。傳承字形建議掛ziano CDN切片（依使用頻率分割、`unicode-range`按需下載），見[安裝與啓用](./install.html)；Diantenjeom標點字體同理（`@hanzi.pro/diantenjeom`）。模組自帶兩個小型字體資產：全形空格校準字體（`em-space.woff2`，供行內擠壓／間隙定寬）與注音字體（`zhuyin.serif.woff2`）。

## 不會整組失效的堆疊

六個槽位變量以`@property`註冊、預設哨兵字族名`HanNone`（匹配不到任何真實字體、字體匹配自動跳過）。這保證composite永遠能解析：某層沒配置時堆疊靜默略過該層，而不是因一個未解析的`var()`使整組`font-family`失效。`off`各分支把槽位設回`initial`（即還原成`HanNone`哨兵），讓外層的`var(槽位), 下一層`回落鏈接手。「只用標點字體、不用傳承字形」這類部分配置因此天然成立。
