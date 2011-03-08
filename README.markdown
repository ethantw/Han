漢字標準格式
================

*   [前言](#qianyan)
*   [使用方式](#shiyong_fangshi)

* * *

<h2 id="qianyan">前言</h2>
現今的瀏覽器預設樣式都是以顯示「西文」為主，忽略了漢字排版方式與西文的差異。
加上出版者、網頁設計師和文章作者對此技術的妥協，導致中文「螢幕文章」與學校所
授予文章書寫規則有愈來愈大的出入。

最近有個CSS reset的概念突然興起，目的是用來減少各瀏覽器對網頁排版解讀的分歧
和差異。我沿用這個想法，設計了一套以漢字網頁為主的CSS reset（適用於台灣、香
港繁體、大陸簡體、日文）。希望可以藉此降低正式文書與網頁格式的差異。

<h2 id="shiyong_fangshi">使用方式</h2>
1. 開啟檔案「han.min.css」，更改「12及13行」的.eot字體路徑。

2. 在欲套用「Han: CSS Reset」的網頁中插入下列語法：
<pre><code>    &lt;link rel="stylesheet" media="all" href="./css/han.min.css"&gt;
    &lt;script src="http://ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js"&gt;&lt;/script&gt;
    &lt;script src="./js/han.min.js"&gt;&lt;/script&gt;
</code></pre>

即可使用適用於漢字網頁的HTML格式，詳情請參考〈[漢字標準格式・CSS Reset](http://ethantw.net/projects/han/)〉。
