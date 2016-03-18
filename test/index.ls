
test = QUnit.test
module = QUnit.module

doc = -> document.cloneNode true
div = -> document.createElement \div
makeArray = -> [].slice.call it
qsa = ( context, q ) -> makeArray( context.querySelectorAll q )

convert-html = ( html ) ->
  html
    .toLowerCase!
    .replace( /[\x20\t\f\s]{2,}/g, '' )
    .replace( /[\r\n]/g, '' )
    .replace( /="([^"]+)"/g, \=$1 )

html-equal = ( act, exp, log ) ->
  act = convert-html act
  exp = convert-html exp
  equal act, exp, log

module \Basics
test 'Default rendering routine', !->
  # Chinese
  before = '<html lang="zh"><head><title>A辭Q</title></head><body><article><p></article></body></html>'
  d = doc!
  d.documentElement.innerHTML = before
  Han d.body, d.documentElement .render!

  html-equal d.body.innerHTML, '<article><p></p></article>'
  equal d.title, \A辭Q
  equal d.documentElement.classList.contains(\han-js-rendered), true

  # Japanese
  before = '<html lang="ja"><head><title>AノQ</title></head><body><article><p></article></body></html>'
  d = doc!
  d.documentElement.innerHTML = before
  Han d.body, d.documentElement .render!

  html-equal d.body.innerHTML, '<article><p></p></article>'
  equal d.title, \AノQ
  equal d.documentElement.classList.contains(\han-js-rendered), true

module \Normalisation
test 'Adjacent decoration lines', !->
  d = div!
  d.innerHTML = \<u>a</u><u>b</u>c<u>d</u>
  Han d .renderDecoLine!
  html-equal d.innerHTML, '<u>a</u><u class="adjacent">b</u>c<u>d</u>'

  d.innerHTML = \<u>測</u><u>試</u>測<u>試</u>
  Han d .renderDecoLine!
  html-equal d.innerHTML, '<u>測</u><u class="adjacent">試</u>測<u>試</u>'

  d.innerHTML = '<u>註記元素甲</u><ins>增訂元素甲</ins><u>註記元素乙</u>一般文字節點<ins>增訂元素乙</ins><u>註記元素丙</u><ins>增訂元素丙</ins>一般文字節點；<s>訛訊元素甲</s><del>刪訂元素甲</del><s>訛訊元素乙</s>一般文字節點<del>刪訂元素乙</del><s>訛訊元素乙</s><del>刪訂元素丙</del>。'
  Han d .renderDecoLine!
  html-equal d.innerHTML, '<u>註記元素甲</u><ins class="adjacent">增訂元素甲</ins><u class="adjacent">註記元素乙</u>一般文字節點<ins>增訂元素乙</ins><u class="adjacent">註記元素丙</u><ins class="adjacent">增訂元素丙</ins>一般文字節點；<s>訛訊元素甲</s><del>刪訂元素甲</del><s>訛訊元素乙</s>一般文字節點<del>刪訂元素乙</del><s>訛訊元素乙</s><del>刪訂元素丙</del>。'

  d.innerHTML = '<u>註記元素丁</u><s>訛訊元素丁</s><ins>增訂元素丁</ins><del>刪訂元素丁</del>。'
  Han d .renderDecoLine!
  html-equal d.innerHTML, '<u>註記元素丁</u><s>訛訊元素丁</s><ins>增訂元素丁</ins><del>刪訂元素丁</del>。'

test 'Emphasis marks' ( a ) ->
  support = Han.support.textemphasis
  d = div!

  # Basic
  d.innerHTML = '<em>測試abc</em>'
  Han d .renderEm!

  if support
    html-equal d.innerHTML, '<em>測試abc</em>'
  else
    html-equal d.innerHTML, '<em><h-char class=hanzi cjk>測</h-char><h-char class=hanzi cjk>試</h-char><h-word class=western><h-char class=alphabet latin>a</h-char><h-char class=alphabet latin>b</h-char><h-char class=alphabet latin>c</h-char></h-word></em>'

  # Skip punctuation
  d.innerHTML = '<em>「測『試』」，test ‘this!’。</em>'
  Han d .renderEm!

  if support
    html-equal d.innerHTML, '<em><h-char unicode=300c class=biaodian cjk bd-open>「</h-char>測<h-char unicode=300e class=biaodian cjk bd-open>『</h-char>試<h-char unicode=300f class=biaodian cjk bd-close bd-end>』</h-char><h-char unicode=300d class=biaodian cjk bd-close bd-end>」</h-char><h-char unicode=ff0c class=biaodian cjk bd-end bd-cop>，</h-char>test <h-char class=punct>‘</h-char>this<h-char class=punct>!</h-char><h-char class=punct>’</h-char><h-char unicode=3002 class=biaodian cjk bd-end bd-cop>。</h-char></em>'
  else
    a.dom-equal d.firstChild, $( '<em><h-jinze class="tou"><h-char unicode="300c" class="biaodian cjk bd-open">「</h-char><h-char class="hanzi cjk">測</h-char></h-jinze><h-jinze class="touwei"><h-char unicode="300e" class="biaodian cjk bd-open">『</h-char><h-char class="hanzi cjk">試</h-char><h-char unicode="300f" class="biaodian cjk bd-close bd-end">』</h-char><h-char unicode="300d" class="biaodian cjk bd-close bd-end">」</h-char><h-char unicode="ff0c" class="biaodian cjk bd-end bd-cop">，</h-char></h-jinze><h-word class="western"><h-char class="alphabet latin">t</h-char><h-char class="alphabet latin">e</h-char><h-char class="alphabet latin">s</h-char><h-char class="alphabet latin">t</h-char></h-word> <h-word class="western"><h-char class="punct">‘</h-char><h-char class="alphabet latin">t</h-char><h-char class="alphabet latin">h</h-char><h-char class="alphabet latin">i</h-char><h-char class="alphabet latin">s</h-char><h-char class="punct">!</h-char></h-word><h-jinze class="wei"><h-word class="western"><h-char class="punct">’</h-char></h-word><h-char unicode="3002" class="biaodian cjk bd-end bd-cop">。</h-char></h-jinze></em>' )

  # All CJK-related blocks
  d.innerHTML = '<em>𫞵𫞦𠁻𠁶〇⼌⿕⺃⻍⻰⻳⿸⿷⿳</em>'
  Han d .renderEm!

  if support
    html-equal d.innerHTML, '<em>𫞵𫞦𠁻𠁶〇⼌⿕⺃⻍⻰⻳⿸⿷⿳</em>'
  else
    html-equal d.innerHTML, '<em><h-char class=hanzi cjk>𫞵</h-char><h-char class=hanzi cjk>𫞦</h-char><h-char class=hanzi cjk>𠁻</h-char><h-char class=hanzi cjk>𠁶</h-char><h-char class=hanzi cjk>〇</h-char><h-char class=hanzi cjk>⼌</h-char><h-char class=hanzi cjk>⿕</h-char><h-char class=hanzi cjk>⺃</h-char><h-char class=hanzi cjk>⻍</h-char><h-char class=hanzi cjk>⻰</h-char><h-char class=hanzi cjk>⻳</h-char><h-char class=hanzi cjk>⿸</h-char><h-char class=hanzi cjk>⿷</h-char><h-char class=hanzi cjk>⿳</h-char></em>'

  # All western letters
  d.innerHTML = '<em>¡Hola! Ὅμηρος Свети</em>'
  Han d .renderEm!

  if support
    html-equal d.innerHTML, '<em><h-char class=punct>¡</h-char>hola<h-char class=punct>!</h-char> ὅμηρος свети</em>'
  else
    html-equal d.innerHTML, '<em><h-word class=western><h-char class=punct>¡</h-char><h-char class=alphabet latin>h</h-char><h-char class=alphabet latin>o</h-char><h-char class=alphabet latin>l</h-char><h-char class=alphabet latin>a</h-char><h-char class=punct>!</h-char></h-word> <h-word class=western><h-char class=alphabet ellinika greek>ὅ</h-char><h-char class=alphabet ellinika greek>μ</h-char><h-char class=alphabet ellinika greek>η</h-char><h-char class=alphabet ellinika greek>ρ</h-char><h-char class=alphabet ellinika greek>ο</h-char><h-char class=alphabet ellinika greek>ς</h-char></h-word> <h-word class=western><h-char class=alphabet kirillica cyrillic>с</h-char><h-char class=alphabet kirillica cyrillic>в</h-char><h-char class=alphabet kirillica cyrillic>е</h-char><h-char class=alphabet kirillica cyrillic>т</h-char><h-char class=alphabet kirillica cyrillic>и</h-char></h-word></em>'

test 'Interlinear annotations (Ruby)', ( a ) ->
  support = Han.support.ruby
  support-zhuyin = Han.support['ruby-interchar']
  support-ruby-display = Han.support['ruby-display']
  d = div!

  # Basic
  d.innerHTML = '<ruby>字<rt>zi</ruby>'
  Han d .renderRuby!

  if support
    html-equal d.innerHTML, '<ruby>字<rt>zi</rt></ruby>'
  else
    html-equal d.innerHTML, '<h-ruby><h-ru annotation=zi>字<rt>zi</rt></h-ru></h-ruby>'

  # Zhuyin
  d.innerHTML = '''
<ruby class="zhuyin">
  事<rt>ㄕˋ</rt>情<rt>ㄑㄧㄥˊ</rt>
  看<rt>ㄎㄢˋ</rt>
  冷<rt>ㄌㄥˇ</rt>暖<rt>ㄋㄨㄢˇ</rt>
</ruby>
'''
  Han d .renderRuby!
  qsa d, \h-ru
  .forEach !->
    it.removeAttribute \form
    it.removeAttribute \zhuyin
    it.removeAttribute \diao
    it.removeAttribute \length
  if support-zhuyin
    html-equal d.innerHTML, '<ruby class=zhuyin>事<rt><h-zhuyin length=1 diao=ˋ><h-yin>ㄕ</h-yin><h-diao>ˋ</h-diao></h-zhuyin></rt>情<rt><h-zhuyin length=3 diao=ˊ><h-yin>ㄑㄧㄥ</h-yin><h-diao>ˊ</h-diao></h-zhuyin></rt>看<rt><h-zhuyin length=2 diao=ˋ><h-yin>ㄎㄢ</h-yin><h-diao>ˋ</h-diao></h-zhuyin></rt>冷<rt><h-zhuyin length=2 diao=ˇ><h-yin>ㄌㄥ</h-yin><h-diao>ˇ</h-diao></h-zhuyin></rt>暖<rt><h-zhuyin length=3 diao=ˇ><h-yin>ㄋㄨㄢ</h-yin><h-diao>ˇ</h-diao></h-zhuyin></rt></ruby>'
  else
    a.dom-equal d.firstChild, $(
      '''
      <h-ruby class="zhuyin"><h-ru>
        事<h-zhuyin length="1" diao="ˋ"><h-yin>ㄕ</h-yin><h-diao>ˋ</h-diao></h-zhuyin></h-ru><h-ru>情<h-zhuyin length="3" diao="ˊ"><h-yin>ㄑㄧㄥ</h-yin><h-diao>ˊ</h-diao></h-zhuyin></h-ru><h-ru>
        看<h-zhuyin length="2" diao="ˋ"><h-yin>ㄎㄢ</h-yin><h-diao>ˋ</h-diao></h-zhuyin></h-ru><h-ru>
        冷<h-zhuyin length="2" diao="ˇ"><h-yin>ㄌㄥ</h-yin><h-diao>ˇ</h-diao></h-zhuyin></h-ru><h-ru>暖<h-zhuyin length="3" diao="ˇ"><h-yin>ㄋㄨㄢ</h-yin><h-diao>ˇ</h-diao></h-zhuyin></h-ru>
      </h-ruby>
      '''
    )

  # Complex ruby
  d.innerHTML = '''
<p>
  <ruby class="complex">
    辛亥革命發生在<rb>1911-</rb><rb>10-</rb><rb>10，</rb>
      <rtc><rt>年</rt><rt>月</rt><rt>日</rt></rtc>
      <rtc><rt rbspan="3">清宣統三年</rt></rtc>
    那天革命先烈們一同推翻了帝制。
  </ruby>
</p>
'''
  Han d .renderRuby!
  d.querySelector \h-ruby .removeAttribute \doubleline
  qsa d, \h-ru
  .forEach !->
    it.removeAttribute \annotation
    it.removeAttribute \order
    it.removeAttribute \span
  html-equal d.innerHTML, '<p><h-ruby class=complex>辛亥革命發生在<h-ru class=complex><h-ru class=complex><rb>1911-</rb><rt>年</rt></h-ru><h-ru class=complex><rb>10-</rb><rt>月</rt></h-ru><h-ru class=complex><rb>10，</rb><rt>日</rt></h-ru><rt rbspan=3>清宣統三年</rt></h-ru>那天革命先烈們一同推翻了帝制。</h-ruby></p>'

  d.innerHTML = '''
<p>
  <ruby class="complex">
    「<rb>紐</rb><rb>約</rb><rb>市</rb>」
    <rtc class="reading romanization">
      <rt rbspan="2">Niǔyuē</rt><rt>Shì</rt>
    </rtc>
    <rtc class="reading annotation">
      <rt rbspan="3">New York City</rt>
    </rtc>
  </ruby>

  <ruby class="complex">
    『<rb>紐</rb><rb>約</rb><rb>市</rb>』
    <rtc class="reading annotation">
      <rt rbspan="3">New York City</rt>
    </rtc>
    <rtc class="reading romanization">
      <rt rbspan="2">Niǔyuē</rt><rt>Shì</rt>
    </rtc>
  </ruby>

  <ruby class="complex">
    ‘<rb>紐</rb><rb>約</rb><rb>市</rb>’
    <rtc class="reading annotation">
      <rt rbspan="3">New York City</rt>
    </rtc>
    <rtc class="reading romanization">
      <rt>niǔ</rt><rt>yuē</rt><rt>shì</rt></rtc>
  </ruby>

  <ruby class="complex">
    &#x201E;<rb>紐</rb><rb>約</rb><rb>市</rb>&#x201F;
    <rtc class="reading romanization">
      <rt>niǔ</rt><rt>yuē</rt><rt>shì</rt>
    </rtc>
    <rtc class="reading annotation">
      <rt rbspan="3">New York City</rt>
    </rtc>
  </ruby>

  <ruby class="complex">
    ⸘<rb>紐</rb><rb>約</rb><rb>市</rb>‽
    <rtc class="reading annotation">
      <rt rbspan="3">New York City</rt>
    </rtc>
    <rtc class="reading annotation">
      <rt rbspan="3">世界之都</rt>
    </rtc>
    </ruby>。
<p>
  <ruby class="complex">
    <rb>三</rb><rb>十</rb><rb>六</rb><rb>個</rb><rb>牙</rb><rb>齒</rb>，
    <rb>捉</rb><rb>對</rb><rb>兒</rb><rb>廝</rb><rb>打</rb>！

    <rtc class="romanization">
      <rt>san1</rt><rt>shih2</rt><rt>liu4</rt><rt>ko0</rt><rt>ya2</rt><rt>ch\'ih3</rt><rt>cho1</rt><rt rbspan="2">tuirh4</rt><rt>ssu1</rt><rt>ta3</rt>
    </rtc>
    <rtc class="romanization">
      <rt>sān</rt><rt>shí</rt><rt>liù</rt><rt>ge</rt><rt>yá</rt><rt>chǐ</rt><rt>zhuō</rt><rt rbspan="2">duìr</rt><rt>sī</rt><rt>dǎ</rt>
    </rtc>
  </ruby>
'''
  Han d .renderRuby!
  a.dom-equal d.firstChild, $(
    '''
<p>
  <h-ruby doubleline="true" class="complex">
    「<h-ru annotation="true" order="1" span="3" class="complex"><h-ru annotation="true" order="0" span="2" class="complex"><rb>紐</rb><rb>約</rb><rt rbspan="2">Niǔyuē</rt></h-ru><h-ru annotation="true" order="0" span="1" class="complex"><rb>市</rb><rt>Shì</rt></h-ru><rt rbspan="3">New York City</rt></h-ru>」
    
    
  </h-ruby>

  <h-ruby doubleline="true" class="complex">
    『<h-ru annotation="true" order="0" span="3" class="complex"><h-ru annotation="true" order="1" span="2" class="complex"><rb>紐</rb><rb>約</rb><rt rbspan="2">Niǔyuē</rt></h-ru><h-ru annotation="true" order="1" span="1" class="complex"><rb>市</rb><rt>Shì</rt></h-ru><rt rbspan="3">New York City</rt></h-ru>』
    
    
  </h-ruby>

  <h-ruby doubleline="true" class="complex">
    ‘<h-ru annotation="true" order="0" span="3" class="complex"><h-ru annotation="true" order="1" span="1" class="complex"><rb>紐</rb><rt>niǔ</rt></h-ru><h-ru annotation="true" order="1" span="1" class="complex"><rb>約</rb><rt>yuē</rt></h-ru><h-ru annotation="true" order="1" span="1" class="complex"><rb>市</rb><rt>shì</rt></h-ru><rt rbspan="3">New York City</rt></h-ru>’
    
    
  </h-ruby>

  <h-ruby doubleline="true" class="complex">
    „<h-ru annotation="true" order="1" span="3" class="complex"><h-ru annotation="true" order="0" span="1" class="complex"><rb>紐</rb><rt>niǔ</rt></h-ru><h-ru annotation="true" order="0" span="1" class="complex"><rb>約</rb><rt>yuē</rt></h-ru><h-ru annotation="true" order="0" span="1" class="complex"><rb>市</rb><rt>shì</rt></h-ru><rt rbspan="3">New York City</rt></h-ru>‟
    
    
  </h-ruby>

  <h-ruby doubleline="true" class="complex">
    ⸘<h-ru annotation="true" order="1" span="3" class="complex"><h-ru annotation="true" order="0" span="3" class="complex"><rb>紐</rb><rb>約</rb><rb>市</rb><rt rbspan="3">New York City</rt></h-ru><rt rbspan="3">世界之都</rt></h-ru>‽
    
    
    </h-ruby>。
</p><p>
  <h-ruby doubleline="true" class="complex">
    <h-ru annotation="true" order="1" span="1" class="complex"><h-ru annotation="true" order="0" span="1" class="complex"><rb>三</rb><rt>san1</rt></h-ru><rt>sān</rt></h-ru><h-ru annotation="true" order="1" span="1" class="complex"><h-ru annotation="true" order="0" span="1" class="complex"><rb>十</rb><rt>shih2</rt></h-ru><rt>shí</rt></h-ru><h-ru annotation="true" order="1" span="1" class="complex"><h-ru annotation="true" order="0" span="1" class="complex"><rb>六</rb><rt>liu4</rt></h-ru><rt>liù</rt></h-ru><h-ru annotation="true" order="1" span="1" class="complex"><h-ru annotation="true" order="0" span="1" class="complex"><rb>個</rb><rt>ko0</rt></h-ru><rt>ge</rt></h-ru><h-ru annotation="true" order="1" span="1" class="complex"><h-ru annotation="true" order="0" span="1" class="complex"><rb>牙</rb><rt>ya2</rt></h-ru><rt>yá</rt></h-ru><h-ru annotation="true" order="1" span="1" class="complex"><h-ru annotation="true" order="0" span="1" class="complex"><rb>齒</rb><rt>ch'ih3</rt></h-ru><rt>chǐ</rt></h-ru>，
    <h-ru annotation="true" order="1" span="1" class="complex"><h-ru annotation="true" order="0" span="1" class="complex"><rb>捉</rb><rt>cho1</rt></h-ru><rt>zhuō</rt></h-ru><h-ru annotation="true" order="1" span="2" class="complex"><h-ru annotation="true" order="0" span="2" class="complex"><rb>對</rb><rb>兒</rb><rt rbspan="2">tuirh4</rt></h-ru><rt rbspan="2">duìr</rt></h-ru><h-ru annotation="true" order="1" span="1" class="complex"><h-ru annotation="true" order="0" span="1" class="complex"><rb>廝</rb><rt>ssu1</rt></h-ru><rt>sī</rt></h-ru><h-ru annotation="true" order="1" span="1" class="complex"><h-ru annotation="true" order="0" span="1" class="complex"><rb>打</rb><rt>ta3</rt></h-ru><rt>dǎ</rt></h-ru>！

    
    
  </h-ruby></p>
    '''
  )

  # Triaxial ruby
  d.innerHTML = '''
<p>
  <ruby class="complex">
  <rb>一</rb>
  <rb>人</rb>
  <rb>煩</rb>
  <rb>惱</rb>
  <rb>一</rb>
  <rb>樣</rb>。

  <rtc class="zhuyin">
    <rt>ㄐㄧㆵ͘</rt>
    <rt>ㄌㄤˊ</rt>
    <rt>ㄏㄨㄢˊ</rt>
    <rt>ㄌㄜˋ</rt>
    <rt>ㄐㄧㆵ͘</rt>
    <rt>ㄧㆫ˫</rt>
  </rtc>

  <rtc class="romanization">
    <rt>Tsi̍t</rt>
    <rt>lâng</rt>
    <rt rbspan="2">hoân‑ló</rt>
    <rt>chi̍t</rt>
    <rt>iūⁿ</rt>
  </rtc>

  <rtc class="romanization"><rt>Tsi̍t</rt>
    <rt>lâng</rt>
    <rt rbspan="2">huân-ló</rt>
    <rt>tsi̍t</rt>
    <rt>iūnn</rt>
    </rtc>
  </ruby>
</p>
'''
  Han d .renderRuby!
  result = []
  $( d ).find( 'rb, h-zhuyin' )
  .each -> result.push $( this ).text!
  equal( result.join( ',' ), '一,ㄐㄧㆵ͘,人,ㄌㄤˊ,煩,ㄏㄨㄢˊ,惱,ㄌㄜˋ,一,ㄐㄧㆵ͘,樣,ㄧㆫ˫' )

module 'Advanced typesetting features'
test 'Hanzi-Western script mixed spacing (HWS)' ->
  d = div!

  # Basic
  d.innerHTML = '測試test測試123測試'
  Han d .renderHWS!
  html-equal d.innerHTML, '測試<h-hws hidden=""> </h-hws>test<h-hws hidden=""> </h-hws>測試<h-hws hidden=""> </h-hws>123<h-hws hidden=""> </h-hws>測試'

  # issue 79 (https://github.com/ethantw/Han/issues/79)
  d.innerHTML = '中文加上 <code>some code</code>，中文加上 <code>some code</code> 放在中間，<code>some code</code> 加上中文，一般的 English。'
  Han d .renderHWS!
  html-equal d.innerHTML, '中文加上 <code>some code</code>，中文加上 <code>some code</code> 放在中間，<code>some code</code> 加上中文，一般的 English。'

  d.innerHTML = '中文加上<code>some code</code>，中文加上<code>some code</code>放在中間，<code>some code</code>加上中文，一般的English。'
  Han d .renderHWS!
  html-equal d.innerHTML, '中文加上<h-hws hidden=\"\"> </h-hws><code>some code</code>，中文加上<h-hws hidden=\"\"> </h-hws><code>some code</code><h-hws hidden=\"\"> </h-hws>放在中間，<code>some code</code><h-hws hidden=\"\"> </h-hws>加上中文，一般的<h-hws hidden=\"\"> </h-hws>English。'

  # Strict mode
  d.innerHTML = '測試 test 測試 123 測試<code>測試 test測試。</code>'
  Han d .renderHWS true
  html-equal d.innerHTML, '測試<h-hws hidden=""> </h-hws>test<h-hws hidden=""> </h-hws>測試<h-hws hidden=""> </h-hws>123<h-hws hidden=""> </h-hws>測試<code>測試 test測試。</code>'

  # With Biaodian
  d.innerHTML = '測試，test測試123。'
  Han d .renderHWS!
  html-equal d.innerHTML, '測試，test<h-hws hidden=""> </h-hws>測試<h-hws hidden=""> </h-hws>123。'

  # Greek letters
  d.innerHTML = '測試α測試β測試'
  Han d .renderHWS!
  html-equal d.innerHTML, '測試<h-hws hidden=""> </h-hws>α<h-hws hidden=""> </h-hws>測試<h-hws hidden=""> </h-hws>β<h-hws hidden=""> </h-hws>測試'

  # Cyrillic letters
  d.innerHTML = 'я測試у測試ь測試в'
  Han d .renderHWS!
  html-equal d.innerHTML, 'я<h-hws hidden=""> </h-hws>測試<h-hws hidden=""> </h-hws>у<h-hws hidden=""> </h-hws>測試<h-hws hidden=""> </h-hws>ь<h-hws hidden=""> </h-hws>測試<h-hws hidden=""> </h-hws>в'

  # All CJK-related blocks
  d.innerHTML = 'A㐀a㘻a䶵a𠀀a𫠝a〇a⿸a⻍a⻰aのa'
  Han d .renderHWS!
  html-equal d.innerHTML, 'a<h-hws hidden=""> </h-hws>㐀<h-hws hidden=""> </h-hws>a<h-hws hidden=""> </h-hws>㘻<h-hws hidden=""> </h-hws>a<h-hws hidden=""> </h-hws>䶵<h-hws hidden=""> </h-hws>a<h-hws hidden=""> </h-hws>𠀀<h-hws hidden=""> </h-hws>a<h-hws hidden=""> </h-hws>𫠝<h-hws hidden=""> </h-hws>a<h-hws hidden=""> </h-hws>〇<h-hws hidden=""> </h-hws>a<h-hws hidden=""> </h-hws>⿸<h-hws hidden=""> </h-hws>a<h-hws hidden=""> </h-hws>⻍<h-hws hidden=""> </h-hws>a<h-hws hidden=""> </h-hws>⻰<h-hws hidden=""> </h-hws>a<h-hws hidden=""> </h-hws>の<h-hws hidden=""> </h-hws>a'

  # Combining characters
  d.innerHTML = '天然ê上好。荷Ὅ̴̊̌ηρος̃馬。貓К҉о҈ш҉к҈а҈咪。'
  Han d .renderHWS!
  html-equal d.innerHTML, '天然<h-hws hidden=""> </h-hws>ê<h-hws hidden=""> </h-hws>上好。荷<h-hws hidden=""> </h-hws>ὅ̴̊̌ηρος̃<h-hws hidden=""> </h-hws>馬。貓<h-hws hidden=""> </h-hws>к҉о҈ш҉к҈а҈<h-hws hidden=""> </h-hws>咪。'

  # Cross-boundary
  d.innerHTML = '去<u>Europe</u>旅行。'
  Han d .renderHWS!
  html-equal d.innerHTML, '去<h-hws hidden=""> </h-hws><u>europe</u><h-hws hidden=""> </h-hws>旅行。'

  # With comments or `<wbr>`
  d.innerHTML = '去<!-- x -->Europe<wbr><!---->旅行。'
  Han d .renderHWS!
  html-equal d.innerHTML, '去<h-hws hidden=\"\"> </h-hws><!-- x -->europe<h-hws hidden=\"\"> </h-hws><wbr><!---->旅行。'

  # Edge cases
  d.innerHTML = '測試¿測試?測試¡測試!為‘什’麼;為“什”麼?'
  Han d .renderHWS!
  $$qo = jQuery( 'h-hws.quote-outer', d )
  equal $$qo.length, 4
  $$qo.removeAttr( 'class' )
  html-equal d.innerHTML, "測試<h-hws hidden=\"\"> </h-hws>¿測試?<h-hws hidden=\"\"> </h-hws>測試<h-hws hidden=\"\"> </h-hws>¡測試!<h-hws hidden=\"\"> </h-hws>為<h-hws hidden=\"\"> </h-hws>‘什’<h-hws hidden=\"\"> </h-hws>麼;<h-hws hidden=\"\"> </h-hws>為<h-hws hidden=\"\"> </h-hws>“什”<h-hws hidden=\"\"> </h-hws>麼?"

  d.innerHTML = '單\'引\'號和雙"引"號和單\'引\'號和雙"引"號.'
  Han d .renderHWS!
  $$qi = jQuery( 'h-hws.quote-inner', d )
  equal $$qi.length, 8
  $$qi.removeAttr( 'class' )
  html-equal d.innerHTML, "單<h-hws hidden=\"\"> </h-hws>'<h-hws hidden=\"\"> </h-hws>引<h-hws hidden=\"\"> </h-hws>'<h-hws hidden=\"\"> </h-hws>號和雙<h-hws hidden=\"\"> </h-hws>\"<h-hws hidden=\"\"> </h-hws>引<h-hws hidden=\"\"> </h-hws>\"<h-hws hidden=\"\"> </h-hws>號和單<h-hws hidden=\"\"> </h-hws>'<h-hws hidden=\"\"> </h-hws>引<h-hws hidden=\"\"> </h-hws>'<h-hws hidden=\"\"> </h-hws>號和雙<h-hws hidden=\"\"> </h-hws>\"<h-hws hidden=\"\"> </h-hws>引<h-hws hidden=\"\"> </h-hws>\"<h-hws hidden=\"\"> </h-hws>號."

  d.innerHTML = '\'單x引x號\'"雙x引x號".'
  Han d .renderHWS!
  $$qi = jQuery( 'h-hws.quote-inner', d )
  equal $$qi.length, 4
  $$qi.removeAttr( 'class' )
  html-equal d.innerHTML, "'<h-hws hidden=\"\"> </h-hws>單<h-hws hidden=\"\"> </h-hws>x<h-hws hidden=\"\"> </h-hws>引<h-hws hidden=\"\"> </h-hws>x<h-hws hidden=\"\"> </h-hws>號<h-hws hidden=\"\"> </h-hws>'\"<h-hws hidden=\"\"> </h-hws>雙<h-hws hidden=\"\"> </h-hws>x<h-hws hidden=\"\"> </h-hws>引<h-hws hidden=\"\"> </h-hws>x<h-hws hidden=\"\"> </h-hws>號<h-hws hidden=\"\"> </h-hws>\"."

  d.innerHTML = '單\'引\'號和雙"引"號和單\'引\'號和雙"引"號.'
  Han d .renderHWS!
  $$qi = jQuery( 'h-hws.quote-inner', d )
  equal $$qi.length, 8
  $$qi.removeAttr( 'class' )
  html-equal d.innerHTML, "單<h-hws hidden=\"\"> </h-hws>'<h-hws hidden=\"\"> </h-hws>引<h-hws hidden=\"\"> </h-hws>'<h-hws hidden=\"\"> </h-hws>號和雙<h-hws hidden=\"\"> </h-hws>\"<h-hws hidden=\"\"> </h-hws>引<h-hws hidden=\"\"> </h-hws>\"<h-hws hidden=\"\"> </h-hws>號和單<h-hws hidden=\"\"> </h-hws>'<h-hws hidden=\"\"> </h-hws>引<h-hws hidden=\"\"> </h-hws>'<h-hws hidden=\"\"> </h-hws>號和雙<h-hws hidden=\"\"> </h-hws>\"<h-hws hidden=\"\"> </h-hws>引<h-hws hidden=\"\"> </h-hws>\"<h-hws hidden=\"\"> </h-hws>號."

  d.innerHTML = """這是一段包含單'<u>引</u>'號和雙<u>"引</u>"號'<b>單引號</b>'和"<b>雙引號"</b>的文字."""
  Han d .renderHWS!
  $$qi = jQuery( 'h-hws.quote-inner', d )
  equal $$qi.length, 8
  $$qi.removeAttr( 'class' )
  html-equal d.innerHTML, "這是一段包含單<h-hws hidden=\"\"> </h-hws>'<h-hws hidden=\"\"> </h-hws><u>引</u><h-hws hidden=\"\"> </h-hws>'<h-hws hidden=\"\"> </h-hws>號和雙<h-hws hidden=\"\"> </h-hws><u>\"<h-hws hidden=\"\"> </h-hws>引</u><h-hws hidden=\"\"> </h-hws>\"<h-hws hidden=\"\"> </h-hws>號<h-hws hidden=\"\"> </h-hws>'<h-hws hidden=\"\"> </h-hws><b>單引號</b><h-hws hidden=\"\"> </h-hws>'<h-hws hidden=\"\"> </h-hws>和<h-hws hidden=\"\"> </h-hws>\"<h-hws hidden=\"\"> </h-hws><b>雙引號<h-hws hidden=\"\"> </h-hws>\"</b><h-hws hidden=\"\"> </h-hws>的文字."

  d.innerHTML = '你是咧com<u><i>啥物</i></u>plain啦！'
  Han d .renderHWS!
  html-equal d.innerHTML, '你是咧<h-hws hidden=""> </h-hws>com<h-hws hidden=""> </h-hws><u><i>啥物</i></u><h-hws hidden=""> </h-hws>plain<h-hws hidden=""> </h-hws>啦！'

  d.innerHTML = '<u class="pn">美國</u><span lang="en">Chicago</span><em>是</em>這架飛船的目的地。'
  Han d .renderHWS!
  html-equal d.innerHTML, '<u class=pn>美國</u><h-hws hidden=""> </h-hws><span lang=en>chicago</span><h-hws hidden=""> </h-hws><em>是</em>這架飛船的目的地。'

  d.innerHTML = '<p>不知道是不是<u lang="en"><!-- comment --><wbr><!-- comment --><wbr><!-- comment -->like this</u>你用「元件檢閱器」看看。</p>'
  Han d .renderHWS!
  html-equal d.innerHTML, '<p>不知道是不是<h-hws hidden=""> </h-hws><u lang=en><!-- comment --><wbr><!-- comment --><wbr><!-- comment -->like this</u><h-hws hidden=""> </h-hws>你用「元件檢閱器」看看。</p>'

test 'Biaodian jiya', ( a ) ->
  d = div!
  d.innerHTML = '<p>「字『字』？」字「字『字』」字？</p>'
  Han d .renderJiya!
  a.dom-equal d.firstChild, $( '<p><h-char unicode="300c" class="biaodian cjk bd-open bd-jiya"><h-inner>「</h-inner></h-char>字<h-char unicode="300e" class="biaodian cjk bd-open bd-jiya"><h-inner>『</h-inner></h-char>字<h-char unicode="300f" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>』</h-inner></h-char><h-char unicode="ff1f" class="biaodian cjk bd-end bd-jiya bd-consecutive" prev="bd-close bd-end"><h-inner>？</h-inner></h-char><h-char unicode="300d" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive end-portion" prev="bd-end"><h-inner>」</h-inner></h-char>字<h-char unicode="300c" class="biaodian cjk bd-open bd-jiya"><h-inner>「</h-inner></h-char>字<h-char unicode="300e" class="biaodian cjk bd-open bd-jiya"><h-inner>『</h-inner></h-char>字<h-char unicode="300f" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>』</h-inner></h-char><h-char unicode="300d" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive end-portion" prev="bd-close bd-end"><h-inner>」</h-inner></h-char>字<h-char unicode="ff1f" class="biaodian cjk bd-end bd-jiya"><h-inner>？</h-inner></h-char></p>' )

  d.innerHTML = '<p>字、「字」字，（字）字……「字」。'
  Han d .renderJiya!
  a.dom-equal d.firstChild, $( '<p>字<h-char unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive"><h-inner>、</h-inner></h-char><h-char unicode="300c" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion" prev="bd-end bd-cop"><h-inner>「</h-inner></h-char>字<h-char unicode="300d" class="biaodian cjk bd-close bd-end bd-jiya"><h-inner>」</h-inner></h-char>字<h-char unicode="ff0c" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive"><h-inner>，</h-inner></h-char><h-char unicode="ff08" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion" prev="bd-end bd-cop"><h-inner>（</h-inner></h-char>字<h-char unicode="ff09" class="biaodian cjk bd-close bd-end bd-jiya"><h-inner>）</h-inner></h-char>字<h-char unicode="2026" class="biaodian cjk bd-liga bd-jiya bd-consecutive"><h-inner>……</h-inner></h-char><h-char unicode="300c" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion" prev="bd-liga"><h-inner>「</h-inner></h-char>字<h-char unicode="300d" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>」</h-inner></h-char><h-char unicode="3002" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive end-portion" prev="bd-close bd-end"><h-inner>。</h-inner></h-char></p>' )

  d.innerHTML = '<p>《書名》〈篇名〉（內容）'
  Han d .renderJiya!
  a.dom-equal d.firstChild, $( '<p><h-char unicode="300a" class="biaodian cjk bd-open bd-jiya"><h-inner>《</h-inner></h-char>書名<h-char unicode="300b" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>》</h-inner></h-char><h-char unicode="3008" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion" prev="bd-close bd-end"><h-inner>〈</h-inner></h-char>篇名<h-char unicode="3009" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>〉</h-inner></h-char><h-char unicode="ff08" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion" prev="bd-close bd-end"><h-inner>（</h-inner></h-char>內容<h-char unicode="ff09" class="biaodian cjk bd-close bd-end bd-jiya"><h-inner>）</h-inner></h-char></p>' )

  unless Han.support.textemphasis
    d.innerHTML = '<p><em>《書名》〈篇名〉（內容）「『好』、不好」</em>'
    Han d .renderElem! .renderJiya!
    a.dom-equal d.firstChild, $( '<p><em><h-cs class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="tou"><h-char unicode="300a" class="biaodian cjk bd-open bd-jiya"><h-inner>《</h-inner></h-char><h-char class="hanzi cjk">書</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">名</h-char><h-char unicode="300b" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>》</h-inner></h-char></h-jinze><h-cs prev="bd-close bd-end" next="bd-open" class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="tou"><h-char prev="bd-close bd-end" unicode="3008" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>〈</h-inner></h-char><h-char class="hanzi cjk">篇</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">名</h-char><h-char unicode="3009" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>〉</h-inner></h-char></h-jinze><h-cs prev="bd-close bd-end" next="bd-open" class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="tou"><h-char prev="bd-close bd-end" unicode="ff08" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>（</h-inner></h-char><h-char class="hanzi cjk">內</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">容</h-char><h-char unicode="ff09" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>）</h-inner></h-char></h-jinze><h-cs prev="bd-close bd-end" next="bd-open" class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="touwei"><h-char prev="bd-close bd-end" unicode="300c" class="biaodian cjk bd-open bd-jiya bd-consecutive"><h-inner>「</h-inner></h-char><h-char prev="bd-open" unicode="300e" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>『</h-inner></h-char><h-char class="hanzi cjk">好</h-char><h-char unicode="300f" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>』</h-inner></h-char><h-char prev="bd-close bd-end" unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive end-portion"><h-inner>、</h-inner></h-char></h-jinze><h-cs next="bd-open" class="jinze-outer jiya-outer bd-end bd-cop   end-portion" hidden=""> </h-cs><h-char class="hanzi cjk">不</h-char><h-jinze class="wei"><h-char class="hanzi cjk">好</h-char><h-char unicode="300d" class="biaodian cjk bd-close bd-end bd-jiya"><h-inner>」</h-inner></h-char></h-jinze><h-cs class="jinze-outer jiya-outer" hidden=""> </h-cs></em></p>' )

    d.innerHTML = '<p><em>內容《書名》〈篇名〉（內容）「好、『不好』」</em>'
    Han d .renderElem! .renderJiya!
    a.dom-equal d.firstChild, $( '<p><em><h-char class="hanzi cjk">內</h-char><h-char class="hanzi cjk">容</h-char><h-cs class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="tou"><h-char unicode="300a" class="biaodian cjk bd-open bd-jiya"><h-inner>《</h-inner></h-char><h-char class="hanzi cjk">書</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">名</h-char><h-char unicode="300b" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>》</h-inner></h-char></h-jinze><h-cs prev="bd-close bd-end" next="bd-open" class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="tou"><h-char prev="bd-close bd-end" unicode="3008" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>〈</h-inner></h-char><h-char class="hanzi cjk">篇</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">名</h-char><h-char unicode="3009" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>〉</h-inner></h-char></h-jinze><h-cs prev="bd-close bd-end" next="bd-open" class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="tou"><h-char prev="bd-close bd-end" unicode="ff08" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>（</h-inner></h-char><h-char class="hanzi cjk">內</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">容</h-char><h-char unicode="ff09" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>）</h-inner></h-char></h-jinze><h-cs prev="undefined" next="bd-open" class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="touwei"><h-char prev="bd-close bd-end" unicode="300c" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>「</h-inner></h-char><h-char class="hanzi cjk">好</h-char><h-char unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive"><h-inner>、</h-inner></h-char></h-jinze><h-cs prev="bd-end bd-cop" next="bd-open" class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="tou"><h-char prev="bd-end bd-cop" unicode="300e" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>『</h-inner></h-char><h-char class="hanzi cjk">不</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">好</h-char><h-char unicode="300f" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>』</h-inner></h-char><h-char prev="bd-close bd-end" unicode="300d" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive end-portion"><h-inner>」</h-inner></h-char></h-jinze><h-cs class="jinze-outer jiya-outer bd-close bd-end   end-portion" hidden=""> </h-cs></em></p>' )

    d.innerHTML = '<p>內容<em>《書名》〈篇名〉（內容）「好」、『不好』</em>'
    Han d .renderElem! .renderJiya!
    a.dom-equal d.firstChild, $( '<p>內容<em><h-cs class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="tou"><h-char unicode="300a" class="biaodian cjk bd-open bd-jiya"><h-inner>《</h-inner></h-char><h-char class="hanzi cjk">書</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">名</h-char><h-char unicode="300b" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>》</h-inner></h-char></h-jinze><h-cs prev="bd-close bd-end" next="bd-open" class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="tou"><h-char prev="bd-close bd-end" unicode="3008" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>〈</h-inner></h-char><h-char class="hanzi cjk">篇</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">名</h-char><h-char unicode="3009" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>〉</h-inner></h-char></h-jinze><h-cs prev="bd-close bd-end" next="bd-open" class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="tou"><h-char prev="bd-close bd-end" unicode="ff08" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>（</h-inner></h-char><h-char class="hanzi cjk">內</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">容</h-char><h-char unicode="ff09" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>）</h-inner></h-char></h-jinze><h-cs prev="bd-close bd-end" next="bd-open" class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="touwei"><h-char prev="bd-close bd-end" unicode="300c" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>「</h-inner></h-char><h-char class="hanzi cjk">好</h-char><h-char unicode="300d" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>」</h-inner></h-char><h-char prev="bd-close bd-end" unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive"><h-inner>、</h-inner></h-char></h-jinze><h-cs prev="bd-end bd-cop" next="bd-open" class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="tou"><h-char prev="bd-end bd-cop" unicode="300e" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>『</h-inner></h-char><h-char class="hanzi cjk">不</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">好</h-char><h-char unicode="300f" class="biaodian cjk bd-close bd-end bd-jiya"><h-inner>』</h-inner></h-char></h-jinze><h-cs class="jinze-outer jiya-outer" hidden=""> </h-cs></em></p>' )

test 'Hanging Biaodian', ( a ) ->
  d = div!

  d.innerHTML = '<p>點、點，點。點．'
  Han d .renderHanging!
  a.dom-equal d.firstChild, $( '<p>點<h-char unicode="3001" class="biaodian cjk bd-end bd-cop bd-hangable"><h-inner>、</h-inner></h-char>點<h-char unicode="ff0c" class="biaodian cjk bd-end bd-cop bd-hangable"><h-inner>，</h-inner></h-char>點<h-char unicode="3002" class="biaodian cjk bd-end bd-cop bd-hangable"><h-inner>。</h-inner></h-char>點<h-char unicode="ff0e" class="biaodian cjk bd-end bd-hangable"><h-inner>．</h-inner></h-char></p>' )

  d.innerHTML = '「標點。」'
  Han d .renderHanging!
  html-equal d.innerHTML, '「標點。」'

  d.innerHTML = '<p>標點……。'
  Han d .renderHanging!
  a.dom-equal d.firstChild, $( '<p>標點……<h-char unicode="3002" class="biaodian cjk bd-end bd-cop bd-hangable"><h-inner>。</h-inner></h-char></p>' )

  d.innerHTML = '<p>「標點」。'
  Han d .renderHanging!
  a.dom-equal d.firstChild, $( '<p>「標點」<h-char unicode="3002" class="biaodian cjk bd-end bd-cop bd-hangable"><h-inner>。</h-inner></h-char></p>' )

  unless Han.support.textemphasis
    d.innerHTML = '<em>《書名》〈篇名〉（內容）「『好』、不好」</em>'
    Han d .renderElem! .renderHanging!
    a.dom-equal d.firstChild, $( '<em><h-jinze class="tou"><h-char unicode="300a" class="biaodian cjk bd-open">《</h-char><h-char class="hanzi cjk">書</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">名</h-char><h-char unicode="300b" class="biaodian cjk bd-close bd-end">》</h-char></h-jinze><h-jinze class="tou"><h-char unicode="3008" class="biaodian cjk bd-open">〈</h-char><h-char class="hanzi cjk">篇</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">名</h-char><h-char unicode="3009" class="biaodian cjk bd-close bd-end">〉</h-char></h-jinze><h-jinze class="tou"><h-char unicode="ff08" class="biaodian cjk bd-open">（</h-char><h-char class="hanzi cjk">內</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">容</h-char><h-char unicode="ff09" class="biaodian cjk bd-close bd-end">）</h-char></h-jinze><h-jinze class="touwei"><h-char unicode="300c" class="biaodian cjk bd-open">「</h-char><h-char unicode="300e" class="biaodian cjk bd-open">『</h-char><h-char class="hanzi cjk">好</h-char><h-char unicode="300f" class="biaodian cjk bd-close bd-end">』</h-char><h-char unicode="3001" class="biaodian cjk bd-end bd-cop bd-hangable"><h-inner>、</h-inner></h-char></h-jinze><h-cs class="jinze-outer hangable-outer" hidden=""> </h-cs><h-char class="hanzi cjk">不</h-char><h-jinze class="wei"><h-char class="hanzi cjk">好</h-char><h-char unicode="300d" class="biaodian cjk bd-close bd-end">」</h-char></h-jinze></em>' )

test 'Jiya and Hanging' ( a ) ->
  d = div!

  d.innerHTML = '<p>「標」、「『標』」，《標》、〈標〉。'
  Han d .renderJiya! .renderHanging!
  a.dom-equal d.firstChild, $( '<p><h-char unicode="300c" class="biaodian cjk bd-open bd-jiya"><h-inner>「</h-inner></h-char>標<h-char unicode="300d" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>」</h-inner></h-char><h-char prev="bd-close bd-end" unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive bd-hangable"><h-inner>、</h-inner></h-char><h-char prev="bd-end bd-cop" unicode="300c" class="biaodian cjk bd-open bd-jiya bd-consecutive"><h-inner>「</h-inner></h-char><h-char prev="bd-open" unicode="300e" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>『</h-inner></h-char>標<h-char unicode="300f" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>』</h-inner></h-char><h-char prev="bd-close bd-end" unicode="300d" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>」</h-inner></h-char><h-char prev="bd-close bd-end" unicode="ff0c" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive bd-hangable"><h-inner>，</h-inner></h-char><h-char prev="bd-end bd-cop" unicode="300a" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>《</h-inner></h-char>標<h-char unicode="300b" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>》</h-inner></h-char><h-char prev="bd-close bd-end" unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive bd-hangable"><h-inner>、</h-inner></h-char><h-char prev="bd-end bd-cop" unicode="3008" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>〈</h-inner></h-char>標<h-char unicode="3009" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>〉</h-inner></h-char><h-char prev="bd-close bd-end" unicode="3002" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive end-portion bd-hangable"><h-inner>。</h-inner></h-char></p>' )

  d.innerHTML = '<p><a href="#">《書名》</a>、「文字」、<strong>『重點』</strong>。'
  Han d .renderJiya! .renderHanging!
  a.dom-equal d.firstChild, $( '<p><a href="#"><h-char unicode="300a" class="biaodian cjk bd-open bd-jiya"><h-inner>《</h-inner></h-char>書名<h-char unicode="300b" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>》</h-inner></h-char></a><h-char prev="bd-close bd-end" unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive bd-hangable"><h-inner>、</h-inner></h-char><h-char prev="bd-end bd-cop" unicode="300c" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>「</h-inner></h-char>文字<h-char unicode="300d" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>」</h-inner></h-char><h-char prev="bd-close bd-end" unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive bd-hangable"><h-inner>、</h-inner></h-char><strong><h-char prev="bd-end bd-cop" unicode="300e" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>『</h-inner></h-char>重點<h-char unicode="300f" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>』</h-inner></h-char></strong><h-char prev="bd-close bd-end" unicode="3002" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive end-portion bd-hangable"><h-inner>。</h-inner></h-char></p>' )

  d.innerHTML = '<p><a href="#">《書名》、</a><em>「強調」、</em><strong>『重點』</strong>。'
  Han d .renderElem! .renderJiya! .renderHanging!
  support = Han.support.textemphasis

  if support
    a.dom-equal d.firstChild, $( '<p><a href="#"><h-char unicode="300a" class="biaodian cjk bd-open bd-jiya"><h-inner>《</h-inner></h-char>書名<h-char unicode="300b" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>》</h-inner></h-char><h-char unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive bd-hangable" prev="bd-close bd-end"><h-inner>、</h-inner></h-char></a><em><h-char unicode="300c" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion" prev="bd-end bd-cop"><h-inner>「</h-inner></h-char>強調<h-char unicode="300d" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>」</h-inner></h-char><h-char unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive bd-hangable" prev="bd-close bd-end"><h-inner>、</h-inner></h-char></em><strong><h-char unicode="300e" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion" prev="bd-end bd-cop"><h-inner>『</h-inner></h-char>重點<h-char unicode="300f" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>』</h-inner></h-char></strong><h-char unicode="3002" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive end-portion bd-hangable" prev="bd-close bd-end"><h-inner>。</h-inner></h-char></p>' )
  else
    a.dom-equal d.firstChild, $( '<p><a href="#"><h-char unicode="300a" class="biaodian cjk bd-open bd-jiya"><h-inner>《</h-inner></h-char>書名<h-char unicode="300b" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>》</h-inner></h-char><h-char prev="bd-close bd-end" unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive bd-hangable"><h-inner>、</h-inner></h-char></a><em><h-cs prev="bd-end bd-cop" class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="tou"><h-char prev="bd-end bd-cop" unicode="300c" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>「</h-inner></h-char><h-char class="hanzi cjk">強</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">調</h-char><h-char unicode="300d" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>」</h-inner></h-char><h-char prev="bd-close bd-end" unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive bd-hangable"><h-inner>、</h-inner></h-char></h-jinze><h-cs next="bd-open" class="jinze-outer jiya-outer bd-end bd-cop hangable-outer" hidden=""> </h-cs></em><strong><h-char prev="bd-end bd-cop" unicode="300e" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>『</h-inner></h-char>重點<h-char unicode="300f" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>』</h-inner></h-char></strong><h-char prev="bd-close bd-end" unicode="3002" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive end-portion bd-hangable"><h-inner>。</h-inner></h-char></p>' )

  d.innerHTML = '<p><a href="#">《書名》</a>、<em>「強調」</em>、<strong>『重點』</strong>。'
  Han d .renderElem! .renderJiya! .renderHanging!
  support = Han.support.textemphasis

  if support
    a.dom-equal d.firstChild, $( '<p><a href="#"><h-char unicode="300a" class="biaodian cjk bd-open bd-jiya"><h-inner>《</h-inner></h-char>書名<h-char unicode="300b" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>》</h-inner></h-char></a><h-char unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive bd-hangable" prev="bd-close bd-end"><h-inner>、</h-inner></h-char><em><h-char unicode="300c" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion" prev="bd-end bd-cop"><h-inner>「</h-inner></h-char>強調<h-char unicode="300d" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>」</h-inner></h-char></em><h-char unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive bd-hangable" prev="bd-close bd-end"><h-inner>、</h-inner></h-char><strong><h-char unicode="300e" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion" prev="bd-end bd-cop"><h-inner>『</h-inner></h-char>重點<h-char unicode="300f" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>』</h-inner></h-char></strong><h-char unicode="3002" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive end-portion bd-hangable" prev="bd-close bd-end"><h-inner>。</h-inner></h-char></p>' )
  else
    a.dom-equal d.firstChild, $( '<p><a href="#"><h-char unicode="300a" class="biaodian cjk bd-open bd-jiya"><h-inner>《</h-inner></h-char>書名<h-char unicode="300b" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>》</h-inner></h-char></a><h-char prev="bd-close bd-end" unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive bd-hangable"><h-inner>、</h-inner></h-char><em><h-cs prev="bd-end bd-cop" class="jinze-outer jiya-outer" hidden=""> </h-cs><h-jinze class="tou"><h-char prev="bd-end bd-cop" unicode="300c" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>「</h-inner></h-char><h-char class="hanzi cjk">強</h-char></h-jinze><h-jinze class="wei"><h-char class="hanzi cjk">調</h-char><h-char unicode="300d" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>」</h-inner></h-char></h-jinze><h-cs class="jinze-outer jiya-outer bd-close bd-end" hidden=""></h-cs></em><h-char prev="bd-close bd-end" unicode="3001" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive bd-hangable"><h-inner>、</h-inner></h-char><strong><h-char prev="bd-end bd-cop" unicode="300e" class="biaodian cjk bd-open bd-jiya bd-consecutive end-portion"><h-inner>『</h-inner></h-char>重點<h-char unicode="300f" class="biaodian cjk bd-close bd-end bd-jiya bd-consecutive"><h-inner>』</h-inner></h-char></strong><h-char prev="bd-close bd-end" unicode="3002" class="biaodian cjk bd-end bd-cop bd-jiya bd-consecutive end-portion bd-hangable"><h-inner>。</h-inner></h-char></p>' )

