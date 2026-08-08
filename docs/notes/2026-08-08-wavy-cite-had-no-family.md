# 甲式書名號的鄰行縫：`<cite>` 在撤銷名單裡，卻沒有任何家族會標記它

2026-08-08。手冊首頁為此帶了半年的補丁，這次修在庫裡。

## 症狀

`同讀《武經總要》〈字驗〉一篇`——一部書與它的一篇。兩個相鄰的甲式書名號（波浪
底線）之間必須看得出斷開，併成一條的話整行讀作一個長書名「武經總要字驗」，
語法就沒了。

實測：`<u>` 相鄰對有縫（3px），`<cite>` 相鄰對 **0px**。而且只在 **han.js 跑過
之後**才壞——純 CSS 的頁面是對的。

## 成因

兩層後備對 `<cite>` 的看法不一致：

- `semantics.css`（純 CSS）：`@container style(--han-cite-title-marks: wavy)` 底下
  `:is(u, ins, cite:lang(zh)):has(+ u, + ins, + cite:lang(zh))` → 給縫。**含 cite。**
- `semantics.with-js.css`（JS 跑過後）：`:where(u, ins, s, del, cite)` 只要沒被
  標記就 `margin-inline-end: initial` → **撤縫，也含 cite**。
- 而 JS 的家族表 `SELECTORS_FOR_ELEMENTS_WITH_LINES = ['u, ins', 's, del']`
  ——**不含 cite**。

於是 JS 一跑：撤銷規則對 cite 生效，重新標記卻永遠跳過 cite。撤了不補。

`<cite>` 之所以沒有家族，是因為它**只有在 wavy 模式下才畫線**，而模式是 CSS 的
事實（style query），JS 讀不到級聯。當年的判斷是「別讓每一頁為了甲式付一次掃描
成本」，所以留給用到甲式的那一頁自己補——手冊的
`manual/public/home/wavy-cite-gap.js` 就是那個補丁：140 行，含一個 MutationObserver
（因為控制台重跑 fallbacks 時會先把標記全抹掉，而那一刻**沒有事件**，落在
config 廣播之後約 455ms）。

## 修法：第二顆標記

JS 不判斷模式，只記錄**是哪一家配對成功**；由 CSS 決定那一家此刻有沒有線：

| 標記 | 家族 | CSS 何時給縫 |
|---|---|---|
| `data-followed-by-adjacent-line` | `u`+`ins`、`s`+`del` | 一律 |
| `data-followed-by-adjacent-wavy` | 有 `<cite>` 參與的配對 | 只在 `--han-cite-title-marks: wavy` |

家族表因此從「同家族選擇器字串」升級成**有向的配對規則**
`{ subject, next, attr }`——因為這一家是不對稱的：`u`→`cite` 的縫屬於前面那顆
`u`，但 `u`→`u` 是直線家族的事。預設四條（`ADJACENT_LINE_PAIRING_RULES`，已導
出）：

```
u, ins   → u, ins    : -line
s, del   → s, del    : -line
cite     → u, ins, cite : -wavy
u, ins   → cite      : -wavy
```

`cite` 在 JS 側**不寫 `:lang(zh)`**：語言與模式的判斷都歸 CSS，那裡才讀得到。

一顆布林標記做不到這件事——那等於在標記時就把模式定死，`bracket` 模式下會在
《 前面留一道多餘的 2px。

成本：JS 側多兩趟 `querySelectorAll`（4 趟 → 6 趟）。這就是當年不想付的那筆
「每頁都掃甲式」，現在付了；換掉的是 140 行頁面補丁 ＋ 一個 MutationObserver，
而且從此**所有**用甲式的頁面都對，不必各自補。位元組成本約等於零：標記只出現
在真的有相鄰配對的地方。

## 驗收

- 手冊首頁站①（甲式）3px、`.Papers` 的乙式 0px（沒被波及）。
- 樣張兩頁（瀏覽器端／伺服器端）皆 2px，22 個區塊高度逐一相等。
- `tests/e2e/mark-diagram.spec.ts` § 甲式 adjacent-title gap 從「驗頁面補丁還在」
  升級成庫的迴歸鎖，包含「控制台重跑一輪 fallbacks 之後縫還在」——那一輪會先
  抹掉全部標記再重標，是最容易靜默壞掉的一刻。
- 單元測試三條（配對用的是 wavy 標記而非 line 標記、專名號緊接波浪書名號也標、
  `uninstallFallbacks` 兩顆標記都撤）。
