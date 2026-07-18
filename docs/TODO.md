# TODO

- **arLede 的「百零九」改為 build-time 計算 token。** 現為硬編碼，會隨
  庫演進漂移（每次改 src 都可能變）。LayerMap 的 `{{ sizeSemantics }}`
  （vite `computeModuleLedger`）已有同款機制——加一個 `whereCount`
  token（`dist/han.css` 去註解後數 `:where`），再加阿拉伯數字→中文
  數字（百零九式）的轉換。五語系的數字寫法要各自處理（en 用阿拉伯
  數字即可）。

- **兩個 LangDemo figure 的正式 demo 文字。** 站①（語意：著重號／書名號
  ／專名號／注音 furigana）與站②（標點：各語言標點規範實況）都已改為
  `<figure class="LangDemo">` 四篇 `<article lang="zh-Hant/zh-Hans/ja/ko">`
  結構，現為 placeholder 文字。正式內容從 demo 範文庫（`manual/demo/*.md`）
  挑選；`.LangDemo` 的樣式也還沒做。（stPunctExamples／ssP2／ssP3／
  ssJaLead／ssJaQuote／slP3 六個 key 已因此撤除。）

- **站內行內表單控件，與工具欄面板雙向同步。** 2026-07-17 定案方向：
  文案句子裡直接嵌控件（explorable explanations 路數），首例是 prNote：
  「作用域預設在article元素，--han-prose: on/off，在任何選擇器
  `〔input：填選擇器〕`開關`〔checkbox：toggle〕`整個模塊。」
  之後其他 station 也逐步加入。設計要點：
  - 行內控件只是面板 state 的第二個視圖——發同樣的 intent，走現有
    intents→state→apply，不建新機制；apply 時值相同不回寫，防迴圈。
  - i18n 槽位標記放在譯文字串裡（各語言語序不同，插槽位置跟譯文走），
    模板／JS hydrate。
  - 無障礙：句子即說明，`aria-labelledby` 指回句子或整句包 `<label>`。
  - 節制規矩：**每站至多一個行內控件句**。
  - Marginalia 窄螢幕會隱藏，行內控件消失時面板仍在——天然 progressive
    enhancement，不需特別處理。
  - 微瑕疵備忘：input 有值時「在任何選擇器〔.post〕」的「任何」與具體值
    微打架，實作時看渲染效果定奪。
  - `_data.js` 目前放的是無控件也通順的過渡版文案。

- **標點懸掛（`<h-layer>` 絕對定位）對偽元素的影響，寫進 manual doc。**
  CSS 層的說明已經寫在 `src/css/lines.with-js.css`（標點懸掛區塊的
  comment）；manual 站的文件工作還沒開工，這塊等文件動工時要一併講：
  - `::first-line` 理論上＋實際上都會受影響（`.Manifesto h1::first-line`
    是唯一一條現存規則，見 `manual/public/home/stations.css`）。
  - `::first-letter` 理論上受影響，但因為 hangable 標記只會落在收尾／
    閉合標點上（逗號、句號、收合括號），這類字元結構上不可能是段落的
    第一個字，所以實際上永遠不會撞到——文件裡可以直接說「不受影響」，
    但順手提一句原因，免得以後有人照著理論去修一個不存在的問題。
  - `::selection`、Custom Highlight API（`::highlight()`）、以及所有
    DOM 結構型選擇器（`:first-child`、`:has()`、相鄰選擇器、`:lang()`）
    都不受影響——這些查的是渲染樹之外的東西（selection/highlight 是文字
    range，結構選擇器是 DOM 樹），跟 `position` 無關。
