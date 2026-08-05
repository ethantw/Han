# `--han-zhuyin-ruby-position` —— 注音 ruby 位置 API

**狀態**：規劃中（2026-08-05 討論定案）
**歸屬**：semantics 模組（`han-semantics`）
**動機**：`ruby.zhuyin` 目前寫死 inter-character；直排不適用，且 Firefox
自 2026-05 支援 `@container style()` 後，han 的 CSS var API 形式可以延伸到
ruby。讓用戶自選 inter-character（字側直行）或 interlinear（字上橫列）。

## API

| 變量 | 值 | 預設 |
|---|---|---|
| `--han-zhuyin-ruby-position` | `over \| inter-character` | `over` |

- `over`（**預設**）：interlinear——橫排注音橫列於字上（萌典式）、直排貼於
  行右側。即瀏覽器的 ruby 預設行為，直橫排皆穩。
- `inter-character`（**opt-in**）：橫排時注音直行貼於字右（台灣教科書式）。
  值名照抄 CSS `ruby-position` 關鍵字；「直排等效 over」本就是 CSS Ruby L1
  對這個關鍵字的定義（「If the writing mode of the enclosing ruby container
  is vertical, this value has the same effect as over.」）——但這條讓位只有
  **原生引擎**（Safari 18.2+）履行，han 的 fallback hack 做不到（見 §2），
  所以 inter-character 只該設在**橫排容器**上。
- `@property` 註冊（自有 enum 驅動 `@container style()` 分支 ⇒ 照
  semantics.css 的註冊準則），`inherits: true`，initial `over`。
- 慣例同全家族：**設在祖先**，不設在 ruby 自身（style query 查祖先）。

**⚠️ 行為變更**：現行 v4 rc 的 `ruby.zhuyin` 預設 inter-character，本案翻成
預設 over。rc 期合法，但進 changelog。既有樣張只有
`manual/demo/ruby.md` 受影響（首頁鉛字盤沒用注音）——該頁改為二式
對照展示，順帶就是新 API 的樣例。

## 實作決策（討論定案）

### 1. 預設 over ＝ 無規則；inter-character 整塊進 gate

預設 `over` 就是瀏覽器預設行為 ⇒ **預設分支零宣告**。現行 inter-character
塊（原生 `ruby-position: inter-character` ＋ `@supports not` fallback hack）
整體搬進 `@container style(--han-zhuyin-ruby-position: inter-character)`。

- 不需要任何反制宣告——沒有預設塊要收回（前版計畫的「逐條反制」清單作廢）。
- 無 style query 的舊瀏覽器：gate 永不匹配 ⇒ 拿到 over 預設，跟新瀏覽器
  不設值時**完全一致**——opt-in 在舊瀏覽器的退化是 over（可讀、合法），
  不是破圖。
- `> rt` 的注音字體（`--han-font-zhuyin-serif`）與 `text-orientation:
  upright` **留在 gate 外**，兩種模式都套用：`Han Zhuyin Serif` 直橫二式
  都支援，靠 GSUB 依排版方向把調號放到對的位置（直行側註調號在側、
  橫列調號在音節後）。`text-orientation` 在橫排本就是 no-op，直排
  （over）下注音仍需正立，留著兩頭都對。搬進 gate 的只有
  `ruby-position: inter-character` 與 `@supports not` 的 hack 幾何。

### 2. 直排 × inter-character：配置期解決，不做 runtime 偵測

**不做 JS `getComputedStyle().writingMode` 偵測 pass**（前版計畫作廢）。
理由：writing-mode 是作者自己寫的，是配置期已知事實，runtime 去「發現」它
是錯層的解法。改為三層：

| 層 | 內容 |
|---|---|
| 預設 | over 直橫排皆正確，**直排用戶什麼都不用設** |
| Skill（配置期） | 偵測到注音 ruby 時**必問**（不是進階 opt-in）：
  「橫排注音要用字側直行式（inter-character，台灣教科書慣例、**推薦**）
  還是字上橫列式（over，預設）？」——庫預設 over 是取直橫排皆穩的安全值，
  但大多網站是橫排、橫排注音的正字慣例是側註，推薦答案是 inter-character。
  若選了 inter-character **且站內另有直排子樹**，var 設在橫排容器上而非
  `:root`（hack 引擎直排撞 inter-character 會破圖，原生引擎才有 spec 讓位）|
| 文檔 | api-reference §4.3 該列 Notes 明寫：inter-character 只設於橫排
  容器；直排下原生引擎自動 over、fallback 引擎不修直排幾何 |

**為什麼純 CSS 做不到自動**：偵測 `writing-mode` 需要
`@container style(writing-mode: vertical-rl)`——CSS Conditional 5 的
**任意屬性** style query，無引擎穩定出貨；現階段全引擎只支援
**custom property** 的 style query。留 `TODO(css-conditional-5)`：出貨後
hack 塊加 writing-mode 條件，直排 × inter-character 的破圖從「文檔告誡」
升級成「CSS 自動讓位」。

### 3. `over`（橫排）＝注音橫列

橫排 interlinear 注音是**橫著跑**的（ㄏㄢˋ 左至右、聲調在後），非直行側註
的旋轉版。over ＝ 預設無規則，天然如此；只要確保 gate 外不殘留
`writing-mode` / 字體宣告即可。

## 驗證項

1. **翻預設後的既有樣張**：只有 `manual/demo/ruby.md`（首頁無注音）——
   改成 over／inter-character 二式對照，不必「保原貌」。
2. **Safari 直排 ＋ inter-character（設錯位置的情境）**：實測 spec 的 over
   等效真的落地（headless 量測 rt 位置；WebKit ≠ Safari 的前科要記得，
   最終手測）——這決定文檔告誡的措辭强度。
3. **`Han Zhuyin Serif` 二式調號實測**：字體以 GSUB 依排版方向定調號位置
   ——三個組合各驗一次：inter-character 橫排（直行側註、調號在側）、over
   橫排（橫列、調號在音節後）、over 直排（直行、調號在側）。重點是 hack
   路徑：hack 把 rt 設成 `writing-mode: vertical-rl`，確認字體在這個
   合成直排 run 裡拿到的是直式調號位。
4. **gate 外零殘留**：不設值（over 預設）時 computed style 應與未載入
   han.css 的 ruby 一致（`ruby-position` 除外不需比——over 即初始值）。
5. e2e 從簡：demo 頁手測為主，量測腳本只做 rt 位置一項。

## 同步清單（實作同一個 commit）

- [x] `src/css/semantics.css`：`@property` 註冊（initial `over`）＋
      `ruby-position: inter-character` 與 `@supports not` hack 搬入 gate；
      rt 字體與 `text-orientation: upright` 留 gate 外（二式共用）
- [x] CHANGELOG：預設行為變更（inter-character → over）
- [x] `docs/api-reference.md`：§4.3 加一列（Notes 明寫 inter-character 只
      設於橫排容器）；Preface 計數 47→48；§4.3 末段「zhuyin ruby」描述
      改寫；§9 known limitations 補「fallback 引擎直排 × inter-character
      不讓位」
- [x] `skills/han-setup/SKILL.md`：zhuyin 從 Step 1b 進階表**升格為偵測
      觸發的必問題**（Step 1 加註：偵測到注音 ruby 即追問，不佔三題快速
      路徑的名額）——問 inter-character（推薦）還是 over，說明推薦理由；
      選 inter-character 且有直排子樹，var 落橫排容器不落 `:root`
- [ ] `manual/src/docs/semantics.md` ruby 節（rc0 手冊不上線，可欠）
- [x] demo：`manual/demo/ruby.md` 加 over（預設）／inter-character 對照樣例

## 後續定案：調號 salt 與 `--han-writing-mode` 鏡射（2026-08-05，已實作）

實作後發現的新事實：`Han Zhuyin Serif`（上游
[cmex-30/Bopomofo_on_Web](https://github.com/cmex-30/Bopomofo_on_Web)，
不動它）的調號需要 **`font-feature-settings: 'salt'` 才有橫排形**，且
salt **只能在「橫排 × over」開**——直排（含 inter-character 的直行
side-run）都必須關：字體的 `vert` coverage 只認原調號字符
（`uni02CA`→160），salt 先火（→155）會讓 vert 接不到手、調號卡在橫式
（fonttools 實查 GSUB 證實）。

「salt 只在橫排」需要書寫方向資訊，CSS 查不到 ⇒ 立**鏡射變數**：

| 變量 | 值 | 預設 |
|---|---|---|
| `--han-writing-mode` | `horizontal-tb \| vertical-rl \| vertical-lr` | `horizontal-tb` |

- **全庫基礎設施**，非注音專用；規則一句話「凡寫 `writing-mode` 處鏡射
  一行、值照抄」。生命週期綁 `TODO(css-conditional-5)`——任意屬性
  style query 出貨即退役。
- zhuyin 位置變數維持二值（`over` initial）；salt ＝
  `over × horizontal-tb` 兩個 initial 相與，**橫排多數用戶零配置拿到
  修正**。曾評估三值哨兵案（initial `normal`），因「橫排 over 要宣告
  才正確」而否決。
- **反例格痊癒**：inter-character gate 加 `and style(--han-writing-mode:
  horizontal-tb)`，鏡射過的直排子樹自動讓位 over，三引擎一致——原
  TODO(css-conditional-5)「文檔告誡升級 CSS 讓位」提前以鏡射實現。
- 代價（文檔化）：**未鏡射的直排**被當橫排，salt 錯形＋hack 不讓位。
  鏡射列為 §1 級前提（與 `lang` 同級），Skill 主動修。

headless 驗證五組合全過：橫排 over＝salt／橫排 ic＝hack 無 salt／直排
over（鏡射）＝無 salt／直排 ic（鏡射）＝痊癒成 over／直排未鏡射＝文檔化
錯形。

- [x] `src/css/semantics.css`：鏡射變數註冊＋兩個 gate 加方向條件＋
      over×橫排 salt 塊
- [x] CHANGELOG：Added（鏡射）／Fixed（salt）／Changed（直排須鏡射）
- [x] `docs/api-reference.md`：§1 直排前提、§4.3 兩列（計數 49）、§8、§9
- [x] `skills/han-setup/SKILL.md`：Step 2 鏡射義務（主動修）＋ zhuyin
      問題 scoping 簡化
- [x] demo 重生成驗證（含反例格痊癒）

## 不做

- **JS runtime 偵測 writing-mode**（前版計畫的 `data-zhuyin-vertical`
  pass）：配置期已知的事實不在執行期偵測；由 Skill 與文檔在配置期把 var
  放對位置。
- `under`／`alternate`：注音無此慣例，enum 不留擴充位（要加是 rc 後的事）。
