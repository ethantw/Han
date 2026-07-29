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

傳承字形的CJK層逐語言各有開關；只有繁中預設開，簡日韓預設關。

| 變量 | 選擇器 | 值 | 預設 |
|------|--------|----|------|
| `--han-use-heritage-glyphs-for-hant` | `:lang(zh-Hant)` | `webfont`｜`system-ja`｜`off` | `webfont` |
| `--han-use-heritage-glyphs-for-hans` | `:lang(zh-Hans)` | `webfont`｜`off` | `off` |
| `--han-use-heritage-glyphs-for-ja` | `:lang(ja)` | `webfont`｜`off` | `off` |
| `--han-use-heritage-glyphs-for-ko` | `:lang(ko)` | `webfont`｜`off` | `off` |

- `webfont`：用傳承字形webfont（尚古／源起，由下方「換字體家族」選）為該語言的CJK層主體；載入失敗時回落到該語言自己的系統字體。
- `system-ja`（僅繁中）：跳過Web字體，借日文系統字體（Hiragino→Yu）當傳承字形替身——日文系統字繪出最接近傳承的共用字形，而繁中系統字（蘋方TC／微軟正黑）是本專案要避開的國標過度楷化形。只有繁中需要這條逃生口；簡日韓的`off`本就回落到各自（貼近傳承的）系統字。
- `off`：不設傳承CJK層，交給通用字族（→該語言的OS字體）。

> ⚠️ **字形以傳承字形（舊字形／正字）為主，不符合JIS／GB國家標準字形。** 對`:lang(ja)`，共用漢字顯示繁中傳承形而非日本新字体（骨・直・漢等有別）；對`:lang(zh-Hans)`，整體風格偏繁而非GB標準。**適合作為繁簡日韓混排、四種文字需同時出現時的統一預設字體**；對字形合規（JIS／GB）有要求者請保持`off`。

## 楷體

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-use-cursive` | `webfont`｜`system`｜`off` | `webfont` |

控制`--han-font-accent`的CJK層（`<i>`、`<var>`、prose引文等用的楷體），逐語言各有堆疊：

- `webfont`：繁中霞鶩文楷TC為主，回落Klee／BiauKai／DFKai-SB／Kaiti TC／Hiragino Mincho／Yu Mincho；簡中霞鶩文楷／Kaiti SC；日文Klee。
- `system`：跳過Web字體，直接用上列系統楷體。
- `off`：不設楷體CJK層，`--han-font-accent`回落到通用`cursive`。

## 換字體家族

傳承字形webfont可選**尚古**或**源起**，一個全域開關同時切黑體與明體：

| 變量 | 值 | 預設 |
|------|----|------|
| `--han-webfont-heritage-family` | `shanggu`｜`genki` | `shanggu` |

- `shanggu`（尚古）：真・pan-CJK——繁簡日韓漢字全備、現代諺文全備（11172音節）。**韓文（`:lang(ko)`）務必用尚古。**
- `genki`（源起）：較小。漢字全備，但諺文只涵蓋KS X 1001常用集（2350字）且無字母（Jamo），對韓文偏弱；`:lang(ko)`建議留尚古。

> 兩家族的CJK拡張B（U+20000↑）皆<5%，超出BMP的罕用字（罕見姓名／地名字）會回落到系統字。

底層的黑／明槽位仍可直接覆寫（`--han-webfont-heritage-family`即透過它們生效）：

| 變量 | 預設（＝尚古） |
|------|------|
| `--han-webfont-heritage-glyphs-sans` | `'Shanggu Sans', 'Shanggu Sans TC'` |
| `--han-webfont-heritage-glyphs-serif` | `'Shanggu Serif', 'Shanggu Serif TC'` |
| `--han-webfont-cursive-hant` | `'LXGW WenKai TC'` |

```css
/* 全域改用源起 */
:root { --han-webfont-heritage-family: genki; }
/* 楷體換芫荽 */
:root { --han-webfont-cursive-hant: 'Iansui'; }
```

Latin層同樣可換：`--han-font-latin-sans`（預設`'Avenir Next', 'Segoe UI Variable', 'Segoe UI', Roboto`）、`--han-font-latin-serif`（`Palatino, Cambria`）、`--han-font-latin-cursive`（預設同serif）。更底層的六個槽位變量（`--han-font-punctuation-*`／`--han-font-cjk-*`）一般由上述模式開關驅動，但也可直接覆寫。

## Web字體遞送

fonts模組只定義**家族名與堆疊**；woff2從哪來由你決定。傳承字形建議掛ziano CDN切片（依使用頻率分割、`unicode-range`按需下載），見[安裝與啓用](./install.html)；Diantenjeom標點字體同理（`@hanzi.pro/diantenjeom`）。模組自帶兩個小型字體資產：全形空格校準字體（`em-space.woff2`，供行內擠壓／間隙定寬）與注音字體（`zhuyin.serif.woff2`）。

## 不會整組失效的堆疊

六個槽位變量以`@property`註冊、預設哨兵字族名`HanNone`（匹配不到任何真實字體、字體匹配自動跳過）。這保證composite永遠能解析：某層沒配置時堆疊靜默略過該層，而不是因一個未解析的`var()`使整組`font-family`失效。`off`各分支把槽位設回`initial`（即還原成`HanNone`哨兵），讓外層的`var(槽位), 下一層`回落鏈接手。「只用標點字體、不用傳承字形」這類部分配置因此天然成立。
