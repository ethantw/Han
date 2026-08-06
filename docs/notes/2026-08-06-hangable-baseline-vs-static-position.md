# 懸掛標點 × over 著重號的上浮——static position 錨行盒邊、不錨基線

**日期**：2026-08-06
**症狀**：懸掛開啟時，同行有 `over` 著重號（`--han-em-dot-position: over
right`，ja 預設）的話，掛出的標點整顆上浮；`under` 沒事。
**已修**：`src/css/lines.with-js.css` § 標點懸掛——`<h-layer>` 由
`position: absolute` 改為零寬 `inline-block`。

## 病理

舊實作的 `<h-layer>` 是 abspos 且**不寫任何 inset**——用的是 static
position。Chromium 對行內 abspos 的 static position 錨的是**行盒邊緣**，
不是基線。兩者平時重合，行盒一被「不對稱地」撐大就分家：

- `over` 著重號撐大 **ascent** → 行盒頂邊上移、基線在行盒內下沉 →
  錨著行盒的層跟著上浮。實測（字級 24px）：`line-height: 1.75` 偏
  **−14px**、`1.2` 偏 **−21px**——偏移量＝行盒的增長量。
- `under` 撐大 **descent** → 行盒頂不動 → 無偏移。不對稱性就是指紋。

這是**盒緣 vs 基線兩套座標系**的老病，與 logo「漢」字 SVG 的基線大戰
同源（`docs/notes/2026-07-21-svg-glyph-baseline-alignment.md`）。那份筆記
的結論清單早已點名解法家族：**非空 inline-block 是基線對齊的白名單成員**。

## 修法

```css
h-layer {
  display: inline-block;
  inline-size: 0;
  text-indent: 0;
}
```

- 零寬 ⇒ 盒不佔行內空間，佔位由 `::after` 的 1em Han Em Space 空格照舊
  負責；字形沿行內方向溢出、畫在佔位符上。行邊空白塌縮的懸掛機制原封
  不動——只是「字形留在原地」的理由從「abspos 不隨行縮」換成「零寬盒
  貼在行末、字形溢出欄外」。
- **基線由自己的文字對齊**（inline-block 的基線＝末行文字基線），行盒
  被什麼撐大都與它無關——這就是「用 baseline 修」的本義。
- `h-char` 的 `position: relative` 一併移除（它唯一的職責是當 abspos 的
  包含塊）。
- ⚠️ `overflow` 必須維持 `visible`（預設）：inline-block 一旦 overflow
  非 visible，基線就改成盒底邊，對齊全毀。
- `text-indent: 0` 照舊——inline-block 是 block container，會吃繼承的
  縮排（`.poem-like` 等）。

## 量測（字形對字形，Range 取逗號與同行基準字）

| | under | over@1.75 | over@1.2 | 行尾懸掛 |
|---|---|---|---|---|
| 修前 | 0 | −14px | −21px | 掛出 24px |
| 修後 | **0** | **0** | **0** | 掛出 24px（不變） |

Chromium／WebKit 皆 0（含直排同欄零偏差）；Playwright 附帶的 Firefox 尚無
custom-property style query，懸掛 gate 不啟用＝原有的優雅降級，非回歸。

## 順帶排除的兩個風險

1. **折行**：原子盒對斷行器可見（abspos 不可見），理論上「字」與盒之間
   多了個斷點。實測寬度掃描 320→120px（步進 4px）標點**永不落行首**：
   零寬盒永遠塞得下，斷行器總是選更後面的空格斷點。
2. **justify 漂移**：字與標點之間零間隙（dLeft 全 0）——Chromium 沒有在
   表意字與原子盒之間插入伸縮量（或伸縮全給了空格）。

## 相關語意更新

- `::first-line` 照舊選不到掛出的標點，但機制換了：以前是「out-of-flow
  不屬首行」，現在是「first-line 樣式不繼承進原子行內盒的內容」。
- 旁鄰擠壓修補（`」，`／`，「`）原因改述：pair-squeeze 死於原子盒
  （工作區帳本 pair-squeeze-and-markup.md）——abspos 時代同樣擠不到，
  修補早已存在，不因此變動。

## 為什麼「標點懸掛 101：禁用 inline-block」在這裡失效

老規矩沒有錯——錯的是把它當成無條件的。禁令的實質是：**原子盒切斷引擎
對標點的視線**——pair-squeeze 跨不過它（工作區帳本）、斷行器看不見盒內
是「，」所以避頭尾失靈、trim-start 把盒內首字當行首。這些在「引擎負責
標點周圍排版」的傳統做法裡是致命的。

但本設計的 hangable **早就把這三件事從引擎手上拿走了**：

1. 擠壓——hangable 不走原生 trim，旁鄰修補（半形空格換臉＋
   `letter-spacing`）在 abspos 時代就存在；
2. 禁則——hangable 的定義就是永不折行，唯一斷點是後面會塌縮的空格；
3. trim-start 誤判只咬開括號，hangable 全是收尾標點。

**原子盒的學費早已全額繳清**——改用 inline-block 沒有再失去任何東西，
卻白拿了它最值錢的資產：基線。101 禁的是「讓引擎排的標點」進原子盒；
這顆標點早就不歸引擎排了。

## 教訓

abspos「不寫 inset」的 static position 是**行盒座標**，任何要和文字對齊
的東西都不該依賴它——行盒會被著重號、ruby、更高的行內盒隨時撐大。要
基線就進文流拿基線：`<img>`、非空 inline-block、mask-box 那張白名單。

「進文流拿基線」的真正紅利不是拿到基線，是**把度量的所有權還給引擎**：
整個修法沒有出現過一個 line-height／ascent／descent 的數字——與 SVG 那
場要逐字體量補償常數的大戰相反。SVG 苦是因為它沒有文字、沒有基線可
交，只能在引擎外重建引擎已知的事；這裡內容物就是文字，度量全程留在
引擎肚子裡——我們不持有任何度量，就沒有任何度量會過期。

實驗頁：scratchpad `hang-lab.html`（JIS 開懸掛＋over/under/行尾/直排/
寬度掃描六案）。
