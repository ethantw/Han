/**
 * markdown-it plugin: emphasis delimiters that don't require an extra
 * space at CJK boundaries.
 *
 * Vanilla CommonMark requires the closing `**` to be followed by
 * whitespace or punctuation; CJK characters are neither, so e.g.
 * `**提示：**第四版` fails to close (`：` is punct, `第` is alphanumeric-
 * equivalent — `right_flanking` collapses to false).
 *
 * Naively treating ALL CJK as punctuation regresses cases like
 * `**強調**abc` (currently works) — `調` becomes punct, `a` doesn't,
 * and the close fails the same way.
 *
 * The rule used here is asymmetric: **a CJK character counts as
 * punctuation only when the character on the OTHER side of the
 * delimiter is genuinely Unicode punctuation.** This re-enables
 * `**P**CJK` and `CJK**P**` while leaving `CJK**ASCII**`,
 * `ASCII**CJK**`, and pure-Latin snake_case behaviour untouched.
 */

import StateInline from 'markdown-it/lib/rules_inline/state_inline.mjs'
import {
  isWhiteSpace,
  isPunctChar,
  isMdAsciiPunct,
} from 'markdown-it/lib/common/utils.mjs'

/**
 * Ranges treated as boundary characters (in addition to ASCII punctuation
 * and Unicode punctuation). The list is conservative — only scripts that
 * actually need this fix:
 *
 *   3000-303F  CJK symbols and punctuation (already Unicode P; harmless overlap)
 *   3040-30FF  Hiragana / Katakana
 *   3105-312F  Bopomofo
 *   3400-4DBF  CJK Ext A
 *   4E00-9FFF  CJK Unified Ideographs
 *   A960-A97F  Hangul Jamo Ext A
 *   AC00-D7AF  Hangul syllables
 *   F900-FAFF  CJK compatibility ideographs
 *   FE30-FE4F  CJK compatibility forms
 *   FF00-FFEF  Halfwidth/Fullwidth forms
 */
const CJK_RE = /[　-〿぀-ヿㄅ-ㄯ㐀-䶿一-鿿ꥠ-꥿가-힯豈-﫿︰-﹏＀-￯]/

const isCjk = ch => CJK_RE.test(ch)

/**
 * Replacement for `StateInline.prototype.scanDelims` that augments the
 * "is this a punct/word-boundary char?" predicate with CJK detection.
 * Body is otherwise byte-for-byte the original from
 * `markdown-it/lib/rules_inline/state_inline.mjs`.
 */
function scanDelimsCjk (start, canSplitWord) {
  const max = this.posMax
  const marker = this.src.charCodeAt(start)

  const lastChar = start > 0 ? this.src.charCodeAt(start - 1) : 0x20

  let pos = start
  while (pos < max && this.src.charCodeAt(pos) === marker) { pos++ }

  const count = pos - start

  const nextChar = pos < max ? this.src.charCodeAt(pos) : 0x20

  const lastStr = String.fromCharCode(lastChar)
  const nextStr = String.fromCharCode(nextChar)

  const lastGenuinePunct = isMdAsciiPunct(lastChar) || isPunctChar(lastStr)
  const nextGenuinePunct = isMdAsciiPunct(nextChar) || isPunctChar(nextStr)

  // Asymmetric extension: a CJK char on this side acts as punct only
  // when the other side is itself genuine punctuation. This re-enables
  // `**P**CJK` / `CJK**P**` without disturbing `CJK**ASCII**` etc.
  const isLastPunctChar = lastGenuinePunct || (isCjk(lastStr) && nextGenuinePunct)
  const isNextPunctChar = nextGenuinePunct || (isCjk(nextStr) && lastGenuinePunct)

  const isLastWhiteSpace = isWhiteSpace(lastChar)
  const isNextWhiteSpace = isWhiteSpace(nextChar)

  const left_flanking =
    !isNextWhiteSpace && (!isNextPunctChar || isLastWhiteSpace || isLastPunctChar)
  const right_flanking =
    !isLastWhiteSpace && (!isLastPunctChar || isNextWhiteSpace || isNextPunctChar)

  const can_open  = left_flanking  && (canSplitWord || !right_flanking || isLastPunctChar)
  const can_close = right_flanking && (canSplitWord || !left_flanking  || isNextPunctChar)

  return { can_open, can_close, length: count }
}

/**
 * Install the patch. Idempotent — repeated calls are no-ops because the
 * prototype method is replaced with the same function reference.
 */
export function cjkEmphasis(md) {
  StateInline.prototype.scanDelims = scanDelimsCjk
  return md
}
