# 首頁 CSS 二次重整：每個 station 一個同名檔、能繼承的就繼承

2026-08-05。前一輪（`home-css-refactor.md`，2026-07-26）把 4 支破千行的巨檔拆成
`common/` ＋ `home/` 的 partial，訂下 **≤500 行**的檔案上限。半年後這條線又破了三處，
而且破法變了——不是「一個檔塞太多主題」，是**檔案界線根本不等於 station 界線**，
外加逐元素重宣告字體／行高／顏色。本計畫修這兩件事。

判準：`web-style.md` §CSS。

---

## 一、現況盤點

`manual/public/home/` 共 18 支、6,975 行；`common/` 8 支、911 行；`components/` 2 支、
299 行。破 500 行上限的：`station-semantics.css` 1837、`station-craft.css` 1318、
`lead-forme.css` 787。

### 甲、檔案界線 ≠ station 界線（主症）

`<main>` 底下的九個區塊各有一支 `home/*.html`，但沒有一支 CSS 檔跟它一一對應：

| station（HTML 行數） | 樣式現在散在哪 | 行數 |
|---|---|---|
| `manifesto`（55） | `manifesto.css` ＋ `station-frame.css` 的 `.InstallChip`(41) | 150＋41 |
| `station-semantics` ①（458） | `station-semantics.css` ＋ `station-specimen.css` 的 `figure.Papers`(102) | 1837＋102 |
| `station-fonts` ②（422） | `station-fonts.css` ＋ `lead-forme.css` ＋ `dash-fuse.css`（`.PunctLang` 在 lead-forme，管它的 `:has()` 開關卻在 station-fonts） | 408＋787＋482 |
| `station-lines` ③（158） | `station-lines.css`（唯一名實相符的） | 432 |
| `station-prose`（124） | `station-prose.css` ＋ `station-frame.css` 的 `.Prose`(29)、`article.Dispatch`(30) | 56＋59 |
| `station-craft` 伍（861） | `station-craft.css`（其中 `.Snippet` 18 行是別站的） | 1318 |
| `station-playground`（108） | `playground.css` ＋ `preview.css` 的 `.Preview`(79) | 244＋79 |
| `station-snippet` ④（88） | **沒有自己的檔**：`.Snippet` 在 `station-craft.css`、`figure.CodePane`(101) 在 `preview.css`、`pre/code` 在 `common/code.css` | 0 |
| `closing`（30） | `station-frame.css` 的 `.Closing`(82) | 0 |

具體錯位：

- **`station-specimen.css`（137 行）名不副實**。`.Specimen`(8 行) 選的 markup 早就不存在
  （`home/lang-switcher.js:7` 的註解親口說了「`.Specimen` markup that no longer exists
  on this page」）——死碼；剩下的 `figure.Papers`(102 行) 是站①的四版報頭。整支該解散。
- **`station-frame.css`（486 行）一半不是 frame**。真正的框只有 `main`(17)、
  `main > section`(106)、`[data-station]`(11)、reveal 動畫(54) ＝ 約 190 行；
  另外 190 行是四個 station 各自的東西（`.Prose`、`article.Dispatch`、`.InstallChip`、
  `.Closing`）。
- **`preview.css` 是兩個東西**。`.Preview`(79) 是站④與站⑦共用的「框」原生元件
  （`station-playground.html:70` 的註解寫明是 primitive），`figure.CodePane`(101) 是站④
  獨有。前者屬 `common/`，後者屬 `station-snippet.css`。
- **`root.css` 與 `layout.css` 幾乎是同一支檔**。兩者都定義
  `:root:has(input[name='dark-mode']:checked) { color-scheme: dark }` 與 `body.home` 的
  `margin/font-family/font-size/line-height/color/background/font-feature-settings`
  ＋ `a`／`img, svg` 三條——**逐字重複**，只有宣告順序不同。`home.css` 裡 root 排在
  layout 前，所以現在是 layout 贏；沒人動得了 root.css 卻不會發現。
- **命名不成系統**：`manifesto.css`／`playground.css`／`preview.css` 沒有 `station-` 前綴，
  `station-specimen.css`／`station-frame.css` 有前綴卻不是 station。

### 乙、不用繼承，逐元素重宣告（第二症）

`home/*.css` 裡可繼承屬性的宣告共 **493 條**（color 140、font-size 131、
font-family 102、line-height 49、font-weight 31、letter-spacing 18、text-align 22），
分佈在 6,975 行裡——平均每 14 行就重講一次字體或顏色。

- `font-family: var(--han-font-alternative)` × 31、`var(--font-mono)` × 28、
  `var(--han-font-default)` × 14。其中 `--font-mono` 光 `station-craft.css` 就 14 處。
- `color: var(--ui-text)` × 31。`body.home` 已經是這個值，`main` 沒有覆寫，所以絕大多數
  是把繼承來的值再寫一次。
- 教科書案例，`station-craft.css:452` `.Rule`：

  ```css
  .Rule {
    & { font-family: var(--font-mono); font-size: var(--fs-fine); }
    .RuleLayer { font-family: var(--font-mono); font-size: .75rem; }  /* 兩條都多餘 */
    .RuleSel   { color: var(--ui-text); }                            /* ＝ 繼承值 */
  }
  ```
  `.RuleLayer` 是 `.Rule` 的後代，字體早就繼承到了；`.75rem` 又剛好等於父層寫的
  `--fs-fine`，只是繞開了代號。

### 丙、字級一半代號一半字面，兩套並行

`font-size` 131 條裡 **61 條寫死數值、70 條走 `var(--fs-*)`**，同一個級數兩種寫法並存：
`.875rem` 出現 8 次，`var(--fs-small)`（＝同一個 0.875rem）出現 12 次。

**方向：全部收斂到字面 rem 值，`--fs-*` 七個代號從 `common/variables.css` 刪除。**
字級不像顏色——`.875rem` 自己就說得清楚，`--fs-small` 還要回頭查表；而且這一階本來就
沒有換主題、換模式要整批翻轉的需求（顏色才有，所以 `--ui-*` 留著）。全庫要改的
`var(--fs-*)` 共 79 處（`home/` 60、`common/` 14、`components/` 5）。

現行七級，換算表：

| 代號 | 值 | 用途 |
|---|---|---|
| `--fs-heading` | `1.5rem` | section h2 |
| `--fs-lede` | `1.125rem` | Manifesto lede |
| `--fs-body` | `1rem` | 正文 |
| `--fs-small` | `0.875rem` | 說明文字、caption、nav |
| `--fs-compact` | `0.8125rem` | 密集控制項、程式碼終端機 |
| `--fs-fine` | `0.75rem` | mono 標籤、藥丸、小字 |
| `--fs-micro` | `0.625rem` | 主控台微型組標 |

階本身不廢——它搬進 `common/variables.css` 檔頭的一段註解，當作寫新規則時的選級指引。
另有 `0.8rem`／`0.9em`／`0.8em` 這種階上沒有的自創級數，一併歸位到最近的一級。

**要知道的代價（一項）**：`--fs-*` 的間接層唯一真正的用處，是讓 `main` 有機會整批把
這一階改寫成 `em`，好讓主控台的字級滑桿連帶縮放標題與說明文字（ziano playground 的
作法）。`station-frame.css:13–24` 有一整段註解在描述這個機制——**但那個覆寫區塊已經
不存在了**，今天七個代號一律在 `:root` 以 rem 定義，滑桿（`--console-metric-size`）只
影響沒有明式 `font-size` 的文字。也就是說：改成字面值**與現況完全等價，零風險**；
真正沒了的是「日後想把那個功能加回來時，改一個區塊就好」。若哪天要加回來，就在受影響
的規則上直接寫 `em`。順帶：那段過時註解本次刪除。

### 丁、死碼

除 `.Specimen` 外，另有 7 個 class 選擇器在 HTML／JS 裡都找不到對應
（已排除 i18n 鍵名之類的假命中）：

| class | 檔:行 | 約行數 |
|---|---|---|
| `.Legend` | `station-fonts.css:225`（＋ `:63` 的 grid-area） | 54 |
| `.Proof` | `station-craft.css:680` | 18 |
| `.Mine` | `station-craft.css:376` | 10 |
| `.LayerLede` | `station-craft.css:700` | 7 |
| `.WhereLede` | `station-craft.css:129` | 3 |
| `.Lede` | `station-frame.css:314,316` | 5 |
| `.InstallLine` | `station-frame.css:439` | 4 |

合計約 100 行。（`.Bridge`／`.Finish` 已隨 markup 移除，只剩 `station-craft.css:1309`
一段註解交代，那段留著。）

### 戊、沒問題、不要動的

盤點時一併查了，這幾條 `web-style.md` 的規矩守得很好，寫下來免得下一輪再查一遍：

- **邏輯屬性**：全 `home/` ＋ `common/` 只有 7 條物理屬性（`width`×2、`height`×2、
  `max-width`、`padding-bottom`、`top` 各 1），其餘一律 `inline-size`／`block-size`／
  `padding-inline` 等。
- **`!important`**：只有 5 處，4 處在 `gate.css`、1 處在 `components/console.css`，
  都是字幕閘刻意壓過行內樣式，檔頭有交代。
- **`& {}` 巢狀慣例**、`:where()` 低特異性、`light-dark()` 單點翻轉：都在。
- **兩層色票**：`--palette-*`／`--ui-*` 已於 2026-08-04 完成改名，全頁一致。

---

## 二、目標結構

規則：**`<main>` 底下每個區塊 ＝ `home/` 底下一支同名 CSS**。例外兩類：

1. **複雜的動畫／圖示組件自己一支檔**——而且是**整組搬**：那個圖示的 SVG／HTML 本身的
   排版樣式、它的狀態選擇器、它的 `@keyframes`，全都在同一支檔裡，不要「靜態留在站台檔、
   keyframes 另放」。判準是「這東西可以整塊搬到另一頁去，不必帶走站台的任何規則」。
   計：`lead-forme.css`（鉛字盤）、`dash-fuse.css`（破折號熔接）、
   `mark-diagram.css`（著重號落定圖，自 station-semantics 切出）、
   `envelope.css`（信封掀蓋，同上）、`ledger.css`（站伍的加總帳）。
2. **`<han-console>` 及其周邊**：`console.css`（頁面側版位）、`console-loader.css`
   （升級前的骨架）、`components/*`（元件自己的）。

```
public/common/
  variables.css   ← 只動一處：刪掉 --fs-* 七個代號，改成檔頭的選級註解（一·丙）
  reset.css       brand.css   code.css   icons.css        （不動）
  lang-switcher.css   theme-toggle.css   module-state.css （不動）
  controls.css    ← 由 home/controls.css 遷入。它是 dual-homed：頁面 @import 一份，
                    <han-console> 的 shadow 也 adopt 同一支（han-console.js:129）。
                    放在 home/ 底下名實不符，且四個 station 的 .Toggle 都靠它。
  panel.css       ← 新增。`.Preview` 框（站④、站⑦共用的 primitive）

public/home/
  root.css              頁面基底 ＋ Topbar ＋ 直排浮動鈕（layout.css 併入後刪除）
  frame.css             ← station-frame.css 更名並瘦身：只留 main／main > section／
                          [data-station]／reveal 動畫
  gate.css              字幕閘（不動）
  manifesto.css         ＋ .InstallChip
  station-semantics.css ＋ figure.Papers（station-specimen.css 解散後遷入）
                        － .MarkDiagram、－ .Envelope（各自成檔，見例外一）
  station-fonts.css     ＋ .PunctLang（自 lead-forme.css 遷入，與它的 :has() 開關團圓）
  station-lines.css     （不動）
  station-prose.css     ＋ .Prose、article.Dispatch
  station-craft.css     － .Snippet、－ 帳本
  station-playground.css ← playground.css 更名
  station-snippet.css   ← 新檔：.Snippet ＋ figure.CodePane
  closing.css           ← 新檔：.Closing
  lead-forme.css        － .PunctLang（例外一）
  dash-fuse.css         （例外一，不動）
  mark-diagram.css      ← 自 station-semantics.css 切出（例外一）
  envelope.css          ← 自 station-semantics.css 切出（例外一）
  ledger.css            ← 自 station-craft.css 切出（例外一）
  console.css / console-loader.css （例外二，不動）

刪除：layout.css、station-specimen.css、preview.css、playground.css、station-frame.css
```

> **執行時的更正（2026-08-05）：這兩支都沒有切。** 判準「整塊搬走、不必帶走站台的
> 任何規則」自己把它們擋下了：
>
> - **`.MarkDiagram` 切不開**——它的 hover 編排與詩行是同一套：
>   `#station-semantics:has(.MarkDiagram [data-mark='proper']:hover, .poem-like u:hover)`
>   一個選擇器同時管圖解與詩行，且這類規則散落在站台大區塊的 1216–1485 行之間，
>   與非圖解的規則交錯。切出去要嘛拆散這套編排，要嘛把詩行一起帶走。
> - **`.Envelope` 切了沒有好處**——它的規則全是 `#station-semantics .Envelope …`，
>   搬到別的檔也還是綁在這一站；而 `manual/demo/envelope.html` 是一份**自帶 token
>   的獨立複本**，不吃頁面的 CSS，所以也沒有「兩處共用」可省。
>
> 結果：`station-semantics.css` 維持一整支（步驟3f 後 1956 行），是全庫唯一破 800 的
> 檔。它的體積要靠第 4、5 步（字級與繼承）處理，做完再看數字決定要不要動它。
> 下面這段保留原樣，當作「這條判準確實會擋掉東西」的紀錄。

**兩支切出來的圖示，各自帶走什麼：**

- `mark-diagram.css` — `.MarkDiagram`（`station-semantics.css:522–911`，390 行）＋
  `mark-settle`／`mark-replay`／`mark-unsettle`／`mark-roundtrip`／`semantics-mark-cue`
  ＋其 replay 版等 `@keyframes`，＋ `@property --settle`。約 450 行。
- `envelope.css` — `#station-semantics .Envelope`（`:1571–1740`，170 行）＋
  `[data-flap]` 狀態、`semantics-envelope-replay`、reduced-motion 分支、
  `[data-han-module-semantics='off']` 分支。約 210 行。
  （`manual/demo/envelope.html` 本來就是它的獨立展示頁——它早就是可獨立搬走的東西了。）

行數預估（甲＋乙＋丙＋丁全部做完之後）：

```
root.css               ~120   station-craft.css      ~700
frame.css              ~200   station-playground.css ~230
gate.css                151   station-snippet.css    ~120
manifesto.css          ~180   closing.css             ~80
station-semantics.css  ~600   lead-forme.css         ~700
station-fonts.css      ~380   dash-fuse.css           482
station-lines.css      ~400   mark-diagram.css       ~450
station-prose.css      ~110   envelope.css           ~210
                              ledger.css             ~470
                              common/controls.css    ~460
                              common/panel.css        ~80
```

**關於 ≤500 行上限**：前一輪定的線，這裡當**軟上限**用——`station-craft.css` ~700 與
`lead-forme.css` ~700 會過線。兩者過線的原因不同：craft 的 HTML 本身就有 861 行
（`.Example` 一塊 399 行是選擇器輪播，有 `carousel.js` 驅動），lead-forme 是等角投影的
鉛字盤。要壓到 500 得再切一刀（craft 切 `rule-carousel.css`），但那一刀切的是**互動**
不是動畫，跟例外一的判準對不上，硬切會多一支說不清歸屬的檔。**本計畫不切**，把線
記在這裡：兩支停在 ~700，其餘全部 ≤500。

順帶更正一筆盤點數字：`station-semantics.css` 的 25 個 `@keyframes` 加起來只有約 130 行，
動畫的體積不在 keyframes，而在散落於各元素上的 `animation`／狀態選擇器（77 條）。
所以切分要照「哪個圖示」切，不是照「靜態 vs 動畫」切——這也正是例外一那條「整組搬」的
由來。

---

## 三、執行順序

每一步都獨立可驗、獨立可 commit。先做零風險的減法，再做搬移，最後才動繼承。

> **執行時學到的兩件事（2026-08-05，寫在這裡免得下一輪再踩）：**
> 1. **`pnpm --filter han-manual build` 失敗時仍會寫出 dist。** vite 的內聯 plugin 在
>    `closeBundle` 拋錯（一個註解少了結尾 `*/` 就夠），但未內聯的入口檔已經寫進
>    `dist/`——頁面照樣能看（瀏覽器自己解 `@import` 鏈），只是載入順序與時機變了，
>    量出來是一片看似真實的幾何差異。**build 的輸出絕對不可以 `>/dev/null`**；
>    baseline 工具現在會先檢查 `dist/home.css` 裡還有沒有 `@import`，有就中止。
> 2. **量測前後兩次的樹必須一致。** 工作區裡若有別人未提交的改動，stash／pop 的時機
>    會讓「before」與「after」落在不同的樹上，量出來全是那個人的改動。要嘛兩次都帶著
>    那份改動，要嘛兩次都不帶。

**第 0 步——量測基準。** 寫 `manual/tests/computed-baseline.mjs`：headless Chrome 開
首頁（亮／暗 × 橫排／直排 × 寬 1280／390 共 8 組），對 `main` 底下每個元素 dump
`font-family/font-size/line-height/color/background-color/margin/padding` 的 computed
值，存成 JSON。這是後面每一步的判準——**逐像素截圖比對不做**（首頁滿是動畫，
必假紅）；比 computed style 才穩。手法沿用 `diantenjeom/scripts/check_squeeze.py`
那套 headless 量測，不上 Playwright。

**第 1 步——刪死碼**（丁）。7 個 class 約 100 行，刪完 baseline 必須逐值相同。

**第 2 步——合併 `root.css` ／ `layout.css`**。逐字重複的那段留 `root.css` 一份，
`layout.css` 剩下的 `body > header` 等併入，刪檔，改 `home.css` 的 `@import` 清單。

**第 3 步——搬移，一次一站**（甲）。順序由小到大，每站一個 commit：
closing → station-prose → manifesto → station-snippet → station-playground →
station-semantics（同時切 `mark-diagram.css`、`envelope.css`）→ station-fonts →
station-craft（同時切 `ledger.css`）。
搬移＝剪下貼上，**不改任何宣告**，baseline 必須逐值相同。
`@import` 順序即層疊順序，每搬一站同步改 `home.css`；`common/*` 一律排在 `home/*` 前。
切圖示檔時特別注意：`@keyframes` 是全域名字，搬檔不影響解析，但**搬漏一個就是靜默失效**
（動畫名找不到 ＝ 不報錯、不播）。逐個 `animation` 宣告核對名字，別靠肉眼掃。

**第 4 步——字級改字面值**（丙）。`var(--fs-*)` 79 處全換成 rem 字面值（換算表見一·丙），
`common/variables.css` 刪掉七個代號定義、改成檔頭一段選級註解，
`components/tokens.css` 的 `--_fs-compact/-fine/-micro` 三條回退層一併拆掉
（元件那三處直接寫字面值——那層間接本來就只是為了接外面的代號）。
`station-frame.css:13–24` 那段描述 em ramp 的過時註解刪除。
這一步 baseline 應逐值相同；唯一會動的是 `0.8rem`／`0.9em`／`0.8em` 三種自創級數歸位到
最近一級，像素差逐條記在 commit 訊息裡。

**第 5 步——收繼承**（乙）。這步唯一有風險，逐檔做、逐檔驗：
1. 對每個檔跑一支小工具，列出「本規則宣告的可繼承屬性」與「其祖先鏈上最近的同屬性
   宣告」，兩者相同即為**候選**。
2. 候選不是一律刪——反例有三種，留著並補一句 `/* 明式：… */`：
   - 進了 shadow DOM 或跨了 `<han-console>` 邊界；
   - 那一支子樹被 `--console-metric-*` 之類的變數改寫過，明寫是為了擋住；
   - `.RuleSel { color: var(--ui-text) }` 這種「同組兄弟各有顏色、這個是回到預設」的
     ——留著，但改寫成離它最近的祖先所用的同一個代號。
3. 其餘刪除，每刪一檔跑一次 baseline，逐值相同才進下一檔。
   目標：493 條可繼承宣告收到 300 條以下。

**第 6 步——回頭補文件**。`web-style.md` 三處要動：
1. 加一條「**一個區塊一支同名 partial**；複雜的動畫／圖示組件自己一支，且**整組搬**
   （版面 ＋ 狀態 ＋ keyframes 同檔）」，並把 ≤500 行軟上限重申一次。
2. 現行的「Design tokens drive everything．Sizes/colours are `--vars`」要改口——
   **尺寸不再是代號，字級一律寫字面 rem**；代號留給需要整批翻轉的東西（顏色
   `--ui-*`／`--palette-*`、字體堆疊 `--font-*`、版面 `--max-w-*`／`--gutter`）。
3. 順帶查證：`ziano/demo/`（這份標準指名的參考實作）**本來就是寫字面 rem**，
   `var(--fs-*)` 零處，而且級數逐一相同（`.625`／`.75`／`.8125`／`.875`／`1`／`1.125`／
   `1.5rem`）。所以這一步不是新規矩，是 han 回到參考實作那一邊——`web-style.md` 直接
   照 ziano 的現況寫即可，ziano 不用動。

---

## 四、驗收

- 每一步：computed-style baseline 8 組全數逐值相同（第 4 步允許差異，須逐條列在 commit
  訊息）。
- 全案結束：`pnpm test:e2e`。**注意基準線**——目前 104 pass / 9 fail，其中 8 條在乾淨樹
  上就是紅的（`console-collapse`、`console-component`、`home.spec` 三條、
  `homepage-v2:24`、`lead-forme-pocket`、`lead-forme-swap:75`），另 1 條
  （`lead-forme-swap:90`）是 flake。**不得**把這 9 條算進本計畫的成績，也不得因為它們
  本來就紅而順手改動它們。
- `home.css` 的 `@import` 清單讀起來要能一眼看出頁面結構：common → 框 → 各站（依
  `<main>` 裡的出現順序）→ 例外組件。
- 最後手測一輪：亮／暗、橫／直、窄寬、字幕閘重整。

---

## 五、不在範圍

- `manual.css` 那一側（docs 頁）不動。
- `components/*` 的樣式歸元件，除了第 4 步要拆掉 `tokens.css` 的三條 `--_fs-*` 回退層
  ＋ `console.css` 的兩處 `var(--fs-micro)`（`--fs-*` 一刪，那層間接就沒有對象了）。
- `station-craft.css` 的 `.Example`／選擇器輪播不切檔（見第二節末的上限說明）。
- `ziano/demo/` 不動（第 6 步第 3 點）。
- e2e 那 8 條既有紅燈。
