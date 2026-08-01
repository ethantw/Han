/**
 * semantic-chars.js — 站①詩行斜體記號的逐字 span（semantics-char-settle 用）。
 *
 * 包 .poem-like 裡被瀏覽器斜體化的記號：<i>／<var>／<em>／<dfn>。**不包 <cite>**
 * ——它的記號是線（甲式波浪、乙式《》），而 text-decoration 畫不進 atomic
 * inline，逐字 inline-block 會讓波浪線整條消失。cite 的歸正仍走
 * semantics-straighten（font-style 插值）。每字一個
 * <span data-char style="--i:n">。無 JS ⇒ 不包 ⇒ CSS 基態即歸正終態，
 * 同站台 reveal 契約。用 [...text] 迭代 code point，不用 split('')。
 * （若日後 han.js 開 wrap util 的 subpath export，此檔改為薄轉接。）
 */
export const initSemanticChars = () => {
  for (const $mark of document.querySelectorAll('#station-semantics .poem-like :is(i, var, em, dfn)')) {
    // 有子元素就不演：一刀同時擋掉重跑（前次包的 span 還在）與外來
    // markup（textContent 會把它摧毀）。冪等不必另設 [data-char] guard。
    if ($mark.childElementCount) continue
    const chars = [...$mark.textContent]
    let index = 0
    $mark.replaceChildren(
      ...chars.map((char) => {
        /* formatting whitespace 拿到 inline-block span 會在直排變可見
           空格——留作純文字節點；--i 只數實字，階梯無死格。 */
        if (/^\s$/.test(char)) return document.createTextNode(char)
        const $span = document.createElement('span')
        $span.dataset.char = ''
        $span.style.setProperty('--i', index)
        index += 1
        $span.textContent = char
        return $span
      }),
    )
  }
}
