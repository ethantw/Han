<h2>15・連續行的 <code>&lt;u&gt;</code> / <code>&lt;s&gt;</code> / <code>&lt;del&gt;</code> / <code>&lt;ins&gt;</code> 斷線</h2>
<p class="description">同族裝飾線元素相鄰時，應於其間留出視覺間距，避免「連成一橫條」。Han.css 以 <code>text-decoration-inset: auto</code> 為主（Firefox 已預設啓用）；不支援時退回 <code>:has(+ u)</code> 純CSS；最末由 <code>markAdjacentLines</code> JS-fallback 加 <code>.han-followed-by-adjacent-line</code> 類別補齊。</p>

<h3>相鄰同族元素</h3>
<div class="demo-grid">
  <article class="demo-on"  lang="zh-Hant"><p><u class="pn">英國</u><u class="pn">倫敦</u>是個世上少有、數一數二，且融合古典及現代的大城市。</p></article>
  <article class="demo-off" lang="zh-Hant"><p><u class="pn">英國</u><u class="pn">倫敦</u>是個世上少有、數一數二，且融合古典及現代的大城市。</p></article>
  <article class="demo-on"  lang="zh-Hans"><p><del>已刪除的文字</del><del>另一段已刪除文字</del>繼續正文。</p></article>
  <article class="demo-off" lang="zh-Hans"><p><del>已刪除的文字</del><del>另一段已刪除文字</del>繼續正文。</p></article>
  <article class="demo-on"  lang="ja"><p><ins>追記甲</ins><ins>追記乙</ins>の後も文章は続く。</p></article>
  <article class="demo-off" lang="ja"><p><ins>追記甲</ins><ins>追記乙</ins>の後も文章は続く。</p></article>
  <article class="demo-on"  lang="ko"><p><s>취소선 갑</s><s>취소선 을</s> 이후 본문이 이어진다.</p></article>
  <article class="demo-off" lang="ko"><p><s>취소선 갑</s><s>취소선 을</s> 이후 본문이 이어진다.</p></article>
</div>

<h3>單一元素跨行斷線</h3>
<div class="demo-grid">
  <article class="demo-on"  lang="zh-Hant"><u>這是一段相當長的底線文字，跨越多行的時候希望底線在行末／行首被斷開。</u></article>
  <article class="demo-off" lang="zh-Hant"><u>這是一段相當長的底線文字，跨越多行的時候希望底線在行末／行首被斷開。</u></article>
  <article class="demo-on"  lang="zh-Hans"><del>这是一段被删除的较长文字，跨越多行的时候希望删除线在行末／行首被断开。</del></article>
  <article class="demo-off" lang="zh-Hans"><del>这是一段被删除的较长文字，跨越多行的时候希望删除线在行末／行首被断开。</del></article>
</div>

<h3>邊界情形（JS 專有）</h3>
<p class="description">以下情形 CSS <code>:has(+ u)</code> 無法處理，由 JS 下探 wrapper / 上爬 parent 補齊：</p>
<div class="demo-grid">
  <article class="demo-on" lang="zh-Hant">
    <p>Wrapper 下探：<u>甲</u><em><u>乙</u>丙</em>（<code>&lt;u&gt;</code> 後接 <code>&lt;em&gt;&lt;u&gt;…&lt;/em&gt;</code>）</p>
    <p>Parent 上爬：<p><u>甲</u></p><u>乙</u>（跨 block 邊界）</p>
    <p>文字節點中斷（正確 no-gap）：<u>甲</u>、<u>乙</u></p>
  </article>
  <article class="demo-off" lang="zh-Hant">
    <p>Wrapper 下探：<u>甲</u><em><u>乙</u>丙</em></p>
    <p>Parent 上爬：<p><u>甲</u></p><u>乙</u></p>
    <p>文字節點中斷：<u>甲</u>、<u>乙</u></p>
  </article>
</div>

<p class="demo-meta">機制：<code>text-decoration-inset: auto</code>（原生）→ <code>:has(+ u, + ins)</code>（CSS fallback）→ <code>markAdjacentLines</code>（JS fallback）。OFF 段以 <code>all: revert</code> 還原。</p>
