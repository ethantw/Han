# 首頁重構：整頁大 Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.
> Steps use checkbox (`- [ ]`) syntax. 依據：`docs/notes/2026-07-13-homepage-critique.md`
> ＋ owner 拍板（2026-07-13）：「整個首頁就是一個大 playground」。

**Goal:** 首頁本身成為可玩的範文——常駐配置 rail 作用於整個 `<main>`，章節即「站」
（說明文字同時是該功能的範文），引用碼生成器跟人走。

**Architecture:** 復用既有資產：`codegen.js`（純生成，不動）、`configurator.js` 的
intents/apply 模式（作用域從 `[data-pg-body]` 改為 `main.han`）、hero 的變數開關
技術、ViewTabs 分頁模式。視覺識別沿用 B v2 tokens（青翠綠／ivory／ink）。
Rail 兩態（`data-rail="side" | "top"`）由 body 屬性切換＋右下角浮動 chooser
（localStorage 記憶）供 owner 在真瀏覽器選型；窄屏（<52rem）一律 bottom-sheet
（仿 ziano sheet 模式）。Rail 本身在 `.han` 作用域外（chrome 不受配置影響）。

**Tech Stack:** 既有 vite manual 站、純 ESM public/ 直出、node --test、Playwright。

**事實基準（P0，寫新文案時必守）:** 套件名 `@hanzi.pro/han.css`；三大模組／三大書體；
autospace 間隙 1/8 em（0.125em）；書名號預設 `none`（示範 bracket 須註明變數）；
字距用 CSS letter-spacing 永不用空格字元；不掛死鏈（沒有目標就不放鏈）；
stats 只列誠實數據（語種／gzip 體積／依賴 1），星星退場。

---

### Task 2: 新首頁骨架＋站文案＋i18n

**Files:** Rewrite: `manual/_home.html`（若佈局須動）、`manual/home/hero.html →
manual/home/` 全套 section partials 重寫（建議新檔名：`manifesto.html`、
`station-semantics.html`、`station-type.html`、`station-lines.html`、
`station-snippet.html`、`closing.html`，`vite.config.js` 的 `HOME_SECTIONS` 同步）；
Modify: `manual/home/_data.js`

結構（`<main class="han" lang per locale>` 內是全部內容＝配置作用域）：

1. **開場宣言**：頂欄（brand＋GitHub＋版本，死鏈全撤）；h1（CSS 字距）＋
   60 字排版宣言（宣言本身混排：漢字、English、數字、「標點」——即首個範文）＋
   install chip `pnpm add @hanzi.pro/han.css`＋一行「本頁即範文——右側／上方
   面板隨手撥，全頁隨你而變」。
2. **站①語意**：說明段落自帶 `<em>`（著重號）、`<cite>`（書名號——正文註明
   「書名號預設關閉，`--han-cite-title-marks: bracket` 一行開啟」）、`<u>`、abbr。
3. **站②字體排印**：三大書體段（沿用 han-font-default/-alternative/-accent 三字樣
   ＋ sans-serif/serif/cursive 圖注）；傳承字形一段（尚古／源起故事一句）＋
   標點規範一段（內文帶滿標點，供 punct 下拉演示）。
4. **站③行的調整**：高密度標點段（擠壓／懸掛可見）、中西混排段（`0.125em` 正確
   數字入文）、注音 ruby 段（zhuyin 標記）。
5. **站④引用碼**：ViewTabs 三分頁生成器（沿用 data-out-* 合約）＋
   「貼進 `<head>` 即完成」＋browser support 一句（modern baseline，具體措辭
   從 README/docs 現有描述取，沒有就寫「現代常青瀏覽器」）。
6. **收尾**：install 一行＋GitHub＋兄弟專案互鏈（ziano→https://hanzipro.github.io/ziano/、
   diantenjeom→https://hanzipro.github.io/diantenjeom/）＋版本。

i18n：hant 全文案；hans 簡體對應；en 翻譯；ja/ko 以 hant 墊（NOTE 註記，沿慣例）。
舊 section 鍵（hero/features/playground/getting-started 專用）在 Task 4 清理。

- [ ] Markup＋文案＋_data.js；`HOME_SECTIONS` 更新；dev 目視零 `{{ }}` 殘留。
- [ ] Commit: `feat(manual): new homepage skeleton — the page is the playground`

### Task 3: Rail（配置面板兩態）＋整頁接線

**Files:** Create: `manual/home/rail.html`（section partial，插在 main 之外或
sticky 定位）、`manual/public/home/rail.css`；Modify: `manual/public/home/configurator.js`
（作用域參數化）、`manual/public/home.js`、`manual/public/home.css`

- [ ] Rail markup＝現 playground 控制面板全套群組（`data-cfg-key` 合約不變、
      手風琴 details 保留）＋度量 sliders（作用全頁）＋「回到預設」按鈕
      （reset config→DEFAULTS→sync）。
- [ ] `initConfigurator(root, { scope })`：apply 目標改 `main.han`；
      fallbacks 裝卸整個 main；輸出面板改餵站④的 `data-out-*`。
      清單式 ALL_VARS 邏輯不變。
- [ ] 兩態：`body[data-rail="side"]`（左欄 sticky，main 右移）與
      `body[data-rail="top"]`（頂部工具條，群組橫向捲動）；右下浮動 chooser
      （「側欄／頂欄」二選、localStorage 持久、標注「選型用，定案後移除」）。
      <52rem 一律 bottom-sheet（peek＋展開，取 ziano sheet 模式精神重寫，勿抄檔）。
- [ ] 全頁 fallbacks 性能實測：headless 下切換任一開關 →
      `performance.now()` 差值記錄於回報（>150ms 需標注，暫不優化）。
- [ ] Commit: `feat(manual): whole-page configurator rail — side/top forms + mobile sheet`

### Task 4: 樣式收整＋舊資產清理

**Files:** Modify: `manual/public/home.css`、刪除或改寫 `hero.css/features.css/
playground.css/getting-started.css` 中不再用的塊；`_data.js` 死鍵清理

- [ ] 新站樣式：站間距韻律、宣言 display 級（字距 −0.01~0.02em、行高 1.15）、
      結構語言統一（漢數眉標留、羅馬裝飾撤）、圓角語言統一（隨 rail 卡片定調）。
- [ ] 刪除舊 section CSS/JS 中已無 markup 對應的規則與 init（hero 演示、假圖、
      getting-started 全套）；`_data.js` 舊鍵清（grep 證零引用）；
      `home.js` init 清單更新。
- [ ] 暗色走查（兩態 rail＋sheet＋全站）；RWD 三檔（≥64rem／52-64／<52）目視。
- [ ] Commit: `refactor(manual): new-homepage styles; retire dead section assets`

### Task 5: e2e 重寫＋全量驗證

**Files:** Rewrite: `tests/e2e/home.spec.ts`（對新頁）；Modify:
`tests/e2e/playground-configurator.spec.ts`（選擇器適配 rail）

- [ ] home.spec：5 locale 渲染、rail 兩態切換
      （chooser click→body 屬性＋localStorage）、任一開關→main inline 變數、
      reset 按鈕行為。
- [ ] configurator.spec：四條既有斷言適配（作用域 main、ViewTabs 在站④）。
- [ ] 全量：root 185 單測、manual 18、targeted e2e 全綠、
      full-sweep 失敗集不增（既有債名單見 RC 計畫）。
- [ ] Commit: `test(e2e): homepage-as-playground coverage`

---

## 驗收（owner 在真瀏覽器選型用）

- `/`：新首頁，右下 chooser 切 side/top 兩態；窄窗變 sheet。
- 撥「標點懸掛」全頁行尾標點懸出；切 GB 全頁句號跳位；換源起全頁字形變；
  「回到預設」一鍵還原。
- 站④分頁生成的引用碼與當前配置一致。
