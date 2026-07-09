<h2>6・CJK <code>&lt;i&gt;</code> / <code>&lt;cite&gt;</code> / <code>&lt;var&gt;</code> 不再強制斜體</h2>
<p class="description">瀏覽器預設會把這些 inline 元素呈現為斜體，但漢字斜體在排版上並不存在。Han.css 在 CJK 語境下覆寫為 <code>font-style: inherit</code>。</p>
<div class="demo-grid">
  <article class="demo-on"  lang="zh-Hant">引用書名 <cite>夢溪筆談</cite>、變數 <var>x</var>、外語 <i>en passant</i>。</article>
  <article class="demo-off" lang="zh-Hant">引用書名 <cite>夢溪筆談</cite>、變數 <var>x</var>、外語 <i>en passant</i>。</article>
  <article class="demo-on"  lang="zh-Hans">引用书名 <cite>梦溪笔谈</cite>、变量 <var>x</var>、外语 <i>en passant</i>。</article>
  <article class="demo-off" lang="zh-Hans">引用书名 <cite>梦溪笔谈</cite>、变量 <var>x</var>、外语 <i>en passant</i>。</article>
  <article class="demo-on"  lang="ja">書名 <cite>枕草子</cite>、変数 <var>x</var>、外来語 <i>en passant</i>。</article>
  <article class="demo-off" lang="ja">書名 <cite>枕草子</cite>、変数 <var>x</var>、外来語 <i>en passant</i>。</article>
  <article class="demo-on"  lang="ko">책 이름 <cite>훈민정음</cite>, 변수 <var>x</var>, 외국어 <i>en passant</i>.</article>
  <article class="demo-off" lang="ko">책 이름 <cite>훈민정음</cite>, 변수 <var>x</var>, 외국어 <i>en passant</i>.</article>
</div>
<p class="demo-meta">機制：<code>:is(i, cite, var, ...) { font-style: inherit }</code>（OFF 段以 <code>font-style: revert</code> 還原為 UA 預設斜體）</p>
