# 標點公約與文種解耦：四個公約，四個文種，隨意搭配 — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓四個標點公約（JIS／MOE／GB／KLR）對四個文種（hant／hans／ja／ko）
全部開放——繁簡日可選 KLR，韓文可選 JIS／MOE／GB。目前的限制是 han.css 自己
加的，字體本身沒有這個限制。

**Architecture:** 改動的核心是 `src/css/fonts.css` 的四個 `@property` enum 與
其後的 `@container style()` 區塊（4 文種 × 4 公約 ＋ off ＝ 20 塊，現行 14
塊）。其餘都是跟隨：懸掛判定（`lines.with-js.css`）、console 的四顆 select、
codegen、文檔、首頁樣張、測試。

---

## 一、事實（2026-07-31 實測）

### 1. 「本來就可以」有據

- `diantenjeom/src/diantenjeom/codepoints.py` 檔頭：「BASE — Shared full set
  covering every CJK punctuation codepoint each Diantenjeom variant carries.
  **JIS / MOE / KLR all use `BASE` as-is**；GB adds vertical-presentation-form
  brackets on top.」→ 四個變體覆蓋同一組 CJK 標點碼位，KLR 沒有少任何繁簡日
  會用到的標點。
- `diantenjeom/README.md`：「Naming is **intentionally decoupled from text
  locale**, so you can pair any variant with any CJK text font (e.g. Japanese
  text with MOE punctuation, TC text with JIS punctuation).」→ 上游的設計本意
  就是互配，han.css 這一側的四選一／二選一是多加的閘。

### 2. ⚠️ 命名炸彈：上游已把 KV 改名 KLR，但還沒發版

| 來源 | 家族名 |
|---|---|
| 本機 `diantenjeom/dist/diantenjeom.css` | `Diantenjeom Sans/Serif **KLR**` |
| 已發佈的 `@hanzi.pro/diantenjeom@latest`（jsdelivr 實測 curl） | `Diantenjeom Sans/Serif **KV**` |
| `han/src/css/fonts.css` 現行 | 要 `Diantenjeom Sans/Serif **KV**` |

也就是說：**han.css 現在是對的，但 diantenjeom 一發版，韓文標點就會整個失效**
（字體家族名對不上 → 靜靜地掉回 body font 的標點）。這一輪既然要動這四個
enum，順手把值與家族字串一起改成 KLR 最省事——但**發版順序必須協調**（見
風險）。

### 3. 首頁有兩處死宣告

`manual/public/home/station-lines.css:47` 與 `:219` 寫的是
`--han-punctuation-ko: KV`——那個變數名**不存在**（實際註冊的是
`--han-punctuation-vertical-ko`），所以這兩行目前完全沒有作用。改名之後它們
會**真的生效**，站③兩處樣張的韓文標點會從「跟隨全站設定」變成「鎖 KLR」。
不是新 bug，是一個潛伏的宣告被喚醒——實作時要重看那一站的渲染，並決定是留是
刪（那兩處本來的用意是「樣張鎖住自己的公約，不受 console 影響」，所以多半是
留、但要確認渲染）。

---

## 二、要 owner 拍板的三個決定

1. **值叫 `KLR` 還是 `KV`？** 建議 **KLR**，跟上游一致（W3C KLReq 的縮寫，
   而 KV 讀作 Korean Vertical——這個名字本身就是「只給直排用」的來源）。
2. **變數 `--han-punctuation-vertical-ko` → `--han-punctuation-ko`？** 建議
   改。`vertical-` 這個限定詞在「韓文也能選 JIS／MOE／GB」之後就不成立了，
   而且四個文種的變數名對稱才好記。RC 前是最後的改名窗口。
3. **預設值維持不變**（hant MOE、hans GB、ja JIS、ko KLR）。這一輪只開放
   選項，不動任何人的預設輸出。

---

## 三、不變式

- 四個文種的**預設值一個都不動**；沒改設定的使用者，生成碼與渲染完全相同。
- `off` 的語意不變（Diantenjeom 不參與，掉回 body font 自己的標點）。
- 「設在祖先、不能設在自己身上」的 style-query 契約不變。
- diantenjeom 一個位元組都不動——這是 han.css 單方面的解閘。

---

### Task 1: `src/css/fonts.css` — enum 與區塊矩陣

- [ ] **Step 1:** 四個 `@property` 的 `syntax` 統一成
  `"JIS | MOE | GB | KLR | off"`；`--han-punctuation-vertical-ko` 更名為
  `--han-punctuation-ko`，`initial-value: KLR`。
- [ ] **Step 2:** 檔頭那段「Property → locale → default」補上 ko 一行；KLR 的
  說明從「韓文直排標準」改寫成公約本身的定義（cl1/cl2 括號貼邊、cl6/cl7
  `！？：；` 直排不轉、cl8/cl9 `。、` 全形貼角——照 diantenjeom README），並
  明說**它可以配任何文種**，只是它的價值在直排與括號家族。
- [ ] **Step 3:** 補齊 `@container style()` 矩陣：hant／hans／ja 各加一塊
  `KLR`，ko 加 `JIS`／`MOE`／`GB` 三塊，家族字串一律 `Diantenjeom
  Sans/Serif KLR`（其餘三個公約的家族字串不動）。共 20 塊。
- [ ] **Step 4:** 這 20 塊已經是這支檔案裡最重複的一段——檔頭 239 行處早記著
  `if()` 落地後的收斂寫法。**這一輪不重構**，只在該註解補一句「矩陣已擴到
  4×4，`if()` 的收益隨之翻倍」。
- [ ] **Step 5:** Commit `feat(fonts): 四個標點公約對四個文種全面開放`

### Task 2: 懸掛判定跟上（`src/css/lines.with-js.css`）

- [ ] **Step 1:** `:where(:lang(ko-Hant)) { --han-state-hanging-punctuation:
  on }` 這條**無條件 on** 改成與其餘三個文種同款的「排除 MOE」雙分支
  （`@container not style(--han-punctuation-ko: MOE)` / `style(… : MOE)`）。
  理由不變：MOE 是唯一已知置中的公約，懸掛出去會浮在版邊；KLR 是貼角的，與
  JIS／GB 同列合格。
- [ ] **Step 2:** 檔頭 221–240 行那段長註解要重寫——現在寫的是「`ko` has no
  `MOE`-equivalent（`--han-punctuation-vertical-ko` is just `KV | off`），so
  it has nothing to exclude and is unconditionally on」，這一輪之後整段前提
  作廢。順帶把「both `on` and `off` 都要明寫」的那條理由套到 ko（同樣會有
  wrapper 自我查詢的邊界洩漏）。
- [ ] **Step 3:** Commit `fix(lines): 韓文的懸掛判定跟著標點公約走，不再無條件開`

### Task 3: console 的四顆 select

- [ ] **Step 1:** `manual/home/console.html` 的 `punct.hant`／`punct.hans`／
  `punct.ja` 各補 `<option value="KLR">KLR</option>`；`punct.ko` 補 JIS／MOE／
  GB 三個，`KV` 改成 `KLR`（維持 selected）。四顆選單的選項順序統一為
  JIS・MOE・GB・KLR・off。
- [ ] **Step 2:** i18n：`pgPunctVertical`（「直排標點」）在 ko 群組已不再是
  「直排」專屬 → 改用既有的 `pgPunct`；韓文群組的註解「傳承字形＋直排標點」
  一併更新。若 `pgPunctVertical` 沒有其他使用處就刪掉該 key（五語）。
- [ ] **Step 3:** Commit `feat(console): 四個文種的標點選單一致（＋KLR）`

### Task 4: codegen 與元件狀態

- [ ] **Step 1:** `manual/public/home/codegen.js`：`DEFAULTS.punct.ko` 由
  `'KV'` 改 `'KLR'`；`cssVars` 那行 `--han-punctuation-vertical-ko` 改
  `--han-punctuation-ko`，並併進上面那個 `for` 迴圈（四個文種同構，不必單獨
  一行）。
- [ ] **Step 2:** `manual/public/components/console-config.js` 的 `ALL_VARS`
  更名。
- [ ] **Step 3:** `manual/tests/codegen.test.js`：`--han-punctuation-vertical-ko`
  → `--han-punctuation-ko`；補一條新測——**繁體選 KLR、韓文選 MOE** 各自出現
  在生成碼裡（這是本輪的核心新能力，要有回歸網）。
- [ ] **Step 4:** Commit `feat(playground): 生成碼支援四文種 × 四公約`

### Task 5: 文檔

- [ ] **Step 1:** `manual/src/docs/fonts.md` 的表格：`--han-punctuation-ko`
  一行，值域 `JIS｜MOE｜GB｜KLR｜off`，預設 `KLR`，作用域 `:lang(ko)`（去掉
  「直排」）；其餘三行值域補 `KLR`。
- [ ] **Step 2:** 值的說明段落：`KV：韓文直排標準（僅涵蓋直排；橫排的韓漢混排
  不在Diantenjeom範圍）` 這句要改——照 diantenjeom README 的實情：KLR 的括號
  家族（cl1/cl2）橫排韓文也用得到，`。、` 那部分的價值集中在直排；KLReq 對
  橫排韓文本來就要求半形西文 `.` `,`，那是**內容層**的選擇，不是字體層。
- [ ] **Step 3:** 補一段「公約與文種是解耦的」——這是本輪的賣點，值得在文檔
  裡明說（日文配 MOE、繁體配 JIS 都合法，選的是版面調性不是語言）。
  `manual/src/docs/migration.md:160` 的 `（MOE／GB／JIS／KV）` 一併改 KLR。
- [ ] **Step 4:** Commit `docs(fonts): 標點公約與文種解耦，KV→KLR`

### Task 6: 首頁

- [ ] **Step 1:** 站②四語樣張（`.PunctLang`）四格的 `<select>`：ko 格補
  JIS／MOE／GB，其餘三格補 KLR，選項順序與 console 一致。這格樣張的整個意義
  就是「同一句話換不同公約」，開放之後才真的是 4×4。
- [ ] **Step 2:** `manual/public/home/station-lines.css:47`／`:219` 那兩處
  死宣告（見 §一.3）改名後會生效——重看站③兩處樣張的韓文渲染，決定留或刪，
  並把判斷寫進註解。
- [ ] **Step 3:** 站③的 MOE 注（`slMoeNote`，五語）現在說「懸掛會在 MOE 時
  自動關閉」——韓文現在也適用了，檢查該注是否要補一句（原文寫「ko 沒有對應的
  居中選項，無從關起」的是 CSS 註解，不是頁面文案；頁面文案本身可能不必動）。
- [ ] **Step 4:** Commit `feat(home): 四語樣張的標點選單開放全部公約`

### Task 7: 驗收

- [ ] **Step 1:** 單元：`cd manual && npm test`（codegen 全綠，含新測）。
- [ ] **Step 2:** e2e：`console-collapse.spec:146` 動 `punct.ko` 那條要仍綠；
  `demo.spec` 的 off-cell 懸掛計數若因 ko 的懸掛判定改動而變，順勢更正。
- [ ] **Step 3:** 瀏覽器實測（headless，配方同前幾輪）：韓文格撥 MOE 後
  `--han-font-punctuation-serif` 解析成 `Diantenjeom Serif MOE`、且
  `--han-state-hanging-punctuation` 變 `off`；繁體格撥 KLR 後解析成
  `Diantenjeom Serif KLR` 且懸掛仍 `on`。
- [ ] **Step 4:** 目視：站②四語樣張 4×4 各撥一遍，確認沒有掉回 body font
  （家族名打錯會靜靜地失效，只有目視或 `document.fonts.check` 抓得到）。

---

## 風險

- **發版順序（唯一的硬風險）。** 本機 diantenjeom 已改名 KLR，npm 上還是 KV。
  han.css 改成要 KLR 之後，在 diantenjeom 發版之前，**任何走 CDN `@latest`
  的頁面（含首頁 playground 預覽）韓文標點都會失效**。三個選項：
  (a) 先發 diantenjeom，再合這一輪；
  (b) 本輪的 `@container` 區塊同時寫兩個家族名（`'Diantenjeom Serif KLR',
      'Diantenjeom Serif KV'`）作為過渡，發版後再拆——CSS font stack 天然容
      錯，成本只有一行；
  (c) 這一輪只做「解閘」不做改名，KV 留著，等 diantenjeom 發版再改。
  **建議 (b)**：解閘與改名一次做完，過渡期靠 stack 兜住，且它同時保護還沒更新
  的下游使用者。
- **`KLR` 對已寫過 `KV` 的使用者是破壞性改名。** v4 還在 rc，尚無正式發行，
  CHANGELOG 記一筆即可；不做別名。
- **站③兩處死宣告復活**會改變該站韓文樣張的渲染（見 §一.3）——不是回歸，但
  要目視確認一次。

## 明確不做

- **不重構那 20 塊 `@container`**（等 `if()`，檔頭已記）。
- **不動 diantenjeom**：這是 han.css 單方面的解閘。
- **不碰橫排韓文該用半形 `.` `,` 這件事**：那是內容層的排版選擇，字體層無從
  代勞，文檔講清楚即可（Task 5 Step 2）。
- **不加「自動依 lang 猜公約」的智慧邏輯**：公約是作者的選擇，預設值已經給了
  合理起點。
