export {
  refinePunctuation,
  refinePunctuationWithMode,
  setPunctuationRefinementMode,
} from './ts/line-adjustments/punctuation.ts'

export {
  applyISS,
  applyISSWithProbe,
  applyISSWithMode,
  setISSMode,
} from './ts/line-adjustments/iss.ts'

export {
  markAdjacentLines,
  markAdjacentLinesWithMode,
  markAdjacentLinesWithSelectors,
  setDecorationInsetMode,
} from './ts/semantics/adjacent-lines.ts'

/* 常量也是 API。`docs/api-reference.md` §6 一直把它們列為 "Exported constants
 * (advanced)"，但入口從來沒有真的 re-export——結果是用得到的人自己再宣告一次
 * 字串，而那是一條**靜默**的耦合：上游改名，下游不會壞掉報錯，只會安靜地不再
 * 生效（手冊的 home/wavy-cite-gap.js 就在註解裡寫著這件事）。
 *
 * 尤其 `markAdjacentLinesWithSelectors` 是導出的，而它的預設選擇器組不是——
 * 想「照預設再多加一組」的呼叫端非得把 `['u, ins', 's, del']` 抄一遍。 */
export {
  ADJACENT_LINES_REFINED,
  FOLLOWED_BY_ADJACENT_LINE,
  FOLLOWED_BY_ADJACENT_WAVY,
  SELECTORS_FOR_ELEMENTS_WITH_LINES,
  ADJACENT_LINE_PAIRING_RULES,
} from './ts/semantics/adjacent-lines.ts'

export {
  isValidMode,
  PUNCT_OPEN_CHARS,
  PUNCT_CLOSE_CHARS,
  PUNCT_END_EXTRA,
  PUNCT_MIDDLE_CHARS,
  PUNCT_INTERPUNCT_CHARS,
  ALL_PUNCT,
  HANGABLE_CHARS,
} from './ts/line-adjustments/punctuation.ts'

export { transpileRuby } from './ts/semantics/ruby.ts'
export * from './ts/fallbacks.ts'

// 分塊走訪：給自組 pass 的呼叫端用——單一 pass 直接餵大文檔一樣會爆棧
// （installFallbacks 內建同一套分塊，含行內變數還原；runPassChunked 就是
// 它用的那一支）。
export { forEachChunk, CHUNK_NODE_LIMIT } from './ts/helpers/chunk.ts'

export type { RefineMode } from './ts/line-adjustments/punctuation.ts'
export type { ISSMode } from './ts/line-adjustments/iss.ts'
export type { DecorationInsetMode } from './ts/semantics/adjacent-lines.ts'
