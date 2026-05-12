import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectAutospaceBoundaryBug } from '../helpers/probes.ts'

/* ────────────────────────────────────────────────────────── */
/* `detectAutospaceBoundaryBug`                         */
/*                                                            */
/* The probe lays out two strings under `text-autospace:      */
/* normal` — bare ("A中") vs. seam-wrapped ("A<i></i>中") —   */
/* and compares widths. Engines that propagate autospace      */
/* through inline boundaries (Chromium, Gecko) render both    */
/* the same; Safari (as of 26.x) only spaces the bare run.    */
/*                                                            */
/* These unit tests can't observe the bug itself — happy-dom  */
/* doesn't lay out — so we lock down the *contract*: SSR-     */
/* safe, no `text-autospace` support → false, no DOM debris,  */
/* memoised. End-to-end behaviour lives in tests/e2e.         */
/* ────────────────────────────────────────────────────────── */

test('returns false when document is undefined (SSR / non-browser)', () => {
  const savedDoc = (globalThis as Record<string, unknown>).document
  delete (globalThis as Record<string, unknown>).document
  try {
    assert.equal(detectAutospaceBoundaryBug(true), false)
  } finally {
    if (savedDoc !== undefined) (globalThis as Record<string, unknown>).document = savedDoc
  }
})

test('returns false when CSS.supports("text-autospace", "normal") is false', async () => {
  const { Window } = await import('happy-dom')
  const win = new Window()
  ;(globalThis as Record<string, unknown>).document = win.document
  ;(globalThis as Record<string, unknown>).CSS = { supports: () => false }
  try {
    assert.equal(detectAutospaceBoundaryBug(true), false)
  } finally {
    delete (globalThis as Record<string, unknown>).document
    delete (globalThis as Record<string, unknown>).CSS
  }
})

test('removes the probe element from the document after running', async () => {
  const { Window } = await import('happy-dom')
  const win = new Window()
  ;(globalThis as Record<string, unknown>).document = win.document
  ;(globalThis as Record<string, unknown>).CSS = { supports: () => true }
  try {
    detectAutospaceBoundaryBug(true)
    assert.equal(win.document.body.children.length, 0, 'probe leaked into DOM')
  } finally {
    delete (globalThis as Record<string, unknown>).document
    delete (globalThis as Record<string, unknown>).CSS
  }
})

test('memoises the result across calls (no force flag)', async () => {
  const { Window } = await import('happy-dom')
  const win = new Window()
  ;(globalThis as Record<string, unknown>).document = win.document
  let supportsCalls = 0
  ;(globalThis as Record<string, unknown>).CSS = {
    supports: () => { supportsCalls++; return false },
  }
  try {
    // Force first call to populate cache, then call without force.
    detectAutospaceBoundaryBug(true)
    const before = supportsCalls
    detectAutospaceBoundaryBug()
    detectAutospaceBoundaryBug()
    assert.equal(supportsCalls, before, 'CSS.supports re-invoked after cache populated')
  } finally {
    delete (globalThis as Record<string, unknown>).document
    delete (globalThis as Record<string, unknown>).CSS
  }
})
