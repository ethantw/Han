# 首頁與手冊 CSS 重整計畫

`manual/public/home.css` 已 1234 行，`home/stations.css` 1282 行、`home/controls.css`
587 行、`manual.css` 1229 行——四個檔都破 500 行上限，且註解寫得太細碎（逐條記錄當初的
除錯過程，對未來讀者無用）。本計畫把它們拆成 ziano `demo/src/css/` 那樣的「入口只有
`@import`、每個 partial 一個主題」結構，抽出 `common/` 供兩邊共用，並在 build 時把
`@import` 內聯成 **home 與 manual 各一支** 打包檔。

**已完成**（2026-07-26）。逐步截圖比對，除下列兩處刻意變更外全程零像素差。

執行時發現的偏差，記於此：

- **打包早已存在**——`manual/vite.config.js` 本來就有一個 esbuild 內聯 plugin，
  只是它只處理 `home.css`、且硬寫死刪除 `home/stations.css`（該檔一拆就靜默失效）。
  改為兩個入口都內聯，並依「還有誰用 URL 抓」決定保留哪些 partial。
- **修掉一個潛在 bug**——`html { color-scheme: light dark }` 讓 `<han-rail>` shadow
  裡的 `light-dark()` 回退依「系統」而非「頁面已釘選的主題」解析，docs 暗色下 rail
  的髮絲線是亮的。改成單一 `color-scheme` 翻轉後正確。
- **兩處刻意的視覺變更**：docs 主題鈕改用共用的 `shape()` 實心日／月圖示（原為描邊
  SVG）；docs 語言選單改用共用元件，配色與陰影跟著首頁。順帶發現首頁該選單的
  `box-shadow` 取 `--palette-bg-3q`（亮色下 ＝ 75% 白），亮色模式其實看不見陰影——
  疑似既有 bug，另案處理。
- **`.DemoLangSwitch` 全死**——markup 早就從 `manifesto.html` 移除，只剩 CSS 與一段
  過時註解。已刪；`home/demo-lang.js` 隨之成為 no-op，未動（那是 JS 的事）。
- **e2e 現況未變**：前後皆 56 pass / 23 fail。那 23 條卡在首頁改版已經動過的 markup
  （`main.han` 沒了 class、demo-lang chips 移除、直排 pill 隱藏），spec 還在樹裡改到一半。

---

## 一、現況盤點

| 檔案 | 行數 | 問題 |
|------|------|------|
| `public/home.css` | 1234 | 入口檔卻塞了 tokens／base／五個 chrome 元件／hero／fonts gate |
| `public/home/stations.css` | 1282 | 七個 station ＋ Manifesto ＋ Closing ＋ 全域 em ramp |
| `public/home/controls.css` | 587 | 表單元件 ＋ Preview/CodePane 面板（且被 rail shadow 取用） |
| `public/manual.css` | 1229 | 另一套 token 系統（`--paper`/`--ink`/`--m-*`、`[data-theme]`） |
| `public/home/lead-forme.css` | 444 | 尺寸 OK，不動 |
| `public/brand.css` | 108 | **孤兒**：沒有任何頁面連它，內容是 home.css `.Brand` 的舊複本 |
| `public/components/tokens.css` | 50 | shadow 的 `--_*` 回退層，硬抄一份 palette 字面値 |

跨檔重複與矛盾：

- `.Manifesto` 同時被 `stations.css`（基礎排版）和 `home.css`（hero 改版層）樣式化，
  靠「home.css 排在 `@import` 之後」的層疊順序壓過去——最容易出事的一處。
- `.Brand` 有三份：`home.css`、`brand.css`（孤兒）、`manual.css` 的 `[data-size="md"]`
  局部變體。
- `.LangSwitcher`、主題切換鈕在 home 與 manual 各寫一遍，結構相同、只有 token 名不同。

---

## 二、目標結構

ziano 的形狀：入口只有 `@import`，順序即層疊順序，tokens 先行。

```
manual/public/
  common/                     ← 新增：home 與 manual 共用
    variables.css             色彩 primitives → --palette-* 語義層、字級階、圓角、版面、icon paths
    reset.css                 box-sizing、基底、.sr-only
    brand.css                 .Brand（現有孤兒檔升格為正本，含 lg/md/sm 三變體）
    code.css                  pre/code chrome ＋ Highlight API token 色 ＋ ::selection
    lang-switcher.css         .LangSwitcher
    theme-toggle.css          .ThemeToggle

  home.css                    ← 入口：檔頭註解 ＋ @import 清單（約 40 行）
  home/
    root.css                  body.home 基底、Topbar、VersionTag、WritingSwitch
    rail.css                  body grid 版位、han-rail 擺放、RailToggle
    rail-loader.css           .RailLoading ＋ 三支 keyframes
    gate.css                  fonts gate（含 hero 的 gate 覆寫）
    hero.css                  .Manifesto 完整一份（合併目前分居兩檔的規則）＋ DemoLangSwitch
    station-frame.css         [data-station] 版框、進場 reveal、Prose/Dispatch/lede、Closing
    station-specimen.css      Specimen、Papers、直排、Faces、Legend、HangCompare
    station-craft.css         YourCss、Override、LayerMap、ScopeCompare、Snippet
    playground.css            .Playground
    controls.css              ControlGroup、Toggle、PlaygroundRules、Default、MetricSliders、Field
    preview.css               Preview、CodePane
    lead-forme.css            （不動）

  manual.css                  ← 入口：檔頭註解 ＋ @import 清單（約 30 行）
  manual/
    root.css                  base、body.ManualPage grid、han-rail 擺放、RailToggle
    masthead.css              Masthead、nav toggle
    search.css                SiteSearch
    sidebar.css               Sidebar
    article.css               main／文章排版
    nav-aux.css               Crumbs、Pager、PageToc、Colophon
    not-found.css             404 頁
```

行數預估（全部 ≤500，多數 ≤300）：

```
common/variables.css     ~150   home/root.css            ~160
common/reset.css          ~35   home/rail.css            ~200
common/brand.css         ~130   home/rail-loader.css     ~130
common/code.css           ~60   home/gate.css            ~130
common/lang-switcher.css ~130   home/hero.css            ~300
common/theme-toggle.css   ~55   home/station-frame.css   ~430
                                home/station-specimen.css ~350
manual/root.css          ~120   home/station-craft.css   ~280
manual/masthead.css      ~110   home/playground.css      ~170
manual/search.css        ~180   home/controls.css        ~410
manual/sidebar.css        ~75   home/preview.css         ~170
manual/article.css       ~270
manual/nav-aux.css       ~150
manual/not-found.css      ~55
```

---

## 三、打包：build 時內聯 `@import`

**目標**：`dist/` 只出兩支 CSS，`home.css` 與 `manual.css`，各自把自己的 `common/` ＋
`home/`／`manual/` partial 內聯進去。HTML 的 `<link>` 一行都不用改。

**做法**：`manual/vite.config.js` 加一個小 plugin。`public/` 目前是 Vite 原樣複製，
plugin 在 `closeBundle`（或 `generateBundle`）階段遞迴解析兩支入口的 `@import url(...)`，
把 partial 內容就地展開後寫入 `dist/`，並刪掉 dist 裡多餘的 partial 檔。

- **Dev 不變**：`vite dev` 直接服務 `public/`，瀏覽器原生解 `@import`，改一個 partial
  就即時生效，不需要 build。
- **Prod 兩支**：各自完整、無序列往返。
- `@charset` 只保留展開後的第一行；`@import` 一律集中在入口檔頂層，partial 內不得
  再 `@import`（plugin 只解一層，也讓層疊順序在入口一眼看完）。

**代價**：`common/*`（約 560 行）會同時內聯進兩支，docs 與首頁不共用這段快取。
以兩個獨立入口換零往返，划算；也符合你要的「兩個打包好的文件」。

**例外**：`home/controls.css` 仍需以獨立檔留在 `dist/`——rail shadow 是 fetch 純文字後
`replaceSync`，見第六節。plugin 的刪除清單要放它一馬。

---

## 四、`common/` 與 manual.css 的接法

manual.css 目前跑的是**另一套** token：`--paper`/`--ink`/`--accent` ＋ `--m-*` 別名，
暗色靠 `:root[data-theme='dark']` ＋ `@media (prefers-color-scheme)` 兩條路。home 跑的是
`--color-*` → `--palette-*` 兩層 ＋ `light-dark()` ＋ `:has(input[name='dark-mode'])`。

**色票本來就同一組**（比對過 `#0e0e10`/`#e8e8e3`/`#0a8754`/`#3f9d6f`… 完全相同），
所以統一 token 不會動到任何顏色。步驟：

1. `common/variables.css` 放 primitives ＋ `--palette-*` ＋ 字級階 ＋ 圓角 ＋ 版面 ＋
   icon paths，**不含**暗色觸發規則。
2. manual 既有的 `--paper`/`--ink`/`--m-*` 保留為**指向 `--palette-*` 的薄別名**
   （它本來就是別名層，只是原本指向自己的字面値），舊選擇器一行都不用改。
3. **暗色機制統一成 checkbox `:has()` recipe**（web-style.md 的專案標準）。這是本次
   唯一需要動 manual 行為的地方：`manual.js` 的主題按鈕改成 `<label>` ＋
   `<input type="checkbox" name="dark-mode">`，`_layout.html` 補 pre-paint inline script
   （home 已有現成的可抄）。統一後 `common/theme-toggle.css` 才是真的共用，
   `[data-theme]` 那兩套分支規則一併消失。localStorage key 兩邊本來就同為 `'theme'`。

`components/tokens.css` 維持硬抄字面値（constructed stylesheet 不能 `@import`），
但把檔頭註解的「keep in sync with home.css」改指 `common/variables.css`。

---

## 五、刪除與清理清單

已用 grep 確認全站零引用或已死：

- `--r-4`、`--palette-bg-1q`、`--fs-display`（hero 早就改用 local clamp，token 沒人讀）
- `home.css:967` 註解掉的 `/* & { font-size: var(--fs-body); } */`
- `home.css:318–322` 那段「`.Toggle` 搬去 controls.css 了」的搬家備忘
- `public/brand.css` 孤兒檔 → 升格成 `common/brand.css` 正本，刪掉 home.css 內的複本，
  並把 manual.css 的 `[data-size="md"]` 併為第三個尺寸變體
- `.Manifesto` 兩處規則合併後，靠層疊順序才生效的那層 hero 覆寫直接寫成一份
- manual.css 的 `[data-theme='dark']` 覆寫區塊（第四節統一後不再需要）

**`.WritingSwitch` 保留但隱藏**（依裁示）：元件與 `writing-switch.js` 都留著，
但目前那組 `display: flex; display: none;` 是誤覆蓋、看不出是刻意的。改寫成單一
`display: none` ＋ 一行註解說明「暫時隱藏，直排切換目前由 rail 的 度量 群組提供；
要復活改回 `flex` 即可」。JS 照舊跑（它只綁 radio，不建 DOM，無副作用）。

---

## 六、限制與風險

1. **rail shadow 不能吃 `@import`。** `components/han-rail.js` 是 fetch 純文字後
   `sheet.replaceSync(css)`，constructed stylesheet 會丟掉 `@import`。已確認
   `.Preview`／`.CodePane` 只出現在 light DOM 的 station 樣板裡，所以把它們拆進
   `home/preview.css` 反而**縮小**了 shadow 吃進去的量——han-rail.js 的三檔清單
   （tokens / controls / rail）不必改。代價是 `home/controls.css` 必須以獨立檔存在於
   `dist/`（見第三節例外）。
2. **層疊順序是行為的一部分。** 目前 hero 覆寫贏過 stations.css 靠的是
   「home.css 排在 `@import` 之後」。合併成單一 `hero.css` 後這個依賴消失，但
   `station-frame.css` 與 `hero.css` 的先後仍需固定——入口 `@import` 順序即契約，
   會在檔頭註明。
3. **`.Manifesto` 合併** 與 **manual 暗色機制切換** 是兩個有實質行為風險的步驟，
   各自獨立 commit，好回退。

---

## 七、註解方針

現況問題是「寫成了 commit message」——記錄當初怎麼試錯、量到幾 fps、哪個 bug 是怎麼
發現的。搬移時一律照下列規則重寫：

- **保留**：非顯而易見的取捨與度量常數。`.BrandGlyph` 的兩套字體度量換算、
  `minmax(0, 1fr)` 為什麼不能寫 `1fr`、`vector-effect` 為什麼不用、
  `--brand-line-ascent` 的出處——這些沒寫下來就會被人「順手優化」掉。
- **壓縮**：每檔頂端一段檔頭註解交代「這檔管什麼、DOM 長怎樣、誰驅動它」，
  取代目前散在各處的逐條旁白。
- **刪除**：改版沿革（「v1 的 bug 是…」）、量測數字流水帳、搬家備忘、
  重述程式碼在做什麼的句子。
- **維持**：baseline 日期註記（`light-dark()` — Baseline 2024 之類），這是專案規約。

---

## 八、執行順序

每步一個 commit，每步結束用 Playwright 截圖比對（亮／暗、窄／寬、
`prefers-reduced-motion` 開關）確認零像素差。

1. 抽 `common/variables.css` ＋ `common/reset.css`，home.css 改為 `@import` 之——
   純搬移，最容易驗證。
2. 抽 `common/brand.css`（孤兒檔升格）、`common/code.css`、`common/lang-switcher.css`。
3. home.css 剩下的切成 `home/root.css`、`rail.css`、`rail-loader.css`、`gate.css`。
   此時 home.css 只剩 `@import` 清單。
4. 合併 `.Manifesto` 兩處規則 → `home/hero.css`（風險步，單獨 commit）。
5. 切 `stations.css` → frame / specimen / craft / playground 四檔。
6. 切 `controls.css` → controls / preview。
7. **Vite plugin：內聯 `@import`**，dist 出單一 `home.css`。此時首頁部分完工。
8. manual 暗色機制改 checkbox recipe（風險步，單獨 commit），抽
   `common/theme-toggle.css`。
9. manual.css 接上 `common/`，切成 `manual/*` 七檔，plugin 一併處理其入口。
10. 死碼與註解清理（第五、七節），逐檔過一遍。

---

## 九、驗收

- [ ] `find manual/public -name '*.css' | xargs wc -l` 全數 ≤500
- [ ] `dist/` 只有 `home.css` 與 `manual.css` 兩支頁面 CSS（外加 shadow 專用的
      `home/controls.css`、`components/*.css`）
- [ ] 首頁亮／暗 × 窄／寬 × reduced-motion 截圖與重整前一致
- [ ] docs 頁同上比對一輪，主題切換（含重整理後記憶）行為不變
- [ ] rail shadow 內的控制項樣式完好（`/test/rail-fixture.html`）
