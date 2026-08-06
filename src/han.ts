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

export { transpileRuby } from './ts/semantics/ruby.ts'
export * from './ts/fallbacks.ts'

// 分塊走訪：給自組 pass 的呼叫端用——單一 pass 直接餵大文檔一樣會爆棧
// （installFallbacks 內建同一套分塊，含行內變數還原；runPassChunked 就是
// 它用的那一支）。
export { forEachChunk, CHUNK_NODE_LIMIT } from './ts/helpers/chunk.ts'

export type { RefineMode } from './ts/line-adjustments/punctuation.ts'
export type { ISSMode } from './ts/line-adjustments/iss.ts'
export type { DecorationInsetMode } from './ts/semantics/adjacent-lines.ts'
