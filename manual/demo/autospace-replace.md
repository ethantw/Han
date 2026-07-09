<h2>1·a・混排間距・JS 驅動模式 <code>replace</code> / <code>strict</code></h2>
<p class="description">CSS Text 4 的 <code>text-autospace: replace</code> 至今無瀏覽器實作；Han.css 在 <code>--han-text-autospace</code> 為 <code>replace</code> 時，以 JS 找出作者手寫的「漢字／西文之間的空白」、吃掉它再塞入一顆 <code>&lt;h-iss&gt;</code>（CSS 縮成 ¼-em）。<code>strict</code> 同時處理「無空白」的邊界，把 native insert 也接管到 JS。下面樣文同時包含兩類邊界：<code>Han.css 是</code>（手寫空白）與 <code>2026年</code>、<code>v4。</code>（無空白）——左欄 <code>replace</code> 只動有空白處、右欄 <code>strict</code> 兩處都動。</p>
<div class="demo-grid">
  <article class="demo-replace" lang="zh-Hant">Han.css 是個 CSS 排版框架，2026 年正式釋出 v4。</article>
  <article class="demo-strict"  lang="zh-Hant">Han.css 是個 CSS 排版框架，2026 年正式釋出 v4。</article>
  <article class="demo-replace" lang="zh-Hans">Han.css 是个 CSS 排版框架，2026 年正式发布 v4。</article>
  <article class="demo-strict"  lang="zh-Hans">Han.css 是个 CSS 排版框架，2026 年正式发布 v4。</article>
  <article class="demo-replace" lang="ja">Han.css は CSS タイポグラフィの枠組み，2026 年に v4 を公開。</article>
  <article class="demo-strict"  lang="ja">Han.css は CSS タイポグラフィの枠組み，2026 年に v4 を公開。</article>
  <article class="demo-replace" lang="ko">Han.css는 CSS 조판 프레임워크，2026년 v4 공개。</article>
  <article class="demo-strict"  lang="ko">Han.css는 CSS 조판 프레임워크，2026년 v4 공개。</article>
</div>
<p class="demo-meta">控制變數：<code>--han-text-autospace</code> ∈ <code>{ normal | insert | replace | strict | no-autospace }</code></p>
