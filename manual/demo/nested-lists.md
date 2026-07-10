<h2>12・多層 <code>&lt;ol&gt;</code> / <code>&lt;ul&gt;</code> 巢狀</h2>
<p class="description">列表項目自動取得 2em 縮排，巢狀層級漸進。</p>
<div class="demo-grid">
  <article class="demo-on"  lang="zh-Hant"><ol><li>第一層<ol><li>第二層<ol><li>第三層<ol><li>第四層</li></ol></li></ol></li></ol></li></ol></article>
  <article class="demo-off" lang="zh-Hant"><ol><li>第一層<ol><li>第二層<ol><li>第三層<ol><li>第四層</li></ol></li></ol></li></ol></li></ol></article>
  <article class="demo-on"  lang="zh-Hans"><ul><li>第一层<ul><li>第二层<ul><li>第三层<ul><li>第四层</li></ul></li></ul></li></ul></li></ul></article>
  <article class="demo-off" lang="zh-Hans"><ul><li>第一层<ul><li>第二层<ul><li>第三层<ul><li>第四层</li></ul></li></ul></li></ul></li></ul></article>
  <article class="demo-on"  lang="ja"><ol><li>第一階<ol><li>第二階<ol><li>第三階<ol><li>第四階</li></ol></li></ol></li></ol></li></ol></article>
  <article class="demo-off" lang="ja"><ol><li>第一階<ol><li>第二階<ol><li>第三階<ol><li>第四階</li></ol></li></ol></li></ol></li></ol></article>
  <article class="demo-on"  lang="ko"><ul><li>1단계<ul><li>2단계<ul><li>3단계<ul><li>4단계</li></ul></li></ul></li></ul></li></ul></article>
  <article class="demo-off" lang="ko"><ul><li>1단계<ul><li>2단계<ul><li>3단계<ul><li>4단계</li></ul></li></ul></li></ul></li></ul></article>
</div>
<p class="demo-meta">機制：<code>ol, ul { margin-inline-start: var(--han-prose-indent) }</code></p>
