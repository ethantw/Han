# 漢.css v4 — RC 發布計畫（10 天，硬死線 7/31 前）

**目標**：7/30 前在 npm 發出 `4.0.0-rc.1`（dist-tag `rc`），可被真實
專案安裝並運作。7/31 留作緩衝／熱修。

**起點盤點（2026-07-20）**
- 庫（`src/css`＋`src/ts`）：穩。單元覆蓋 100/94/100，src-cleanup 大致
  完成，e2e 覆蓋齊全（`tests/e2e/*.spec.ts`）。
- 🔴 **文檔頁全空**：`manual/src/docs/` 零篇 `.md`（五語系皆空），但
  `docs.spec.ts` 期待 `/manual/`（簡介）、`/manual/install.html`
  等五語系頁——**最大缺口**。
- 🔴 **npm 發布未接通**：`release-please.yml` publish 步驟全註解、無
  `NPM_TOKEN`。
- in-flight 未提交：fly-in／brand logo／jank 修／漢輪廓單一來源
  （10 改＋新 `_shared.html`）。
- 首頁六條審查待辦（`docs/notes/2026-07-18-homepage-review.md`）。
- i18n：en 舊結構、ja/ko 佔位（見各模版 `<script type="text/x-i18n">`）。

## RC 範圍（must-have / defer）

**必須進 RC**
1. 全測試綠（單元＋e2e，至少 Chromium）；in-flight work 已提交。
2. npm 可發：`4.0.0-rc.1`，`rc` dist-tag，tarball 內容正確
   （exports／dist／四模組 CSS＋JS）。
3. **預設語系（hant）真文檔**：簡介、安裝與啓用、四模組用法
   （semantics／lines／prose／fonts）、字體堆疊＋Web 字體、JS 補全。
   足以讓人上手。
4. 首頁可信：六條審查裡「真的迷惑／真 bug」的修掉（①LangDemo 框架＋
   正式文字、③著重號懸空若為庫 bug、④遊樂場書名號）。
5. 跨瀏覽器：gate／逐筆動畫／autospace／懸掛在 Safari＋Firefox 過目。

**Defer 到正式版（RC 後）**
- en/ja/ko 完整文檔翻譯（RC 出 hant 文檔＋en 首頁；其餘標「coming」）。
- 行內表單控件（explorable explanations，`docs/TODO.md`）。
- arLede whereCount build-time token（純美化）。
- 非阻塞的首頁潤飾（②卡片寬度、⑤依賴計數命名、⑥ssP1 停頓）。

## Phase 0 基線（2026-07-20，已完成）
- in-flight work 分四批提交（infra／homepage／docs／回歸修）。工作樹淨。
- 單元：typecheck 淨、庫 185 過、manual 48 過。
- e2e（chromium）：**58 過 / 22 敗 / 2 skip**。22 敗分類：
  - **文檔缺（14）**：docs.spec ×13 ＋ a11y docs intro ×1 → Phase 1
    寫文檔即修。
  - **既有庫 bug（5）**：hanging.spec ×3（h-layer 安裝／絕對定位／視覺
    基線）＋demo.spec ×2 → **Phase 2 查**。⚠️ hanging 是頭牌功能，
    e2e 紅需確認瀏覽器內是否真壞（庫單元測試綠，疑範文/快照或
    browser-only bug；與首頁審查③著重號同族）。
  - **既有 rail-config bug（2）**：home.spec:155（per-group ↺ 預設鈕）
    ＋module-switches:96（模組關閉未清 var）→ Phase 2 修。
  - **既有 a11y（1 測 2 違規）**：`select-name`（critical，rail
    `<select>` 缺無障礙名）＋`valid-lang`（serious）。axe-core 之前
    沒裝故從沒抓到 → **Phase 2/QA 修**（critical 優先）。
- 我這次改動的回歸已修：只延 playground、snippet 早載入、pg-ready。

## 十天排程（7/20–7/30）

### Phase 0 — 落地＋定範圍（7/20–7/21）
- [ ] 提交 in-flight work，按主題分批（fly-in／brand-logo／jank／
      single-source）；`__pycache__` 進 gitignore。
- [ ] 跑**全套**測試建立綠基線：`node --test`＋`tsx` 單元、`pnpm
      test:e2e`（Chromium）。確認 `docs.spec.ts` 實際狀態（預期紅——
      文檔缺）。列出所有紅項。
- [ ] **凍結 RC 範圍**＋定兩個決策（見下「待你拍板」）。
- [ ] 起 `CHANGELOG` 素材：v4 對 v3 的賣點清單。

### Phase 1 — 文檔內容（7/22–7/24）★關鍵路徑 → **7/20 當日完成，超前兩天**
- [x] hant 七篇：簡介／安裝／四模組各一／JS API（變量表照 src 盤點
      agent 的全量清單，未憑印象）。
- [x] `_nav.js` 平攤四模組結構（決策乙）；docs.spec 對齊（LangSwitcher
      下拉化）。13 綠。
- [x] 懸掛對偽元素一節入 lines.md。
- [x] en 簡介＋安裝；ja/hans/ko 簡介 stub。
- [x] 順手修：codegen transpileRuby 改名（舊名照抄即炸，RC 阻塞級）、
      a11y 二違規（select-name critical＋valid-lang）。
- e2e 基線 22 敗 → **7 敗**（docs 14＋a11y 1 全綠）。餘 7 全屬 Phase 2
      既有 bug：hanging×3、demo×2、rail-config×2。

### Phase 2 — 首頁＋庫修正（7/25–7/26）
- [ ] ①LangDemo：`.LangDemo` 對照格線＋語言標籤（繁簡日韓 tags），
      正式範文（從 `manual/demo/*.md` 挑）。
- [ ] ③著重號懸空**查證**：是 `text-emphasis`／JS fallback 定位
      基準的真 bug 還是行高視覺？若庫 bug——修（RC 阻塞）。
- [ ] ④遊樂場書名號：預覽容器設 `--han-cite-title-marks: bracket`
      或改範文。
- [ ] ②⑤⑥ 視 Phase 1/2 餘裕收（非阻塞）。

### Phase 3 — 發布管線＋QA（7/27–7/28）
- [ ] npm 發布接通：release workflow 或手動 `npm publish --tag rc`；
      過 memory `release-npm-ci` 四雷（fetch sources／allow-same-
      version／ignore-scripts／token bypass-2FA）。
- [ ] `npm pack` dry-run，檢查 tarball（`files`／`exports`／`dist`
      齊、無多餘）。
- [ ] 跨瀏覽器 QA：Safari＋Firefox 跑 gate／stroke／autospace／
      hanging／vertical；e2e 全瀏覽器綠。

### Phase 4 — 切 RC（7/29–7/30）
- [ ] 版號 `4.0.0-rc.1`＋`CHANGELOG`。
- [ ] `npm publish --tag rc`（不動 `latest`）。
- [ ] **冒煙測試**：全新專案安裝已發布的 rc，驗 CSS＋JS 載入、CDN
      Web 字體、四模組開關。
- [ ] GitHub pre-release tag。
- [ ] 7/30 緩衝／熱修。

## 風險
- **文檔量最大且未知**——Phase 1 是關鍵路徑，若吃緊，砍 en 文檔（只
  出 hant）保 RC 準時。
- 著重號可能是**真庫 bug**（Phase 2 ③）——若牽動 `semantics.css`／
  fallback，預留修正＋回歸時間。
- 跨瀏覽器可能翻出 gate／動畫的 Safari/Firefox 差異（至今只驗
  Chromium）。
- 發布管線首次接通易踩雷——留 Phase 3 整段。

## 決策（2026-07-20 定）
1. ✅ **RC 文檔語系＝hant 完整＋en 簡介/安裝**，ja/ko RC 後再補。
2. ✅ **RC 手動 `npm publish --tag rc`**，正式版前再自動化 workflow。
3. ✅ **defer 清單認可**，行內表單控件延後到正式版。
4. ✅ **文檔結構＝按 v4 四模組分頁、每頁精煉完整**（≈8 頁：
   getting-started ×2＋四模組 ×4＋字體 ×1＋JS API ×1），頁內以錨點
   分節。與 v3 精神一致（v3 其實是少數幾頁＋側欄錨點，非 ~47 獨立頁），
   只是按 v4 架構重切——v4 砍掉 Sass API（v3 那批 API 錨點消失），
   首頁＋遊樂場已扛下 demo／敘事，故文檔收窄為**參考手冊**。
