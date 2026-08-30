import test from 'node:test'
import assert from 'node:assert/strict'

import { DEFAULTS } from '../public/home/codegen.js'
import {
  effectiveVars,
  fallbackPlan,
  fallbackRunKind,
  getConfigPath,
  sameFallbackPlan,
  setConfigPath,
} from '../public/components/console-config-state.js'

test('configuration paths are read and replaced without mutating defaults', () => {
  const next = setConfigPath(DEFAULTS, 'punct.hant', 'KLR')
  assert.equal(getConfigPath(next, 'punct.hant'), 'KLR')
  assert.equal(DEFAULTS.punct.hant, 'MOE')
  assert.notEqual(next.punct, DEFAULTS.punct)
})

test('disabled modules resolve to explicit cascade-off values', () => {
  const vars = effectiveVars({ ...DEFAULTS, semantics: false, lines: false })
  assert.equal(vars.get('--han-semantics'), 'off')
  assert.equal(vars.get('--han-text-autospace'), 'no-autospace')
  assert.equal(vars.get('--han-punctuation-refinement'), 'none')
})

test('fallback plans distinguish full DOM work from an ISS-only update', () => {
  const applied = fallbackPlan(DEFAULTS)
  const iss = fallbackPlan({ ...DEFAULTS, autospace: 'insert' })
  const full = fallbackPlan({ ...DEFAULTS, squeeze: false })

  assert.equal(fallbackRunKind(iss, applied), 'iss')
  assert.equal(fallbackRunKind(full, applied), null)
  assert.equal(fallbackRunKind(applied, full), 'full')
  assert.equal(sameFallbackPlan(applied, fallbackPlan(DEFAULTS)), true)
})
