# Claude Design 任務書 — han.css 首頁「全頁 playground」視覺深化

> 給 Claude Design 的開工 prompt。背景：首頁已重構為「整頁即 playground」——
> 左側 `<han-rail>` 配置面板驅動整個 `<main class="han">` 的排版變數，每個內容
> 區段既是文案也是活體範文。功能與資訊架構已定案且運作良好，但 owner 判斷
> **整體視覺太單薄**：一條等寬窄欄、每站同一種「眉題＋標題＋段落」節奏，缺少
> 視覺錨點、示範力道與記憶點。你的任務是在不動功能與規範的前提下，讓這頁
> 有「字體排印框架官網」應有的說服力。

## 先看現場

```bash
cd ~/Workspace/hanzi.pro/han
pnpm --filter han-manual build
cd manual/dist && python3 -m http.server 4189   # → http://localhost:4189/
```

五個 locale（`/`＝hant、`/hans/`、`/en/`⋯）、亮暗兩態（masthead 月亮 toggle）、
直排模式（右下角懸浮的橫排／直排 pill）都要實際看過再動筆。舊版首頁凍結在
`/old.html`，只作歷史參考。

## 現狀盤點（動筆前的事實基礎）

**頁面結構**（`manual/_home.html` ＋ `manual/home/*.html` 八個 partial）：

1. Topbar — Brand（漢.css 字標）、文檔/GitHub、語言切換、主題切換、版本章
2. `<han-rail>` — 左欄配置面板（web component，shadow DOM）：度量 slider
   （字級/行距/字重——偏差會寫進陸站生成碼的 `body {}` 規則）、
   其下一塊**非收合的「模組」開關區**（語意/長文/行/字體四個開關＝import
   級模組閘門，撥動任一個即自動開合並灰顯其對應 details）、語意樣式標準化/
   段落間距調整/行的調整/字體四群組（各組原「啟用」列已移除）、
   JavaScript 群組；字體群組以「Web字體來源」（CDN／npm／不使用；選
   不使用時 webfont 選項灰顯、值落回系統）取代原「Ziano引入＋CDN來源」；**沒有全域 Reset**——每個控件
   **群組**的標頭自帶「使用預設値」↺ 按鈕，僅在該組有偏離時出現（兼作
   「這組被動過」的標記，owner 拍板的互動模式，保持）；<52rem 變
   bottom sheet。
   另有一顆**右下角懸浮 pill（橫排／直排）**——書寫方向是純預覽狀態、
   不是 han.css 變數，所以刻意脫離配置面板（owner 拍板）；設計時可
   重新安置這顆 pill，但「預覽開關不入配置欄」的區隔要保持
3. Manifesto — display 標題（「印刷品般的漢字排版」）＋ lede ＋ InstallChip ＋
   三格 Stats（支援語種/體積/依賴）
4. 壹・語意 — 著重號、書名號、專名號、`<abbr>`、日文引文的活體示範文案
5. 貳・字體排印 ＋ 參・行的調整 — 同上，範文即示範
6. 肆・段落 — prose 模組的活體樣本：站文自己排在 `<article>` 裡（兩端
   對齊、2em 縮排尺、連續標題收攏都作用在這段文字上，撥模組開關即時回流）
7. 伍・試玩 — 用戶自己貼 Markdown/HTML 的編輯器（預覽/原始碼分頁）
8. 陸・引用碼 — 隨配置即時生成的安裝代碼（npm/CDN 分頁、語法高亮終端面板；
   模組開關增減 import 行、度量偏差出 `body {}` 規則）
9. Closing — 一行安裝、姊妹專案連結（ziano/diantenjeom）、版權腳注

**視覺系統（已定案，不重議）**：

- Token 架構照 `ziano/demo/src/css/variables.css`：外觀命名 `--color-*` 原色 →
  角色命名 `--palette-*` 語意層（`light-dark()`），色值是 han 自家清爽風——
  暖紙白 `#fafaf7`/`#f3f3f0`、墨 `#0e0e10`、**單一青翠綠 accent `#0a8754`**
  （暗色 `#3f9d6f`）、薄荷/松綠 wash。
- 字階 8 檔 token（display `clamp(2em,8vw,4em)` → micro），main 內 em 基準
  隨字級 slider 縮放。字體全走 han.css 自家 `--han-font-*`（尚古黑/明體 webfont）。
- 版心 `68rem`、gutter `clamp(1rem, 4vw, 2rem)`、髮絲線分節。

## 問題診斷（owner 原話：「整體來說有點太單薄了」）

具體症狀，請逐一回應：

1. **節奏單調**——八個區段全是「窄欄 hgroup ＋段落」，滾動時沒有大小、密度、
   明暗的變化；髮絲線是唯一的分節手段。
2. **寬螢幕大量留白**——版心 38em 的正文欄在 1440px 下右側整片空白，沒有
   次欄、旁註、圖示等利用。
3. **示範力道弱**——range 是字體排印框架，但「排版之美」目前只能從正文的
   細節（著重號、懸掛）裡瞇眼找；缺少讓人一眼「哇」的字體排印時刻
   （對照：ziano 首頁的巨字 hero 輪播、玻璃鋼琴鍵）。
4. **Manifesto 平**——display 標題＋兩行字＋三個數字就結束，沒有視覺主張。
5. **站與站之間沒有過場**——直接髮絲線相接，缺少呼吸和期待感。

## 硬約束（violating any = 重做）

- **功能一件不動**：rail 的全部控件、demo-lang chips、試玩編輯器、引用碼
  生成、直排模式、五語系、亮暗雙態全部保留現有行為。47＋條 e2e 是驗收網。
- **規範絕對遵守**：`hanzi.pro/web-style.md`（語意 HTML、pseudo-element 優先、
  token 雙層、logical properties）、han repo `.claude/skills/css-naming`（12 條，
  無 wrapper div、無外觀類名）、`copy-style.md`（漢字標點、不手動空格、
  字體堆疊四層）。設計方案必須可在這些規範內落地。
- **調色盤與字階不重議**（上輪 owner 已拍板）；可以在既有 token 上做
  用量配比、面積、對比的文章，不可以引入新色相。
- **內容不加 letter-spacing**（owner 三令五申）。
- **不用重型資產**：無圖片檔/插畫檔依賴，視覺表現以字體排印本身、CSS
  繪製、既有 webfont 為材料——這個站的美術「就是字」。
- 動效克制、`prefers-reduced-motion` 全程尊重；`/old.html` 與 docs 站不動。

## 交付物（寫成 `docs/design/2026-07-1X-homepage-direction-*.md`，不寫代碼）

1. **二～三個方向提案**，各含：一句話概念、滾動敘事分鏡（section by section）、
   寬螢幕欄位策略、與 ziano/diantenjeom 姊妹站的家族關係處理。附你的推薦與理由。
2. 選定方向的**逐站藝術指導**：每站的視覺錨點是什麼（例：語意站的著重號
   放大特寫？行調整站的懸掛標點對照柱？）、密度與留白計畫、亮暗兩態下的
   模樣、直排模式的退化行為。
3. **Manifesto 的 hero 主張**：用純字體排印做出開場記憶點的具體做法。
4. **過場與節奏系統**：站間的呼吸、滾動中的變化曲線。
5. **實作優先序清單**：P0（非做不可）→ P2（錦上添花），每項標註預估
   影響面（哪些檔案/區段）。
6. 若有 motion，附**動效規格**（觸發、時長、緩動、reduced-motion 退化）。

完成後停在文檔階段等 owner 過目——不要直接改代碼。
