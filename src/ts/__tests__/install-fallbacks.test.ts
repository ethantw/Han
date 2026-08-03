import { test } from 'node:test'
import assert from 'node:assert/strict'
import { html } from 'hyperly/fp'
import {
  installFallbacks,
  uninstallFallbacks,
} from '../fallbacks.ts'
import { applyISSWithProbe } from '../line-adjustments/iss.ts'

/* `installFallbacks` has two execution modes; this file exercises the
 * Node SSR path (no `document` global) where it accepts a Hyperly
 * source, runs every transform unconditionally, and returns a `Hype`.
 * The browser-side cascade-var + CSS.supports downgrade matrix is
 * covered by tests/e2e (real engine, real getComputedStyle). */

test('SSR: string in → Hype out; combined refinePunctuation shape applied', () => {
  const result = html(installFallbacks('<p>句子。</p>'))
  assert.equal(
    result,
    '<p>句子'
      + '<h-char data-punct="end hangable"><h-layer>。</h-layer></h-char>'
      + '</p>',
  )
})

test('SSR: opening + closing brackets compress, sentence-final period gets combined shape', () => {
  // Verifies that auto mode is what runs in SSR — bd-* classes plus
  // hangable on the final period.
  const result = html(installFallbacks('<p>「漢字」。</p>'))
  assert.equal(
    result,
    '<p>'
      + '<h-char data-punct="open">「</h-char>'
      + '漢字'
      + '<h-char data-punct="close end consecutive" data-consecutive-pos="start">」</h-char>'
      + '<h-char data-punct="end consecutive hangable" data-consecutive-pos="end"><h-layer>。</h-layer></h-char>'
      + '</p>',
  )
})

test('SSR: zhuyin ruby is left as native <ruby> — CSS handles rendering', () => {
  // transformZhuyinRuby is no longer called by installFallbacks; zhuyin
  // rendering is handled by CSS (font GPOS + @supports fallback).
  // SSR output should preserve the original <ruby class="zhuyin"> intact.
  const result = html(installFallbacks('<ruby class="zhuyin">字<rt>ㄗˋ</rt></ruby>'))
  assert.match(result, /<ruby[^>]+class="zhuyin"/)
  assert.doesNotMatch(result, /<h-ruby/)
  assert.doesNotMatch(result, /<h-tone>/)
})

test('SSR: idempotent — second pass on already-rendered output is byte-identical', () => {
  const once = html(installFallbacks('<p>「字」。</p>'))
  const twice = html(installFallbacks(once))
  assert.equal(twice, once)
})

test('SSR: no source throws (clear contract)', () => {
  // The browser branch defaults `root` to `document.body`; the Node
  // branch has no equivalent, so make the missing-arg case explicit.
  assert.throws(() => (installFallbacks as () => unknown)(), /requires an explicit source/)
})

test('SSR: happy-dom Element source mutates in place', async () => {
  const { Window } = await import('happy-dom')
  const win = new Window()
  win.document.body.innerHTML = '<p>句。</p>'
  const p = win.document.body.querySelector('p')!
  installFallbacks(p as unknown as Element)
  assert.equal(
    p.innerHTML,
    '句<h-char data-punct="end hangable"><h-layer>。</h-layer></h-char>',
  )
})

test('uninstallFallbacks: unwraps <h-char> back to original text', async () => {
  const { Window } = await import('happy-dom')
  const win = new Window()
  win.document.body.innerHTML = '<p>句。</p>'
  const body = win.document.body as unknown as Element

  installFallbacks(body)
  assert.match(body.querySelector('p')!.innerHTML, /h-char/)

  uninstallFallbacks(body)
  assert.equal(body.querySelector('p')!.innerHTML, '句。')
})

test('uninstallFallbacks: removes <h-iss> (insert mode) without restoring a space', async () => {
  const { Window } = await import('happy-dom')
  const win = new Window()
  win.document.body.innerHTML = '<p>字A</p>'
  const body = win.document.body as unknown as Element

  installFallbacks(body)
  assert.match(body.querySelector('p')!.innerHTML, /h-iss/)

  uninstallFallbacks(body)
  assert.equal(body.querySelector('p')!.innerHTML, '字A')
})

test('uninstallFallbacks: replaces <h-iss data-mode="replace"> with U+0020', async () => {
  const { Window } = await import('happy-dom')
  const win = new Window()
  win.document.body.innerHTML = '<p>字 A</p>'
  const body = win.document.body as unknown as Element

  installFallbacks(body)
  assert.match(body.querySelector('p')!.innerHTML, /data-mode="replace"/)

  uninstallFallbacks(body)
  assert.equal(body.querySelector('p')!.innerHTML, '字 A')
})

test('uninstallFallbacks: removes [data-followed-by-adjacent-line] attribute', async () => {
  const { Window } = await import('happy-dom')
  const win = new Window()
  win.document.body.innerHTML = '<p><u>a</u><u>b</u></p>'
  const body = win.document.body as unknown as Element

  installFallbacks(body)
  assert.ok(body.querySelector('[data-followed-by-adjacent-line]') !== null)

  uninstallFallbacks(body)
  assert.equal(body.querySelector('[data-followed-by-adjacent-line]'), null)
})

test('uninstallFallbacks: SSR + no root throws (clear contract)', () => {
  assert.throws(
    () => (uninstallFallbacks as () => unknown)(),
    /requires an explicit source/,
  )
})

/* ────────────────────────────────────────────────────────── */
/* Browser path — `document` + `CSS` globals defined.         */
/*                                                            */
/* `root` defaults to `document.documentElement` when omitted */
/* and `refinePunctuation` / `applyISSWithProbe` /            */
/* `markAdjacentLines` run on a live DOM. Cleans up globals   */
/* in `finally` so subsequent tests stay deterministic.       */
/* ────────────────────────────────────────────────────────── */

const withBrowserGlobals = async (
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

test('Browser: installFallbacks(root) mutates in place and returns Hype', async () => {
  const { win, teardown } = await withBrowserGlobals()
  try {
    win.document.body.innerHTML = '<p>句。</p>'
    const p = win.document.body.querySelector('p')! as unknown as Element
    const result = installFallbacks(p)
    assert.match(
      (p as any as HTMLElement).innerHTML,
      /<h-char data-punct="end hangable">/,
    )
    // `installFallbacks` returns a Hype wrapping the live element.
    assert.match(html(result), /<h-char data-punct="end hangable">/)
  } finally {
    teardown()
  }
})

test('Browser: installFallbacks() with no arg defaults to documentElement', async () => {
  const { win, teardown } = await withBrowserGlobals()
  try {
    win.document.body.innerHTML = '<p>句。</p>'
    installFallbacks()
    assert.match(
      (win.document.body.querySelector('p') as any).innerHTML,
      /<h-char data-punct="end hangable">/,
    )
  } finally {
    teardown()
  }
})

test('the UA probe runs clean and leaves no debris', async () => {
  const { win, teardown } = await withBrowserGlobals()
  try {
    // The probe lives inside `applyISSWithProbe` — there is no standalone
    // `runProbes()` to call. happy-dom can't lay out, so the probe reads a
    // zero delta and stamps nothing; what this locks down is that a probe run
    // is safe to call anywhere and tidies up after itself. Whether the marker
    // is ever set is a real-engine question, and the e2e suite owns it.
    applyISSWithProbe(win.document.documentElement as any)
    assert.equal(win.document.body.children.length, 0, 'probe leaked into body')
    assert.equal(
      win.document.head.querySelectorAll('style').length,
      0,
      '<style> leaked into head',
    )
  } finally {
    teardown()
  }
})
