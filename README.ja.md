# 漢字標準格式 Han.css

[English](./README.md) · [繁體中文](./README.zh-Hant.md) · **日本語** · [한국어](./README.ko.md)

**ピクセルの間の活字美学、<br />画面に並ぶ漢字へ。**

CJKのウェブページのために選び抜いた、CSSの組版セットである。行末でぶら下げ・詰めを行う約物、文字に寄り添う圏点、注音とピンインのルビ、文字種間の髪の毛ほどの間隙、そして伝承字形——活版時代の組版の作法を、CSSカスタムプロパティと少量のJavaScriptフォールバックで画面上に再現する。

v4は、ネイティブなプラットフォームへの全面的な書き直しである。**CSSプリプロセッサなし、必須のJavaScriptなし（あればなお良い）。** ライブラリの実体は四つの独立したCSSモジュールと、任意のJavaScriptコンパニオン一つ。あらゆる機能は一つの`--han-*`カスタムプロパティで切り替え・調整する。

```
pnpm add @hanzi.pro/han.css
```

```js
import '@hanzi.pro/han.css/styles'   // 四モジュールすべて
import '@hanzi.pro/han.css/auto'     // 任意のJSコンパニオン（フォールバック）
```

あるいはCDNから直接、ビルドは一切不要である。

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest/dist/han.min.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest/dist/han.auto.min.js"></script>
```

導入はこれで全部である——以後、意味づけされたHTMLがそれ自身で組版される。`<em>`につくのは圏点であって斜体ではない。`<cite>`には書名号がつく。約物は詰められ、ぶら下がる。漢字と欧文のあいだには適切な間隙が入る。

## メンタルモデル

三つを押さえれば、ライブラリの全体がわかる。

### 一、四つのモジュール、それぞれ一つの役割

| モジュール | カスケードレイヤー | 役割 |
|------|--------------|--------|
| **セマンティクス** | `han-semantics` | 漢字組版における意味要素の見え方——圏点（`--han-em-symbol`、`--han-em-dot-position`）、`<cite>`の書名号（`--han-cite-title-marks`）、固有名詞の傍線、ルビ。そして擬似斜体の廃止 |
| **行の調整** | `han-lines` | 行内の按配——約物の詰めと行末のぶら下げ（`--han-punctuation-refinement`）、文字種間の間隙（`--han-text-autospace`） |
| **段落組み** | `han-prose` | ブロック方向のリズム——見出しとその本文のあいだの余白、引用の楷書（`--han-prose`。既定では`<article>`のみに作用） |
| **フォント** | `han-fonts` | 書体スタックとWebフォント——伝承字形（`--han-use-heritage-glyphs-for-hant`）、約物書体、楷書体の系統（`--han-use-cursive`） |

四つのモジュールは互いに独立し、全部入れても一つだけ選んでもよい。それぞれ自分のカスケードレイヤーに住み、あなたのスタイルと干渉しない。モジュール単位で選ぶには——

```js
import '@hanzi.pro/han.css/styles/semantics'
import '@hanzi.pro/han.css/styles/lines'
import '@hanzi.pro/han.css/styles/prose'
import '@hanzi.pro/han.css/styles/fonts'
```

### 二、機能はすべてCSSカスタムプロパティ

各機能は一つの`--han-*`プロパティに対応する。任意のセレクタにそれを設定すれば、その範囲で機能が効く。これは漢.cssが発明した仕組みではなく、ネイティブCSSの継承とスタイルクエリ（`@container style()`）である。

```css
/* 文書全体の圏点を胡麻点に変える */
:root { --han-em-symbol: sesame; }

/* この領域だけ約物の調整（詰めとぶら下げ）を切る */
.quoted-legacy-text { --han-punctuation-refinement: none; }
```

覚えるべきクラス名も、呼び出すべきJavaScript APIもない。セレクタが作用域、プロパティが切り替えである。スタイルクエリは**祖先**を読むので、対象とする内容の祖先（または`:root`）にプロパティを設定すること。各モジュールの全プロパティ一覧はドキュメントを参照。

### 三、公開スタイルは上書きしやすい

公開デフォルトと意味要素の対象には、通常、詳細度ゼロの`:where()`を使う。擬似要素は自身のtype specificityを保つが、同じ擬似要素を変更する作者規則もその分を満たす。`<h-char>`／`<h-layer>`は非公開のフォールバックmarkupである。さらに、フレームワーク規則はすべてlayer内にあるため、通常の非レイヤー作者CSSがその上に位置する。

```css
@layer han-semantics, han-lines, han-prose, han-fonts, app;
```

## JavaScriptコンパニオンは任意

**JavaScriptなしでも完全に使える。** 四モジュールの中核機能は純粋なCSSである。`installFallbacks`は、約物の詰めとぶら下げのDOMフォールバック、文字種間の間隙、隣接行の下線間隔を補う。ネイティブの詰めとautospaceはfeature checkと実行時プローブで選ぶ。Safariはネイティブ`hanging-punctuation`対応をうたうが、現状の実装はhan.cssでは実用にならないため、ぶら下げは全エンジンでJSを使う。

```js
import '@hanzi.pro/han.css/auto'                 // 読み込み時にDOMContentLoadedで実行

import { installFallbacks } from '@hanzi.pro/han.css'
installFallbacks(document.body)                  // または時機と範囲を自分で制御
```

行内組版の細部にこだわるなら`auto`を、意味スタイルと段落のリズムだけでよいなら純粋なCSSで足りる。

## Webフォント（伝承字形）

フォントモジュールは書体スタックと書体名を定義する。伝承字形（尚古黑体・明朝体など）のwoff2の**配信**はあなたの選択である。最も簡単なのは、切片化されたzianoのCDNサブセットを掛けること。

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/webfonts-shanggu-sans@latest/swap.css">
```

まったく導入しないこともできる——`--han-use-heritage-glyphs-for-hant: system`でシステムフォントにフォールバックする。

## 成果物一覧

| ファイル | 内容 |
|------|------|
| `han.css` | フルセット——四モジュール＋JSコンパニオン用スタイル＋内蔵フォント資産（全角空白の校正書体、注音書体） |
| `han.{semantics,lines,prose,fonts}.css` | モジュール単位のバンドル。各自のカスケードレイヤーに住み、四つの総和＝フルセット |
| `han.basic.css` | スリム版——semantics＋lines＋proseの純CSS部分のみ。fontsモジュール・JSコンパニオン用スタイル・注音書体は含まない |
| `han.zhuyin.css` | `han.basic.css`と併用できる注音用`@font-face` |
| `han.js` | JSエントリ（ESM）。名前付きエクスポートのみで、自動実行しない |
| `han.auto.js` | 自動インストールのエントリ。読み込みでフォールバックを導入し、メインAPIを再エクスポートする |

各ファイルに`.min`版とソースマップが付く。

## ブラウザ対応

モダンなエバーグリーンブラウザに対応。中核の仕組み（スタイルクエリ、`:where()`、`@layer`、`@property`）は近年のBaselineに準拠する。行内組版におけるエンジン差（`text-autospace`、`text-spacing-trim`）はJavaScriptコンパニオンが必要に応じて埋める。

## v3からの移行

v4はv3のJavaScriptランタイムを丸ごと退役させた——各機能はブラウザまたはフォントのネイティブな挙動が引き継ぎ、任意のJSコンパニオンはエンジンにまだ欠けている部分だけを埋める。撤去されたAPIとその代替：

| v3 | 代替 |
|----|------|
| `Han.init()`／`Han(ctx).render()` | 起動は不要——CSSは読み込み即座に効く。JSフォールバックが要るときだけ`installFallbacks()`（または`/auto`エントリ） |
| `renderHWS()`——文種間スペース | ネイティブ`text-autospace`。`installFallbacks()`の`<h-iss>`フォールバック |
| `renderJiya()`／`renderHanging()`——約物の詰め／ぶら下げ | ネイティブ`text-spacing-trim`は詰めのJSを置き換えられる。Safariは`hanging-punctuation`対応をうたうが、現状の実装はhan.cssでは実用にならないため、ぶら下げは全エンジンでJSを使う |
| `renderEm()`／`renderElem()` | 純CSS——セマンティクスモジュール |
| `renderDecoLine()` | `text-decoration-inset`＋CSS／JSの隣接行フォールバック |
| `renderRuby()`／`substCombLigaWithPUA` | ネイティブ`ruby-position`＋注音フォントのGPOS。旧式`<rb>`／`<rtc>`マークアップは`transpileRuby()`でダウンレベル |
| `locale/normalize`——地域字形 | `lang`対応フォントのOpenType `locl`機能 |
| `jinzify` | `text-justify: inter-character` |
| `Han.support`／`Han.detectFont()` | `CSS.supports()`＋内蔵プローブ（`runProbes`） |

v3のclassも同じ道を辿った——`.han-init`→`/auto`エントリ、`.pn`→素の`<u>`。Sass変数対照表つきの手順は[hanzi.pro/manual/migration.html](https://hanzi.pro/manual/migration.html)にある。

## ドキュメント

完全なドキュメントとインタラクティブなプレイグラウンド——テキストを貼り、パネルを切り替え、生成された設定コードをコピーする——は **[hanzi.pro](https://hanzi.pro)** にある。リファレンスマニュアルは目下、繁体字中国語を正とし、英語が導入とインストールを、日本語・韓国語は順次整備中である。

組版そのものを先に見るなら、**[ブラウザ版の完全な見本](https://hanzi.pro/specimen.html)**を開けばよい。サイト固有のページスタイルを持たず、漢.cssだけの表示を確認できる。

## ライセンス

[MIT](./LICENSE) © 2012–2026 Chen Yijun。内蔵の注音WebフォントはBopomofoRuby1909（© 2018 But Ko）の再パッケージであり、OFL 1.1に従う——[LICENSE-FONTS](./LICENSE-FONTS)を参照。伝承字形のWebフォントは別途配信で、それぞれ上流のライセンスに従う。各フォントパッケージを参照のこと。
