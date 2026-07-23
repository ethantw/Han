# 漢字標準格式 Han.css

[English](./README.md) · [繁體中文](./README.zh-Hant.md) · **日本語** · [한국어](./README.ko.md)

**ピクセルの間の活字美学、<br />画面に並ぶ漢字へ。**

CJKのウェブページのために選び抜いた、CSSの組版セットである。行末でぶら下げ・詰めを行う約物、文字に寄り添う圏点、注音とピンインのルビ、文字種間の髪の毛ほどの間隙、そして伝承字形——活版時代の組版の作法を、CSSカスタムプロパティと少量のJavaScriptフォールバックで画面上に再現する。

v4は、ネイティブなプラットフォームへの全面的な書き直しである。**Sassなし、ビルド手順なし、フレームワークなし。** ライブラリの実体は四つの独立したCSSモジュールと、任意のJavaScriptコンパニオン一つ。あらゆる機能は一つの`--han-*`カスタムプロパティで切り替え・調整する。

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
| **段落組み** | `han-prose` | ブロック方向のリズム——見出し・段落・リスト間の余白と、文字を単位とする字下げ（`--han-prose`、`--han-prose-indent`。既定では`<article>`のみに作用） |
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

### 三、詳細度はゼロ

すべての規則は`:where()`の内側で出荷され、詳細度はゼロである。あなたの規則は——たとえ素の要素セレクタであっても——フレームワークを上書きできる。`@layer`を使えばモジュールの順序もあなたのものだ。

```css
@layer han-semantics, han-lines, han-prose, han-fonts, app;
```

## JavaScriptコンパニオンは任意

**JavaScriptなしでも完全に使える。** 四モジュールの中核機能は純粋なCSSである。`installFallbacks`が担うのは、エンジンがまだネイティブに実装していない部分だけ——約物の詰めとぶら下げのDOMレベルのフォールバック、`text-autospace`未実装環境での文字種間の間隙、隣接行の下線間隔のマーキング。いずれも`CSS.supports`と実行時プローブで一つずつ見極め、エンジンが対応すれば自動的に道を譲る。

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
| `han.basic.css` | スリム版——semantics＋lines＋proseの純CSS部分のみ。fontsモジュール・JSコンパニオン用スタイル・フォント資産は含まない |
| `han.js` | JSエントリ（ESM）。名前付きエクスポートのみで、自動実行しない |
| `han.auto.js` | 自動インストールのエントリ。読み込みでフォールバックを導入し、全APIを再エクスポートする |

各ファイルに`.min`版とソースマップが付く。

## ブラウザ対応

モダンなエバーグリーンブラウザに対応。中核の仕組み（スタイルクエリ、`:where()`、`@layer`、`@property`）は近年のBaselineに準拠する。行内組版におけるエンジン差（`text-autospace`、`text-spacing-trim`）はJavaScriptコンパニオンが必要に応じて埋める。

## ドキュメント

完全なドキュメントとインタラクティブなプレイグラウンド——テキストを貼り、パネルを切り替え、生成された設定コードをコピーする——は **[hanzi.pro](https://hanzi.pro)** にある。リファレンスマニュアルは目下、繁体字中国語を正とし、英語が導入とインストールを、日本語・韓国語は順次整備中である。

## ライセンス

[MIT](./LICENSE) © 2012–2026 Chen Yijun。内蔵および伝承のWebフォントは、それぞれ上流のライセンス（OFL 1.1）に従う。各フォントパッケージを参照のこと。
