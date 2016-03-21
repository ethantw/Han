
更新紀錄　CHANGELOG
===
v3.3.0（2016-3-19）
---
 1. 正式改以Stylus生成發布文件（`han.css`及`han.min.css`）
 2. 改進相鄰文字裝飾線修正的渲染方式
 3. 改進漢字－西文混排間隙的處理方式
 4. 重新引入彎引號及漢字間的漢字－西文混排間隙，並依語言文字決定是否顯示
 5. 改進行尾點號懸掛的渲染方式、並簡化其生成元素及相關樣式
 6. 改進標點擠壓的渲染方式及相關樣式
 7. 改進JavaScript層面的標點樣式修正
 8. 修正標點擠壓、行尾點號懸掛與禁則`h-jinze`元素共存時的空隙顯示問題
 9. 停止更新Component套件管理器
 10. 更新normalize.css至v4.0.0

v3.2.7（2015-10-23）
---
 1. 修正行尾點號懸掛渲染後，造成代碼`code`等元素與空白字元相鄰時可能的錯置問題（#79）
 2. 加入橫排直式注音行間注（inter-character）的瀏覽器原生支援（#82）
 3. 修正組合字在OS X 10.11上可能的顯示問題
 4. 加入可調整注音符號大小的Sass/Stylus自定義變數（`$han-zhuyin-size`）

v3.2.6（2015-8-21）
---
 1. 字級選擇器（`h-char`元素）中的漢字標點加入`bd-*`類別前綴（#81）
 2. 修正可擠壓標點在`lang="zh"`下會消失的問題

v3.2.5（2015-6-29）
---
 1. 修正標點擠壓與行尾點號懸掛共用時，無法正確擠壓的問題
 2. 修正標點字體在Windows下的書名號顯示問題

v3.2.4（2015-6-26）
---
 1. 改進Stylus語法
 2. 修正Sass/Stylus中的標點定義變數及函式
 3. 改進行尾點號懸掛的實作方式，不再使用偽元素顯示
 4. 修正強調元素（著重號）邊界的標點無法正確擠壓的問題

v3.2.3（2015-6-18）
---
 1. 加入Stylus預處理器語法
 2. 修正複合式行間注在不同瀏覽器下行高不一致的問題
 3. 腳本下，注文`rt`元素預設不渲染著重號

v3.2.2（2015-6-12）
---
 1.  修正複合式（雙行）行間注在部分情況下未能正確包裹基文的問題
 2.  改進行間注`ruby`元素的顯示方式，不再使用偽元素顯示注文
 3.  調整複合式行間注各單元的盒模型寬度取値，以注文或基文寬度較大者為主，更符合HTML5標準
 4.  注音符號入聲調號區段API更名：`Han.UNICODE.zhuyin.ruyun` -> `Han.UNICODE.zhuyin.checked`
 5.  Firefox 38已支援行間注`ruby`元素，調整相應的回退樣式
 6.  詞組選擇器支援諺文的標點符號，更類似西文詞組
 7.  支援`Fibre.fn.avoid()`等原型方法
 8.  字元、詞組選擇器（`Han.fn.charify()`及`Han.fn.groupify()`）支援語言文字英文名（alias）
 9.  改進行尾點號懸掛在空白字體未正確下載的回退樣式
 10. 加入對思源黑體（Source Han Sans/Noto Sans CJK）的支援
 11. 修正四大字體集在Windows上可能無法正確顯示的問題
 12. 改進Firefox的字體顯示問題（不支援`unicode-range`屬性的瀏覽器不使用標點修正字體）
 13. 支援Firefox ESR

v3.2.1（2015-5-1）
---
 1. 修正繁體中文下，可懸掛標點後的標點擠壓問題
 2. 更新fibre.js至v0.2.1（findAndReplaceDOMText v0.4.3）
 3. 同上，字元査替器現已支援預設的文字邊界，故修正部分樣式規則
 4. 暫時移除等寬字體基型@extend的漢字標點，避免Firefox將其顯示為比例字體

v3.2.0（2015-4-26）
---
 1.  改進標點擠壓的處理方式，現已支援行首／行尾標點擠壓（#73）
 2.  新增行尾點號懸掛功能
 3.  去除彎引號二側的漢字–西文混排間隙（#59）
 4.  修正Blink下的`Han.isCombLigaNormal`判斷及PUA字元（陽入韻）替換
 5.  部分修正新版Firefox下的`@font-face`字體問題
 6.  改進`Han.detectFont()`方法的處理方式
 7.  加入文章區塊頭尾對齊的連字符樣式處理
 8.  改進字級、詞級選擇器的實作方法及其選項（`charify()`及`grupify()`）
 9.  修正IE下偽元素的剪貼簿行為
 10. 更新normalize.css至v3.0.3
 11. 改用符合custom elements規範的命名方式
    - `h-cs`（新增）
    - `h-hangable`（新增）
    - `char` -> `h-char`
    - `char_group` -> `h-char-group`
    - `word` -> `h-word`
    - `hws` -> `h-hws`
    - `jinze` -> `h-jinze`
    - `inner` -> `h-inner`
    - `hruby` -> `h-ruby`
    - `ru` -> `h-ru`
    - `zhuyin` -> `h-zhuyin`
    - `yin` -> `h-yin`
    - `diao` -> `h-diao`

v3.1.1（2015-3-14）
---
 1. 字體發布檔案不再使用符號連接方式搬移

v3.1.0（2015-3-11）
---
 1. 修正使用https協議的網頁可能顯示警告的問題（#65）
 2. 修正變音元素在非漢字語言下的意大利體問題（Chrome等）
 3. Grunt -> Gulp
 4. 以Fibre.js重寫`Han.find`函式
 5. 改以LibSass生成發布文件
 6. 修正漢字－西文混排間隙在表格中可能的顯示問題
 7. 修正基文`rb`元素不存在時可能出錯的問題（#69）
 8. 修正繁體中文點號遇結束括注號的標點擠壓問題
 9. 不再使用`hyu`及`mre`等模組代號

v3.0.2（2014-12-8）
---
 1. 修正無法為LibSass編譯的問題（感謝 @audreyt）
 2. 加入`npm test`
 3. 行間注元素的微調

v3.0.1（2014-12-6）
---
 1. 簡化CJK擴展區的正則表達式（`[\uD800-\uDBFF][\uDC00-\uDFFF]`）
 2. 修正中文偏好字體無法正確編譯的問題
 3. 修正複合式行間注元素的跨邊界問題
 4. 加入對三方向複合式行間注的樣式支援
 5. 簡化Farr構造函數的節點篩選（`Element.prototype.matches`）
 6. 修正未壓縮的`han.js`無法正確同其他庫串聯的問題
 7. 繁體中文預設使用台灣教育部式的標點集（Biaodian Pro * CNS）

v3.0.0（2014-10）
---
 1.  採用新式CSS屬性支援偵測
 2.  Han.js模組化
 3.  移除對jQuery的依賴
 4.  加入訛訊、刪訂等元素的視覺間隔
 5.  加入Web開放字型格式（`han.woff`）
 6.  取消非國標標點之彎引號樣式修正（#48）
 7.  加入對希臘字母、西里爾字母的支援（着重號、漢字西文混排間隙等，#52）
 8.  更完整的標點符號支援（#52）
 9.  加入對變音組字符（combining diacritical marks）的支援（#52）
 10. 漢字西文混排間隙新增嚴格模式（#53）
 11. 符合規範且更有彈性的着重號polyfill（#55）
 12. 為避免樣式選擇器的權重繼承問題，取消樣式表中「章節元素」「內容群組元素」
     的語言屬性，改為全局修正（字體設定除外）
 13. 加入針對Firefox的簡易標點符號修正
 14. 引入破折號、省略號「單獨存在（—）」與「連字（——）」時的標點修正。
     即，現無須專為西文文本加入相應的語言屬性即可正確顯示標點。
 15. 移除已棄用的來源元素書名號修正（#19）
 16. 加入相鄰元素的文字裝飾線視覺間隔修正（原底線修正）
 17. 加入重點、術語、關鍵字等元素對多重量字體的支援（[normalize.css/pull/342](https://github.com/necolas/normalize.css/pull/342)）
 18. 修正IE無法正確顯示陽入韻連字的問題（#50）
 19. 修正IE11下，漢字西文混排間隙可能的掉字問題（#57）
 20. 加入訛字（符）替換功能（#24）
 21. 修正增訂元素的樣式，現同註記元素相同
 22. 更新Normalize.css至版本v3.0.2

v2.3.0（2014-2-7）
---
 1.  加入圖表元素`<figure>`的邊界修正，以相容於新版Normalize CSS
 2.  加入增訂元素`<ins>`的視覺底線區隔
 3.  新增OpenType格式注音符號web font，並加入拉丁字母的陽入韻元音連字（ligature）
 4.  修正複合式行間注元素`<ruby>`在Cordova Android上的問題
 5.  加入文章區塊行高設定
 6.  取消表單元素的字體設置，使之繼承自父元素（#47）
 7.  加入聯絡資訊元素`<address>`的樣式修正（#49）
 8.  代碼改採空格縮進，取代跳格
 9.  修正漢拉間隙於各瀏覽器上顯示效果不一的問題（#40）
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

[〔更多資訊〕]
(https://github.com/ethantw/Han/issues?milestone=5&state=closed)

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

[〔更多資訊〕](https://github.com/ethantw/Han/issues?milestone=2&page=1&state=closed)

v2.1.2（2013-11-07）
---
1. 修正`article:lang(zh | ja) strong`的字重（#16）
2. 修正標點字體「Biaodian Pro Sans CNS」之分號等符號無法正確顯示的問題（#15）
3. 限定`figure > blockquote`的引號樣式在文章區塊下（#13）
4. 實驗性底線在`border-box` reset網頁下的顯示問題（#11）
5. 加入了Bower package的支援（@yhsiang，#12）

[〔更多資訊〕](https://github.com/ethantw/Han/issues?milestone=3&page=1&state=closed)

v2.1.1 （2013-10-21）
---
1. 將normalize.css加入至`han.css`中，使用Sass取代CSS的檔案調度（#7）
2. 採用Sass Partials
3. 修正四大字體集、西文斜體字體會在某些瀏覽器出現偽粗體的情況（#10）
4. 更新`findAndReplaceDOMText()`函式至版本0.4.0（#8、#9）
5. 着重號顯示位置修正（#6）

[〔更多資訊〕](https://github.com/ethantw/Han/issues?milestone=1&page=1&state=closed)

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
 1.  程式代碼依各章節分立於各檔案中
 	 * 將`normalize.css`自`han.css`中獨立，以利未來更新
	 * 將「以『語言為基礎的元素樣式修正』的『漢字標準格式』」一節獨立（於檔案`han.main.css`中）
	 * 將「各元素字體及字體集設定」獨立於`han.font.css`方便參閱、除錯和修改
	 * 將「直式國語注音符號的`<ruby>`支援」獨立於`han.zhuyin.css`中，並預設關閉，以節省檔案大小

 2.  修正註記元素不相鄰時仍有向右位移的問題（需開啓JavaScript）
 3.  以`text-indent`取代原有的「文章內段落」首段縮進方式；
     加入「文章內清單」的縮進樣式。

 4.  加入「漢拉間隙」功能（需開啓JavaScript）
 5.  加入系統不支援「楷體」時，變音文字`<i>`的相應替代樣式（需開啓JavaScript）
 6.  加入描述元素`<figure>`內的區塊引用`<blockquote>`樣式
 7.  改進`<ruby>`的注音符號顯示效果
 8.  加入手持裝置上的樣式微調
 9.  加入「標點符號樣式修正」，並區分「預設修正」及「進階修正」二種（瀏覽器需支援`unicode-range`等CSS3屬性）
 10. 加入基本元素的指定字體修正（獨立於`han.fonts.css`），取代各瀏覽器或作業系統自動卻錯誤百出的字體集fallback
 11. 加入包含「黑、宋、楷、仿宋體」的「四大字體集」CSS3 API
 12. JavaScript API
	 * 加入「用戶端功能支援測試」`han.support.*function*`
	 * 加入「用戶端字體（集）支援測試」`han.support.font()`
		  * 加入`<ruby>`支援偵測
		  * 加入`@font-face`支援偵測
	 * 加入「萬國碼正則表達式」變數集`han.unicode[]`（所有CJK區段、拉丁字母區段、注音符號及擴充區段等）

 13. 取消「類詩篇」類別`.poem-like`的元素限制，現可適用於所有區塊元素
