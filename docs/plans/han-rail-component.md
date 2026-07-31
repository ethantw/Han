# `<han-rail>` — playground 工具欄 web component 化

> Scope 決策（owner 拍板）：現階段 **a) manual 站內複用**（首頁、docs 頁都能掛），
> 但架構為未來 **b) 隨 han.css 對外發布、甚至瀏覽器插件**留路 —— 故用 Shadow DOM
> 封裝、事件合約公開化。元件顆粒度採「**a 的實作、c 的合約**」：只做 `<han-rail>`，
> 但 config 變更透過公開 event 廣播，引用碼面板（未來的 `<han-snippet>`）以訂閱者
> 身分接上，日後元件化零改動。

## 元件 API（公開合約，b 相容性的邊界）

```html
<han-rail lang="hant" target="main.han"></han-rail>
```

| 面 | 內容 |
|---|---|
| 標籤 | `<han-rail>` |
| `lang` attr | `hant`｜`hans`｜`en`｜`ja`｜`ko`。預設繼承 `closest('[lang]')`（含自身），最後退 `document.documentElement.lang`，再退 `hant`。runtime 可改（observedAttributes → 重渲染 shadow 內文案，config 狀態保留）。 |
| `target` attr | CSS selector，config 產生的 `--han-*` 變數與 metrics inline style 寫到的元素。預設 `main.han`。找不到時元件照常渲染、僅不套用（console.warn 一次）。 |
| `form` attr | `side`｜`top`（預設 `side`）。只影響 shadow 內版面骨架；頁面層的 grid 佈局仍由掛載頁自己的 CSS 對 `han-rail` 元素負責。窄幅（<52rem）自動轉 bottom-sheet，與現行為同。 |
| Event | `han-config-change` — `bubbles: true, composed: true`，`detail: { config, vars, source }`。`config` 為完整 config 物件的**淺凍結副本**（`Object.freeze({ ...config, punct: { ...punct }, metrics: { ...metrics } })`，`punct`／`metrics` 一併深拷），`vars` 為 `cssVars(config)` 的 `[name, value][]`，`source` 為觸發的 `data-cfg-key`（reset 時為 `'reset'`，度量 slider 拖動時為 `'metrics'`）。連接後即發一次初始 event（`source: 'init'`），訂閱者不必自己撈初態。 |
| 方法 | `reset()`（回預設並廣播）；`reapplyFallbacks()`（demo-lang 換內文語言後重跑 JS 補全，接手現在 `initConfigurator()` 回傳的 handle）。 |
| 屬性 | `config` getter（同上的凍結副本）。 |

**合約穩定性**：`detail.config` 的 key 集合 = `codegen.js` 的 `DEFAULTS`。未來
`<han-snippet>`、npm 版、瀏覽器插件都吃這一個 event —— 這是唯一跨邊界介面，改它
要過 owner。

## 內部架構

```
manual/public/components/
  han-rail.js        ← custom element：thin class shell（平台強制），
  │                     其餘全是既有 FP 模組風格
  rail-config.js     ← 現 configurator.js 的「控件→config→vars 套用」核心
  │                     （intents/apply、configRef、ALL_VARS、visibility 切換、
  │                      ensureFont、fallbacks 開關），DOM 查詢改收 shadowRoot
  rail-metrics.js    ← 自 home/ 搬入（字級/行距/字重 sliders）。除了對 target
  │                     寫 inline style 預覽，值也透過 onChange 進 config.metrics
  │                     → codegen 只在偏差時生一條 `body { }` 規則（source:'metrics'）
  rail.css           ← 自 home/ 搬入；`.Rail` 根選擇器改 `:host`
  tokens.css         ← :host 層 token 預設值（見「Token 邊界」）
manual/public/home/
  rail-templates.js  ← **build 生成**（見「模板管線」），export TEMPLATES[locale]
  snippet.js         ← 新：頁面側引用碼面板。訂閱 han-config-change，
  │                     用 codegen.js + highlight.js 渲染 panes、管 ViewTabs
  │                     與 pm select —— 即未來 <han-snippet> 的內容物
  codegen.js         ← 不動（純函數，27 unit tests 原樣）
  highlight.js       ← 不動
  configurator.js    ← 刪除（拆進 rail-config.js + snippet.js）
```

- **ts-style 例外聲明**：custom element 依平台規定必須是 `class extends
  HTMLElement`。class 只做 imperative shell（attachShadow、attributeChangedCallback、
  轉呼叫），所有邏輯在純函數模組。這是 no-classes 規則的平台豁免，殼要薄。
- **Shadow DOM**：`attachShadow({ mode: 'open' })`。樣式經 `fetch` +
  `CSSStyleSheet.replaceSync` + `adoptedStyleSheets` 載入（raw ESM 環境無 CSS
  module import 的跨瀏覽器支援；URL 以 `import.meta.url` 解析）。三張 sheet：
  `tokens.css`、`controls.css`（與頁面共用，見下）、`rail.css`。
- **FOUC 防護**：sheets 就緒前不 render 模板（async connectedCallback 先備齊再
  掛 DOM）；掛載頁加一條 `han-rail:not(:defined) { visibility: hidden }` 佔位。
- **controls.css 雙棲**：`figure.CodePane` 等樣式也被站④（光 DOM）使用，故
  controls.css **留在 `home/`、頁面照 link**，元件另 fetch 同一 URL adopt 進
  shadow（HTTP cache 命中，成本一次）。日後 `<han-snippet>` 落地時再拆分。

## Token 邊界（docs 頁沒有 home.css 也要能看）

Custom properties 會穿透 shadow 邊界繼承，首頁上 `--palette-*`／`--fs-*` 自然
可用。但 docs 頁（manual.css，token 體系不同）沒有這些變數。`tokens.css` 建立
**內部間接層**：

```css
:host {
  --_text: var(--palette-text, light-dark(#0e0e10, #e8e8e3));
  --_rule: var(--palette-rule, light-dark(#ececea, #2a2a2c));
  /* …每個被 rail.css/controls.css 消費的 token 一條，字面預設值＝
     home.css 清爽風色值（來源註解互鏈，改色兩邊同步）… */
}
```

shadow 內樣式一律消費 `--_*`。掛在首頁 → 外層 token 贏；掛在裸頁 → 字面預設值
兜底。**不可**在 `:host` 直接宣告 `--palette-*`（會蓋掉外層繼承）。

## 模板管線（單一事實來源不變）

`manual/home/rail.html` 與 `_data.js` 的 HOME_I18N 仍是唯一來源。vite.config.js
新增一段：用**現有的 `applySubs` 機制**把 rail.html 對五個 locale 各展開一次，
生成 ESM 模組 `home/rail-templates.js`：

```js
export const TEMPLATES = { hant: '…', hans: '…', en: '…', ja: '…', ko: '…' }
```

- build：emit 進 dist（與 `{{ railSection }}` 同一條渲染路徑，不可能 drift）。
- dev：以 middleware 動態回應同一 URL（跟現有頁面渲染同步重載）。
- `_home.html` 的 `{{ railSection }}` token 與 aside 容器改為
  `<han-rail lang="{{ locale }}" target="main.han"></han-rail>`；
  vite.config 中 HOME_RAIL 的 inline 展開改接模板模組生成。
- 未來 b：npm 打包時這個生成模組直接進 bundle，管線即發布種子。

## 首頁遷移

- `home.js` 開機序改為：`initLangSwitcher` → `initTheme` →（`<han-rail>` 自立，
  無需 init）→ `initDemoLang($rail.reapplyFallbacks 包裝)` → `initSnippet()`（新，
  訂閱 event）→ `initRailChooser`（改為寫 `form` attr）→ `initInstallChips`。
- `home.css`／`rail.css` 中頁面佈局層對 `.Rail` 的規則（grid 欄位、sticky、
  sheet 定位）改以 `han-rail` 元素選擇器承接；rail 內部樣式全數進 shadow。
- demo-lang chips、Chooser、主題切換、LangSwitcher 都是頁面 chrome，不入元件。

## 驗收

1. `pnpm --filter han-manual build`：五語系零 `{{ }}` 殘留。
2. codegen 27 unit 原樣全過（codegen.js 未動）。
3. 既有 e2e 26 條全綠 —— Playwright selector 自動穿透 shadow DOM，僅允許
   結構性選擇器微調，斷言語意不變。
4. 新 e2e（+2）：`tests/e2e/rail-component.spec.ts` ——
   a. 裸測頁（fixture，無 home.css）掛 `<han-rail>`：渲染完整、token 兜底生效、
      改控件對 target 寫入變數；
   b. 首頁上 `han-config-change` event 合約：detail 形狀、初始 event、
      `source` 正確。
5. 瀏覽器截圖：首頁視覺與元件化前一致（這次**是**「不許變」的重構）。
6. docs 站（manual.css/manual.js）不動。

## 風險與對策

- **Playwright 穿透**：CSS selector 引擎預設穿 shadow ✓；但 `:has()`／組合器跨
  邊界的個別斷言若失效，改用 locator 鏈（`page.locator('han-rail').locator(…)`）。
- **:root:has(dark-mode) 主題**：作用在 light DOM 的 `color-scheme` 會繼承進
  shadow，`light-dark()` 在 shadow 內照常翻轉 ✓（無需搬機制）。
- **`@property` 註冊**：han.css 的 enum 註冊在 document 層，元件寫的是 target
  （光 DOM）的 inline 變數，不受 shadow 影響 ✓。
- **未來 b 的已知欠帳**（記錄不做）：i18n 字典外掛機制、CSS 內聯打包、
  `target` 改 ElementInternals／property 傳參、npm entry。
