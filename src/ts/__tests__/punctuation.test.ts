import { test } from 'node:test'
import assert from 'node:assert/strict'
import { html } from 'hyperly/fp'
import {
  refinePunctuation,
  refinePunctuationWithMode,
  classifyPunctuation,
  isCompressiblePair,
  wrapHangable,
} from '../line-adjustments/punctuation.ts'

/** Install happy-dom globals so `isBrowserSide()` returns true. Returns a
 *  teardown that restores SSR semantics for subsequent tests. */
const withBrowserGlobals = async () => {
  const { Window } = await import('happy-dom')
  const win = new Window()
  const prevDocument = (globalThis as any).document
  const prevCSS = (globalThis as any).CSS
  ;(globalThis as any).document = win.document
  ;(globalThis as any).CSS = win.CSS ?? { supports: () => false }
  return {
    win,
    teardown: () => {
      ;(globalThis as any).document = prevDocument
      ;(globalThis as any).CSS = prevCSS
    },
  }
}

const refine = (mode: 'auto' | 'compress' | 'hang' | 'none') =>
  (src: string) => html(refinePunctuationWithMode(mode)(src))

/* The unified `refinePunctuationWithMode(mode)(src)` curried API replaces the
 * old direct exports `compressPunctuation` / `hangPunctuation`. It
 * dispatches on `mode`:
 *
 *   none     → byte-identity (just hype-wraps)
 *   compress → wraps every biaodian as <h-char class="data-punct …">
 *   hang     → wraps line-end-hangable marks as
 *              <h-char data-punct="hangable"><h-layer>…</h-layer></h-char>
 *   auto     → single transform pass that does BOTH: every biaodian
 *              gets the punct/bd-* wrapper; hangable ones additionally
 *              pick up the hangable class + inner <h-layer>.
 *
 * The combined `auto` shape is:
 *   <h-char data-punct="end hangable"><h-layer>。</h-layer></h-char>
 *
 * Hangability inside `auto` is the same rule as `HANGABLE_PUNCT`:
 * char ∈ [、，。．] AND next char ∉ PUNCT_CLOSE_CHARS ∪ PUNCT_END_EXTRA. The
 * regex captures the next-char-after-the-run (via `(?=(.?))`) so a
 * hangable mark at the END of a run still gets correctly classified
 * against what follows the run in source order. */

/* ─── mode dispatch ──────────────────────────────────────── */

test('mode "none" returns byte-identical HTML', () => {
  assert.equal(refine('none')('<p>「字」。</p>'), '<p>「字」。</p>')
})

test('mode "compress" matches the legacy compressPunctuation shape', () => {
  assert.equal(
    refine('compress')('<p>「漢字」</p>'),
    '<p>'
      + '<h-char data-punct="open">「</h-char>'
      + '漢字'
      + '<h-char data-punct="close end">」</h-char>'
      + '</p>',
  )
})

test('pair classifier includes CJK marks/interpuncts and excludes fullwidth symbols', () => {
  for (const pair of ['》《', '。」', '。？', '》，', '，「', '。・', '，·'])
    assert.equal(isCompressiblePair(...[...pair] as [string, string]), true, pair)
  for (const pair of ['。／', '、－', '，＼', '。ー', '。漢'])
    assert.equal(isCompressiblePair(...[...pair] as [string, string]), false, pair)
})

test('colon, semicolon, question and exclamation marks carry the regional dividing subtype', () => {
  for (const mark of '：；？！')
    assert.deepEqual(classifyPunctuation(mark), ['end', 'dividing'])
})

test('compress: only a genuinely compressible inner seam gets a marker', () => {
  assert.match(refine('compress')('<p>》《。／</p>'), /data-squeeze-next="open"/)
  assert.doesNotMatch(refine('compress')('<p>。／</p>'), /data-squeeze-next/)
})

test('mode "hang" matches the legacy hangPunctuation shape', () => {
  assert.equal(
    refine('hang')('<p>句子。</p>'),
    '<p>句子<h-char data-punct="hangable"><h-layer>。</h-layer></h-char></p>',
  )
})

/* ─── auto mode: combined output ─────────────────────────── */

test('auto: 字。 → end + hangable on the same h-char', () => {
  assert.equal(
    refine('auto')('<p>句子。</p>'),
    '<p>句子'
      + '<h-char data-punct="end hangable"><h-layer>。</h-layer></h-char>'
      + '</p>',
  )
})

test('auto: 字、 (段末逗號) is hangable too', () => {
  assert.equal(
    refine('auto')('<p>甲、</p>'),
    '<p>甲'
      + '<h-char data-punct="end hangable"><h-layer>、</h-layer></h-char>'
      + '</p>',
  )
})

test('auto: 「字。」 — 。 followed by 」 (close) → NOT hangable', () => {
  // The closing bracket blocks hang per HANGABLE_PUNCT lookahead.
  assert.equal(
    refine('auto')('<p>「字。」</p>'),
    '<p>'
      + '<h-char data-punct="open">「</h-char>'
      + '字'
      + '<h-char data-punct="end consecutive" data-consecutive-pos="start" data-squeeze-next="close">。</h-char>'
      + '<h-char data-punct="close end consecutive" data-consecutive-pos="end">」</h-char>'
      + '</p>',
  )
})

test('auto: 字。「字 — 。 inside a run, next char is open → STILL hangable', () => {
  // The lookahead in HANGABLE_PUNCT only excludes PUNCT_CLOSE / PUNCT_END.
  // open does not block, so the period IS hangable even mid-run.
  // CSS handles when it actually visually hangs (line wrap).
  assert.equal(
    refine('auto')('<p>句。「字</p>'),
    '<p>句'
      + '<h-char data-punct="end consecutive hangable" data-consecutive-pos="start" data-followed-by="open" data-squeeze-next="open"><h-layer>。</h-layer></h-char>'
      + '<h-char data-punct="open consecutive" data-consecutive-pos="end">「</h-char>'
      + '字</p>',
  )
})

test('auto: 」、 at paragraph end — 、 is run-end + EOS, hangable', () => {
  // Run is 」、; 、 is data-consecutive-pos="end", after-run char is empty string,
  // so empty ∉ HANG_BLOCKING_CHARS → 、 IS hangable.
  assert.equal(
    refine('auto')('<p>字」、</p>'),
    '<p>字'
      + '<h-char data-punct="close end consecutive" data-consecutive-pos="start" data-followed-by="hangable" data-squeeze-next="hangable">」</h-char>'
      + '<h-char data-punct="end consecutive hangable" data-consecutive-pos="end"><h-layer>、</h-layer></h-char>'
      + '</p>',
  )
})

test('auto: cross-element run with a hangable end', () => {
  // 字。<b>「</b>字 — run is 。「 split at <b>; period is run-start, 「 is run-end.
  // Period followed by 「 (open) → hangable.
  assert.equal(
    refine('auto')('<p>字。<b>「</b>字</p>'),
    '<p>字'
      + '<h-char data-punct="end consecutive hangable" data-consecutive-pos="start" data-followed-by="open" data-squeeze-next="open"><h-layer>。</h-layer></h-char>'
      + '<b><h-char data-punct="open consecutive" data-consecutive-pos="end">「</h-char></b>'
      + '字</p>',
  )
})

/* ─── consecutive runs without hangable ──────────────────── */

test('auto: 「『字』」 — depth-2 quotes, no hangable mark involved', () => {
  // No 、，。．anywhere; just compress wrapping with data-consecutive-pos.
  assert.equal(
    refine('auto')('<p>「『字』」</p>'),
    '<p>'
      + '<h-char data-punct="open consecutive" data-consecutive-pos="start" data-squeeze-next="open">「</h-char>'
      + '<h-char data-punct="open consecutive" data-consecutive-pos="end">『</h-char>'
      + '字'
      + '<h-char data-punct="close end consecutive" data-consecutive-pos="start" data-squeeze-next="close">』</h-char>'
      + '<h-char data-punct="close end consecutive" data-consecutive-pos="end">」</h-char>'
      + '</p>',
  )
})

/* ─── idempotence ────────────────────────────────────────── */

test('auto mode is idempotent — second call is byte-identical', () => {
  const once = refine('auto')('<p>句子。</p>')
  const twice = html(refinePunctuationWithMode('auto')(once))
  assert.equal(twice, once)
})

test('auto on a live happy-dom Element mutates in place, no nesting', async () => {
  const { Window } = await import('happy-dom')
  const win = new Window()
  win.document.body.innerHTML = '<p>句子。</p>'
  const p = win.document.body.querySelector('p')!
  refinePunctuationWithMode('auto')(p as unknown as Element)
  const once = p.innerHTML
  refinePunctuationWithMode('auto')(p as unknown as Element)
  assert.equal(p.innerHTML, once)
  assert.doesNotMatch(p.innerHTML, /<h-char[^>]*><h-char/)
})

/* ─── degenerate inputs ──────────────────────────────────── */

test('auto: empty string passes through', () => {
  assert.equal(refine('auto')(''), '')
})

test('auto: Latin-only paragraph emits no h-char', () => {
  assert.equal(
    refine('auto')('<p>Hello, world.</p>'),
    '<p>Hello, world.</p>',
  )
})

/* ─── <em> interaction ──────────────────────────────────── */
// auto / compress / hang treat <em> as transparent — biaodian inside <em>
// gets the same wrappers as biaodian anywhere else.

test('auto: biaodian inside <em> gets the same full treatment as outside', () => {
  assert.equal(
    refine('auto')('<p><em>字。</em></p>'),
    '<p><em>字'
      + '<h-char data-punct="end hangable"><h-layer>。</h-layer></h-char>'
      + '</em></p>',
  )
})

test('compress: biaodian inside <em> gets punct wrappers', () => {
  assert.equal(
    refine('compress')('<p><em>字，</em></p>'),
    '<p><em>字<h-char data-punct="end">，</h-char></em></p>',
  )
})

test('hang: hangable mark inside <em> is wrapped the same as outside', () => {
  assert.equal(
    refine('hang')('<p><em>字。</em></p>'),
    '<p><em>字<h-char data-punct="hangable"><h-layer>。</h-layer></h-char></em></p>',
  )
})

test('auto: ，(in <em>) + 。(outside) form a single consecutive run', () => {
  // hyperly bridges across <em>; ，and 。are adjacent biaodian → one run.
  // ，at i=0: next char 。∈ HANG_BLOCKING_CHARS → NOT hangable.
  // 。at i=1 (run-end): nextAfterRun='' → hangable.
  assert.equal(
    refine('auto')('<p><em>字，</em>。</p>'),
    '<p><em>字'
      + '<h-char data-punct="end consecutive" data-consecutive-pos="start" data-followed-by="hangable" data-squeeze-next="hangable">，</h-char>'
      + '</em>'
      + '<h-char data-punct="end consecutive hangable" data-consecutive-pos="end"><h-layer>。</h-layer></h-char>'
      + '</p>',
  )
})

/* ─── cascade-write: browser path ────────────────────────── */
/* Future CSS will use `@container style(--han-punctuation-refinement: …)`
 * to switch styles per subtree. So when JS runs `refinePunctuationWithMode`
 * on a subtree, both signals must be atomic:
 *   (a) emit mode-specific wrappers (markup), and
 *   (b) write `--han-punctuation-refinement: <mode>` inline on src
 *       (so the cascade var matches what was emitted).
 * The browser-path tests below pin (b); SSR-path tests pin its absence. */

test('browser: refinePunctuationWithMode("compress") sets --han-punctuation-refinement on src', async () => {
  const { win, teardown } = await withBrowserGlobals()
  try {
    win.document.body.innerHTML = '<article><p>字，</p></article>'
    const article = win.document.querySelector('article')!
    refinePunctuationWithMode('compress')(article as unknown as Element)
    assert.equal(
      (article as unknown as HTMLElement).style.getPropertyValue('--han-punctuation-refinement'),
      'compress',
    )
    // markup wrappers should also be present (atomicity)
    assert.match(article.innerHTML, /<h-char data-punct="end">，<\/h-char>/)
  } finally {
    teardown()
  }
})

test('browser: switching mode on the same src updates inline cascade var', async () => {
  const { win, teardown } = await withBrowserGlobals()
  try {
    win.document.body.innerHTML = '<article><p>字。</p></article>'
    const article = win.document.querySelector('article')! as unknown as HTMLElement
    refinePunctuationWithMode('compress')(article as unknown as Element)
    assert.equal(article.style.getPropertyValue('--han-punctuation-refinement'), 'compress')
    refinePunctuationWithMode('hang')(article as unknown as Element)
    assert.equal(article.style.getPropertyValue('--han-punctuation-refinement'), 'hang')
  } finally {
    teardown()
  }
})

test('browser: mode "none" still writes the cascade var (so CSS @container can match it)', async () => {
  const { win, teardown } = await withBrowserGlobals()
  try {
    win.document.body.innerHTML = '<article><p>字。</p></article>'
    const article = win.document.querySelector('article')! as unknown as HTMLElement
    refinePunctuationWithMode('none')(article as unknown as Element)
    assert.equal(article.style.getPropertyValue('--han-punctuation-refinement'), 'none')
    // markup is byte-identical (none means no wrappers)
    assert.equal(article.innerHTML, '<p>字。</p>')
  } finally {
    teardown()
  }
})

/* ─── cascade-write: SSR path stays out of inline style ──── */
/* Decided 2026-05-08: SSR output should not carry inline
 * `--han-punctuation-refinement`. The browser-side `installFallbacks`
 * (or any direct call) sets it on hydration; until then CSS reads from
 * `:root` cascade. */

/* ─── auto-entry asymmetry: cascade ← declared, JS ← effective ───
 * `refinePunctuation(src)` reads the cascade-declared mode and runs JS
 * for the *effective* mode (downgraded for native `text-spacing-trim:
 * trim-start`). The cascade var write must reflect **declared**, not
 * effective — CSS uses the var + `@supports` to branch native/fallback
 * itself; stomping the cascade to `hang` would lose the author's `auto`
 * intent. */

test('refinePunctuation: declared "auto" + native trim-start → cascade stays "auto", JS runs hang recipe', async () => {
  const { Window } = await import('happy-dom')
  const win = new Window()
  win.document.body.innerHTML = '<article><p>句子。</p></article>'
  const article = win.document.querySelector('article')! as unknown as HTMLElement
  // Author declares auto on the article so resolvePunctMode picks it up.
  article.style.setProperty('--han-punctuation-refinement', 'auto')

  const prevDocument = (globalThis as any).document
  const prevCSS = (globalThis as any).CSS
  const prevGCS = (globalThis as any).getComputedStyle
  ;(globalThis as any).document = win.document
  ;(globalThis as any).CSS = {
    supports: (prop: string, val: string) =>
      prop === 'text-spacing-trim' && val === 'trim-start',
  }
  ;(globalThis as any).getComputedStyle = (el: Element) =>
    (win as unknown as Window & { getComputedStyle(el: Element): CSSStyleDeclaration })
      .getComputedStyle(el)

  try {
    refinePunctuation(article as unknown as Element)
    // Cascade reflects declared, not the downgraded JS mode.
    assert.equal(article.style.getPropertyValue('--han-punctuation-refinement'), 'auto')
    // Markup is hang-only shape: just <h-layer> wrapping for the period.
    // The combined "end hangable" auto shape would have a data-punct="end hangable";
    // hang-only emits just data-punct="hangable".
    assert.match(
      article.innerHTML,
      /<h-char data-punct="hangable"><h-layer>。<\/h-layer><\/h-char>/,
    )
    // No "end hangable" combined shape — that would mean auto recipe ran.
    assert.doesNotMatch(article.innerHTML, /data-punct="end hangable"/)
  } finally {
    ;(globalThis as any).document = prevDocument
    ;(globalThis as any).CSS = prevCSS
    ;(globalThis as any).getComputedStyle = prevGCS
  }
})

test('SSR: refinePunctuationWithMode does NOT write inline cascade var', async () => {
  // No globals set → isBrowserSide() === false
  const { Window } = await import('happy-dom')
  const win = new Window()
  win.document.body.innerHTML = '<article><p>字。</p></article>'
  const article = win.document.querySelector('article')! as unknown as HTMLElement
  refinePunctuationWithMode('auto')(article as unknown as Element)
  assert.equal(
    article.style.getPropertyValue('--han-punctuation-refinement'),
    '',
  )
  // markup transformation still happened
  assert.match(article.innerHTML, /<h-char data-punct="end hangable">/)
})

test('code-like elements are skipped — no <h-char> inside code/pre/kbd/samp', () => {
  // Monospace / literal-text containers must not get punctuation wrappers:
  // a comma must not hang in code, and splitting the text node breaks
  // downstream single-text-node consumers (see helpers/skip.ts).
  for (const tag of ['code', 'pre', 'kbd', 'samp']) {
    const out = refine('auto')(`<${tag}>字，A</${tag}>`)
    assert.doesNotMatch(out, /<h-char/, `${tag}: punctuation must be left untouched`)
    assert.match(out, /，/, `${tag}: the comma survives verbatim`)
  }
})

/* ────────────────────────────────────────────────────────── */
/* data-followed-by — what sits after a hangable mark          */
/*                                                             */
/* The wrapper's <h-layer> is out of flow, so the engine can no */
/* longer squeeze the FOLLOWING mark against a glyph that has  */
/* left the inline run. The attribute is the CSS hook that pays */
/* that half em back (src/css/lines.with-js.css § 標點懸掛).    */
/* ────────────────────────────────────────────────────────── */

test('followed-by: hang — every opening bracket is reported', () => {
  for (const open of '「『《〈（〔［｛【〖')
    assert.equal(
      refine('hang')(`<p>字。${open}字</p>`),
      '<p>字'
        + '<h-char data-punct="hangable" data-followed-by="open"><h-layer>。</h-layer></h-char>'
        + `${open}字</p>`,
      `after ${open}`,
    )
})

test('followed-by: hang — 中点類 report middle, the rest of the bucket report nothing', () => {
  for (const dot of '·・')
    assert.match(
      refine('hang')(`<p>字。${dot}字</p>`),
      /data-followed-by="middle"/,
      `${dot} is 中点類 — it compresses, so it must be reported`,
    )
  // `＼／－゠＆＿` share the `middle` subtype but do NOT compress against a
  // preceding mark (measured: 2em with or without han.css), so reporting them
  // would make the CSS over-squeeze by half an em.
  for (const sym of '＼／－゠＆＿')
    assert.doesNotMatch(
      refine('hang')(`<p>字。${sym}字</p>`),
      /data-followed-by/,
      `${sym} does not compress — nothing to repair`,
    )
})

test('followed-by: absent when nothing follows, or a plain character does', () => {
  assert.doesNotMatch(refine('hang')('<p>字。</p>'), /data-followed-by/)
  assert.doesNotMatch(refine('hang')('<p>字。字</p>'), /data-followed-by/)
  assert.doesNotMatch(refine('hang')('<p>字。A</p>'), /data-followed-by/)
})

test('followed-by: auto reports it too, on the hangable mark only', () => {
  assert.equal(
    refine('auto')('<p>字。「字</p>'),
    '<p>字'
      + '<h-char data-punct="end consecutive hangable" data-consecutive-pos="start" data-followed-by="open" data-squeeze-next="open"><h-layer>。</h-layer></h-char>'
      + '<h-char data-punct="open consecutive" data-consecutive-pos="end">「</h-char>'
      + '字</p>',
  )
})

test('followed-by: a blocked mark is neither hangable nor annotated', () => {
  // 」 is a HANG_BLOCKING_CHAR, so 。 never hangs and never needs the hook.
  const out = refine('auto')('<p>字。」字</p>')
  assert.doesNotMatch(out, /hangable/)
  assert.doesNotMatch(out, /data-followed-by/)
})

/* ─── preceded-by (mirror bug): squeeze-aware hang (auto → hang on native) ───
 * `wrapHangable(true)` is what the auto-entry runs once the UA's native
 * `text-spacing-trim` downgrades the recipe: squeeze IS wanted, so the
 * squeezer before a wrapped hangable is wrapped too (plain inline) and marked
 * `data-followed-by="hangable"` for CSS `letter-spacing`. */
const refineSqueeze = (src: string) => html(wrapHangable(true)(src))

test('preceded-by: 」 before hangable 、 is wrapped as a plain squeezer', () => {
  // 對」，要 — 」 keeps its trailing ½em because the following 、is out of flow.
  assert.equal(
    refineSqueeze('<p>對」，要</p>'),
    '<p>對'
      + '<h-char data-punct="close end" data-followed-by="hangable">」</h-char>'
      + '<h-char data-punct="hangable"><h-layer>，</h-layer></h-char>'
      + '要</p>',
  )
})

test('preceded-by: an end mark 。 before hangable ， is a squeezer too', () => {
  assert.equal(
    refineSqueeze('<p>。，要</p>'),
    '<p>'
      + '<h-char data-punct="end" data-followed-by="hangable">。</h-char>'
      + '<h-char data-punct="hangable"><h-layer>，</h-layer></h-char>'
      + '要</p>',
  )
})

test('preceded-by: browser native path uses the complete pair table', () => {
  assert.equal(
    refineSqueeze('<p>？，要</p>'),
    '<p>'
      + '<h-char data-punct="end dividing" data-followed-by="hangable">？</h-char>'
      + '<h-char data-punct="hangable"><h-layer>，</h-layer></h-char>'
      + '要</p>',
  )
})

test('preceded-by: a Han char before a hangable is NOT wrapped', () => {
  // only real squeezers pay the ½em; a plain ideograph has no trailing space.
  assert.equal(
    refineSqueeze('<p>甲，乙</p>'),
    '<p>甲<h-char data-punct="hangable"><h-layer>，</h-layer></h-char>乙</p>',
  )
})

test('preceded-by: pure hang wraps only the hangable, no squeezer, no hook', () => {
  // squeezeBefore=false → legacy shape; 」 stays a bare text node.
  const out = html(wrapHangable(false)('<p>對」，要</p>'))
  assert.equal(
    out,
    '<p>對」<h-char data-punct="hangable"><h-layer>，</h-layer></h-char>要</p>',
  )
  assert.doesNotMatch(out, /data-followed-by="hangable"/)
})

test('preceded-by: idempotent — re-running leaves the wrappers untouched', () => {
  const once = refineSqueeze('<p>對」，要</p>')
  assert.equal(refineSqueeze(once), once)
})

/* ── Foreign content: MathML / SVG are skipped whole ─────────────────
 * Not a style preference. MathML Core's UA sheet gives an unrecognised
 * descendant of <math> `display: block`, so one <h-char> around a 「，」
 * inside an <mtext> splits that line of display maths in two (observed in
 * Chromium, station 伍's 式5.1). SVG <text> simply does not paint an
 * unknown child. Neither has any legal position for an HTML wrapper. */
test('MathML is left alone — no <h-char> inside <math>', () => {
  const out = html(refinePunctuationWithMode('auto')(
    '<p><math><mrow><mtext>權重，零</mtext></mrow></math></p>',
  ))
  assert.equal(out, '<p><math><mrow><mtext>權重，零</mtext></mrow></math></p>')
})

test('SVG is left alone — no <h-char> inside <svg>', () => {
  const out = html(refinePunctuationWithMode('auto')(
    '<p><svg><text>權重，零</text></svg></p>',
  ))
  assert.equal(out, '<p><svg><text>權重，零</text></svg></p>')
})

test('…but the paragraph AROUND the maths is still refined', () => {
  const out = html(refinePunctuationWithMode('auto')(
    '<p>如式，<math><mtext>零</mtext></math></p>',
  ))
  assert.match(out, /<h-char/)
  assert.doesNotMatch(out, /<math>[\s\S]*<h-char/)
})
