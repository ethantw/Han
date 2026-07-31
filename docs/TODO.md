# TODO

依 2026-07-31 全 repo 審查刷新。分四段：RC 前、RC 後、明示延後、
長期。舊項若已被新設計取代，記在「已了結」。

## RC 前（阻塞）

- [ ] **e2e 11 敗歸零（首頁部分）。** ⏸ 用戶指示暫緩首頁 e2e 修正。
  分類備查：
  - 首頁重設計後測試漂移（4）：`homepage-v2.spec:24`（水印站數期待
    6、實際 4）、`lead-forme-swap` ×2（橫排 moved=0，疑字面填滿改掉
    letter-spacing 後判定失效）、`lead-forme-pocket`。逐一 triage
    「測試過時 vs 真回歸」。
  - markup 未接（2）：`home.spec:209` demo-lang chips、`:232`
    writing switch——JS 都在、`_home.html` 無控件 markup。writing
    switch 那條**已明示延後到 Phase 2**（見下），紅著是預期的。
  - 既有 C 類（3）：`home:155` per-group ↺、`home:266` h-iss、
    `demo:24` zh-Hans off-cell 懸掛未關。
  - `demo:11` cell 計數過時——併入 demo re-sync 一起修。
- [ ] **console.html ja/ko 約 70 個 i18n key 補譯**（pgGrp*/pgEm*/
  pgPunct*/pgTog* 全滅）＋零星：`_home.html` consoleCollapse（ja/ko）、
  station-craft arEyebrow（ja）、station-prose prEyebrow（ja）、
  station-lines slHangOffSample／breathingLinesSample（en）。
- [ ] **首頁六條審查（2026-07-18）對新版重驗。** ①LangDemo 已被
  .Papers 四報設計解決；②站叄懸掛卡已重做。餘：③著重號懸空查證、
  ④遊樂場書名號承諾、⑤LayerMap「運行時依賴1」點名（hyperly）、
  ⑥ssP1「緊要強調之處一如本句」garden path（原定稿的破折號被拿掉）。
- [ ] **repo URL 三處對齊。** package.json（ethantw/Han）、首頁
  footer（hanzipro/han.css）、git remote css（hanzipro/css）——定
  一個 canonical，RC tarball 別把錯的發出去。
- [ ] **跨瀏覽器 QA。** ⏸ 暫緩（用戶指示）。Safari＋Firefox 過
  gate／stroke／autospace／hanging／vertical。
- [ ] **npm publish --tag rc → 冒煙 → pre-release tag。** ⏸ 暫緩
  （用戶指示）。npm pack 已驗過：60 檔、exports 齊。

## RC 後（正式版前）

- [ ] **manual/demo/*.md 一次性 re-sync。** src API 已穩。死 API：
  `curated-biaodian.md` 的 `han-use-curated-fonts` container、
  `sectional.md` 的 `han-revert-prose`＋`revert-layer`（現行機制是
  `--han-prose: off` style query）、`hanging.md` 的啓用條件敘述。
  `demo.css` 同步；`demo.spec` 計數順勢更正。
- [ ] **public/ dev 雜物出貨排除。** `test/console-fixture.html`
  （e2e fixture，留意 console-component.spec 引用）、
  `brand-lockup.html`、`brand-lockup-options.html`。
- [ ] **尺寸文案 Brotli-first。** LayerMap 帳本 `arLedgerGzip` 改
  br 主、gzip 副（memory `decision-brotli-first-size-claims`）；
  vite `computeModuleLedger` 補 brotli 計算。⚠️ 站要放支援 Brotli
  的 CDN，廣告數字才對得上。
- [ ] **dist sourcemap 瘦身。** 8 個 JS map 各 ~366KB（內嵌
  sourcesContent）→ tarball 948KB／解壓 4MB。去 sourcesContent
  或不 ship map。
- [ ] **release-please 接通。** workflow 只 watch `main` 但預設分支
  是 `master` → 永不觸發；manifest 4.0.0 vs pkg 4.0.0-rc.1 對齊；
  `NPM_TOKEN` repo secret 要由 owner 加。CI 的
  `branches: [main, '**']` 順手清。
- [ ] **README「Migration from v3」一節（四語）。** 列 v4 砍掉的每個
  v3 JS 函數與其 CSS／字體技術等價物；來源：CHANGELOG →
  4.0.0-rc.1 → Removed。

## 明示延後（2026-07-31 用戶指示）

- [ ] **全頁直排預覽 → Phase 2。** 那顆浮動直排 pill
  （`[data-writing-switch]`）的 markup 在某次重構中遺失，
  `writing-switch.js` 每次都在第 14 行 return，`home.spec:232` 因此
  恆紅——RC 前不補，Phase 2 再決定它回到哪裡（頁面 chrome 的浮動
  pill？還是併進 console？）。

  補的時候可以直接接手的三件事（2026-07-31 已查證）：
  - **塌陷的根因已修**（`83b1bf1`）：`main { container-type:
    inline-size }` 的 inline 軸隨行向轉，vertical-rl 下收掉的是
    main 的**高度**——實測翻直排後 main 高 1px、站台每個子元素高 0，
    整頁空白。已加 `main[data-writing="vertical"] { container-type:
    normal }`，代價是本頁的容器查詢（56rem／72rem／62rem）在直排預覽
    下退回窄版分支。目前沒有入口能觸發這條規則。
  - **捲動起點**：直排下 `main` 自己是橫向捲動容器（實測 765px 視窗
    裝 51888px 內容），而 vertical-rl 的起點在最右——翻過去
    scrollLeft 仍是 0 等於跳到全文尾端，一片空白。翻完要把當下這一站
    `scrollIntoView({ inline: 'start' })` 捲回來。
  - **開關自己的落點**：在流的位置會被擠到版心上緣、只露出二十來像素
    （下半被 header 那 64px 壓住），而它是唯一的回頭路——直排下得抬成
    浮動（fixed），且控件本身要鎖 `writing-mode: horizontal-tb`：翻轉
    的是版面，不是回頭路。
  站②尾巴那兩顆（`.SpecimenSwitch`）**不是**這一項——它們只翻四語樣張，
  純 CSS、已上線（`89bf41f`）。

- [ ] **RWD 精修。** 首頁概念已定，斷點細調延後。
- [ ] **hans／ja／ko 文檔。** 現為 9 行 stub；RC 出 hant 全量＋en
  簡介/安裝，其餘標 coming。

## 長期／機會項

- **arLede 的「百零九」改為 build-time 計算 token。** 現為硬編碼，會
  隨庫演進漂移。LayerMap 的 `{{ sizeSemantics }}`（vite
  `computeModuleLedger`）已有同款機制——加 `whereCount` token
  （`dist/han.css` 去註解後數 `:where`），再加阿拉伯數字→中文數字
  （百零九式）轉換。五語系數字寫法各自處理（en 用阿拉伯數字）。
- **站內行內表單控件，與工具欄面板雙向同步。** 2026-07-17 定案方向：
  文案句子裡直接嵌控件（explorable explanations），首例 prNote。
  設計要點：行內控件只是面板 state 的第二個視圖（發同樣 intent，
  走現有 intents→state→apply，值相同不回寫防迴圈）；i18n 槽位標記
  放譯文字串裡；`aria-labelledby` 指回句子；**每站至多一個**；
  Marginalia 窄螢幕隱藏時面板仍在，天然 progressive enhancement。
  `_data.js` 現放無控件也通順的過渡版文案。
- **標點懸掛（`<h-layer>` 絕對定位）對偽元素的影響，寫進 manual
  doc。** CSS 層說明已在 `src/css/lines.with-js.css` 註解；文件動工
  時一併講：`::first-line` 理論＋實際都受影響（`.Manifesto
  h1::first-line` 是唯一現存規則）；`::first-letter` 理論受影響但
  hangable 只落在收尾標點、結構上不可能是段首字，實際永不相撞（文件
  可直說「不受影響」＋順帶原因）；`::selection`、`::highlight()`、
  DOM 結構型選擇器皆不受影響（查的是渲染樹之外的東西）。
- **Zhuyin `<rt>` 定位 workaround**（semantics.css 的 `[TODO]`
  transform translate）——等 containing-block 方案，非 bug。
- **`TODO(css-if)` 三處**（semantics/fonts/lines）——`if()` 落地後
  的遷移註記，跟引擎走。
- **原生 `hanging-punctuation` 佈線**——等 2/3 引擎出貨。

## 已了結（供查）

- ~~兩個 LangDemo figure 的正式 demo 文字~~ → 2026-07 首頁重設計以
  `.Papers` 四報（太陽中文報 KOI-8 故事四語版）取代，含 demo 正文、
  分語 dateline、per-lang ruby。`.LangDemo` 構想廢棄。
- ~~docs.spec 13 紅（文檔空）~~ → hant 7 篇＋en 2 篇已上，docs.spec
  全綠。
- ~~a11y select-name／valid-lang~~ → 已修，a11y spec 綠。
