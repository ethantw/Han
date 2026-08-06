<h2>8・地區標點變體</h2>
<p class="description">同一段文字，因 <code>lang</code> 不同而觸發不同地區的標點字型／位置。注意全形句號、引號、括號的形態差異。</p>
<div class="demo-grid pure-display">
  <article lang="zh-Hant">「引號」與（括號），漢字。標點：句末。</article>
  <article lang="zh-Hans">"引号"与（括号），汉字。标点：句末。</article>
  <article lang="ja">「引用符」と（括弧）、漢字。句読点：句末。</article>
  <article lang="ko">"인용 부호"와 (괄호)、한자。부호: 문장 끝。</article>
</div>
<p class="demo-meta">機制：每個 lang 觸發各自的 biaodian font（zh-Hans / zh-Hant TW / ja / ko）。詳見 <code>src/css/fonts/biaodian.*.css</code>。</p>
