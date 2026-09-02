# TODO

依 2026-07-31 全 repo 審查刷新。分四段：RC 前、RC 後、明示延後、
長期。舊項若已被新設計取代，記在「已了結」。

## RC 前（阻塞）

- [x] **修正標點擠壓 fallback 與 SSR/native 接縫。** 2026-08-30 完工：
  half-em filler 改用校準 face；JS 以明確 pair table 寫
  `data-squeeze-next`；SSR 的 `》，`／`？，` 同時攜帶 native atomic-seam 與
  fallback marker；native/fallback CSS capability 分流；`<q>`／`<cite>`
  `::before`／`::after` 的 DOM→pseudo、pseudo→DOM、pseudo→pseudo 接縫及
  on/off 負例均補齊。共用 demo／Node SSR／E2E 量測頁含 19 組案例；Chromium、
  Playwright WebKit 與實機 Safari 26.5 橫排全綠，兩個 fallback 引擎直排亦全綠。
  詳見
  [`docs/plans/punctuation-squeeze-fallback-and-ssr.md`](plans/punctuation-squeeze-fallback-and-ssr.md)。
- [x] **首頁 E2E 回歸歸零。** 2026-08-30 依新版 DOM 與互動契約重驗；
  全套 148 項為 147 通過、1 項預期略過（WebKit 專用 probe）。舊清單中的
  水印站數、鉛字盤、群組重設、fallback 與 demo 計數漂移均已在重構期間
  修正或由新版測試取代；全頁直排入口仍按原決議留在 Phase 2，不以一條
  永紅測試假裝當前已有該功能。本輪另補 320／390／768／1440px 的 header、
  TOC、hero、dialog、rail 幾何回歸。
- [ ] **console.html ja/ko 約 70 個 i18n key 補譯**（pgGrp*/pgEm*/
  pgPunct*/pgTog* 全滅）＋零星：`_home.html` consoleCollapse（ja/ko）、
  station-craft arEyebrow（ja）、station-prose prEyebrow（ja）、
  station-lines slHangOffSample／breathingLinesSample（en）。
- [ ] **首頁六條審查（2026-07-18）對新版重驗。** ①LangDemo 已被
  .Papers 四報設計解決；②站叄懸掛卡已重做。餘：③著重號懸空查證、
  ④遊樂場書名號承諾、⑤LayerMap「運行時依賴1」點名（hyperly）、
  ⑥ssP1「緊要強調之處一如本句」garden path（原定稿的破折號被拿掉）。
- [ ] **diantenjeom 發版後，標點值 `KV` → `KLR` 收尾。** 標點公約已與文種
  解耦（`docs/plans/punctuation-conventions-cross-locale.md`，2026-07-31
  完工），過渡期採方案 (b)：`src/css/fonts.css` 的 KV 區塊 font stack 同時列
  `'Diantenjeom … KLR'` 與 `'… KV'`，跨過上游改名與發版之間的空窗（實測：
  KLR 今天不存在、stack 走到 KV；發版後自動改吃 KLR，han.css 不必動）。
  上游一發版就做三件事：拆掉 stack 裡的 `… KV`；值 `KV` → `KLR`（
  `@property` syntax、initial-value、console 四顆 select、codegen DEFAULTS、
  `src/docs/fonts.md`、首頁四語樣張、codegen.test）；CHANGELOG 記一筆破壞性
  改名（`--han-punctuation-vertical-ko` → `--han-punctuation-ko` 也一併記）。
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
- [x] **Zhuyin `<rt>` baseline anchor。** 2026-08-31 完工：空、零尺寸
  pseudo-element ＋ CSS Anchor Positioning 取得基文 baseline，再下降至合成的
  `ideographic-ink-under`；不注入 U+2060，故 ruby formatting context 與標點避頭尾
  均保持正常。空 marker 不依賴特定字體的 U+0020 strut；anchor 只標示瀏覽器
  所給的 inline baseline。
- [ ] **自訂字體的注音 ruby 光學校正。** CSS 預設以尚古／Hiragino／蘋方及
  Diantenjeom 的漢字下緣收斂。顯式校正 API、開發期 CSS codegen、固定 outline
  fixtures、Chromium Anchor fallback 與 Playwright WebKit native 雙向位移回歸已
  完成；工具會等待／主動載入字型、按完整條件分組快取，並可清除還原，不會在
  讀者端自動執行。Safari native inter-character 以 `rt` 空 pseudo 的 logical
  spacer 對應同一變量；直排行間注不套用。尚餘 macOS／iOS 實機 Safari，以及
  尚古／Hiragino／蘋方／Diantenjeom／低 ink-under 字體的人工光學驗收。完整設計與
  實作清單見
  [`docs/notes/2026-08-31-zhuyin-ruby-optical-calibration.md`](notes/2026-08-31-zhuyin-ruby-optical-calibration.md)。
- **CSS Inline `text-box-edge: ideographic-ink` 跟進。** 現行字間注的
  `.075em` 是以尚古／Hiragino／蘋方的實測 ink under 收斂出的合成 ink seat；CSS Inline 3 若落地並由主流引擎
  實作，可評估以字體級 ideographic-ink under baseline 取代此常數。規格目前仍是
  early draft，不可出貨依賴；即使可用，也只會是 font-level reference，無法取得
  宋體-繁等每一個 glyph 的真實 outline ink-under，故仍需保留
  `--han-ruby-zhuyin-baseline-shift` 的光學補償與跨字體回歸樣本。
- **注音字體的「ㄧ」直排 pair spacing。** 2026-08-30 在
  `manual/demo/ruby-zhuyin-config.html` 的字間注幾何工作台定位：全域
  `--han-ruby-zhuyin-letter-spacing: 0` 時，含介音「ㄧ」的
  `ㄧㄢ`／`ㄐㄧㄡ`／`ㄑㄩㄝ` 等組合因「ㄧ」墨跡薄、vertical advance
  仍完整而顯得鬆；收緊 letter-spacing 後這些組合正常，其他 pair 卻過擠。
  這不是 ruby box／baseline 幾何問題，不能再用全域 CSS tracking 補。
  後續應在注音字體試作 OpenType GPOS `vkrn`（針對「ㄧ」前後 pair
  分配負位移），並比較直接縮短「ㄧ」的 `vmtx` vertical advance／重分上下
  side bearing；用工作台的 12／目前／60px，以及一、二、三符號與輕聲樣本
  做回歸，確認單獨「一／ㄧ」不被拉偏後再定案。
- [x] **固定並驗證 `lang` 字體邊界契約。** 保留零 specificity 的全域 `[lang]`
  default reset：顯式 zh／ja／ko boundary 必須用自己的 locale slots 重組正文字體。
  需要 alternative／accent／作者 stack 時，作者在帶 `lang` 的同一元素重申；若是
  真正的 nested inline language run，component selector 也要命中該 boundary。
  已否決移除 reset 與新增 `--han-font` API；demo 改成每個翻譯各自帶 `lang` 的
  semantic heading。漢語地方語種依 han.css 約定使用合法的
  `zh-<extlang>-<script>[-region]`，閩南語為 `zh-nan-Hant-TW`，而非非法的
  `zh-min-nan-Hant`。full／basic、
  default／alternative／accent／custom、nested 與 bare-body regressions 已補；
  Chromium／WebKit 的 production stack 正確，Firefox 仍有既知 `HanNone` slots
  degradation，歸入 fonts architecture 的跨引擎 fallback 後續。
  [完整調查](notes/2026-09-01-lang-boundary-font-role.md)。
- **`TODO(css-if)` 三處**（semantics/fonts/lines）——Chrome 152 已支援
  `if(style(--custom-property: …))`，仍未執行 `style(font-family: …)` 等標準
  property condition；`CSS.supports()` 只驗 parse，不能當此能力的 gate。
  既有三處 custom-property mode mapping 等 2/3 引擎後可遷移；`fonts.if.css`
  只保留研究樣本。字體角色不新增 dispatcher API；標準屬性 style query 即使
  可比較祖先 computed stack，也無法從相等 values 恢復 declaration provenance。
- **原生 `hanging-punctuation` 佈線**——Safari 雖宣稱支援，目前實作實際
  不可用。下一版 Safari 出貨後重新實測；只有實際效果通過 han.css 的懸掛
  contract，且至少 2/3 引擎可用，auto path 才從 JS yield 給原生實作。
- **偽斜體的中／德對照沒地方看了**（2026-08-28）。站①的信封降成浮水印
  之後，德文寄件人那一塊只剩紋理的濃度，不再是讀得出來的樣張——而
  「同一條規則、相反結果」（`:lang(zh|ja|ko)` 取消偽斜體、德文照舊斜著）
  是全站唯一的一份跨語對照。詩本身與標記原理圖只覆蓋中文那一半
  （`<i>`／`<var>`）。要補就補在文件頁：那裡給得起標題、並置與一句
  「請比較這兩塊」，而一個要維持幻覺的道具給不起。搬過去時別再用
  `<address>`——規範上那是「本文件的聯絡資訊」，不是郵政地址；`<cite>`
  或 `<i>` 的示範力道完全一樣而且合規。

## 已了結（供查）

- ~~兩個 LangDemo figure 的正式 demo 文字~~ → 2026-07 首頁重設計以
  `.Papers` 四報（太陽中文報 KOI-8 故事四語版）取代，含 demo 正文、
  分語 dateline、per-lang ruby。`.LangDemo` 構想廢棄。
- ~~docs.spec 13 紅（文檔空）~~ → hant 7 篇＋en 2 篇已上，docs.spec
  全綠。
- ~~a11y select-name／valid-lang~~ → 已修，a11y spec 綠。
