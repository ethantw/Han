import { test } from 'node:test'
import assert from 'node:assert/strict'
import { html, replace } from 'hyperly/fp'

test('hyperly + happy-dom + node:test pipeline works', () => {
  const result = html(replace(/world/gi)('Universe')('<p>Hello World</p>'))
  assert.equal(result, '<p>Hello Universe</p>')
})
