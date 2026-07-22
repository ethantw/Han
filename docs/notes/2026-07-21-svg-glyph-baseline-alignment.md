# 絕對定位的字形／標點，Y 軸永遠差一點點 — 調査記錄（2026-07-21）

> 一句話：**絕對定位只能錨「盒邊」，但基線在盒內的落點由字體的「行盒度量」
> 決定，而你貼上去的 SVG／標點用的是「em box 度量」——兩套度量差一個
> CSS 取不到的 per-font 常數，所以任何「乾淨公式」都會系統性偏一點點。**

## 症狀

兩個看似無關、其實同源的老問題：

1. **首頁字標 `.Brand` 的 SVG「漢」**（`position: absolute` 疊在透明文字漢
   上）垂直方向 malposition，怎麼用 `(1lh-1em)/2`、`inset-block-end:0` 之類
   的「應該對」的公式都差 ~0.05em。
2. **標點懸掛**：用 `position: absolute` 把標點吊在字身框外時，Y 軸位置總是
   差一點點，肉眼看得出來但講不出為什麼。

兩者都是「拿絕對定位把一個 1em 的東西，對齊到一行文字的基線」，也都對不準。

## 量測方法（無 Playwright 依賴，headless Chrome 即可）

三種互補量法，別憑理論：

- **`canvas.measureText()` 的 `fontBoundingBoxAscent/Descent`** ＝ 瀏覽器排一行
  時實際採用的 ascent／descent（行盒度量）。這是拿到 hhea／win 度量最直接的
  辦法，CSS 本身取不到。
- **零高 baseline strut**：`<span style="display:inline-block;width:0;height:0;
  vertical-align:baseline">` 塞進行內，它的 `getBoundingClientRect().top` 就是
  該行**文字基線的絕對 y**。用來量「基線距 line-box 頂多遠」。
- **像素墨跡分析**：把要比對的兩個字上不同色（紅字身、藍 SVG），canvas 掃描
  逐列找各色的最上／最下列 → 得到真實墨跡上下緣，繞開一切 metrics 理論值。

## 根因（一般性原則，不是這次才有的規則）

一個字體有**兩套垂直度量，各管各的**：

| 度量 | 本專案實測值 | 定義什麼 | 誰在用 |
|---|---|---|---|
| **em box／typo**<br>（OS/2 sTypoAsc 880 / upem 1000） | 基線＝字形頂下 **0.88em** | em 方框、字形**內部**基線 | 你抽出來的 **SVG 的 0.88**、標點在字身框內的座標 |
| **行盒度量／fontBoundingBox**<br>（≈ hhea／OS2-win） | asc **1.1667** / desc **0.2917**<br>合計 **1.458em** | 一行多高、**基線落在行盒何處** | **瀏覽器排版** |

Noto 系 CJK（本專案的尚古、Diantenjeom 全部同源）**刻意**把行盒度量做到
1.458em（＞1 個 em），好讓 CJK 加上假名濁點、拼音附標都不裁切。於是：

```
行內文字基線距 line-box 頂 = 0.5·lh + (lineAsc − lineDesc)/2
                          = 0.5lh + (1.1667 − 0.2917)/2·em
                          = 0.5lh + 0.4375em
```

三個 line-height 實測完全吻合（附錄）。但是：

- **絕對定位只能錨盒邊**（`inset-block-start` 錨 line-box 頂、`inset-block-end`
  錨底）。基線離盒邊的距離，由上面那條式子、也就是**行盒度量**決定。
- 而你貼上去的 SVG，自身基線在 **em box 的 0.88**。
- 兩者的差 `0.4375 − 0.88 = −0.4425em` 就是那個 **per-font 常數**。

CSS 沒有任何單位或函式能取到 hhea／fontBoundingBox（`1lh` 只給你 line-height，
拿不到 ascent／descent 的**非對稱**），所以**寫不出 font-independent 的絕對定位
通式**。這就是「差一點點」的根本原因——不是你公式寫錯，是這條路本質上要一個
量不到的常數。

### 附帶一坑：inline `<svg>` 的基線 ≠ 下緣

以為改用 inline ＋ `vertical-align` 就能繞開？對 `<svg>` 不行：

- **`<img>`**（真 replaced element）：基線 ＝ 下緣邊 → `vertical-align` 乾淨，
  實測殘差 **−0.0002em**。
- **空 inline-block**：基線 ＝ 下緣邊（CSS 規範：無 in-flow line box 時，
  baseline 為 bottom margin edge）→ 同樣乾淨。
- **inline `<svg>`**：Chrome 把它的基線放在**下緣上方 ~0.066em**（不是下緣），
  `overflow:clip` 也改不動 → `vertical-align` 對它殘差 **−0.0536em**，一樣歪。

## 解法

### 甲・裝飾用途（獨立字標、demo、docs 標題）——完全 font-independent

用 **mask 空盒**：空 inline-block 的基線＝下緣，`vertical-align:baseline` 直接
參照瀏覽器算好的真實基線（繞開全部度量數學），再降 `--below`(0.12em)：

```css
.glyph {
  display: inline-block;
  inline-size: 1em; block-size: 1em;
  background: var(--palette-text);        /* 可主題化；用 background 非 color，
                                             故過得了 fonts-gate 的 color:transparent */
  mask: url("漢.svg") center / contain no-repeat;
  vertical-align: calc(-1 * var(--brand-glyph-below-baseline));  /* -0.12em */
}
```

實測殘差 **−0.0002em**。無 magic constant、任何字體任何 line-height 都準、還能
換主題色。`<img>` 版同樣乾淨但沒法 CSS 上色。

### 乙・非得絕對定位時（如首頁字標、懸掛標點）——用實測度量補償

逃不掉行盒度量，就把它當**已知字體常數**寫進 CSS（性質同 sTypoAsc 那些）：

```css
.Brand {
  --brand-glyph-baseline: 0.88em;    /* em box：SVG 內部基線（sTypoAsc 880） */
  --brand-line-ascent: 1.151em;      /* hhea ascender 1151（fontTools 真值） */
  --brand-line-descent: 0.286em;     /* hhea |descender| 286 */
}
.BrandGlyph {
  position: absolute;
  inset-block-start: calc(
    0.5lh + (var(--brand-line-ascent) - var(--brand-line-descent)) / 2
          - var(--brand-glyph-baseline)
  );
  inset-inline-start: 0;
  block-size: 1em; inline-size: 1em;
}
```

實測殘差 **0.0037em**（次像素）。`0.5lh` 讓它**跟 line-height 脫鉤**（任何行高
都對），只有 `(asc−desc)/2` 是字體常數。首頁字標非走此路不可，因為它的
`<path>` 被 `fonts-gate.js` 的描邊動畫 `clone`，必須維持真 inline SVG paths，
不能換成 mask。

## 這些度量哪裡來、怎麼查

`fontBoundingBoxAscent/Descent` **不是 canvas 算的，是字體檔裡現成的 OpenType
度量**，canvas 只是讀給你。對應到三張表之一：

| 表・欄位 | 本專案值 | 說明 |
|---|---|---|
| `OS/2` `sTypoAscender/Descender/LineGap` | 880 / −120 / 0 | 「typo／em」度量 |
| `OS/2` `usWinAscent/usWinDescent` | 1151 / 286 | 「win」，恆正 |
| `hhea` `ascender/descender/lineGap` | 1151 / −286 / 0 | 「line」度量 |

**瀏覽器選哪組，看 `OS/2.fsSelection` bit 7（USE_TYPO_METRICS）**：設了用 sTypo，
沒設用 win/hhea。Shanggu／Diantenjeom 此 bit **未設** → 排版用 hhea/win 的
1.151/0.286，**不是** sTypo 的 0.88/0.12 —— 這正是坑的來源。

**三種取值管道，精度差很多：**

1. **Canvas `TextMetrics`（runtime，但會捨入）**：`measureText('漢')` 給
   `fontBoundingBoxAscent/Descent`，還直接給基線 `alphabeticBaseline`、
   `ideographicBaseline`、`hangingBaseline`、`emHeightAscent/Descent`。
   **⚠ Chrome 把 fontBoundingBox 捨入成整數 px**：24px 字時回 28/7 px →
   1.1667/0.2917，比真值 1.151/0.286 大 ~0.016em、且**隨字級跳動**。只適合
   快速探值。
2. **Local Font Access API**（`queryLocalFonts()`，Chrome 103+）：`FontData
   .blob()` 拿原始 bytes 自己 parse——**僅本機字體、要權限**，webfont 不行。
3. **Python fontTools（權威）**：直接讀表，無捨入、font-size 無關，還看得到
   USE_TYPO_METRICS 有沒有設。**寫進 CSS 常數就用這個。**
   ```python
   from fontTools.ttLib import TTFont
   f = TTFont("ShangguSerif-VF.otf", lazy=True)
   upem = f["head"].unitsPerEm                       # 1000
   os2, hhea = f["OS/2"], f["hhea"]
   use_typo = bool(os2.fsSelection & (1 << 7))       # False → 用 hhea/win
   asc, desc = hhea.ascent, hhea.descent             # 1151, -286
   ```
   實測：用 fontTools 真值 1.151/0.286 補償殘差 **−0.0015em**，比 canvas 捨入值
   1.1667/0.2917 的 0.0037em **更準**。

**還有一坑：定 strut 的是元素的「primary（first-available）字體」，不是渲染該
glyph 的字體。** 此字標 stack 首位是 Diantenjeom Serif MOE（標點字體，有 glyph
故 available），漢落到 Shanggu 渲染，但整行基線由 Diantenjeom 定（兩者同源
Noto，值相同故無妨）。單量各字體 canvas：Diantenjeom＝Shanggu＝1.1667/0.2917，
Palatino＝0.8333/0.2917，generic serif＝0.9167/0.25——**若 CJK webfont 沒載成、
strut 落到 Palatino/serif，基線就跑掉**。所以量測前要確認 primary 字體是誰。

## 套用到標點懸掛

懸掛標點若用 `position: absolute` 把標點盒吊在字身外，Y 軸同一個道理：

- **標點字形在字身內的座標**是 em box 度量（跟 SVG 的 0.88 同源）。
- **絕對定位錨的盒邊**離基線的距離是行盒度量。
- 所以直接 `inset-block-start: 0` / `inset-block-end: 0` 必歪 ~0.44em 級別的
  一部分；憑「應該對」的 em 比例去猜也會差那 `(asc−desc)/2 − typo` 的常數。

**建議修法，二選一：**

1. **能不用絕對定位就別用**——懸掛多半可以靠負 margin／`translate`／相對定位在
   *行內流*裡做，讓標點仍是 inline，Y 軸自動跟著真實基線走，就沒這問題。
   （這是首選：inline 的東西 Y 軸永遠對，因為它就在那條基線上。）
2. **非絕對定位不可**時，照「解法乙」：把該字體的 `fontBoundingBoxAscent/
   Descent` 用 canvas 量出來（Diantenjeom 各面同源 Noto，值應與此處一致，
   可直接複用 1.1667 / 0.2917），寫成 CSS 常數，用
   `0.5lh + (asc−desc)/2 − <標點在em box的基線比例>` 換算錨點。

先量再改，別憑感覺調 magic number——那只會在這個字體、這個字級對，換一個就跑掉。

## 附錄・實測數據（尚古明體／Diantenjeom Serif MOE，同源 Noto，headless Chrome 147）

```
font: 600 24px（primary = Diantenjeom Serif MOE，漢 落 Shanggu 渲染），em = 24px

度量真值（fontTools 讀 ShangguSerif-VF.otf / diantenjeom-serif-moe.otf，同值）：
  upem 1000   USE_TYPO_METRICS = False（→ 排版用 hhea/win）
  sTypo  880 / -120   = 0.8800 / 0.1200 em   ← SVG 內部基線用這組
  usWin 1151 /  286   = 1.1510 / 0.2860 em
  hhea  1151 / -286   = 1.1510 / 0.2860 em   ← 瀏覽器排版用這組

canvas measureText（同字，但被 Chrome 捨入成整數 px）：
  fontBoundingBox asc 28px/24 = 1.1667 / desc 7px/24 = 0.2917 em（比真值大 ~0.016em）
  actualBoundingBox（墨跡）asc 0.8447 / desc 0.0847 em

baseline strut 實測「基線距 line-box 頂」：
  line-height 1.0 → 0.9167em      預測 0.5·1.0 + 0.4325 = 0.9325  ✓(±½px)
  line-height 1.8 → 1.3333em      預測 0.5·1.8 + 0.4325 = 1.3325  ✓
  line-height 2.6 → 1.7083em      預測 0.5·2.6 + 0.4325 = 1.7325  ✓
  → 斜率 0.5、截距 (hheaAsc−hheaDesc)/2 = 0.4325em，機制確認。

各解法殘差（SVG 字內基線 − 文字基線，越接近 0 越準）：
  inset-block-end: 0（原況）              明顯下沉
  (1lh - 1em)/2                          −0.0575em（偏高）
  甲 inline <svg> + vertical-align       −0.0536em（SVG 基線 ≠ 下緣，坑）
  乙 abs + text-box-trim                 −0.0536em（trim 不動 abspos 容器塊）
  <img> + vertical-align                 −0.0002em ✅
  mask 空盒 + vertical-align             −0.0002em ✅
  abs + 補償（canvas 值 1.1667/0.2917）   0.0037em ✅
  abs + 補償（fontTools 真值 1.151/0.286）−0.0015em ✅ ← 首頁字標採用（更準）
```

## 術語表（慢慢學用）

### A・基本概念（先有這五個，其餘才看得懂）

| 術語 | 白話解釋 | 本專案值 |
|---|---|---|
| **em／em box** | 一個字的「滿格」設計方框。`1em` ＝ 你設的 `font-size`。字體所有東西都畫在這個方框的座標系裡。 | 24px 字時 1em = 24px |
| **unitsPerEm（upem）** | 字體**內部**把 em 方框切成幾格來描述座標。所以「880」是指 `880/upem` 個 em。CJK／CFF 慣用 1000，TrueType 常 2048。 | **1000** |
| **baseline（基線）** | 字「坐」的那條看不見的線。拉丁字母、漢字都對齊它;英文 g/p/y 會垂到線下。又稱 alphabetic baseline（字母基線）。 | — |
| **ascent（上伸）** | 基線**往上**要留多高。 | 依度量組而異 |
| **descent（下伸）** | 基線**往下**要留多深。 | 依度量組而異 |

### B・OpenType 表與欄位（字體檔裡現成的數字）

字體檔內部分成很多張「表（table）」，每張放一類資料。本文用到三張：

| 術語 | 屬於 | 白話解釋 | 本專案值 |
|---|---|---|---|
| **`head`** | 表 | 「字體標頭（header）」表，放全域基本資料。 | — |
| `head.unitsPerEm` | `head` 欄位 | 見 A 的 upem。 | 1000 |
| **`OS/2`** | 表 | 「OS/2 and Windows Metrics」表（名字是歷史遺留，源自 IBM OS/2 系統）。放一大堆度量與旗標。 | — |
| `sTypoAscender` | `OS/2` 欄位 | **設計者原意**的排版上伸（typo ＝ typographic）。這組構成「**em 度量**」，SVG 的 0.88 出自此。 | **880** ＝ 0.88em |
| `sTypoDescender` | `OS/2` 欄位 | 排版下伸，**負值**（在基線下方，座標為負）。 | **−120** ＝ −0.12em |
| `sTypoLineGap` | `OS/2` 欄位 | typo 這組的**額外行距**（行與行之間再加的空隙）。 | 0 |
| `usWinAscent` | `OS/2` 欄位 | 早期 **Windows** 用的「裁切框」上緣：超出就被切掉，故通常做得**偏大**（怕濁點、附標被切）。 | **1151** ＝ 1.151em |
| `usWinDescent` | `OS/2` 欄位 | Windows 裁切框下緣。特別：**恆正**（表達「往下多遠」的長度，不寫負號）。 | **286** ＝ 0.286em |
| **`hhea`** | 表 | 「Horizontal Header（橫排標頭）」表。Mac／橫排排版讀這張。 | — |
| `hhea.ascender` | `hhea` 欄位 | 橫排用的上伸。 | **1151** ＝ 1.151em |
| `hhea.descender` | `hhea` 欄位 | 橫排用的下伸，**負值**。 | **−286** ＝ −0.286em |
| `hhea.lineGap` | `hhea` 欄位 | 橫排**額外行距**。總行高 ＝ ascent ＋ ｜descent｜ ＋ lineGap。 | 0 |
| `fsSelection` | `OS/2` 欄位 | 一串**位元旗標**（粗體？斜體？…每個 bit 一個是非）。 | bit 7 未設 |
| **USE_TYPO_METRICS** | `fsSelection` 的 **bit 7** | 開關：**設了** → 系統排行盒用 sTypo 那組;**沒設** → 用 win／hhea 那組。決定「基線擺哪」用哪組度量。 | **False（沒設）→ 用 hhea/win** |

> 一句話串起來：一個字體對「上伸／下伸」竟存了**三組**（sTypo／usWin／hhea），
> 是 Mac、Windows、設計原意各用各的歷史遺留。`USE_TYPO_METRICS` 這個開關決定
> 瀏覽器排版時聽哪一組。本專案沒設它 → 聽 hhea/win（1.151），不是 sTypo（0.88）。

### C・Canvas `TextMetrics` API（**不是** OpenType，是 JS 把上面那些讀出來的名字）

`ctx.measureText('漢')` 回傳的物件欄位。只是**讀值的管道**，值本身仍來自 B 的表。

| 術語 | 白話解釋 | 備註 |
|---|---|---|
| `fontBoundingBoxAscent`／`Descent` | 「這個**字體**」層級的上伸／下伸——跟你打什麼字**無關**、固定。通常對應 win/hhea 那組。 | ⚠ Chrome **捨入成整數 px**，不精準 |
| `actualBoundingBoxAscent`／`Descent` | 「你這串字**實際墨跡**」的上下緣——會**隨字變**（打「一」跟打「漢」不同）。 | 量真實墨跡用 |
| `alphabeticBaseline` | 字母基線的位置。 | ＝ 主基線 |
| `ideographicBaseline` | **表意文字（漢字）基線**位置。 | CJK 相關 |
| `hangingBaseline` | 懸掛基線（天城文等印度系文字，字掛在上緣一條線下）。 | 非 CJK |
| `emHeightAscent`／`Descent` | 以 **em 方框**為準的上下伸（常 ≈ sTypo 那組）。 | Chrome 常回 undefined |

### D・CSS 排版側術語（非 OpenType，但文中出現，一併記）

| 術語 | 白話解釋 |
|---|---|
| **line box（行盒）** | 一行文字實際佔的高度框。由該行的字體度量 ＋ `line-height` 撐出。 |
| **strut（支柱）** | 每行由元素**自身字體**撐出的一個隱形「基準字」，決定行盒最小高與**基線在行盒裡的位置**。 |
| **leading（行距／鉛距）** | `line-height` 比字體自然高度多出的部分，上下**均分**（half-leading ＝ 上半 leading）。 |
| **replaced element（替換元素）** | 內容由外部資源替換的元素（`<img>`／`<video>`／inline `<svg>`）。有內在尺寸;`<img>` 的基線 ＝ 下緣邊（本文重點坑之一：inline `<svg>` 卻不是）。 |
| **first-available／primary font** | 字體 stack 裡第一個「可用（有 glyph 且已載入）」的字體。**它定 strut**，未必是渲染某個 glyph 的那個字體。 |
