# 符號代圖標 → SVG

狀態：**全部完成（2026-08-02）**。1–10 見 §8；11（`💡`）走 §5 的（丙），owner 自己畫了一顆交來；另把 `variables.css` 的日／月一併併進來（§9）。對象是 `manual/` 全站（首頁 ＋ 手冊 ＋ `<han-console>`）
裡**拿現成的 Unicode 符號當圖標**的地方——`↺ 使用預設值`、`⎘` 複製鍵、`▾`
下拉角標、`⌕` 搜尋、`‹ ›` 收合、`＋ －` 展合、`💡` 提示。這些字符的字面來自
使用者系統裡的某一顆後備字體，字重、光學尺寸、基線位置全部不受控，與本站
自己畫的品牌記號（`brand.css` 的 `<svg>`）並排時尤其突兀。

判準只有一條：**這個字符是在「當圖標用」，還是在「當字用」？** 當字用的一律
不動（見 §6）。

---

## 1　清單

| # | 現況 | 用途 | 出現處 | 處置 |
|---|---|---|---|---|
| 1 | `↺` | 使用預設值（單控件） | `manual/public/components/console-config.js:270` | SVG `reset` |
| 2 | `↺` | 使用預設值（度量群組） | `manual/public/components/console-metrics.js:71` | 同上 |
| 3 | `⎘` | 複製（playground 各 pane） | `manual/public/home/snippet.js:44` | SVG `copy` |
| 4 | `⎘` | 複製（宣言、結語的安裝碼） | `manual/home/manifesto.html:49`、`manual/home/closing.html:32` | 同上 |
| 5 | `✓` | 複製成功回饋 | `manual/public/home/snippet.js:189`、`manual/public/home.js:70` | SVG `check` |
| 6 | `✓` | 語言切換的目前項 | `manual/_nav.js:171`（＋ `manual/vite.config.js:810` 的複本） | 同上 |
| 7 | `▾` | 語言切換的角標 | `manual/_nav.js:181`（＋ `vite.config.js:817`） | SVG `chevron` |
| 8 | `⌕` | 站內搜尋 | `manual/_layout.html:63` | SVG `search` |
| 9 | `‹` / `›` | console 收合／展開 | `manual/public/home/console.css:189,193` | SVG `chevron`，展開態 `scale(-1,1)` |
| 10 | `＋` / `－` | `<details>` 群組展合 | `manual/public/home/controls.css:61,67` | SVG `plus` / `minus` |
| 11 | `💡` | 手冊 TIP 呼出框 | `manual/public/manual/article.css:210` | 見 §5（唯一需要生成的一顆，或直接拿掉） |

§4 給 1–10 的完整 SVG，可直接貼。

---

## 2　交付機制：mask 空盒，不是 inline `<svg>`

**全部走 `mask-image` ＋ `background: currentColor` 的空 inline-block。**
不用 inline `<svg>`，理由是量過的：

> inline `<svg>` 的基線在 Chrome 不等於它的下緣，`vertical-align` 對它失效；
> 只有 `<img>`／空 inline-block／mask 盒能乾淨對齊。
> —— `han/docs/notes/2026-07-21-svg-glyph-baseline-alignment.md`（workspace ledger）

本輪十一顆圖標**全部貼著文字排**（`↺ 使用預設值`、`⌕` 貼著輸入框、`✓` 在選單
項尾），對齊就是主要需求。`brand.css:127-133` 已經為了同一個理由改用 mask 盒，
本輪沿用同一套，不新增第二種做法。

順帶拿到的：`currentColor` 讓深色模式、`:hover` 的 accent 色、`opacity` 全部
自動跟著現有的 `--palette-*` 走，不必為圖標另開一層顏色 token。

### 2.1　落點

新增 `manual/public/common/icons.css`（與 `brand.css` 同層，全站共用；
`<han-console>` 的 shadow root 需要 adopt 一次，見 §7 步驟一）：

```css
/* 圖標層 —— 一顆圖標 ＝ 一個空盒 ＋ 一張 mask。
   mask 簡寫 · Baseline 2023（Safari 15.4 起無前綴）。 */
:root {
  --icon-reset: url("data:image/svg+xml,%3Csvg …%3C/svg%3E");
  /* …每顆一行，見 §4 */
}

:where([data-icon]) {
  display: inline-block;
  inline-size: 1em;
  block-size: 1em;
  /* 光學置中：1em 的方盒配 CJK 行高，中心比基線高 .09em；量出來的值，
     不是 magic number——換字級不必改，em 制自動跟。 */
  vertical-align: -0.09em;
  background: currentColor;
  mask: var(--icon) center / contain no-repeat;
}
```

用法（HTML）：

```html
<button type="button" data-copy>
  <span data-icon="copy" aria-hidden="true"></span>
  <span class="sr-only">{{ copyLabel }}</span>
</button>
```

用法（CSS `content:` 那三處，§1 的 9／10／11）：偽元素照舊，只把 `content`
換成空字串＋mask：

```css
&::after {
  content: '';
  display: inline-block;
  inline-size: 1em;
  block-size: 1em;
  background: currentColor;
  mask: var(--icon-plus) center / contain no-repeat;
}
&[open]::after { mask-image: var(--icon-minus); }
```

### 2.2　狀態切換改宣告式

複製鍵現在是 `$btn.textContent = '✓'` 一路改回 `'⎘'`——換成 SVG 之後
**不再動 textContent**，改蓋 `data-state`：

```js
$btn.dataset.state = 'copied'
setTimeout(() => delete $btn.dataset.state, 1200)
```

```css
[data-copy] [data-icon] { mask-image: var(--icon-copy); }
[data-copy][data-state='copied'] [data-icon] { mask-image: var(--icon-check); }
```

`intents → state → apply` 的分工這樣才對得上（web-style § FP/宣告式 TS），
順便讓「複製成功」有機會加一個 120ms 的過場而不是硬切。

---

## 3　形制規範（給 §5 的生成 prompt 用同一份）

要讓十一顆讀起來是**一套**，而不是十一個地方各拿一顆字符：

- **24×24 viewBox**，`stroke-width: 2`，`fill="none"`，路徑吸在整數格線上。
- **`stroke-linecap: square`、`stroke-linejoin: miter`**——不要圓角。
  依據是本站自己的品牌記號：`_layout.html` 的 `BrandMark` 用的正是
  `stroke-linecap="square" stroke-linejoin="miter"`，那是活字／明體的收筆感，
  圓角圖標會和它打架。
- **線性、單一筆畫優先**，不用填充塊（`▾` 現在是實心三角，改成線性角標，
  見 §4.7 的取捨）。
- **視覺重量對齊正文**：2/24 的線寬在 1em 盒裡 ≈ 0.083em，與內文字重相當；
  放在 `--fs-small` 的標籤旁不會過粗。
- **不畫外框、不畫圓底**，本站沒有任何圖標帶容器。

### 3.1　data URI 編碼規則

CSS 裡只轉義三個字元：`<` → `%3C`、`>` → `%3E`、`#` → `%23`，其餘保持原樣
（可讀性優先，也避免 base64 讓 diff 變成一團）。屬性用**單引號**，外層 `url()`
用雙引號。mask 讀的是 alpha，所以 `stroke` 給 `%23000` 即可，顏色由
`background: currentColor` 決定。

---

## 4　可直接貼的 SVG（1–10）

以下皆為 24×24、`fill='none' stroke='%23000' stroke-width='2'
stroke-linecap='square' stroke-linejoin='miter'`（下稱 `$A`）。

**4.1　reset（↺ 使用預設值）** —— 逆時針缺口圓 ＋ 起點箭頭。逆時針是「回到
原處」的通用語彙，順時針會讀成「重新整理」。

```
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' $A>
  <path d='M3 12a9 9 0 1 0 9-9 9.7 9.7 0 0 0-6.9 2.9L3 8'/>
  <path d='M3 3v5h5'/>
</svg>
```

**4.2　copy（⎘）** —— 兩個直角方框，前框在右下。刻意不倒角，與品牌記號的
`brace` 同一種收筆。

```
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' $A>
  <rect x='9' y='9' width='12' height='12'/>
  <path d='M5 15V3h12'/>
</svg>
```

**4.3　check（✓）** —— 兩段折線，夾角吸在 (9.5,17.5)。

```
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' $A>
  <path d='M4 12.5 9.5 17.5 20 6'/>
</svg>
```

**4.4　search（⌕）** —— 圓 ＋ 柄，柄與圓切線同角度（45°）。

```
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' $A>
  <circle cx='11' cy='11' r='6'/>
  <path d='M15.5 15.5 21 21'/>
</svg>
```

**4.5　chevron（‹ › ▾ 共用一顆）** —— 只畫「向左」，其餘三向用 CSS 轉：
`scale(-1,1)` 得右向、`rotate(-90deg)` 得下向。一顆 mask 服務三處。

```
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' $A>
  <path d='M15 4 7 12l8 8'/>
</svg>
```

**4.6　plus / minus（＋ －）**

```
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' $A>
  <path d='M12 5v14M5 12h14'/>
</svg>
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' $A>
  <path d='M5 12h14'/>
</svg>
```

**4.7　語言切換的角標** —— 現在是實心 `▾`、`0.5rem`。**建議改線性 chevron**
（§4.5 那顆 `rotate(-90deg)`），與 console 的收合角標統一；實心三角在這套線性
圖標裡是唯一的填充塊，會自己跳出來。若 owner 偏好保留實心，另存一顆
`caret`：`<path d='M12 16 5 8h14z' fill='%23000' stroke='none'/>`。

---

## 5　需要生成的：`💡`

**結果：走（丙）。** owner 畫的那顆（弧形燈罩 ＋ 兩道螺紋，`M9 15.5A7 7 0 1 1 15 15.5`
起手）合規——24×24、`stroke-width: 2`、square/miter，與整套同一種筆法，直接收進
`--icon-bulb`。以下三個選項留著當紀錄。

唯一一顆畫不成「兩三段線」的。三個選項，建議由上而下：

- **（甲）直接拿掉。** 呼出框已經有 `TIP` 眉標（`article.css:193`）與底色，
  燈泡是第三個冗餘訊號。少一顆圖標就少一份維護。
- **（乙）換成排版語彙的記號**——`注` 一個字，或本站自己的頓點。與
  `中／简／日／한` 那組語言徽標同一種思路：**用字，不用圖**。
- **（丙）真的要一顆燈泡**，prompt 如下（給 CD）：

> Draw a single line-art light-bulb icon as SVG.
> Canvas 24×24, `fill="none"`, `stroke="#000"`, `stroke-width="2"`,
> `stroke-linecap="square"`, `stroke-linejoin="miter"` — square caps and
> mitre joins throughout, no rounded corners anywhere.
> Geometry: a bulb envelope as a near-circle sitting on a two-rung screw
> base; the base rungs are horizontal strokes, the envelope meets them with
> two short vertical shoulders. No filament, no rays, no glow, no fill.
> Path coordinates snapped to integer or half-integer units on the 24 grid.
> Optical weight must match a 2/24 stroke at 1em beside 16px CJK body text.
> Output one `<svg>` element only, no `<title>`, no `id`, no `class`,
> no comments, attributes in double quotes.

生成後照 §3.1 轉成 data URI 進 `icons.css`。

---

## 6　不動的（是「當字用」，不是圖標）

| 字符 | 位置 | 為什麼留 |
|---|---|---|
| `文` / `A` | 語言切換的圖示（`_nav.js:180`） | 兩種書寫系統的字面本身就是語意，換成地球儀反而更弱 |
| `中` `简` `日` `한` | `demo.css:128-131`、`station-specimen.css:103-106` | 語言徽標，同上 |
| `$` | `station-frame.css:367` | shell 提示符，是排版慣例不是圖標 |
| `#` | `article.css:112` | 錨點慣例，且用 `--font-mono` 呈現 |
| `⌘K` | `_layout.html:72` | `<kbd>` 裡的鍵面字，本來就該是那顆字符 |

---

## 7　步驟

1. **`icons.css` ＋ 原語**（§2.1）。同時處理 `<han-console>`：它的樣式在
   shadow root，需要把 `icons.css` 加進 `han-console.js` 既有的 adopt 清單
   （與 `tokens.css`／`console.css` 同路徑）。先只放 `reset` 一顆。
2. **試點：`↺`**（`console-config.js:270`、`console-metrics.js:71`）。這兩處是
   同一顆圖標的兩個呼叫點，改完先看對齊——`vertical-align` 的 `-0.09em` 就在
   這一步用量的定，之後其餘九顆直接沿用。
3. **複製鍵 ＋ 成功回饋**（`snippet.js`、`home.js`、`manifesto.html`、
   `closing.html`），連同 §2.2 的 `data-state` 改寫。
   **會弄壞 e2e**：`tests/e2e/playground-configurator.spec.ts:73,75` 直接斷言
   `toHaveText('⎘')` / `toHaveText('✓')`，要改成斷言 `data-state`。
4. **語言切換的 `✓` 與 `▾`**。**先解重複**：`manual/_nav.js`（`:171`、`:181`）與
   `manual/vite.config.js`（`:810`、`:817`）各有一份**平行實作**——變數名不同
   （`LOCALE_LABELS`／`labels`、`activeLocale`／`active`），吐出的 markup 逐字
   相同。改一處會漏另一處，所以這一步之前先把 vite.config 那份改成 import
   `_nav.js`（或反之），否則本輪必然留下一個舊字符。
5. **搜尋 `⌕`**（`_layout.html:63`，`search.css:29` 的 `font-size` 隨之退休）。
6. **CSS `content:` 三處**：`console.css` 的 `‹ ›`（一顆 chevron ＋ `scale(-1,1)`）、
   `controls.css` 的 `＋ －`、`article.css` 的 `💡`（依 §5 的決定）。
7. **收尾**：深／淺兩色模式各看一遍（`currentColor` 應該自動對，但
   `:hover` 換 accent 色的那幾顆要確認 mask 沒有連帶被覆寫）；跑
   `pnpm test:e2e` 的 `home`／`playground-configurator`／`a11y` 三支。

### 7.1　順手記下的

- **直排**：本輪的圖標全在橫排的介面裡（console、導覽、搜尋），mask 盒是
  atomic inline，在直排不依 UTR50 轉向——若日後有圖標落進直排正文，要嘛
  `writing-mode: horizontal-tb` 釘住，要嘛另畫直排版。
- **a11y**：圖標盒一律 `aria-hidden="true"`，可及名稱留在 `<button>` 的
  `aria-label` 或同層的 `.sr-only` 文字上。現在 `manifesto.html:49` 的
  `aria-label="copy"` 是英文硬編碼，改的時候一併換成 i18n key。
- **`prefers-reduced-motion`**：§2.2 若加了 120ms 過場，記得掛閘。


---

## 8　施工紀錄（2026-08-02）

1–10 全部落地，`💡` 依約沒動。實際檔案：新增 `manual/public/common/icons.css`
（token ＋ `[data-icon]` 原語 ＋ 複製鍵的 copied 態）與 `manual/public/common/icon.js`
（JS 側唯一產地）；`home.css`／`manual.css` 各多一行 `@import`；其餘就是十個
呼叫點。

**兩個施工中才浮出來的坑，都已修，記在這裡免得下次再踩：**

- **`icons.css` 必須留成獨立檔。** 建置會把 `common/`／`home/` 底下的 partial
  全部 inline 進 `dist/home.css` 再刪掉本體（`vite.config.js` §
  `pruneInlinedPartials`），而 `<han-console>` 是**執行期 fetch** 樣式進 shadow
  root 的——constructed stylesheet 解不了 `@import`。所以 `icons.css` 跟
  `home/controls.css` 一樣要進 `KEEP_STANDALONE`，否則 shadow 裡的 `↺` 是
  `mask: none` 的 0×0 空盒（實測就是這個症狀）。
- **`display` 一寫下去就蓋掉 UA 的 `[hidden] { display: none }`。**
  `.Default` 為了「圖標 ＋ 文字」的 gap 改成 `inline-flex`，而**作者樣式無論
  權重都贏 UA 樣式**，那顆平時靠 `hidden` 屬性藏起來的按鈕就永遠露在外面。
  `home.spec.ts:139,168` 立刻抓到。修法是自己把 `&[hidden] { display: none }`
  補回來——任何「本來靠 hidden 藏、後來被加上 display」的元素都適用。

**測試**：`playground-configurator.spec.ts` 的複製鍵那條改成斷言
`data-state="copied"`（mask 空盒沒有文字可斷言，而 `data-state` 正是 JS 唯一
寫的東西）。單元測試 root 193 ／ manual 60 全過；e2e 98 pass ／ 14 fail，
14 支全是本輪之前就紅的（console／ledger／playground 那攤在飛的工作），
比動工前還少一支。

**沒做、留給下一輪**：§7 步驟四說的「先解 `_nav.js` ↔ `vite.config.js` 的
平行實作」。本輪改法是**兩邊各改一次**（改完 grep 過，全站一顆舊字符不剩），
沒有動那個重複本身——它牽涉 build config 的取用路徑，該獨立一輪。


---

## 9　併入 `variables.css` 的日／月（2026-08-02）

`common/variables.css` 另有兩顆圖標資產——`--path-sun`／`--path-moon`，
`clip-path: shape()` 的實心剪影，唯一的取用者是 `theme-toggle.css`。兩處各養一套
圖標沒有道理，併成一套。

**命名法（本輪定案）**：全站圖標資產只有一個字首、只住一個檔——
**`--icon-<名字>`，一律是 `common/icons.css` 裡的 mask data URI**。
取用端只有兩種寫法：JS 側 `icon('name')` 吐 `<span data-icon>`（`common/icon.js`），
CSS 生成內容側自己寫三行（`content: ''` ＋ 盒 ＋ `mask: var(--icon-*)`）。
`--path-*` 這一支退場，不留別名。

**為什麼是 mask 贏，不是 shape()**：

- `shape()` 沒有 stroke 的概念。原本那段註解自己寫著「filled instead of
  outlined……是填色等價的重畫，不是描邊的 1:1 描摹」——換句話說，作者要的
  本來就是線描，是機制逼它變實心的。改 mask 之後線描回得來，日／月也就跟其餘
  九顆同一種筆法了。
- 可用度反而更好：`shape()` 是 Baseline 2026（約八成），`mask` 是 Baseline 2023。
- 剩下的九顆全是描邊圖示，要改走 `shape()` 得把每一筆描邊改寫成外框輪廓，
  工作量與可讀性都不划算。

`shape()` 隨盒縮放的配方本身仍然成立（ziano 的 `docs/css-clip-path-scaling.md`），
只是本站不再需要它；`variables.css` 留了一行指路，免得下次有人以為它憑空消失。

**動到的檔**：`icons.css`（＋ `--icon-bulb`／`--icon-sun`／`--icon-moon`）、
`variables.css`（刪 `--path-*`）、`theme-toggle.css`（`clip-path` → `mask`）、
`manual/article.css`（`💡` → `--icon-bulb`）。深淺兩色模式各照過一次，日／月與
TIP 呼出框都正常。
