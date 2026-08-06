<h2>11・引文 <code>&lt;blockquote&gt;</code> 縮排</h2>
<p class="description">引文段落整體內縮 2em；巢狀引文再縮 1em。</p>
<div class="demo-grid">
  <article class="demo-on"  lang="zh-Hant"><blockquote>外層引文。<blockquote>巢狀引文。</blockquote></blockquote></article>
  <article class="demo-off" lang="zh-Hant"><blockquote>外層引文。<blockquote>巢狀引文。</blockquote></blockquote></article>
  <article class="demo-on"  lang="zh-Hans"><blockquote>外层引文。<blockquote>嵌套引文。</blockquote></blockquote></article>
  <article class="demo-off" lang="zh-Hans"><blockquote>外层引文。<blockquote>嵌套引文。</blockquote></blockquote></article>
  <article class="demo-on"  lang="ja"><blockquote>外側の引用。<blockquote>入れ子の引用。</blockquote></blockquote></article>
  <article class="demo-off" lang="ja"><blockquote>外側の引用。<blockquote>入れ子の引用。</blockquote></blockquote></article>
  <article class="demo-on"  lang="ko"><blockquote>외부 인용。<blockquote>중첩 인용。</blockquote></blockquote></article>
  <article class="demo-off" lang="ko"><blockquote>외부 인용。<blockquote>중첩 인용。</blockquote></blockquote></article>
</div>
<p class="demo-meta">機制：<code>blockquote { margin-inline: var(--han-prose-indent) }</code>，巢狀為 <code>calc(var(--han-prose-indent) / 2)</code></p>
