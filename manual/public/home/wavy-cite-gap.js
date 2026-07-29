/**
 * 甲式書名號的鄰行缺口 —— a page-side top-up of han.js's adjacent-lines pass.
 *
 * Han.css's CSS fallback already covers wavy `<cite>` chains:
 *
 *   @supports not (text-decoration-inset: auto) {
 *     @container style(--han-cite-title-marks: wavy) {
 *       :where(:is(u, ins, cite:lang(zh)):has(+ u, + ins, + cite:lang(zh)))
 *         { margin-inline-end: var(--han-adjacent-lines-skip-gap-fallback) }
 *     } }
 *
 * …but the moment han.js runs, the JS-refined layer takes over and REVOKES it:
 *
 *   :where(u, ins, s, del, cite) {
 *     :where([data-adjacent-lines-refined] &:not([data-followed-by-adjacent-line]))
 *       { margin-inline-end: initial }
 *   }
 *
 * and the marking pass only ever stamps the default families —
 * `SELECTORS_FOR_ELEMENTS_WITH_LINES = ['u, ins', 's, del']`. `cite` is in the
 * CSS revoke list but not in the JS re-stamp list, so adjacent wavy titles end
 * up with NO gap at all (measured: `<u>` pairs 3px, `<cite>` pairs 0px).
 *
 * That asymmetry is deliberate upstream — 乙式《》 is the default and needs no
 * gap, so making every page pay for a 甲式 scan would be the wrong trade. The
 * fix belongs to the page that opts into wavy, which is this one. Hence a
 * top-up rather than an edit to `SELECTORS_FOR_ELEMENTS_WITH_LINES`.
 *
 * Why it matters here beyond neatness: station①'s 甲式 row is
 * 《武經總要》〈字驗〉—— a work and a chapter OF it. Two adjacent 書名號 mean
 * containment, and with the gap gone the two waves merge into one, so the row
 * reads as a single long title 「武經總要字驗」. The gap carries the grammar.
 */

import { markAdjacentLinesWithSelectors } from '/han/han.js'

/* han.js knows this name as `FOLLOWED_BY_ADJACENT_LINE` but does not export
   it, so it is spelled out again here. That is a real coupling: rename it
   upstream and this module goes quiet rather than loud — the gap simply stops
   coming back after a wipe. That silence is what
   `tests/e2e/mark-diagram.spec.ts` § 甲式 adjacent-title gap turns into a
   failing test. */
const FOLLOWED_BY_ADJACENT_LINE = 'data-followed-by-adjacent-line'

/* Curried the other way round from the guess `markAdjacentLines(root)(sel)` —
 * han.js takes the SELECTOR GROUPS first and the root second, so the bound
 * pass is a reusable value and the root is what varies. */
const markCiteChains = markAdjacentLinesWithSelectors(['cite'])

/**
 * Every element that directly parents a wavy `<cite>`, deduped.
 *
 * Resolved from the COMPUTED value rather than by matching
 * `[style*="--han-cite-title-marks"]`: the flag is a custom property read by a
 * style query, so it can be declared on any ancestor, by a stylesheet as
 * easily as inline. Reading it off the `<cite>` itself is the only way that
 * stays true however it was set.
 *
 * Scoped to the parent, not the whole page: the pass would otherwise also
 * stamp 乙式 chains elsewhere, where the 《》 already separate the titles and a
 * margin would just push them apart for no reason.
 */
const wavyScopes = ($root) =>
  new Set(
    [...$root.querySelectorAll('cite')]
      .filter(
        ($cite) =>
          getComputedStyle($cite)
            .getPropertyValue('--han-cite-title-marks')
            .trim() === 'wavy',
      )
      .map(($cite) => $cite.parentElement)
      .filter(Boolean),
  )

/**
 * Re-stamping is tied to the WIPE, not to a broadcast — measured, after the
 * obvious version failed:
 *
 *   2122ms  data-followed-by-adjacent-line → true    (this module, at DCL)
 *   2050ms  han-config-change                        (console's initial config)
 *   2505ms  data-followed-by-adjacent-line → false   (fallbacks re-applied)
 *
 * han.js's `applyFallbacks` begins by stripping EVERY
 * `[data-followed-by-adjacent-line]` under its root before re-marking the two
 * default families, and on this page that lands ~455ms AFTER the config event
 * — with no event of its own afterwards. Subscribing to `han-config-change`
 * therefore re-applies at 2050 (a no-op, nothing had been wiped yet) and is
 * long gone by 2505.
 *
 * So watch the attribute instead. The observer only ever reacts to the
 * attribute going ABSENT, and this module only ever adds it, so the re-add
 * can't feed itself a second round.
 */
export const initWavyCiteGap = ($root = document) => {
  const scopes = [...wavyScopes($root)]
  if (!scopes.length) return

  const apply = () => scopes.forEach(($scope) => markCiteChains($scope))

  let queued = false
  const reapply = () => {
    if (queued) return
    queued = true
    queueMicrotask(() => {
      queued = false
      apply()
    })
  }

  const observer = new MutationObserver((records) => {
    const wiped = records.some(
      (record) => !record.target.hasAttribute(FOLLOWED_BY_ADJACENT_LINE),
    )
    if (wiped) reapply()
  })

  apply()
  scopes.forEach(($scope) =>
    observer.observe($scope, {
      subtree: true,
      attributes: true,
      attributeFilter: [FOLLOWED_BY_ADJACENT_LINE],
    }),
  )
}
