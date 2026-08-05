# 裸頁全功能 demo —— `<han-console>` × 素 HTML

**狀態**：已拍板，rc0 前交付（2026-08-05）
**性質**：manual 站新頁面，與現有 `demo/index.html`（示例對照頁）互補不取代

**拍板紀錄**：console 可以有樣式、console 之外零樣式照字面執行；內容
先繁（hant＋taisol 現成的 ja/ko），簡體下一步再加；頁名暫定
`bare.html`；console UI 保留 en locale；**rc0 前**交付——吃緊時 E 骨架
先上、B 擴充分批。

## 目標

一頁**素 HTML**——除 han.css 外零頁面樣式、零 demo chrome——載入
`<han-console>`，讓用戶：

1. 逐模組／逐功能開關，即時看 han.css 在裸文檔上做了什麼；
2. 切換繁簡日韓內容，看四文種各自的標點慣例、字體堆疊、間隙行為；
3. 複製 console 生成的配置代碼（console 既有的 codegen 能力）。

賣點跟示例頁相反：示例頁是「單功能 × ON/OFF 對照」，這頁是「整份真實
文檔 × 全配置空間」。「把 han.css 丟到裸 HTML 上會怎樣」正是 rc0 首頁
一行 `<link>` 退路的視覺論證。

## 既有資產盤點（實查）

`<han-console>`（`manual/public/components/han-console.js`，shadow DOM）
公開契約已足夠承載本頁，**不需要新元件**：

- attrs：`lang`（hant/hans/en/ja/ko，動態）、`target`（JS fallback 安裝
  範圍的 selector，預設 `main`）、`form`（`side|top`，純 shadow 內 CSS）
- event：`han-config-change`（bubbles＋composed，`{config, vars, source}`）
- methods：`reset()`、`reapplyFallbacks($target?)`
- 依賴 `/home/codegen.js`、`/home/console-templates.js`——由 manual
  public root 供應，非 home 頁面獨佔，demo 頁可直接 import
- localStorage 持久化＋pre-paint 還原 inline script（**home 頁面私有**，
  在 `_home.html`——不是元件的一部分）

## 決策

### 1. 「完全沒有其他樣式」照字面執行

頁面 CSS ＝ han.css ＋ **唯一一條例外**（拍板追加）：`body {
padding-inline-start: 17.5rem; }` 替左側 console 讓位。不引
`demo.css`、不寫其他 page css。
- console 用 `form="side"` 左側欄（拍板：由 top 改 side）。side form 的
  **定位是文檔側職責**（元件不自帶 fixed，home 由 home.css 定位）——裸頁
  無樣式表可放，定位上元素自身 inline style，與 opt-out 變數同一
  「標記自帶」預算。
- 「×」開合鈕：JS 切 console 的 inline `display`（不能用 `hidden` 屬性
  ——shadow 的 `:host { display: flex }` 是 author 規則，蓋得過 UA 的
  `[hidden]`），body 讓位同步以 inline style 歸零。
- console 自身是 shadow DOM 樣式，不算頁面樣式（它是儀表板不是展品）。
- 語言切換用原生 `<select>` 裸控件——瀏覽器預設外觀就是本頁的美學宣言。

### 2. 內容源：taisol 節錄，不新編樣張

照工作區規約「先找太陽中文報，不要發明樣本」。選文標準：一篇之內要能
踩到全部展品——各式標點（引號書名號括號破折）、漢西混排（人名數字
單位）、`<em>` 著重、`<cite>`、`<ruby>`（ko 漢諺混寫已自帶；zh-Hant
另補注音段落）、`<blockquote>`、多級標題、清單、`<figure>`。不足處
以多篇拼接。

- **hant／ja／ko**：taisol 現成三語平行稿；**首發只做這三語**。
- **hans**：下一步再加（屆時傾向 OpenCC 機轉＋人工過＋GB 標點校）。
  語言 `<select>` 首發不列簡體選項，加稿時再上。
- 內容平行預載於 DOM（一語一個 `<section lang=…>` 包），切換＝顯示
  哪一包。零樣式約束下的顯隱手段：非 active 包加 `hidden` 屬性
  （語意正確、零 CSS）。

**每語言包的內容分區**（不是一篇 article 到底——prose 模塊自動作用於
`<article>`，全塞 article 會讓整頁都是 prose 特調，展示有偏）：

1. **`<article>` 區**：prose 全效（縮排、justify、標題收合）——taisol
   節錄主文。
2. **非 article 區**：直接落在 `<section>`／裸元素下的內容——semantics
   ／lines／fonts 生效而 prose 不介入，對照出 prose 的邊界。
3. **opt-out 展示區**：四模塊各一個「關掉長這樣」的子樹，全用 han 自己
   的 API（inline 變數宣告，不算頁面樣式）：
   - `--han-semantics: off`（偽斜體回來、著重號消失⋯）
   - prose 的 opt-out **兩式並陳**：整篇關（`<article
     style="--han-prose: off">`）＋**正常 article 內的局部關**（article
     不動、其中一個子樹 `--han-prose: off`——prose.css 文檔的
     `.demo` 情境：文章裡嵌 demo／代碼區塊不吃縮排 justify）
   - lines off：`--han-text-autospace: no-autospace` ＋
     `--han-punctuation-refinement: none`（間隙與擠壓懸掛退場）
   - fonts off：`--han-punctuation-*: off` ＋
     `--han-use-heritage-glyphs-for-*: off`（標點與傳承字形退回系統）
4. **混排展示區**：
   - **四語相互混排**：敘述語為當前選定語言，行內嵌入其他三語 run，
     **一律 `lang="xx"`**——展示逐 run 的標點慣例／引號／字體堆疊
     切換（素材優先從 taisol 各語互引人名、報名處節錄）。
   - **與西文混排**：en／de／希臘／西里爾字母與數字單位，**部分帶
     `lang`、部分裸奔**——帶標的展示 `:lang()` 分層，裸的展示
     autospace 與字體 fallback 不靠 lang 也能工作（間隙是字符級、
     字體是 unicode-range 級）。
   - 此區每語言包各寫一版（敘述語跟著切換）；西文嵌入句可跨包共用。

### 3. 語言切換的三層對齊

一個 `<select>` 驅動三件事：內容 `<article>` 顯隱、`<han-console
lang>` attr（console UI 跟著換語言）、`document.documentElement.lang`。
JS 十行內，`type="module"` inline，符合 web-style（DOM 即資料，
`data-*` 讀回）。

### 4. console 配置面要補課——先審計後擴充

console 的 config schema 是首頁 playground 時代定的；本頁要「全部
功能」，先跑一次**審計**：`codegen.js` 的 `DEFAULTS` ↔ api-reference
§4 的 49 個變數逐一對表，缺的補進 console（config → cssVars → 控件
→ 五語 template 文案）。已知缺口（今天的 API 就有）：

- `--han-zhuyin-ruby-position`（over/inter-character）
- `--han-writing-mode` 鏡射——建議做成「直排預覽」開關：console 切
  直排＝content root 同時上 `writing-mode: vertical-rl` ＋鏡射變數，
  正好是鏡射規則的活教材
- semantics 細項若缺：`--han-em-symbol`／`--han-cite-title-marks`／
  `--han-quotes` 等（審計定案）

擴充照 console 既有 FP 結構做（config/metrics 模組、shadow 不長邏輯）。

### 5. JS fallbacks 掛載

頁面自己 `installFallbacks(main)`（或 han.auto），config 變更後靠
console 的 `reapplyFallbacks()`。語言切換後對新顯示的 article 補跑
一次 install（fallback 是一次性的，藏著的 article 沒處理過）。
注意 uninstall→reinstall 順序，避免二次包裹。

### 7. 工具改住 `<dialog>`（owner 追加，2026-08-05）

側欄版的 `body { padding-inline-start: 17.5rem }` **改變了正文行長**，
而行長正是本頁在展示的東西（兩端對齊的伸縮、行尾懸掛、行首擠壓全依賴
它）。改為右下角浮鈕（`--icon-console`）叫出**非模態 `<dialog>`**：
`position: fixed` 脫離文流，內容拿到真實全寬。

- **`show()` 不是 `showModal()`**：模態有 backdrop＋焦點鎖，撥開關就看不到
  文字重排，playground 的命根子沒了。代價自理：Esc 自己補、**不進 top
  layer**（那是 showModal() 專有）⇒ 疊層要自己給 `z-index`——標註層把
  `article`／`section` 變成 positioned 元素、DOM 序在後，會直接蓋住控制台
  （實測點不到裡面的 checkbox）。
- header 的開關一併收進 dialog：內容區一件 chrome 也不留。
- 新增：**深色模式**（house pattern，共用 `theme` 鍵）、**生成的引入碼**
  （`renderCDN`，補上母 plan 目標 #3）、行長 `max-inline-size: 45em`
  （進標註層——素態＝瀏覽器全寬，誠實：han.css 本來就不管行長）。

### 8. 分塊安裝（實作中發現的庫端限制）

han.js 的 DOM 走訪單次約 **7,500 節點**就爆棧，且**部分成功**——本頁曾
因此靜默掉了九成的擠壓／懸掛（63 → 620 個 `<h-char>`）。頁面改逐區塊
安裝，console 的內建安裝以不存在的 `target` 停用。量測與庫端修法：
`docs/notes/2026-08-05-install-fallbacks-stack-overflow.md`。

### 6. 持久化——跟 home 共用（owner 反轉，2026-08-05）

初版定 stateless，實裝後反轉：**沿用元件內建的 localStorage 持久化**
（與 home 同一存檔鍵），配置跨頁共通，反正有 reset 鈕。副產品：
元件新增 `stateless` 屬性（不讀不寫存檔）留用，demo 頁要回 stateless
隨時掛回。當初「PingFang 之謎」正是共用存檔的舊配置所致——已由
`stateless` 排查定案，屬預期行為非 bug。

## 頁面骨架（示意）

```html
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="/han/han.css">
  <link rel="stylesheet" href="…diantenjeom…">  <!-- 標點展品需要 -->
  <script type="module" src="/bare.js"></script> <!-- 語言切換＋install -->
</head>
<body>
  <han-console form="top" target="main"></han-console>
  <label>語言 <select id="content-lang">…</select></label>
  <main>
    <section lang="zh-Hant"><!-- 語言包，四分區 -->
      <article>…taisol 節錄主文（prose 全效）…</article>
      <section>…非 article 內容（prose 不介入）…</section>
      <section><!-- opt-out 展示 -->
        <div style="--han-semantics: off">…</div>
        <article style="--han-prose: off">…整篇 opt-out…</article>
        <article><!-- prose 正常生效 -->
          <p>…吃縮排 justify 的段落…</p>
          <div style="--han-prose: off">…局部 opt-out：article 裡的
            demo／引用區，不吃 prose 特調…</div>
        </article>
        <div style="--han-text-autospace: no-autospace; --han-punctuation-refinement: none">…</div>
        <div style="--han-punctuation-hant: off; --han-use-heritage-glyphs-for-hant: off">…</div>
      </section>
      <section><!-- 混排：四語互嵌帶 lang；西文帶／不帶 lang 並陳 -->
        …<span lang="ja">…</span>…<span lang="ko">…</span>…
        …<span lang="de">Straße</span>…раскладка…σελίδα…
      </section>
    </section>
    <section lang="ja" hidden>…同構四分區…</section>
    <section lang="ko" hidden>…同構四分區…</section>
  </main>
</body>
</html>
```

（`<han-console>` 註冊走 dynamic import，同 home 的 gate-open-deferred
理由；素頁無 gate，直接 import 亦可——實作時取簡。）

## 任務拆解

- [x] A 審計：codegen `DEFAULTS` ↔ api-reference 49 變數對表。結論：
  - **已覆蓋 16 變數**＋模組開關＋prose scope＋baseGeneric（role var
    改指）＋度量：cite-title-marks／em-symbol／em-dot-position／
    refinement／autospace／heritage×4／heritage-family／cursive／
    cursive-hant／punctuation×4／zhuyin-serif。
  - **B 要補（功能級）**：`--han-zhuyin-ruby-position`（semantics 群，
    over｜inter-character）；`--han-writing-mode`（直排預覽——console 出
    鏡射變數，頁面側同步套真 `writing-mode` 到 target；codegen 輸出
    `:root` 鏡射，整頁直排站直接可用，局部直排站手動搬容器）。
  - **刻意不進 console**（config 檔層級的微調旋鈕，reference 有表）：
    prose-fonts、title-marks／quotes 字符序列、underline-offset、
    decoration-inset、skip-gap、prose-indent／alignment／consecutive-
    headings、latin 三槽、低階六槽、composite 四支、role var 四支
    （baseGeneric 已覆蓋主路徑）。原則：console 管「功能」，不管
    「長度與字符序列」。
  - 架構註記：console 控件綁定是泛型 `data-cfg-key`→config path，
    B 實作＝`home/console.html`（控件＋x-i18n 五語）＋
    `home/codegen.js`（DEFAULTS＋cssVars）兩檔，config 模組零改動
    （模組 off 灰化由 details 群組機制自動繼承）。
  - 模組開關在 bare 頁的落地：載四個單模組 bundle、console 事件切
    `link.disabled`（codegen 的 import 加減行語意 → live 頁面的
    live stylesheet 開關）→ E。
- [x] B console 擴充：缺口變數進 config／cssVars／控件／五語 template
      （zhuyin position、直排預覽開關優先）
- [x] C 選文：taisol 節錄拼出全展品覆蓋清單（hant/ja/ko），zh-Hant 補
      注音段（interop form，一基字一 ruby）；每語言包含四分區
      （article／非 article／opt-out×4／混排——四語互嵌帶 lang、
      西文嵌入帶與不帶 lang 並陳）
- [x] E 頁面組裝：`manual/demo/bare.html` ＋ `bare.js`（語言三層對齊、
      install/reapply 時序）
- [x] F 驗證：headless 過一遍 console 每個控件（改值 → computed style
      斷言）；四語切換後 fallback 標記正確；e2e 從簡、最終手測
- [x] G 導航：manual 首頁與示例頁互連；api-reference §2 或首頁提一句

**下一步（rc0 後）**：hans 稿（機轉 vs taisol 平行稿屆時再議）＋語言
選單補簡體。

## 開放問題

（四項均已拍板，見頂部「拍板紀錄」。hans 加稿時再議機轉 vs 平行稿。）

## 不做

- 新配置元件／重寫 console——現契約夠用，缺什麼補什麼。
- demo 頁自己的視覺設計——零樣式是規格不是偷懶。
- 持久化與跨頁 config 同步。
