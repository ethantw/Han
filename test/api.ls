
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
    html-equal d.innerHTML, '<em>測試<word>abc</word></em>'
  else
    html-equal d.innerHTML, '<em><char class="hanzi cjk">測</char><char class="hanzi cjk">試</char><word><char class="alphabet latin">a</char><char class="alphabet latin">b</char><char class="alphabet latin">c</char></word></em>'

  # Skip punctuation
  d.innerHTML = '<em>「測『試』」，test ‘this!’。</em>'
  Han d .renderEm!

  if support
    html-equal d.innerHTML, '<em><char class="biaodian cjk open" unicode="300c">「</char>測<char class="biaodian cjk open" unicode="300e">『</char>試<char_group class="biaodian cjk"><char class="biaodian cjk close end" unicode="300f">』</char><char class="biaodian cjk close end" unicode="300d">」</char><char class="biaodian cjk end" unicode="ff0c">，</char></char_group><word>test</word> <word><char class="punct">‘</char>this<char class="punct">!</char><char class="punct">’</char></word><char class="biaodian cjk end" unicode="3002">。</char></em>'
  else
    html-equal d.innerHTML, '<em><jinze class="tou"><char unicode="300c" class="biaodian cjk open">「</char><char class="hanzi cjk">測</char></jinze><jinze class="touwei"><char unicode="300e" class="biaodian cjk open">『</char><char class="hanzi cjk">試</char><char_group class="biaodian cjk"><char unicode="300f" class="biaodian cjk close end">』</char><char unicode="300d" class="biaodian cjk close end">」</char><char unicode="ff0c" class="biaodian cjk end">，</char></char_group></jinze><word><char class="alphabet latin">t</char><char class="alphabet latin">e</char><char class="alphabet latin">s</char><char class="alphabet latin">t</char></word> <word><char class="punct">‘</char><char class="alphabet latin">t</char><char class="alphabet latin">h</char><char class="alphabet latin">i</char><char class="alphabet latin">s</char><char class="punct">!</char></word><jinze class="wei"><word><char class="punct">’</char></word><char unicode="3002" class="biaodian cjk end">。</char></jinze></em>'

  # All CJK-related blocks
  d.innerHTML = '<em>𫞵𫞦𠁻𠁶〇⼌⿕⺃⻍⻰⻳⿸⿷⿳</em>'
  Han d .renderEm!

  if support
    html-equal d.innerHTML, '<em>𫞵𫞦𠁻𠁶〇⼌⿕⺃⻍⻰⻳⿸⿷⿳</em>'
  else
    html-equal d.innerHTML, '<em><char class="hanzi cjk">𫞵</char><char class="hanzi cjk">𫞦</char><char class="hanzi cjk">𠁻</char><char class="hanzi cjk">𠁶</char><char class="hanzi cjk">〇</char><char class="hanzi cjk">⼌</char><char class="hanzi cjk">⿕</char><char class="hanzi cjk">⺃</char><char class="hanzi cjk">⻍</char><char class="hanzi cjk">⻰</char><char class="hanzi cjk">⻳</char><char class="hanzi cjk">⿸</char><char class="hanzi cjk">⿷</char><char class="hanzi cjk">⿳</char></em>'

  # All western letters 
  d.innerHTML = '<em>¡Hola! Ὅμηρος Свети</em>'
  Han d .renderEm!

  if support
    html-equal d.innerHTML, '<em><word><char class="punct">¡</char>Hola<char class="punct">!</char></word> <word>Ὅμηρος</word> <word>Свети</word></em>'
  else
    html-equal d.innerHTML, '<em><word><char class="punct">¡</char><char class="alphabet latin">H</char><char class="alphabet latin">o</char><char class="alphabet latin">l</char><char class="alphabet latin">a</char><char class="punct">!</char></word> <word><char class="alphabet ellinika greek">Ὅ</char><char class="alphabet ellinika greek">μ</char><char class="alphabet ellinika greek">η</char><char class="alphabet ellinika greek">ρ</char><char class="alphabet ellinika greek">ο</char><char class="alphabet ellinika greek">ς</char></word> <word><char class="alphabet kirillica cyrillic">С</char><char class="alphabet kirillica cyrillic">в</char><char class="alphabet kirillica cyrillic">е</char><char class="alphabet kirillica cyrillic">т</char><char class="alphabet kirillica cyrillic">и</char></word></em>'

test 'Interlinear annotations (Ruby)', !->
  support = Han.support.ruby
  d = div!

  # Basic
  d.innerHTML = '<ruby>字<rt>zi</ruby>'
  Han d .renderRuby!

  if support
    html-equal d.innerHTML, '<ruby>字<rt>zi</rt></ruby>'
  else
    html-equal d.innerHTML, '<hruby><ru annotation="zi">字<rt>zi</rt></ru></hruby>'

  # Zhuyin
  d.innerHTML = '''
<ruby class="zhuyin">
  事<rt>ㄕˋ</rt>情<rt>ㄑㄧㄥˊ</rt>
  看<rt>ㄎㄢˋ</rt>
  冷<rt>ㄌㄥˇ</rt>暖<rt>ㄋㄨㄢˇ</rt>
</ruby>
'''
  Han d .renderRuby!
  qsa d, \ru
  .forEach !->
      it.removeAttribute \form
      it.removeAttribute \zhuyin
      it.removeAttribute \diao
      it.removeAttribute \length
  html-equal d.innerHTML, '<hruby class="zhuyin"><ru>事<zhuyin><yin>ㄕ</yin><diao>ˋ</diao></zhuyin></ru><ru>情<zhuyin><yin>ㄑㄧㄥ</yin><diao>ˊ</diao></zhuyin></ru><ru>看<zhuyin><yin>ㄎㄢ</yin><diao>ˋ</diao></zhuyin></ru><ru>冷<zhuyin><yin>ㄌㄥ</yin><diao>ˇ</diao></zhuyin></ru><ru>暖<zhuyin><yin>ㄋㄨㄢ</yin><diao>ˇ</diao></zhuyin></ru></hruby>'

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
  qsa d, \ru
  .forEach !->
    it.removeAttribute \annotation
    it.removeAttribute \order
    it.removeAttribute \span
  html-equal d.innerHTML, '<p><hruby class="complex">辛亥革命發生在<ru class="complex"><ru class="complex"><rb>1911-</rb><rt>年</rt></ru><ru class="complex"><rb>10-</rb><rt>月</rt></ru><ru class="complex"><rb>10，</rb><rt>日</rt></ru><rt rbspan="3">清宣統三年</rt></ru>那天革命先烈們一同推翻了帝制。</hruby></p>'

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
  qsa d, \ru
  .forEach !->
    it.removeAttribute \annotation
    it.removeAttribute \order
    it.removeAttribute \span
  html-equal d.innerHTML, '''
<p>
  <hruby class=complex>「<ru class=complex><ru class=complex><rb>紐</rb><rb>約</rb><rt rbspan=2>niǔyuē</rt></ru><ru class=complex><rb>市</rb><rt>shì</rt></ru><rt rbspan=3>new york city</rt></ru>」</hruby><hruby class=complex>『<ru class=complex><ru class=complex><rb>紐</rb><rb>約</rb><rt rbspan=2>niǔyuē</rt></ru><ru class=complex><rb>市</rb><rt>shì</rt></ru><rt rbspan=3>new york city</rt></ru>』</hruby><hruby class=complex>‘<ru class=complex><ru class=complex><rb>紐</rb><rt>niǔ</rt></ru><ru class=complex><rb>約</rb><rt>yuē</rt></ru><ru class=complex><rb>市</rb><rt>shì</rt></ru><rt rbspan=3>new york city</rt></ru>’</hruby><hruby class=complex>„<ru class=complex><ru class=complex><rb>紐</rb><rt>niǔ</rt></ru><ru class=complex><rb>約</rb><rt>yuē</rt></ru><ru class=complex><rb>市</rb><rt>shì</rt></ru><rt rbspan=3>new york city</rt></ru>‟</hruby><hruby class=complex>⸘<ru class=complex><ru class=complex><rb>紐</rb><rb>約</rb><rb>市</rb><rt rbspan=3>new york city</rt></ru><rt rbspan=3>世界之都</rt></ru>‽</hruby>。
</p>
<p>
  <hruby class=complex><ru class=complex><ru class=complex><rb>三</rb><rt>san1</rt></ru><rt>sān</rt></ru><ru class=complex><ru class=complex><rb>十</rb><rt>shih2</rt></ru><rt>shí</rt></ru><ru class=complex><ru class=complex><rb>六</rb><rt>liu4</rt></ru><rt>liù</rt></ru><ru class=complex><ru class=complex><rb>個</rb><rt>ko0</rt></ru><rt>ge</rt></ru><ru class=complex><ru class=complex><rb>牙</rb><rt>ya2</rt></ru><rt>yá</rt></ru><ru class=complex><ru class=complex><rb>齒</rb><rt>ch\'ih3</rt></ru><rt>chǐ</rt></ru>，<ru class=complex><ru class=complex><rb>捉</rb><rt>cho1</rt></ru><rt>zhuō</rt></ru><ru class=complex><ru class=complex><rb>對</rb><rb>兒</rb><rt rbspan=2>tuirh4</rt></ru><rt rbspan=2>duìr</rt></ru><ru class=complex><ru class=complex><rb>廝</rb><rt>ssu1</rt></ru><rt>sī</rt></ru><ru class=complex><ru class=complex><rb>打</rb><rt>ta3</rt></ru><rt>dǎ</rt></ru>！</hruby>
</p>
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
  d.querySelector \hruby .removeAttribute \rightangle
  qsa d, \ru
  .forEach !->
    it.removeAttribute \annotation
    it.removeAttribute \order
    it.removeAttribute \span
    it.removeAttribute \form
    it.removeAttribute \zhuyin
    it.removeAttribute \diao
    it.removeAttribute \length
  html-equal d.innerHTML, '''
<p>
  <hruby class="complex">
    <ru class="complex"><ru class="complex"><ru><rb>一</rb><zhuyin><yin>ㄐㄧ</yin><diao>ㆵ͘</diao></zhuyin></ru><rt>Tsi̍t</rt></ru><rt>Tsi̍t</rt></ru>
    <ru class="complex"><ru class="complex"><ru><rb>人</rb><zhuyin><yin>ㄌㄤ</yin><diao>ˊ</diao></zhuyin></ru><rt>lâng</rt></ru><rt>lâng</rt></ru>
    <ru class="complex"><ru class="complex"><ru><rb>煩</rb><zhuyin><yin>ㄏㄨㄢ</yin><diao>ˊ</diao></zhuyin></ru><ru><rb>惱</rb><zhuyin><yin>ㄌㄜ</yin><diao>ˋ</diao></zhuyin></ru><rt rbspan="2">hoân‑ló</rt></ru><rt rbspan="2">huân-ló</rt></ru>
    <ru class="complex"><ru class="complex"><ru><rb>一</rb><zhuyin><yin>ㄐㄧ</yin><diao>ㆵ͘</diao></zhuyin></ru><rt>chi̍t</rt></ru><rt>tsi̍t</rt></ru>
    <ru class="complex"><ru class="complex"><ru><rb>樣</rb><zhuyin><yin>ㄧㆫ</yin><diao>˫</diao></zhuyin></ru><rt>iūⁿ</rt></ru><rt>iūnn</rt></ru>。
  </hruby>
</p>
'''

module 'Advanced typesetting features'
test 'Hanzi-Western script mixed spacing (HWS)' ->
  d = div!

  # Basic
  d.innerHTML = '測試test測試123測試'
  Han d .renderHWS!
  html-equal d.innerHTML, '測試<hws> </hws>test<hws> </hws>測試<hws> </hws>123<hws> </hws>測試'

  # Strict mode
  d.innerHTML = '測試 test 測試 123 測試<code>測試 test測試。</code>'
  Han d .renderHWS true
  html-equal d.innerHTML, '測試<hws> </hws>test<hws> </hws>測試<hws> </hws>123<hws> </hws>測試<code>測試 test測試。</code>'

  # With Biaodian
  d.innerHTML = '測試，test測試123。'
  Han d .renderHWS!
  html-equal d.innerHTML, '測試，test<hws> </hws>測試<hws> </hws>123。'

  # Greek letters
  d.innerHTML = '測試α測試β測試'
  Han d .renderHWS!
  html-equal d.innerHTML, '測試<hws> </hws>α<hws> </hws>測試<hws> </hws>β<hws> </hws>測試'

  # Cyrillic letters
  d.innerHTML = 'я測試у測試ь測試в'
  Han d .renderHWS!
  html-equal d.innerHTML, 'я<hws> </hws>測試<hws> </hws>у<hws> </hws>測試<hws> </hws>ь<hws> </hws>測試<hws> </hws>в'

  # All CJK-related blocks
  d.innerHTML = 'A㐀a㘻a䶵a𠀀a𫠝a〇a⿸a⻍a⻰aのa'
  Han d .renderHWS!
  html-equal d.innerHTML, 'a<hws> </hws>㐀<hws> </hws>a<hws> </hws>㘻<hws> </hws>a<hws> </hws>䶵<hws> </hws>a<hws> </hws>𠀀<hws> </hws>a<hws> </hws>𫠝<hws> </hws>a<hws> </hws>〇<hws> </hws>a<hws> </hws>⿸<hws> </hws>a<hws> </hws>⻍<hws> </hws>a<hws> </hws>⻰<hws> </hws>a<hws> </hws>の<hws> </hws>a'

  # Combining characters
  d.innerHTML = '天然ê上好。荷Ὅ̴̊̌ηρος̃馬。貓К҉о҈ш҉к҈а҈咪。'
  Han d .renderHWS!
  html-equal d.innerHTML, '天然<hws> </hws>ê<hws> </hws>上好。荷<hws> </hws>ὅ̴̊̌ηρος̃<hws> </hws>馬。貓<hws> </hws>к҉о҈ш҉к҈а҈<hws> </hws>咪。'

  # Cross-boundary
  d.innerHTML = '去<u>Europe</u>旅行。'
  Han d .renderHWS!
  html-equal d.innerHTML, '去<hws> </hws><u>europe</u><hws> </hws>旅行。'

  # With comments or `<wbr>`
  d.innerHTML = '去<!-- x -->Europe<wbr><!---->旅行。'
  Han d .renderHWS!
  html-equal d.innerHTML, '去<!-- x --><hws> </hws>europe<wbr><!----><hws> </hws>旅行。'

  # Edge cases
  d.innerHTML = '測試¿測試?測試¡測試!為‘什’麼;為“什”麼?'
  Han d .renderHWS!
  html-equal d.innerHTML, '測試<hws> </hws>¿測試?<hws> </hws>測試<hws> </hws>¡測試!<hws> </hws>為<hws> </hws>‘什’<hws> </hws>麼;<hws> </hws>為<hws> </hws>“什”<hws> </hws>麼?'

  d.innerHTML = '單\'引\'號和雙"引"號和單\'引\'號和雙"引"號.'
  Han d .renderHWS!
  html-equal d.innerHTML, '單<hws> </hws>\'引\'<hws> </hws>號和雙<hws> </hws>"引"<hws> </hws>號和單<hws> </hws>\'引\'<hws> </hws>號和雙<hws> </hws>"引"<hws> </hws>號.'


  d.innerHTML = '\'單x引x號\'"雙x引x號".'
  Han d .renderHWS!
  html-equal d.innerHTML, '\'單<hws> </hws>x<hws> </hws><hws> </hws>引<hws> </hws>x<hws> </hws><hws> </hws>號\'"雙<hws> </hws>x<hws> </hws><hws> </hws>引<hws> </hws>x<hws> </hws><hws> </hws>號".'


  d.innerHTML = '單\'引\'號和雙"引"號和單\'引\'號和雙"引"號.'
  Han d .renderHWS!
  html-equal d.innerHTML, '單<hws> </hws>\'引\'<hws> </hws>號和雙<hws> </hws>"引"<hws> </hws>號和單<hws> </hws>\'引\'<hws> </hws>號和雙<hws> </hws>"引"<hws> </hws>號.'

test 'Consecutive punctuation (Jiya)' ->
  d = div!
  d.innerHTML = '「字『字』？」字「字『字』」字？'
  Han d .renderJiya!
  qsa d, \char
  .forEach ->
    it.removeAttribute \unicode
  html-equal d.innerHTML, '「字『字<char_group class=biaodian cjk><char class=biaodian cjk close end>』</char><char class=biaodian cjk end>？</char><char class=biaodian cjk close end>」</char></char_group>字「字『字<char_group class=biaodian cjk><char class=biaodian cjk close end>』</char><char class=biaodian cjk close end>」</char></char_group>字？'

  d.innerHTML = '字、「字」字，（字）字……「字」。'
  Han d .renderJiya!
  qsa d, \char
  .forEach ->
    it.removeAttribute \unicode
  html-equal d.innerHTML, '字<char_group class=biaodian cjk><char class=biaodian cjk end>、</char><char class=biaodian cjk open>「</char></char_group>字」字<char_group class=biaodian cjk><char class=biaodian cjk end>，</char><char class=biaodian cjk open>（</char></char_group>字）字<char_group class=biaodian cjk><char class=biaodian liga cjk>……</char><char class=biaodian cjk open>「</char></char_group>字<char_group class=biaodian cjk><char class=biaodian cjk close end>」</char><char class=biaodian cjk end>。</char></char_group>'

  d.innerHTML = '《書名》〈篇名〉（內容）'
  Han d .renderJiya!
  qsa d, \char
  .forEach ->
    it.removeAttribute \unicode
  html-equal d.innerHTML, '《書名<char_group class=biaodian cjk><char class=biaodian cjk close end>》</char><char class=biaodian cjk open>〈</char></char_group>篇名<char_group class=biaodian cjk><char class=biaodian cjk close end>〉</char><char class=biaodian cjk open>（</char></char_group>內容）'

