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
 *   data-followed-by         on the `<q>` / `<cite>` itself, value `hangable`
 *                            — the mirror of `wrapHangablePairs`' squeezer
 *                            marking, except the squeezer here is a pseudo,
 *                            so CSS pays the half em on `q::after` directly.
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
    '<p>他說'
      + '<h-char data-punct="end">：</h-char>'
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
    '<p><q>他讀<cite>紅樓夢'
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

test('auto: a NON-hangable mark after </q> leaves the <q> unmarked — the repair only exists for hangables', () => {
  assert.equal(
    auto('<p><q>好</q>「引」</p>'),
    '<p><q>好</q>'
      + '<h-char data-punct="open">「</h-char>引'
      + '<h-char data-punct="close end">」</h-char></p>',
  )
})

/* ─── what breaks adjacency ──────────────────────────────── */

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
