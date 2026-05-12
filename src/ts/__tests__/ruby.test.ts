import { test } from 'node:test'
import assert from 'node:assert/strict'
import { html } from 'hyperly/fp'
import { Window } from 'happy-dom'
import { transpileRuby } from '../semantics/ruby.ts'

// Silence advisory warnings (e.g. multiple zhuyin <rtc> layers).
console.warn = () => {}

const setup = (htmlStr: string) => {
  const win = new Window()
  win.document.body.innerHTML = htmlStr
  return win.document.body as unknown as Element
}

// ─── Form A: tabular zhuyin only ────────────────────────────────────────

test('Form A — class on parent <ruby>, plain <rtc>', () => {
  const body = setup(
    '<p><ruby class="zhuyin"><rb>漢</rb><rb>字</rb><rtc><rt>ㄏㄢˋ</rt><rt>ㄗˋ</rt></rtc></ruby></p>',
  )
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML,
    '<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby>'
    + '<ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>',
  )
})

test('Form A — class on <rtc> instead of parent', () => {
  const body = setup(
    '<p><ruby><rb>漢</rb><rb>字</rb><rtc class="zhuyin"><rt>ㄏㄢˋ</rt><rt>ㄗˋ</rt></rtc></ruby></p>',
  )
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML,
    '<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby>'
    + '<ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>',
  )
})

// ─── Form B: tabular dual annotation (zhuyin + romanization) ────────────

test('Form B — zhuyin + pinyin via two <rtc>s, simple 1:1', () => {
  const body = setup(
    '<p><ruby><rb>漢</rb><rb>字</rb>'
    + '<rtc class="zhuyin"><rt>ㄏㄢˋ</rt><rt>ㄗˋ</rt></rtc>'
    + '<rtc class="romanization"><rt>hàn</rt><rt>zì</rt></rtc>'
    + '</ruby></p>',
  )
  transpileRuby(body)
  const inner = body.querySelector('p')!.innerHTML
  assert.match(inner, /<ruby><ruby class="zhuyin">漢<rt>ㄏㄢˋ<\/rt><\/ruby><rt>hàn<\/rt><\/ruby>/)
  assert.match(inner, /<ruby><ruby class="zhuyin">字<rt>ㄗˋ<\/rt><\/ruby><rt>zì<\/rt><\/ruby>/)
})

test('Form B — rbspan groups multiple inner rubies under one outer rt', () => {
  const body = setup(
    '<p><ruby><rb>朋</rb><rb>友</rb>'
    + '<rtc class="zhuyin"><rt>ㄆㄥˊ</rt><rt>ㄧㄡˇ</rt></rtc>'
    + '<rtc class="romanization"><rt rbspan="2">péngyǒu</rt></rtc>'
    + '</ruby></p>',
  )
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML,
    '<ruby>'
    + '<ruby class="zhuyin">朋<rt>ㄆㄥˊ</rt></ruby>'
    + '<ruby class="zhuyin">友<rt>ㄧㄡˇ</rt></ruby>'
    + '<rt>péngyǒu</rt>'
    + '</ruby>',
  )
})

// ─── Form E: 3+ layers (zhuyin + multiple romanization rtcs) ────────────

test('Form E — multi-layer nesting (zhuyin + POJ + 台羅)', () => {
  const body = setup(
    '<p><ruby><rb>朋</rb><rb>友</rb>'
    + '<rtc class="zhuyin"><rt>ㄆㄥˊ</rt><rt>ㄧㄡˇ</rt></rtc>'
    + '<rtc class="romanization"><rt rbspan="2">pîng-iú</rt></rtc>'
    + '<rtc class="romanization"><rt rbspan="2">pîng-iú</rt></rtc>'
    + '</ruby></p>',
  )
  transpileRuby(body)
  const out = body.querySelector('p')!.innerHTML
  assert.match(out, /^<ruby><ruby><ruby class="zhuyin">朋/)
  assert.equal((out.match(/<\/ruby>/g) ?? []).length, 4)
})

// ─── <rb> content is never inspected ──────────────────────────────────

test('punct inside <rb> converts normally', () => {
  const body = setup(
    '<p><ruby class="zhuyin"><rb>，</rb><rtc><rt>xxx</rt></rtc></ruby></p>',
  )
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML,
    '<ruby class="zhuyin">，<rt>xxx</rt></ruby>',
  )
})

test('zhuyin <rtc> declared after romanization <rtc> is still primary', () => {
  const body = setup(
    '<p><ruby><rb>漢</rb><rb>字</rb>'
    + '<rtc class="romanization"><rt>hàn</rt><rt>zì</rt></rtc>'
    + '<rtc class="zhuyin"><rt>ㄏㄢˋ</rt><rt>ㄗˋ</rt></rtc>'
    + '</ruby></p>',
  )
  transpileRuby(body)
  const inner = body.querySelector('p')!.innerHTML
  // zhuyin is primary → inner ruby; romanization is extra → outer ruby+rt
  assert.match(inner, /<ruby><ruby class="zhuyin">漢<rt>ㄏㄢˋ<\/rt><\/ruby><rt>hàn<\/rt><\/ruby>/)
  assert.match(inner, /<ruby><ruby class="zhuyin">字<rt>ㄗˋ<\/rt><\/ruby><rt>zì<\/rt><\/ruby>/)
})

test('no zhuyin class anywhere — output rubies have no class', () => {
  const body = setup(
    '<p><ruby><rb>X</rb>，<rb>Y</rb><rtc><rt></rt><rt></rt></rtc></ruby></p>',
  )
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML,
    '<ruby>X<rt></rt></ruby>，<ruby>Y<rt></rt></ruby>',
  )
})

// ─── in/outside <rb> × with/without extra rtc (2×2 matrix) ───────────

test('<rb> containing punct — converts as normal base', () => {
  const body = setup(
    '<p><ruby><rb>，</rb><rb>A</rb>'
    + '<rtc class="zhuyin"><rt>x</rt><rt>a</rt></rtc>'
    + '<rtc class="romanization"><rt rbspan="2">xA</rt></rtc>'
    + '</ruby></p>',
  )
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML,
    '<ruby><ruby class="zhuyin">，<rt>x</rt></ruby><ruby class="zhuyin">A<rt>a</rt></ruby><rt>xA</rt></ruby>',
  )
})

test('punct outside <rb> + extra rtc — segment boundary respected', () => {
  const body = setup(
    `<p><ruby>
  <rb>友</rb>，<rb>伊</rb>
  <rtc class="zhuyin"><rt>ㄧㄨˋ</rt><rt>ㄧ</rt></rtc>
  <rtc><rt>iú</rt><rt>i</rt></rtc>
</ruby></p>`,
  )
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML,
    '<ruby><ruby class="zhuyin">友<rt>ㄧㄨˋ</rt></ruby><rt>iú</rt></ruby>'
    + '，'
    + '<ruby><ruby class="zhuyin">伊<rt>ㄧ</rt></ruby><rt>i</rt></ruby>',
  )
})

test('<rb> containing CJK (normal) + extra rtc', () => {
  const body = setup(
    '<p><ruby><rb>漢</rb><rb>字</rb>'
    + '<rtc class="zhuyin"><rt>ㄏㄢˋ</rt><rt>ㄗˋ</rt></rtc>'
    + '<rtc class="romanization"><rt rbspan="2">hànzì</rt></rtc>'
    + '</ruby></p>',
  )
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML,
    '<ruby>'
    + '<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby>'
    + '<ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>'
    + '<rt>hànzì</rt>'
    + '</ruby>',
  )
})

test('CJK outside <rb> + extra rtc — segment boundary respected', () => {
  const body = setup(
    '<p><ruby><rb>漢</rb>文<rb>字</rb>'
    + '<rtc class="zhuyin"><rt>ㄏㄢˋ</rt><rt>ㄗˋ</rt></rtc>'
    + '<rtc class="romanization"><rt>hàn</rt><rt>zì</rt></rtc>'
    + '</ruby></p>',
  )
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML,
    '<ruby><ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby><rt>hàn</rt></ruby>'
    + '文'
    + '<ruby><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby><rt>zì</rt></ruby>',
  )
})

// ─── Text outside <rb> is preserved ───────────────────────────────────

test('embedded punctuation between <rb>s is lifted out flush', () => {
  const body = setup(
    '<p><ruby class="zhuyin"><rb>漢</rb>，<rb>字</rb><rtc><rt>ㄏㄢˋ</rt><rt>ㄗˋ</rt></rtc></ruby></p>',
  )
  transpileRuby(body)
  const out = body.querySelector('p')!.innerHTML
  assert.equal(out,
    '<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby>'
    + '，'
    + '<ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>',
  )
  assert.doesNotMatch(out, /<\/ruby>\s+，/)
  assert.doesNotMatch(out, /，\s+<ruby/)
})

test('multiple embedded texts produce multiple segments', () => {
  const body = setup(
    '<p><ruby class="zhuyin"><rb>一</rb><rb>樣</rb>，<rb>親</rb><rb>像</rb>。'
    + '<rtc><rt>ㄐㄧㆵ</rt><rt>ㄧㆫ˫</rt><rt>ㄑㄧㄣ</rt><rt>ㄑㄧㆫ˫</rt></rtc></ruby></p>',
  )
  transpileRuby(body)
  const out = body.querySelector('p')!.innerHTML
  assert.match(out, /<\/ruby>，<ruby/)
  assert.match(out, /<\/ruby>。$/)
  assert.equal(body.querySelectorAll('ruby').length, 4)
})

test('non-<rb> text after the last base is preserved in output', () => {
  const body = setup(
    '<p><ruby><rb>的</rb>CD。'
    + '<rtc class="zhuyin"><rt>ê</rt></rtc>'
    + '</ruby></p>',
  )
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML,
    '<ruby class="zhuyin">的<rt>ê</rt></ruby>CD。',
  )
})

// ─── installFallbacks-first: <h-char> wrappers ─────────────────────────
// Han.css installFallbacks wraps inter-<rb> punctuation in <h-char> elements
// before transpileRuby runs. The converter must preserve the full element.

test('<h-char> wrapper between <rb>s — Form A, element preserved', () => {
  const body = setup(
    '<p><ruby class="zhuyin">'
    + '<rb>友</rb><h-char><h-layer>，</h-layer></h-char><rb>伊</rb>'
    + '<rtc><rt>ㄧㄨˋ</rt><rt>ㄧ</rt></rtc>'
    + '</ruby></p>',
  )
  transpileRuby(body)
  const out = body.querySelector('p')!.innerHTML
  assert.match(out, /<\/ruby><h-char><h-layer>，<\/h-layer><\/h-char><ruby/)
})

test('<h-char> wrapper between <rb>s — Form B dual annotation, element preserved', () => {
  const body = setup(
    '<p><ruby>'
    + '<rb>朋</rb><rb>友</rb><h-char><h-layer>，</h-layer></h-char><rb>伊</rb>'
    + '<rtc class="zhuyin"><rt>ㄅㄧㄥˊ</rt><rt>ㄧㄨˋ</rt><rt>ㄧ</rt></rtc>'
    + '<rtc class="romanization"><rt rbspan="2">pîng-iú</rt><rt>i</rt></rtc>'
    + '</ruby></p>',
  )
  transpileRuby(body)
  const out = body.querySelector('p')!.innerHTML
  assert.match(out, /<\/ruby><h-char><h-layer>，<\/h-layer><\/h-char><ruby/)
})

test('<h-char> after last <rb> — element preserved', () => {
  const body = setup(
    '<p><ruby>'
    + '<rb>的</rb><h-char><h-layer>CD。</h-layer></h-char>'
    + '<rtc class="zhuyin"><rt>ê</rt></rtc>'
    + '</ruby></p>',
  )
  transpileRuby(body)
  const out = body.querySelector('p')!.innerHTML
  assert.match(out, /<\/ruby><h-char>/)
  assert.doesNotMatch(out, /<rb>/)
})

// ─── Rule 1: zhuyin/mps extra rtc ignores rbspan ───────────────────────

test('Rule 1 — extra mps rtc rbspan=2 forced to 1 (covers only first base)', () => {
  // zhuyin rtc is primary (1:1); mps rtc is extra with rbspan=2 → treated as 1
  const body = setup(
    '<p><ruby>'
    + '<rb>漢</rb><rb>字</rb>'
    + '<rtc class="zhuyin"><rt>ㄏㄢˋ</rt><rt>ㄗˋ</rt></rtc>'
    + '<rtc class="mps"><rt rbspan="2">MPS</rt></rtc>'
    + '</ruby></p>',
  )
  transpileRuby(body)
  const out = body.querySelector('p')!.innerHTML
  // MPS annotation wraps only 漢 (rbspan forced to 1)
  assert.match(out, /<ruby><ruby class="zhuyin">漢<rt>ㄏㄢˋ<\/rt><\/ruby><rt>MPS<\/rt><\/ruby>/)
  // 字 stands alone (bare-output from mps layer)
  assert.match(out, /<ruby class="zhuyin">字<rt>ㄗˋ<\/rt><\/ruby>/)
})

test('Rule 1 — non-zhuyin extra rtc rbspan still respected', () => {
  const body = setup(
    '<p><ruby>'
    + '<rb>朋</rb><rb>友</rb>'
    + '<rtc class="zhuyin"><rt>ㄅㄧㄥˊ</rt><rt>ㄧㄨˋ</rt></rtc>'
    + '<rtc class="romanization"><rt rbspan="2">pîng-iú</rt></rtc>'
    + '</ruby></p>',
  )
  transpileRuby(body)
  const out = body.querySelector('p')!.innerHTML
  // romanization rtc rbspan=2 still groups both bases
  assert.match(out, /<ruby><ruby class="zhuyin">朋/)
  assert.match(out, /pîng-iú/)
  // both bases inside one outer wrapper
  assert.match(out, /<ruby class="zhuyin">朋.*<ruby class="zhuyin">友.*pîng-iú/s)
})

// ─── Rule 2: multi-rt zhuyin/mps ruby split ────────────────────────────

test('Rule 2 — interleaved 2-char zhuyin ruby split into 2 individual rubies', () => {
  const body = setup(
    '<p><ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt>字<rt>ㄗˋ</rt></ruby></p>',
  )
  transpileRuby(body)
  assert.equal(
    body.querySelector('p')!.innerHTML,
    '<ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt></ruby>'
    + '<ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>',
  )
})

test('Rule 2 — mps class preserved on each output ruby', () => {
  const body = setup(
    '<p><ruby class="mps">漢<rt>ㄏㄢˋ</rt>字<rt>ㄗˋ</rt></ruby></p>',
  )
  transpileRuby(body)
  const out = body.querySelector('p')!.innerHTML
  assert.match(out, /class="mps".*class="mps"/s)
  assert.doesNotMatch(out, /class="zhuyin"/)
})

test('Rule 2 — trailing non-annotated nodes preserved after split', () => {
  const body = setup(
    '<p><ruby class="zhuyin">漢<rt>ㄏㄢˋ</rt>字<rt>ㄗˋ</rt>，</ruby></p>',
  )
  transpileRuby(body)
  const out = body.querySelector('p')!.innerHTML
  assert.match(out, /<ruby class="zhuyin">字<rt>ㄗˋ<\/rt><\/ruby>，$/)
})

test('Rule 2 — lang and id inherited to first output ruby', () => {
  const body = setup(
    '<p><ruby class="zhuyin" lang="zh-Hant" id="r1">漢<rt>ㄏㄢˋ</rt>字<rt>ㄗˋ</rt></ruby></p>',
  )
  transpileRuby(body)
  const rubies = body.querySelectorAll('ruby')
  assert.equal(rubies[0]!.getAttribute('id'), 'r1')
  assert.equal(rubies[0]!.getAttribute('lang'), 'zh-Hant')
  assert.equal(rubies[1]!.getAttribute('id'), null)
  assert.equal(rubies[1]!.getAttribute('lang'), 'zh-Hant')
})

test('Rule 2 — single-rt zhuyin ruby left untouched', () => {
  const body = setup('<p><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby></p>')
  const before = body.querySelector('p')!.innerHTML
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML, before)
})

test('Rule 2 — concatenated form (empty pendingBase) silently skips orphaned rt', () => {
  // 漢字 as one text node, then two rts → first rt pairs with 漢字, second rt is orphaned
  const body = setup(
    '<p><ruby class="zhuyin">漢字<rt>ㄏㄢˋ</rt><rt>ㄗˋ</rt></ruby></p>',
  )
  transpileRuby(body)
  const out = body.querySelector('p')!.innerHTML
  // One ruby produced (漢字 + first rt), second rt silently dropped
  assert.equal(body.querySelectorAll('ruby').length, 1)
  assert.match(out, /漢字<rt>ㄏㄢˋ<\/rt>/)
  assert.doesNotMatch(out, /ㄗˋ/)
})

// ─── Idempotency ───────────────────────────────────────────────────────

test('single-base ruby already in the interop form (no <rb>/<rtc>) is left untouched', () => {
  const body = setup('<p><ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby></p>')
  const before = body.querySelector('p')!.innerHTML
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML, before)
})

test('running the converter twice yields the same output', () => {
  const body = setup(
    '<p><ruby class="zhuyin"><rb>漢</rb><rb>字</rb><rtc><rt>ㄏㄢˋ</rt><rt>ㄗˋ</rt></rtc></ruby></p>',
  )
  transpileRuby(body)
  const first = body.querySelector('p')!.innerHTML
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML, first)
})

// ─── Attribute inheritance ─────────────────────────────────────────────

test('lang is copied to every output ruby; id only to the first', () => {
  const body = setup(
    '<p><ruby class="zhuyin" lang="zh-Hant" id="r1"><rb>漢</rb><rb>字</rb>'
    + '<rtc><rt>ㄏㄢˋ</rt><rt>ㄗˋ</rt></rtc></ruby></p>',
  )
  transpileRuby(body)
  const rubies = body.querySelectorAll('ruby')
  assert.equal(rubies.length, 2)
  assert.equal(rubies[0]!.getAttribute('lang'), 'zh-Hant')
  assert.equal(rubies[1]!.getAttribute('lang'), 'zh-Hant')
  assert.equal(rubies[0]!.getAttribute('id'), 'r1')
  assert.equal(rubies[1]!.getAttribute('id'), null)
})

test('<rtc lang="…"> is propagated onto the outer rt', () => {
  const body = setup(
    '<p><ruby><rb>朋</rb><rb>友</rb>'
    + '<rtc class="zhuyin"><rt>ㄆㄥˊ</rt><rt>ㄧㄡˇ</rt></rtc>'
    + '<rtc class="romanization" lang="cmn-Latn"><rt rbspan="2">péngyǒu</rt></rtc>'
    + '</ruby></p>',
  )
  transpileRuby(body)
  const outerRt = body.querySelector('ruby > rt')!
  assert.equal(outerRt.textContent, 'péngyǒu')
  assert.equal(outerRt.getAttribute('lang'), 'cmn-Latn')
})

// ─── Selector: only <rb> + <rtc> together ──────────────────────────────

test('<ruby> with only <rb> (no <rtc>) is left untouched', () => {
  const body = setup('<p><ruby><rb>字</rb><rt>zì</rt></ruby></p>')
  const before = body.querySelector('p')!.innerHTML
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML, before)
})

test('<ruby> with only <rtc> (no <rb>) is left untouched', () => {
  const body = setup('<p><ruby>字<rtc class="zhuyin"><rt>ㄗˋ</rt></rtc></ruby></p>')
  const before = body.querySelector('p')!.innerHTML
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML, before)
})

// ─── Throw on structural errors ────────────────────────────────────────

test('rbspan total > base count throws', () => {
  const body = setup(
    '<p><ruby><rb>漢</rb><rb>字</rb>'
    + '<rtc class="zhuyin"><rt>ㄏㄢˋ</rt><rt>ㄗˋ</rt></rtc>'
    + '<rtc class="romanization"><rt rbspan="3">hànzì</rt></rtc>'
    + '</ruby></p>',
  )
  assert.throws(() => transpileRuby(body), /rbspan total \(3\) ≠ base count \(2\)/)
})

test('rbspan total < base count — remaining bases are bare-output', () => {
  const body = setup(
    '<p><ruby><rb>朋</rb><rb>友</rb><rb>好</rb>'
    + '<rtc class="zhuyin"><rt>ㄆㄥˊ</rt><rt>ㄧㄡˇ</rt><rt>ㄏㄠˇ</rt></rtc>'
    + '<rtc class="romanization"><rt rbspan="2">péngyǒu</rt></rtc>'
    + '</ruby></p>',
  )
  assert.doesNotThrow(() => transpileRuby(body))
  const out = body.querySelector('p')!.innerHTML
  // 好 is bare-output (wrapped in outer ruby without an extra rt)
  assert.match(out, /<ruby class="zhuyin">好<rt>ㄏㄠˇ<\/rt><\/ruby>/)
})

test('zhuyin <rt> count ≠ <rb> count — warns and leaves ruby unconverted', () => {
  const body = setup(
    '<p><ruby><rb>漢</rb><rb>字</rb><rb>好</rb>'
    + '<rtc class="zhuyin"><rt>ㄏㄢˋ</rt><rt>ㄗˋ</rt></rtc>'
    + '</ruby></p>',
  )
  const warned: string[] = []
  const orig = console.warn
  console.warn = (msg: string) => warned.push(msg)
  try {
    assert.doesNotThrow(() => transpileRuby(body))
    assert.equal(warned.length, 1)
    assert.match(warned[0]!, /3 <rb> base\(s\) but 2 primary/)
    // ruby left unconverted — still has <rb> children
    assert.ok(body.querySelector('ruby > rb'), 'ruby should remain unconverted')
  } finally {
    console.warn = orig
  }
})

test('rbspan crossing a segment boundary — warns and leaves ruby unconverted', () => {
  const body = setup(
    '<p><ruby><rb>一</rb><rb>樣</rb>，<rb>親</rb><rb>像</rb>'
    + '<rtc class="zhuyin"><rt>ㄐㄧㆵ</rt><rt>ㄧㆫ˫</rt><rt>ㄑㄧㄣ</rt><rt>ㄑㄧㆫ˫</rt></rtc>'
    + '<rtc class="romanization"><rt rbspan="1">it</rt><rt rbspan="2">iūnn-tshin</rt><rt rbspan="1">siūnn</rt></rtc>'
    + '</ruby></p>',
  )
  const warned: string[] = []
  const orig = console.warn
  console.warn = (msg: string) => warned.push(msg)
  try {
    assert.doesNotThrow(() => transpileRuby(body))
    assert.equal(warned.length, 1)
    assert.match(warned[0]!, /rbspan crosses.*segment boundary/)
    assert.ok(body.querySelector('ruby > rb'), 'ruby should remain unconverted')
  } finally {
    console.warn = orig
  }
})

test('rbspan = 0 discards the <rt>; remaining bases are bare-output', () => {
  const body = setup(
    '<p><ruby><rb>漢</rb><rb>字</rb>'
    + '<rtc class="zhuyin"><rt>ㄏㄢˋ</rt><rt>ㄗˋ</rt></rtc>'
    + '<rtc class="romanization"><rt rbspan="0">ignored</rt><rt rbspan="1">zì</rt></rtc>'
    + '</ruby></p>',
  )
  assert.doesNotThrow(() => transpileRuby(body))
  const out = body.querySelector('p')!.innerHTML
  // rbspan=0 rt is dropped (no slot consumed); zì (rbspan=1) covers base 0 (漢); 字 is bare
  assert.match(out, /<ruby><ruby class="zhuyin">漢<rt>ㄏㄢˋ<\/rt><\/ruby><rt>zì<\/rt><\/ruby>/)
  assert.match(out, /<ruby class="zhuyin">字<rt>ㄗˋ<\/rt><\/ruby>/)
})

// ─── Defensive paths ───────────────────────────────────────────────────

test('non-Zhuyin <ruby> (no class, no rb/rtc) is left untouched', () => {
  const body = setup('<p><ruby>字<rt>zì</rt></ruby></p>')
  const before = body.querySelector('p')!.innerHTML
  transpileRuby(body)
  assert.equal(body.querySelector('p')!.innerHTML, before)
})

// ─── String / Hype interface ───────────────────────────────────────────

test('string input — returns Hype', () => {
  const out = transpileRuby(
    '<ruby class="zhuyin"><rb>漢</rb><rb>字</rb><rtc><rt>ㄏㄢˋ</rt><rt>ㄗˋ</rt></rtc></ruby>',
  )
  assert.match(html(out),
    /<ruby class="zhuyin">漢<rt>ㄏㄢˋ<\/rt><\/ruby><ruby class="zhuyin">字<rt>ㄗˋ<\/rt><\/ruby>/,
  )
})
