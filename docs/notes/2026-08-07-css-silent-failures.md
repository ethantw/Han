# CSS 靜默失效五則——寫錯了不報錯，只是「看起來沒生效」

**日期**：2026-08-07（前四則從已完成的計畫裡打撈出來，原文散在
`docs/plans/` 的四份檔案）；第五則 2026-08-12 補入

這幾條的共同點：**瀏覽器不會抗議**。宣告被丟棄、規則被吞掉、值解析成
另一個意思，畫面照樣渲染，只是少了你要的效果。除錯時最容易的誤判是
「這個特性瀏覽器沒支援」或「選擇器沒中」，往下追很久才發現東西根本沒
進 CSSOM。

## 1. `text-emphasis` 簡寫不含 position

```css
text-emphasis: circle under;      /* ✗ 整條被丟棄 */
```

`text-emphasis` 簡寫只展開 `text-emphasis-style` 與 `text-emphasis-color`
——**`-position` 不在裡面**。多出來的 `under` 讓整條宣告不合法，解析器
連 `circle` 一起丟，`text-emphasis-style` 維持 `none`。

必須寫成三條長寫：

```css
text-emphasis-style: circle;
text-emphasis-position: under right;
```

直排下的症狀特別難認：畫面只是「沒有著重號」，而該行的帶寬從 347px 掉
到 336px——沒有任何東西提示你寫錯了。

## 2. SVG 幾何屬性當 CSS 屬性寫時，長度單位不可省

`x`／`y`／`width`／`r` 這些既是 SVG presentation attribute 也是 CSS
屬性。當 **attribute** 用時吃裸數字（user unit）；當 **CSS 屬性**用時
型別是 `<length-percentage>`，非零值一律要單位：

```css
y: 75.5;      /* ✗ 無效，整條丟棄 */
y: 75.5px;    /* ✓ */
```

## 3. CSS 註解正文裡的 `*/` 會提早結束註解

CSS 沒有巢狀註解。註解**內文**裡出現 `*/`（例如在說明 `/* … */` 語法、
或引用一段含它的程式碼）就當場結束註解，其後到真正結束符之間的東西被
當成規則來解析，整段丟棄。

實例（首頁字體等待器）：這件事兩次讓一條 `animation: none` 消失，畫面
回落到 `manifesto.css` 的入場動畫（末筆 delay 3.78s），症狀是「開閘瞬間
漢字變空白再重描一次」——看起來完全像動畫時序沒配好。

**診斷法**：`element.matches(selector)` 回 `true`（選擇器沒問題），但
CDP 的 `CSS.getMatchedStylesForNode` 回來的 `matchedCSSRules` 裡沒有那
條——這是 parse 失敗的鐵證。

⚠️ **不能靠 CSSOM 自省**：`rule.style.animation` 在值含 `var()` 時一律
讀回空字串，所以「讀到空的」不能區分「規則被丟棄」與「值是 var()」。

## 4. 雙值 `color-scheme` 讓 shadow DOM 的 `light-dark()` 讀作業系統

`color-scheme: light dark` 寫在 `html` 上，意思是「這兩種我都支援」——
於是 shadow root 內用 `light-dark()` 寫的**字面回退值**會依**作業系統
偏好**解析，而不是頁面已經釘選的主題。

症狀：手冊切成暗色，shadow 裡的髮絲線仍是亮色的那一支。

正解是單值翻轉——`:root { color-scheme: light }` ＋ `:has()` 覆寫成
`dark`——因為 `color-scheme` 會跨 shadow 邊界繼承。配方見
`hanzi.pro/web-style.md` § Dark mode；那裡給的是**正確**寫法，這裡補的
是寫錯時會怎麼**靜默**失效。

## 5. `@property` 的 `initial-value` 不能是 `em`；註冊 `<length>` 會凍住 `em`

做 `--han-structural-indent`（引文／圖表／清單共用的縮排格線，見
`src/css/semantics.css` § Grouping content）時想用 `@property` 把值的形狀
（單一長度）鎖起來，兩條路都不通，而且**兩條都不報錯**。

**一、`initial-value` 必須 computationally independent。** 寫
`@property --x { syntax: "<length>"; inherits: true; initial-value: 2em }`
整條 `@property` 規則會被丟棄——`em` 依賴 font-size，不合規。後果不是
「初始值變別的」，而是**這個變數從未被註冊過**：所有 `var(--x)` 成為
未定義，凡是把它拼進組合值的宣告全部 IACVT，非繼承屬性歸 initial。實測
畫面就是縮排整片變 0。

**二、就算改用合法的 `initial-value: 0` 再靠 `:root` 補 `2em`，也不能註冊。**
註冊過的 `<length>` 在**宣告處**就絕對化，`:root` 的 `2em` 算成 32px 之後
以計算值往下繼承，縮排從此不隨元素字級縮放。未註冊的自訂屬性繼承的是
token stream，`em` 要到消費點才解析——那才是縮排該有的行為。

實測（元素 `font-size: 32px`，量 `margin-inline-start`）：

| 寫法 | 量到 |
|---|---|
| 註冊 ＋ `initial-value: 2em` | **0px**（註冊整條被丟棄） |
| 註冊 `<length>` ＋ `:root { --x: 2em }` | **32px**（凍在根的 16px） |
| 未註冊 ＋ `:root { --x: 2em }` | **64px** ✓ |

同一份檔案裡的 `text-underline-offset` 是這條的近親：它是繼承屬性、以
計算值繼承，所以 `.125em` 只在 `:root` 宣告一次也會凍成 px——那邊的解法
是在 `:where(*)` 上逐元素重宣告。註冊屬性等於讓**任何**自訂屬性都染上
這個性質。

推論：**凡是想保留 `em`／`ch` 等字級相對行為的自訂屬性，就不能註冊。**
`@property` 的型別檢查與 `em` 的延遲解析在現行規格下不可兼得，代價要
付在哪一邊得自己選。

## 同族

`~/.claude` memory 的 `css-container-var-traps.md` 記了另外四條同性質的
（`@container` 相對選擇器被丟棄、未定義 `var()` 毒化整個組合值、`:root`
代換定型、`:where(::pseudo)` 被寬容忽略）。合起來看，這一族的通則是：
**CSS 的錯誤處理是「丟棄並繼續」，所以任何「沒生效」都要先懷疑它根本
沒進 CSSOM，而不是先懷疑支援度。**
