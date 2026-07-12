# Playground 配置器與 Manual 完成 — 設計規格

**日期**：2026-07-12　**狀態**：待審　**範圍**：han.css v4 的 manual 站收尾，
核心是把首頁 playground 從「純預覽」升級為「配置器」——配置各模組 → 即時預覽 →
生成對應引用碼（CDN `<link>`／pnpm `import`／CSS `@import` ＋ custom properties 配置）。
連帶完成與 Diantenjeom、Ziano 的字體對接（含一個已確認的 font-family typo bug）。

本規格經 2026-07-12 brainstorming 定案；實作計畫另立。

---

## 1・目標與立場

- han v4 代碼已大致完成。**本輪交付＝門面（manual & playground）＋對接（DTJ / Ziano）**，
  不重寫核心。
- 配置器的靈魂：han v4 是「**一個 bundle ＋ custom properties 配置**」模型
  （功能預設全開、style query opt-out、JS 僅為舊瀏覽器後備層）。
  所以任何配置 → 恰好一條樣式引入 ＋ 一段 `:root {}` 變數 ＋（選用）JS。
  配置器把這件事**可視化**並替用戶產出最小引用。
- 服務七月 RC 計畫：manual build → GitHub Pages 部署是後續步驟，本規格不含。

## 2・現況依據（已核實）

- `src/han.css` 以 `@layer` 匯入四區：semantics／lines／prose／fonts；
  各附 `.with-js.css` 後備樣式。入口：`./styles`（全量）、`./basic-styles`、
  JS `installFallbacks()`／`uninstallFallbacks()`（`@hanzi.pro/han.css`）。
- 功能開關全走 `@property` 註冊的 cascade 變數（style-query opt-out 遷移已完成）：
  - `--han-text-autospace: normal | insert | replace | strict | no-autospace`
  - `--han-punctuation-refinement: auto | compress | hang | none`
  - prose 作用機制：`container-name: han-prose`（`<article>` 預設啟用），
    縮排量 `--han-prose-indent`。
- 字體層（`src/css/fonts.css`）三槽已就緒：
  - 傳承字形（僅 zh-Hant）：`--han-use-heritage-glyphs-for-hant: webfont|system|off`，
    堆疊由 `--han-webfont-heritage-glyghs-sans/-serif` 提供（名字待修，見 §3）。
  - 楷體 cursive（逐語言）：`--han-cursive: webfont|system|off` →
    hant: LXGW WenKai TC、hans: LXGW WenKai、ja: Klee One。
  - DTJ 標點（逐語言慣例）：`--han-punctuation-hant`（預設 MOE）／`-hans`（GB）／
    `-ja`（JIS）：`JIS|MOE|GB|off`；`--han-punctuation-vertical-ko: KV|off`。
- JS 模組實情：`installFallbacks` 是唯一總入口（autospace insert/replace/strict、
  標點擠壓／掛標點 wrapper、裝飾線間距等後備）；`convertLegacyRuby` 為獨立匯出的
  v3 `<rb>/<rtc>` → v4 轉換器，不在 `installFallbacks` 內。Ruby 排版本身純 CSS。
- 現有 playground（`manual/home/playground.html` ＋ `public/home/playground.js|css`）：
  範文 chips（zh-Hant/zh-Hans/ja/ko/自訂 Markdown）、4 個規則 toggle、3 個度量
  slider、即時預覽。**保留其預覽基建，疊加配置與生成層。**
- 產品體系：Ziano 16 個 `@hanzi.pro/webfonts-*`、DTJ `@hanzi.pro/diantenjeom`
  均已發 0.1.0 stable（`latest`），CDN 引用一律 `@latest`（jsDelivr）。

## 3・字體對接修正（先行小修，出貨級 bug）

`src/css/fonts.css` 對照 Ziano 實際註冊的 `@font-face` 名：

| han 現況 | 實際註冊名 | 性質 |
|---|---|---|
| `'Shangu Sans'` 等（缺 g） | `'Shanggu Sans'` 等 | **真 bug**：比對不到，傳承主字體不載入 |
| `'Genyo …'` | `'GenYo …'` | 大小寫，無害；順手對齊 |
| `'LXGW Wenkai …'` | `'LXGW WenKai …'` | 同上 |
| `'Diantenjeom …'` 全套 | 一致 | ✅ 已對上 |

修正：全部改為 Ziano 註冊名；同時更名
`--han-webfont-heritage-glyghs-*` → `--han-webfont-heritage-glyphs-*`（typo）。
v4 尚未發布，直接改、不留 alias。

另補一項小的 han 代碼增量（與 `--han-cursive` 同型的 mode 變數，供配置器有掛點）：

- `--han-webfont-em-space: webfont | off`（預設 webfont）
- `--han-webfont-zhuyin: webfont | off`（預設 webfont）

`off` 時對應 `@font-face` 的字族不進堆疊（樣式仍在，字體不請求）。

## 4・Playground 配置器

### 4.1 控制面板

| 群組 | 控件 | 映射 |
|---|---|---|
| **語意 Semantics** | 單一開關（layer 級，不逐功能） | layer opt-out 變數（實作時取 `semantics.css` 現名） |
| **行文 Prose** | 開關 ＋ 作用選擇器（文字輸入，預設 `article`） | 開關→layer opt-out；選擇器非 `article` 時生成 `<sel> { container-name: han-prose }` |
| **行調整 Lines** | 友善開關三枚：掛標點／標點擠壓／中西混排間距；「進階」揭示層可直接選模式 | 掛✓擠✓→`auto`、僅掛→`hang`、僅擠→`compress`、全關→`none`；混排 ✓→`normal`、✗→`no-autospace`，進階可選 `insert/replace/strict`（僅在啟用後備 JS 時顯示，並提示需 JS） |
| **字體・傳承字形**（僅 hant） | 模式 `webfont/system/off` ＋ 家族選擇（sans、serif 各一，來源＝roster 中的 hant 傳承家族：尙古、源起等） | 模式→`--han-use-heritage-glyphs-for-hant`；換家族→覆寫 `--han-webfont-heritage-glyphs-sans/-serif` ＋ 生成對應 webfont link |
| **字體・楷體 cursive** | 模式 `webfont/system/off`（逐語言自動：hant LXGW WenKai TC／hans LXGW WenKai／ja Klee One） | `--han-cursive`；webfont 時生成三個 link（僅預覽語言含該語時） |
| **字體・標點 DTJ** | 逐語言下拉：hant／hans／ja 各 `JIS/MOE/GB/off`，直排韓文 `KV/off`；各語言預設如 §2 | 四個 `--han-punctuation-*` 變數；任一非 off → 生成 DTJ link（combined `diantenjeom.css`，@font-face 僅在實際用到時請求字體） |
| **字體・排印補助** | Em-space 開關、注音 Zhuyin 字體開關 | `--han-webfont-em-space`／`--han-webfont-zhuyin`（§3 新增） |
| **JS** | ① 舊瀏覽器後備 `installFallbacks`；② 舊式 ruby 轉換 `convertLegacyRuby` | 各自獨立開關；勾任一 → 輸出含 `<script>`／`import` |

預設值＝han 出廠預設（全開、各語言標點慣例、JS 兩項皆關）。

### 4.2 預覽

沿用現有 playground：範文 chips、自訂 Markdown、度量 sliders 不變。
配置變更＝改寫預覽容器上的對應變數（純 CSS 生效，無需重建 DOM）；
勾選 JS 後備時在預覽 iframe/容器內實際執行 `installFallbacks`（改配置後
`uninstallFallbacks` → 重跑）。字體採**按需載入**：選到某家族才注入該
`<link>`（`@latest`），避免預載 16 家族。

### 4.3 程式碼生成

三分頁，**預設 pnpm**；每頁同一結構「樣式引入 → `:root` 配置 → 選用 JS」：

1. **pnpm / bundler**：安裝指令（pm 切換 npm/pnpm/yarn，預設 pnpm，僅列實際
   用到的套件）＋ JS/CSS `import` ＋ `:root` 配置（建議放入專案 CSS）。
2. **CDN**：`preconnect` ＋ jsDelivr `@latest` links（han → 用到的 ziano 家族 →
   DTJ）＋ `<style>:root{…}</style>` ＋（勾選時）`<script type="module">`。
3. **CSS @import**：等價 `@import url(…)` 序列 ＋ `:root` 配置；
   若勾了 JS 項，註明需另加 `<script>`（@import 帶不動 JS）。

生成規則：
- **只輸出偏離預設的變數**；全為預設 → `:root` 區塊整段省略。
- 未勾任何 JS → 完全無 script/import（引擎零載入是賣點，生成器要彰顯它）。
- 每分頁附一鍵複製。生成邏輯為純函數（config in → string out），與 UI 分離
  （同 ziano `cdn.ts` 路子），供單元測試。

### 4.4 狀態模型與檔案

單一 `config` 物件為唯一事實源，`intents`（事件→config）與 `apply`
（config→預覽 DOM／生成碼）分離，依 workspace `web-style.md`（FP／declarative
TS、`data-*` 承載 DOM 資料、`:has()` 狀態）。新增模組與現檔並列於
`manual/public/home/`（如 `configurator.ts`＝控制面板 intents、`codegen.ts`＝
純生成函數），`playground.js` 既有預覽邏輯盡量少動。UI 文案走 manual 既有
`_i18n.js` 雙語機制。

## 5・Manual 收尾

- demo 頁（`manual/demo/*`）內容已齊；核對其字體引用與 §3 修正後的名字一致。
- 首頁 playground 區塊擴入配置器（§4），i18n 文案補齊。
- README（發布前置，於 RC 計畫追蹤）不在本規格。

## 6・測試

- `codegen.ts` 純函數單元測試（`node --test`，沿現有測試設施）：
  代表性配置 × 三分頁的快照；「全預設→無 :root」「無 JS→無 script」兩不變式。
- 既有 Playwright e2e 擴一條：改配置 → 預覽變數生效 ＋ 生成碼含對應片段。
- §3 字體名對齊後，跑 manual build ＋ 目視預覽確認 Shanggu 實際載入
  （DevTools 網路面板見 woff2 請求）。

## 7・不做清單

- hans 傳承字形槽（han 尚未實作 `--han-use-heritage-glyphs-for-hans`；楷體補充已覆蓋）。
- 語意／行文 layer 的逐功能細開關（layer 級即可）。
- 生成碼的版本釘選 UI（一律 `@latest`；釘版屬用戶自行編輯）。
- 直排預覽模式、分享配置 URL（好點子，後續再議）。
- `virtual-primary` 等可行性示範頁不入配置面。

## 8・實作時驗證清單

小型事實核查，結論不影響本設計，僅影響細節寫法：

1. semantics／prose layer 現行 opt-out 變數確切名稱（style-query 遷移後的定名）。
2. roster.toml 中「hant 傳承 sans/serif」家族清單（哪些納入家族選擇器）。
3. `dist/` 是否單檔 bundle em-space/zhuyin（決定 §3 mode 變數的實作插點）。
4. 現有 playground 的 toggle 變數名與新控制面板的銜接（避免雙套開關）。
