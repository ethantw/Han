/**
 * 分塊走訪——hyperly 的 DOM 走訪逐節點遞迴（PureScript 編譯產物，非尾呼
 * 叫），單次呼叫約 **7,500 個節點**就爆 `RangeError: Maximum call stack
 * size exceeded`（2026-08-05 實測，Chromium；門檻看節點總數、與樹深無關
 * ——實測文檔最深才 10 層）。更糟的是它**部分成功**：拋出前包好的
 * wrapper 留在 DOM 裡，畫面只是「排版做得不乾淨」，極易誤診為 CSS 沒生
 * 效。量測與病史：docs/notes/2026-08-05-install-fallbacks-stack-overflow.md。
 *
 * 解法：超過安全門檻的子樹，改對它的**元素子節點**逐一施作，遞迴下探到
 * 每塊都夠小為止。切點的正確性依兩條約束：
 *
 * 1. **標點 lookahead**——`refinePunctuation` 的 run 分類要看 run 尾後一個
 *    字元（CJK_PUNCT_RUN_WITH_NEXT）。在行內兄弟之間切，尾字與下一字會
 *    落到兩次呼叫裡，分類就錯。所以只在「子節點全是元素」的層級往下切；
 *    一旦某層混有文字節點（＝行內流），整層當一塊處理，不再細分。
 * 2. **adjacent-lines 的兄弟關係**——相鄰 `<u>`/`<ins>` 對必須同一次呼叫。
 *    同樣被約束 1 覆蓋：它們是行內兄弟，所在的那層必有文字節點或彼此
 *    相鄰，不會被切開。
 *
 * 混合層仍超標的極端情況（單一段落塞了七千個節點）：照原樣整塊處理、
 * 接受風險——比默默把段落切錯要誠實，而真實文檔裡一個段落到不了這個
 * 量級。
 *
 * 節點計數用迭代 TreeWalker、到門檻提早出局——計數器自己先遞迴爆棧就
 * 太諷刺了。
 */

/** 安全門檻。實測爆點 ~7,500，取一半留餘裕（不同引擎、不同呼叫深度的
 *  堆疊起點都會浮動）。 */
export const CHUNK_NODE_LIMIT = 3500

/** 迭代計數，達 limit 提早回傳（回傳值 ≥ limit 即「超標」）。 */
export const countNodes = (root: Node, limit: number): number => {
  let n = 0
  const doc = root.ownerDocument
  if (!doc) return 0
  const walker = doc.createTreeWalker(root, 0xFFFFFFFF)
  while (n < limit && walker.nextNode()) n++
  return n
}

/** 子節點是否全為元素（可安全往下切的層）。空白字元純文字節點不算數
 *  ——它們是縮排排版，不是行內流。 */
const childrenAllElements = (el: Node): boolean => {
  for (const child of el.childNodes) {
    if (child.nodeType === 1) continue
    if (child.nodeType === 3 && /^[ \t\n\r\f]*$/.test((child as Text).data)) continue
    return false
  }
  return true
}

/**
 * 對 `root` 施作 `fn`，必要時分塊。`fn` 收到的每個節點都保證
 * （a）節點數在門檻內，或（b）已無法再安全細分。
 */
export const forEachChunk = (root: Element, fn: (el: Element) => void): void => {
  // 顯式堆疊的迭代下探——這支函式的存在理由就是別人遞迴爆棧。
  const queue: Element[] = [root]
  while (queue.length > 0) {
    const el = queue.shift()!
    if (countNodes(el, CHUNK_NODE_LIMIT) < CHUNK_NODE_LIMIT || !childrenAllElements(el)) {
      fn(el)
      continue
    }
    for (const child of el.children) queue.push(child)
  }
}
