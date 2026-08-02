# Safari 修復 ＋ 破折號柱加長／裁切 — 調查與改法

> **狀態（2026-08-02 收工）**：§一～§四 全部落地，四個標點公約 × 雙引擎
> （Playwright WebKit 2272 ＝ Safari 26.4 引擎／Chromium 147）逐格驗過。
> §二 連字形都補齊了——見 § 五(3) 的 `VERT_FORM` 表。字體那頭仍有一個更根本
> 的解沒做（Diantenjeom 補 U+FE10–FE44 直排形碼位），但不再是阻塞項，見 § 七。
> 量測細節另立一份可 deep link 的筆記：
> `docs/notes/2026-08-02-webkit-svg-vertical-text.md`。

日期 2026-08-02。全部結論都由 Playwright **WebKit 2272**（UA 回報
`Version/26.4 Safari/605.1.15`）對照 Chromium 147 實測，量測腳本留在本次
session 的 scratchpad；每一條都附最小重現或量到的數字。**尚未動任何程式碼。**

---

## 零、先講結論

Safari 的四個症狀其實只有 **三個** 根因：

| 症狀 | 根因 | 性質 |
| --- | --- | --- |
| 破折號柱整個亂掉 | ① WebKit 的 **SVG 直排 `<text>` 用 hhea 的 asc+desc 當字距**（1.437em），不讀 `vmtx`（1.0em） | WebKit bug，可繞開 |
| 鉛字的直排標點亂掉 | 同 ①，**再加** ② WebKit 在 SVG `<text>` 裡 **不套用 `vert`／`vrt2`**（連 `font-feature-settings` 明寫也不套） | WebKit bug，需換作法 |
| 切換器亂掉（兩處） | ③ WebKit 不吃 **`legend { float }`** 這招 de-legend | WebKit 不符規範，需換 markup |
| 綠漸層／背景懸掛標點不見 | ④ WebKit **解析但不實作 `mask-clip: no-clip`**，實際照 `border-box` 裁 | WebKit bug，需換作法 |

①②是同一個「SVG 直排在 Safari 不可靠」的大問題，牽動 `dash-fuse` 與
`lead-forme` 兩支；建議一起處理。

---

## 一、破折號柱：加長句子 ＋ clip-path 裁切

### 1.1 現況

`home/station-fonts.html` 的 `svg[data-name="dash-fuse"]`：

```html
<svg data-name="dash-fuse" viewBox="0 0 120 3140">
  <text x="60" y="20">沉默了四點七秒</text>
  <rect data-seg="a" …/><rect data-seg="b" …/>
  <text x="60" y="920">這個時間足夠三體人交換一部《三體通史十萬年》</text>
</svg>
```

幾何全部以 `.PunctFix` 的高 H 換算（`dash-fuse.css`）：

```
block-size: 2177%          → 3140 unit = 21.77 H  ⇒ 1 unit = 0.006933 H
inset-block-start: -540%   → 秒的字格中點 y=670 落在文案上緣之上 0.75 H
```

目前多出來的字是靠 **鉛字盤、樣張卡、section 的 `overflow: clip`** 三個不透明
物件遮掉的。這正是 owner 指出的問題：那三個物件的位置隨螢幕寬變，遮蓋關係
在別的尺寸就破功（截圖裡「四」「國」爬到 lede 上面）。

### 1.2 加長後的座標（可直接照抄）

新句：

> 三歲即植入神經共振晶片，去年首次踏上地球。起身後，他沉默了四點七秒——這個時間足夠三體人交換一部《三體通史十萬年》體量的知識

- 破折號前 **33 格**（原 7）
- 破折號 **2 格**
- 破折號後 **27 格**（原 22）
- 合計 62 格 ＝ 6200 unit，加上頂端 20 的邊距 ⇒ `viewBox="0 0 120 6240"`

保持「1 unit ＝ 0.006933 H」不變（＝字級不變、「秒——這」四格仍卡在同一個
梯形空格）：

| 值 | 現在 | 改成 |
| --- | --- | --- |
| `viewBox` | `0 0 120 3140` | `0 0 120 6240` |
| `block-size` | `2177%` | `4326%`（6240 × 0.006933） |
| `inset-block-start` | `-540%` | `-2342%`（−(3270 × 0.006933 + 0.75) H） |
| 上段 `<text> y` | 20 | 20（不變） |
| 下段 `<text> y` | 920 | 3520 |
| rect 墨跡外緣 | 727 / 913 | 3327 / 3513 |
| 接縫 `--df-a1` / `--df-b0` | 815＋5f / 825−5f | 3415＋5f / 3425−5f（基態 3420） |

驗算：「秒」是第 33 格 ⇒ 3220–3320，中點 **3270**；「這」是 3520–3620，中點
3570 — 兩中點相距 **300 unit ＝ 2.08 H**，與檔頭寫的契約一字不差。

### 1.3 clip-path 怎麼裁

要的邊界是「`figure.Illust[data-variant="faces"]`（即『超迴路運行廿載』那張
卡）的上緣」。這個距離在 CSS 裡沒有純靜態的表達式 —— 它隨 lede 換行、隨版心
寬變。三條路：

**(A) JS 量一次、發佈成變數（建議）**
`.Faces` 卡與 `.PunctFix` 是 `#station-fonts` 的兄弟，用
`ResizeObserver` 觀察 `main`，把
`facesTop − svgTop` 寫成柱自己的 `--df-clip-top`（px），CSS 一行收工：

```css
clip-path: inset(max(0px, var(--df-clip-top, 0px)) 0 0 0);
```

與 `lead-forme.js` 發佈 `--lf-last-slug` / `--lf-drop-dur` 給 CSS 用是同一個
既有模式，全瀏覽器一致，風險最低。

**(B) CSS anchor positioning，無 JS**
`.Illust[data-variant="faces"] { anchor-name: --faces }`，柱外包一層
`position: absolute; inset-block-start: anchor(--faces start); overflow: clip`。
Chrome 125+／Safari 26+ 有，**Firefox 沒有** —— 柱是 z-index −1、對比 7% 的
裝飾底圖，Firefox 退回今天的行為可以接受。程式碼最乾淨，但多一層 wrapper，
且要在檔頭記 baseline。

**(C) 純 % 幾何**：柱的高本來就是 H 的百分比，可以寫死「裁掉前 N%」。但
`.Faces` 上緣不在那個座標系裡，換個視窗就對不上 —— **不建議**。

我傾向 **(A)**。另外建議一併把 `inset-inline` 兩側也納入裁切（現在靠
section 的 `overflow: clip`），這樣柱的可見範圍完全由一條 `inset()` 決定，
不再依賴任何不透明物件的位置。

> ⚠️ 順序上有相依：**1.4（Safari 直排修好）要先做**，否則 Safari 的字距是
> 1.437 倍，加長後第二段會超出 viewBox 一大截，clip 只是把亂象裁得整齊些。

### 1.4 Safari 破折號亂掉的真正原因（根因 ①）

在真實頁面、真實字體（Shanggu Serif，`font-size: 100px`）下量 SVG 直排
`<text>` 每一格的 `getExtentOfChar(i).y`：

| 引擎 | 每格前進量 | 7 字總長 |
| --- | --- | --- |
| Chromium | **100**（＝1 em，讀 `vmtx`） | 700 |
| WebKit | **143.7**（＝hhea 1151＋286 ＝ 1.437 em） | 1005.9 |

字體本身是對的：`shanggu-serif-tc` 有 `vhea`（asc 500 / desc −500）與 `vmtx`
（全字 advance = 1000/1000 em）。**WebKit 在 SVG `<text>` 裡不讀它**，改用
hhea 的 asc+desc。所以：

- 「秒」落在 y≈1026 而不是 720 ⇒ 破折號（固定在 727–913）插進「七／秒」中間
- 下段 22 字要 3161 unit，直接衝出 3140 的 viewBox

補充量測：**HTML 直排沒有這個問題** —— 同一支字體在 `writing-mode:
vertical-rl` 的 `<span>` 上，兩家都是 100/格。純粹是 SVG text 的 bug。

**繞法（已實測有效）**：把每一格拆成帶顯式 `y` 的 `<tspan>`。

```
一二三四五（font-size 100）每格 y：
  <text> 直接寫              WebKit 20, 163.7, 307.4, 451.1, 594.8   ✗
  textLength + lengthAdjust  WebKit 20, 109.1, 198.2, 287.2, 376.3   ✗（算法不同，救不回）
  <tspan y="…"> 逐格         WebKit 20, 120, 220, 320, 420           ✓  ＝ Chromium
```

`<tspan>` 那條兩家完全一致。62 格的 tspan 由 `dash-fuse.js` 從 DOM 裡那一句
（放進 `data-*` 或原本的 text 內容）切出來生成即可 —— 句子仍然只寫在 HTML
一處，符合「DOM 就是資料」。

**殘留問題**：`<tspan>` 修好了「累積」，但 WebKit 仍把每個字畫在框內偏下
約 **0.27 em**（字的原點取 hhea ascent，不是 em 框中心；截圖對照可見整柱下沉
30px @100px）。柱是裝飾底圖、對比 7%，這 0.27em 肉眼幾乎看不出，可以先接受；
要修就是量一次前進量（WebKit 143.7 / Chromium 100 —— 這本身就是可靠的
feature-detect，不必嗅 UA）再補一個 dy。

---

## 二、鉛字盤直排標點亂掉（根因 ①＋②）

`lead-forme.js` 的 `block()` 對標點走這一支：

```js
const vertical = orient !== 'h' && PUNCT.has(char)
const glyphLayout = vertical ? 'writing-mode:vertical-rl; text-orientation:upright' : ''
```

每個字是自己的 `<text>`，所以沒有「累積」問題，但兩件事在 WebKit 壞掉：

**② WebKit 不套 `vert`／`vrt2`。** 實測：同一顆「「」，Chromium 畫的是旋轉過的
直排形，WebKit 畫的是橫排形（未旋轉）。而且 **明寫
`font-feature-settings: 'vert' 1` 在 WebKit 一樣沒作用**（橫排 `<text>` 也試過）。
這就是截圖裡「「」變成怪形狀、「：」兩點位置不對」的直接原因。

**① 的殘留位移。** 單字 `<text>` 在 WebKit 的框是 1.437em 高、原點取 hhea
ascent，所以字沿閱讀軸偏 ~0.27em；套上等角 `matrix()` 之後就是截圖裡那種
「浮出鉛字面」的錯位。

### 改法選項

1. **Diantenjeom 補 cmap（我最推薦，一次解決所有 SVG 直排標點）**
   DTJ 已經有全套 `vert` 目標字符（34 個代換），但 cmap 裡 **沒有**
   U+FE10–FE19／U+FE30–FE44 這些 Unicode 本來就給直排形的碼位（實測
   `FE forms present: []`）。把既有的 vert 目標字符**加上這些碼位的 cmap
   entry**（不必畫新字、不增體積），任何情境都能用「碼位」直接點名直排形：
   `﹁`(FE41)／`﹂`(FE42)／`︓`(FE13)／`︐`(FE10)／`︒`(FE12)／`︽`(FE3D)／
   `︾`(FE3E)…。SVG 就不必再依賴 `writing-mode` 或 OpenType feature，兩家
   引擎行為必然一致。
   代價：改的是 diantenjeom repo，要重新發版；han 這邊要等 CDN。
2. **自己旋轉**：`PUNCT` 裡屬 UTR50 R class 的（「」『』（）—…）用橫排形
   ＋ 90° `rotate()`；屬「移位」類的（、。，：）自己補位移。純幾何、零依賴，
   但等於在 JS 裡重寫一份 UTR50 規則，與 diantenjeom 的既有知識重複。
3. **只補位移不管字形**：把 ① 的 0.27em 補掉。標點形狀在 Safari 仍是橫排形
   —— 治標，不建議單獨用。

建議：**先做 3（或 1 之前的過渡）讓位置對，正解走 1。**

---

## 三、切換器亂掉（根因 ③）

`.SpecimenSwitch`（`station-fonts.css` L302）與鉛字盤的 `.Controls`
（`lead-forme.css`）都用同一招把 `<legend>` 變成普通 flex item：

```css
legend { float: inline-start; }
```

**WebKit 不吃這招。** 最小重現（純 HTML，無專案 CSS）：

| | fieldset 高 | legend 位置 |
| --- | --- | --- |
| Chromium | 40px | 垂直置中，是 flex item |
| WebKit | **60px** | 貼在 fieldset 頂端，**不是** flex item |

`float: left`（物理值）在 WebKit 一樣無效 —— 兩個值都試過，數字一模一樣
（74×55 vs 108×32）。所以不是邏輯關鍵字的問題，是 WebKit 沒有實作「floated
legend 不再是 rendered legend」這條規範。

這解釋兩張截圖：`.SpecimenSwitch` 的「行向」跑到藥丸外上方；鉛字盤直排那組
三顆藥丸的頭標各自跑到旁邊、藥丸長短不一。

### 改法

實測兩條在 WebKit 都正常（32px 高、單行）：

- **`<div role="group" aria-label="…">` ＋ `<span aria-hidden="true">` 頭標**
  —— 沒有 `<fieldset>` 就沒有 legend 的特殊排版；radio 的分組靠 `name`，
  本來就與 fieldset 無關。**建議這條**：一份文字、語意完整、零 hack。
- `legend { display: contents }` —— 版面對，但把 legend 的盒子拿掉，
  無障礙名稱在部分引擎會掉，要驗過才敢用。

兩處（`.SpecimenSwitch` 與 `.Controls`）要一起改；`station-fonts.css` L273
的註解已經寫明「改配色時兩邊要一起看」，這次是改結構，同理。

---

## 四、綠漸層＋背景懸掛標點不見（根因 ④）

`station-lines.css` L246：

```css
mask-image: linear-gradient(to bottom, #000 0 78%, transparent 100%);
mask-clip: no-clip;   /* 註解說：不寫這行會剪掉本段唯一想給人看的東西 */
```

**WebKit 解析得了 `no-clip`（`CSS.supports` 回 true、computed style 也回
`no-clip`），但不實作** —— 實際照 `border-box` 裁。最小重現（20 行 HTML）：
一個 `.box` 加 `::before` 放在 `inset-inline-start: 100%`，只要父層帶那組
mask，WebKit 的綠條就整條消失，Chromium 正常。

頁面截圖對照完全吻合：WebKit 版在背景巨型樣張的 border box 右緣（x≈549）
被切得一乾二淨 —— 綠色懸掛區、版口線、所有懸掛出去的句讀全沒了；Chromium
版那些東西都在。所以「綠漸層不見」與「背景的擠壓/懸掛標點不見」**是同一件
事**，不是兩個 bug。（前景樣張正常，因為它沒有 mask。）

> 附帶觀察，不是 bug：WebKit 沒有 `text-spacing-trim`（實測 `CSS.supports`
> 回 false），所以 han.css 走 JS fallback，`h-char` 數量比 Chromium 多
> （背景 20 vs 12、前景 41 vs 26）。擠壓本身有生效。

### 改法（擇一）

1. **把要看的東西收進 border box**：給 `div[role="presentation"]` 補
   `padding-inline-end`（≥ 3em，蓋住懸掛區＋散開的餘裕），`::before` 改用
   `inset-inline-end` 定位，就不需要 `no-clip`，預設的 `border-box` 也裁不到
   東西。**最小改動、全瀏覽器一致，建議這條。**
2. **不用 mask，改用不透明的收尾遮片**：站台底色是平色，段尾的淡出可以由一個
   `position: absolute` 的 `::after`（`linear-gradient(transparent, 站台底色)`）
   蓋出來，完全繞開 mask 的裁切語意。
3. 保留 `no-clip` 再加 `mask-clip: border-box` 的 fallback —— 沒用，WebKit
   是「認得但不做」，不會退回。**不可行。**

---

## 五、實際落地的內容

動工順序照原訂走（切換器 → 綠漸層 → SVG 直排 → 加長／裁切）。與調查時的
提案有兩處改得更好，都是因為收工前多量了一輪：

**(1) dash-fuse 不走 `<tspan>`，改走「逐格橫排 `<text>`」。**
調查時只驗到「`<tspan y>` 能修字距」，但那只解決累積，WebKit 仍把每個字放進
hhea 框裡（差 0.05em），而且 class R 的字形照樣不對。收工前補量的一筆才是關鍵
——**橫排的 SVG 文字兩家逐像素相同**。所以整柱改成一格一個橫排 `<text>`：
漢字是 UTR50 class U，本來就正立，一格一個就沒有字距可累積；`《》` 由
`rotate(90)` 自轉（實測 DTJ 的括號類 vert 代換正是純 90° 旋轉）；`、。，` 在
預設的 MOE 公約下橫直同形，不必處理。CSS 的 `writing-mode: vertical-rl` 留著
當沒有 JS 時的退路，JS 排完蓋 `data-laid` 交還橫排。

**(2) 鉛字盤的補償量是 0.05em，不是 0.27em。**
調查時量的探針沒有 `text-anchor="middle"`，得到 0.271em；鉛字盤真正的構造有，
而錨點把 hhea 框釘在中心之後只剩
`(hheaAsc − typoAsc + .5em) − hheaBox/2 ≒ 0.0525em`。這個數由
`lead-forme.js § surveyEngine` 在執行期量出來（不嗅 UA：直排 extent
的高度等不等於 hhea 框，就是引擎用哪個框的直接證據），發佈成 `--lf-vshift`，
由 CSS 加回去。

**(3) 字形也補齊了，靠一張逐公約的 `VERT_FORM` 表。**
調查時以為只有位置救得回來，字形要等 DTJ。實際把四款 DTJ 的 vert 代換逐字比外框
之後，發現代換從來不是「重畫」，而是**轉 90°** 或**移位**二選一，而選哪一個是
**標點公約的屬性**——所以一張表就寫得完（表與偏移量見
`docs/notes/2026-08-02-webkit-svg-vertical-text.md`）。三個關鍵：括號類四款一律
轉 90°；MOE 什麼都不移（橫直同形，畫橫排字形就是正解）；`：` 的處置是各公約的
簽名（JIS 轉／GB 坐低／MOE·KLR 正立，最後這條正是 `lineLayout` 早就引用的
KLReq cl7）。逗號那組（owner 回報「直排 JIS/GB/KLR 的逗號變成橫排用的」）就是
`move` 而非 `turn`，因此一併修好。

**(4) 探針換過一次，因為第一版是 JIS 專用的。**
原本用「DTJ 的直排引號 vmtx 是半高（400）」判斷引擎跑不跑 `vert`——那是 JIS 才有
的度量，GB 那顆是 1000，會把「有跑 vert 的引擎」誤判成沒跑，連 Chromium 都會整盤
手動轉。改成問**引擎**而不是問字體：直排字身框是不是 hhea 框（WebKit 那條不讀
`vmtx`、也不跑 `vert` 的路徑）；與落點補償合成同一支 `surveyEngine`，一次量兩個
答案，且不綁任何字體。

改到的檔案：

| 檔 | 改了什麼 |
| --- | --- |
| `home/station-fonts.html` | 兩組 `<legend>` → `<span class="Legend">` ＋ fieldset 的 `aria-labelledby`；柱的句子加長、`viewBox` 6240 |
| `home/station-fonts.css` | `.SpecimenSwitch` 的 `legend { float }` → `.Legend` |
| `home/lead-forme.css` | 同上；新增 `text.g.vert` 的 `--lf-vshift` 補償 |
| `home/lead-forme.js` | `surveyEngine` 探針；`VERT_FORM` 逐公約表；直排字加 `vert` class |
| `home/controls.css` | `<details>` 收合的 0fr⇄1fr grid track 過場 |
| `home/console.html` | 「各文種專項」預設展開 |
| `home/station-lines.css` | 拿掉 `mask-clip: no-clip`，改用 `padding-inline-end` 把懸掛區收進邊框盒；欄寬／欄外抽成 `--_wm-col` / `--_wm-hang` |
| `home/dash-fuse.css` | 全套座標 +2600、`block-size: 4326%`、`inset-block-start: -2342%`、`clip-path`、`[data-laid]` |
| `home/dash-fuse.js` | `layoutColumn`（逐格橫排）、`initClip`（發佈 `--df-clip-top`） |

### 驗證

- 雙引擎（Playwright WebKit 2272 ＝ Safari 26.4 引擎 / Chromium 147）：
  藥丸 fieldset 153×40（改前 WebKit 是 114×60）；station③ 的綠懸掛區、版口線
  與懸出的句讀在 WebKit 回來了；柱的字格與破折號在兩家對齊；`--lf-vshift`
  WebKit 0.0525 / Chromium 0。
- clip-path 在 1024／1280／1680／1920 四個寬度都精準貼齊樣張卡上緣
  （`--df-clip-top` ＝ 量到的 delta，四個寬度逐 px 相符）。
- `node --test` 58 passed；e2e 受影響的 spec 全綠。`lead-forme-pocket.spec.ts`
  的 `laid.cut` 仍失敗，但**改前改後同一個值 −41.277**，是既有債，與本次無關。

## 七、更根本的解（不再是阻塞項）：Diantenjeom 的直排形碼位

§ 五(3) 那張 `VERT_FORM` 表已經讓 Safari 的直排標點四款全對，但它終究是**把字體
知識抄進 JS**：DTJ 改了字形或加了新公約，表就要跟著改，而且沒有任何機制會提醒。

字體那頭的解乾淨得多：**把 U+FE10–FE19／U+FE30–FE44 補進 cmap**，指向已經存在的
vert 目標字符。不必畫新字、幾乎不增體積。補上之後任何渲染路徑都能用**碼位**直接
點名直排形，不必求 `writing-mode`、也不必求 OpenType feature——SVG、canvas、以及
任何拿不到排版引擎直排支援的地方都受惠。

**GB 那款已經做了一半**：它的 cmap 有 `U+FE41–FE44`（`﹁﹂﹃﹄`），其餘三款
`FE forms present: []`。機制是通的，缺的只是推廣到全部碼位與全部款式。

han 這邊要跟的後續：DTJ 發版後，把 `lead-forme.js § block` 的直排分支改成
「橫排 `<text>` ＋ FE 碼位」，`VERT_FORM` 整張表、`--lf-vshift` 那套補償
（`surveyEngine`、`text.g.vert`、CSS 規則）就都可以刪掉。

## 六、回填 workspace 知識庫（已做）

`hanzi.pro/CLAUDE.md` 的「共用知識 — 瀏覽器 CJK 排版」那節已加三條：SVG 直排
在 WebKit 不可用（連向本 repo 的
`docs/notes/2026-08-02-webkit-svg-vertical-text.md`）、`mask-clip: no-clip`
認得但不做、`legend { float }` 無效。
