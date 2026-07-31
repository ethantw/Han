/**
 * semantic-chars.js — 站①詩行 <i> 的逐字 span（semantics-char-settle 動畫用）。
 *
 * 只包 .poem-like 裡的 <i>（純文字內容），每字一個
 * <span data-char style="--i:n">。無 JS ⇒ 不包 ⇒ CSS 基態即歸正終態，
 * 同站台 reveal 契約。用 [...text] 迭代 code point，不用 split('')。
 * （若日後 han.js 開 wrap util 的 subpath export，此檔改為薄轉接。）
 */
export const initSemanticChars = () => {
  for (const $i of document.querySelectorAll('#station-semantics .poem-like i')) {
    // 有子元素就不演：一刀同時擋掉重跑（前次包的 span 還在）與外來
    // markup（textContent 會把它摧毀）。冪等不必另設 [data-char] guard。
    if ($i.childElementCount) continue
    const chars = [...$i.textContent]
    let index = 0
    $i.replaceChildren(
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
