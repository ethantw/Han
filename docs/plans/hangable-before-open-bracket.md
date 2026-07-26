# 懸掛標點後接開括號：擠壓失效

`refinePunctuation` 把可懸掛標點包成 `<h-char><h-layer>…</h-layer></h-char>`，
`h-layer` 是 `position: absolute`。這讓字形離開行內流，於是**它與後方開括號的
成對擠壓被打斷**——`。「` 在行中會寬出 0.5em。

**已完成**（2026-07-26，commit 8a88cf3）。屬性定為 `data-followed-by`。

實作後補記——**中点類要擠，middle 其餘六個不擠**：

拿掉 han.css 的裸基線量過整組（同樣字體字級）：

| 後接 | 無 han.css | 說明 |
|---|---|---|
| 十個開括號 | 1.5em | 會擠 → 修 |
| `·` `・`（中点類） | 1.5em | 會擠 → 修 |
| `＼／－゠＆＿` | **2em** | **不擠** → 不能修 |

`PUNCT_MIDDLE_CHARS` 混了兩種東西：真正的中点類（JLREQ 中点類，兩側半形空
可壓縮），和只是被歸在同一桶的全形符號。對後六個補半個 em 會讓它們比任何
其他情境都窄半格，所以新增 `PUNCT_INTERPUNCT_CHARS = '·・'`，`data-followed-by`
的 `middle` 只認這兩個。

其餘補記：

- **修正手法改用負邊距**，不是半形填充物。`font-size-adjust: ic-width 0.5`
  掛在這個 pseudo 上量到 ~0.3em 而非 0.5em——`Han Em Space` 是 Courier 加
  `size-adjust`，沒有表意字形可量，ic 回退值與那層縮放疊乘。負邊距不經過
  字體度量。
- **行尾懸掛完全不受影響**：14–20em 掃過一遍，斷行位置逐格相同，只有行中
  那幾格會動。
- **`''` 陷阱**：`'…'.includes('')` 為真，所以文末的標點一度被報成後接
  `open`。`followerSubtype` 現在跟 `classifyPunctuation` 一樣先擋空字串。
- **順帶修好兩個既有紅燈**：e2e fixture 引錯入口（如下），以及 `iss.test.ts`
  還在斷言舊的 `insert` 探測（9115941 改成 `normal` 時漏改）。

**另一個同源、但沒修的 bug**：`。，`（包裹落在**第二顆**字上）——`，` 是可
懸掛的，它的 `h-layer` 一樣脫離流，於是**前面**那顆 `。` 的擠壓也斷了：裸基線
1.5em，包裹後 2em。要修需要一個對稱的 `data-preceded-by` 掛鉤，和一個
`margin-inline-start: -.5em`。範圍是這次的兩倍，先記著。

---

## 一、量到的事實

`Diantenjeom Serif JIS` ＋ `Shanggu Serif TC`，20px／行寬 18em，Chromium，
`。「` 兩顆都在行中（未觸行尾），量各自的 client rect（單位 em，相對段首）：

| | `。` | `「` | 合計 |
|---|---|---|---|
| `--han-punctuation-refinement: none`（無包裹） | 15 → 16 | 16 → **16.5** | **1.5em** ✓ |
| `auto`（懸掛生效） | 15 → 16 | 16 → **17** | **2em** ✗ |

無包裹時引擎把 `「` 的首半空擠掉（0.5em）；一旦 `。` 被包進絕對定位的
`h-layer`，`「` 拿回整個 em。這正是本工作區已記錄過的現象——成對擠壓跨不過
原子行內盒／脫離流的內容（`diantenjeom/docs/pair-squeeze-and-markup.md`）。

行尾那一格（行寬 16em，`。` 落在行尾、`「` 起新行）兩者量到完全一致，
**懸掛本身沒問題**，壞的只有行中那一格。

### 為什麼不能改去修 `「`

在瀏覽器實際走的路徑上，`「` 根本沒有元素可選。`effectiveJSMode` 見到原生
`text-spacing-trim: trim-start` 就把 `auto` 降成 `hang`，只有 `wrapHangable`
會跑，它只包可懸掛的那一顆：

```html
甲乙丙丁<h-char data-punct="hangable"><h-layer>。</h-layer></h-char>「戊己
```

`「` 是裸文字節點。所以修正只能掛在 `。` 這顆 `h-char` 上——這也正是你要那個
屬性的原因。

---

## 二、命名

庫目前對外發出的屬性只有這些：

```
data-punct                     空格分隔的 token：open close end middle consecutive hangable
data-consecutive-pos           start | inner | end
data-followed-by-adjacent-line 布林（adjacent-lines.ts）
```

看得出兩條既有規律：**字元自身的分類**進 `data-punct` 的 token 集；
**與鄰居的關係**另開一個 `data-*`，並且用具名概念前綴（`data-consecutive-pos`
屬於 `consecutive` 這個概念）。你提的 `followed-by-open-bracket` 語意精準、
也跟 `data-followed-by-adjacent-line` 的動詞一致，只是長。

### 建議：`data-punct-next="open"`

```html
<h-char data-punct="hangable" data-punct-next="open"><h-layer>。</h-layer></h-char>
```

```css
h-char[data-punct~="hangable"][data-punct-next="open"] { … }
```

理由：

1. **沿用 `data-consecutive-pos` 的形狀**——鄰居關係自己一個屬性、列舉値，
   不塞進 `data-punct` 的 token 集（那裡放的是這顆字自己是什麼）。
2. **値直接重用 `PunctSubtype`**（`open | close | end | middle`），不新造詞彙，
   TS 型別現成。
3. **免費的擴充**：哪天需要「後接 middle」或「後接 close」，值填進去就好，
   不用再開一個屬性名。
4. `data-punct` / `data-punct-next` 讀起來成對，CSS 裡也是一組。

### 備選

| 候選 | 好處 | 代價 |
|---|---|---|
| `data-next-punct="open"` | 語序更像英文 | 跟 `data-punct` 排不成前綴組，字典序也散開 |
| `data-followed-by="open"` | 動詞與 `data-followed-by-adjacent-line` 一致 | 光看屬性名不知道「後面那個」是標點還是別的東西 |
| `data-punct` token `pre-open` | 全部集中在一個屬性 | 打破「自身分類 vs 鄰居關係」的分工；且 token 沒有値，將來要區分 open/middle 就得再造 `pre-middle` |

我推 `data-punct-next`。若你偏好動詞式，`data-followed-by="open"` 是我第二選。

---

## 三、要改的程式碼

### 1. `wrapHangable`（`hang` 模式——瀏覽器實際走的那條）

現在用 `HANGABLE_PUNCT` 單字元 regex，`(?![…])` 只否定不捕獲，所以拿不到後一字。
比照 `CJK_PUNCT_RUN_WITH_NEXT` 的做法，改成前瞻**帶捕獲**：

```ts
const HANGABLE_PUNCT_WITH_NEXT = new RegExp(
  `[、，。．](?![${PUNCT_CLOSE_CHARS}${PUNCT_END_EXTRA}])(?=(.?))`,
  'gs',
)
```

再由捕獲的字算出 `data-punct-next`（用現成的 `classifyPunctuation`，取其
第一個 token）。

### 2. `wrapBoth`（`auto` 模式）

它已經有 `nextAfterRun` 與 run 內的 `runText[i + 1]`，就是算 `hangable` 用的
那個字元；同一個字元餵給 `classifyPunctuation` 即可，零額外掃描。

### 3. 型別與匯出

- `PunctSubtype` 不動（値直接重用）。
- 新增 `export const PUNCT_NEXT = 'data-punct-next'`，比照
  `FOLLOWED_BY_ADJACENT_LINE` 的做法，讓 CSS／測試有單一出處。
- `uninstallFallbacks` 已經在移除整顆 `h-char`，屬性隨之消失，不必另外清。

### 4. CSS（`src/css/lines.with-js.css` § 標點懸掛）

在 `@container style(--han-state-hanging-punctuation: on)` 的 hangable 規則裡加：

```css
/* 後接開括號時，引擎的成對擠壓被 h-layer 的脫離流打斷（量測：0.5em 寬出）。
   自己把那半個 em 讓回來——填充物只佔半個 em，後方開括號的整個 em 就補上，
   合計回到 1.5em。行尾時這個空白照舊整個 collapse，懸掛不受影響。 */
&[data-punct-next="open"]::after {
  font-size-adjust: ic-width 0.5;
}
```

（`font-size-adjust: ic-width 0.5` 與擠壓區塊裡那兩個半 em 佔位一致，
不另發明手法。實作時會量 `。「` 是否回到 1.5em、行尾格是否不動。）

---

## 四、待你裁示

1. **屬性名**：`data-punct-next="open"` 可以嗎？
2. **只管開括號，還是連 middle 一起？** `HANG_BLOCKING_CHARS` 只擋 close ＋
   end-extra，所以可懸掛標點後面除了開括號，還可能是 `·＼／－゠＆・＿`
   這些 middle。`。·` 這種配對引擎會不會擠、該不該擠，我沒把握，所以計畫
   只做開括號；屬性設計本身兩者都容得下（值填 `middle` 即可）。
3. **順帶一個既有 bug，要不要一起修？**
   `tests/e2e/fixtures/hanging.html` 引的是 `/dist/han.js`——那是純匯出、無副作用
   的模組，不會自動安裝，所以 fixture 裡一顆 `h-char` 都沒有，`hanging.spec.ts`
   三條測試全紅（在目前那批既有失敗裡）。改成 `/dist/han.auto.js` 就通。
   一行的事，但屬於另一個問題，等你點頭再一起或另開。

---

## 五、驗收

- [ ] `。「`／`，「`／`。《`／`、（` 行中合計回到 1.5em（等同無包裹）
- [ ] 行尾懸掛那一格與改前逐像素相同
- [ ] `。』`／`。，` 這些被 `HANG_BLOCKING_CHARS` 擋掉的組合仍然**不**帶
      `hangable`，也不帶新屬性
- [ ] `auto`（無原生 trim-start）與 `hang`（有）兩條路徑都發出新屬性
- [ ] 重複跑 `refinePunctuation` 仍然 idempotent（`h-char` 子樹照舊被 ignore）
- [ ] 單元測試補：兩條路徑的屬性值、無後續字元時不發屬性
