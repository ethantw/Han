
- <b>中文</b>
- [日本語](https://github.com/ethantw/Han/blob/master/README-ja.md)
- [English](https://github.com/ethantw/Han/blob/master/README-en.md)


漢字標準格式
==========

「漢字標準格式」是一個集「語意樣式標準化」「文字設計」「高階排版功能」三大概念的Sass/Stylus、JavaScript排版框架。其專為漢字網頁提供的美觀而標準化的環境，不僅符合傳統閱讀習慣、更為螢幕閱讀提供了既成標準，得以完整解決現今漢字網頁設計的排版需求。

「漢字標準格式」完整支援繁體中文、簡體中文及日文等三個採用漢字的語言文字。

[檢視範例測試頁]
(http://ethantw.github.io/Han/latest/)

## 安裝
- NPM `npm install --save han-css`
- Bower `bower install --save Han`
- Rails `gem install 'hanzi-rails'`（[詳細說明](https://github.com/billy3321/hanzi-rails)）

### 定製
「漢字標準格式」提供多項定製功能，可經由變數設定、模組引用等方式定製專屬的樣式表。詳情請見[使用手冊][api]。

[api]: http://css.hanzi.co/manual/sass-api

### 使用CDN文件
若毋須特別定製，你也可以直接使用以預設値編譯的CDN外連樣式表、腳本及網頁字體，以求高速下載及快取。[此服務由cdnjs.com提供][cdnjs]。

[cdnjs]: http://cdnjs.com/libraries/han

````html
<link rel="stylesheet" media="all" href="//cdnjs.cloudflare.com/ajax/libs/Han/3.3.0/han.min.css">
````

腳本，

````html
<script src="//cdnjs.cloudflare.com/ajax/libs/Han/3.3.0/han.min.js"></script>
````

Web字體，

- WOFF `//cdnjs.cloudflare.com/ajax/libs/Han/3.3.0/font/han.woff`
- OTF `//cdnjs.cloudflare.com/ajax/libs/Han/3.3.0/font/han.otf`

## 使用方式

1. 在網頁所有樣式表*前*引用經編譯的`han.min.css`（或使用Sass/Stylus匯入）。
2. 依需求選用腳本`han.min.js`，並在`<html>`元素標籤上加入類別`han-init`以啓用DOM-ready渲染。
3. 或依需求定製渲染方式，詳見[使用手冊][rendering]。

[rendering]: http://css.hanzi.co/manual/js-api#rendering

### 可選用的腳本
「漢字標準格式」具低耦合、高度語意化等特性，樣式表與腳本各司其職、相互依賴性極低，並有多級樣式回退（fallback），故可依需求選用腳本。

## 常見問題

- [樣式的覆蓋](http://css.hanzi.co/manual/faq#yangshi_de_fugai)
- [`han.js`腳本的運行環境](http://css.hanzi.co/manual/faq#han-js_de_yunxing_huanjing)

## 瀏覽器支援

- Chrome（最新版）
- Edge（最新版）
- Firefox（最新版）
- Firefox ESR+
- Internet Explorer 11
- Opera（最新版）
- Safari 9

## 開發需求與指令

- Node.js
- LiveScript 1.4.0（`sudo npm install -g livescript`）

下列清單展示了部分常用的開發指令，

- 安裝需要的開發模組：`sudo npm install`
- 啓動開發環境：`npm start`或`gulp dev`（包含本機運行及自動編譯）
- 編譯發布文件：`gulp build`
- 測試`han.js`API：`gulp test`（PhantomJS）
- 更新依賴模組：`sudo npm update && gulp dep`

* * *
「漢字標準格式」版本：v3.3.0  
本頁最後修改於：2016-3-19 00:11（UTC+8）

