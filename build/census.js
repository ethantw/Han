/**
 * How many of han.css's selector branches weigh nothing — the figure the
 * homepage's lede leads on（「一百一十二個〇，仍然是「〇」」）.
 *
 * It has gone stale twice, because it moves whenever a selector is added,
 * split or wrapped. So: a script, not a memory. Run it before a release and
 * put what it prints into the copy (five locales — hant/hans spell the
 * numeral, ja/ko print digits, en carries no number at all):
 *
 *     node build/census.js
 *
 * Method, and the two things that are easy to get wrong (both were, the first
 * time round — docs/notes/2026-08-02-where-specificity-census.md):
 *
 *   1. `:where()` counts as ZERO, not as an ordinary pseudo-class. Counting
 *      it normally makes every selector look non-zero — the first version
 *      reported 0 zeros out of 111. That is manual/_specificity.js's job.
 *   2. A comma inside `:where()` is a SELECTOR LIST: its branches have to be
 *      split and ranked one at a time. Summing the list invents triples like
 *      (0,4,0) — three selectors added together.
 *
 * Nesting is expanded by hand: `&` becomes `:is(<parent>)`, which is what the
 * Nesting spec says the ampersand means for specificity; a nested selector
 * with no `&` gets the parent prefixed as a descendant. Only rules that
 * DECLARE something are counted — a wrapper that exists to hold nested rules
 * carries no weight of its own.
 *
 * The CSS is walked by the brace scanner below rather than by postcss: this
 * repo's postcss copy is a transitive dependency and pnpm does not link it,
 * and adding a direct one to count a number in a headline is a poor trade.
 * The input is our own esbuild output, so the scanner only has to survive
 * strings and comments — which it does.
 *
 * It also counts one selector a naive postcss walk misses. `walkRules` plus a
 * 「has direct declarations」 filter skips a rule whose declarations all sit in
 * an `@supports` / `@container` NESTED INSIDE it — `:where(h-iss)` in
 * lines.css is exactly that shape. Those declarations do apply to that
 * selector, conditionally, so the selector has weight and belongs in the
 * count. (This is why the figure here is one higher than the 2026-08-02
 * census note's method would give on the same file.)
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { specificity, splitTopLevel } from '../manual/_specificity.js'

const MODULES = ['semantics', 'lines', 'prose', 'fonts']

/**
 * Every selector chain in `css` that actually declares something, already
 * flattened. Yields full selectors, one per rule (still comma-lists).
 */
function* rules(css) {
  const stack = []          // selector preludes, outermost first ('' for at-rules)
  let buf = ''              // the prelude being collected
  let declared = false      // has the CURRENT block produced a declaration yet
  const pending = []        // one flag per open block

  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (c === '/' && css[i + 1] === '*') { i = css.indexOf('*/', i) + 1; continue }
    if (c === '"' || c === "'") {
      const end = css.indexOf(c, i + 1)
      buf += css.slice(i, end + 1)
      i = end
      continue
    }
    if (c === '{') {
      const prelude = buf.trim()
      buf = ''
      pending.push(declared)
      declared = false
      stack.push(prelude.startsWith('@') ? '' : prelude)
      continue
    }
    if (c === '}') {
      if (declared) {
        const chain = stack.filter(Boolean)
        if (chain.length) yield chain
      }
      stack.pop()
      declared = pending.pop()
      buf = ''
      continue
    }
    if (c === ';') {
      // a declaration at this level (at-rule preludes ending in `;` have no
      // block, and their prelude starts with `@` — excluded by the check)
      if (!buf.trim().startsWith('@') && buf.includes(':')) declared = true
      buf = ''
      continue
    }
    buf += c
  }
}

const expand = (sel, parent) =>
  parent === null ? sel
  : sel.includes('&') ? sel.replaceAll('&', `:is(${parent})`)
  : `:is(${parent}) ${sel}`

const flatten = (chain) => {
  let sel = null
  for (const s of chain) sel = splitTopLevel(s).map((x) => expand(x, sel)).join(', ')
  return splitTopLevel(sel)
}

/** `{ branches, zeros }` over `dist/han.<module>.css`. */
export function countZeroSpecificity(distDir) {
  const specs = []
  for (const mod of MODULES) {
    const css = readFileSync(path.join(distDir, `han.${mod}.css`), 'utf-8')
    for (const chain of rules(css)) for (const b of flatten(chain)) specs.push(specificity(b))
  }
  return {
    branches: specs.length,
    zeros: specs.filter((s) => s.every((n) => n === 0)).length,
  }
}

/**
 * 112 → 一百一十二. Only ever needs 0–999 — it counts selector branches.
 *
 * Two conventions worth naming, because the obvious recursion gets both
 * wrong: under a hundred the tens digit is spelt out（一百一十二, never
 * 一百十二）, and a gap in the tens takes 〇（一百〇九）— which is also the
 * character the lede is punning on.
 */
export function hanNumeral(n) {
  const D = '〇一二三四五六七八九'
  const tens = (v, spellTen) => {
    const [t, u] = [Math.floor(v / 10), v % 10]
    if (t === 0) return D[u]
    return `${t === 1 && !spellTen ? '' : D[t]}十${u ? D[u] : ''}`
  }
  if (n < 100) return tens(n, false)
  const [h, rest] = [Math.floor(n / 100), n % 100]
  if (rest === 0) return `${D[h]}百`
  if (rest < 10) return `${D[h]}百〇${D[rest]}`
  return `${D[h]}百${tens(rest, true)}`
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const here = path.dirname(fileURLToPath(import.meta.url))
  const { branches, zeros } = countZeroSpecificity(path.resolve(here, '..', 'dist'))
  console.log(`選擇器分支 ${branches}，其中權重為 (0,0,0) 的有 ${zeros} 個`)
  console.log(`首頁 lede 用字：${hanNumeral(zeros)}個〇 ／ 數字 ${zeros}`)
}
