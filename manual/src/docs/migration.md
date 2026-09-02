---
title: 從 v3 遷移
---

# 從 v3 遷移

v4不是v3的增量升級，而是架構層面的重寫。一句話概括：**v3是「Sass編譯期配置＋JS渲染行內機能」，v4是「執行期的原生CSS自訂屬性＋可選的最小JS回落」**。

v3的樣式要先用Sass把`$han-*`變量編譯成CSS；語意與段落層CSS即生效，行內排版機能（間隙、擠壓、懸掛等）則另跑`Han.init()`、靠JavaScript掃過DOM包上節點才到位。v4把配置搬進原生CSS自訂屬性（`--han-*`）：不編譯、執行期讀取、可級聯、可在任意子樹覆寫；CSS一載入就生效，JS只在引擎缺原生能力時補位（且v4要補的部分已被瀏覽器原生化不少）。

## 核心變化總覽

| 面向 | v3 | v4 |
|------|----|----|
| 配置機制 | Sass變量`$han-*`（編譯期定死） | CSS自訂屬性`--han-*`（執行期、可級聯、可子樹覆寫） |
| 生效方式 | CSS給基礎樣式；行內機能靠`Han.init()`的JS渲染 | CSS即生效；JS只補原生所缺 |
| 架構 | 單體＋Sass開關 | 四個`@layer`模組（semantics／lines／prose／fonts），零權重`:where()` |
| 覆寫 | 拉高選擇器權重／改Sass重編 | 你的一行`h2 {}`即勝，無需`!important` |
| JS入口 | `Han(ctx).render()`鏈式 | `installFallbacks()`／`uninstallFallbacks()`／`transpileRuby()` |
| 字體 | 自host的Han Heiti／Biaodian Pro等 | 尚古＋Diantenjeom，走ziano CDN切片 |
| DOM產物 | `<hws>`／`<h-jinze>`／`<h-char>` | `<h-iss>`／`<h-char data-punct>`／`<h-layer>` |

## 配置：Sass 變量 → CSS 自訂屬性

最大的改變。v3改設定要動Sass、重新編譯；v4把同一件事寫成`:root`（或任意祖先）上的CSS變量，執行期即時生效，且**可在子樹局部覆寫**，這是v3做不到的。常見對照：

| v3 Sass（預設） | v4 CSS 自訂屬性 | 備註 |
|------|------|------|
| `$han-text-emphasis-mark: circle` | `--han-em-symbol: circle` | 直接吃`text-emphasis`合法值 |
| `$han-text-emphasis-posi: under`（`-ja: over`） | `--han-em-dot-position: under right` | 日文自動`over right` |
| `$han-text-emphasis-shape` / `-skip` | —（併入上者／交原生） | `filled`/`open`折進符號值 |
| `$han-indent: 2em` | `--han-structural-indent: 2em` | 移入`han-semantics`，凡中日韓容器皆套，不再限`<article>` |
| `$han-article-justify: true` | 無對應 | v4不設`text-align`；要齊行請自行在容器上寫 |
| `$han-hanging-hant/hans/ja`（布林） | `--han-punctuation-refinement: auto` | 不再逐語言布林；改自動判準（見[行的調整](./lines.html)） |
| `$han-biaodian-hant: CNS` / `-hans: GB` | `--han-punctuation-hant/hans/ja: MOE｜GB｜JIS｜off` | CNS≈MOE |
| `$han-glyph-set-hant: default` | `--han-use-heritage-glyphs-for-hant: webfont｜system｜off` | |
| `$han-sans` / `$han-serif` / `$han-mono` | `--han-font-latin-sans` / `-serif` | Latin層 |
| `$han-cursive` | `--han-use-cursive` ＋ `--han-webfont-cursive-hant` | 楷體改開關＋可換槽 |
| `$han-*-zh`（空槽） | `--han-font-cjk-sans/serif/cursive` | 或用上層開關驅動 |

已無對應、於v4移除的Sass變量：`$han-line-height` / `$han-article-line-height`（行高交給正文metrics，非Han.css管轄）、`$han-indent-md` / `$han-mobile-device-width`（`em`縮排隨字級自動伸縮，不需行動端斷點）、`$han-section-counter` / `-toc`（章節自動編號與目錄不再內建）、`$han-zhuyin-size`（注音字體自理）、`$han-font-path`（字體改走CDN／npm，不自host）、`$han-root` / `$han-article`（`--han-prose`預設綁`article`、可擴展至任意容器，不必再指定根選擇器）。

## 撐起 v4 的現代 CSS

v4能把配置搬進執行期、把覆寫變簡單、把機能按子樹開關，靠的不是更多JavaScript，而是四項v3時代還不存在（或未普及）的**原生CSS能力**。它們是v4彈性的來源，也是這份遷移指南背後的道理。

### `:where()`——公共選擇器低權重，容易覆寫

漢.css的公共預設與語意目標通常包在`:where()`裡，這一部分的選擇器權重
歸〇。`::before`、`::after`仍各自帶type specificity；作者要改同一個pseudo，
本來就會寫同一個pseudo，至少打平這部分，後寫的宣告即可覆蓋。
`<h-char>`、`<h-layer>`則是JS fallback的私有workaround markup，不是公共
styling surface，但需要時仍可循正常cascade覆蓋。真正保證未分層作者樣式
位於框架之上的，是下一節的`@layer`。

### `@layer`——可預期的層疊順序

四個模組各住一個cascade layer（`han-semantics`／`han-lines`／`han-prose`／`han-fonts`）。**未分層的樣式（你的）恆勝過任何分層樣式**，所以你的規則預設就在框架之上；要更精細，可在引入前宣告層序：

```css
@layer han-semantics, han-lines, han-prose, han-fonts, app;
```

v3沒有原生層疊層，覆寫順序只能以選擇器權重與源碼先後拼湊，脆弱又難預測。

### `@container style()`——執行期、按子樹的機能開關

這是v4配置機制的心臟。每項機能都包在`@container style(--han-*: …)`裡，讀取**祖先**上的`--han-*`值決定生效與否。配置因此從v3的「Sass編譯期定死、全域一套」變成「執行期讀取、可在任意子樹局部覆寫」：

```css
article { --han-em-symbol: sesame; }   /* 這棵子樹的著重號改芝麻點 */
article .comments { --han-prose: off; } /* 這一塊退出段落樣式 */
```

同一份CSS、不重編，頁面不同區域就能各有各的排版慣例，這是v3的編譯期配置給不了的。（也因為查的是祖先，變量要設在目標的**祖先**上，非目標自身，各模組頁的作用域通則皆源於此。）

### `@property`——帶型別與預設的變量

機能開關類的`--han-*`以`@property`註冊，宣告了`syntax`（合法值列舉）、`inherits`、`initial-value`。三個好處：非法值被解析器當場擋下（machine-checked）、有明確出廠預設（故style query在無人設定時也命中預設分支）、可繼承。「`--han-semantics`預設即`on`」這類行為因此有原生依據，不靠JavaScript補。

這四項合起來，構成v4「CSS即配置、即覆寫、即開關」的基礎。

## 啓用：CSS 優先，JS 補全

兩版都是CSS優先，JS都是加分項。v3的語意與段落樣式CSS即生效，JS再補上跨文種間隙、標點擠壓、行尾懸掛等當時CSS無法獨力完成的行內機能：有JS更完整，沒JS也有可用的一層。v4延續這條路，而且因為更多能力已被瀏覽器原生化（`text-autospace`、`text-spacing-trim`），JS要補的比v3**更少**。

變的是啓用的形狀：v3靠`Han.init()`／`.han-init`觸發一整套JS渲染管線；v4改為載入CSS即生效，JS按需接入。

```html
<!-- v3：以 class 或 API 觸發 JS 渲染 -->
<html class="han-init">           <!-- 或 Han.init() / Han(context).render() -->
```

```js
// v4 的 JS 補全（可選）
import '@hanzi.pro/han.css/auto'                 // 載入即在 DOMContentLoaded 自動安裝
// 或手動控制時機與範圍
import { installFallbacks } from '@hanzi.pro/han.css'
installFallbacks(document.body)
```

```html
<!-- 或不打包，直接掛 CDN -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest/dist/han.auto.min.js"></script>
```

詳見[安裝與啓用](./install.html)。

## JavaScript API 對照

| v3 | v4 |
|----|----|
| `Han.init()` / `Han(ctx).render()` | `installFallbacks()` / `installFallbacks(root)`（或`/auto`入口） |
| `renderHWS([strict])` / `revertHWS()` | 併入`installFallbacks`（依`--han-text-autospace`）／`uninstallFallbacks()` |
| `renderJiya()` / `revertJiya()` | 併入`installFallbacks`（依`--han-punctuation-refinement`）／`uninstallFallbacks()` |
| `renderHanging()` / `revertHanging()` | 同上（懸掛一併併入） |
| `renderEm()` / `renderElem()` | 移除：語意樣式改純CSS（[語意樣式標準化](./semantics.html)） |
| `renderDecoLine()` | 併入`installFallbacks`（相鄰行裝飾線標記） |
| `renderRuby()` | `transpileRuby()`（opt-in，僅降級舊式標記） |
| `Han.support` / `Han.detectFont()` / `initCond()` | 移除：改用`CSS.supports`＋內建探針（`applyISSWithProbe`內建，無需自行呼叫） |
| `groupify` / `charify` / `jinzify` / `replace` / `wrap` / `revert` | 非公開API（內部化／移除） |
| `.han-init` / `.han-init-context` | `@hanzi.pro/han.css/auto`入口（或自主入口具名匯入所需的pass） |
| `<html class="han-js-rendered">` | 移除：無全域render旗標 |

v4的`installFallbacks`是總開關，其下三組回落（標點擠壓懸掛／跨文種間隙／相鄰行裝飾線）也各自公開、可精細控制與SSR。完整清單見[JavaScript API](./api-js.html)。

## DOM 產物對照

兩版都靠JS包裹惰性標記元素實現行內機能，但標記換了：

| v3 | v4 |
|----|----|
| `<hws>`（跨文種間隙） | `<h-iss>`，且**僅**`replace`／`strict`；`normal`走原生`text-autospace` |
| `<h-jinze class="middle｜wei｜tou">`＋`<h-char>`（擠壓） | `<h-char data-punct="open｜close｜end｜middle｜consecutive">` |
| `<h-hangable>`（懸掛） | `<h-char data-punct~="hangable"><h-layer>` |
| `<h-char-group>` / `<h-word>`（分組） | 無：v4不做字元／詞分組 |

## Ruby 遷移

v3的注音ruby容許`<rb>`／`<rtc>`表格式與`rbspan`，另有`.complex`／`.rightangle`／`.romanization`等class。v4收斂為引擎當今能正確渲染的**interop形式**：每個注音ruby一個base，額外注解層改為巢狀`<ruby>`。

- `.zhuyin`／`.mps`**保留**。
- 舊式`<rb>`／`<rtc>`／multi-`<rt>`標記：跑[`transpileRuby`](./api-js.html)降級，SSR／建構期一次改寫最省，也可作runtime相容墊片（冪等、可重跑）。
- `.complex`／`.rightangle`／`.romanization`的多層標注，改由巢狀`<ruby>`慣例表達（見[語意樣式標準化](./semantics.html)的注音一節）。

## 語意標記與 class 的去留

v4以**元素語意**為主、少用class：

| v3 class | v4 |
|----------|----|
| `.pn`（專名號） | `<u>`本身即專名號，免class |
| `.poem-like` | **保留**（見[段落間距調整](./prose.html)） |
| `.typo`（別字標記）／`.ship` | 移除：用適當元素或自訂樣式 |
| `.toc`（目錄自動編號） | 移除 |

## 字體遷移

v3自host一整套Han字體家族；v4的字體是外部資產，走CDN／npm切片遞送（見[字體](./fonts.html)）：

| v3 家族 | v4 |
|---------|----|
| Han Heiti／Han Songti | 尚古黑體／尚古明體（Shanggu，ziano CDN `unicode-range`切片） |
| Han Kaiti | 霞鶩文楷TC（LXGW，可換芫荽等） |
| Biaodian Pro（CNS／GB／Pro） | Diantenjeom（MOE／GB／JIS／KLR，四者對四個語言全面開放） |
| Zhuyin Heiti／Zhuyin Kaiti | Han Zhuyin Serif（內建） |
| Numeral LF／TF、Latin Italic、Romanization Sans | 移除 |

## 遷移檢查清單

1. 移除Sass依賴與`@import 'han-css/index'`；改直接引入CSS（`@hanzi.pro/han.css/styles`或按模組挑）。
2. 把用到的`$han-*`設定改寫成`:root`上的`--han-*`（對照上表）；需要局部差異的地方，改設在該子樹祖先上。
3. 拿掉`Han.init()`／`.render()`與`.han-init`class；若要行內機能的DOM回落，改`installFallbacks()`或`/auto`入口。
4. 舊式`<rb>`／`<rtc>` ruby跑一次`transpileRuby`。
5. 清掉不再存在的class（`.pn`／`.toc`／`.typo`…），確認`<u>`等元素語意正確。
6. 字體改掛CDN／npm；把`$han-biaodian-*`／`$han-glyph-set-*`的選擇對應到`--han-punctuation-*`／`--han-use-heritage-glyphs-for-hant`。
7. 章節自動編號、目錄、行高、行動端縮排斷點等v3功能若有用到，改由你自己的CSS承接，v4的prose模組不含這些。
