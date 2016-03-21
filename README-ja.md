
- [中文](https://github.com/ethantw/Han/blob/master/README.md)
- <b>日本語</b>
- [English](https://github.com/ethantw/Han/blob/master/README-en.md)


漢字標準格式
==========

漢字標準格式（組版標準フォーマット）は、「セマンティック要素のスタイルの標準化」「タイポグラフィ」「ハイレベルな組版」を実現するためのSass/StylusとJavaScriptのフレームワークです。美しい見た目と標準化された環境を、漢字文化圏のウェブサイトへ提供するために設計されました。伝統的な読書環境をスクリーン上での事実上の標準仕様とすることで、漢字文化圏のウェブデザインの組版需要に当面の解決策となります。

漢字標準格式は、中国語繁体字、中国語簡体字および日本語をサポートします。

[表示例のテストページ（中国語）→]
(http://ethantw.github.io/Han/latest/)

## インストール方法

- NPM `npm install --save han-css`
- Bower `bower install --save Han`
- Rails `gem install 'hanzi-rails'`（[詳細はこちら](https://github.com/billy3321/hanzi-rails)）

### カスタマイズ
漢字標準格式には、カスタマイズ可能な機能が多くあります。設定を変更したりモジュールをインポートすることで、プロジェクトに独自のスタイルシートを容易に組み込めます。詳細は[取扱説明書（中国語）][api]をお読みください。

[api]: http://css.hanzi.co/manual/sass-api

### CDNで使う

カスタマイズが不要な場合、デフォルトのスタイルシート、JavaScriptおよびWebフォントがコンパイルされたものをCDNで使うことで、高速なダウンロードやキャッシュの利用ができます。[このサービスはcdnjs.comが提供します][cdnjs]。

[cdnjs]: http://cdnjs.com/libraries/han

````html
<link rel="stylesheet" media="all" href="//cdnjs.cloudflare.com/ajax/libs/Han/3.3.0/han.min.css">
````

JavaScript

````html
<script src="//cdnjs.cloudflare.com/ajax/libs/Han/3.3.0/han.min.js"></script>
````

Webフォント

- WOFF `//cdnjs.cloudflare.com/ajax/libs/Han/3.3.0/font/han.woff`
- OTF `//cdnjs.cloudflare.com/ajax/libs/Han/3.3.0/font/han.otf`

## 使用方式

1. 従来から使用しているスタイルより前に、`han.min.css`（もしくは漢字標準格式のSass/Stylus）を組み込んでください。
2. 必要に応じて、`han.min.js`を組み込んでください。DOM-readyのレンダリングを有効にするには、`<html>`タグのclassに、`han-init`を追加します。
3. レンダリングをカスタマイズすることも可能です。詳細は[取扱説明書（中国語）][rendering]をお読みください。

[rendering]: http://css.hanzi.co/manual/js-api#rendering

###JavaScriptのオプション
漢字標準格式は、低相互依存、高セマンティックです。スタイルシートとJavaScriptはほとんど依存し合いません。様々なレベルでスタイルシートのフォールバックができるので、JavaScriptの使用の可否を、必要に応じて選択できます。

## よくある質問

### スタイルを上書きすることについて
多くのCSSフレームワークとは異なり、漢字標準格式は大量のスタイルを持っており、言語属性（`:lang`）によって意図するスタイルを適用させます。そのため、スタイルの上書きは予期しない結果を引き起こす可能性があります。

#### 言語毎のスタイルの集合を使った要素のスタイル
- テキストレベルのセマンティック
- グルーピングコンテンツ要素とsection要素の組み合わせ**（font-familyのみ）**
- ルート要素`html`**（font-familyのみ）**

#### 解決策
このような状況を適切に対処するために、スタイルの継承のルールを十分ご確認ください。親要素または他のセレクタに適切な言語属性を追加することをおすすめします。`!important`宣言の過度の使用を避けることができ、保守性が向上します。

必要な場合は、ブラウザでDOMインスペクタを使うことにより、スタイルシートの継承や上書きの関係が分かります。

### han.jsスクリプトの動作環境

han.jsはDOM環境でのみ動作します。必要な場合は、サーバに[jsdom]等のライブラリを導入してください。

[jsdom]: https://github.com/tmpvar/jsdom

## サポートするブラウザ

- Chrome（最新版）
- Edge（最新版）
- Firefox（最新版）
- Firefox ESR+
- Internet Explorer 11
- Opera（最新版）
- Safari 9

## 開発について

- Node.js
- LiveScript 1.4.0（`sudo npm install -g livescript`）

以下はプログラムの開発に有用なコマンドの一覧です。

- 開発パッケージをインストール：`sudo npm install`
- 開発環境の起動：`npm start`か`gulp dev`（ローカルサーバの実行と自動コンパイルを含む）
- コンパイルしたファイルを公開：`gulp build`
- `han.js`のAPIをテストする：`gulp test`（PhantomJS）
- モジュールを更新する：`sudo npm update && gulp dep`

* * *
漢字標準格式 v3.3.0  
Last-modified: 2016-3-19 00:11 (UTC+8)  
Translator: [神場雅史][translator] (Jimba Masafumi, [@westantenna][trans-twr])

[translator]: http://westantenna.com
[trans-twr]: https://twitter.com/westantenna

