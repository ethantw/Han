import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import {
  markAdjacentLines,
  markAdjacentLinesWithMode,
  markAdjacentLinesWithSelectors,
  setDecorationInsetMode,
} from '../semantics/adjacent-lines.ts'

const setup = (html: string) => {
  const win = new Window()
  win.document.body.innerHTML = html
  return win.document.body as unknown as Element
}

test('two adjacent <u> siblings: the first is marked data-followed-by-adjacent-line', () => {
  const body = setup('<p><u>a</u><u>b</u></p>')
  markAdjacentLines(body)
  const us = body.querySelectorAll('u')
  assert.equal(us[0]!.hasAttribute('data-followed-by-adjacent-line'), true)
  assert.equal(us[1]!.hasAttribute('data-followed-by-adjacent-line'), false)
})

test('lone <u> is not marked', () => {
  const body = setup('<p><u>a</u></p>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), false)
})

test('three adjacent <u>: first two marked, last is not', () => {
  const body = setup('<p><u>a</u><u>b</u><u>c</u></p>')
  markAdjacentLines(body)
  const us = [...body.querySelectorAll('u')]
  assert.deepEqual(
    us.map(el => el.hasAttribute('data-followed-by-adjacent-line')),
    [true, true, false],
  )
})

test('<u> followed by <s> (different family) is not marked', () => {
  const body = setup('<p><u>a</u><s>b</s></p>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), false)
  assert.equal(body.querySelector('s')!.hasAttribute('data-followed-by-adjacent-line'), false)
})

test('<wbr> between two <u>s does not break adjacency', () => {
  const body = setup('<p><u>a</u><wbr><u>b</u></p>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

test('HTML comment between two <u>s does not break adjacency', () => {
  const body = setup('<p><u>a</u><!-- note --><u>b</u></p>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

test('text between two <u>s breaks adjacency', () => {
  const body = setup('<p><u>a</u> <u>b</u></p>')
  markAdjacentLines(body)
  const us = body.querySelectorAll('u')
  assert.equal(us[0]!.hasAttribute('data-followed-by-adjacent-line'), false)
})

test('s and del are treated as the same family', () => {
  const body = setup('<p><s>a</s><del>b</del></p>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('s')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

test('ins and u are treated as the same family', () => {
  const body = setup('<p><ins>a</ins><u>b</u></p>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('ins')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

// ── A: next sibling is a wrapper whose first real child is same-family ─────

test('<u> followed by <em><u></em>: marked (wrapper descent)', () => {
  const body = setup('<u>xxx</u><em><u>yyy</u>zzz</em>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

test('<u> followed by <strong><u></strong>: marked', () => {
  const body = setup('<u>xxx</u><strong><u>yyy</u></strong>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

test('<u> followed by <em><strong><u></strong></em> (deep wrapper): marked', () => {
  const body = setup('<u>xxx</u><em><strong><u>yyy</u></strong></em>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

test('<u> followed by <em> whose first child is a comment then <u>: marked', () => {
  const body = setup('<u>xxx</u><em><!-- c --><u>yyy</u></em>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

test('<u> followed by <em> whose first child is <wbr> then <u>: marked', () => {
  const body = setup('<u>xxx</u><em><wbr><u>yyy</u></em>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

test('<wbr> then <em><u>: marked (wbr skipped, then descent)', () => {
  const body = setup('<u>xxx</u><wbr><em><u>yyy</u></em>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

test('<u> followed by <em> whose first child is text: NOT marked', () => {
  const body = setup('<u>xxx</u><em>yyy<u>zzz</u></em>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), false)
})

test('<u> followed by wrapper whose first child is a different-family element: NOT marked', () => {
  const body = setup('<u>xxx</u><em><s>yyy</s></em>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), false)
})

// ── B: <u> is the last visible child of its parent — climb up ─────────────

test('<p><u>a</u></p><p><u>b</u></p>: u#1 marked (climb p, descend second p)', () => {
  const body = setup('<p><u>ends</u></p><p><u>starts</u></p>')
  markAdjacentLines(body)
  const us = body.querySelectorAll('u')
  assert.equal(us[0]!.hasAttribute('data-followed-by-adjacent-line'), true)
  assert.equal(us[1]!.hasAttribute('data-followed-by-adjacent-line'), false)
})

test('<p><u>a</u></p><p>text<u>b</u></p>: NOT marked (second p starts with text)', () => {
  const body = setup('<p><u>ends</u></p><p>aa<u>starts</u></p>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), false)
})

test('<p><u>a</u></p> <p><u>b</u></p>: NOT marked (text node between p elements)', () => {
  const body = setup('<p><u>ends</u></p> <p><u>starts</u></p>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), false)
})

test('<u>a</u><p><u>b</u></p>: marked (p as wrapper, descent)', () => {
  const body = setup('<u>a</u><p><u>b</u></p>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

test('<p><u>a</u></p><u>b</u>: marked (climb p, direct sibling u)', () => {
  const body = setup('<p><u>a</u></p><u>b</u>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

test('<em><u>a</u></em><u>b</u>: marked (climb em)', () => {
  const body = setup('<em><u>a</u></em><u>b</u>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

test('<p><u>a</u></p> <u>b</u>: NOT marked (text node between p and u)', () => {
  const body = setup('<p><u>a</u></p> <u>b</u>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), false)
})

test('<section><p><u>a</u></p></section><p><u>b</u></p>: marked (multi-level climb)', () => {
  const body = setup('<section><p><u>a</u></p></section><p><u>b</u></p>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

// ── DecorationInsetMode ───────────────────────────────────────────────────────

test('markAdjacentLinesWithMode("0") is a no-op — class never added', () => {
  const body = setup('<u>a</u><u>b</u>')
  markAdjacentLinesWithMode('0')(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), false)
})

test('markAdjacentLinesWithMode("auto") adds attribute (no CSS.supports in test env)', () => {
  const body = setup('<u>a</u><u>b</u>')
  markAdjacentLinesWithMode('auto')(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

test('setDecorationInsetMode("0") sets --han-text-decoration-inset: 0 inline', () => {
  const body = setup('<p></p>')
  setDecorationInsetMode('0')(body)
  assert.equal(
    (body as unknown as HTMLElement).style.getPropertyValue('--han-text-decoration-inset'),
    '0',
  )
})

test('setDecorationInsetMode("auto") sets --han-text-decoration-inset: auto inline', () => {
  const body = setup('<p></p>')
  setDecorationInsetMode('auto')(body)
  assert.equal(
    (body as unknown as HTMLElement).style.getPropertyValue('--han-text-decoration-inset'),
    'auto',
  )
})

/* ─── single call shape ───────────────────────────────────
 * 2026-05-08: the polymorphic overload `markAdjacentLines(selectors)(src)`
 * was removed. Callers wanting custom selectors use
 * `markAdjacentLinesWithSelectors` directly.
 */

test('markAdjacentLines(src): cascade-dispatched, marks underline-family', () => {
  const body = setup('<p><u>a</u><u>b</u></p>')
  markAdjacentLines(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

test('markAdjacentLinesWithSelectors(["u, ins"])(src): explicit selectors, bypasses cascade', () => {
  const body = setup('<p><u>a</u><u>b</u></p>')
  markAdjacentLinesWithSelectors(['u, ins'])(body)
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

/* ─── cascade-write: browser path ────────────────────────── */
/* `markAdjacentLinesWithMode(mode)` syncs --han-text-decoration-inset
 * to inline style on `src` (browser only). SSR skips the write. */

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

test('browser: markAdjacentLinesWithMode("auto") sets --han-text-decoration-inset on src', async () => {
  const { win, teardown } = await withBrowserGlobals()
  try {
    win.document.body.innerHTML = '<article><u>a</u><u>b</u></article>'
    const article = win.document.querySelector('article')! as unknown as HTMLElement
    markAdjacentLinesWithMode('auto')(article as unknown as Element)
    assert.equal(article.style.getPropertyValue('--han-text-decoration-inset'), 'auto')
    assert.equal(article.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
  } finally {
    teardown()
  }
})

test('browser: markAdjacentLinesWithMode("0") sets --han-text-decoration-inset to 0 and skips marking', async () => {
  const { win, teardown } = await withBrowserGlobals()
  try {
    win.document.body.innerHTML = '<article><u>a</u><u>b</u></article>'
    const article = win.document.querySelector('article')! as unknown as HTMLElement
    markAdjacentLinesWithMode('0')(article as unknown as Element)
    assert.equal(article.style.getPropertyValue('--han-text-decoration-inset'), '0')
    assert.equal(article.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), false)
  } finally {
    teardown()
  }
})

test('SSR: markAdjacentLinesWithMode does NOT write inline cascade var', () => {
  const body = setup('<u>a</u><u>b</u>')
  markAdjacentLinesWithMode('auto')(body)
  assert.equal((body as unknown as HTMLElement).style.getPropertyValue('--han-text-decoration-inset'), '')
  assert.equal(body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'), true)
})

test('markAdjacentLines respects --han-text-decoration-inset: 0 (no class added)', () => {
  const win = new Window()
  win.document.body.innerHTML = '<u>a</u><u>b</u>'
  const body = win.document.body as unknown as HTMLElement
  body.style.setProperty('--han-text-decoration-inset', '0')
  const g = globalThis as Record<string, unknown>
  g.CSS = { supports: () => false }
  g.getComputedStyle = (el: Element) =>
    (win as unknown as Window & { getComputedStyle(el: Element): CSSStyleDeclaration })
      .getComputedStyle(el)
  try {
    markAdjacentLines(body as unknown as Element)
    assert.equal(
      body.querySelector('u')!.hasAttribute('data-followed-by-adjacent-line'),
      false,
    )
  } finally {
    delete g.CSS
    delete g.getComputedStyle
  }
})
