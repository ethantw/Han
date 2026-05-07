import {
  defaultOptions, element, transform, hype,
  type Options, type Hyperly, type Hype,
} from 'hyperly/fp'

import { isBrowserSide } from '../helpers/env.ts'
import { identity, pipe, tap } from '../helpers/fp.ts'

/* ─── Types ──────────────────────────────────────────────────────────────── */
/** Subtype tokens emitted into `data-punct`. Combine with `consecutive`
 *  and `hangable` (added by the wrapper logic) for the full value set. */
export type PunctSubtype = 'open' | 'close' | 'end' | 'middle'
export type RefineMode = 'auto' | 'compress' | 'hang' | 'none'

export const isValidMode = (mode: any): mode is RefineMode =>
  ['auto', 'compress', 'hang', 'none'].includes(mode)

/* ─── Constants & Regex ──────────────────────────────────────────────────── */

/**
 * CJK punctuation character sets:
 */
export const PUNCT_OPEN_CHARS   = '「『《〈（〔［｛【〖'
export const PUNCT_CLOSE_CHARS  = '」』》〉）〕］｝】〗'
export const PUNCT_END_EXTRA    = '︰．、，。：；？！ー'   // sentence-ending, not closing brackets
export const PUNCT_MIDDLE_CHARS = '·＼／－゠＆・＿'

export const ALL_PUNCT = PUNCT_OPEN_CHARS + PUNCT_CLOSE_CHARS + PUNCT_END_EXTRA + PUNCT_MIDDLE_CHARS

/** Matches one or more consecutive CJK punctuation characters. */
export const CJK_PUNCT_RUN = new RegExp(`[${ALL_PUNCT}]+`, 'g')

/**
 * `auto` mode walks `[…biaodian]+` runs while peeking one char past the
 * run's tail (capture group 2), so a hangable mark at run-end can be
 * classified against what follows the run in source order without needing
 * a second `transform` pass.  `s` flag lets the `.` also match newlines.
 */
const CJK_PUNCT_RUN_WITH_NEXT = new RegExp(`([${ALL_PUNCT}]+)(?=(.?))`, 'gs')

/**
 * Hangable line-end punctuation: ideographic / fullwidth comma & period,
 * provided it is NOT immediately followed by another sentence-end mark
 * (so "。" doesn't double-hang).
 */
export const HANGABLE_PUNCT = new RegExp(
  `[、，。．](?![${PUNCT_CLOSE_CHARS}${PUNCT_END_EXTRA}])`,
  'g',
)

/**
 * Same hangability rule as `HANGABLE_PUNCT`, expressed as a Set for
 * character-by-character iteration instead of regex replace.
 */
export const HANGABLE_CHARS = new Set([...'、，。．'])

/**
 * Complement of `HANGABLE_CHARS`: glyphs that, when appearing immediately
 * after a hangable mark, suppress hanging — mirrors the `(?![…])` lookahead
 * in `HANGABLE_PUNCT`.
 */
export const HANG_BLOCKING_CHARS = new Set([...PUNCT_CLOSE_CHARS, ...PUNCT_END_EXTRA])

/* ─── Internal Helpers & Config ──────────────────────────────────────────── */

/**
 * Classify a single biaodian character into `data-punct` subtype tokens.
 * Closing brackets get both `'close'` and `'end'` (matching the original
 * han.js behaviour).
 */
export const classifyPunctuation = (ch: string): readonly PunctSubtype[] =>
  !ch
  ? []

  : PUNCT_OPEN_CHARS.includes(ch)
  ? ['open']

  : PUNCT_CLOSE_CHARS.includes(ch)
  ? ['close', 'end']

  : PUNCT_END_EXTRA.includes(ch)
  ? ['end']

  : PUNCT_MIDDLE_CHARS.includes(ch)
  ? ['middle']

  : []

/**
 * `<h-char>` is the project's "this position has a structural wrapper"
 * marker. Without skipping its subtree, a second `compressPunctuation` /
 * `hangPunctuation` pass over the same root walks straight into the inner
 * text node and re-wraps it — yielding nested `<h-char>` envelopes. See the
 * idempotence tests in `__tests__/punctuation.test.ts` and
 * `__tests__/hanging.test.ts`.
 *
 * `nodeType === 1` rather than `instanceof Element`: hyperly invokes this
 * predicate from non-browser test runs where the `Element` global isn't
 * bound, even though happy-dom is providing the actual nodes internally.
 */
const isHCharWrapper = (n: Node): boolean =>
  n.nodeType === 1 && (n as Element).tagName === 'H-CHAR'

const optionsIgnoringHChar: Options = {
  ignore: n => defaultOptions.ignore(n) || isHCharWrapper(n),
}

/* ─── Public API ─────────────────────────────────────────────────────────── */

/**
 * Mode-explicit punctuation primitive. The four modes dispatch to their
 * respective wrappers:
 *
 *   - `auto`     — compress + hang in a single pass; hangable
 *                  punctuation get the combined shape
 *                  `<h-char data-punct="end hangable"><h-layer>…</h-layer></h-char>`.
 *                  Subsumes `compress` and `hang`.
 *   - `compress` — only the 標點擠壓 wrappers (`<h-char data-punct="…">`).
 *   - `hang`     — only the 標點懸掛 wrappers
 *                  (`<h-char data-punct="hangable"><h-layer>…</h-layer></h-char>`).
 *   - `none`     — identity transform (`hype`). For SSR pipelines that
 *                  want to skip the punct stage explicitly.
 *
 * Curried (mode first) to compose with `hyperly/fp` pipelines and
 * to allow caller-side reuse of a partially-applied refiner:
 *
 * ```ts
 * const autoPunct = refinePunctuationWithMode('auto')
 * const articleHype = autoPunct($article)
 * const asideHype = autoPunct($aside)
 * ```
 *
 * Exported for SSR / Node usage where there's no CSS cascade to read
 * from. Browser callers normally want `refinePunctuation(src)`, which
 * resolves the mode from `--han-punctuation-refinement`.
 */
/* ─── Mode-specific transform recipes (module-level, pure values) ────────── */

/** auto = compress + hang in a single pass. Sees one char past the run end
 *  via the lookahead-with-capture so a hangable run-end mark is classified
 *  against what follows. */
const wrapBoth =
  transform
    (optionsIgnoringHChar)
    (CJK_PUNCT_RUN_WITH_NEXT)
    (portion => match => {
      const runText = match.captures[0]
      const runLen = runText.length
      const isRun = runLen > 1
      const nextAfterRun = match.captures[2] ?? ''

      return [...portion.text].map((ch, j) => {
        const i = portion.indexInMatch + j

        // A punctuation mark can only hang if the character immediately
        // following it (whether inside this same run, or sitting just after
        // the run) is NOT a hang-blocking char like a closing bracket.
        const hangable = (
          HANGABLE_CHARS.has(ch) &&
          !HANG_BLOCKING_CHARS.has(
            i < runLen - 1
            ? runText[i + 1] ?? ''
            : nextAfterRun
          )
        )

        const punctValues = [
          ...classifyPunctuation(ch),
          ...(isRun ? ['consecutive'] : []),
          ...(hangable ? ['hangable'] : []),
        ]
        const attrs = isRun
          ? ` data-consecutive-pos="${i === 0 ? 'start' : i === runLen - 1 ? 'end' : 'inner'}"`
          : ''
        const inner = hangable ? `<h-layer>${ch}</h-layer>` : ch
        return `<h-char data-punct="${punctValues.join(' ')}"${attrs}>${inner}</h-char>`
      })
      .join('')
    })

const wrapCompressible =
  transform
    (optionsIgnoringHChar)
    (CJK_PUNCT_RUN)
    (portion => match => {
      const runLen = match.captures[0].length
      const isRun = runLen > 1

      return [...portion.text].map((ch, j) => {
        const punctValues = [
          ...classifyPunctuation(ch),
          ...(isRun ? ['consecutive'] : []),
        ]
        const pos = portion.indexInMatch + j
        const attrs = isRun
          ? ` data-consecutive-pos="${pos === 0 ? 'start' : pos === runLen - 1 ? 'end' : 'inner'}"`
          : ''
        return `<h-char data-punct="${punctValues.join(' ')}"${attrs}>${ch}</h-char>`
      }).join('')
    })

const wrapHangable =
  transform
    (optionsIgnoringHChar)
    (HANGABLE_PUNCT)
    (portion => _match =>
        '<h-char data-punct="hangable">'
      + `<h-layer>${portion.text}</h-layer>`
      + '</h-char>'
    )

/** Mode → `Hyperly → Hype` dispatch. Pure value table, no side effects. */
const dispatchByPunctMode = (mode: RefineMode): ((src: Hyperly) => Hype) =>
  mode === 'auto'
  ? wrapBoth

  : mode === 'compress'
  ? wrapCompressible

  : mode === 'hang'
  ? wrapHangable

  : hype

/** Cascade-write half of the `withMode` contract — only fires in browser.
 *  Future CSS uses `@container style(--han-punctuation-refinement: …)` to
 *  switch styles per subtree; markup and cascade var must stay atomic, so
 *  this gets `pipe`d with `dispatchByPunctMode`. SSR skips the write — the
 *  client-side run will set it on hydration. */
const syncCascadeIfBrowser = (mode: RefineMode) =>
  isBrowserSide()
  ? tap(setPunctuationRefinementMode(mode))
  : identity

export const refinePunctuationWithMode = (mode: RefineMode) =>
  pipe<Hyperly, Hyperly, Hype>(
    syncCascadeIfBrowser(mode),
    dispatchByPunctMode(mode),
  )

/**
 * Write `--han-punctuation-refinement: {mode}` as an inline style on
 * `src`'s resolved element. Useful when a caller wants to switch a
 * subtree's mode from JS without touching the stylesheet. Mutation
 * is visible to subsequent CSS reads, not just the next
 * `refinePunctuation` call.
 */
export const setPunctuationRefinementMode =
    (mode: RefineMode) =>
    (src: Hyperly): void =>
  (element(src) as HTMLElement).style.setProperty(
    '--han-punctuation-refinement',
    mode,
  )

/** Pure read: resolve the cascade-declared mode on `src`, falling back to
 *  `auto` when the value is missing or unknown. No `CSS.supports` consulted —
 *  that's the dispatcher's job. */
const resolvePunctMode = (src: Hyperly): RefineMode => {
  const raw = getComputedStyle(element(src))
    .getPropertyValue('--han-punctuation-refinement').trim()
  return isValidMode(raw) ? raw : 'auto'
}

/** Pick the JS recipe to run given a declared mode + native engine state.
 *  `auto` means "compress + hang in one pass" — when the UA already does the
 *  compress half via `text-spacing-trim: trim-start`, JS only needs the hang
 *  half. Other modes are explicit author intent and run as-declared. */
const effectiveJSMode = (declared: RefineMode): RefineMode =>
  declared === 'auto' && CSS.supports('text-spacing-trim', 'trim-start')
  ? 'hang'
  : declared

/**
 * Auto-dispatching punctuation entry — resolves the cascade-declared mode
 * (`src → :root` walk on `--han-punctuation-refinement`), then runs the
 * right JS recipe for the current engine.
 *
 * `declared === 'none'` short-circuits — opt-out runs no pass and writes
 * no cascade.
 *
 * **Asymmetric cascade vs. JS** (mirrors `applyISS` / `markAdjacentLines`):
 *
 *   - Cascade var: written with the **declared** mode. CSS keys behaviour
 *     off `--han-punctuation-refinement` and uses `@supports` internally
 *     to branch native vs. fallback styling; JS doesn't need to stomp the
 *     cascade with the downgraded mode.
 *   - JS recipe:   the **effective** mode (`auto → hang` when native
 *     trim-start is supported). Avoids emitting compress wrappers the
 *     engine already produces.
 *
 * The mode-explicit primitive `refinePunctuationWithMode(mode)(src)` keeps
 * cascade and JS in lockstep on the caller-supplied mode — it's the
 * "I know what I want, do exactly this" form. The asymmetry only lives in
 * this auto-entry, where we know more than the caller.
 *
 * To force a specific mode, call `setPunctuationRefinementMode(mode)(src)`
 * first, or use `refinePunctuationWithMode(mode)(src)` directly.
 */
export const refinePunctuation = (src: Hyperly): Hype => {
  const declared = resolvePunctMode(src)
  if (declared === 'none') return hype(src)

  return pipe<Hyperly, Hyperly, Hype>(
    syncCascadeIfBrowser(declared),                  // cascade ← declared
    dispatchByPunctMode(effectiveJSMode(declared)),  // JS      ← effective
  )(src)
}
