# 逐筆動畫——「漢字標準格式」六字筆畫路徑抽取＋CSS 動畫

目標：利用尚古明體（思源宋衍生）**筆畫路徑不合併**的特性，把
「漢字標準格式」六個字的每一筆抽成獨立 SVG path，在首頁做 CSS
逐筆動畫。六字正是 TypeTray 鉛字盤的六顆字身，動畫天然有家可歸。

## 0. 前提驗證（開工第一步，不成立就止損）

- 思源系「不移除 overlap」是已知事實，但要在**尚古明體實際出貨的
  字體檔**上驗證：用 fonttools 解出六字 glyph，數每字 contour 數、
  確認筆畫間確有交疊而非已合併。
- 字體檔來源：ziano repo（傳承字形 webfont CDN，workspace 同級）
  的尚古明體 woff2/OTF；fonttools 直接吃 woff2。
- 順手記錄：六字各幾條 contour（估計 漢14筆／字6／標15／準13／
  格10／式6，約 60+ 筆，contour 數會略多於筆畫數，見下）。

### 0.5 前提的因果補正（2026-07-18 查證＋實測）

尚古／思源保留 overlap 的**主因是 VF 插值的規格級約束**——OpenType
glyf 規格明言 variable fonts often use overlapping contours；master 移除
overlap 會改變 contour 組成、破壞插值相容（TypeDrawers 共識）。體積只是
次要紅利：在尚古 TC 2000 字子集實測，移除 overlap 後 TTF +3.7%、
WOFF2 +5.6%、總點數 +6.2%（聯集在交點生新節點）。另：此 TTF 全部
47,884 glyph 為 simple、零 composite——「部件共享」機制在此檔不成立。
推論：只要思源系以 VF 為主線，逐筆路徑就是結構性保證，本 feature 的
地基長期穩固；且同一玩法適用整個思源衍生生態（含 Noto CJK）。

## 1. 已知的兩個坑（plan 階段先認帳）

1. **contour ≠ 筆畫，有兩處錯位**：
   - 帶「口」形的封閉筆畫有內圈 counter（洞）——一筆＝外圈＋內圈
     兩條 contour，需按包含關係（外圈含內圈、繞向相反）配對成組。
   - 個別複合筆畫（如 ㇆ 折筆）在字體裡可能本來就是一條路徑，
     也可能拆成兩條——以實際解出的為準，不強求「一筆一 path」，
     動畫單位就叫「stroke group」。
2. **字體裡沒有筆順資訊**：contour 在 glyf/CFF 表裡的順序是製作
   順序，不保證等於書寫筆順。需要人工排序——做一個預覽頁（每條
   path 標序號、點擊調序），六個字約 60+ 筆，手排一次工作量可控，
   排好的順序存進資料檔。

## 2. 抽取管線（Python，沿用 workspace 的 fonttools 慣例）

`scripts/extract_strokes.py`（新檔）：

1. fonttools 載入尚古明體 → `getGlyphSet()` → 六字的 glyph。
2. 每個 glyph 用 RecordingPen 逐 contour 錄製 → 每條 contour 轉
   SVG path d 字串（SVGPathPen per contour）。
3. counter 配對：計算各 contour 的 bbox 包含關係＋繞向，內圈併入
   外圈的 stroke group。
4. 輸出中間格式 JSON：`{ char, strokes: [{ paths: [d, …] }, …] }`，
   座標按 unitsPerEm 正規化到 0–1000 viewBox。
5. 筆順預覽頁（丟 scratchpad 即可，不入庫）：載入 JSON、逐筆上色
   標號，人工排序後把最終順序寫回 JSON。
6. 定稿 JSON → 生成一份**內聯 SVG**（六字各一個 `<svg>`，每個
   stroke group 一個 `<path class="Stroke" style="--i: n">`），
   svgo／座標降精度壓體積，目標 gzip 後 ≤ 30KB 級。

## 3. 動畫設計（純 CSS，不引 JS 動畫庫）

- 效果採「**打稿→上墨**」兩段式，貼活字美學：
  1. 描邊期：`stroke-dasharray`/`stroke-dashoffset` 把該筆的輪廓
     線描一遍（描的是輪廓、不是運筆中線——誠實說這不是書法模擬，
     是「刻字」感，正好合鉛字語境）；
  2. 上墨期：`fill-opacity` 0→1 淡入實心。
- 逐筆錯峰：`animation-delay: calc(var(--i) * var(--stroke-step))`，
  `--i` 由生成步驟寫死在每個 path 上（DOM is the data）。
- 觸發：優先 CSS scroll-driven animations（`animation-timeline:
  view()`，Chrome 已出、Safari 未全綠——需 baseline 註記＋
  `@supports` 回落成進場即播）；不引 IntersectionObserver，
  除非回落體驗不可接受再議。
- `prefers-reduced-motion: reduce` → 直接顯示完成態，無動畫。
- 暗色模式沿用現有 token（描邊色走 `--palette-*`）。

## 4. 放哪（二選一，實作前定）

- **甲：TypeTray**——六顆鉛字正是這六個字，把現在 aria-hidden 的
  反排裝飾 slug 換成（或疊加）逐筆動畫版；「排字工揀字填入版框」
  的 caption 正好變成動畫的旁白。鏡像反排（`scaleX(-1)`）可保留，
  刻字動畫＋反字＝鉛字雕刻現場。
- **乙：Manifesto 直排水印**——現有大「漢」水印處，動畫做單字版。
  範圍小、先行驗證用；甲乙不互斥，可先乙後甲。

## 5. 授權（OFL）

抽出的 SVG 路徑是「渲染結果的嵌入」，不是字體軟體的再散布——OFL
FAQ 允許文件內嵌輪廓，無 Reserved Font Name 問題。SVG 檔頭加註
來源字體與 OFL 聲明的註解即可。

## 6. 驗收

- [x] 前提驗證通過（contour 未合併——漢14／字8／標14／準13／格10／式6
      條，wght 釘 400；洞配對：漢2字1標1準3格4式1）
- [x] 六字 JSON＋人工筆順定稿（`scripts/stroke-animation/gen_demo.py`
      的 ORDER 表；每字 stroke group 數：12/7/13/10/6/5，含連筆合組）
- [x] 內聯 SVG 體積 OK（demo 全檔 23KB 未壓縮，gzip 遠低於 30KB）
- [x] **獨立 demo 先行**（2026-07-18 用戶指示）：
      `manual/demo/stroke-animation.html`——自足單檔、打稿→上墨兩段式、
      逐筆錯峰＋字間起步差、重播鈕、筆順編號校訂模式、
      `prefers-reduced-motion` 回落、light-dark() 主題。
      Chromium 已驗（過程＋完成態截圖）；Safari／Firefox 待手動過目。
- [x] demo 效果過目 → 拍板：**甲乙都上**（2026-07-18，並排預覽
      `manual/demo/stroke-placements.html`）
- [x] **整合進首頁完成**（2026-07-18）：
      - 乙・Manifesto 水印：`manifesto.html` 的 `.Outline` span 改內聯
        SVG（12 筆），on-load 逐筆描邊（跟 hero 兄弟元素同款 on-load
        進場慣例），`vector-effect: non-scaling-stroke` 維持與原
        `-webkit-text-stroke: 1px` 的髮絲線視覺等價；終態與整合前
        像素級同構。
      - 甲・TypeTray：`station-type.html` 的 `.Slugs` 六 span 改內聯
        SVG，雕刻動畫（描線→上墨）鍵在 `.Station[data-revealed]`——
        **騎現成的 reveal.js**（原計畫的 `animation-timeline: view()`
        棄用：站上已有一次性 IO 進場機制，不造新輪子）。鏡像、金屬
        面、hover 抬升、data-accent 綠面全數保留。
      - 契約驗證過：settled 態是基態（no-JS＝完成態）、動畫全包
        `no-preference`、reduced-motion 實測 anim:none＋滿描滿填；
        亮／暗模式 Chromium 截圖過目。
      - 模板內 SVG 由 `gen_partials.py` 以標記註解圈住生成
        （`stroke-anim:watermark/slugs:begin…end`），重跑冪等，勿手改。
- [ ] Safari／Firefox 手動過目（Chromium 已驗）

管線落點：`scripts/stroke-animation/`（extract_strokes.py →
strokes.json → stroke_order.py（人工筆順表）→ gen_demo.py／
gen_placements.py（兩個獨立 demo）／gen_partials.py（首頁模板））。

備忘：本檔在 `docs/` 下，commit 時要 `git add -f`。
