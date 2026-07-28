# 可懸掛標點前接閉括號／句末點號：擠壓失效（mirror bug）

昨天修好的是 `，「`（可懸掛標點**後**接開括號）。今天的鏡像是 `對」，要` 這種
`」，`——**閉括號後接可懸掛標點**，閉引號的成對擠壓也失效。
`hangable-before-open-bracket.md` 第 37–40 行已記下同源、未修。

## 一、病根與兩條硬約束

同一病根：`，` 被包進 `<h-layer position:absolute>`、脫離行內流，引擎擠不動
它——只是這次斷的是它與**前一顆** `」` 的擠壓。裸基線 `。，` 1.5em，包裹後 2em。

- **不能改修 `」`（在目前的 hang markup 路徑）**：declared-`auto` 在有原生
  `text-spacing-trim` 的引擎會降級成 hang 的 markup（`wrapHangable` 只包
  hangable 那顆），`」` 是裸文字節點，無元素可選。
- **不能用負邊距**：`ff0a1ea` 已證負 `margin-inline-*` 破壞 `text-align:
  justify`（整行被撐開、標點前的字漂移 ~0.45em）。

## 二、定案（2026-07-28）

### 決策 1：機制＝把前一顆 squeezer 包成 in-flow `<h-char>` ＋ `letter-spacing: -.5em`

**han v3 實績驗證**：v3 正是用 `letter-spacing: -.5em`，**無 justify drift、
無行尾問題**（行尾的 trailing letter-spacing 被引擎 trim 掉）。採用之。

相對昨天（修 hangable 的 trailing 填充物），本次改修**前一顆 squeezer**：

- squeezer 包成**普通 in-flow** `<h-char>`（**不** abspos、**不** inline-block），
  給 `letter-spacing: -.5em` 抵掉它自己的 trailing ½em → `」，` 隙合回 1.5em。
- 因為它留在流內、也不是原子行內盒，**它自己前面的標點仍能正常擠壓**
  （pair-squeeze 跨得過純 inline span，見 `diantenjeom/docs/
  pair-squeeze-and-markup.md`）。這是選 squeezer 而非 hangable 的關鍵好處。
- squeezer 恆在行中（在懸掛的 `，` **之前**），**不是**那顆懸掛字 → 天然無
  行尾懸掛交互（我原本 h-layer 前移方案的最大風險，就此消失）。

→ 因此**放棄** h-layer 前移／`data-preceded-by`／`margin-inline-start` 那套
（見文末「已否決」）。hangable 那顆這次**完全不動**。

### 決策 2：修正只在「要擠壓」時（declared `auto`）才做；純 `hang` 一律忽略

`--han-punctuation-refinement` 這個 cascade 變數寫的是 **declared** mode
（`refinePunctuation` 的既有設計：cascade 記 declared、JS recipe 用 effective，
見 `punctuation.ts` `effectiveJSMode` 的註解）。所以：

- **CSS 用 `@container style(--han-punctuation-refinement: auto)` gate 所有
  擠壓修正**——包含今天的 `letter-spacing`，**也包含昨天的 `data-followed-by`
  填充物**。
- 使用者顯式選 `hang` ＝ 只要懸掛、不要擠壓 → 修正一律不觸發，`」，`／`，「`
  維持 full-width（**正確**）。這也順帶簡化：純 hang 路徑什麼都不用包/不用報。

> 註：昨天的 `data-followed-by` 修正目前是「只要懸掛開就觸發」（auto ＋ hang
> 都觸發）。本次要把它一起改成 **gate 在 auto**。屬同一提交的小連動。

## 三、要改的程式碼

### 1. 把「要不要擠壓」傳進 hang recipe

`effectiveJSMode` 把 `auto`／`hang` 都塌成 `hang`，資訊丟了。改成把
**declared 是否 auto**（＝squeezeWanted）傳進 recipe：

- `refinePunctuation` 已握有 `declared`；`dispatchByPunctMode` 對 hang 這格
  改成 `wrapHangable(squeezeWanted)`。
- `squeezeWanted = declared === 'auto'`（effective 已是 hang，但 declared 才
  是意圖）。

### 2. `wrapHangable(squeezeWanted)`

- `squeezeWanted === false`（純 hang）：**維持現狀**，只包 hangable 那顆、
  不報 `data-followed-by`、不包前一顆。最省。
- `squeezeWanted === true`（auto 降級）：改成**成對包**——匹配「(可選的
  squeezer)＋(hangable)」，把 squeezer 包成 in-flow `<h-char data-punct="close|end"
  ...>` 並標記需要 letter-spacing，hangable 照舊 abspos 包＋（沿用昨天的）
  `data-followed-by`。
  - regex 需帶前一顆：`([${SQUEEZE_BEFORE_HANGABLE}])?([、，。．])(?![${blockers}])(?=(.?))`
    （或改走 run 掃描，處理連續標點的重疊，見「風險」）。
  - squeezer 的標記：比照 `data-followed-by`，在 squeezer 上發
    `data-followed-by="hangable"`（語意＝「我後面那顆是被絕對定位包起來的
    hangable，原生擠壓跨不過去」）。CSS 選 `h-char[data-punct~="close"|"end"]
    [data-followed-by="hangable"]`。命名待裁示（見六）。

### 3. 哪些前接字會擠（中点類式收窄，**必量**）

昨天教訓：`PUNCT_MIDDLE_CHARS` 混了會擠與不擠的，補半個 em 給不擠的會過窄。
本次同樣拿裸基線量「哪些 squeezer 真的會擠一個後隨可懸掛標點」：

| 前接（→ 後隨 `，/。`） | 需量 | 只有量到 ~1.5em 者才包＋letter-space |
|---|---|---|
| 十個閉括號 `」』》〉）〕］｝】〗` | ✅ | |
| 句末點號 `、，。．：；？！︰` | ✅ | 逐個量，可能只子集會擠 |
| `ー`／`middle` 桶 | ✅ | 極可能不擠，比照昨天六個排除 |

量測沿用 `diantenjeom/scripts/check_squeeze.py` ＋ headless-Chrome client-rect。
產出 `SQUEEZE_BEFORE_HANGABLE` 字元集。

### 4. CSS（§ 標點懸掛）

```css
@container style(--han-punctuation-refinement: auto) {
  /* 前接被絕對定位 hangable 打斷原生擠壓 → squeezer 自抵 trailing ½em。
     v3 實績：letter-spacing 不觸 justify／行尾。 */
  h-char:is([data-punct~="close"], [data-punct~="end"])[data-followed-by="hangable"] {
    letter-spacing: -.5em;
  }
  /* 昨天的 followed-by 修正一併搬進本 auto gate（原本無 gate）。 */
  h-char[data-punct~="hangable"]:is([data-followed-by="open"], [data-followed-by="middle"])::after {
    font-family: Han Half Em Space, Han Half Em Space Fallback, monospace;
  }
}
```

### 5. 型別／清理

- `PunctSubtype` 不動；`data-followed-by` 值域多一個 `hangable`（或另立屬性，見六）。
- `uninstallFallbacks` 已移除整顆 `h-char`，屬性隨之消失。
- idempotent：`optionsIgnoringHChar` 照舊略過既有 `h-char`。

## 四、範圍可能比想像小：mirror 大概是 native-only

- **non-native（老引擎，auto → `wrapBoth`）**：`」` 本來就被包成
  `<h-char data-punct="close">`，且 compress 區塊的 `margin -.5em ＋ 填充物`
  是 **net-zero**（不減量測寬度、不 drift），`，` 的盒被負邊距一起拉 → 很可能
  **現狀已正確**。要量確認。
- **native（auto → `wrapHangable`）**：`」` 裸、原生擠壓跨不過絕對 `，` → 這才是
  真正要修的一格，也是決策 1／2 針對的路徑。

所以 §三.2 的「成對包」只需在 **squeezeWanted 且 native** 時做；non-native 的
auto 走 `wrapBoth` 原樣。實作時以「squeezeWanted」為條件即可，native 與否交給
effective mode 已經分好的路徑。

## 四之二、實作與量測記錄（2026-07-28）

**已實作（scoped）**：`wrapHangable(squeezeBefore)`——auto 降級成 hang 時
（`declared === 'auto'`），run-walk 把每顆 hangable 前的 squeezer 包成純 inline
`<h-char … data-followed-by="hangable">`；CSS 於
`@container style(--han-state-hanging-punctuation: on) and
style(--han-punctuation-refinement: auto)` 內 `letter-spacing: -.5em`。昨天的
`data-followed-by` 填充物修正也一併移進此 auto gate（純 hang 不再觸發）。
機制已在瀏覽器驗證（`hanging.spec.ts` mirror：`」` 包成 in-flow h-char、
`letter-spacing:-9px`、`margin:0`、`position:static`）。單元 5 條、e2e 1 條綠。

**量測未能定案（誠實記錄）**：headless 量測想比對「修正後」vs「裸基線」的
pair 寬度，但harness 用 `display:inline-block` 的量測列**沒能觸發原生
text-spacing-trim**——連昨天確認會擠的 `。「`（open）在此 harness 也量到 6em
（未擠）。所以無法可靠取得裸基線，不能像昨天那樣 pixel 確認 `」，` 回到
1.5em。已知可靠的只有「letter-spacing 機制正確套用 ½em」。

**因此 squeezer 集合採保守解**：`SQUEEZE_BEFORE_HANGABLE = 十個閉括號 +
、，。．`（使用者回報的 `」，` ＋ 文檔的 `。，`，JLREQ 上無疑義）。
`：；？！︰` **暫不納入**——量測不能背書、且「漏擠一個罕見對」比「錯擠半格」
安全（`PUNCT_INTERPUNCT_CHARS` 教訓的反面）。日後以正確 harness
（非 inline-block、改用 Range 量寬、確認 webfont 載入）量過再決定是否擴充。

**待你確認/後續**：
- 合併前建議在真實 app 目視 `對」，要` 是否回到 1.5em。
- 疑似更大的坑：原生 trim-start 似乎**只擠開括號的前導空**、不擠閉括號/句讀
  的尾隨空（我 harness 未能反證，但 `」，` 非 hangable 跟隨時可能也沒擠）。
  本次 scoped 修正只涵蓋「後接 hangable」那一片；一般閉側擠壓在 native 上是否
  普遍缺失，值得另開量測。

## 五、驗收

- [ ] `」，`／`。，`／`，，`／`）、` 行中合計回到裸基線（等同無 han.css）
- [ ] 行尾那一格與改前逐像素相同（letter-spacing 行尾應被 trim；實測確認）
- [ ] `text-align: justify` 下無 drift（沿用 `ff0a1ea` 齊行 fixture）——v3 已驗，補測固化
- [ ] 純 `hang`（declared）：`」，`／`，「` **不**被修正，維持 full-width；
      且不多包 squeezer、不報屬性
- [ ] 不會擠的前接字（量到 2em 者）不被包＋letter-space
- [ ] squeezer 前面若還有標點，其擠壓仍正常（純 inline span，不破 pair-squeeze）
- [ ] 昨天的 `，「` 修正改 gate 在 auto 後，auto 下仍正確、hang 下不觸發
- [ ] non-native 路徑（`wrapBoth`）mirror 現狀即正確（量測背書）
- [ ] idempotent；單元測試：兩路徑屬性值、squeezeWanted 分支、文首無前字不發屬性

## 六、待裁示

1. **squeezer 標記命名**：重用 `data-followed-by="hangable"`（語意一致、值域擴一個）
   vs 另立 `data-precedes-hangable` 布林。我傾向前者。
2. **`data-followed-by` gate 搬進 auto**：確認昨天的修正也一起改成只在 auto
   觸發（純 hang 不修）——依你今天的指示，是。
3. **前接字範圍**：先做「閉括號＋句末點號」，`middle`／`ー` 依量測納入或排除。

---

## 附：已否決的方案 A（h-layer 前移）

原思路：在 hangable 的絕對 `<h-layer>` 上 `margin-inline-start: -.5em`
（layout-neutral、不觸 justify）。**否決**——雖繞開 justify，但那顆是**會懸掛的
字**，行尾懸掛時字形會被一起挪半格 → 需偵測行尾 gate，CSS 難做。改修前一顆
in-flow squeezer（決策 1）後，此風險整個消失，故不採。
