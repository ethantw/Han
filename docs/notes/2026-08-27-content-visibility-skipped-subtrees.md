# 被跳過的子樹裡，量不到東西，也不會動——`content-visibility: auto` 的兩個坑

**日期**：2026-08-27

`content-visibility: auto` 的宣傳詞是「畫面外的東西不參與版面」。實際的
語意更硬：那棵子樹**整個停掉**——不排版、不跑動畫、不重繪。它只是一條
效能宣告，卻同時關掉了兩件在別處看起來與效能無關的事。首頁的字標「漢」
就是這樣消失的。

## 症狀

首頁 hero 的 `.Brand` 中間空一格，寬度完全正常，`⋮[` 與 `.css` 都在，只有
中間那個 SVG「漢」不見。同一次載入還會連帶：浮水印的「漢」一筆未落、
`data-han-traced` 不被標上、站①的信封永遠摺著。

**重現**：捲到頁面中段 → 刷新（瀏覽器**先還原捲動位置，才輪到 DCL**）→
捲回頁首。等效路徑：直接開 `/#station-fonts`，載入完再捲回頂端。在頁首
刷新則一切正常——這就是「有時候刷新又好了」的來源。

## 坑一：新插入的節點沒有盒，舊節點卻還報得出座標

`home/brand-glyph.js` 量字標的基線，用的是老辦法：插一個零尺寸、
`vertical-align: baseline` 的 inline-block 當探針，它的盒頂就是基線。

子樹被跳過時：

- 探針是**剛插進去的**，從來沒排版過，`getBoundingClientRect()` 回傳
  **全零的空 rect**；
- `$mark` 是舊節點，回報它**上一次排完**的離屏座標（負的）。

兩者相減得到的不是基線，是**捲動位移**：

```
--brand-glyph-top: 128.2294em   // ≈ 4104px，正常值 0.0575em
mark  getBoundingClientRect().top = 186
glyph getBoundingClientRect().top = 4289
scrollY（刷新時被還原的值）        = 4317
```

`.BrandGlyph` 是 `position: absolute`，於是被推到一頁半以外，再被那一節
自己的 `overflow: clip` 吞掉。

**空格看起來正常，是因為寬度根本不是 SVG 給的**：`[data-part="mark"]` 裡
還有一個 `color: transparent` 的真「漢」，供無障礙與選取用，位子是它佔的。
所以「盒子在、字不見」這個組合會誤導人往 `fill` / 主題色 / 合成層去查，那
三條全是死路。

一次寫壞就永久有效：`var()` 的 fallback 只在自訂屬性**未設定**時生效，
一旦被寫成 `128.2294em`，CSS 裡那條 `calc()` 就再也沒有機會。

## 坑二：被跳過的子樹不跑動畫，於是 `animationend` 永遠不來

`home/fonts-gate.js` 的開場儀式等的是最後一筆的 `animationend`。動畫在被
跳過的子樹裡根本沒開始——不是「跑完了沒聽到」，是沒跑。實測跳過狀態下第
6 秒：12 筆全部仍掛著 `data-pass="writing"`（`stroke-dashoffset: 1`，一筆
未落），`data-han-traced` 是 `undefined`。那個 promise 掛一輩子。

注意 `getAnimations()` **不是**判準：跳過時動畫物件照樣存在（實測 9 支，
`playState` 也還是 `running`），只是 `currentTime` 不前進。要判斷「這一輪
到底演了沒有」，得看儀式自己的狀態（`data-pass` 有沒有被拿掉），不能問
動畫 API。

## 修法

1. **首屏不要跳過**。`home/frame.css` 那條規則寫的是「站台」，選擇器卻是
   `main > section`，把 `.Manifesto` 一起收了進去——而首屏是唯一一個跳過
   它毫無收益的 section（它一定在初始視窗裡）。改成 `&:not(.Manifesto)`，
   兩個坑同時消失。**通則：選擇器涵蓋的範圍要跟註解講的範圍對得上**，這個
   bug 的全部成本都來自那條註解說「站台」而選擇器說「每一個 section」。
2. **量測加守門**。基線只可能落在自己的盒子裡；落在外面就代表這次量測
   發生在沒排版的子樹裡，直接放棄，讓 CSS 的 `calc()` fallback 頂著——
   拒絕寫入永遠是安全的方向。
3. **真的排版了再量一次**。仍然在 `content-visibility: auto` 底下的字標
   （站④那五個）靠 `IntersectionObserver` 補量：第一次真的進畫面，就是它
   那一節保證排過版的第一刻，量到就停止觀察。
4. **等動畫的 promise 一律要有保底**。背景分頁被節流也會讓
   `animationend` 不來。晚一點 resolve 沒有代價（sheet 落在
   `animation: none` 的靜止幀，本來就是那一格），promise 掛死才有。

守門測不出來的地方要說清楚：**headless Chromium 與 headed 的真 Chrome 都
沒能重現那個空 rect**（把 `.Manifesto` 在執行期改成 `content-visibility:
hidden` 再量，探針照樣拿得到座標）。上面那組數字來自使用者機器上的真實
Chrome 151，算術自洽（`128.2294 × 32px ≈ 4104px ≈ scrollY`）。能自動化守
住的是坑二——`tests/e2e/brand-glyph.spec.ts` 用 `/#station-fonts` 進站、
**在捲回頂端之前**驗儀式收了場（捲回去會解除跳過、讓它補演完，把證據抹
掉），期限取 9 秒：真實一輪 5–8 秒收，保底 12 秒才動，中間那道縫才分得出
「描完了」與「靠保底收的場」。

## 相關

- `docs/notes/2026-07-21-svg-glyph-baseline-alignment.md`——為什麼字標的
  「漢」是一個絕對定位的 SVG 疊在透明真字上，以及那個 0.88em 從哪來。
- `docs/notes/2026-08-07-css-silent-failures.md`——同一個家族：寫錯不報錯，
  只是「看起來沒生效」。
