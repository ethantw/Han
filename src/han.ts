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
  markQuoteBoundaries,
  FOLLOWED_BY_QUOTE,
  QUOTE_GENERATOR_TAGS,
} from './ts/line-adjustments/quote-boundary.ts'

export {
  markAdjacentLines,
  markAdjacentLinesWithMode,
  markAdjacentLinesWithSelectors,
  setDecorationInsetMode,
} from './ts/semantics/adjacent-lines.ts'

/* Constants are API too. A caller who has to respell a marker attribute
 * or the default selector groups gains a SILENT coupling: rename upstream
 * and their code goes quiet, not loud. Everything the passes accept or
 * emit is exported so it can be imported instead. */
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

// Chunked traversal, for callers assembling their own passes — a single
// pass fed a large document overflows the stack all the same
// (installFallbacks chunks internally via this very helper).
export { forEachChunk, CHUNK_NODE_LIMIT } from './ts/helpers/chunk.ts'

export type { RefineMode } from './ts/line-adjustments/punctuation.ts'
export type { ISSMode } from './ts/line-adjustments/iss.ts'
export type { DecorationInsetMode } from './ts/semantics/adjacent-lines.ts'
