<h2>5・著重號 <code>&lt;em&gt;</code></h2>
<p class="description">CJK 排版中「斜體」並不適用——Han.css 將 <code>&lt;em&gt;</code> 改為著重號（emphasis dots），語義保留。</p>
<div class="demo-grid">
  <article class="demo-on"  lang="zh-Hant">這是<em>非常重要</em>的一段話，請仔細閱讀。</article>
  <article class="demo-off" lang="zh-Hant">這是<em>非常重要</em>的一段話，請仔細閱讀。</article>
  <article class="demo-on"  lang="zh-Hans">这是<em>非常重要</em>的一段话，请仔细阅读。</article>
  <article class="demo-off" lang="zh-Hans">这是<em>非常重要</em>的一段话，请仔细阅读。</article>
  <article class="demo-on"  lang="ja">これは<em>とても重要な</em>段落です、よく読んでください。</article>
  <article class="demo-off" lang="ja">これは<em>とても重要な</em>段落です、よく読んでください。</article>
  <article class="demo-on"  lang="ko">이것은 <em>매우 중요한</em> 문장이니, 잘 읽어 주세요.</article>
  <article class="demo-off" lang="ko">이것은 <em>매우 중요한</em> 문장이니, 잘 읽어 주세요.</article>
</div>
<p class="demo-meta">機制：CJK 段落內 <code>em → text-emphasis</code>（OFF 段以 <code>all: revert</code> 還原為 UA 預設斜體）</p>
