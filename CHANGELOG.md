
更新紀錄　CHANGELOG
===

2.1.1 （2013-10-21）
---
1. 將normalize.css加入至`han.css`中，使用Sass取代CSS的檔案調度（issue #7）

2. 採用Sass Partials

3. 修正四大字體集、西文斜體字體會在某些瀏覽器出現偽粗體的情況（issue #10）

4. 更新`findAndReplaceDOMText()`函式至版本0.4.0（issue #8、#9）

5. 着重號顯示位置修正（issue #6）


〔更多資訊〕
https://github.com/ethantw/Han/issues?milestone=1&page=1&state=closed



* * *

2.1.1（2013-10-5）
---
1. 將原`css/han.main.css`中，
     `<dfn>`的`font-style`樣式
   由
     `normal`
   改為
     `inherit`

2. 以「SCSS」重新改寫整個CSS專案

3. 修正與更新`han/ff.scss`
    * 原第551行的錯誤
    * 新增「宋體-簡」的fallback（置於「華文宋體」前方）
    * 新增「宋體-繁」為「Biaodian Pro Serif CNS」的句、讀、頓號fallback


4. 更新`han/fonts.scss`，改以變數取代重覆的字體列表
 
5. 更新`normalize.css`至2.1.3版本

6. 停用文章內段落首行縮進的分段方式，改以適合捲軸式閱讀的段落間空行分段

7. `han.js`中的更動
	* 加入函式庫`findAndReplaceDOMText()`
	* `$(selector).charize()`開放函式（原`han.characterize`）
		* 更改此函式為jQuery Plugins，並更名為較簡短的`charize`
		    `$(selector).charize()`
		* 加入避頭尾點支援
	* `han.js`檔案加載後置入`<html>`標籤的類別由
		`han-js`
      改名為
        `han-js-rendered`
	* 注音符號`<ruby class="mps">`完載後加入的類別由
	  	`ruby-zhuyin-constructed`
	  改名為
	    `han-js-zhuyin-rendered`
	* 「漢拉間隙」功能改用`findAndReplaceDOMText()`函式，以支援IE
	  （並取消IE專用的`text-autospace`）


8. 實驗性功能
	* 底線相鄰問題改用CSS3偽類選擇器重製註記元素`<u>`的底線，需要
  		* 在`<html>`標籤上使用`han-lab-underline`類別



* * *

2.0.0（2013-07-25)
---

1. 程式代碼依各章節分立於各檔案中
	* 將`normalize.css`自`han.css`中獨立，以利未來更新
	* 將「以『語言為基礎的元素樣式修正』的『漢字標準格式』」一節獨立（於檔案`han.main.css`中）
	* 將「各元素字體及字體集設定」獨立於`han.font.css`方便參閱、除錯和修改
	* 將「直式國語注音符號的`<ruby>`支援」獨立於`han.zhuyin.css`中，並預設關閉，以節省檔案大小


2. 修正註記元素不相鄰時仍有向右位移的問題（需開啓JavaScript）

3. 以`text-indent`取代原有的「文章內段落」首段縮進方式；
   加入「文章內清單」的縮進樣式。

4. 加入「漢拉間隙」功能（需開啓JavaScript）

5. 加入系統不支援「楷體」時，變音文字`<i>`的相應替代樣式（需開啓JavaScript）

6. 加入描述元素`<figure>`內的區塊引用`<blockquote>`樣式

7. 改進`<ruby>`的注音符號顯示效果

8. 加入手持裝置上的樣式微調

9. 加入「標點符號樣式修正」，並區分「預設修正」及「進階修正」二種（瀏覽器需支援`unicode-range`等CSS3屬性）

10. 加入基本元素的指定字體修正（獨立於`han.fonts.css`），取代各瀏覽器或作業系統自動卻錯誤百出的字體集fallback

11. 加入包含「黑、宋、楷、仿宋體」的「四大字體集」CSS3 API

12. JavaScript API
	* 加入「用戶端功能支援測試」`han.support.*function*`
	* 加入「用戶端字體（集）支援測試」`han.support.font()`
		* 加入`<ruby>`支援偵測
		* 加入`@font-face`支援偵測
	* 加入「萬國碼正則表達式」變數集`han.unicode[]`（所有CJK區段、拉丁字母區段、注音符號及擴充區段等）


13. 取消「類詩篇」類別`.poem-like`的元素限制，現可適用於所有區塊元素





