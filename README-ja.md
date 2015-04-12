漢字標準格式
============

漢字標準格式は、「セマンティック要素のスタイルの標準化」「タイポグラフィ」「ハイレベルな組版」を実現するためのSassとJavaScriptのフレームワークです。美しい見た目と標準化された環境を、漢字文化圏のウェブサイトへ提供するために設計されました。伝統的な読書環境をスクリーン上での事実上の標準仕様とすることで、漢字文化圏のウェブデザインの組版需要に当面の解決策となります。

漢字標準格式は、中国語繁体字、中国語簡体字および日本語をサポートします。

表示例のテストページ（中国語）→

##インストール方法

NPM npm install --save han-css
Bower bower install --save Han
Component component install ethantw/Han
Rails gem install 'hanzi-rails'（詳細はこちら）
###カスタマイズ

漢字標準格式には、カスタマイズ可能な機能が多くあります。設定を変更したりモジュールをインポートすることで、プロジェクトに独自のスタイルシートを容易に組み込めます。詳細は取扱説明書（中国語）をお読みください。

###CDNで使う

カスタマイズが不要な場合、デフォルトのスタイルシート、JavaScriptおよびWebフォントがコンパイルされたものをCDNで使うことで、高速なダウンロードやキャッシュの利用ができます。このサービスはcdnjs.comが提供します。

<link rel="stylesheet" media="all" href="//cdnjs.cloudflare.com/ajax/libs/Han/3.1.1/han.min.css">
JavaScript

<script src="//cdnjs.cloudflare.com/ajax/libs/Han/3.1.1/han.min.js"></script>
Webフォント

WOFF //cdnjs.cloudflare.com/ajax/libs/Han/3.1.1/font/han.woff
OTF //cdnjs.cloudflare.com/ajax/libs/Han/3.1.1/font/han.otf
##使用方式

従来から使用しているスタイルより前に、han.min.css（もしくは漢字標準格式のSass）を組み込んでください。
必要に応じて、han.min.jsを組み込んでください。DOM-readyのレンダリングを有効にするには、<html>タグのclassに、han-initを追加します。
レンダリングをカスタマイズすることも可能です。詳細は取扱説明書（中国語）をお読みください。
###JavaScriptのオプション

漢字標準格式は、低相互依存、高セマンティックです。スタイルシートとJavaScriptはほとんど依存し合いません。様々なレベルでスタイルシートのフォールバックができるので、JavaScriptの使用の可否を、必要に応じて選択できます。

##よくある質問

###スタイルを上書きすることについて

多くのCSSフレームワークとは異なり、漢字標準格式は大量のスタイルを持っており、言語属性（:lang）によって意図するスタイルを適用させます。そのため、スタイルの上書きは予期しない結果を引き起こす可能性があります。

####言語毎のスタイルの集合を使った要素のスタイル

テキストレベルのセマンティック
グルーピングコンテンツ要素とsection要素の組み合わせ（font-family のみ）
ルート要素html（font-family のみ）
####解決策

このような状況を適切に対処するために、スタイルの継承のルールを十分ご確認ください。親要素または他のセレクタに適切な言語属性を追加することをおすすめします。!import宣言の過度の使用を避けることができ、保守性が向上します。

必要な場合は、ブラウザでDOMインスペクタを使うことにより、スタイルシートの継承や上書きの関係が分かります。

###han.jsスクリプトの動作環境

han.jsはDOM環境でのみ動作します。必要な場合は、サーバにjsdom等のライブラリを導入してください。

##サポートするブラウザ

Google Chrome（最新版）
Mozilla Firefox（最新版）
Opera Next（最新版）
Apple Safari 7+
Internet Explorer 10+
##開発について

漢字標準格式の開発に協力してくれる方を歓迎します。以下はプログラムの開発に有用なコマンドの一覧です。

開発パッケージをインストール: sudo npm i
開発環境の起動: npm start or gulp dev (ローカルサーバの実行と自動コンパイルを含む)
コンパイルしたファイルを公開: gulp build
han.jsのAPIをテストする: gulp test (PhantomJS)
モジュールを更新する: npm update && gulp dep
* * *
Last-modified: 2015-3-30 19:16 (GMT+9)
Translator: 神場雅史(Jimba Masafumi)