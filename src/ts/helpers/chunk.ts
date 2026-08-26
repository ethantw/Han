/**
 * Chunked traversal — hyperly's DOM walk recurses per node (compiled
 * PureScript, no TCO) and overflows the stack at roughly 7,500 nodes per
 * call, FAILING PARTIALLY: wrappers applied before the throw stay in the
 * DOM, so the page merely looks "loosely typeset" and the error never gets
 * connected to typography. Measurements and history:
 * docs/notes/2026-08-05-install-fallbacks-stack-overflow.md.
 *
 * Oversized subtrees are therefore processed per element child, descending
 * until each chunk fits. Cut points are correct under two constraints:
 *
 * 1. Punctuation lookahead — run classification peeks one char past the
 *    run's tail, so cutting between inline siblings would split a run
 *    across calls. Hence: descend only through levels whose children are
 *    ALL elements; a level containing any text node is inline flow and is
 *    processed whole.
 * 2. Adjacent-lines pairing — sibling `<u>`/`<ins>` pairs must land in one
 *    call. Covered by constraint 1: they are inline siblings.
 *
 * A mixed level that still exceeds the limit (a single 7,000-node
 * paragraph) is processed whole and the risk accepted — more honest than
 * silently mis-splitting it, and real documents don't have such paragraphs.
 *
 * 3. Skipped subtrees (`isCodeLike`) are dropped here as well, not only by
 *    the passes. A pass enforces that list on the nodes it WALKS, and its
 *    walk starts at the chunk root — hand it a chunk from inside an `<svg>`
 *    and there is no `<svg>` left to recognise. Only oversized subtrees get
 *    descended into, so this went unnoticed until one appeared: an
 *    illustration built of thousands of `<text>` elements had `<h-char>`
 *    wrappers written into it, and SVG does not paint unknown children —
 *    the marks simply vanished from the picture.
 */

import { isCodeLike } from './skip.ts'

/** Safety threshold: half the measured ~7,500 blow-up point — stack
 *  headroom varies by engine and call depth. */
export const CHUNK_NODE_LIMIT = 3500

/** Iterative count with early exit at `limit` (result ≥ limit = "over"). */
export const countNodes = (root: Node, limit: number): number => {
  let n = 0
  const doc = root.ownerDocument
  if (!doc) return 0
  const walker = doc.createTreeWalker(root, 0xFFFFFFFF)
  while (n < limit && walker.nextNode()) n++
  return n
}

/** Are the children all elements (a level safe to cut through)?
 *  Whitespace-only text nodes don't count — they are indentation, not
 *  inline flow. Neither do comments: source comments sit between block
 *  children all over a hand-written document, and treating one as inline
 *  flow condemns its whole level to a single call. That is not theoretical
 *  — han.css's own homepage puts a `<!-- Station … -->` above each section,
 *  so `<main>` was never divisible and went in whole at 12,843 nodes, which
 *  is exactly the overflow this file exists to prevent. */
const childrenAllElements = (el: Node): boolean => {
  for (const child of el.childNodes) {
    if (child.nodeType === 1 || child.nodeType === 8) continue
    if (child.nodeType === 3 && /^[ \t\n\r\f]*$/.test((child as Text).data)) continue
    return false
  }
  return true
}

/**
 * Apply `fn` over `root`, chunking when needed. Every node handed to `fn`
 * is (a) within the node limit, or (b) not safely divisible any further,
 * and never inside a subtree the passes must not touch.
 */
export const forEachChunk = (root: Element, fn: (el: Element) => void): void => {
  // Iterative descent with an explicit stack — this function exists
  // because someone else's recursion blows up.
  const queue: Element[] = [root]
  while (queue.length > 0) {
    const el = queue.shift()!
    if (isCodeLike(el)) continue
    if (countNodes(el, CHUNK_NODE_LIMIT) < CHUNK_NODE_LIMIT || !childrenAllElements(el)) {
      fn(el)
      continue
    }
    for (const child of el.children) queue.push(child)
  }
}
