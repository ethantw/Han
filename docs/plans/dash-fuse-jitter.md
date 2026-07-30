# dash-fuse 動感化：重逢前的跳動＋撐不住的斷開 — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** station② 破折號底圖的三個動感升級——等待期兩截 rect 反覆試接、
差一點點又彈開；終於接上後照舊閃黑淡回；十秒靜候後不再瞬斷，而是「撐不住」
地顫出髮絲縫、最後鬆手斷開，無縫接回下一輪。

**Architecture:** 全部改動都在 `han/manual/public/home/dash-fuse.css` 的
keyframes 層——幾何管線（`--df-fuse` → `--df-a1`／`--df-b0` → rect
transform）與 JS 時序（dash-fuse.js 的 armed／play 兩章）完全不動。
主循環從 16s 拉長到 20s，重排為「嘗試×3 → 熔接 → 閃黑淡回 → 靜候 10s →
撐不住 → 斷開」，循環尾端＝斷開態＝循環開頭，輪點無縫。armed 等待期另給
一支永不到 1 的 `df-try` 短循環。

**Tech Stack:** 純 CSS（`@property` 註冊的 `--df-fuse` 節拍時鐘、
per-keyframe `animation-timing-function`）。無新依賴、無 JS 改動。

**不變式（用戶明定）：**

- 墨跡外緣 727／913 固定——最上、最下永遠不動（現有幾何本來就只動
  `--df-a1`／`--df-b0`，維持即可）。
- 同柱漢字的字級、位置、墨色一概不動（`<text>` 繼承柱根、rect 自管
  `--df-ink`，現況已隔離，維持即可）。
- reduced-motion／無 JS 的基態仍是「已接合的終態」（`@property`
  `initial-value: 1`，不改）。

**新時間軸（play 主循環 20s，1% ＝ 200ms）：**

| 時刻 | % | 事件 |
|---|---|---|
| 0 | 0% | 斷開態起手（承接上一輪尾端／armed 的跳動） |
| 0–2.3s | 0–11.5% | 三次撲近：.8、.9、.96，一次比一次接近，每次都彈開 |
| 2.3–2.6s | 11.5–13% | 終於接上（熔接 300ms） |
| 2.6–2.88s | 13–14.4% | 閃深灰 280ms（`--df-ink` → 1） |
| 2.88–7.28s | 14.4–36.4% | 4.4s 淡回近底色 |
| 7.28–17.28s | 36.4–86.4% | 靜候整整 10s（縫全合、墨色已淡回） |
| 17.28–19.6s | 86.4–98% | 撐不住：髮絲縫越顫越大，中段起再也合不回 1 |
| 19.6–20s | 98–100% | 鬆手，整個斷開（ease-in 墜開）→ 接回 0% |

---

### Task 1: armed 等待期的 `df-try` 跳動

**Files:**
- Modify: `han/manual/public/home/dash-fuse.css`（`@keyframes df-copy-in`
  之前新增一支 keyframes；`@media (prefers-reduced-motion: no-preference)`
  區塊裡改 armed 規則，現行約 197–198 行）

- [x] **Step 1: 新增 `@keyframes df-try`**

放在 `@keyframes df-ink` 之後、`@keyframes df-copy-in` 之前：

```css
/* 開演前的等待（data-armed 而未 data-play）：兩截一直試著接上，每次都
   差一點點又彈開——永不到 1、不閃墨，真正的重逢留給 data-play 的首輪。
   兩次幅度不同的嘗試（.78／.88）湊一輪 2.8s，避免看起來像節拍器。
   撲近 ease-out（伸手漸緩），彈開 ease-in（鬆脫墜開）——同 df-fuse
   主循環的語彙。 */
@keyframes df-try {
  0% { --df-fuse: 0; animation-timing-function: ease-out; }
  11% { --df-fuse: .78; animation-timing-function: linear; }
  14% { --df-fuse: .78; animation-timing-function: ease-in; }
  21% { --df-fuse: .06; animation-timing-function: linear; }
  39% { --df-fuse: .06; animation-timing-function: ease-out; }
  50% { --df-fuse: .88; animation-timing-function: linear; }
  53% { --df-fuse: .88; animation-timing-function: ease-in; }
  60% { --df-fuse: .05; animation-timing-function: linear; }
  100% { --df-fuse: 0; }
}
```

- [x] **Step 2: armed 規則掛上動畫**

現行：

```css
&[data-armed]:not([data-play]) { --df-fuse: 0; }
```

改為：

```css
/* 開演前：基態斷開，兩截在其上反覆試接（df-try 永不到 1）。data-play
   一蓋，動畫換成主循環，起手同為 0，交接不跳。 */
&[data-armed]:not([data-play]) {
  --df-fuse: 0;
  animation: df-try 2.8s linear infinite;
}
```

- [x] **Step 3: 目視驗證**

Run: `cd /Users/yijun/Workspace/hanzi.pro/han/manual && pnpm dev`，
開首頁滾到 station②，在鉛字盤落完**之前**盯柱子。
Expected: 破折號兩截反覆撲近又彈開，永遠差一點點；漢字與上下外緣不動。
（`data-play` 蓋上後行為暫仍是舊 16s 循環——Task 2 才換。）

- [x] **Step 4: Commit**

```bash
cd /Users/yijun/Workspace/hanzi.pro/han
git add manual/public/home/dash-fuse.css
git commit -m "feat(home): dash-fuse armed 等待期兩截反覆試接（df-try）"
```

（本 repo 規約：**不加** `Co-Authored-By: Claude` trailer。）

---

### Task 2: 主循環重排——嘗試×3、熔接、撐不住、斷開（16s → 20s）

**Files:**
- Modify: `han/manual/public/home/dash-fuse.css`（`@keyframes df-fuse`
  整支重寫，現行約 69–72 行；`[data-play]` 的 animation 簡寫改時長，
  現行約 204–207 行）

- [x] **Step 1: 重寫 `@keyframes df-fuse`**

整支替換為：

```css
/* 一輪 20s，三幕（拍點表見檔頭）：
   ① 0–2.6s 重逢嘗試——三次撲近（.8／.9／.96），一次比一次接近，每次
      都差一點點又彈開；第三次只滑落到 .3 就直接熔接，接上是「快成了」
      的延續而不是又一次從零起跳。
   ② 2.6s 縫全合（閃黑與淡回在 df-ink 那支）。
   ③ 17.28s 起「撐不住」——髮絲縫越顫越大，中段起再也合不回 1，98% 後
      整個鬆手（ease-in 墜開），100% ＝ 0 正好是下一輪 0% 的斷開態，
      輪點無縫，不再有瞬間跳斷。
   撲近 ease-out、彈開／墜開 ease-in——伸手漸緩、鬆脫加速，同檔一貫。 */
@keyframes df-fuse {
  /* 第一幕：三次撲近 */
  0% { --df-fuse: 0; animation-timing-function: ease-out; }
  1.5% { --df-fuse: .8; animation-timing-function: linear; }
  2% { --df-fuse: .8; animation-timing-function: ease-in; }
  3% { --df-fuse: .06; animation-timing-function: linear; }
  4.5% { --df-fuse: .06; animation-timing-function: ease-out; }
  6% { --df-fuse: .9; animation-timing-function: linear; }
  6.5% { --df-fuse: .9; animation-timing-function: ease-in; }
  7.5% { --df-fuse: .1; animation-timing-function: linear; }
  8.75% { --df-fuse: .1; animation-timing-function: ease-out; }
  10.5% { --df-fuse: .96; animation-timing-function: ease-in; }
  11.5% { --df-fuse: .3; animation-timing-function: ease-out; }
  /* 第二幕：熔接，然後靜候 */
  13% { --df-fuse: 1; animation-timing-function: linear; }
  86.4% { --df-fuse: 1; animation-timing-function: ease-out; }
  /* 第三幕：撐不住 */
  87.4% { --df-fuse: .97; animation-timing-function: ease-out; }
  88.4% { --df-fuse: 1; animation-timing-function: ease-out; }
  89.8% { --df-fuse: .93; animation-timing-function: ease-out; }
  91% { --df-fuse: 1; animation-timing-function: ease-out; }
  92.6% { --df-fuse: .86; animation-timing-function: ease-out; }
  93.8% { --df-fuse: .97; animation-timing-function: ease-out; }
  95.4% { --df-fuse: .78; animation-timing-function: ease-out; }
  96.6% { --df-fuse: .9; animation-timing-function: ease-in; }
  98% { --df-fuse: .55; animation-timing-function: ease-in; }
  100% { --df-fuse: 0; }
}
```

- [x] **Step 2: `[data-play]` 的時長 16s → 20s**

現行：

```css
      animation:
        df-fuse 16s ease-out infinite both,
        df-ink 16s linear infinite both
      ;
```

改為（同時把簡寫上的 `ease-out` 換成 `linear`——df-fuse 的每一段都已在
keyframe 裡自帶 timing-function，簡寫那條本來就會被逐段蓋掉，留 `linear`
把「曲線全在 keyframes 裡」寫明）：

```css
      animation:
        df-fuse 20s linear infinite both,
        df-ink 20s linear infinite both
      ;
```

- [x] **Step 3: 目視驗證**

Run: dev server 照開，滾到 station②，看滿一輪以上（≥ 40s）。
Expected: 首輪三次撲近後接上、閃黑、淡回；靜候約 10s；然後髮絲縫顫動
加劇、鬆手斷開；緊接著又是三次撲近——輪點看不出跳變。
（df-ink 的拍點此刻仍照 16s 的百分比走、閃黑時機會偏晚——Task 3 修正。）

- [x] **Step 4: Commit**

```bash
cd /Users/yijun/Workspace/hanzi.pro/han
git add manual/public/home/dash-fuse.css
git commit -m "feat(home): dash-fuse 主循環重排——三次試接、撐不住才斷開（16s→20s）"
```

---

### Task 3: `df-ink` 拍點對位新時間軸

**Files:**
- Modify: `han/manual/public/home/dash-fuse.css`（`@keyframes df-ink`，
  現行約 81–91 行——只改百分比，結構與註解裡的曲線理由照舊）

- [x] **Step 1: 重對百分比**

現行拍點 `0%, 8.25%` → `10%` → `37.5%, 100%`，改為（20s 制：熔接完成
13%，閃 280ms ＝ 1.4%，淡回 4.4s ＝ 22%）：

```css
@keyframes df-ink {
  0%, 13% {
    --df-ink: 0;
    animation-timing-function: ease-out;
  }
  14.4% {
    --df-ink: 1;
    animation-timing-function: ease-in;
  }
  36.4%, 100% { --df-ink: 0; }
}
```

其上方註解裡的 `8.25%→10%`、`10%→37.5% ＝ 6s` 等舊拍點一併改成
`13%→14.4%`、`14.4%→36.4%`（秒數不變：280ms、4.4s）。

- [x] **Step 2: 目視驗證**

Expected: 閃黑緊貼在「終於接上」那一刻之後（2.6s 處），不再滯後；
淡回完（7.28s）到開始顫動（17.28s）之間恰好安靜 10s。

- [x] **Step 3: Commit**

```bash
cd /Users/yijun/Workspace/hanzi.pro/han
git add manual/public/home/dash-fuse.css
git commit -m "fix(home): dash-fuse 閃黑拍點對位 20s 新時間軸"
```

---

### Task 4: 檔頭拍點表與敘事更新

**Files:**
- Modify: `han/manual/public/home/dash-fuse.css`（檔頭大註解裡的時序段，
  現行約 28–36 行；47 行「無 JS 契約」段不動）

- [x] **Step 1: 替換時序段**

把檔頭這一段：

```
 * 時序（dash-fuse.js）：柱不等鉛字排完，data-armed 一蓋就以斷開態示人；
 * 鉛字落完才蓋 data-play 首播接合，此後一輪 16s。拍點（16s 為 100%）：
 *
 *     0     斷開（fuse 瞬間歸零——斷開本來就是突發的，漸變反而假）
 *     0.8s  熔接 520ms
 *     1.32s 閃一下深灰（280ms 竄到 --palette-ink-grey），
 *           再 4.4s 慢慢淡回原來的近底色
 *     6s    完全淡回，開始靜候
 *     16s   下一輪 —— 也就是「淡回之後再等 10 秒」
```

替換為：

```
 * 時序（dash-fuse.js）：柱不等鉛字排完，data-armed 一蓋就現身，兩截即
 * 開始反覆試接（df-try，永不到 1）；鉛字落完才蓋 data-play 進主循環，
 * 此後一輪 20s。拍點（20s 為 100%）：
 *
 *     0      斷開態起手（承接 df-try 的跳動／上一輪尾端的鬆手）
 *     0–2.3s 三次撲近（.8／.9／.96）——一次比一次接近，每次都差一點點
 *            又彈開
 *     2.6s   終於接上；閃一下深灰（280ms 竄到 --palette-ink-grey），
 *            再 4.4s 慢慢淡回原來的近底色
 *     7.28s  完全淡回，靜候整整 10 秒
 *     17.28s 撐不住了——髮絲縫越顫越大，中段起再也合不回去
 *     20s    鬆手斷開＝下一輪的 0%，輪點無縫，沒有瞬間跳斷
```

- [x] **Step 2: Commit**

```bash
cd /Users/yijun/Workspace/hanzi.pro/han
git add manual/public/home/dash-fuse.css
git commit -m "docs(home): dash-fuse 檔頭拍點表對齊新時間軸"
```

---

### Task 5: 整輪驗證（目視＋節拍取樣）

視覺效果沒有既有 e2e 基建（playground e2e debt 已另案記錄），驗證走
「目視＋console 取樣」兩層；不為此新建測試框架（YAGNI）。

- [x] **Step 1: 目視走完整劇本**

Run: dev server，硬重整首頁，正常滾讀到 station②。
Expected 順序：柱以斷開態現身即開始試接（鉛字還在落）→ 鉛字落完後
首輪三次撲近 → 接上、閃黑、淡回 → 靜候 → 顫動加劇 → 鬆手斷開 →
再試接……至少看兩個輪點確認無縫。另開一次 deep link 直達 station②
（跳過鉛字儀式的 1s 短窗路徑）確認不卡在等待態。

- [x] **Step 2: console 取樣拍點**

DevTools console 貼：

```js
const $svg = document.querySelector('svg[data-name="dash-fuse"]')
const t0 = performance.now()
setInterval(
  () => console.log(
    ((performance.now() - t0) / 1000).toFixed(1),
    getComputedStyle($svg).getPropertyValue('--df-fuse'),
  ),
  200,
)
```

Expected（以 data-play 蓋章起算的一輪）：0–2.3s 之間多次起落且峰值
< 1；13%（2.6s）–86.4%（17.28s）恆為 1（中段 10 秒靜候）；86.4% 後
起落且回不到 1；輪點前後皆 ≈ 0（無跳變）。

- [x] **Step 3: reduced-motion 回歸**

macOS 系統設定開「減少動態效果」（或 DevTools Rendering →
`prefers-reduced-motion: reduce`），重整。
Expected: 柱靜止於已接合終態（`--df-fuse` initial-value 1），無任何
跳動——與改動前一致。

- [x] **Step 4: 收尾**

全部通過後回報用戶過目；毋須 push（等用戶說 OK）。

---

## 明確不做（scope guard）

- **`manual/demo/dash-fuse.html` 不動。** 它是幾何推導的沙盒（自己的
  `--fuse` 單程時鐘＋replay 鈕），節拍早與正式版分家；要同步是另一件事。
- **dash-fuse.js 不動。** armed／play 的蓋章時機與新動畫的分工不變。
- **不加隨機性（JS 驅動的 jitter）。** 兩支 keyframes 內建幅度變化已
  足夠打破節拍器感；真隨機要 JS 每輪改變數，違反本檔「幾何與動畫全在
  CSS」的契約，除非用戶看完覺得還不夠活再議。

---

## 完工記錄（2026-07-31）

五個 task 全數落地，分支 `dash-fuse-jitter` 四個實作 commit（df-try／主循環
／df-ink 對位／註解對齊），逐 task 過 spec ＋品質雙審。與計畫的偏差：

- **驗證改制**：各 task 的 dev-server 目視改為 headless Chrome real-time
  取樣（`--virtual-time-budget` 對 @property 動畫不可靠——動畫時鐘會凍在
  0% 或晚起跑；配方＝本地 server 拖住 load event ＋ `--dump-dom` 收 JSON）。
  斷言 (a)–(h) ＋ reduced-motion ＋靜態檢查全過：armed 峰值 .78／.88 恆
  < 1、閃黑只落在縫全合期間、靜候恰 10.0s、輪點兩側 ≈ 0 無跳變。
- **Task 4 吸收三個審查發現**：媒體區塊上方漏網的「16s 一輪」、armed 註解
  誠實記錄交接可能瞬彈回 0（原稿「交接不跳」寫過頭）、第三幕顫開用
  ease-out 是抽搐不是鬆脫的語彙註記。

**留給人眼的美學驗收**（程式驗不了，滾到 station②）：armed 撲接讀起來
是「想接上」還是雜訊；armed→play 交接若落在撲近中段的瞬斷觀感；第一幕
2.3s 三連撲會不會糊成一團；.3→1 的熔接是否讀成「快成了」的延續；第三幕
髮絲顫（0.003–0.007em）在實際字級下是否可見；輪點連看兩圈；reduced-motion
一眼。
