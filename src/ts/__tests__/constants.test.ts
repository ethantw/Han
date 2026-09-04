import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  CJK_PUNCT_RUN,
  HANGABLE_PUNCT,
  PUNCT_DIVIDING_CHARS,
  PUNCT_END_EXTRA,
  PUNCT_GB_CLOSE_CHARS,
  PUNCT_GB_OPEN_CHARS,
  classifyPunctuation,
} from '../line-adjustments/punctuation.ts'

/* ─── classifyPunctuation ─────────────────────────────────────────── */

test('classifyPunctuation: opening brackets get open only', () => {
  for (const ch of '「『《〈（〔［｛【〖') {
    assert.deepEqual(classifyPunctuation(ch), ['open'], `mis-classified "${ch}"`)
  }
})

test('classifyPunctuation: closing brackets get close + end', () => {
  for (const ch of '」』》〉）〕］｝】〗') {
    assert.deepEqual(classifyPunctuation(ch), ['close', 'end'], `mis-classified "${ch}"`)
  }
})

test('classifyPunctuation: curly quotes retain their GB-only subtype', () => {
  for (const ch of PUNCT_GB_OPEN_CHARS)
    assert.deepEqual(classifyPunctuation(ch), ['gb-open'], `mis-classified "${ch}"`)
  for (const ch of PUNCT_GB_CLOSE_CHARS)
    assert.deepEqual(classifyPunctuation(ch), ['gb-close'], `mis-classified "${ch}"`)
})

test('classifyPunctuation: sentence-ending punctuation gets end only', () => {
  for (const ch of PUNCT_END_EXTRA.replaceAll(new RegExp(`[${PUNCT_DIVIDING_CHARS}]`, 'g'), '')) {
    assert.deepEqual(classifyPunctuation(ch), ['end'], `mis-classified "${ch}"`)
  }
})

test('classifyPunctuation: GB dividing marks get end + dividing', () => {
  for (const ch of PUNCT_DIVIDING_CHARS) {
    assert.deepEqual(classifyPunctuation(ch), ['end', 'dividing'], `mis-classified "${ch}"`)
  }
})

test('classifyPunctuation: middle marks fall through to middle', () => {
  for (const ch of '·＼／－゠＆・＿') {
    assert.deepEqual(classifyPunctuation(ch), ['middle'], `mis-classified "${ch}"`)
  }
})

test('classifyPunctuation: non-biaodian char returns empty array (callers gate by regex)', () => {
  // The function is only ever called on chars CJK_PUNCT_RUN matched,
  // so a fall-through for non-biaodian is undefined — but if a caller
  // passes a Han character anyway, it should not throw and should
  // return a stable label.
  assert.deepEqual(classifyPunctuation('字'), [])
})

test('classifyPunctuation: edge case empty string returns empty array safely', () => {
  assert.deepEqual(classifyPunctuation(''), [])
})

/* ─── CJK_PUNCT_RUN ──────────────────────────────────────── */

test('CJK_PUNCT_RUN matches isolated biaodian', () => {
  const matches = '字「漢」'.match(CJK_PUNCT_RUN)
  assert.deepEqual(matches, ['「', '」'])
})

test('CJK_PUNCT_RUN matches consecutive biaodian as one run', () => {
  const matches = '字」、「他'.match(CJK_PUNCT_RUN)
  assert.deepEqual(matches, ['」、「'])
})

test('CJK_PUNCT_RUN matches nothing in Latin-only input', () => {
  assert.equal('Hello, world.'.match(CJK_PUNCT_RUN), null)
})

test('CJK_PUNCT_RUN handles mixed Latin/CJK gracefully', () => {
  const matches = 'This「字」is mixed。'.match(CJK_PUNCT_RUN)
  assert.deepEqual(matches, ['「', '」', '。'])
})

test('CJK_PUNCT_RUN handles full-width nested quotes as runs', () => {
  const matches = '他說：『「快跑！」』這樣。'.match(CJK_PUNCT_RUN)
  // ：『「 is one continuous run, ！」』 is another run, 。 is the final run.
  assert.deepEqual(matches, ['：『「', '！」』', '。'])
})

test('CJK_PUNCT_RUN includes GB fullwidth curly quotes in the same run', () => {
  assert.deepEqual('“‘字’”'.match(CJK_PUNCT_RUN), ['“‘', '’”'])
})

test('CJK_PUNCT_RUN survives stateful regex re-use (sticky lastIndex)', () => {
  // Bug guard: the regex carries `g` flag, so .test() / .exec() on
  // the same instance shifts lastIndex. consumers using .match()
  // (non-global semantics on the source string) should always reset
  // implicitly, but make the invariant explicit here.
  CJK_PUNCT_RUN.lastIndex = 0
  const first = CJK_PUNCT_RUN.exec('「字」')
  assert.equal(first?.[0], '「')
  CJK_PUNCT_RUN.lastIndex = 0
  const restarted = CJK_PUNCT_RUN.exec('「字」')
  assert.equal(restarted?.[0], '「')
})

/* ─── HANGABLE_PUNCT ─────────────────────────────────────── */

test('HANGABLE_PUNCT matches a sentence-final 。', () => {
  HANGABLE_PUNCT.lastIndex = 0
  const m = '完成。'.match(HANGABLE_PUNCT)
  assert.deepEqual(m, ['。'])
})

test('HANGABLE_PUNCT does NOT match 。 followed by closing bracket (no double-hang)', () => {
  // 完成。」 — the 。 is followed by a closing bracket so it should
  // not be flagged as hangable.
  HANGABLE_PUNCT.lastIndex = 0
  const m = '完成。」'.match(HANGABLE_PUNCT)
  assert.equal(m, null)
})

test('HANGABLE_PUNCT matches the comma 、 in mid-sentence position', () => {
  HANGABLE_PUNCT.lastIndex = 0
  const m = '甲、乙、丙'.match(HANGABLE_PUNCT)
  assert.deepEqual(m, ['、', '、'])
})

test('HANGABLE_PUNCT skips 、 followed by another sentence-end mark', () => {
  // 甲、。 — the 、 sits before 。 (a sentence-end mark) so it
  // should not hang.
  HANGABLE_PUNCT.lastIndex = 0
  const m = '甲、。'.match(HANGABLE_PUNCT)
  assert.deepEqual(m, ['。'])
})
