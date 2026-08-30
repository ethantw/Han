import test from 'node:test'
import assert from 'node:assert/strict'

import {
  clampLensCenter,
  clampToBounds,
  cloneTransform,
  createLensState,
  cycleLens,
  restingPoint,
} from '../public/home/lens-state.js'

test('fine-pointer aperture cycles small, large, closed, small', () => {
  const small = createLensState(true)
  const large = cycleLens(small)
  const closed = cycleLens(large)
  const reopened = cycleLens(closed)
  assert.deepEqual([small.on, small.wide], [true, false])
  assert.deepEqual([large.on, large.wide], [true, true])
  assert.deepEqual([closed.on, closed.wide], [false, false])
  assert.deepEqual([reopened.on, reopened.wide], [true, false])
})

test('sampling and painted centres use separate clamps', () => {
  assert.deepEqual(clampToBounds([-20, 140], [100, 100]), [0, 100])
  assert.deepEqual(clampLensCenter([-20, 140], [100, 100], 40, 10), [10, 90])
})

test('resting and clone transforms derive from immutable geometry', () => {
  assert.deepEqual(restingPoint([10, 20, 1, 1], 40, 2, [100, 100]), [17, 27])
  assert.equal(
    cloneTransform({
      point: [10, 90], bounds: [100, 100], lensSize: 40, zoom: 2, scroll: [5, 0],
    }),
    'translate(-10px, -160px) scale(2)',
  )
})
