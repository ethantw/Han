/**
 * Syntax highlighting for station④'s output panes, via the CSS Custom
 * Highlight API (Baseline 2025: Chrome 105 / Safari 17.2 / Firefox 140).
 * No DOM mutation — each `<code>` stays a single pure-text node; we
 * register a Range per token under one Highlight per category and
 * colour them with `::highlight(code-*)` in `controls.css`.
 * Feature-detected: where the API is missing, the code just stays
 * plain light-on-dark text — still perfectly readable, just uncoloured.
 *
 * Ported from ziano/demo/src/code/highlight.ts (same tiny sticky-regex
 * lexer, same design — TS types dropped, everything else kept as-is;
 * see that file for the fuller design rationale).
 *
 * The lexer is deliberately tiny: a per-language ordered list of
 * [category, sticky RegExp] rules, scanned left-to-right (first rule
 * that matches at the cursor wins, else advance one char as plain).
 * Enough to colour these snippets — not a parser.
 */

const $$ = (sel) => [...document.querySelectorAll(sel)]

const STRING = /'[^']*'|"[^"]*"/y

// Ordered per language — earlier rules win, so comments/strings come before
// the patterns that might otherwise eat into them.
const RULES = {
  css: [
    ['comment', /\/\*[\s\S]*?\*\//y],
    ['string', STRING],
    ['keyword', /[\w-]+(?=\s*:)/y], // property names, incl. --custom-properties
    ['number', /-?\.?\d[\d\w.%]*/y], // 250 · .25rem · 75% · 16px
    ['punct', /[{}():;,]/y],
  ],
  html: [
    ['comment', /<!--[\s\S]*?-->/y],
    ['keyword', /<\/?[\w-]+|\/?>/y], // tag open/close brackets + name
    ['attr', /[\w-]+(?==)/y], // attribute name before =
    ['string', STRING],
  ],
  js: [
    ['comment', /\/\/.*/y],
    ['keyword', /\b(?:import|from|export|default|const|let|return)\b/y],
    ['string', STRING],
  ],
  bash: [
    ['comment', /#.*/y],
    ['keyword', /\b(?:npm|npx|yarn|pnpm|i|install|add)\b/y],
    ['string', STRING],
  ],
}

const CATS = ['comment', 'string', 'keyword', 'attr', 'number', 'punct']

// pure: source → non-overlapping tokens
const tokenize = (lang, src) => {
  const rules = RULES[lang]
  const out = []
  let i = 0
  while (i < src.length) {
    const hit = rules.find(([, re]) => {
      re.lastIndex = i
      return re.test(src) && re.lastIndex > i
    })
    if (hit) {
      const [cat, re] = hit
      out.push({ cat, start: i, end: re.lastIndex })
      i = re.lastIndex
    } else {
      i += 1
    }
  }
  return out
}

// One Highlight per category, registered once and reused. Lazily created on
// first highlightAll() so the feature-detect can bail cleanly before
// touching CSS.highlights.
let reg = null
const ensureReg = () => {
  if (reg) return reg
  // Custom Highlight API — feature-detect via globalThis, degrade to plain
  // text when absent.
  if (!('Highlight' in globalThis) || !('highlights' in CSS)) return null
  reg = Object.fromEntries(CATS.map((c) => [c, new Highlight()]))
  CATS.forEach((c) => CSS.highlights.set(`code-${c}`, reg[c]))
  return reg
}

// (Re)highlight every matching <code>. Ranges live in the shared Highlight
// registries, so we clear them first — station④ rewrites every pane's text
// on each config change, which invalidates the old ranges; clearing +
// re-tokenising keeps them in sync.
export const highlightAll = (selector = 'pre[data-lang] > code') => {
  const r = ensureReg()
  if (!r) return
  CATS.forEach((c) => r[c].clear())
  $$(selector).forEach(($code) => {
    const text = $code.firstChild
    if (!(text instanceof Text)) return // expect one pure-text node per <code>
    const lang = $code.parentElement?.dataset.lang
    if (!lang || !(lang in RULES)) return
    tokenize(lang, text.data).forEach(({ cat, start, end }) => {
      const range = new Range()
      range.setStart(text, start)
      range.setEnd(text, end)
      r[cat].add(range)
    })
  })
}

export const mountCodeHighlight = (selector) => highlightAll(selector)
