
 - <b>中文版</b>
 - [English version](https://github.com/ethantw/Han/blob/master/README \(en\).md)

漢字標準格式
==========

「漢字標準格式」是一個集「語意樣式標準化」「字體排印」「高級排版功能」三大概念的Sass、JavaScript排版框架。其專為漢字網頁提供的美觀而標準化的環境，不僅符合傳統閱讀習慣、更為螢幕閱讀提供了既成標準，得以完整解決現今漢字網頁設計的排版需求。

「漢字標準格式」完整支援繁體中文、簡體中文及日文等三個採用漢字的語言文字。

[檢視範例測試頁 →]
(http://ethantw.github.io/Han/latest/)

## 安裝
- NPM `npm install --save Han`
- Bower `bower install --save Han`
- Component `component install ethantw/Han`

### 定製
「漢字標準格式」提供了多項定製功能，可經由變數設定、模組引用等方式定製專屬的樣式表。詳情請見[使用手冊][manual]。

[manual]: http://css.hanzi.co/manual

### 使用CDN文件
若毋須特別定製，你也可以直接使用以預設値編譯的CDN外連樣式表、腳本及網頁字體，以求高速下載及快取。[此服務由cdnjs.com提供][cdnjs]。

[cdnjs]: http://cdnjs.com/libraries/han

````html
<link rel="stylesheet" media="all" href="//cdnjs.cloudflare.com/ajax/libs/Han/3.0.0/han.min.css">
````

腳本，

````html
<script src="//cdnjs.cloudflare.com/ajax/libs/Han/3.0.0/han.min.js"></script>
````

Web字體，

- WOFF `//cdnjs.cloudflare.com/ajax/libs/Han/3.0.0/font/han.woff`
- OTF `//cdnjs.cloudflare.com/ajax/libs/Han/3.0.0/font/han.otf`

## 使用方式

1. 在網頁所有樣式表*前*引用經編譯的`han.min.css`（或使用Sass）。
2. 依需求選用腳本`han.min.js`，並在`<html>`元素標籤上加入類別`han-init`以啓用DOM-ready渲染。
3. 或依需求定製渲染方式，詳見[使用手冊][manual]。

### 可選用的腳本
「漢字標準格式」具低耦合、高度語意化等特性，樣式表與腳本各司其職、相互依賴性極低，並有多級樣式回退（fallback），故可依需求選用腳本。

### 樣式覆蓋的問題
「漢字標準格式」不同於多數CSS框架，內含大量針對語言屬性`:lang`的元素樣式修正，因而導致後方樣式無法依預期覆蓋。

#### 含語言屬性樣式修正的元素類型：
- 字級語意元素（text-level semantics）
- 群組元素（grouping content）及同章節元素（sections）的組合情境**（僅含字體設定）**
- 根元素`html`**（僅含字體設定）**

#### 處理方式
為正確處理這些狀況，請留意樣式繼承規則，加入相應的語言屬性、父輩元素或其他選擇器等，以提高樣式權重，避免過度使用`!important`宣告，以保持樣式表的可維護性。

必要時，請使用瀏覽器的「元件檢閱器」來瞭解樣式表間的繼承、覆蓋關係。

## 瀏覽器支援

- Google Chrome（最新版）
- Mozilla Firefox（最新版）
- Opera Next（最新版）
- Apple Safari 7+
- Internet Explorer 10+

* * *
「漢字標準格式」版本：v3.0.0  
本頁最後修改於：2014年10月23日 04:20（GMT+8）
