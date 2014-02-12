漢字標準格式
==========


「漢字標準格式」是基於樣式「重設」及「標準化」二個概念寫成的CSS3排版框架。由於現今的瀏覽器預設樣式皆以西文顯示為主，未能周詳地考慮到其與漢字排版間的差異，多造成網頁設計師的誤用，而內容編者亦無從依照語意正確使用字級元素。

「樣式標準化」的想法源自各種CSS reset及「normalize.css」專案，經漢字標準格式的沿用、加入中日韓語種的支援，並將漢字文化圈中常見的印刷品排印格式套用在各種HTML5元素中，從而提供標準合理而美觀的文章閱讀環境，迎合網頁讀者的閱讀習慣及設計師和編者的需求。

漢字標準格式目前可完整支援繁體中文、簡體中文及日文等三種漢字語種的網頁，亦提供便於校調的[Sass]版本。

[檢視範例測試頁 →][test]

[Sass]: http://sass-lang.com
[test]: http://ethantw.github.io/Han/test.html


安裝及使用
--------

直接自專案頁下載或使用Bower：  
`bower install --save Han`


### CDN

你也可以直接使用[cdnjs.com][cdn]服務提供的樣式表：

[cdn]: //cdnjs.com

~~~~html
<link rel="stylesheet" media="all" href="//cdnjs.cloudflare.com/ajax/libs/Han/2.3.0/han.css">
~~~~

JS檔：

~~~~html
<script src="//cdnjs.cloudflare.com/ajax/libs/jquery/2.1.0/jquery.min.js"></script>
<script src="//cdnjs.cloudflare.com/ajax/libs/Han/2.3.0/han.js"></script>
~~~~

### 啓用漢拉間隙
需配合`han.js`使用，在`<html>`標籤中加入類別`han-la`，

~~~~html
<html class="han-la">
~~~~

### 啓用進階標點符號修正
同上，毋需搭配`han.js`，在`<html>`標籤中加入下列相應的地區標準變體，

* 推薦：  
    `class="han-biaodian-pro"`
* 台港式繁體標點：  
    `class="han-biaodian-pro-cns"`
* 中國國標標點：  
    `class="han-biaodian-pro-gb"`

### 樣式的覆蓋
「漢字標準格式」不同於多數CSS框架，內含大量針對「語言屬性」的元素樣式修正，此作法可能導致這些元素樣式無法正確為後方的樣式覆蓋。為正確處理這些狀況，**請留意樣式的繼承規則，加入相應的語言屬性、選擇符或父元素等，避免過度使用「`!important`」宣告，以保持樣式表的可維護性。**

必要時，請使用瀏覽器的元件檢閱器來瞭解各串流樣式間的繼承、覆蓋關係。

使用手冊
-------

更多詳盡的功能說明，請參閱「[使用手冊][manual]」。

[manual]: //css.hanzi.co/manual


* * *
「漢字標準格式」版本：v2.3.0   
本頁最後修改於：2014年2月12日　19:35（GMT+8）



















