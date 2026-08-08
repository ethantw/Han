# SSR：字串來源會掉一顆根標記，於是版面與瀏覽器端差 2px

2026-08-08，做手冊的伺服器端樣張（`/specimen.ssr.html`）時量到的。

## 症狀

同一份標記，兩種送法：

- `/specimen.html` — 瀏覽器載入 han.js，`installFallbacks(main)`。
- `/specimen.ssr.html` — Node 在建置時 `html(installFallbacks(mainString))`。

22 個區塊的高度逐一相同，只有一處不同：wavy 書名號那一對相鄰的 `<cite>`
（`同讀《武經總要》《字驗》一篇`）在 SSR 版之間多了 **2px**，第二顆 `<cite>`
的 x 由 456 變 458。

## 成因

`markAdjacentLines` 做兩件事：逐元素下
`[data-followed-by-adjacent-line]`，以及在**來源的根元素**上下一顆總開關
`[data-adjacent-lines-refined]`（`src/ts/semantics/adjacent-lines.ts`
的 `$src.setAttribute(ADJACENT_LINES_REFINED, '')`）。

來源是 DOM 節點時，根就是呼叫者的容器，標記留得住。來源是**字串**時，
hyperly 解析出來的根是一顆合成的 `<body>`，而序列化吐的是它的 innerHTML
——標記隨那顆 body 一起蒸發。逐元素的那些標記不受影響，掉的只有總開關：

```js
html(markAdjacentLines('<main><p><u>甲</u><u>乙</u>丙</p></main>'))
// → <main><p><u data-followed-by-adjacent-line="">甲</u><u>乙</u>丙</p></main>
//   ^ <main> 上沒有 data-adjacent-lines-refined
```

那顆總開關不是裝飾。`semantics.with-js.css` 靠它把**沒被 JS 標記**的
`u`／`cite` 的 skip-gap 收回：

```css
:where([data-adjacent-lines-refined] &:not([data-followed-by-adjacent-line])) {
  margin-inline-end: initial;
}
```

沒有它，`semantics.css` 那條純 CSS 後備（`:has(+ cite:lang(zh))`，在
`--han-cite-title-marks: wavy` 的 style query 底下）就留在原地——那正是多出來
的 `--han-adjacent-lines-skip-gap-fallback: .125em` ＝ 16px 字級下的 2px。

也就是說：**JS 判斷「這一對不必加縫」，但純 CSS 後備仍然加了，因為撤銷那一
步的鑰匙掉在字串來源的合成 body 上。**

## 現況

手冊在頁面這一側補平——`manual/vite.config.js` 的 `ssrMain()` 把
`data-adjacent-lines-refined` 加回輸出的 `<main>` 標籤。補完之後
`margin-inline-end` 兩頁都是 `0px`，22 個區塊高度全等。

庫要不要改是另一件事，且不是加一行就好：字串來源沒有「呼叫者的根」可用，
真要修得決定**字串來源的根是誰**——是把標記下到每一顆頂層子元素上，還是要求
SSR 呼叫者自己包一層容器並回傳那顆容器。動的是 API 語義，不是實作細節。

## 順帶量到的

SSR 與瀏覽器的 wrapper 數量**本來就不一樣**，這不是 bug：SSR 不看
`CSS.supports`（Node 裡沒有引擎可問），三支 pass 一律跑、擠壓與懸掛兩種
wrapper 都發，由送達端的 CSS 決定哪一種吃得到；瀏覽器的 `auto` 只補引擎缺的
那些。實測本頁 Chromium：SSR 3,797 個 `h-char` ＋ 889 個 `h-iss`，瀏覽器端
2,503 個 `h-char` ＋ 0 個 `h-iss`（原生 `text-autospace` 在，ISS 一支都不必發）。
版面相同，數量不同——**驗 SSR 正確性不能比 wrapper 數，要比幾何**。
