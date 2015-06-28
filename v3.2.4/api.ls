
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

html-equal = ( a, b, log ) ->
  a = convert-html a
  b = convert-html b
  equal a, b, log

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

test 'Emphasis marks' !->
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
    html-equal d.innerHTML, '<em><h-char unicode=300c class=biaodian cjk open>「</h-char>測<h-char unicode=300e class=biaodian cjk open>『</h-char>試<h-char unicode=300f class=biaodian cjk close end>』</h-char><h-char unicode=300d class=biaodian cjk close end>」</h-char><h-char unicode=ff0c class=biaodian cjk end>，</h-char>test <h-char class=punct>‘</h-char>this<h-char class=punct>!</h-char><h-char class=punct>’</h-char><h-char unicode=3002 class=biaodian cjk end>。</h-char></em>'
  else
    html-equal d.innerHTML, '<em><h-jinze class=tou><h-char unicode=300c class=biaodian cjk open>「</h-char><h-char class=hanzi cjk>測</h-char></h-jinze><h-jinze class=touwei><h-char unicode=300e class=biaodian cjk open>『</h-char><h-char class=hanzi cjk>試</h-char><h-char-group class=biaodian cjk>』」，</h-char-group></h-jinze><h-word class=western><h-char class=alphabet latin>t</h-char><h-char class=alphabet latin>e</h-char><h-char class=alphabet latin>s</h-char><h-char class=alphabet latin>t</h-char></h-word> <h-word class=western><h-char class=punct>‘</h-char><h-char class=alphabet latin>t</h-char><h-char class=alphabet latin>h</h-char><h-char class=alphabet latin>i</h-char><h-char class=alphabet latin>s</h-char><h-char class=punct>!</h-char></h-word><h-jinze class=wei><h-word class=western><h-char class=punct>’</h-char></h-word><h-char unicode=3002 class=biaodian cjk end>。</h-char></h-jinze></em>'

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

test 'Interlinear annotations (Ruby)', !->
  support = Han.support.ruby
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
  html-equal d.innerHTML, '<h-ruby class=zhuyin><h-ru>事<h-zhuyin><h-yin>ㄕ</h-yin><h-diao>ˋ</h-diao></h-zhuyin></h-ru><h-ru>情<h-zhuyin><h-yin>ㄑㄧㄥ</h-yin><h-diao>ˊ</h-diao></h-zhuyin></h-ru><h-ru>看<h-zhuyin><h-yin>ㄎㄢ</h-yin><h-diao>ˋ</h-diao></h-zhuyin></h-ru><h-ru>冷<h-zhuyin><h-yin>ㄌㄥ</h-yin><h-diao>ˇ</h-diao></h-zhuyin></h-ru><h-ru>暖<h-zhuyin><h-yin>ㄋㄨㄢ</h-yin><h-diao>ˇ</h-diao></h-zhuyin></h-ru></h-ruby>'

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
  qsa d, \h-ruby .forEach !-> 
    it.removeAttribute \doubleline
  qsa d, \h-ru
  .forEach !->
    it.removeAttribute \annotation
    it.removeAttribute \order
    it.removeAttribute \span
  html-equal d.innerHTML, '''
<p><h-ruby class=complex>「<h-ru class=complex><h-ru class=complex><rb>紐</rb><rb>約</rb><rt rbspan=2>niǔyuē</rt></h-ru><h-ru class=complex><rb>市</rb><rt>shì</rt></h-ru><rt rbspan=3>new york city</rt></h-ru>」</h-ruby><h-ruby class=complex>『<h-ru class=complex><h-ru class=complex><rb>紐</rb><rb>約</rb><rt rbspan=2>niǔyuē</rt></h-ru><h-ru class=complex><rb>市</rb><rt>shì</rt></h-ru><rt rbspan=3>new york city</rt></h-ru>』</h-ruby><h-ruby class=complex>‘<h-ru class=complex><h-ru class=complex><rb>紐</rb><rt>niǔ</rt></h-ru><h-ru class=complex><rb>約</rb><rt>yuē</rt></h-ru><h-ru class=complex><rb>市</rb><rt>shì</rt></h-ru><rt rbspan=3>new york city</rt></h-ru>’</h-ruby><h-ruby class=complex>„<h-ru class=complex><h-ru class=complex><rb>紐</rb><rt>niǔ</rt></h-ru><h-ru class=complex><rb>約</rb><rt>yuē</rt></h-ru><h-ru class=complex><rb>市</rb><rt>shì</rt></h-ru><rt rbspan=3>new york city</rt></h-ru>‟</h-ruby><h-ruby class=complex>⸘<h-ru class=complex><h-ru class=complex><rb>紐</rb><rb>約</rb><rb>市</rb><rt rbspan=3>new york city</rt></h-ru><rt rbspan=3>世界之都</rt></h-ru>‽</h-ruby>。</p><p><h-ruby class=complex><h-ru class=complex><h-ru class=complex><rb>三</rb><rt>san1</rt></h-ru><rt>sān</rt></h-ru><h-ru class=complex><h-ru class=complex><rb>十</rb><rt>shih2</rt></h-ru><rt>shí</rt></h-ru><h-ru class=complex><h-ru class=complex><rb>六</rb><rt>liu4</rt></h-ru><rt>liù</rt></h-ru><h-ru class=complex><h-ru class=complex><rb>個</rb><rt>ko0</rt></h-ru><rt>ge</rt></h-ru><h-ru class=complex><h-ru class=complex><rb>牙</rb><rt>ya2</rt></h-ru><rt>yá</rt></h-ru><h-ru class=complex><h-ru class=complex><rb>齒</rb><rt>ch'ih3</rt></h-ru><rt>chǐ</rt></h-ru>，<h-ru class=complex><h-ru class=complex><rb>捉</rb><rt>cho1</rt></h-ru><rt>zhuō</rt></h-ru><h-ru class=complex><h-ru class=complex><rb>對</rb><rb>兒</rb><rt rbspan=2>tuirh4</rt></h-ru><rt rbspan=2>duìr</rt></h-ru><h-ru class=complex><h-ru class=complex><rb>廝</rb><rt>ssu1</rt></h-ru><rt>sī</rt></h-ru><h-ru class=complex><h-ru class=complex><rb>打</rb><rt>ta3</rt></h-ru><rt>dǎ</rt></h-ru>！</h-ruby></p>
'''

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
  ruby = d.querySelector \h-ruby
  ruby.removeAttribute \rightangle
  ruby.removeAttribute \doubleline
  qsa d, \h-ru
  .forEach !->
    it.removeAttribute \annotation
    it.removeAttribute \order
    it.removeAttribute \span
    it.removeAttribute \form
    it.removeAttribute \zhuyin
    it.removeAttribute \diao
    it.removeAttribute \length
  html-equal d.innerHTML, '''
<p><h-ruby class=complex><h-ru class=complex><h-ru class=complex><h-ru><rb>一</rb><h-zhuyin><h-yin>ㄐㄧ</h-yin><h-diao>ㆵ͘</h-diao></h-zhuyin></h-ru><rt>tsi̍t</rt></h-ru><rt>tsi̍t</rt></h-ru><h-ru class=complex><h-ru class=complex><h-ru><rb>人</rb><h-zhuyin><h-yin>ㄌㄤ</h-yin><h-diao>ˊ</h-diao></h-zhuyin></h-ru><rt>lâng</rt></h-ru><rt>lâng</rt></h-ru><h-ru class=complex><h-ru class=complex><h-ru><rb>煩</rb><h-zhuyin><h-yin>ㄏㄨㄢ</h-yin><h-diao>ˊ</h-diao></h-zhuyin></h-ru><h-ru><rb>惱</rb><h-zhuyin><h-yin>ㄌㄜ</h-yin><h-diao>ˋ</h-diao></h-zhuyin></h-ru><rt rbspan=2>hoân‑ló</rt></h-ru><rt rbspan=2>huân-ló</rt></h-ru><h-ru class=complex><h-ru class=complex><h-ru><rb>一</rb><h-zhuyin><h-yin>ㄐㄧ</h-yin><h-diao>ㆵ͘</h-diao></h-zhuyin></h-ru><rt>chi̍t</rt></h-ru><rt>tsi̍t</rt></h-ru><h-ru class=complex><h-ru class=complex><h-ru><rb>樣</rb><h-zhuyin><h-yin>ㄧㆫ</h-yin><h-diao>˫</h-diao></h-zhuyin></h-ru><rt>iūⁿ</rt></h-ru><rt>iūnn</rt></h-ru>。</h-ruby></p>
'''

module 'Advanced typesetting features'
test 'Hanzi-Western script mixed spacing (HWS)' ->
  d = div!

  # Basic
  d.innerHTML = '測試test測試123測試'
  Han d .renderHWS!
  html-equal d.innerHTML, '測試<h-hws hidden=""> </h-hws>test<h-hws hidden=""> </h-hws>測試<h-hws hidden=""> </h-hws>123<h-hws hidden=""> </h-hws>測試'

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
  html-equal d.innerHTML, '去<!-- x --><h-hws hidden=""> </h-hws>europe<wbr><!----><h-hws hidden=""> </h-hws>旅行。'

  # Edge cases
  d.innerHTML = '測試¿測試?測試¡測試!為‘什’麼;為“什”麼?'
  Han d .renderHWS!
  html-equal d.innerHTML, '測試<h-hws hidden=\"\"> </h-hws>¿測試?<h-hws hidden=\"\"> </h-hws>測試<h-hws hidden=\"\"> </h-hws>¡測試!<h-hws hidden=\"\"> </h-hws>為‘什’麼;<h-hws hidden=\"\"> </h-hws>為“什”麼?'

  d.innerHTML = '單\'引\'號和雙"引"號和單\'引\'號和雙"引"號.'
  Han d .renderHWS!
  html-equal d.innerHTML, '單<h-hws hidden=""> </h-hws>\'引\'<h-hws hidden=""> </h-hws>號和雙<h-hws hidden=""> </h-hws>"引"<h-hws hidden=""> </h-hws>號和單<h-hws hidden=""> </h-hws>\'引\'<h-hws hidden=""> </h-hws>號和雙<h-hws hidden=""> </h-hws>"引"<h-hws hidden=""> </h-hws>號.'


  d.innerHTML = '\'單x引x號\'"雙x引x號".'
  Han d .renderHWS!
  html-equal d.innerHTML, '\'單<h-hws hidden=""> </h-hws>x<h-hws hidden=""> </h-hws><h-hws hidden=""> </h-hws>引<h-hws hidden=""> </h-hws>x<h-hws hidden=""> </h-hws><h-hws hidden=""> </h-hws>號\'"雙<h-hws hidden=""> </h-hws>x<h-hws hidden=""> </h-hws><h-hws hidden=""> </h-hws>引<h-hws hidden=""> </h-hws>x<h-hws hidden=""> </h-hws><h-hws hidden=""> </h-hws>號".'


  d.innerHTML = '單\'引\'號和雙"引"號和單\'引\'號和雙"引"號.'
  Han d .renderHWS!
  html-equal d.innerHTML, '單<h-hws hidden=""> </h-hws>\'引\'<h-hws hidden=""> </h-hws>號和雙<h-hws hidden=""> </h-hws>"引"<h-hws hidden=""> </h-hws>號和單<h-hws hidden=""> </h-hws>\'引\'<h-hws hidden=""> </h-hws>號和雙<h-hws hidden=""> </h-hws>"引"<h-hws hidden=""> </h-hws>號.'

test 'Biaodian jiya' ->
  d = div!
  d.innerHTML = '「字『字』？」字「字『字』」字？'
  Han d .renderJiya!
  /*
  qsa d, \h-char
  .forEach ->
    it.removeAttribute \unicode
  */
  html-equal d.innerHTML, '<h-char unicode=300c class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>「</h-inner></h-char>字<h-char unicode=300e class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>『</h-inner></h-char>字<h-char-group class=biaodian cjk><h-char unicode=300f class=biaodian cjk close end><h-inner>』</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-char unicode=ff1f class=biaodian cjk end><h-inner>？</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-char unicode=300d class=biaodian cjk close end><h-inner>」</h-inner><h-cs hidden=\"\"> </h-cs></h-char></h-char-group>字<h-char unicode=300c class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>「</h-inner></h-char>字<h-char unicode=300e class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>『</h-inner></h-char>字<h-char-group class=biaodian cjk><h-char unicode=300f class=biaodian cjk close end><h-inner>』</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-char unicode=300d class=biaodian cjk close end><h-inner>」</h-inner><h-cs hidden=\"\"> </h-cs></h-char></h-char-group>字<h-char unicode=ff1f class=biaodian cjk end><h-inner>？</h-inner><h-cs hidden=\"\"> </h-cs></h-char>'

  d.innerHTML = '字、「字」字，（字）字……「字」。'
  Han d .renderJiya!
  /*
  qsa d, \h-char
  .forEach ->
    it.removeAttribute \unicode
  */
  html-equal d.innerHTML, '字<h-char-group class=biaodian cjk><h-char unicode=3001 class=biaodian cjk end><h-inner>、</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-char unicode=300c class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>「</h-inner></h-char></h-char-group>字<h-char unicode=300d class=biaodian cjk close end><h-inner>」</h-inner><h-cs hidden=\"\"> </h-cs></h-char>字<h-char-group class=biaodian cjk><h-char unicode=ff0c class=biaodian cjk end><h-inner>，</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-char unicode=ff08 class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>（</h-inner></h-char></h-char-group>字<h-char unicode=ff09 class=biaodian cjk close end><h-inner>）</h-inner><h-cs hidden=\"\"> </h-cs></h-char>字<h-char-group class=biaodian cjk><h-char unicode=2026 class=biaodian cjk liga>……</h-char><h-char unicode=300c class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>「</h-inner></h-char></h-char-group>字<h-char-group class=biaodian cjk><h-char unicode=300d class=biaodian cjk close end><h-inner>」</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-char unicode=3002 class=biaodian cjk end><h-inner>。</h-inner><h-cs hidden=\"\"> </h-cs></h-char></h-char-group>'

  d.innerHTML = '《書名》〈篇名〉（內容）'
  Han d .renderJiya!
  /*
  qsa d, \h-char
  .forEach ->
    it.removeAttribute \unicode
  */
  html-equal d.innerHTML, '<h-char unicode=300a class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>《</h-inner></h-char>書名<h-char-group class=biaodian cjk><h-char unicode=300b class=biaodian cjk close end><h-inner>》</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-char unicode=3008 class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>〈</h-inner></h-char></h-char-group>篇名<h-char-group class=biaodian cjk><h-char unicode=3009 class=biaodian cjk close end><h-inner>〉</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-char unicode=ff08 class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>（</h-inner></h-char></h-char-group>內容<h-char unicode=ff09 class=biaodian cjk close end><h-inner>）</h-inner><h-cs hidden=\"\"> </h-cs></h-char>'

test 'Hanging Biaodian' !->
  d = div!

  d.innerHTML = '點、點，點。點．'
  Han d .renderHanging!
  html-equal d.innerHTML, '點<h-hangable><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>、</h-char></h-cs></h-hangable>點<h-hangable><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>，</h-char></h-cs></h-hangable>點<h-hangable><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>。</h-char></h-cs></h-hangable>點<h-hangable><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>．</h-char></h-cs></h-hangable>'

  d.innerHTML = '「標點。」'
  Han d .renderHanging!
  html-equal d.innerHTML, '「標點。」'

  d.innerHTML = '標點……。'
  Han d .renderHanging!
  html-equal d.innerHTML, '標點<h-hangable>……<h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>。</h-char></h-cs></h-hangable>'
  
  d.innerHTML = '「標點」。'
  Han d .renderHanging!
  html-equal d.innerHTML, '「標點<h-hangable>」<h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>。</h-char></h-cs></h-hangable>'
  
test 'Jiya and Hanging' !->
  d = div!

  d.innerHTML = '「標」、「『標』」，《標》、〈標〉。'
  Han d .renderHanging! .renderJiya!
  html-equal d.innerHTML, '<h-char unicode=300c class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>「</h-inner></h-char>標<h-hangable><h-char unicode=300d class=biaodian cjk close end><h-inner>」</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>、</h-char></h-cs></h-hangable><h-char-group class=biaodian cjk portion><h-char unicode=300c class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>「</h-inner></h-char><h-char unicode=300e class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>『</h-inner></h-char></h-char-group>標<h-hangable><h-char unicode=300f class=biaodian cjk close end><h-inner>』</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-char unicode=300d class=biaodian cjk close end><h-inner>」</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>，</h-char></h-cs></h-hangable><h-char-group class=biaodian cjk portion><h-char unicode=300a class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>《</h-inner></h-char></h-char-group>標<h-hangable><h-char unicode=300b class=biaodian cjk close end><h-inner>》</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>、</h-char></h-cs></h-hangable><h-char-group class=biaodian cjk portion><h-char unicode=3008 class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>〈</h-inner></h-char></h-char-group>標<h-hangable><h-char unicode=3009 class=biaodian cjk close end><h-inner>〉</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>。</h-char></h-cs></h-hangable>'

  d.innerHTML = '<a href="#">《書名》</a>、「文字」、<strong>『重點』</strong>。'
  Han d .renderHanging! .renderJiya!
  html-equal d.innerHTML, '<a href=#><h-char unicode=300a class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>《</h-inner></h-char>書名<h-hangable><h-char unicode=300b class=biaodian cjk close end><h-inner>》</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>、</h-char></h-cs></h-hangable></a><h-char-group class=biaodian cjk portion><h-char unicode=300c class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>「</h-inner></h-char></h-char-group><h-char-group class=biaodian cjk portion><h-char unicode=300c class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>「</h-inner></h-char></h-char-group>文字<h-hangable><h-char unicode=300d class=biaodian cjk close end><h-inner>」</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>、</h-char></h-cs></h-hangable><strong><h-char-group class=biaodian cjk portion><h-char unicode=300e class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>『</h-inner></h-char></h-char-group>重點<h-hangable><h-char unicode=300f class=biaodian cjk close end><h-inner>』</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>。</h-char></h-cs></h-hangable></strong>'

  d.innerHTML = '<a href="#">《書名》</a>、<em>「強調」</em>、<strong>『重點』</strong>。'
  Han d .renderHanging! .renderJiya! .renderElem!
  support = Han.support.textemphasis

  if support
    html-equal d.innerHTML, '<a href=#><h-char unicode=300a class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>《</h-inner></h-char>書名<h-hangable><h-char unicode=300b class=biaodian cjk close end><h-inner>》</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>、</h-char></h-cs></h-hangable></a><h-char-group class=biaodian cjk portion><h-char unicode=300c class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>「</h-inner></h-char></h-char-group><h-char-group class=biaodian cjk portion><h-char unicode=300c class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>「</h-inner></h-char></h-char-group><em><h-char-group class=biaodian cjk portion><h-char unicode=300c class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>「</h-inner></h-char></h-char-group>強調<h-hangable><h-char unicode=300d class=biaodian cjk close end><h-inner>」</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>、</h-char></h-cs></h-hangable></em><h-char-group class=biaodian cjk portion><h-char unicode=300e class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>『</h-inner></h-char></h-char-group><h-char-group class=biaodian cjk portion><h-char unicode=300e class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>『</h-inner></h-char></h-char-group><strong><h-char-group class=biaodian cjk portion><h-char unicode=300e class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>『</h-inner></h-char></h-char-group>重點<h-hangable><h-char unicode=300f class=biaodian cjk close end><h-inner>』</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>。</h-char></h-cs></h-hangable></strong>'
  else
    html-equal d.innerHTML, '<a href=#><h-char unicode=300a class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>《</h-inner></h-char>書名<h-hangable><h-char unicode=300b class=biaodian cjk close end><h-inner>》</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>、</h-char></h-cs></h-hangable></a><h-char-group class=biaodian cjk portion><h-char unicode=300c class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>「</h-inner></h-char></h-char-group><h-char-group class=biaodian cjk portion><h-char unicode=300c class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>「</h-inner></h-char></h-char-group><em><h-char-group class=biaodian cjk portion><h-char unicode=300c class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>「</h-inner></h-char></h-char-group><h-char class=hanzi cjk>強</h-char><h-char class=hanzi cjk>調</h-char><h-hangable><h-char unicode=300d class=biaodian cjk close end><h-inner>」</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>、</h-char></h-cs></h-hangable></em><h-char-group class=biaodian cjk portion><h-char unicode=300e class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>『</h-inner></h-char></h-char-group><h-char-group class=biaodian cjk portion><h-char unicode=300e class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>『</h-inner></h-char></h-char-group><strong><h-char-group class=biaodian cjk portion><h-char unicode=300e class=biaodian cjk open><h-cs hidden=\"\"> </h-cs><h-inner>『</h-inner></h-char></h-char-group>重點<h-hangable><h-char unicode=300f class=biaodian cjk close end><h-inner>』</h-inner><h-cs hidden=\"\"> </h-cs></h-char><h-cs><h-inner hidden=\"\"> </h-inner><h-char class=biaodian close end cjk>。</h-char></h-cs></h-hangable></strong>'

