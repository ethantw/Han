<h2>9・章節邊距與縮排（整體）</h2>
<p class="description"><code>&lt;article&gt;</code> 內的章節、段落、引文、列表自動取得排印的邊距與縮排（預設 2em）。每 cell 的 <code>&lt;article&gt;</code> 包含 h3 / h4 / p / blockquote / ul，整體排版差異可一眼看出。</p>
<div class="demo-grid">
  <article class="demo-on"  lang="zh-Hant"><h3>第一節</h3><h4>子節</h4><p>本文段落。</p><blockquote>引文段落。</blockquote><ul><li>列表項目。</li></ul></article>
  <article class="demo-off" lang="zh-Hant"><h3>第一節</h3><h4>子節</h4><p>本文段落。</p><blockquote>引文段落。</blockquote><ul><li>列表項目。</li></ul></article>
  <article class="demo-on"  lang="zh-Hans"><h3>第一节</h3><h4>子节</h4><p>正文段落。</p><blockquote>引文段落。</blockquote><ul><li>列表项目。</li></ul></article>
  <article class="demo-off" lang="zh-Hans"><h3>第一节</h3><h4>子节</h4><p>正文段落。</p><blockquote>引文段落。</blockquote><ul><li>列表项目。</li></ul></article>
  <article class="demo-on"  lang="ja"><h3>第一節</h3><h4>サブセクション</h4><p>本文段落。</p><blockquote>引用段落。</blockquote><ul><li>リスト項目。</li></ul></article>
  <article class="demo-off" lang="ja"><h3>第一節</h3><h4>サブセクション</h4><p>本文段落。</p><blockquote>引用段落。</blockquote><ul><li>リスト項目。</li></ul></article>
  <article class="demo-on"  lang="ko"><h3>제1절</h3><h4>하위 절</h4><p>본문 단락。</p><blockquote>인용 단락。</blockquote><ul><li>목록 항목。</li></ul></article>
  <article class="demo-off" lang="ko"><h3>제1절</h3><h4>하위 절</h4><p>본문 단락。</p><blockquote>인용 단락。</blockquote><ul><li>목록 항목。</li></ul></article>
</div>
<p class="demo-meta">機制：<code>--han-prose</code> style query（<code>&lt;article&gt;</code> 預設 <code>on</code>）；縮排量：<code>--han-prose-indent</code>。OFF cell 設 <code>--han-prose: off</code>，其子孫的 style query 讀到即全數不生效。</p>

<div class="sr-api-block">
  <h3>9·a・API 開關示範 — 子樹 opt-out</h3>
  <p class="description">於 <code>&lt;article&gt;</code> 內任意子樹的<strong>祖先</strong>上設 <code>--han-prose: off</code>，該子樹的標題邊距、縮排等一概不生效（style query 不命中即無事發生，無需 revert），而外層 <code>&lt;article&gt;</code> 的精細排版不受影響。</p>
  <article class="sr-api-host" lang="zh-Hant">
    <h4>外層 — 套精細排版</h4>
    <p>外層段落自帶縮排與邊距。</p>
    <blockquote>外層引文，內縮 2em。</blockquote>
    <ul><li>外層列表項目。</li></ul>

    <div style="--han-prose: off;">
      <p class="sr-api-label">內層 — opt-out 子樹</p>
      <h4>內層標題</h4>
      <p>段落 — 三大瀏覽器皆退回 UA 預設邊距。</p>
      <blockquote>引文。</blockquote>
      <ul><li>列表項目。</li></ul>
    </div>
  </article>
  <p class="demo-meta">機制：<code>@container style(--han-prose: on)</code> 只查<strong>祖先</strong>——子樹祖先標成 <code>off</code>，query 不命中，規則根本不套用，沒有東西需要還原。</p>
</div>
