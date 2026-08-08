import { test } from 'node:test'
import assert from 'node:assert/strict'
import { html, hype, element } from 'hyperly/fp'
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
  // 頂層的 `<p>` 帶著鄰行 pass 的「已修補」章。片段來源序列化的是合成 body 的
  // innerHTML，章蓋在 body 上就會被丟掉——所以它蓋在會被吐出來的頂層元素上
  // （fallbacks.ts § serialisedRoots）。
  assert.equal(
    result,
    '<p data-adjacent-lines-refined="">句子'
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
    '<p data-adjacent-lines-refined="">'
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

/* ─── SSR：根章必須留在序列化得到的地方 ─────────────────────────────
 * 2026-08-08 的迴歸鎖。`markAdjacentLines` 把「已修補」章蓋在來源的根上，
 * 而片段字串的根是 hyperly 合成的 `<body>`——序列化只吐它的 innerHTML，章
 * 就這樣消失，`semantics.with-js.css` 撤不掉它該撤的純 CSS skip-gap，於是
 * SSR 的版面與瀏覽器裝出來的版面差 2px（手冊的樣張頁量到的）。
 * → docs/notes/2026-08-08-ssr-string-source-loses-root-marker.md */

test('SSR: the refined stamp lands on the fragment’s own top-level element', () => {
  const out = html(installFallbacks('<main><p>句子。</p></main>'))
  assert.match(out, /^<main data-adjacent-lines-refined="">/)
})

test('SSR: every top-level element of a multi-root fragment gets the stamp', () => {
  const out = html(installFallbacks('<p>甲。</p><section><u>乙</u><u>丙</u></section>'))
  assert.match(out, /^<p data-adjacent-lines-refined="">/)
  assert.match(out, /<section data-adjacent-lines-refined="">/)
})

test('SSR: the library’s own wrappers are never mistaken for author roots', () => {
  // 純文字片段：標點 pass 之後唯一的頂層元素是 `<h-char>`。蓋章在它身上會宣稱
  // 一顆生成的行內 wrapper 是作者的容器，而它裡面永遠不可能有 <u>／<cite>。
  const out = html(installFallbacks('甲乙，丙'))
  assert.doesNotMatch(out, /data-adjacent-lines-refined/)
})

test('SSR: fragment output ≡ Element output, container aside', () => {
  // 真正的迴歸鎖：未來任何一顆「蓋在根上但沒被序列化」的東西都會在這裡現形，
  // 而不是等下一次有人在頁面上量出幾 px。
  const markup = '<p>「漢字」與Web排版，句尾。</p><u>甲</u><u>乙</u>'

  const fromString = html(installFallbacks(`<div>${markup}</div>`))
  const fromElement = (() => {
    const $div = element(hype(`<div>${markup}</div>`)).querySelector('div') as Element
    installFallbacks($div)
    return $div.outerHTML
  })()

  assert.equal(fromString, fromElement)
})

/* ─── wavy 書名號的鄰行縫 ───────────────────────────────────────────
 * `<cite>` 一直在 with-js CSS 的撤銷名單裡，卻從來沒有任何家族會標記它——
 * 所以 JS 一跑，兩個相鄰的波浪書名號之間的 skip-gap 就被撤掉、兩條底線併成
 * 一條。第二顆標記（wavy）讓 CSS 得以只在 `--han-cite-title-marks: wavy` 下
 * 補回那道縫。 */

test('adjacent cites are paired with the wavy marker, not the plain one', () => {
  const out = html(installFallbacks('<p>同讀<cite>武經總要</cite><cite>字驗</cite>一篇</p>'))
  assert.match(out, /<cite data-followed-by-adjacent-wavy="">武經總要<\/cite>/)
  assert.doesNotMatch(out, /<cite data-followed-by-adjacent-line/)
})

test('a 專名號 immediately before a wavy 書名號 is marked too', () => {
  const out = html(installFallbacks('<p><u>畢昇</u><cite>武經總要</cite></p>'))
  assert.match(out, /<u data-followed-by-adjacent-wavy="">畢昇<\/u>/)
})

test('uninstallFallbacks removes the wavy marker as well', () => {
  const src = '<p><u>畢昇</u><cite>武經總要</cite><cite>字驗</cite></p>'
  const installed = installFallbacks(src)
  uninstallFallbacks(installed)
  const out = html(installed)
  assert.doesNotMatch(out, /data-followed-by-adjacent/)
  assert.doesNotMatch(out, /data-adjacent-lines-refined/)
})
