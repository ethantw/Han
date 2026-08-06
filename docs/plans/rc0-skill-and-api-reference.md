# v4-rc0 —— 首頁 ＋ Skill ＋ API 參考表

**狀態**：規劃中（2026-08-04 起草）
**目標日**：2026-08-15

## 決策

rc0 的交付面縮成三件：

1. **首頁**發布（已打磨完成）。
2. **使用手冊隱藏**——`manual/src/docs/` 不上線，首頁明寫一句「rc 期文檔施工中，
   請用 Skill 或 API 參考」。沒有這句話，缺文檔會被讀成「還沒做好」；有這句話，
   會被讀成「刻意的 rc」。
3. **API 參考表**（repo 內 Markdown，不上官網）＋ **安裝配置 Skill**（英文
   canonical ＋ 四個本地化 wrapper）。

理由：手冊的瓶頸是「潤飾散文」，而散文正是最耗時、最難驗收的形式。換成「正確的
參考表」後，工作量沒消失但形式變了——表格寫得快、對錯驗得出來，而且它同時是
Skill 的唯一資料來源。

### 語言策略

| 交付物 | 語言 | 規則 |
| --- | --- | --- |
| API 參考表 | **英文 only** | 唯一真實來源。rc 期改最勤，翻譯即漂移。 |
| Skill（canonical） | 英文 | 全部判斷邏輯、模組表、產出模板只存在這一份。 |
| Skill（wrapper） | zh-Hant / zh-Hans / ja / ko | 只有散文說明 ＋「執行時一律讀英文版」。 |

**wrapper 的硬紀律**：內文不得出現任何程式碼、參數名、模組名、變數名。出現一個
`--han-*` 就開始漂移。wrapper 的唯一功能是「被母語提問觸發」，因此 frontmatter
`description` 必須含本地語關鍵字（排版／組版／조판），body 第一行就導向英文版。

中文必須繁簡兩版——`--han-punctuation-hant` / `hans` 在 API 層是分開的，門面不能
比 API 粗。

### 順序不可反

**先凍 API 參考表 → 再寫英文 Skill → 再擴 wrapper。** API 還在動時先寫五份 Skill，
是最難改的那種趕不上。

---

## Todo

### A. API 參考表（阻塞其他所有項）→ **完成：`docs/api-reference.md`**

- [x] A1 盤點 `--han-*` 全表——實數 **47 公開 ＋ 2 internal**（先前 54 含註解
      前綴殘片），逐條 值／預設／模組／需 JS
- [x] A2 盤點 JS 匯出（13 函式 ＋ 3 型別），簽名／冪等性（一次性，無
      MutationObserver）／SSR（Node 走 happy-dom、無條件跑全部）
- [x] A3 自訂元素與 markup 契約（`h-char` `h-layer` `h-iss` ＋ data 屬性；
      `h-ruby` `h-tone` 現源碼已不產出，未列入）
- [x] A4 功能 ↔ 需求矩陣（§8）
- [x] A5 從 manual 七篇抽骨（草稿事實密度其實很高，抽骨快於預期）
- [x] A6 internal 標註：`--han-probe-autospace`、`--han-state-hanging-punctuation`；
      另揪出 `dist/han.install.min.js` 是舊 `--han-install` 機制的**殘留產物**
      （不在現行 build entry points）——已從 dist 刪除並驗證 rebuild 不再生
- [x] A7 凍結宣告（併入參考表 Preface）

### B. Skill（英文 canonical）→ **完成：`skills/han-setup/SKILL.md`**

（放 `skills/`——對外交付物，與內部開發用的 `.claude/skills/` 分開；
C 的 wrapper 之後放 `skills/han-setup/{zh-hant,zh-hans,ja,ko}.md`）

- [x] B1 偵測優先規則表（Step 0，11 項偵測；含 v3／heti 既裝偵測防重複安裝）
- [x] B2 三題快速路徑（Step 1；可偵測即跳過）
- [x] B3 完整題庫（Step 1b，opt-in 進階 10 題，每題附預設與理由）
- [x] B4 產出＝可提交檔案：`han.config.css`（逐項附一行理由）＋安裝碼＋
      webfont links（含 OFL 義務告知）＋ JS wiring（SPA/SSR/靜態三式）
- [x] B5 可重跑：config 註解即狀態，re-run 讀舊理由對映新表面出 diff
- [x] B6 fixture 驗證：React+Tailwind zh-Hant（含 lang="en" bug、手打空格、
      tabular ruby）＋純 HTML ko（無 lockfile→CDN）。偵測規則全命中；
      產出物識別字逐一機械比對 api-reference.md，全 OK
- [x] B7 自測 checklist（併入 Skill Step 4，含「失敗時前三嫌疑」）

### C. 本地化 wrapper

- [ ] C1 zh-Hant / zh-Hans / ja / ko 各一份，遵守零程式碼紀律
- [ ] C2 frontmatter description 含本地語觸發詞

### D. 非 LLM 退路（不可省）

- [ ] D1 首頁一行 `<link>` 的預設引入，拿到 80–90% 效果
      ——不然「這框架要裝 Claude Code 才能用」會是唯一被討論的一句話
- [ ] D2 首頁加「rc 期文檔施工中」的說明

---

## API 參考表骨架

單一檔案，英文，表格為主、散文為輔。暫定 `docs/api-reference.md`。

### 0. Preface
版本與 rc 狀態、API 可能變動、鎖版本建議、一行安裝。

### 1. Install & load order
- npm / CDN / 直接下載三種
- `@layer` 名稱與順序：`han-semantics` → `han-lines` → `han-prose` → `han-fonts`
- 與既有 reset / Tailwind preflight 的先後（順序錯＝靜默無效）
- 作用範圍：全站 vs 容器內
- **前提：`lang` 屬性**。han 大量依賴 `:lang()`，整站 `lang="en"` 則裝了等於沒裝。
  這是最容易漏、後果最大的一條，放在最前面。

### 2. Bundles
| bundle | 內容 | 大小 | 何時選它 |
`han.css` / `han.basic.css` / `han.semantics.css` / `han.lines.css` /
`han.prose.css` / `han.fonts.css`；JS 側 `han.js`（tree-shakable）/
`han.auto.js`（副作用自動安裝）/ `*.browser.js`。
標明 `.with-js` 分片與哪個 pass 配對。

### 3. CSS custom properties
主體。分組，每列：**name / values / default / module / needs JS**。

1. **Module switches** —— `--han-semantics` `--han-prose` …
2. **Fonts** —— `--han-font-{default,cjk-sans,cjk-serif,cjk-cursive,
   latin-sans,latin-serif,latin-cursive,punctuation-sans,punctuation-serif,
   punctuation-cursive,zhuyin-serif,accent,alternative}`、
   `--han-{sans,serif,cursive,system-ui}`
3. **Web fonts** —— `--han-webfont-heritage-family`、
   `--han-webfont-heritage-glyphs-{sans,serif}`、`--han-webfont-cursive-hant`、
   `--han-use-heritage-glyphs-for-{hant,hans,ja,ko}`、`--han-use-cursive`
4. **Punctuation** —— `--han-punctuation-{hant,hans,ja,ko}`、
   `--han-punctuation-vertical-ko`、`--han-punctuation-refinement`
5. **Typographic features** —— `--han-text-autospace`、
   `--han-state-hanging-punctuation`、`--han-quotes`、`--han-title-marks`、
   `--han-cite-title-marks`、`--han-em-symbol`、`--han-em-dot-position`、
   `--han-underline-offset`、`--han-text-decoration-inset`
6. **Prose** —— `--han-prose-indent`、`--han-prose-alignment-for-article-p`、
   `--han-prose-consecutive-headings-{a-block-end,b-block-start}`、
   `--han-prose-fonts`
7. **Internal（不對外承諾）** —— `--han-probe-autospace`、
   `--han-adjacent-lines-skip-gap-fallback`

### 4. Markup contract
- han 產生的自訂元素：`h-char` `h-ruby` `h-tone` `h-iss` `h-layer`
- han 消費的原生元素：semantics 模組吃的那批（`cite` `em` `q` `blockquote`
  `figure` `ruby`/`rtc`/`rb` …）
- **跳過區**：`<math>` / `<svg>` 內一律不包裹（見 `src/ts/helpers/skip.ts`）

### 5. JS API
- `installFallbacks` / `uninstallFallbacks`（三個多載）
- `refinePunctuation` ＋ `refinePunctuationWithMode` ＋ `setPunctuationRefinementMode`
- `applyISS` ＋ `applyISSWithProbe` ＋ `applyISSWithMode` ＋ `setISSMode`
- `markAdjacentLines` ＋ `WithMode` ＋ `WithSelectors` ＋ `setDecorationInsetMode`
- `transpileRuby`
- 型別 `RefineMode` / `ISSMode` / `DecorationInsetMode`
- 橫切事項：SSR no-op、冪等性、SPA 路由切換要不要重跑、與 `.with-js` CSS 的配對

### 6. Feature ↔ requirement matrix
每個功能一列：純 CSS？需 JS？需 web font？需特定 markup？瀏覽器支援？

### 7. Web fonts
ziano 切片、CDN vs 自 host、`font-display`、preload、自 host 的部署路徑／CORS／
cache header（自 host 唯一真會卡人的地方）、**OFL 義務與 `LICENSE-FONTS`**。

### 8. Known limitations（rc 期誠實揭露）
原子行內盒吃掉開括號、`justify` 撞折行 `<pre>`、WebKit 的 `mask-clip: no-clip`
與 SVG 直排、`legend { float }`——挑對使用者可見的列。

### 9. Migration from v3 & versioning
指向 `manual/src/docs/migration.md`；rc 期升級策略。

---

## Skill 題庫

### 由偵測決定，不問
框架與 bundler、既有 reset / Tailwind、`lang` 屬性現況、內容裡的手打全形空格、
現有 `<ruby>` 有無 `<rtc>`、是否已在用 `text-spacing-trim` 或其他 CJK 套件、
既有 `--` 命名衝突。

### 用預設，只在產出註解交代
`<rtc>` 處理、標點字體是否另設、混排進階模式、行高／基線、引號樣式、簡繁 `locl`、
深色模式、列印樣式。

### 真的要問（三題快速路徑）
1. 站點語言／文種（繁／簡／日／韓，可複選）
2. 黑體還是明體
3. web font 要不要；要的話 CDN 還是自 host

### 完整路徑才問
直排需求、著重號／專名號／書名號等語意標記、字體載入策略與體積上限、
作用範圍（全站 vs 容器）、JS 增強要哪幾個 pass。

### 必須主動告知（不是問題，是義務）
- `lang` 屬性若不正確，Skill 應**主動修**並說明
- 選了 web font 就要把 OFL / `LICENSE-FONTS` 一併放進去
- rc 期 API 會變，鎖版本，之後 re-run Skill 遷移
