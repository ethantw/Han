---
title: JavaScript
---

# JavaScript API

漢.css的JS是**補全，不是骨架**：CSS引擎尚未原生支援的行內機能，由這裡的回落補上；引擎原生支援後，同一份代碼自動讓位。全部API從主入口導出：

```js
import { installFallbacks, transpileRuby } from '@hanzi.pro/han.css'
```

## 兩個入口

| 入口 | 行為 |
|------|------|
| `@hanzi.pro/han.css` | 純named exports，不自動執行 |
| `@hanzi.pro/han.css/auto` | 載入即自動安裝（`DOMContentLoaded`），並re-export主入口全部API |

`auto`入口的行為可用`:root`上的`--han-install`變量調整：`auto`（預設，探針＋回落全上）｜`fallbacks`（只回落）｜`probes`（只跑探針）｜`none`（載入但不動作）。

## installFallbacks

```ts
installFallbacks(): Hype                 // 瀏覽器：整份文件
installFallbacks(root: Element): Hype    // 瀏覽器：只處理某子樹
installFallbacks(src: string | Hype): Hype  // SSR：傳入HTML來源
```

安裝全部DOM層回落：

- **標點擠壓＋行尾懸掛**——依`--han-punctuation-refinement`（`auto`｜`compress`｜`hang`｜`none`）單趟處理；
- **跨文種間隙**——依`--han-text-autospace`（`insert`插入間隙、`replace`替換手打空格、`strict`兩者並行）；
- **相鄰行裝飾線標記**——供semantics模組的底線間距規則使用。

每項轉換各自以`CSS.supports`與環境探針把關——引擎原生支援的項目直接跳過，不重複做。

**SSR**：無`document`環境下把來源（HTML字串或Hyperly節點）交給它，回傳轉換後的`Hype`——可在建構期一次性處理，前端零JS。SSR路徑必須明確傳入來源。

### 配套

```ts
uninstallFallbacks(root?)  // 逆轉全部DOM變更（還原空格、拆包裹、清標記）
runProbes()                // 只跑環境探針並在:root寫入結果（供CSS回落規則讀取）
```

## transpileRuby

```ts
transpileRuby(src: string | Element | Hype): Hype
```

opt-in的ruby降級器：把HTML5早期的`<rb>`／`<rtc>`表格式ruby與multi-`<rt>`寫法，改寫為當今引擎能正確渲染的interop形式（每個注音ruby一個base；額外注解層改為巢狀`<ruby>`）。

- **冪等**——已是interop形式的標記原樣通過，可安心重跑。
- **不自動執行**——未接入`installFallbacks`，需自行呼叫；適合runtime相容墊片，更適合建構期／SSR一次改寫。
- **結構檢查**——`rbspan`總數超過base數、注音`<rt>`數與base數不符、`rbspan`跨段等結構錯誤會拋錯，不靜默忽略。

```js
import { transpileRuby } from '@hanzi.pro/han.css'
document.querySelectorAll('ruby').forEach((el) => transpileRuby(el))
```

## 低階API

`installFallbacks`是總開關；它調度的三組回落各自也是公開API，供精細控制、SSR管線與測試使用。三組共用同一套命名慣例與型別：

- **無後綴**（`refinePunctuation(src)`）——**讀cascade決定**：從`src`的computed style解析對應的`--han-*`變量值，再按`CSS.supports`與探針決定JS是否介入。日常入口。
- **`*WithMode(mode)(src)`**——**呼叫者指定**：跳過cascade解析，原子地「寫入cascade變量＋執行轉換」，兩者永不脫鉤。curried設計（mode先收），便於部分套用與FP組合；SSR（無CSS環境）下這是唯一正確入口——cascade寫入自動跳過，交由客戶端hydration補寫。
- **`set*Mode(mode)(src)`**——**純設定器**：只把變量寫成`src`元素的inline style，不跑任何轉換。供「先設定、稍後統一執行」的分離式流程。

所有函式接受`Hyperly`（`string`｜`Element`｜`Hype`）、回傳`Hype`，可串進hyperly管線；重複執行冪等。

### 標點擠壓與懸掛

```ts
type RefineMode = 'auto' | 'compress' | 'hang' | 'none'

refinePunctuation(src)                     // 讀 --han-punctuation-refinement
refinePunctuationWithMode(mode)(src)       // 指定模式，cascade＋轉換原子同步
setPunctuationRefinementMode(mode)(src)    // 只寫變量
```

`refinePunctuation`解析到`none`直接短路；`auto`在原生`text-spacing-trim`可用的引擎降級為只做懸掛（擠壓交給原生），避免重複包裹引擎已處理的標點。

### 跨文種間隙（ISS）

```ts
type ISSMode = 'normal' | 'insert' | 'replace' | 'strict' | 'none'

applyISSWithProbe(src)      // 預設瀏覽器入口——installFallbacks 用的就是它
applyISS(src)               // 讀 cascade 但不跑探針，信任引擎自我聲明
applyISSWithMode(mode)(src) // 指定模式，SSR 入口
setISSMode(mode)(src)       // 只寫變量
```

兩個cascade入口的差別在**UA探針**：部分引擎自稱支援`text-autospace`，卻在行內元素邊界（如`<b>字</b>A`）丟失間隙——`applyISSWithProbe`實測一次（結果快取），命中此病則在`:root`寫入`--han-probe-autospace: broken`，CSS據此強制JS側渲染。已知探針狀態或對量測敏感的子樹，用`applyISS`跳過。

引擎原生支援`text-autospace`時，這組JS**完全不動作**、原樣回傳——不寫任何降級值進cascade，寫了會誤導style query與`:root`的變量解析。（對照：標點擠壓組在同情境下是降級續跑、只做懸掛。）

### 相鄰行裝飾線

```ts
type DecorationInsetMode = 'auto' | '0'

markAdjacentLines(src)                        // 讀 --han-text-decoration-inset
markAdjacentLinesWithMode(mode)(src)          // 指定模式
markAdjacentLinesWithSelectors(selectors)(src) // 自訂選擇器家族，繞過 cascade 與 CSS.supports
setDecorationInsetMode(mode)(src)             // 只寫變量
```

為「後面緊跟同族裝飾線」的元素（`u`/`ins`一族、`s`/`del`一族）打上`data-followed-by-adjacent-line`標記，CSS據此讓兩條線錯開。判定會穿越wrapper下潛與父層上爬，不只看直接兄弟。引擎原生支援`text-decoration-inset`時，這組JS完全不動作、原樣回傳——cascade維持作者宣告的值不被覆寫。`markAdjacentLinesWithSelectors`收自訂選擇器陣列，覆寫預設的兩個家族。

### 完整導出清單

主入口共導出十五支函式：`installFallbacks`／`uninstallFallbacks`／`runProbes`／`transpileRuby`四支總控函式，加三組回落（標點擠壓懸掛、跨文種間隙、相鄰行裝飾線）共十一支；另有型別`RefineMode`／`ISSMode`／`DecorationInsetMode`。`auto`入口re-export全部。
