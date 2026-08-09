import { detectAutospaceBoundaryBug } from '../helpers/probes.ts'
import { isBrowserSide } from '../helpers/env.ts'
import { identity, pipe, tap } from '../helpers/fp.ts'
import { isCodeLike } from '../helpers/skip.ts'

import {
  defaultOptions, element, hype, insert, transform,
  type Hyperly, type Hype, type Options,
} from 'hyperly/fp'

/** Skip code-like / form-field subtrees — literal text that must not get
 *  `<h-iss>` spacers (same exclusion as 標點, see `helpers/skip.ts`). */
const optionsSkippingCode: Options = {
  ignore: n => defaultOptions.ignore(n) || isCodeLike(n),
}

/**
 * 跨文種混排間隙 (inter-script spacing, ISS) — JS-side companions for the
 * `text-autospace` cascade variable. Two internal passes, picked by the
 * resolved mode:
 *
 *   `replaceISS`  consumes an author-typed whitespace run at a CJK↔Western
 *                 boundary and drops `<h-iss hidden> </h-iss>` in its place
 *                 (CSS-Text-4 `replace` semantic — no engine ships it).
 *   `insertISS`   inserts an `<h-iss>` where there is NO space (`insert`
 *                 semantic — native in modern engines; JS covers long-tail
 *                 UAs and `strict`).
 *
 * `strict` runs replace THEN insert; the order is load-bearing — the
 * replaced spacer's own space char fails insert's lookahead, so the same
 * seam never double-fires. Companion CSS in `lines.with-js.css` sizes the
 * element to ¼ em.
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
 * A boundary char with a lookahead asserting the opposite script follows.
 * The match is the char LEFT of the seam; `insert({ end, outer: true })`
 * lets the spacer bubble out of wrapping inlines so it lands at the visual
 * seam (`<b>字</b><iss>A`, not `<b>字<iss></b>A`).
 */
const ISS_INSERT_BOUNDARY = new RegExp(
  `[${CJK}](?=[${WESTERN_ALPHA}${WESTERN_OPEN}])`
  + `|[${WESTERN_ALPHA}${WESTERN_END}](?=[${CJK}])`,
  'gu',
)

/** `text-autospace: insert` — spacer where the source has no whitespace.
 *  Idempotent: the inserted spacer's space matches neither lookahead arm. */
const insertISS = (src: Hyperly): Hype =>
  insert
    (optionsSkippingCode)
    (ISS_INSERT_BOUNDARY)
    ({ end: ISS_HTML, outer: true })
    (src)

/* ────────────────────────────────────────────────────────── */
/* replace mode — primary path on modern UAs                  */
/* ────────────────────────────────────────────────────────── */

/**
 * A collapsible-whitespace run sandwiched between CJK and Western glyphs;
 * only the whitespace matches, so the neighbours stay in place. The class
 * `[ \t\n\r\f]` is exactly CSS Text's collapsible set — it deliberately
 * excludes NBSP / U+3000 and friends, which render at a fixed width and are
 * explicit author choices, not seams to squash into a ¼-em spacer.
 */
const ISS_REPLACE_WHITESPACE = new RegExp(
  `(?<=[${CJK}])[ \\t\\n\\r\\f]+(?=[${WESTERN_ALPHA}${WESTERN_OPEN}])`
  + `|(?<=[${WESTERN_ALPHA}${WESTERN_END}])[ \\t\\n\\r\\f]+(?=[${CJK}])`,
  'gu',
)

/** `text-autospace: replace` — `字 A` → `字<h-iss/>A`; tight pairs and
 *  fixed-width spaces are left alone. */
const replaceISS = (src: Hyperly): Hype =>
  transform
    (optionsSkippingCode)
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
 * Mode-explicit ISS primitive — atomic "set cascade + run JS". For SSR and
 * callers that already know the mode; browser callers normally want
 * `applyISSWithProbe` (cascade + UA probe) or `applyISS` (cascade only).
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
 *   otherwise        → skip when the matching native is reported.
 *
 * Probe `normal`, not `insert`: shipping engines all support the property
 * but report `false` for `CSS.supports('text-autospace', 'insert')`, which
 * would keep JS running forever on engines that need none of it. */
const needsJS = (mode: ISSMode, isBuggy: boolean): boolean =>
  mode === 'none'
    ? false

    : isBuggy || mode === 'strict'
      ? true

      : !(
        (
          ['normal', 'insert'].includes(mode) &&
          CSS.supports('text-autospace', 'normal')
        ) ||
        (
          mode === 'replace' &&
          CSS.supports('text-autospace', 'replace')
        )
      )

/**
 * Cascade-dispatching ISS entry WITHOUT the UA inline-boundary probe —
 * trusts `CSS.supports` at face value. Use when probe state is already
 * seeded elsewhere, or the probe's measurement-element insertion is
 * unwanted. Standing down short-circuits without writing the cascade var:
 * the cascade must stay authoritative.
 */
export const applyISS = (src: Hyperly): Hype => {
  const declared = resolveISSMode(src)
  return needsJS(declared, false)
    ? applyISSWithMode(declared)(src)
    : hype(src)
}

/**
 * Default browser entry (what `installFallbacks` calls): cascade dispatch
 * plus the memoised UA probe for engines that ship `text-autospace` but
 * drop the gap across inline boundaries (`<b>字</b>A`). Opt-out
 * short-circuits BEFORE the probe — opting out shouldn't poke the DOM.
 */
export const applyISSWithProbe = (src: Hyperly): Hype => {
  const declared = resolveISSMode(src)
  if (declared === 'none') return hype(src)

  const isBuggy = detectAutospaceBoundaryBug()

  return needsJS(declared, isBuggy)
    ? applyISSWithMode(declared)(src)
    : hype(src)
}
