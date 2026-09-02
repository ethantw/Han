# 注音 ruby 的跨字體光學校正（2026-08-31）

## 決議

han.css 的預設字間注幾何維持純 CSS：以尚古、Hiragino 與蘋方的常見漢字
下緣收斂出一個穩定的合成座位。這條預設也適用本專案的 Diantenjeom 字體方案，
不在載入時量測字型、不注入額外的度量字型。

個別網站若指定了另一套正文體，且其漢字實際墨跡下緣與上述字體明顯不同，則可
**選擇性**執行一次校正，將結果寫成 CSS 常量。這是光學微調，不是 ruby 正常運作
的必要條件。

```css
/* 由校正工具為網站正文體產生；未校正時不需要這一行。 */
.Article {
  --han-ruby-zhuyin-baseline-shift: -.30em;
}
```

結果一旦提交到網站 CSS，伺服器和終端使用者都不必再次量測。

## 問題的邊界

橫排字間注的 fallback 會以基文 inline baseline 作為定位參考，再下降 `.075em`
建立合成的漢字下緣座位。CSS 可以取得盒子與 baseline，卻不能取得某一個 glyph
outline 的實際上下界。

大多數常用 CJK 字體的「永」等漢字，下緣與預設座位接近；部分字體（例如某些
宋體-繁版本）把漢字畫得更低。此時 ruby 本身仍對齊 CSS baseline，但相對於可見
墨跡會顯得偏高。這是字型 glyph design 的差異，不能由 hhea、OS/2 或 `vmtx` 等
line metrics 單獨推得。

## 校正模型

校正工具以代表字（預設 `永`）在 canvas 中量得的
`actualBoundingBoxDescent` 作為可見下緣近似值：

```text
baseShift = targetInkDescent - measuredGlyphDescent
```

其中 `targetInkDescent` 預設為 `.075em`，與 CSS 預設座位相同。字型畫得較低時
`baseShift` 為負值，annotation 應向下移；畫得較高時則相反。

公開變量是在 `<rt>` 上消費，因此最後寫入的是 **rt-em**。工具會按 base/rt 字級
比例換算：

```text
rtShift = baseShift / (rtFontSize / baseFontSize)
```

例如正文校正值是 `-.09 base-em`、`rt` 是 `.3em`，就輸出 `-.30em`。這讓同一個
靜態字型常量可跨正文大小重用。

## 兩種使用方式

### 首選：校正一次，提交 CSS

在目標頁面、目標字型載入完成後量一次，審視視覺結果，再把輸出的常量放到網站的
字型主題或文章容器。這適合自有 webfont、設計系統和內容站：結果可審閱、可快取、
不增加讀者端工作。

需要重測的條件為字型檔或版本、weight、style、stretch、可變字型軸、正文/注音
字級比例有改動。若可變字型的 optical-size 軸會改變 outline，呼叫時須啟用
`fontSizeSensitive`，將正文 size 納入校正條件。

### 可選：執行期校正

此功能由 `@hanzi.pro/han.css/zhuyin-calibration` 明確匯出，不進入主
`han.js`，也不屬於自動安裝行為：

```ts
async function calibrateZhuyinRuby(
  scope: Element,
  options?: ZhuyinCalibrationOptions,
): Promise<ZhuyinCalibrationResult>
```

它會先等待 `document.fonts.ready`，只處理 scope 內的橫排字間注，並依完整字型條件
分組。每組只 canvas 量一次；相同條件的後續 ruby 直接讀快取。結果直接覆寫
`--han-ruby-zhuyin-baseline-shift`，不再與另一個內部位移量相加。

快取保存原始的 base-em descent，因此改變目標下緣或 rt 字級比例不必重新量
canvas。鍵包含 family、style、weight、stretch、variation settings、optical sizing、
feature settings、語言與代表字；啟用 `fontSizeSensitive` 時再包含正文 size。模組級
`Map` 保存量測值；清除 API 還原執行前的 inline custom property。

預計一併提供：

```ts
clearZhuyinRubyCalibration(scope: Element): number
clearZhuyinRubyCalibrationCache(): void
```

## 瀏覽器路徑

Chromium 等尚未實作 `ruby-position: inter-character` 的引擎，使用 Anchor
Positioning fallback；位移直接參與 anchor inset 計算。

Safari 的 native inter-character ruby 不走這個 absolute fallback。`rt` 作為
`ruby-text` 不依賴 `transform`；native 分支在 `rt::before`／`rt::after` 建立空的
logical spacer，再利用 `ruby-align: center` 將真正的 annotation run 移動 spacer
長度的一半。兩倍 spacer 因而得到與 public shift 相同的一倍位移，且不改變 ruby
column reservation。

直排行間注（`ruby-position: over`）不套用這個補償。它在 native ruby formatting
context 中，base 與 annotation 的 inline content box 先配成同一個 column，再依
`ruby-align` 分配額外空間；glyph 本身則由字型的 vertical metrics 排入 column。
它不會拿橫排的 alphabetic baseline 加上漢字物理下緣來決定 annotation 的垂直位置。

## 實作計畫（TDD）

### 1. 先固定可重現的測試條件

- [x] 製作兩套只供測試的最小 webfont：一套 glyph ink 下緣落在預設座位，另一套
  明確低於座位。測試不得依賴作業系統是否安裝尚古、Hiragino 或蘋方。
- [x] 建立橫排字間注 fixture，涵蓋 12px／16px／60px、不同 weight／style、同字型
  多個 ruby、不同字型混排、直排行間注與非注音 ruby 負例。

### 2. 先寫失敗的單元契約

- [x] 以 Node test 固定 base-em → rt-em 換算、正負位移、輸出精度與零值不產生
  CSS 的規則。
- [x] 固定分組及 cache key：相同字型條件只量一次；weight、style、stretch、
  variation、optical sizing、語言或代表字不同時分組；啟用
  `fontSizeSensitive` 時把字級納入 key。
- [x] 固定 clear 行為：還原校正前的 inline custom property，清除量測 cache 後才
  允許同組重新量測。
- [x] 固定 scope 與負例：只選取橫排字間注，不改動直排行間注、行間注模式或 scope
  外的 ruby。

### 3. 實作最小 API

- [x] 在獨立的 `zhuyin-calibration` entry 實作顯式校正與清除 API，使上述單元
  測試通過，且不增加主 `han.js` 的下載量。
- [x] 在瀏覽器測試中驗證 API 會等待 `document.fonts.ready`，並以固定 webfont 的
  `actualBoundingBoxDescent` 覆寫 `--han-ruby-zhuyin-baseline-shift`。
- [x] 校正結果同時輸出字型條件、代表字與可提交的 CSS 常量，方便日後判斷是否需
  重測。

### 4. 驗證兩條排版路徑

- [x] 先為 Anchor Positioning fallback 寫幾何斷言，再接入校正值；比較 annotation
  與合成 ink seat 的座標，不以像素截圖作唯一判準。
- [x] 先為 Safari native inter-character 寫 logical-padding 的失敗測試，再實作映射；
  同時確認正負位移、ruby line reservation 與前後標點避頭尾沒有退化。
- [x] 跑 Chromium 與 Playwright WebKit，並確認直排行間注保持原位。
- [ ] 以 macOS／iOS 實機 Safari 驗收 native 路徑與系統字體。

### 5. 接上工作台與跨字體回歸

- [x] 讓工作台可量測、預覽並複製可提交的 CSS 常量。
- [ ] 以尚古、Hiragino、蘋方、Diantenjeom 與一套低 ink-under 字體做人工光學回歸；
  自動測試仍只使用 repo 內固定版本的測試字體，避免系統字體更新造成不穩定。

## 參考

- [CSS Ruby Layout](https://www.w3.org/TR/css-ruby-1/)
- [Canvas `measureText()`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText)
- [`TextMetrics.actualBoundingBoxDescent`](https://developer.mozilla.org/en-US/docs/Web/API/TextMetrics/actualBoundingBoxDescent)
- [`FontFaceSet.ready`](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/ready)
