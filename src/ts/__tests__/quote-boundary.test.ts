import { test } from 'node:test'
import assert from 'node:assert/strict'
import { html } from 'hyperly/fp'
import { refinePunctuationWithMode } from '../line-adjustments/punctuation.ts'
import { markQuoteBoundaries } from '../line-adjustments/quote-boundary.ts'

/* `<q>` and `<cite>` draw their brackets from `::before` / `::after`
 * (`content: open-quote`), so those glyphs are REAL CJK brackets that never
 * appear in the DOM. Every boundary judgement `refinePunctuation` makes is
 * therefore one character short: `<q>今天真好。</q>` renders as 「今天真好。」,
 * yet the pass sees nothing after the period and marks it hangable — it hangs
 * into the margin with a close bracket painted after it.
 *
 * This pass records the STRUCTURAL fact (a punctuation wrapper abuts a
 * quote-generating element's boundary) and leaves the cascade fact (does that
 * element currently generate a CJK bracket? — mode × lang × nesting) to CSS,
 * the same split `markAdjacentLines` uses for `<cite>`'s wavy line.
 *
 *   data-followed-by-quote   on the `<h-char>` — space-separated tokens,
 *                            innermost generator first: `close-cite close-q`
 *                            when one mark ends a `<cite>` inside a `<q>`.
 *                            Reads like the existing `data-followed-by`: a
 *                            fact about what comes NEXT.
 *   data-followed-by         on the `<q>` / `<cite>` itself — subtype of the
 *                            wrapped punctuation after its closing pseudo.
 *   data-open-followed-by    on the generator — subtype/token immediately
 *                            after its opening pseudo.
 *   data-followed-by-quote   may also sit on a generator when its closing
 *                            pseudo meets another generated bracket.
 */

const boundaries =
    (mode: 'auto' | 'compress' | 'hang' | 'none') =>
    (src: string): string =>
  html(markQuoteBoundaries(refinePunctuationWithMode(mode)(src)))

const auto = boundaries('auto')

/* ─── the bug: a hangable mark at a close boundary ───────── */

test('auto: 。 ending a <q> is marked close-q (renders as 。」 — must not hang)', () => {
  assert.equal(
    auto('<p>他說：<q>今天真好。</q></p>'),
    // The colon is at the open boundary itself — 他說：「今天真好。」 is the
    // canonical shape, and `：「` is a genuine squeeze pair.
    '<p>他說'
      + '<h-char data-punct="end dividing" data-followed-by-quote="open-q">：</h-char>'
      + '<q>今天真好'
      + '<h-char data-punct="end hangable" data-followed-by-quote="close-q">'
      + '<h-layer>。</h-layer></h-char>'
      + '</q></p>',
  )
})

test('hang: same mark, same marking on the native-engine recipe', () => {
  assert.equal(
    boundaries('hang')('<p><q>今天真好。</q></p>'),
    '<p><q>今天真好'
      + '<h-char data-punct="hangable" data-followed-by-quote="close-q">'
      + '<h-layer>。</h-layer></h-char>'
      + '</q></p>',
  )
})

test('auto: 。 ending a <cite> nested at the end of a <q> reports BOTH generators, inner first', () => {
  // `--han-cite-title-marks: none` (the default) means the cite draws nothing
  // and the `」` is still what follows — CSS ORs the two tokens, so the fact
  // has to carry every layer, not just the innermost.
  assert.equal(
    auto('<p><q>他讀<cite>紅樓夢。</cite></q></p>'),
    '<p><q>他讀<cite data-followed-by-quote="close-q">紅樓夢'
      + '<h-char data-punct="end hangable" data-followed-by-quote="close-cite close-q">'
      + '<h-layer>。</h-layer></h-char>'
      + '</cite></q></p>',
  )
})

test('auto: the mark may sit deeper than the boundary element (<q><em>好。</em></q>)', () => {
  assert.equal(
    auto('<p><q><em>今天真好。</em></q></p>'),
    '<p><q><em>今天真好'
      + '<h-char data-punct="end hangable" data-followed-by-quote="close-q">'
      + '<h-layer>。</h-layer></h-char>'
      + '</em></q></p>',
  )
})

/* ─── the open boundary: a mark right before the element ── */

test('auto: 、 before a <q> is marked open-q (renders as 、「)', () => {
  assert.equal(
    auto('<p>他說、<q>好</q></p>'),
    '<p>他說'
      + '<h-char data-punct="end hangable" data-followed-by-quote="open-q">'
      + '<h-layer>、</h-layer></h-char>'
      + '<q>好</q></p>',
  )
})

test('auto: 、 before a <cite> is marked open-cite', () => {
  assert.equal(
    auto('<p>他讀、<cite>紅樓夢</cite></p>'),
    '<p>他讀'
      + '<h-char data-punct="end hangable" data-followed-by-quote="open-cite">'
      + '<h-layer>、</h-layer></h-char>'
      + '<cite>紅樓夢</cite></p>',
  )
})

test('auto: a NON-hangable mark before a <q> is marked too — JS records structure, CSS decides', () => {
  assert.equal(
    auto('<p>「引」<q>好</q></p>'),
    '<p><h-char data-punct="open">「</h-char>引'
      + '<h-char data-punct="close end" data-followed-by-quote="open-q">」</h-char>'
      + '<q>好</q></p>',
  )
})

test('auto: the mark may sit deeper than the element it precedes (<em>…、</em><q>)', () => {
  assert.equal(
    auto('<p><em>他說、</em><q>好</q></p>'),
    '<p><em>他說'
      + '<h-char data-punct="end hangable" data-followed-by-quote="open-q">'
      + '<h-layer>、</h-layer></h-char>'
      + '</em><q>好</q></p>',
  )
})

/* ─── the outer close boundary: the pseudo is the payer ─── */

test('auto: a hangable mark after </q> marks the <q> itself (renders as 」、 — the pseudo pays)', () => {
  assert.equal(
    auto('<p><q>好</q>、然後</p>'),
    '<p><q data-followed-by="hangable">好</q>'
      + '<h-char data-punct="end hangable"><h-layer>、</h-layer></h-char>'
      + '然後</p>',
  )
})

test('auto: a non-hangable mark after </q> records its pair subtype for fallback', () => {
  assert.equal(
    auto('<p><q>好</q>「引」</p>'),
    '<p><q data-followed-by="open">好</q>'
      + '<h-char data-punct="open">「</h-char>引'
      + '<h-char data-punct="close end">」</h-char></p>',
  )
})

test('auto: a closing bracket before a <cite> is marked open-cite (renders as 」《)', () => {
  assert.equal(
    auto('<p>「引」<cite>紅樓夢</cite></p>'),
    '<p><h-char data-punct="open">「</h-char>引'
      + '<h-char data-punct="close end" data-followed-by-quote="open-cite">」</h-char>'
      + '<cite>紅樓夢</cite></p>',
  )
})

/* ─── last child ≠ at the boundary ───────────────────────── */

/* The mark has to be the last thing in the element's whole flow, not merely
 * the last child of SOME descendant — `<q><em>好，</em>然後</q>` renders as
 * 「好，然後」, where the comma sits mid-line and must keep hanging. A naive
 * "climb while lastChild" would mark it. Mirrored on the open side. */

test('auto: a mark that is a descendant last-child but NOT at the </q> edge is left alone', () => {
  assert.equal(
    auto('<p><q><em>今天真好，</em>然後</q></p>'),
    '<p><q><em>今天真好'
      + '<h-char data-punct="end hangable"><h-layer>，</h-layer></h-char>'
      + '</em>然後</q></p>',
  )
})

test('auto: a mark followed by more content inside the same <q> is left alone', () => {
  assert.equal(
    auto('<p><q>今天真好，<em>然後</em></q></p>'),
    '<p><q>今天真好'
      + '<h-char data-punct="end hangable"><h-layer>，</h-layer></h-char>'
      + '<em>然後</em></q></p>',
  )
})

test('auto: on the open side too — <em>…、</em>然後<q> is not a boundary', () => {
  assert.equal(
    auto('<p><em>他說、</em>然後<q>好</q></p>'),
    '<p><em>他說'
      + '<h-char data-punct="end hangable"><h-layer>、</h-layer></h-char>'
      + '</em>然後<q>好</q></p>',
  )
})

/* ─── a generator's own close bracket blocks the climb ───── */

/* Climbing out of an element to find what follows is only sound while the
 * element paints nothing. Climb out of a `<q>`/`<cite>` and its OWN close
 * bracket is painted right there, between the mark and whatever is next —
 * so nothing past that point is adjacent any more. */

test('auto: only the OUTER cite is marked — the inner one\'s 〉 is followed by the outer 》', () => {
  assert.equal(
    auto('<p>他讀了<cite>太陽中文報<cite>社論</cite></cite>、然後</p>'),
    '<p>他讀了<cite data-followed-by="hangable">太陽中文報<cite data-followed-by-quote="close-cite">社論</cite></cite>'
      + '<h-char data-punct="end hangable"><h-layer>、</h-layer></h-char>'
      + '然後</p>',
  )
})

test('auto: both traversals at once — ancestor climb inside, forward climb outside', () => {
  // The two walks answer different questions and only one of them can be
  // wrong here: the inner period asks "which layers do I close" (ancestors,
  // both), while each cite asks "does my close bracket meet a hangable"
  // (forward, outer only). Moving this one period in or out of the inner
  // cite is what decides which walk runs at all.
  //
  // The period is `consecutive` with the comma and NOT hangable, because
  // hyperly matches over the flattened text and cannot see the two `</cite>`
  // between them (docs/notes/2026-08-11-pseudo-quote-boundaries.md § 附帶發現).
  // The verdict is right by accident — 〉》 really do follow it — and this
  // pass's own markers are unaffected, which is what is asserted here.
  assert.equal(
    auto('<p>他讀了<cite>太陽中文報<cite>社論。</cite></cite>、然後</p>'),
    '<p>他讀了<cite data-followed-by="hangable">太陽中文報<cite data-followed-by-quote="close-cite">社論'
      + '<h-char data-punct="end consecutive" data-consecutive-pos="start"'
      + ' data-followed-by-quote="close-cite close-cite">。</h-char>'
      + '</cite></cite>'
      + '<h-char data-punct="end consecutive hangable" data-consecutive-pos="end">'
      + '<h-layer>、</h-layer></h-char>'
      + '然後</p>',
  )
})

test('auto: the mark is not open-q for the next q; the closing pseudo owns that seam', () => {
  assert.equal(
    auto('<p><q>今天真好。</q><q>明天也是</q></p>'),
    '<p><q data-followed-by-quote="open-q">今天真好'
      + '<h-char data-punct="end hangable" data-followed-by-quote="close-q">'
      + '<h-layer>。</h-layer></h-char>'
      + '</q><q>明天也是</q></p>',
  )
})

test('auto: same across kinds — 」《 is marked on the q pseudo, not the inner mark', () => {
  assert.equal(
    auto('<p><q>今天真好，</q><cite>太陽中文報</cite></p>'),
    '<p><q data-followed-by-quote="open-cite">今天真好'
      + '<h-char data-punct="end hangable" data-followed-by-quote="close-q">'
      + '<h-layer>，</h-layer></h-char>'
      + '</q><cite>太陽中文報</cite></p>',
  )
})

test('auto: opening pseudo records a wrapped punctuation follower', () => {
  assert.equal(
    auto('<p><q>、好</q></p>'),
    '<p><q data-open-followed-by="hangable">'
      + '<h-char data-punct="end hangable"><h-layer>、</h-layer></h-char>'
      + '好</q></p>',
  )
})

test('auto: nested opening pseudos are marked on the outer generator', () => {
  assert.equal(
    auto('<p><q><cite>書</cite></q></p>'),
    '<p><q data-open-followed-by="open-cite">'
      + '<cite data-followed-by-quote="close-q">書</cite>'
      + '</q></p>',
  )
})

test('auto: climbing out of a plain wrapper still finds the boundary', () => {
  // The block above must not over-correct: `<em>` paints nothing, so the
  // climb through it is still sound.
  assert.equal(
    auto('<p><em>他說、</em><q>好</q></p>'),
    '<p><em>他說'
      + '<h-char data-punct="end hangable" data-followed-by-quote="open-q">'
      + '<h-layer>、</h-layer></h-char>'
      + '</em><q>好</q></p>',
  )
})

/* ─── what breaks adjacency ──────────────────────────────── */

test('auto: whitespace-only text breaks the boundary like any other text', () => {
  // Aligned with `markAdjacentLines`: any text between the pair breaks it,
  // and indentation IS text — `。` newline `</q>` renders the collapsed space
  // between the period and the 」, so they are genuinely not adjacent. The
  // marks only ever describe what actually touches.
  assert.equal(
    auto('<p><q>今天真好。\n</q></p>'),
    '<p><q>今天真好'
      + '<h-char data-punct="end hangable"><h-layer>。</h-layer></h-char>'
      + '\n</q></p>',
  )
})

test('auto: text between the mark and the <q> breaks the boundary', () => {
  assert.equal(
    auto('<p>他說、然後<q>好</q></p>'),
    '<p>他說'
      + '<h-char data-punct="end hangable"><h-layer>、</h-layer></h-char>'
      + '然後<q>好</q></p>',
  )
})

test('auto: <wbr> between the mark and the <q> does NOT break the boundary', () => {
  assert.equal(
    auto('<p>他說、<wbr><q>好</q></p>'),
    '<p>他說'
      + '<h-char data-punct="end hangable" data-followed-by-quote="open-q">'
      + '<h-layer>、</h-layer></h-char>'
      + '<wbr><q>好</q></p>',
  )
})

test('auto: an HTML comment does NOT break the boundary', () => {
  assert.equal(
    auto('<p><q>今天真好。<!-- note --></q></p>'),
    '<p><q>今天真好'
      + '<h-char data-punct="end hangable" data-followed-by-quote="close-q">'
      + '<h-layer>。</h-layer></h-char>'
      + '<!-- note --></q></p>',
  )
})

test('auto: no punctuation at the boundary, nothing is marked', () => {
  assert.equal(
    auto('<p>他說<q>好</q>然後</p>'),
    '<p>他說<q>好</q>然後</p>',
  )
})

test('auto: <code> inside a <q> is skipped whole, so there is no wrapper to mark', () => {
  assert.equal(
    auto('<p><q><code>今天真好。</code></q></p>'),
    '<p><q><code>今天真好。</code></q></p>',
  )
})

/* ─── modes that produce no hangables ────────────────────── */

test('compress: boundaries are still recorded — the wrapper exists, the hang does not', () => {
  assert.equal(
    boundaries('compress')('<p><q>今天真好。</q></p>'),
    '<p><q>今天真好'
      + '<h-char data-punct="end" data-followed-by-quote="close-q">。</h-char>'
      + '</q></p>',
  )
})

test('none: nothing is wrapped, so nothing is marked', () => {
  assert.equal(
    boundaries('none')('<p><q>今天真好。</q></p>'),
    '<p><q>今天真好。</q></p>',
  )
})

/* ─── idempotence ────────────────────────────────────────── */

test('running the pass twice does not duplicate tokens', () => {
  const once = auto('<p><q>他讀<cite>紅樓夢。</cite></q>、然後</p>')
  assert.equal(html(markQuoteBoundaries(once)), once)
})
