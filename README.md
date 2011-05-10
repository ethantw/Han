# 漢字標準格式

*   [前言][qianyan]
*   [使用方式][shiyong_fangshi]

[qianyan]: #qianyan
[shiyong_fangshi]: #shiyong_fangshi
* * *

<h2 id="qianyan">前言</h2>
現今的瀏覽器預設樣式都是以顯示「西文」為主，忽略了漢字排版方式與西文的差異。加上出版者、網頁設計師和文章作者對此技術的妥協，導致中文「螢幕文章」與學校所授予文章書寫規則有愈來愈大的出入。

最近有個CSS reset的概念突然興起，目的是用來減少各瀏覽器對網頁排版解讀的分歧和差異。我沿用這個想法，設計了一套以漢字網頁為主的CSS reset（適用於台灣、香港繁體、大陸簡體、日文）。希望可以藉此降低正式文書與網頁格式的差異。

<h2 id="shiyong_fangshi">使用方式</h2>
1. 解壓縮後開啟檔案「`han.min.css`」，更改「14及15行」的`.eot`與`.ttf`注音符號字體路徑。
**請注意**：此處使用的注音符號字體係中華民國教育部研發的「[教育部標準楷書](http://www.edu.tw/mandr/content.aspx?site_content_sn=3591)」，並採**[創用CC 「姓名標示—禁止改作—3.0台灣版」授權](http://creativecommons.org/licenses/by-nd/3.0/tw/)**。若您有著作權的疑慮，或是沒有使用注音符號的需求，請直接刪除上述提及之二行代碼及檔案。

2. 在欲套用「漢字標準格式・CSS Reset」的網頁`<head>`元素中插入下列語法：

        <link rel="stylesheet" media="all" href="./han.min.css">
        <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js></script>
        <script src="./han.min.js"></script>

3. 留意`<html>`標籤上是否設置了正確的語言屬性`lang`。此框架多數功能僅支援中文`zh-*`及日語`ja`。

4. 在瀏覽器中開啓已套用本框架的網頁測試是否正確運作後，即可使用適用於漢字網頁的HTML格式，詳情請參考〈[漢字標準格式・CSS Reset](http://ethantw.net/projects/han/)〉。