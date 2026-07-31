<h2>4・標點慣例字型 <code>--han-punctuation-*</code></h2>
<p class="description">全形標點以 Diantenjeom 標點專用字型呈現，各語言各按其標點規範（繁 MOE・簡 GB・日 JIS），不依賴系統字型的標點寬度。變數逐語言：<code>--han-punctuation-hant／-hans／-ja</code>（韓文直排另有 <code>--han-punctuation-vertical-ko</code>），值為規範名或 <code>off</code>。</p>
<div class="demo-grid">
  <article class="demo-on"  lang="zh-Hant">「引號」與（括號），不用系統字型，標點窄而緊。</article>
  <article class="demo-off" lang="zh-Hant">「引號」與（括號），不用系統字型，標點窄而緊。</article>
  <article class="demo-on"  lang="zh-Hans">"引号"与（括号），不用系统字型，标点窄而紧。</article>
  <article class="demo-off" lang="zh-Hans">"引号"与（括号），不用系统字型，标点窄而紧。</article>
  <article class="demo-on"  lang="ja">「引用符」と（括弧）、システムフォントを使わず、句読点が狭く緊密。</article>
  <article class="demo-off" lang="ja">「引用符」と（括弧）、システムフォントを使わず、句読点が狭く緊密。</article>
  <article class="demo-on"  lang="ko">"인용 부호"와 (괄호), 시스템 글꼴을 쓰지 않고 부호가 좁고 빽빽하게.</article>
  <article class="demo-off" lang="ko">"인용 부호"와 (괄호), 시스템 글꼴을 쓰지 않고 부호가 좁고 빽빽하게.</article>
</div>
<p class="demo-meta">機制：<code>@container style(--han-punctuation-hant: MOE)</code> 等分支把 Diantenjeom 各變體填入標點字體槽（<code>--han-font-punctuation-*</code>）。ON cell 走各語言預設（MOE／GB／JIS）；OFF cell 逐語言設 <code>off</code>，標點落回正文字體。韓文橫排本就不經 Diantenjeom，此節 ko 兩格同貌屬預期。</p>
