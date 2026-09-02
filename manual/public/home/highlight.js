/**
 * Syntax highlighting for station⑧'s output panes, via the CSS Custom
 * Highlight API (Baseline 2025: Chrome 105 / Safari 17.2 / Firefox 140).
 * No DOM mutation — each `<code>` stays a single pure-text node; we
 * register a Range per token under one Highlight per category and
 * colour them with `::highlight(code-*)` in `common/code.css`.
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

// Language token → RULES key. station⑧'s panes carry the canonical name on
// `pre[data-lang]`; markdown-it fences write a `language-XXX` class on the
// <code> with looser aliases (ts/typescript, sh/console…). Anything unmapped
// falls through to plain text.
const ALIAS = {
  css: 'css',
  html: 'html', xml: 'html', svg: 'html',
  js: 'js', javascript: 'js', ts: 'js', typescript: 'js',
  sh: 'bash', shell: 'bash', bash: 'bash', console: 'bash',
}

// pure: <code> → RULES key, from EITHER pre[data-lang] (panes) or the
// `language-XXX` class markdown-it emits on the <code> (docs fences).
const langOf = ($code) => {
  const raw =
    $code.parentElement?.dataset.lang
    ?? [...$code.classList].find((c) => c.startsWith('language-'))?.slice(9)
  return raw ? ALIAS[raw] : undefined
}

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

// Flat list of a subtree's text nodes with their cumulative offset into the
// concatenated textContent. NOT just `<code>.firstChild`: on the docs, han.css's
// inline fallbacks split a CJK code block's single text node — e.g. hanging
// punctuation nests a mark inside `<h-char><h-layer>、</h-layer></h-char>`, so
// `<code>` ends up TEXT · h-char · TEXT. Tokenising only the first node misses
// everything after it (a `/* … */` whose closing `*/` sits in a later node
// never matches → the whole block renders unhighlighted). We walk EVERY text
// node so a token can span across the inserted wrappers.
const textNodesOf = (root) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const out = []
  let offset = 0
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    out.push({ node: n, start: offset, end: offset + n.data.length })
    offset += n.data.length
  }
  return out
}

// (Re)highlight every matching <code>. Ranges live in the shared Highlight
// registries, so we clear them first — station⑧ rewrites every pane's text
// on each config change, which invalidates the old ranges; clearing +
// re-tokenising keeps them in sync.
export const highlightAll = (selector = 'pre > code') => {
  const r = ensureReg()
  if (!r) return
  CATS.forEach((c) => r[c].clear())
  $$(selector).forEach(($code) => {
    const lang = langOf($code)
    if (!lang) return
    const parts = textNodesOf($code)
    if (!parts.length) return
    const src = parts.map((p) => p.node.data).join('')
    tokenize(lang, src).forEach(({ cat, start, end }) => {
      // A token [start,end) into `src` may straddle several text nodes;
      // clip it onto each overlapping node and add a Range per fragment.
      for (const { node, start: ns, end: ne } of parts) {
        if (ne <= start || ns >= end) continue
        const range = new Range()
        range.setStart(node, Math.max(0, start - ns))
        range.setEnd(node, Math.min(node.data.length, end - ns))
        r[cat].add(range)
      }
    })
  })
}

export const mountCodeHighlight = (selector) => highlightAll(selector)
