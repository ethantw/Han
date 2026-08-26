# 錨定定位裁不了東西：`anchor()` 與 `overflow` 的包含塊之爭

*2026-08-26，量於 Chromium（Playwright 1.5x），首頁站②的破折號柱。*

## 一句話

**要裁一個絕對定位的元素，裁切盒必須是它的包含塊；而 `anchor()` 只接受
「包含塊的後代」當錨點。**兩個條件互斥，所以「把某個遠方元素的邊當成裁切線」
這件事，錨定定位做不到——與支援度無關。

## 現場

站②的破折號柱（`.DashColumn`）是一句 62 格的直排文字，字級 128px，整柱 7,936px
高，往上長到頁面上緣之外。攔它的只有站台自己的 `overflow: clip`，切在站台上緣，
於是最上面幾個字會爬過「超迴路運行廿載」那張樣張卡。要切在**那張卡的下緣**。

那條線的位置由內容決定（卡片下緣到文案上緣之間隔著整座鉛字盤，827px），CSS 算不
出來。看起來正是錨定定位的場合：卡片掛 `anchor-name`，裁切盒把上緣釘上去。

## 為什麼不行

實測（同一頁、同一個宣告，只換位置）：

| 測試盒放哪裡 | `top: anchor(--df-ceiling bottom)` 的 computed 值 |
|---|---|
| `<section>` 底下（錨點是 section 的後代） | `845.95px` ＝ 卡片下緣 ✔ |
| `.PunctFix` 底下（錨點不是它的後代） | 宣告作廢，掉回 static position ✘ |

CSS Anchor Positioning 的「acceptable anchor element」要求錨點是**定位元素之包含塊
的後代**。於是：

- 裁切盒放進 `.PunctFix`（＝柱的包含塊那一支）⇒ 錨不到外面的卡片。
- 裁切盒放到 `<section>` 底下 ⇒ 錨得到卡片，但柱一旦搬進這個盒，柱的包含塊就換成
  了盒，柱要用的第二個錨（文案 `.PunctFix` 的上緣）又落到盒外面 ⇒ 換它作廢。
- 讓盒不當包含塊（`position: static`、或讓柱 `position: fixed`）⇒ 絕對／固定定位的
  後代本來就不受非包含塊祖先的 `overflow` 裁切，於是根本沒裁到。

三條路互相封死。**凡是「裁切線在另一支 DOM 分枝上」的需求，就得量。**

## 那就量

一個數字，`ResizeObserver` 重算，CSS 端 `clip-path: inset(var(--df-clip-top) 0 0 0)`
（`@property` 註冊 `<length>`、initial-value `0px` ⇒ 沒有 JS 就是不裁）。
`clip-path` 不動 layout box，所以「寫完屬性再讀回盒」不會回授成迴圈。
→ `manual/public/home/dash-clip.js`、`manual/public/home/dash-fuse.css § 上緣的切線`。

## 順帶：能省的那一半

同一根柱的**位置**沒有量：破折號是句中第 34 格，整柱往上推 34 格就落在文案上緣
往下 4.5rem——位置跟著字級走。會需要量的只有「跨分枝的那條線」。

## 反過來說：同一條規則也告訴你什麼時候能用

站③那張放大九倍的樣張要「以前景樣張卡為中心」擺放——同樣是拿另一個元素的邊當
基準，這次成立：那塊放大樣張是站台的絕對定位子代，包含塊就是站台，而樣張卡也是
站台的後代 ⇒ 錨得到。

```css
figure { anchor-name: --lines-card; }
div[role="presentation"] {
  /* 版口線落在樣張中線鏡射到另一側的位置 */
  inset-inline-start: calc(2 * anchor(--lines-card center) - var(--_wm-col));
}
```

實測 1440 版口線 552 ＝ 2 × 276、1680 792 ＝ 2 × 396。`anchor()` 可以進 `calc()`
做乘法與 `min()`（`CSS.supports` 三種寫法皆 true），所以「鏡射」「夾在某個上限
之內」這類算式不必落到 JS。

**判準只有一條**：錨點是不是定位元素**包含塊的後代**。是 → 純 CSS；不是 → 量。
