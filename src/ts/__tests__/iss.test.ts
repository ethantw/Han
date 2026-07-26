import { test } from 'node:test'
import assert from 'node:assert/strict'
import { html } from 'hyperly/fp'
import {
  applyISS,
  applyISSWithMode,
  applyISSWithProbe,
} from '../line-adjustments/iss.ts'

const TAG = '<h-iss hidden=""> </h-iss>'
// `replace` mode stamps `mode="replace"` on its output so callers /
// devtools can tell which semantic produced the tag (replaced an
// author-typed space vs. injected at a tight boundary). `insert` mode
// emits the bare TAG without the marker.
const REPLACE_TAG = '<h-iss hidden="" data-mode="replace"> </h-iss>'

/* ────────────────────────────────────────────────────────── */
/* legacy: applyISSWithMode('insert') — `text-autospace: insert` path  */
/*                                                             */
/* Kept around for `--han-text-autospace: strict` and for      */
/* hand-callers on UAs that don't implement native             */
/* `text-autospace: normal`. The native path covers the same   */
/* ground for everyone else.                                   */
/* ────────────────────────────────────────────────────────── */

const iss = (src: string) => html(applyISSWithMode('insert')(src))

test('inserts ISS between Han and Latin letter', () => {
  assert.equal(iss('<p>字A</p>'), `<p>字${TAG}A</p>`)
})

test('inserts ISS between Latin letter and Han', () => {
  assert.equal(iss('<p>A字</p>'), `<p>A${TAG}字</p>`)
})

test('inserts ISS on both sides of a Latin run sandwiched between Han', () => {
  assert.equal(iss('<p>字abc字</p>'), `<p>字${TAG}abc${TAG}字</p>`)
})

test('inserts ISS between Han and ASCII digits', () => {
  assert.equal(iss('<p>字9</p>'), `<p>字${TAG}9</p>`)
  assert.equal(iss('<p>9字</p>'), `<p>9${TAG}字</p>`)
})

test('inserts ISS between Han and a Western opening punct', () => {
  assert.equal(iss('<p>字"hello"</p>'), `<p>字${TAG}"hello"</p>`)
  assert.equal(iss('<p>字(note)</p>'), `<p>字${TAG}(note)</p>`)
})

test('inserts ISS between a Western closing punct and Han', () => {
  assert.equal(iss('<p>"hello"字</p>'), `<p>"hello"${TAG}字</p>`)
  assert.equal(iss('<p>(note)字</p>'), `<p>(note)${TAG}字</p>`)
})

test('inserts ISS between a sentence-end punct and Han', () => {
  assert.equal(iss('<p>Hello,字</p>'), `<p>Hello,${TAG}字</p>`)
  assert.equal(iss('<p>End.字</p>'), `<p>End.${TAG}字</p>`)
})

test('inserts ISS for Hiragana, Katakana, Hangul boundaries', () => {
  assert.equal(iss('<p>あA</p>'), `<p>あ${TAG}A</p>`)
  assert.equal(iss('<p>カA</p>'), `<p>カ${TAG}A</p>`)
  assert.equal(iss('<p>한A</p>'), `<p>한${TAG}A</p>`)
})

test('inserts ISS for Greek and Cyrillic letters too', () => {
  assert.equal(iss('<p>字α</p>'), `<p>字${TAG}α</p>`)
  assert.equal(iss('<p>字Я</p>'), `<p>字${TAG}Я</p>`)
})

test('inserts ISS around SMP-range Han (surrogate pair)', () => {
  // U+20000 (𠀀) — outside BMP, requires Unicode-aware regex.
  assert.equal(iss('<p>𠀀A</p>'), `<p>𠀀${TAG}A</p>`)
  assert.equal(iss('<p>A𠀀</p>'), `<p>A${TAG}𠀀</p>`)
})

test('plain Latin text is left untouched', () => {
  assert.equal(iss('<p>Hello, world.</p>'), '<p>Hello, world.</p>')
})

test('plain Han text is left untouched', () => {
  assert.equal(iss('<p>漢字標準格式</p>'), '<p>漢字標準格式</p>')
})

test('CJK punctuation between Han and Latin does not trigger ISS', () => {
  // 「 is a CJK biaodian, not Western punctuation — no ISS at「A boundary.
  assert.equal(iss('<p>字「A</p>'), '<p>字「A</p>')
})

test('idempotent: re-running over already-spaced HTML is a no-op', () => {
  const once = iss('<p>字A</p>')
  const twice = iss(once)
  assert.equal(twice, once)
})

test('mutates a live Element in place (used by installFallbacks)', async () => {
  const { Window } = await import('happy-dom')
  const win = new Window()
  win.document.body.innerHTML = '<p>字A</p>'
  const p = win.document.body.querySelector('p')!
  applyISSWithMode('insert')(p as unknown as Element)
  assert.equal(p.innerHTML, `字${TAG}A`)
})

test('handles boundary across inline elements (spacer lands outside the wrapper)', () => {
  // The Han is in a <b>; the Latin follows directly. `insert` with
  // `outer: true` bubbles the h-iss out of <b>, so the spacer sits
  // at the actual visual seam and doesn't inherit the bold weight.
  assert.equal(
    iss('<p><b>字</b>A</p>'),
    `<p><b>字</b>${TAG}A</p>`,
  )
})

/* ────────────────────────────────────────────────────────── */
/* primary: applyISSWithMode('replace') — `text-autospace: replace`    */
/*                                                             */
/* Eats author-typed whitespace at Han ↔ Western boundaries,   */
/* leaves the no-whitespace case alone (native `insert`        */
/* covers it).                                                 */
/* ────────────────────────────────────────────────────────── */

const replace = (src: string) => html(applyISSWithMode('replace')(src))

test('replace: consumes a single space between Han and Latin', () => {
  assert.equal(replace('<p>字 A</p>'), `<p>字${REPLACE_TAG}A</p>`)
})

test('replace: consumes a single space between Latin and Han', () => {
  assert.equal(replace('<p>A 字</p>'), `<p>A${REPLACE_TAG}字</p>`)
})

test('replace: collapses multiple spaces into one h-iss', () => {
  assert.equal(replace('<p>字   A</p>'), `<p>字${REPLACE_TAG}A</p>`)
})

test('replace: consumes tab / newline / form-feed at the boundary', () => {
  assert.equal(replace('<p>字\tA</p>'), `<p>字${REPLACE_TAG}A</p>`)
  assert.equal(replace('<p>字\nA</p>'), `<p>字${REPLACE_TAG}A</p>`)
  assert.equal(replace('<p>字\fA</p>'), `<p>字${REPLACE_TAG}A</p>`)
})

test('replace: preserves U+00A0 (non-breaking space) — author intent', () => {
  // NBSP renders at a fixed visible width and is an explicit author
  // choice (no-break + visible spacing). Squashing it into a ¼-em
  // h-iss would lose both properties — leave it alone.
  assert.equal(replace('<p>字 A</p>'), '<p>字&nbsp;A</p>')
})

test('replace: preserves U+3000 (ideographic space) — author intent', () => {
  // U+3000 is the full-em CJK space, used deliberately for author-
  // chosen full-width gaps. Don't substitute a ¼-em h-iss for it.
  assert.equal(replace('<p>字　A</p>'), '<p>字　A</p>')
})

test('replace: leaves "字A" alone (no whitespace to replace)', () => {
  assert.equal(replace('<p>字A</p>'), '<p>字A</p>')
})

test('replace: leaves "Hello world" alone (no Han, just Latin)', () => {
  assert.equal(replace('<p>Hello world</p>'), '<p>Hello world</p>')
})

test('replace: leaves "字 字" alone (whitespace between Han, not boundary)', () => {
  assert.equal(replace('<p>字 字</p>'), '<p>字 字</p>')
})

test('replace: handles boundary at a Western opening punct', () => {
  assert.equal(replace('<p>字 "hello"</p>'), `<p>字${REPLACE_TAG}"hello"</p>`)
})

test('replace: handles boundary at a Western end punct', () => {
  assert.equal(replace('<p>"hello" 字</p>'), `<p>"hello"${REPLACE_TAG}字</p>`)
})

test('replace: handles Hiragana, Katakana, Hangul boundaries', () => {
  assert.equal(replace('<p>あ A</p>'), `<p>あ${REPLACE_TAG}A</p>`)
  assert.equal(replace('<p>カ A</p>'), `<p>カ${REPLACE_TAG}A</p>`)
  assert.equal(replace('<p>한 A</p>'), `<p>한${REPLACE_TAG}A</p>`)
})

test('replace: handles SMP-range Han', () => {
  assert.equal(replace('<p>𠀀 A</p>'), `<p>𠀀${REPLACE_TAG}A</p>`)
})

test('replace: NOT idempotent — second pass nests into prior h-iss', () => {
  // `replace` mode is a one-shot transform. Its `\s+` arm matches the
  // literal U+0020 *inside* an already-inserted `<h-iss>`, so a second
  // pass nests a new tag into the old one. `installFallbacks` calls it
  // exactly once at DOMContentLoaded; manual re-callers should strip
  // existing h-iss first if they need clean state.
  const once = replace('<p>字 A</p>')
  const twice = replace(once)
  assert.notEqual(twice, once)
  assert.match(twice, /<h-iss[^>]*><h-iss/)
})

test('replace: mutates a live Element in place', async () => {
  const { Window } = await import('happy-dom')
  const win = new Window()
  win.document.body.innerHTML = '<p>字 A</p>'
  const p = win.document.body.querySelector('p')!
  applyISSWithMode('replace')(p as unknown as Element)
  assert.equal(p.innerHTML, `字${REPLACE_TAG}A`)
})

test('strict mode (replace then insert) handles both shapes', () => {
  // `字 A` → replace pass eats the space + drops a `mode="replace"` tag.
  // `字B`  → insert pass drops a bare tag at the Han↔Latin boundary.
  // The two sites are independent, but verify they compose without
  // a re-match on the just-inserted h-iss's space character.
  const result = html(applyISSWithMode('strict')('<p>字 A・字B</p>'))
  assert.equal(result, `<p>字${REPLACE_TAG}A・字${TAG}B</p>`)
})

/* ─── cascade-write: browser path ────────────────────────── */
/* `applyISSWithMode(mode)` syncs `--han-text-autospace: <mode>` to inline
 * style on `src` (browser only) so future CSS @container style queries
 * can match the per-subtree mode. SSR path skips the write — hydration
 * in the browser sets it. */

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

test('browser: applyISSWithMode("strict") sets --han-text-autospace on src', async () => {
  const { win, teardown } = await withBrowserGlobals()
  try {
    win.document.body.innerHTML = '<article><p>字A</p></article>'
    const article = win.document.querySelector('article')! as unknown as HTMLElement
    applyISSWithMode('strict')(article as unknown as Element)
    assert.equal(article.style.getPropertyValue('--han-text-autospace'), 'strict')
    assert.match(article.innerHTML, /h-iss/)
  } finally {
    teardown()
  }
})

test('browser: switching mode updates inline cascade var', async () => {
  const { win, teardown } = await withBrowserGlobals()
  try {
    win.document.body.innerHTML = '<article><p>字A</p></article>'
    const article = win.document.querySelector('article')! as unknown as HTMLElement
    applyISSWithMode('insert')(article as unknown as Element)
    assert.equal(article.style.getPropertyValue('--han-text-autospace'), 'insert')
    applyISSWithMode('replace')(article as unknown as Element)
    assert.equal(article.style.getPropertyValue('--han-text-autospace'), 'replace')
  } finally {
    teardown()
  }
})

test('SSR: applyISSWithMode does NOT write inline cascade var', async () => {
  const { Window } = await import('happy-dom')
  const win = new Window()
  win.document.body.innerHTML = '<article><p>字A</p></article>'
  const article = win.document.querySelector('article')! as unknown as HTMLElement
  applyISSWithMode('insert')(article as unknown as Element)
  assert.equal(article.style.getPropertyValue('--han-text-autospace'), '')
  assert.match(article.innerHTML, /h-iss/)
})

/* ────────────────────────────────────────────────────────── */
/* cascade-dispatching entries — applyISS / applyISSWithProbe */
/*                                                            */
/* These read `--han-text-autospace` from the cascade,        */
/* consult `CSS.supports`, and (for the probe variant)        */
/* `detectAutospaceBoundaryBug` to decide whether to run JS   */
/* at all. happy-dom resolves inline custom properties via    */
/* `getComputedStyle`, so the cascade-resolution path is      */
/* exercisable; `CSS.supports` is mocked per-test to drive    */
/* the decision matrix in `needsJS`.                          */
/* ────────────────────────────────────────────────────────── */

const withCascadeGlobals = async (
  supports: (prop: string, value: string) => boolean = () => false,
) => {
  const { Window } = await import('happy-dom')
  const win = new Window()
  const prev = {
    document: (globalThis as any).document,
    CSS: (globalThis as any).CSS,
    getComputedStyle: (globalThis as any).getComputedStyle,
  }
  ;(globalThis as any).document = win.document
  ;(globalThis as any).CSS = { supports }
  ;(globalThis as any).getComputedStyle = win.getComputedStyle.bind(win)
  return {
    win,
    teardown: () => {
      ;(globalThis as any).document = prev.document
      ;(globalThis as any).CSS = prev.CSS
      ;(globalThis as any).getComputedStyle = prev.getComputedStyle
    },
  }
}

/** Build an <article> with a given `--han-text-autospace` inline cascade. */
const seed = (win: any, mode: string, body = '<p>字A</p>') => {
  win.document.body.innerHTML =
    `<article style="--han-text-autospace: ${mode}">${body}</article>`
  return win.document.querySelector('article') as unknown as Element
}

/* ─── applyISS — no probe ────────────────────────────────── */

test('applyISS: mode="none" short-circuits — no h-iss, no cascade rewrite', async () => {
  const { win, teardown } = await withCascadeGlobals(() => true)
  try {
    const article = seed(win, 'none')
    const before = (article as any as HTMLElement).innerHTML
    applyISS(article)
    assert.equal((article as any as HTMLElement).innerHTML, before)
  } finally {
    teardown()
  }
})

test('applyISS: cascade "no-autospace"（CSS 枚舉的停用值）→ 映射 none：不插 h-iss、不覆寫宣告', async () => {
  const { win, teardown } = await withCascadeGlobals(() => false)
  try {
    const article = seed(win, 'no-autospace')
    const el = article as any as HTMLElement
    const before = el.innerHTML
    applyISS(article)
    assert.equal(el.innerHTML, before)
    // 不得被 write-back 改成 normal（那會把作者的停用悄悄轉成啟用）
    assert.equal(
      el.style.getPropertyValue('--han-text-autospace').trim(),
      'no-autospace',
    )
  } finally {
    teardown()
  }
})

test('applyISS: mode="normal" + native autospace supported → no JS', async () => {
  // The probe asks for `normal`, not `insert` — every shipping engine reports
  // false for `CSS.supports('text-autospace', 'insert')` even where the
  // property works (see needsJS in line-adjustments/iss.ts).
  const { win, teardown } = await withCascadeGlobals(
    (_p, v) => v === 'normal',
  )
  try {
    const article = seed(win, 'normal')
    applyISS(article)
    assert.doesNotMatch((article as any as HTMLElement).innerHTML, /h-iss/)
  } finally {
    teardown()
  }
})

test('applyISS: mode="normal" + no native support → runs insertISS', async () => {
  const { win, teardown } = await withCascadeGlobals(() => false)
  try {
    const article = seed(win, 'normal')
    applyISS(article)
    assert.match((article as any as HTMLElement).innerHTML, /h-iss/)
  } finally {
    teardown()
  }
})

test('applyISS: mode="replace" + native replace supported → no JS', async () => {
  const { win, teardown } = await withCascadeGlobals(
    (_p, v) => v === 'replace',
  )
  try {
    const article = seed(win, 'replace', '<p>字 A</p>')
    applyISS(article)
    assert.doesNotMatch((article as any as HTMLElement).innerHTML, /h-iss/)
  } finally {
    teardown()
  }
})

test('applyISS: mode="replace" + no native support → runs replaceISS', async () => {
  const { win, teardown } = await withCascadeGlobals(() => false)
  try {
    const article = seed(win, 'replace', '<p>字 A</p>')
    applyISS(article)
    assert.match(
      (article as any as HTMLElement).innerHTML,
      /h-iss[^>]*data-mode="replace"/,
    )
  } finally {
    teardown()
  }
})

test('applyISS: mode="strict" runs JS regardless of native support', async () => {
  const { win, teardown } = await withCascadeGlobals(() => true)
  try {
    const article = seed(win, 'strict', '<p>字 A・字B</p>')
    applyISS(article)
    const got = (article as any as HTMLElement).innerHTML
    assert.match(got, /data-mode="replace"/, 'replace pass ran')
    assert.match(got, /字<h-iss[^>]*hidden=""[^>]*> <\/h-iss>B/, 'insert pass ran')
  } finally {
    teardown()
  }
})

test('applyISS: unknown cascade token falls back to "normal"', async () => {
  const { win, teardown } = await withCascadeGlobals(() => false)
  try {
    const article = seed(win, 'garbage-mode')
    applyISS(article)
    // Falls back to "normal" → insertISS runs because supports() returns false.
    assert.match((article as any as HTMLElement).innerHTML, /h-iss/)
  } finally {
    teardown()
  }
})

test('applyISS: empty cascade falls back to "normal"', async () => {
  const { win, teardown } = await withCascadeGlobals(() => false)
  try {
    win.document.body.innerHTML = '<article><p>字A</p></article>'
    const article = win.document.querySelector('article')! as unknown as Element
    applyISS(article)
    assert.match((article as any as HTMLElement).innerHTML, /h-iss/)
  } finally {
    teardown()
  }
})

/* ─── applyISSWithProbe — with the Safari inline-boundary probe ── */
/* happy-dom doesn't lay out, so the probe always reports clean.   */
/* The buggy-probe-forces-JS branch is exercised by Safari e2e.    */

test('applyISSWithProbe: mode="none" short-circuits BEFORE the probe runs', async () => {
  const { win, teardown } = await withCascadeGlobals(() => true)
  try {
    const article = seed(win, 'none')
    const before = (article as any as HTMLElement).innerHTML
    applyISSWithProbe(article)
    assert.equal((article as any as HTMLElement).innerHTML, before)
    // Probe inserts + removes a measurement element on documentElement;
    // a short-circuit should leave no debris on body either.
    assert.equal(win.document.body.children.length, 1, 'no probe debris')
  } finally {
    teardown()
  }
})

test('applyISSWithProbe: mode="normal" + native + clean probe → no JS', async () => {
  const { win, teardown } = await withCascadeGlobals(
    (_p, v) => v === 'normal' || v === 'insert',
  )
  try {
    const article = seed(win, 'normal')
    applyISSWithProbe(article)
    assert.doesNotMatch((article as any as HTMLElement).innerHTML, /h-iss/)
  } finally {
    teardown()
  }
})

test('applyISSWithProbe: mode="strict" runs JS regardless of probe', async () => {
  const { win, teardown } = await withCascadeGlobals(() => true)
  try {
    const article = seed(win, 'strict', '<p>字 A</p>')
    applyISSWithProbe(article)
    assert.match(
      (article as any as HTMLElement).innerHTML,
      /h-iss[^>]*data-mode="replace"/,
    )
  } finally {
    teardown()
  }
})

test('code-like elements are skipped — no <h-iss> inside code/pre/kbd/samp', () => {
  // Literal-text containers must not get inter-script spacers; a space in
  // code is meaningful, not a ¼-em gap (see helpers/skip.ts).
  for (const tag of ['code', 'pre', 'kbd', 'samp']) {
    assert.equal(iss(`<${tag}>字A</${tag}>`), `<${tag}>字A</${tag}>`)
  }
})
