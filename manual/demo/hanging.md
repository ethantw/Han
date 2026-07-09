<h2>3・標點懸掛 <code>hanging-punctuation</code></h2>
<p class="description">行末若是逗號、句號等可懸掛標點，讓它向版心外溢出。Han.css v4 預設只在 zh-Hans / ja / ko-Hant 啓用 JS-fallback；zh-Hant 需在父層加 <code>han-use-curated-fonts</code> container 才會啓用。</p>
<div class="demo-grid">
  <article class="demo-on"  lang="zh-Hant">這是測試標點懸掛的段落，包含逗號，句號。第三、第四也在這裡。</article>
  <article class="demo-off" lang="zh-Hant">這是測試標點懸掛的段落，包含逗號，句號。第三、第四也在這裡。</article>
  <article class="demo-on"  lang="zh-Hans">这是测试标点悬挂的段落，包含逗号，句号。第三、第四也在这里。</article>
  <article class="demo-off" lang="zh-Hans">这是测试标点悬挂的段落，包含逗号，句号。第三、第四也在这里。</article>
  <article class="demo-on"  lang="ja">これは標点ぶら下げのテスト段落で、読点、句点。三番目、四番目も含む。</article>
  <article class="demo-off" lang="ja">これは標点ぶら下げのテスト段落で、読点、句点。三番目、四番目も含む。</article>
  <article class="demo-on"  lang="ko">이것은 문장부호 매달기 테스트 단락으로, 쉼표, 마침표. 셋째, 넷째도 포함된다.</article>
  <article class="demo-off" lang="ko">이것은 문장부호 매달기 테스트 단락으로, 쉼표, 마침표. 셋째, 넷째도 포함된다.</article>
</div>
<p class="demo-meta">控制變數：<code>--han-hanging-punctuation</code></p>
