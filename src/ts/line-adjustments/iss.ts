import { detectAutospaceBoundaryBug } from '../helpers/probes.ts'
import { isBrowserSide } from '../helpers/env.ts'
import { identity, pipe, tap } from '../helpers/fp.ts'

import {
  element, hype, insert, transform,
  type Hyperly, type Hype,
} from 'hyperly/fp'

/**
 * 跨文種混排間隙 (inter-script spacing, ISS) — JS-side companions for
 * the `text-autospace` cascade variable.
 *
 * Two internal passes drive every public entry, picked based on the
 * resolved mode (`--han-text-autospace` cascade, or an explicit
 * `ISSMode` arg in the SSR / primitive path):
 *
 *   `replaceISS`   — fires when value is `replace` or `strict`.
 *                    Finds an existing whitespace run between a CJK
 *                    glyph and a Western letter / digit / quote and
 *                    consumes it, dropping a `<h-iss hidden> </h-iss>`
 *                    in its place. This is the CSS-Text-4 `replace`
 *                    autospacing semantic, which no engine ships yet.
 *
 *   `insertISS`    — fires only when value is `strict` (also the
 *                    legacy entrypoint for hand-callers on UAs that
 *                    don't speak `text-autospace: normal` natively).
 *                    Inserts a `<h-iss>` between Han ↔ Western pairs
 *                    where there *isn't* an existing space — the
 *                    `insert` semantic, which Chromium / WebKit / Gecko
 *                    now do natively. JS coverage is kept around for
 *                    long-tail UAs and for `strict` mode.
 *
 * In `strict` mode `replaceISS` runs first, then `insertISS`. The
 * order matters: after `replaceISS` ate the explicit space and
 * dropped a `<h-iss>` in its stead, the inserted h-iss's own space
 * *is* a real text node (across-element from the CJK and the Latin
 * sides), but `insertISS`'s lookahead is `(?=[Western])` — it sees
 * the space, not Latin, so it doesn't double-fire on the same site.
 *
 * "CJK" = Han ∪ Hiragana ∪ Katakana ∪ Hangul, "Western" = Latin ∪
 * Greek ∪ Cyrillic + ASCII digits, both via `\p{sc=…}` so SMP / sur-
 * rogate-pair Han are handled without explicit `[\uD800-\uDBFF]…`.
 *
 * Companion CSS in `src/css/lines.with-js.css` sizes the
 * inserted element to ¼-em (or `font-size-adjust: ic-width 0.208375`
 * on `Han Em Space`, when the UA supports it).
 */

const CJK = '\\p{sc=Han}\\p{sc=Hira}\\p{sc=Kana}\\p{sc=Hang}'

const WESTERN_ALPHA = '\\p{sc=Latn}\\p{sc=Grek}\\p{sc=Cyrl}0-9'

/** Western opening punct that hugs Han on its left:  ' " ‘ “ ( [ ¡ ¿ ⸘ « ‹ ‚ „ */
const WESTERN_OPEN = `'"‘“(\\[¡¿⸘«‹‚„`

/** Western end punct that hugs Han on its right: ' " ” ’ ) ] » › ‛ ‟ ‼ ‽ ⁇–⁉ , . ; : ! ? */
const WESTERN_END = `'"”’)\\]»›‛‟‼‽⁇-⁉,.;:!?`

const ISS_HTML = '<h-iss hidden> </h-iss>'
const ISS_REPLACE_HTML = '<h-iss hidden data-mode="replace"> </h-iss>'

/* ────────────────────────────────────────────────────────── */
/* insert mode — kept as legacy / `strict` companion          */
/* ────────────────────────────────────────────────────────── */

/**
 * Match a single boundary character (CJK side OR Western side), with
 * a lookahead asserting the opposite side follows directly. The match
 * itself is the boundary char on the *left* of the gap; the spacer is
 * dropped in after it via hyperly's `insert(... { end, outer: true })`,
 * which lets the spacer bubble out of any wrapping inline element so
 * the boundary lands at the actual visual seam (e.g. `<b>字</b><iss>A`,
 * not `<b>字<iss></b>A`).
 */
const ISS_INSERT_BOUNDARY = new RegExp(
    `[${CJK}](?=[${WESTERN_ALPHA}${WESTERN_OPEN}])`
  + `|[${WESTERN_ALPHA}${WESTERN_END}](?=[${CJK}])`,
  'gu',
)

/**
 * `text-autospace: insert` JS fallback — inserts an `<h-iss>` at a
 * Han ↔ Western boundary where the source has no whitespace. Idempo-
 * tent because the inserted h-iss's space character matches neither
 * lookahead arm.
 */
const insertISS = (src: Hyperly): Hype =>
  insert
    (ISS_INSERT_BOUNDARY)
    ({ end: ISS_HTML, outer: true })
    (src)

/* ────────────────────────────────────────────────────────── */
/* replace mode — primary path on modern UAs                  */
/* ────────────────────────────────────────────────────────── */

/**
 * Match a contiguous *collapsible* whitespace run sandwiched between a
 * CJK glyph and a Western glyph (in either order). Lookbehind / look-
 * ahead carry the boundary check; the regex *only* matches the white-
 * space itself, so the surrounding chars stay in place when hyperly
 * substitutes the match with the ISS tag.
 *
 * The character class `[ \t\n\r\f]` lists exactly the five characters
 * CSS Text 3 §4 treats as collapsible whitespace: SPACE, TAB, LF, CR,
 * FF. It deliberately excludes the no-break / fixed-width spaces that
 * `\s` (or `\p{White_Space}`) would also catch — U+00A0 NBSP, U+202F
 * NNBSP, U+2000-200A, U+205F, U+3000 IDEOGRAPHIC SPACE etc. Those
 * render at a fixed visible width and are explicit author choices, so
 * we leave them alone instead of squashing them into a ¼-em h-iss.
 *
 * The `u` flag is required by the `\p{sc=…}` script classes used in
 * `CJK` / `WESTERN_*`; it has no effect on `[ \t\n\r\f]` itself.
 */
const ISS_REPLACE_WHITESPACE = new RegExp(
    `(?<=[${CJK}])[ \\t\\n\\r\\f]+(?=[${WESTERN_ALPHA}${WESTERN_OPEN}])`
  + `|(?<=[${WESTERN_ALPHA}${WESTERN_END}])[ \\t\\n\\r\\f]+(?=[${CJK}])`,
  'gu',
)

/**
 * `text-autospace: replace` JS implementation — eats every contiguous
 * collapsible-whitespace run that sits at a Han ↔ Western boundary,
 * replacing it with `<h-iss hidden> </h-iss>`. Sourced cases like
 * `字 A` and `Hello 世界` collapse to `字<h-iss/>A` / `Hello<h-iss/>世界`;
 * an already-tight `字A` / `Hello world`, or one separated by a fixed-
 * width space (NBSP, U+3000…), is left alone.
 */
const replaceISS = (src: Hyperly): Hype =>
  transform
    (ISS_REPLACE_WHITESPACE)
    (_portion => _match => ISS_REPLACE_HTML)
    (src)

/**
 * Computed value of `--han-text-autospace`, plus `none` — the explicit
 * no-op branch for callers that want to disable JS-side ISS without
 * dropping the call site.
 */
export type ISSMode = 'normal' | 'insert' | 'replace' | 'strict' | 'none'

const isValidMode = (mode: any): mode is ISSMode =>
  ['normal', 'insert', 'replace', 'strict', 'none'].includes(mode)

/**
 * Write `--han-text-autospace: {mode}` as an inline style on `src`'s
 * resolved element. Pure setter — for the atomic "set + apply" combo,
 * call `applyISSWithMode(mode)(src)` instead.
 */
export const setISSMode = (mode: ISSMode) => (src: Hyperly): void =>
  (element(src) as HTMLElement).style.setProperty(
    '--han-text-autospace',
    mode,
  )

/* ─── Mode-specific transform recipes (module-level, pure values) ────────── */

/** Mode → `Hyperly → Hype` dispatch. Pure value table, no side effects.
 *
 *   normal / insert   `insertISS` only — `normal` falls through here so
 *                     long-tail UAs without native autospace still get
 *                     the gap.
 *   replace           `replaceISS` only.
 *   strict            `replaceISS` then `insertISS` (inner-to-outer).
 *   none              identity. */
const dispatchByISSMode = (mode: ISSMode): ((src: Hyperly) => Hype) =>
  ['normal', 'insert'].includes(mode)
  ? insertISS

  : mode === 'replace'
  ? replaceISS

  : mode === 'strict'
  ? pipe<Hyperly, Hype, Hype>(replaceISS, insertISS)

  : hype

/** Cascade-write half of the `withMode` contract — only fires in browser.
 *  CSS uses `@container style(--han-text-autospace: …)` to switch behaviour
 *  per subtree; markup and cascade var must stay atomic, so this gets
 *  `pipe`d with `dispatchByISSMode`. SSR skips the write — the client-side
 *  run will set it on hydration. */
const syncCascadeIfBrowser = (mode: ISSMode) =>
  isBrowserSide()
  ? tap(setISSMode(mode))
  : identity

/**
 * Mode-explicit ISS primitive — atomic "set cascade + run JS" combo.
 *
 * Curried (mode first) to compose with `hyperly/fp` pipelines and to allow
 * caller-side reuse of a partially-applied applier. Exported for SSR / Node
 * usage where there's no CSS cascade to read from. Browser callers
 * normally want `applyISSWithProbe(src)` (cascade + UA bug probe) or
 * `applyISS(src)` (cascade only, no probe), which decide whether to call
 * this primitive at all.
 */
export const applyISSWithMode = (mode: ISSMode) =>
  pipe<Hyperly, Hyperly, Hype>(
    syncCascadeIfBrowser(mode),
    dispatchByISSMode(mode),
  )

/** Resolve the cascade-declared ISS mode on `src` — walks `src → :root` on
 *  `--han-text-autospace`, falling back to `'normal'` when the cascade carries
 *  an unknown token. Pure read; does not mutate the DOM.
 *
 *  The cascade enum's opt-out is `no-autospace` (see the `@property` in
 *  `lines.css`); the JS enum's is `none`. Map it — treating it as unknown
 *  would fall back to `normal`, silently CONVERTING an author's opt-out
 *  into an opt-in (and `applyISSWithMode` would then write `normal` back
 *  onto the element, clobbering the author's declaration). */
const resolveISSMode = (src: Hyperly): ISSMode => {
  const raw = getComputedStyle(element(src))
    .getPropertyValue('--han-text-autospace').trim()
  if (raw === 'no-autospace') return 'none'
  return isValidMode(raw) ? raw : 'normal'
}

/** Pure decision: does JS need to run for `(mode, isBuggy)`?
 *
 *   isBuggy          → true. Engine claims native support but drops the
 *                      gap across inline boundaries; JS papers over it.
 *   `strict`         → true. No engine composes `insert` + `replace`; JS
 *                      always runs that pair itself.
 *   `none`           → false. Author opted out.
 *   otherwise        → skip when the matching native is reported. */
const needsJS = (mode: ISSMode, isBuggy: boolean): boolean =>
  mode === 'none'
  ? false

  : isBuggy || mode === 'strict'
  ? true

  : !(
      (
        ['normal', 'insert'].includes(mode) &&
        CSS.supports('text-autospace', 'insert')
      ) ||
      (
        mode === 'replace' &&
        CSS.supports('text-autospace', 'replace')
      )
    )

/**
 * Cascade-dispatching ISS entry, *without* the UA inline-boundary probe.
 * Resolves the mode from `--han-text-autospace`, falling back to `'normal'`
 * for unknown tokens, then gates against `CSS.supports`. Trusts native
 * support at face value — does not run `detectAutospaceBoundaryBug`.
 *
 * Use when the probe state is already established (e.g. seeded by
 * `applyISSWithProbe` elsewhere on the page) or perf-sensitive subtrees
 * want to skip the probe's measurement-element insertion.
 *
 * Diverges from `refinePunctuation`'s downgrade-to-different-mode shape:
 * here, native support means "JS does nothing at all". Writing a no-op
 * value (`'none'`) to inline cascade would mislead `@container style()`
 * queries and the `:root` `text-autospace: var(...)` resolution, so we
 * short-circuit `hype(src)` instead, leaving the cascade authoritative.
 */
export const applyISS = (src: Hyperly): Hype => {
  const declared = resolveISSMode(src)
  return needsJS(declared, false)
    ? applyISSWithMode(declared)(src)
    : hype(src)
}

/**
 * Cascade-dispatching ISS entry, *with* the UA inline-boundary probe.
 * The default browser entry — what `installFallbacks` calls.
 *
 * The probe (`detectAutospaceBoundaryBug`) catches UAs that ship native
 * `text-autospace` but lose the gap across an inline-element boundary
 * (e.g. `<b>字</b>A`). On a positive probe we set `--han-probe-autospace:
 * broken` on `:root`, which `lines.with-js.css` keys off to
 * force the JS-side `<h-iss>` to render even when the engine claims
 * native support.
 *
 * `declared === 'none'` short-circuits *before* the probe — opt-out
 * shouldn't poke the DOM (the probe inserts + removes a measurement
 * element). Other subtrees still trigger the probe; its result is cached
 * in `probes.ts`.
 */
export const applyISSWithProbe = (src: Hyperly): Hype => {
  const declared = resolveISSMode(src)
  if (declared === 'none') return hype(src)

  const isBuggy = detectAutospaceBoundaryBug()
  return needsJS(declared, isBuggy)
    ? applyISSWithMode(declared)(src)
    : hype(src)
}
