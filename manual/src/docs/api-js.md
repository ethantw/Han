---
title: JavaScript
---

# JavaScript API

漢.css的JS是**補全，不是骨架**：CSS引擎尚未原生支援的行內機能，由這裡的回落補上；引擎跟上了，同一份代碼自動讓位。全部API從主入口導出：

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
runProbes()                // 只跑環境探針並在:root蓋章（供CSS回落規則讀取）
```

## transpileRuby

```ts
transpileRuby(src: string | Element | Hype): Hype
```

opt-in的ruby降級器：把HTML5早期的`<rb>`／`<rtc>`表格式ruby與multi-`<rt>`寫法，改寫為當今引擎能正確渲染的interop形式（每個注音ruby一個base；額外注解層改為巢狀`<ruby>`）。

- **冪等**——已是interop形式的標記原樣通過，可安心重跑。
- **不自動執行**——未接入`installFallbacks`，需自行呼叫；適合runtime相容墊片，更適合建構期／SSR一次改寫。
- **結構檢查**——`rbspan`總數超過base數、注音`<rt>`數與base數不符、`rbspan`跨段等結構錯誤會拋錯，不靜默吞掉。

```js
import { transpileRuby } from '@hanzi.pro/han.css'
document.querySelectorAll('ruby').forEach((el) => transpileRuby(el))
```

## 低階API

主入口另導出各回落的獨立函式，供精細控制：`refinePunctuation`／`applyISS`／`markAdjacentLines`與其`*WithMode`變體、`setISSMode`等模式設定器，以及型別`RefineMode`／`ISSMode`／`DecorationInsetMode`。一般使用`installFallbacks`即可，低階API面向測試與特殊集成。
