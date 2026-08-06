import { test } from 'node:test'
import assert from 'node:assert/strict'
import { html, element } from 'hyperly/fp'
import { installFallbacks } from '../fallbacks.ts'
import {
  forEachChunk,
  countNodes,
  CHUNK_NODE_LIMIT,
} from '../helpers/chunk.ts'

/* 分塊走訪（helpers/chunk.ts）——存在理由是 hyperly 的遞迴走訪在
 * ~7,500 節點爆棧且**部分成功**（docs/notes/2026-08-05-install-fallbacks-
 * stack-overflow.md）。這裡驗三件事：大文檔不爆、切塊不改變輸出、
 * 小樹整塊原樣處理。 */

/** 一篇會讓舊實作爆棧的合成文檔：每段帶滿標點與混排邊界，
 *  節點數遠超 CHUNK_NODE_LIMIT。 */
const bigDoc = (paragraphs: number): string => {
  const p = '<p>「漢字」與Web排版，句尾。</p>'
  return `<main><article>${p.repeat(paragraphs)}</article></main>`
}

// 大文檔安裝只跑一次、三個測試共享——每次 3,000 段的 happy-dom 佔
// ~800MB rss，逐測試各跑一遍會被 OOM SIGKILL（實測）。
// 3,000 段 ≈ 6,000+ 節點起步、施作後翻倍——舊實作在 ~7,500 就死。
const bigResult = html(installFallbacks(bigDoc(3000)))

test('big document: installFallbacks completes without RangeError', () => {
  assert.ok(bigResult.length > 0)
})

test('big document: wrappers reach both the first and the last paragraph', () => {
  // 爆棧的病是「部分成功」——前面包好、後面裸奔。分塊後首尾都要有貨。
  const firstP = bigResult.indexOf('<p>')
  const lastP = bigResult.lastIndexOf('<p>')
  const head = bigResult.slice(firstP, firstP + 400)
  const tail = bigResult.slice(lastP)
  for (const part of [head, tail]) {
    assert.match(part, /<h-char data-punct="open">「<\/h-char>/)
    assert.match(part, /<h-layer>。<\/h-layer>/)
    assert.match(part, /<h-iss/)
  }
})

test('chunking does not change the output: big-doc paragraph ≡ solo paragraph', () => {
  // 切點只落在「子節點全是元素」的層，行內流永不被切——所以每段的
  // 輸出必須與單獨處理一字不差（lookahead、鄰行配對都在段內）。
  const solo = html(installFallbacks('<p>「漢字」與Web排版，句尾。</p>'))
  assert.ok(bigResult.includes(solo))
})

test('small tree: processed whole, as a single chunk rooted at root', () => {
  const el = element('<main><p>字。</p><p>字。</p></main>')
  const seen: Element[] = []
  forEachChunk(el, (chunk) => seen.push(chunk))
  assert.equal(seen.length, 1)
  // 恆等斷言走 `===` 布林——assert.equal 直接比兩個 happy-dom 元素，
  // 失敗路徑的 util.inspect 會把整棵 DOM 序列化，直接 OOM（SIGKILL）。
  assert.ok(seen[0] === el)
})

test('mixed inline layer is never split, even when over the limit', () => {
  // 一個混有文字節點的層＝行內流，整層一塊——寧可整塊冒險也不切錯。
  // （element() 會把片段掛回 host body，root 是 body：下探穿過全元素的
  // body／main 層，必須恰好停在混合層 <p> 上。）
  const spans = '<span>字</span>'.repeat(CHUNK_NODE_LIMIT)
  const root = element(`<main><p>行內${spans}文字</p></main>`)
  const seen: Element[] = []
  forEachChunk(root, (chunk) => seen.push(chunk))
  assert.equal(seen.length, 1)
  assert.ok(seen[0] === root.querySelector('p'))
})

test('element-only layers descend until each chunk fits', () => {
  // <main> 下 8 個 <section>，每個 ~1,000 節點：main 超標→往下切，
  // 每個 section 落在門檻內→各自成塊。
  const section = `<section>${'<p>字。</p>'.repeat(500)}</section>`
  const el = element(`<main>${section.repeat(8)}</main>`)
  const seen: Element[] = []
  forEachChunk(el, (chunk) => seen.push(chunk))
  assert.equal(seen.length, 8)
  assert.ok(seen.every((chunk) => chunk.tagName === 'SECTION'))
})

test('countNodes: early exit at limit', () => {
  const el = element(`<main>${'<p>字</p>'.repeat(100)}</main>`)
  assert.equal(countNodes(el, 10), 10)
  assert.ok(countNodes(el, 10_000) < 10_000)
})
