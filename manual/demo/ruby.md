<h2>7・注音／旁注 <code>&lt;ruby&gt;</code></h2>
<p class="description">注音（zh-Hant、Bopomofo）以 <code>Han Zhuyin Serif</code> web font 搭配原生 <code>&lt;ruby&gt;</code> 呈現——OpenType GPOS 處理調號定位，<code>ruby-position: inter-character</code> 處理字旁直書（Safari 18.2+ 原生；其他引擎以 <code>@supports not</code> CSS fallback 模擬）。其餘語系（拼音、振仮名、한자 read）保留原生 <code>&lt;ruby&gt;</code> 渲染——四大瀏覽器都已實裝。</p>

<article>
  <p>
    <ruby>
      <rb>我</rb><rb>有</rb><rb>一</rb><rb>个</rb><rb>朋</rb><rb>友</rb>，<rb>伊</rb><rb>真</rb><rb>有</rb><rb>志</rb><rb>氣</rb>，
      <rtc class="reading romanization">
        <rt>guá
        <rt>ū
        <rt rbspan="2">tsi̍t ê
        <rt rbspan="2">pîng-iú
        <rt>i
        <rt rbspan="2">tsin-ū
        <rt rbspan="2">tsì-khì
      </rtc>
      <rtc class="reading zhuyin">
        <rt>ㆣㄨㄚˋ</rt>
        <rt>ㄨ˫</rt>
        <rt>ㄐㄧㆵ˙</rt>
        <rt>ㆤˊ</rt>
        <rt>ㄅㄧㄥˊ</rt>
        <rt>ㄧㄨˋ</rt>
        <rt>ㄧ</rt>
        <rt>ㄐㄧㄣ</rt>
        <rt>ㄨ˫</rt>
        <rt>ㄐㄧ˪</rt>
        <rt>ㄎㄧ˪</rt>
      </rtc>
    </ruby><ruby>
      <rb>自</rb><rb>細</rb><rb>漢</rb><rb>就</rb><rb>立</rb><rb>志</rb><rb>講</rb><rb>欲</rb><rb>寫</rb><rb>歌</rb>、<rb>唱</rb><rb>歌</rb><rb>趁</rb><rb>錢</rb>，
      <rtc class="reading romanization">
        <rt>tsū
        <rt rbspan="2">sè-hàn
        <rt>tō
        <rt rbspan="2">li̍p-tsì
        <rt>kóng
        <rt>beh
        <rt rbspan="2">siá-kua
        <rt rbspan="2">tshiùnn-kua
        <rt rbspan="2">thàn-tsînn
      </rtc>
      <rtc class="reading zhuyin">
        <rt>ㄗㄨ˫</rt>
        <rt>ㄙㆤ˪</rt>
        <rt>ㄏㄢ˪</rt>
        <rt>ㄉㄜ˫</rt>
        <rt>ㄌㄧㆴ˙</rt>
        <rt>ㄐㄧ˪</rt>
        <rt>ㄍㆲˋ</rt>
        <rt>ㆠㆤㆷ</rt>
        <rt>ㄒㄧㄚˋ</rt>
        <rt>ㄍㄨㄚ</rt>
        <rt>ㄑㄧㆫ˪</rt>
        <rt>ㄍㄨㄚ</rt>
        <rt>ㄊㄢ˪</rt>
        <rt>ㄐㆪˊ</rt>
      </rtc>
    </ruby><ruby>
      <rb>伊</rb><rb>逐</rb><rb>工</rb><rb>攏</rb><rb>咧</rb><rb>痟</rb><rb>電</rb><rb>影</rb>，<rb>聽</rb><rb>阿</rb><rb>啄</rb><rb>仔</rb><rb>的</rb>CD。
      <rtc class="reading romanization">
        <rt>i
        <rt rbspan="2">ta̍k-kang
        <rt rbspan="2">lóng-teh
        <rt>siáu
        <rt rbspan="2">tiān-iánn
        <rt>thiann
        <rt rbspan="3">a-tok-á
        <rt rbspan="1">ê
      </rtc>
      <rtc class="reading zhuyin">
        <rt>ㄧ</rt>
        <rt>ㄉㄚㆻ˙</rt>
        <rt>ㄍㄤ</rt>
        <rt>ㄌㆲˋ</rt>
        <rt>ㄉㆤㆷ</rt>
        <rt>ㄒㄧㄠˋ</rt>
        <rt>ㄉㄧㄢ˫</rt>
        <rt>ㄧㆩˋ</rt>
        <rt>ㄊㄧㆩ</rt>
        <rt>ㄚ</rt>
        <rt>ㄉㆦㆻ</rt>
        <rt>ㄚˋ</rt>
        <rt>ㆤˊ</rt>
      </rtc>
    </ruby>
  </p>
</article>

<div class="demo-grid">
  <article class="demo-on"  lang="zh-Hant"><ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>、<ruby class="zhuyin">注<rt>ㄓㄨˋ</rt></ruby><ruby class="zhuyin">音<rt>ㄧㄣ</rt></ruby>。</article>
  <article class="demo-off" lang="zh-Hant"><ruby>漢<rt>ㄏㄢˋ</rt></ruby><ruby>字<rt>ㄗˋ</rt></ruby>、<ruby>注<rt>ㄓㄨˋ</rt></ruby><ruby>音<rt>ㄧㄣ</rt></ruby>。</article>
  <article class="demo-on"  lang="zh-Hans"><ruby>汉<rt>hàn</rt></ruby><ruby>字<rt>zì</rt></ruby>、<ruby>拼<rt>pīn</rt></ruby><ruby>音<rt>yīn</rt></ruby>。</article>
  <article class="demo-off" lang="zh-Hans"><ruby>汉<rt>hàn</rt></ruby><ruby>字<rt>zì</rt></ruby>、<ruby>拼<rt>pīn</rt></ruby><ruby>音<rt>yīn</rt></ruby>。</article>
  <article class="demo-on"  lang="ja"><ruby>漢<rt>かん</rt>字<rt>じ</rt></ruby>、<ruby>振<rt>ふ</rt>仮<rt>り</rt>名<rt>がな</rt></ruby>。</article>
  <article class="demo-off" lang="ja"><ruby>漢<rt>かん</rt>字<rt>じ</rt></ruby>、<ruby>振<rt>ふ</rt>仮<rt>り</rt>名<rt>がな</rt></ruby>。</article>
  <article class="demo-on"  lang="ko"><ruby>漢<rt>한</rt></ruby><ruby>字<rt>자</rt></ruby>、<ruby>훈<rt>訓</rt></ruby><ruby>음<rt>音</rt></ruby>。</article>
  <article class="demo-off" lang="ko"><ruby>漢<rt>한</rt></ruby><ruby>字<rt>자</rt></ruby>、<ruby>훈<rt>訓</rt></ruby><ruby>음<rt>音</rt></ruby>。</article>
</div>
<p class="demo-meta">機制：注音 ON cell 以 <code>&lt;ruby class="zhuyin"&gt;</code> 觸發 CSS 規則——載入 <code>Han Zhuyin Serif</code> web font（GPOS 定位調號）並啓用 <code>ruby-position: inter-character</code>；Safari 18.2+ 走原生，其他引擎以 <code>@supports not</code> CSS fallback 模擬字旁直書。每個 <code>&lt;ruby class="zhuyin"&gt;</code> 僅含 1 個基字，多字詞以相鄰 ruby 表達，這是字旁直書 layout 在 inter-character CSS fallback 下能正確運作的前提。OFF cell 為純 <code>&lt;ruby&gt;</code>，走瀏覽器預設。其他語系 ON/OFF 內容相同，皆由原生 ruby 處理——本框示意 markup 而非對比差異。</p>
