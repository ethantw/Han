import {
  defaultOptions, element, transform, hype,
  type Options, type Hyperly, type Hype,
} from 'hyperly/fp'

import { isBrowserSide } from '../helpers/env.ts'
import { identity, pipe, tap } from '../helpers/fp.ts'
import { isCodeLike } from '../helpers/skip.ts'

/* ─── Types ──────────────────────────────────────────────────────────────── */
/** Subtype tokens emitted into `data-punct`. Combine with `consecutive`
 *  and `hangable` (added by the wrapper logic) for the full value set. */
export type PunctSubtype = 'open' | 'close' | 'end' | 'middle'
export type RefineMode = 'auto' | 'compress' | 'hang' | 'none'

export const isValidMode = (mode: any): mode is RefineMode =>
  ['auto', 'compress', 'hang', 'none'].includes(mode)

/* ─── Constants & Regex ──────────────────────────────────────────────────── */

/** CJK opening brackets (開括號). */
export const PUNCT_OPEN_CHARS   = '「『《〈（〔［｛【〖'
/** CJK closing brackets (閉括號). */
export const PUNCT_CLOSE_CHARS  = '」』》〉）〕］｝】〗'
/** Sentence-ending marks that are not closing brackets (句末點號). */
export const PUNCT_END_EXTRA    = '︰．、，。：；？！ー'
/** Fullwidth middle symbols (中點與全形符號). */
export const PUNCT_MIDDLE_CHARS = '·＼／－゠＆・＿'

/**
 * 中点類 — the subset of `PUNCT_MIDDLE_CHARS` that is genuinely a middle DOT
 * (JLREQ 中点類: half-em side spaces, compressible against a neighbouring
 * mark). The rest of the middle bucket (`＼／－゠＆＿`) are fullwidth symbols
 * that sit in that bucket for other styling reasons and do NOT compress —
 * measured against a no-han.css baseline: `。·` and `，・` set 1.5em, while
 * `、－` `。／` `，＼` `、＆` `。＿` `、゠` all set a full 2em.
 */
export const PUNCT_INTERPUNCT_CHARS = '·・'

/**
 * Punctuation whose adjoining half-em side bearing may be removed when two
 * marks meet. Fullwidth symbols in the broad `middle` bucket and the long
 * sound mark have no such side bearing, so they deliberately stay out.
 */
export const PUNCT_PAIR_CHARS =
  PUNCT_OPEN_CHARS
  + PUNCT_CLOSE_CHARS
  + PUNCT_END_EXTRA.replace('ー', '')
  + PUNCT_INTERPUNCT_CHARS

/** Every character the punctuation passes classify. */
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
 * `hang` mode's regex. Same hangability rule as `HANGABLE_PUNCT`, plus a
 * capturing lookahead for the character that follows — `hang` wraps single
 * marks rather than whole runs, so without this it has no way to see its
 * neighbour, and the neighbour is what `data-followed-by` reports.
 */
export const HANGABLE_PUNCT_WITH_NEXT = new RegExp(
  `[、，。．](?![${PUNCT_CLOSE_CHARS}${PUNCT_END_EXTRA}])(?=(.?))`,
  'gs',
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

/**
 * Marks whose TRAILING half-em the engine squeezes against a following mark —
 * and can no longer once that following mark is a hangable wrapped in an
 * out-of-flow `<h-layer>` (the mirror of the `data-followed-by` bug). In the
 * `auto`-on-native path we wrap these as a PLAIN inline `<h-char>` so CSS can
 * pay the half em back with `letter-spacing: -.5em` (han v3's recipe — trimmed
 * at the line end, no `justify` drift, unlike a negative margin).
 *
 * This is now the same explicit table used by the fallback pair marker. The
 * broad `middle` bucket is not used: fullwidth symbols and `ー` remain out.
 * Keeping the two paths on one table prevents browser-runtime and SSR markup
 * from disagreeing on seams such as `？，`.
 */
export const SQUEEZE_BEFORE_HANGABLE = PUNCT_PAIR_CHARS

/**
 * Attribute naming the subtype of whatever sits immediately after this mark.
 * Mirrors `data-followed-by-adjacent-line` (semantics/adjacent-lines.ts): a
 * fact about the NEIGHBOUR lives in its own attribute, never in `data-punct`,
 * which classifies the character itself.
 */
export const FOLLOWED_BY = 'data-followed-by'

/**
 * Structural marker for a compressible punctuation pair. Unlike
 * `data-consecutive-pos`, this says the specific inner seam is allowed to
 * lose ½em; the distinction matters for `＼／－゠＆＿` and `ー`, which are
 * wrapped as punctuation but do not pair-squeeze.
 */
export const SQUEEZE_NEXT = 'data-squeeze-next'

export type PairFollowerSubtype = PunctSubtype | 'hangable'

/** Whether the boundary between two literal punctuation characters squeezes. */
export const isCompressiblePair = (current: string, next: string): boolean =>
  !!current
  && !!next
  && PUNCT_PAIR_CHARS.includes(current)
  && PUNCT_PAIR_CHARS.includes(next)

/** Value written to `data-squeeze-next`; close wins over its secondary end token. */
export const pairFollowerSubtype = (
  next: string,
  nextIsHangable = false,
): PairFollowerSubtype | '' =>
  !next
  ? ''
  : nextIsHangable
  ? 'hangable'
  : classifyPunctuation(next)[0] ?? ''

const squeezeNextAttr = (
  current: string,
  next: string,
  nextIsHangable = false,
): string => {
  if (!isCompressiblePair(current, next)) return ''
  const subtype = pairFollowerSubtype(next, nextIsHangable)
  return subtype ? ` ${SQUEEZE_NEXT}="${subtype}"` : ''
}

/**
 * Subtype of the character after a hangable mark, for `data-followed-by`.
 *
 * Only `open` and `middle` can ever appear, and only where the follower
 * really does compress against its neighbour: `close` and `end` are exactly
 * the `HANG_BLOCKING_CHARS`, so a mark followed by one of those is not
 * hangable in the first place, and `middle` narrows to `PUNCT_INTERPUNCT_CHARS`.
 * Anything else — a Han character, Latin, end of text — yields `''`, and the
 * attribute is omitted.
 *
 * CSS needs this because the wrapper it enables destroys the pair spacing it
 * has to restore: `<h-layer>` is out of flow, so the engine can no longer
 * squeeze the following mark against a glyph that has left the inline run.
 * See `src/css/lines.with-js.css` § 標點懸掛.
 */
export const followerSubtype = (next: string): '' | 'open' | 'middle' =>
  // `''` first: `'…'.includes('')` is TRUE, so an empty follower (end of text)
  // would otherwise report as `open`. Same guard `classifyPunctuation` opens
  // with, for the same reason.
  !next
  ? ''

  : PUNCT_OPEN_CHARS.includes(next)
  ? 'open'

  // 中点類 only, not the whole middle bucket — the fullwidth symbols in it
  // don't compress against a preceding mark, so there is nothing to repair
  // and claiming otherwise would over-squeeze them by half an em.
  : PUNCT_INTERPUNCT_CHARS.includes(next)
  ? 'middle'

  : ''

/** `data-followed-by="…"` for a follower, or `''` when there is nothing to say. */
const followedByAttr = (next: string): string => {
  const subtype = followerSubtype(next)
  return subtype ? ` ${FOLLOWED_BY}="${subtype}"` : ''
}

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
  ignore: n => defaultOptions.ignore(n) || isHCharWrapper(n) || isCodeLike(n),
}

/* ─── Public API ─────────────────────────────────────────────────────────── */

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

        // The character immediately after this one — inside the same run, or
        // sitting just past its tail.
        const next = i < runLen - 1 ? runText[i + 1] ?? '' : nextAfterRun

        // A punctuation mark can only hang if what follows is NOT a
        // hang-blocking char like a closing bracket.
        const hangable = HANGABLE_CHARS.has(ch) && !HANG_BLOCKING_CHARS.has(next)

        const punctValues = [
          ...classifyPunctuation(ch),
          ...(isRun ? ['consecutive'] : []),
          ...(hangable ? ['hangable'] : []),
        ]
        const attrs = (isRun
          ? ` data-consecutive-pos="${i === 0 ? 'start' : i === runLen - 1 ? 'end' : 'inner'}"`
          : '')
          // only hangable marks carry it — it exists to repair the spacing
          // their own `<h-layer>` breaks
          + (hangable ? followedByAttr(next) : '')
          // SSR runs this all-in-one recipe without knowing the eventual UA.
          // Preserve the native atomic-seam hook as well as the fallback pair
          // fact so either CSS capability branch can consume the same markup.
          + (!hangable && isCompressiblePair(ch, next)
            && HANGABLE_CHARS.has(next)
            && !HANG_BLOCKING_CHARS.has(i + 1 < runLen - 1 ? runText[i + 2] ?? '' : nextAfterRun)
            ? ` ${FOLLOWED_BY}="hangable"`
            : '')
          + squeezeNextAttr(
            ch,
            next,
            HANGABLE_CHARS.has(next)
              && !HANG_BLOCKING_CHARS.has(i + 1 < runLen - 1 ? runText[i + 2] ?? '' : nextAfterRun),
          )
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
        const next = pos < runLen - 1 ? match.captures[0][pos + 1] ?? '' : ''
        const attrs = isRun
          ? ` data-consecutive-pos="${pos === 0 ? 'start' : pos === runLen - 1 ? 'end' : 'inner'}"`
            + squeezeNextAttr(ch, next)
          : ''
        return `<h-char data-punct="${punctValues.join(' ')}"${attrs}>${ch}</h-char>`
      }).join('')
    })

/** Pure `hang` (no squeeze wanted): wrap only the hangable mark. Legacy shape. */
const wrapHangableOnly =
  transform
    (optionsIgnoringHChar)
    (HANGABLE_PUNCT_WITH_NEXT)
    (portion => match =>
        `<h-char data-punct="hangable"${followedByAttr(match.captures[1] ?? '')}>`
      + `<h-layer>${portion.text}</h-layer>`
      + '</h-char>'
    )

/**
 * `auto` downgraded to hang on a native-`text-spacing-trim` engine: squeeze IS
 * wanted (the UA does it), but it dies at the seam where a hangable's abspos
 * `<h-layer>` leaves the flow. Walk the run and additionally wrap the ONE
 * squeezer immediately before each wrapped hangable as a plain inline
 * `<h-char … data-followed-by="hangable">`, so CSS can pay the trailing ½em
 * with `letter-spacing`. Everything else stays a bare text node — native
 * trim-start handles it. Mirrors `wrapBoth`'s run walk (portion-safe indices).
 */
const wrapHangablePairs =
  transform
    (optionsIgnoringHChar)
    (CJK_PUNCT_RUN_WITH_NEXT)
    (portion => match => {
      const runText = match.captures[0]
      const runLen = runText.length
      const nextAfterRun = match.captures[2] ?? ''
      // Char at absolute run index k; one past the run is nextAfterRun, which
      // is never CJK punct (runs are maximal) → never hangable, so a
      // squeezer at the run's tail correctly never wraps.
      const charAt = (k: number) =>
        k < runLen ? runText[k] ?? '' : k === runLen ? nextAfterRun : ''
      const isHangableAt = (k: number) =>
        HANGABLE_CHARS.has(charAt(k)) && !HANG_BLOCKING_CHARS.has(charAt(k + 1))

      return [...portion.text].map((ch, j) => {
        const i = portion.indexInMatch + j
        if (isHangableAt(i))
          return `<h-char data-punct="hangable"${followedByAttr(charAt(i + 1))}>`
            + `<h-layer>${ch}</h-layer></h-char>`
        if (SQUEEZE_BEFORE_HANGABLE.includes(ch) && isHangableAt(i + 1))
          return `<h-char data-punct="${classifyPunctuation(ch).join(' ')}"`
            + ` ${FOLLOWED_BY}="hangable">${ch}</h-char>`
        return ch
      }).join('')
    })

/** Hang recipe, squeeze-aware. `true` (auto → hang on native) also wraps the
 *  squeezer before each hangable; `false` (declared hang) is the minimal shape. */
export const wrapHangable = (squeezeBefore: boolean) =>
  squeezeBefore ? wrapHangablePairs : wrapHangableOnly

/** Mode → `Hyperly → Hype` dispatch. Pure value table, no side effects.
 *  `squeezeBefore` only matters for the `hang` recipe — it's the "declared
 *  auto, downgraded to hang on a native engine" bit, so the recipe repairs the
 *  squeeze the UA still wants; a declared `hang` passes `false`. */
const dispatchByPunctMode = (mode: RefineMode, squeezeBefore: boolean): ((src: Hyperly) => Hype) =>
  mode === 'auto'
  ? wrapBoth

  : mode === 'compress'
  ? wrapCompressible

  : mode === 'hang'
  ? wrapHangable(squeezeBefore)

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

/**
 * Mode-explicit punctuation primitive — atomic "set cascade + run JS" on the
 * caller-supplied mode: `auto` (compress + hang in one pass), `compress`,
 * `hang`, or `none`. For SSR and callers that already know the mode; browser
 * callers normally want `refinePunctuation(src)`, which resolves the mode
 * from the cascade and downgrades for native engine support.
 */
export const refinePunctuationWithMode = (mode: RefineMode) =>
  pipe<Hyperly, Hyperly, Hype>(
    syncCascadeIfBrowser(mode),
    // Explicit mode = literal intent: a declared `hang` wants no squeeze, so
    // no squeezer wrapping. The squeeze-aware path lives only in the
    // `refinePunctuation` auto-entry, which knows the engine downgraded it.
    dispatchByPunctMode(mode, false),
  )

/** Write `--han-punctuation-refinement: {mode}` as an inline style — pure
 *  setter, no marking pass. */
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
 * Cascade-dispatching entry — resolves `--han-punctuation-refinement`, then
 * runs the recipe the current engine still needs. Asymmetric on purpose:
 * the cascade var gets the DECLARED mode (CSS branches on it), while JS runs
 * the EFFECTIVE mode (`auto` → `hang` when native trim-start covers the
 * compress half) — the auto-entry knows more than the caller, the
 * mode-explicit primitive stays literal. `none` runs and writes nothing.
 */
export const refinePunctuation = (src: Hyperly): Hype => {
  const declared = resolvePunctMode(src)
  if (declared === 'none') return hype(src)

  return pipe<Hyperly, Hyperly, Hype>(
    syncCascadeIfBrowser(declared),                  // cascade ← declared
    // JS ← effective mode; the `squeezeBefore` bit is the declared intent the
    // downgrade throws away (`auto` still wants squeeze, `hang` never did).
    dispatchByPunctMode(effectiveJSMode(declared), declared === 'auto'),
  )(src)
}
