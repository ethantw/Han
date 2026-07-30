import test from 'node:test'
import assert from 'node:assert/strict'

import { reset } from '../public/home/lead-forme.js'

/**
 * § reset — which pieces a punctuation swap lifts.
 *
 * The rule, from the owner: a line whose SPACING moved is re-set whole; a line
 * that stands has only its punctuation lifted, since only those slugs are
 * re-cut by the new convention. Indices are into the cell arrays, which are in
 * generation = paint = DOM order.
 */

const cell = (line, x, char) => ({ line, O: [x, 0], sx: 90, sy: 90, char })

test('a line that stands lifts its punctuation and nothing else', () => {
  const before = [cell(0, 0, '山'), cell(0, 90, '，'), cell(0, 180, '田')]
  const after = [cell(0, 0, '山'), cell(0, 90, '，'), cell(0, 180, '田')]
  assert.deepEqual(reset(before, after), { out: [1], back: [1] })
})

test('a line whose spacing moved is re-set whole', () => {
  const before = [cell(0, 0, '山'), cell(0, 90, '，'), cell(0, 180, '田')]
  // the squeeze shifts everything after it — same pieces, new places
  const after = [cell(0, 0, '山'), cell(0, 90, '，'), cell(0, 135, '田')]
  assert.deepEqual(reset(before, after), { out: [0, 1, 2], back: [0, 1, 2] })
})

test('a line that gains a justify block is re-set whole, indices realigned', () => {
  const before = [cell(0, 0, '：'), cell(0, 90, '「')]
  const after = [cell(0, 0, '：'), cell(0, 45, '「'), cell(0, 90, undefined)]
  assert.deepEqual(reset(before, after), { out: [0, 1], back: [0, 1, 2] })
})

test('lines are independent — one re-spaced does not disturb its neighbour', () => {
  const before = [cell(0, 0, '：'), cell(0, 90, '「'), cell(1, 200, '，'), cell(1, 290, '田')]
  const after = [cell(0, 0, '：'), cell(0, 45, '「'), cell(1, 200, '，'), cell(1, 290, '田')]
  const { out, back } = reset(before, after)
  // line 0 whole; line 1 keeps its place, so only its 、 comes out
  assert.deepEqual(out.sort(), [0, 1, 2])
  assert.deepEqual(back.sort(), [0, 1, 2])
})

test('行距鉛條 stays put while the line it separates is re-laid', () => {
  const before = [cell(0, 0, '：'), cell(0, 90, '「'), { line: 'lead0', O: [95, 0], sx: 60, sy: 900 }]
  const after = [cell(0, 0, '：'), cell(0, 45, '「'), { line: 'lead0', O: [95, 0], sx: 60, sy: 900 }]
  const { out, back } = reset(before, after)
  assert.ok(!out.includes(2), 'the strip is furniture between lines, not part of one')
  assert.ok(!back.includes(2))
})

test('nothing moves when the two builds are identical but for the face', () => {
  // 橫排 squeezes under every convention, so a swap there is font-only: the
  // punctuation is re-cut, everything else is the same lead in the same place.
  const before = [cell(0, 0, '山'), cell(0, 90, '田'), cell(1, 200, '青')]
  const after = [cell(0, 0, '山'), cell(0, 90, '田'), cell(1, 200, '青')]
  assert.deepEqual(reset(before, after), { out: [], back: [] })
})
