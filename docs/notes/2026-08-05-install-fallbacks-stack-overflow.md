# `installFallbacks` 在大文檔上爆棧（實測門檻與分塊解法）

**日期**：2026-08-05
**發現處**：`manual/demo/bare.html`（三語言包全文，12,251 節點）
**狀態**：已文檔化＋頁面側繞過；**庫端未修**

## 症狀

```
RangeError: Maximum call stack size exceeded
    at Object.ignoreDefault [as ignore] (han.js)
    at Object.ignore (han.js)
    at ignore (han.js)
    …
```

`installFallbacks($main)` 一次跑完整份文檔時拋出。**最惡劣的地方是它
部分成功**：拋出前已經包好的 `<h-char>` 留在 DOM 裡，畫面只是「排版做得
不太乾淨」，不是整頁壞掉——所以很容易被當成 CSS 沒生效而找錯方向。

實例：bare 頁在修好之前，繁中包只拿到 **63** 個 `<h-char>`；分塊之後是
**620** 個。也就是說九成的擠壓／懸掛一直在靜默地掉。

## 量測（Chromium，2026-08-05）

以 `refinePunctuation` 對 clone 出來的子樹逐一施測，二分搜尋：

| 子樹 | 節點數 | 結果 |
|---|---|---|
| 繁中語言包 | 860 | ✓ |
| 日文語言包 | 2,499 | ✓ |
| 韓文語言包 | 8,887 | **✗ RangeError** |
| 韓文包最大的一篇 article | 3,324 | ✓ |
| 二分：117 段 | 7,901 | ✓ |
| 二分：118 段 | 7,480 | **✗** |

**門檻約 7,500 節點／單次呼叫**（同一數量級內會隨節點種類浮動，兩個二分
端點的節點數會交錯是因為每段的節點數不等）。

**與巢狀深度無關**：整份文檔最深只有 **10 層**。走訪是逐節點遞迴的，堆疊
深度隨的是**節點總數**（PureScript 編出來的串列遞迴不是尾呼叫），不是樹高。

## 頁面側解法：分塊安裝

```js
for (const $chunk of document.querySelectorAll('[data-lang-pack] > *')) {
  refinePunctuation($chunk)
  applyISSWithProbe($chunk)
  markAdjacentLines($chunk)
}
```

**切點必須落在區塊邊界**（`article`／`section` 這一層），不能任意切碎：
`markAdjacentLines` 比對的是兄弟關係，相鄰的 `<u>`／`<ins>` 對若被切到
兩次呼叫裡就會漏判。article 與 section 的邊界天然不會有跨界的相鄰裝飾線對。

bare 頁的實作另外把 `<han-console target>` 指向一個不存在的元素，讓元件
內建的整包安裝停手（`console-config.js` 的 `if (!$target) return`），改由
`bare.js` 用元件同一份 `selectedPasses` 逐塊安裝——jsMode／逐支勾選的語意
不會漂移。

## 庫端該怎麼修（未做）

`src/ts/fallbacks.ts` 的瀏覽器分支可以自己分塊，但**不能無腦切**：

1. `markAdjacentLines` 的跨塊兄弟關係（同上）——切點要挑區塊層級元素，
   或在切完之後對邊界另做一次比對。
2. `refinePunctuation` / `applyISS` 逐塊安全（它們只看文字節點與相鄰字元，
   不跨元素邊界推理），但 `applyISSWithProbe` 的探針有 memo，逐塊呼叫只會
   跑一次，沒有額外成本。
3. 真正的根治是把 hyperly 的走訪改成迭代（顯式堆疊）或尾遞迴——那是上游
   套件的事。

門檻 7,500 節點在真實世界並不安全：一篇長文檔、一章小說、一頁 API 參考
都可能越過。**建議 rc0 前處理**，至少要有一個不會靜默半途而廢的行為
（例如自動分塊，或至少在超量時明確拋錯並指向這份筆記）。
