
更新紀錄　CHANGELOG
===

v2.3.0（2014-2-7）
---
1. 加入圖表元素`<figure>`的邊界修正，以相容於新版Normalize CSS
2. 加入增訂元素`<ins>`的視覺底線區隔
3. 新增OpenType格式注音符號web font，並加入拉丁字母的陽入韻元音連字（ligature）
4. 修正複合式小字標註`<ruby>`在Cordova Android上的問題
5. 加入文章區塊行高設定
6. 取消表單元素的字體設置，使之繼承自父元素（#47）
7. 加入聯絡資訊元素`<address>`的樣式修正（#49）
8. 代碼改採空格縮進，取代跳格
9. 修正漢拉間隙於各瀏覽器上顯示效果不一的問題（#40）
10. 改進各Sass檔案的註解格式


v2.2.3（2014-1-1）
---
1. 改用相對路徑呼叫注音字體（#37）
2. 改進方言音符號的陽入韻顯示方式，`zhuyin.ttf`加入陽入韻連字（ligature）
3. 改進相鄰註記元素的JS改寫


v2.2.2（2013-12-18）
---
1. WebKit已經支援了CSS3的`quotes`屬性，故取消其支援偵測及瀏覽器hack。（#33）
2. 修正註記元素`<u>`的改寫問題（#35）

v2.2.1（2013-12-05）
---
1. 改進了`<ruby>`的JS改寫並加入拼、注音共同顯示等功能（#5）
2. 漢拉間隙改用自訂元素`<hanla>`，避免元素樣式繼承衝突（#30）

〔更多資訊〕   
[https://github.com/ethantw/Han/issues?milestone=5&state=closed]


v2.2.0（2013-11-27）
---
1. 修正四大字體集與地區分支，並新增相關`@mixin`供開發者選用（#17）
2. 進階版標點字體加入中國國標分支；新增等高、文本數字字體（#17）
3. *棄用*來源元素`<cite>`的書名號樣式（#19）
4. 以節點改寫相鄰註記元素`<u>` hack，以避免replace method同AngularJS等程式衝突（#20）
5. 進階版標點字體新增全形連接號（－）、全形正、反斜線（／ ＼）、全形內括號（〔〕）等五個字符的修正（#21）
6. 加入CSS3屬性`unicode-range`的功能支援偵測（#22）
7. `jQuery(selector).charize()`加入12個CJK相容表意漢字支援（#23）
8. 注音符號字體補足方言音擴充字符（#26）
9. 修正強調元素`<em>`的樣式回退（#27）


〔更多資訊〕  
[https://github.com/ethantw/Han/issues?milestone=2&page=1&state=closed]


v2.1.2（2013-11-07）
---
1. 修正`article:lang(zh | ja) strong`的字重（#16）
2. 修正標點字體「Biaodian Pro Sans CNS」之分號等符號無法正確顯示的問題（#15）
3. 限定`figure > blockquote`的引號樣式在文章區塊下（#13）
4. 實驗性底線在`border-box` reset網頁下的顯示問題（#11）
5. 加入了Bower package的支援（@yhsiang，#12）


〔更多資訊〕  
[https://github.com/ethantw/Han/issues?milestone=3&page=1&state=closed]


v2.1.1 （2013-10-21）
---
1. 將normalize.css加入至`han.css`中，使用Sass取代CSS的檔案調度（#7）
2. 採用Sass Partials
3. 修正四大字體集、西文斜體字體會在某些瀏覽器出現偽粗體的情況（#10）
4. 更新`findAndReplaceDOMText()`函式至版本0.4.0（#8、#9）
5. 着重號顯示位置修正（#6）


〔更多資訊〕  
[https://github.com/ethantw/Han/issues?milestone=1&page=1&state=closed]


v2.1.0（2013-10-5）
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


v2.0.0（2013-07-25)
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



















