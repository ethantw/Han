# WebKit 的 SVG 直排文字，兩處與 Chromium 不合

量測日期 2026-08-02。Playwright **WebKit 2272**（UA 回報
`Version/26.4 Safari/605.1.15`）對照 **Chromium 147**，同一頁、同一批字體
（Ziano `Shanggu Serif` ＋ Diantenjeom），`font-size: 100px`。

結論先講：**SVG 裡的 `writing-mode: vertical-rl` 在 WebKit 不能用來排 CJK。**
HTML 的直排沒有這些問題——同一支字體、同一段文字，`writing-mode` 的
`<span>` 在兩家都是每格 1em。壞的只有 SVG `<text>`。

## 一、字距讀 hhea，不讀 vmtx

`<text style="writing-mode:vertical-rl">` 的每格前進量：

| 引擎 | 每格 | 來源 |
| --- | --- | --- |
| Chromium | **100**（1.0 em） | `vmtx` 的 advance |
| WebKit | **143.7**（1.437 em） | `hhea.ascent + |hhea.descent|` ＝ 1151 + 286 |

字體本身是對的：`shanggu-serif-tc` 有 `vhea`（asc 500 / desc −500）與 `vmtx`
（136 個字符 advance 全是 1000/1000 em）。WebKit 就是不讀。

後果：七個字排成 1005.9 unit 而不是 700——任何「第 n 格在哪」的幾何全錯位。

### 繞法

| 作法 | WebKit 的每格 y | 可用 |
| --- | --- | --- |
| `<text>` 直接寫整句 | 20, 163.7, 307.4, 451.1, 594.8 | ✗ |
| `textLength` ＋ `lengthAdjust="spacing"` | 20, 109.1, 198.2, 287.2, 376.3 | ✗ 演算法不同，救不回 |
| 逐格 `<tspan y="…">` | 20, 120, 220, 320, 420 | ✓ 與 Chromium 一致 |
| 逐格**橫排** `<text y="…">` | — | ✓✓ 見下 |

## 二、不套 `vert` ／ `vrt2`

WebKit 在 SVG `<text>` 裡**完全不做直排字形代換**：「」《》：全部畫橫排字形。
明寫 `font-feature-settings: 'vert' 1` 也沒有作用（橫排 `<text>` 上試過同樣
無效）。Chromium 會套。

逐像素比對（`font-size: 90`，`text-anchor: middle`，ink 盒中心）：

| 字 | WebKit 直排 vs 橫排 | Chromium 直排 vs 橫排 |
| --- | --- | --- |
| ： | cy 207.75 / 203.25，cx 相同 | cy 203.25 / 202.75 |
| 「 | cy 192 / 187.5，**cx 227.5 兩者相同** | cy 205.5 / 187，cx 210.25 / 205 |
| ， | cy 202.25 / 197.75 | cy 198.25 / 197.25 |

WebKit 那一欄的直排輸出**就是它的橫排輸出往閱讀軸推 4.5px（0.05em）**——同一個
字符、同一個 x。Chromium 的「則換了字符（cx 也跟著變），那才是 vert 的效果。

### 那 0.05em 是什麼

`text-anchor: middle` 把「引擎給這個字的框」釘在錨點上。WebKit 給的是 hhea 框
（1.437em），Chromium 給的是字身框（vmtx 的 1em）。所以 em 框的中心掉了

```
(hheaAsc − typoAsc + 0.5em) − hheaBox/2
= 1.151 − 0.88 + 0.5 − 0.7185  ≒  0.0525 em
```

兩個量都在 DOM 裡拿得到，不必嗅 UA——橫排 `<text>` 的
`getExtentOfChar(0)` 高度是 hheaBox、上緣是 −hheaAsc，**兩家一致**；直排
`<text>` 的 extent 高度則是「這支引擎給的框」。兩者相等 ⇒ 要補；不等
（引擎用 vmtx）⇒ 補 0。實作見 `manual/public/home/lead-forme.js`
§ `measureVerticalShift`。

> 判定不要拿 1em 當基準：Diantenjeom 給「。」的 vmtx advance 是半個 em，
> Chromium 在那裡回報 ~0.5em，用 1em 判會誤判。

## 三、橫排的 SVG 文字兩家逐像素相同

同一顆字、同一個 `y`，ink 盒 top 139.5 / centre 200.3，兩家一字不差。所以
**SVG 裡要排 CJK 直排，正解是自己算格子、用橫排 `<text>`**：漢字是 UTR50
class U，本來就正立，一格一個 `<text>` 就沒有字距可累積；class R 的字符自己
`rotate(90)`。`manual/public/home/dash-fuse.js` § `layoutColumn` 就是這樣做的。

### vert 到底做了什麼——四款逐字量出來的表

自轉能不能代替 `vert`，取決於那顆字的代換**是什麼性質**。用 fontTools 逐字比
外框（Diantenjeom Serif 四款，2026-08-02）：

|  | ， | 、 | 。 | ： | ； | ！／？ | 括號類 | —…· | ． |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **JIS** | 移位 | 移位 | 移位 | **轉 90°** | 同形 | 同形 | 轉 90° | 同形 | 移位 |
| **MOE** | 同形 | 同形 | 同形 | 同形 | 同形 | 同形 | 轉 90° | 同形 | 移位 |
| **GB** | 移位 | 移位 | 移位 | **移位** | 移位 | 移位 | 轉 90° | 同形 | 移位 |
| **KLR** | 移位 | 移位 | 移位 | 同形 | 同形 | 同形 | 轉 90° | 同形 | 移位 |

移位量（字體單位，字體座標 y 向上）：`，`(+656,+668)、`、`(+635,+657)、
`。`(+591,+606)、`．`(+662,+662)；GB 的 `：`(+532,+223)、`；`(+532,+224)、
`！`(+498,+29)、`？`(+500,+45)。都落在右上角一帶——直排角標該去的地方。

三件事值得記住：

- **括號類（「」『』〈〉《》〔〕【】（））四款一律是 90° 旋轉**，自轉必定對。
  `「」『』` 的長臂為直排重畫得長約 10%（654→720），轉出來讀起來仍是同一個括號。
- **MOE 什麼都不移**。它的標點橫直同形（居中式），所以在拿不到 `vert` 的引擎上
  畫橫排字形**不是退而求其次，就是正解**。
- **`：` 的處置是各公約的簽名**：JIS 轉、GB 坐低、MOE／KLR 正立不動。KLR 那條
  就是 KLReq cl7 把 `：；·` 歸為不隨直排旋轉的一類（diantenjeom build.py 的
  `upright_cps=(0xFF1A,)`）。

一張表就夠把 SVG 直排標點在任何引擎上補齊，實作見
`manual/public/home/lead-forme.js` § `VERT_FORM`。

### 更根本的解仍在字體那頭

上面那張表是**把字體知識抄進 JS**，能用但不理想。真正的解是
**Diantenjeom 把 U+FE10–FE19／U+FE30–FE44 這些 Unicode 直排形碼位補進 cmap**
——vert 的目標字符本來就在檔案裡，只是沒有碼位指得到它。補上之後任何渲染路徑
都能用碼位直接點名，不必求 `writing-mode`、也不必求 OpenType feature，這張表
就可以整組刪掉。

**GB 那款已經做了一半**：它的 cmap 有 `U+FE41–FE44`（`﹁﹂﹃﹄`），其餘三款
`FE forms present: []`。所以機制是通的，缺的只是推廣到全部碼位與全部款式。

## 四、順帶量到的

- WebKit 沒有 `text-spacing-trim`（`CSS.supports` 回 false），所以 han.css 走
  JS fallback，`h-char` 數量比 Chromium 多（同一段：背景 20 vs 12、前景
  41 vs 26）。擠壓本身有生效，不是 bug。
- `mask-clip: no-clip` WebKit **認得但不做**（`CSS.supports` 與 computed style
  都回 `no-clip`，畫面照 border-box 剪）。與本檔無關，記在
  `docs/plans/safari-fixes-and-dash-fuse-clip.md` § 四。
