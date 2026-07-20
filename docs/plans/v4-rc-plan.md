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

## 十天排程（7/20–7/30）

### Phase 0 — 落地＋定範圍（7/20–7/21）
- [ ] 提交 in-flight work，按主題分批（fly-in／brand-logo／jank／
      single-source）；`__pycache__` 進 gitignore。
- [ ] 跑**全套**測試建立綠基線：`node --test`＋`tsx` 單元、`pnpm
      test:e2e`（Chromium）。確認 `docs.spec.ts` 實際狀態（預期紅——
      文檔缺）。列出所有紅項。
- [ ] **凍結 RC 範圍**＋定兩個決策（見下「待你拍板」）。
- [ ] 起 `CHANGELOG` 素材：v4 對 v3 的賣點清單。

### Phase 1 — 文檔內容（7/22–7/24）★關鍵路徑
- [ ] hant 文檔：簡介（`index.md`）、安裝與啓用（`install.md`）、
      四模組各一頁、字體堆疊／Web 字體、JS 補全（installFallbacks／
      transpileRuby）。`manual/demo/*.md` 已有現成範例可借。
- [ ] `_nav.js` 側欄／頁序接好；`docs.spec.ts` 依實際範圍對齊
      （若 RC 只出 hant＋en，調整 spec 的語系清單）。
- [ ] 懸掛標點對偽元素影響一節（`docs/TODO.md` 已備好講稿）。
- [ ] en 文檔（至少簡介＋安裝，供國際採用）。

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

## 待你拍板（Phase 0 前先定）
1. **RC 文檔語系**：只 hant？hant＋en？還是硬上五語系（量大、恐拖死
   線）？我建議 **hant 完整＋en 簡介/安裝**，ja/ko 標 coming。
2. **npm 發布方式**：接通自動 workflow（一勞永逸但首設較久），或本次
   RC 先手動 `npm publish --tag rc`（快、可控）？我建議 **RC 手動、
   正式版前再自動化**。
3. **範圍確認**：上面「defer」清單你認不認？特別是行內表單控件確定
   延後？
