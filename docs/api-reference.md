# han.css v4 — API Reference

**Status: rc0 frozen surface.** Everything listed here is the v4.0.0-rc API.
Until 4.0.0 final, changes to anything in this file go through the changelog
with a migration note — nothing listed here changes silently. Anything *not*
listed here (build internals, `dist/pass-sizes.json`, source-file layout)
is not API and may change or disappear without notice.

Pin your version during the rc period:

```bash
pnpm add @hanzi.pro/han.css@4.0.0-rc.1   # exact, no ^
```

This file is the single source of truth for tooling (including the han.css
install Skill). The prose manual is under construction; this reference is
deliberately terse and table-driven.

---

## 1. Prerequisite: `lang` attributes

han.css keys nearly everything off `:lang()`. **Without correct `lang`
attributes it silently does nothing** — this is the most common failed
install.

```html
<html lang="zh-Hant">   <!-- or zh-Hans / ja / ko -->
```

- Tag the root with the page's primary language. Tag inline foreign-language
  runs (`<span lang="ja">`) so each run gets its own punctuation convention,
  quotes and font stack.
- Selector groups used internally: `:lang(zh)` (matches both scripts; used
  where Traditional is the umbrella), `:lang(zh-Hans)`, `:lang(ja)`,
  `:lang(ko)`, and `:lang(ko-Kore)` for Hanja-mixed Korean (opts into CJK
  brackets/quotes; plain `ko` gets Western quotes).
- **Write `ko-Kore`, not a Han-flavoured subtag,** for Hanja-mixed Korean.
  `Kore` names the writing system as Korean, so system font fallback keeps
  handing the Han characters to Korean faces; a subtag that names only the
  script (`Hant`, `Hani`) leaves the engine to guess the locale from it, and
  the Hanja arrive in some other CJK locale's font while the Hangul beside
  them stays Korean — measured in
  `docs/notes/2026-08-27-lang-subtag-font-fallback.md`. BCP 47 would let the
  subtag be dropped (Korean suppresses `Kore`); han.css spells it out because
  it is what opts the run in. Bare `ko` reads as modern, Hangul-only Korean.
- Content in a language han.css doesn't target (`en`, …) is untouched — safe
  to install on multilingual sites.

**Vertical writing prerequisite.** CSS cannot condition on `writing-mode`
(style queries read custom properties only), so han.css cannot see your
vertical subtrees. Wherever you declare `writing-mode`, mirror its value:

```css
.tategaki {
  writing-mode: vertical-rl;
  --han-writing-mode: vertical-rl;   /* copy-paste the value */
}
```

Horizontal documents never touch this. An unmirrored vertical subtree is
assumed horizontal and direction-dependent behavior (zhuyin tone marks,
inter-character geometry) renders wrong there. See §4.3.

## 2. Install & load order

Three channels (all serve the same `dist/` artifacts):

```bash
pnpm add @hanzi.pro/han.css
```

```js
import '@hanzi.pro/han.css/styles'          // all four modules
// or pick modules:
import '@hanzi.pro/han.css/styles/semantics'
import '@hanzi.pro/han.css/styles/lines'
import '@hanzi.pro/han.css/styles/prose'
import '@hanzi.pro/han.css/styles/fonts'
// optional JS enhancement (see §6):
import '@hanzi.pro/han.css/auto'            // auto-install on DOMContentLoaded
// or manual:
import { installFallbacks } from '@hanzi.pro/han.css'
```

```html
<!-- CDN -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@4.0.0-rc.1/dist/han.min.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@4.0.0-rc.1/dist/han.auto.min.js"></script>
```

**Cascade layers.** The four modules live in `han-semantics` / `han-lines` /
`han-prose` / `han-fonts`. Every selector is zero-specificity (`:where()`),
so author CSS always wins even without layer management. For explicit
ordering against your own layers, declare before importing:

```css
@layer han-semantics, han-lines, han-prose, han-fonts, app;
```

When importing single-module bundles, import order = layer order;
recommended: semantics → lines → prose → fonts (matches `han.css`).

**Coexistence.** Zero-specificity selectors mean any reset/preflight loaded
*after* han.css that sets e.g. `font-family` on `:root` at normal specificity
overrides han.css. Load han.css after resets, before your own styles.

**Scoping.** han.css installs document-wide by default. To exempt a subtree,
use each feature's own off switch on an ancestor (see §4 toggles); there is
no single master kill-switch. The JS side scopes naturally:
`installFallbacks(container)`.

## 3. Bundles

CSS (each also as `.min` with source map). Figures are min+gzip, measured
2026-08-12 — the homepage's 工法站 ledger prints the same files brotli'd, from
the build, so treat that as the live number and this table as a snapshot:

| File | Contents | min+gzip |
|---|---|---|
| `han.css` | All four modules + JS-companion styles + built-in font assets (em-space calibration fonts, zhuyin font) | 3.6 KB |
| `han.semantics.css` | Semantics module (incl. JS-companion styles) | 1.4 KB |
| `han.lines.css` | Lines module (incl. JS-companion styles) | 1.1 KB |
| `han.prose.css` | Prose module | 0.4 KB |
| `han.fonts.css` | Fonts module + font assets | 1.4 KB |
| `han.basic.css` | Lean bundle: semantics + lines + prose, **CSS-only** — no fonts module, no JS-companion styles, no font assets | 1.7 KB |

Sum of the four single-module bundles ≡ `han.css`.

JS (ESM; `browser` condition in `exports` picks the `.browser` builds, which
stub out the SSR DOM dependency — import from `@hanzi.pro/han.css/ssr`, which
has no `browser` condition, whenever a bundler processes server-side code):

| File | Contents | min+gzip |
|---|---|---|
| `han.js` | Main entry: named exports only, nothing runs on import; tree-shakable (`sideEffects` declared) | 11.9 KB full, less shaken |
| `han.auto.js` | Superset of `han.js`; also runs `installFallbacks(document.documentElement)` on `DOMContentLoaded` as an import side effect; SSR-safe no-op | 12.0 KB |

Assets shipped alongside: `em-space.woff2` (420 B), `zhuyin.serif.woff2`.
The CSS references them by relative URL — keep `dist/` file layout when
self-hosting.

## 4. CSS custom properties

51 public properties. Conventions:

- **Set control properties on an ancestor** (usually `:root`), never on the
  element you want them to affect. Mode switches are read via
  `@container style()` queries, and a style query always reads an *ancestor*
  — an element cannot query its own custom properties. (Plain value
  properties like `--han-underline-offset` are ordinary inherited vars and
  don't have this restriction, but setting on an ancestor is always safe.)
- Enum-valued control properties are registered via `@property` with a closed
  syntax — typos are rejected at parse time and the default is restored.
- All zero-specificity: override any of this from ordinary author CSS.

### 4.1 Module toggles

| Property | Values | Default | Notes |
|---|---|---|---|
| `--han-semantics` | `on \| off` | `on` | Gates all of §4.3 and the adjacent-lines gap. Set `off` on an ancestor to opt a subtree out. |
| `--han-prose` | `on \| off` | off (auto-`on` inside `<article>`) | Not registered; enable other containers with `section.prose { --han-prose: on }`. |
| `--han-prose-fonts` | `on \| off` | `on` | Sub-gate: blockquote cursive font swap inside prose. Meaningless when prose is off. |

The lines module has no single toggle — its two control properties each have
an off value (`--han-text-autospace: no-autospace`,
`--han-punctuation-refinement: none`).

### 4.2 Lines (line adjustments)

| Property | Values | Default | Needs JS |
|---|---|---|---|
| `--han-text-autospace` | `normal \| insert \| replace \| strict \| no-autospace` | `normal` | `replace`/`strict` yes; `normal`/`insert` only on engines without native `text-autospace` |
| `--han-punctuation-refinement` | `auto \| compress \| hang \| none` | `auto` | hang always (no shipped native `hanging-punctuation`); compress only where `text-spacing-trim` is missing |

Value semantics:

- `--han-text-autospace` — inter-script spacing (CJK ↔ Latin/Greek/Cyrillic/
  digits, ~¼ em). Do **not** type manual spaces in content. `normal` =
  native engine autospace (JS `insertISS` covers long-tail UAs); `insert` =
  CSS-Text-4 insert semantic; `replace` = JS consumes author-typed spaces
  and substitutes a fixed-width `<h-iss>`; `strict` = insert + replace, all
  JS, native suppressed; `no-autospace` = off.
  Safari ≤ 18.x skips native autospace at seams containing inline elements;
  an install-time probe (`detectAutospaceBoundaryBug`) detects this and
  upgrades `normal` to the strict path automatically
  (root gets `--han-probe-autospace: broken`, internal).
- `--han-punctuation-refinement` — which markup the JS fallback emits.
  `auto` = fill only what the engine lacks (per `CSS.supports`); SSR emits
  both compress + hang wrappers in one pass. `compress` / `hang` = force one
  kind regardless of native. `none` = no JS punctuation work.
  Native baseline set by the module: `text-spacing-trim: trim-start` on
  `:root`; `none`/`hang` flip it to `space-all` (the un-squeezed baseline).

**Hanging auto-criterion** (`auto` mode): hanging follows each language's
punctuation convention — centered glyphs don't hang, edge-biased glyphs do.
Per locale: everything except `MOE` hangs; for `hant` with punctuation `off`
the decision refines by `--han-use-heritage-glyphs-for-hant` (`webfont` and
`off` = centered → no hang; `system-ja` = edge-biased → hang). Bypass the
whole criterion by declaring `hang` or `compress` explicitly. Derived state
lives in `--han-state-hanging-punctuation` (internal — read-only).

### 4.3 Semantics

| Property | Values | Default | Applies to |
|---|---|---|---|
| `--han-em-symbol` | any `text-emphasis` value (`circle \| dot \| sesame \| triangle` …) | `circle` | `<em>` emphasis marks (著重號) |
| `--han-em-dot-position` | any `text-emphasis-position` value | `under right` (ja: `over right`) | `<em>` |
| `--han-cite-title-marks` | `none \| bracket \| wavy` | `none` | `<cite>` title marks (書名號): `bracket` = 《》/〈〉 via quotes (ja/ko-Kore: 「」/『』); `wavy` = wavy underline (甲式, zh only) |
| `--han-title-marks` | quote-char sequence | `《》〈〉` (ja/ko-Kore: re-pointed to `--han-quotes`) | `<cite>` bracket glyphs |
| `--han-q-quotes` | `on \| off` | `on` | `<q>` quotation marks (引號): whether they are drawn at all. The switch half of the pair `--han-quotes` completes — glyphs there, on/off here. Prefer it over `q { quotes: none }`: only a queryable value keeps the hanging-punctuation pass in step (a mark ending a `<q>` stops hanging because a close bracket follows it) |
| `--han-quotes` | quote-char sequence (outer pair, inner pair) | `“”‘’`; `en-GB`: `‘’“”`; zh/ja/ko-Kore: `「」『』`; zh-Hans & plain ko: `“”‘’` | `<q>` |
| `--han-writing-mode` | `horizontal-tb \| vertical-rl \| vertical-lr` | `horizontal-tb` | **Library-wide writing-mode mirror** (see §1 prerequisite) — declare alongside every `writing-mode`, same value. Consumed by direction-dependent behavior (zhuyin, below); retires when arbitrary-property style queries ship |
| `--han-zhuyin-ruby-position` | `over \| inter-character` | `over` | `ruby.zhuyin`/`ruby.mps`: `over` = interlinear; `inter-character` = side-run bopomofo (Taiwan textbook, recommended for horizontal). Tone-mark form is automatic per combination (`salt` in horizontal `over`, font `vert` chain elsewhere); in a mirrored vertical subtree `inter-character` stands down to `over` on all engines. Requires the `--han-writing-mode` mirror on vertical subtrees |
| `--han-underline-offset` | `<length>` | `.125em` | all underlined elements |
| `--han-text-decoration-inset` | `<length> \| auto` | `auto` | adjacent decoration lines (native path, Firefox only today) |
| `--han-adjacent-lines-skip-gap-fallback` | `<length>` | `.125em` | gap between adjacent underlined/struck elements on engines without `text-decoration-inset` |
| `--han-structural-indent` | `<length>`, **one value** | `2em` | Shared start-edge grid for `<blockquote>`, `<figure>`, `<ol>`/`<ul>` and `.poem-like` (縮二字). Applied when the **parent** is CJK, not the element — a grid belongs to its container, so an `<ol lang="zh">` inside an English section keeps the UA's indent. Setting `0` keeps the rules and zeroes them; `--han-semantics: off` hands the UA's 40px back. Deliberately unregistered: a registered `<length>` absolutises where it is declared and the indent would stop scaling with font-size |
| `--han-structural-indent-blockquote` | 1–2 `<length>` | falls back to the grid, symmetric | Per-element override. Its point is the language gate: an author's own `blockquote {…}` rule cannot inherit "only when the container is CJK" without restating it |
| `--han-structural-indent-figure` | 1–2 `<length>` | falls back to the grid, symmetric | |
| `--han-structural-indent-list` | 1–2 `<length>` | falls back to the grid, **start edge only** | `<ol>`/`<ul>`, via `padding-inline` |
| `--han-structural-indent-poem` | 1–2 `<length>` | falls back to the grid, **start edge only** | `.poem-like` paragraphs |

Non-configurable behaviors under `--han-semantics: on` (opt out only via the
module toggle): pseudo-italic cancellation on all CJK text (`font-style:
inherit` — synthesized skew died, author-intended italics survive), `<dfn>`
bolder, `<i>`/`<var>` cursive family, zhuyin ruby font/orientation
(`ruby.zhuyin` / `ruby.mps` — position IS configurable, see
`--han-zhuyin-ruby-position` above; `inter-character` mode uses native
`ruby-position: inter-character` on Safari 18.2+, absolute-positioning
fallback elsewhere), document font-family (unconditional; declared at
`:root`, `body`, and every `[lang]` boundary so per-locale stacks
re-resolve at each language switch — see §4.4 role vars).

Overriding a per-element knob with a *single* value indents both edges, even
where the default indents only the start — that is what a one-value
`margin-inline` / `padding-inline` means. Write `2em 0` to keep the
start-only shape. The shared grid value takes one length only: each consumer
splices it into its own shorthand, so a second length expands to `2em 0 0` at
the start-only sites and silently drops those declarations.

### 4.4 Fonts

**Mode switches** (enum, `@property`-registered, set on an ancestor):

| Property | Values | Default | Scope |
|---|---|---|---|
| `--han-punctuation-hant` | `JIS \| MOE \| GB \| KLR \| off` | `MOE` | `:lang(zh)` |
| `--han-punctuation-hans` | same | `GB` | `:lang(zh-Hans)` |
| `--han-punctuation-ja` | same | `JIS` | `:lang(ja)` |
| `--han-punctuation-ko` | same | `KLR` | `:lang(ko)` |
| `--han-use-heritage-glyphs-for-hant` | `webfont \| system-ja \| off` | `webfont` | `:lang(zh-Hant)` |
| `--han-use-heritage-glyphs-for-hans` | `webfont \| off` | `off` | `:lang(zh-Hans)` |
| `--han-use-heritage-glyphs-for-ja` | `webfont \| off` | `off` | `:lang(ja)` |
| `--han-use-heritage-glyphs-for-ko` | `webfont \| off` | `off` | `:lang(ko)` |
| `--han-webfont-heritage-family` | `shanggu \| genki` | `shanggu` | global; use `shanggu` whenever Korean is present (genki hangul: 2350 KS X 1001 only, no Jamo) |
| `--han-use-cursive` | `webfont \| system \| off` | `webfont` | Kaiti layer of `--han-font-accent` |

Punctuation conventions are decoupled from locale — any convention is legal
for any language (JIS = sentence-end marks trailing-edge; MOE = all centered;
GB = eight principal marks trailing-edge; KLR = W3C KLReq, bracket family
flush, upright `！？：；`/middle dots in vertical). Requires the Diantenjeom
webfont (§7); `off` falls through to the body font's own punctuation.

Heritage glyph caveat: these webfonts draw 傳承字形 (heritage/orthodox)
forms, **not** JIS 新字体 or GB standard shapes. Right choice as a unifying
face for mixed-script pages; keep `off` where national-standard glyph
compliance matters.

**Swap slots** (plain vars, override freely):

| Property | Default |
|---|---|
| `--han-webfont-heritage-glyphs-sans` | `'Shanggu Sans', 'Shanggu Sans Yue'` |
| `--han-webfont-heritage-glyphs-serif` | `'Shanggu Serif', 'Shanggu Serif Yue'` |
| `--han-webfont-cursive-hant` | `'LXGW WenKai TC'` (e.g. swap to `'Iansui'`) |
| `--han-font-latin-sans` | `'Avenir Next', 'Segoe UI Variable', 'Segoe UI', Roboto` |
| `--han-font-latin-serif` | `Palatino, Cambria` |
| `--han-font-latin-cursive` | `var(--han-font-latin-serif)` |
| `--han-font-latin-mono` | `ui-monospace, Menlo, Consolas` |

**Low-level slots** (usually driven by the mode switches; direct override
possible): `--han-font-punctuation-{sans,serif,cursive}`,
`--han-font-cjk-{sans,serif,cursive}`. Registered with sentinel initial
value `HanNone` (matches no real font) so an unconfigured layer is skipped
instead of invalidating the whole composite `font-family`.

**Composites** (assembled per element on `:where(*)`; each = punctuation
layer → Latin layer → CJK layer → generic):

| Property | Generic tail |
|---|---|
| `--han-system-ui` | `system-ui, sans-serif` |
| `--han-sans` | `sans-serif` |
| `--han-serif` | `serif` |
| `--han-cursive` | `cursive, serif` |
| `--han-monospace` | `monospace` |

`--han-monospace` deliberately has **no punctuation layer** (code must show
characters verbatim — punctuation-face glyph swaps would tamper with the
sample) and borrows the **sans** CJK slot (no monospace CJK webfont exists;
Han glyphs at least follow the site's heritage choice). Not consumed by any
library rule — style your own `code`/`pre` with it.

**Role vars** (what elements actually consume; re-point these to switch the
document between sans and serif):

| Property | Default | Used by |
|---|---|---|
| `--han-font-default` | `var(--han-system-ui)` | document root, most elements |
| `--han-font-alternative` | `var(--han-serif)` | serif/Mincho counterpart |
| `--han-font-accent` | `var(--han-cursive)` | `<i>`, `<var>`, prose blockquote |
| `--han-font-zhuyin-serif` | `'Han Zhuyin Serif', cursive, serif` | zhuyin `<rt>` |

```css
/* Mincho (serif) as the document default: */
:root { --han-font-default: var(--han-serif); }
```

Without the fonts module (`han.basic.css`), semantics.css declares safe
generic-only fallbacks for the composites and role vars on `:root`.

### 4.5 Prose

| Property | Values | Default |
|---|---|---|
| `--han-prose-consecutive-headings-a-block-end` | `<length>` | `0` |
| `--han-prose-consecutive-headings-b-block-start` | `<length>` | `0` |

Applied inside any `--han-prose: on` container: consecutive-heading margin
collapse, and the blockquote cursive swap (gated by `--han-prose-fonts`).
Both are block-axis rhythm, and both are article-scoped on purpose.

Block indentation is **not** here — it is a semantics-module grid, gated by
`--han-semantics` and applied wherever the container is CJK. See
`--han-structural-indent` in §4.3.

han.css sets no `text-align`. If you justify your own prose, give any
`pre-wrap` `<pre>` inside it `text-align: start` — justify stretches
inter-token gaps in wrapped code.

### 4.6 Internal — not API

`--han-probe-autospace`, `--han-state-hanging-punctuation`. Written by the
library at runtime (probe result / derived hanging state). Do not set;
reading is unsupported.

## 5. Markup contract

**Custom elements han.css emits** (JS fallbacks only; all inert, invisible
to copy-paste and AT; removed cleanly by `uninstallFallbacks`):

| Element | Emitted by | Meaning |
|---|---|---|
| `<h-char data-punct="…">` | `refinePunctuation` | punctuation wrapper; `data-punct` tokens: `open`, `close`, `end`, `middle`, `hangable`, `consecutive` (+ `data-consecutive-pos`, `data-followed-by`) |
| `<h-layer>` | `refinePunctuation` | zero-width inline-block hang layer inside `<h-char>` — baseline-aligned, glyph overflows past the collapsed line-end spacer |
| `<h-iss>` | `applyISS` | inter-script spacer; `data-mode="replace"` marks a consumed author space |
| `[data-followed-by-quote]`, `q[data-followed-by]`, `cite[data-followed-by]` | `markQuoteBoundaries` | quote-boundary markers (attributes, not elements). `<q>`/`<cite>` draw their CJK brackets from `::before`/`::after`, so those glyphs are invisible to the punctuation pass; the tokens name which boundary a mark abuts, nearest bracket first (`close-cite close-q`, `open-q`), and CSS decides per `--han-cite-title-marks` + `:lang()` whether a bracket is actually painted. `data-followed-by="hangable"` on the element itself is the mirror: its generated close bracket meets a hangable mark and pays the half em from `::after` |
| `[data-followed-by-adjacent-line]`, `[data-followed-by-adjacent-wavy]`, `[data-adjacent-lines-refined]` | `markAdjacentLines` | adjacent decoration-line gap markers (attributes, not elements). `-line` = straight-line families (`u`+`ins`, `s`+`del`), gap in every mode; `-wavy` = pairs involving `<cite>`, gap only under `--han-cite-title-marks: wavy` (the one mode where `<cite>` draws a line); `-refined` = "this subtree was processed", read off an ancestor so the pure-CSS `:has()` fallback stands down |

**Native elements han.css styles** (semantics module): `cite`, `em`, `i`,
`var`, `dfn`, `q`, `u`, `ins`, `s`, `del`, `ruby`/`rt`, `blockquote`,
`figure`, `p`, `h1`–`h6`, `ol`/`ul` (prose module for the last five).

**Author classes with meaning**: `ruby.zhuyin` / `ruby.mps` (zhuyin
ruby — one base character per ruby; `rt.zhuyin`/`rt.mps` also
recognized; position per `--han-zhuyin-ruby-position`), `.poem-like`
(prose), any container you give `--han-prose: on`.

**Skip zones.** JS wrappers never enter `<math>` or `<svg>` (MathML Core UA
styles would break the line into blocks; SVG doesn't render unknown
children) nor code-like contexts (`code`, `kbd`, `samp`, `pre`) for ISS.
Vertical writing: all styles use logical properties; the punctuation
webfonts handle vertical forms via their own cmap.

## 6. JavaScript API

> **工作台頁**：`manual/demo/punctuation.html` — 跑起 `pnpm --filter han-manual
> dev` 後開 `/demo/punctuation.html`。四種模式並排、逐格印出實際產出的標記、
> 所有 cascade 開關現場可切，並標出哪些開關會重跑 pass、哪些只動 CSS。


Import from `@hanzi.pro/han.css` (nothing auto-runs) or
`@hanzi.pro/han.css/auto` (same exports + auto-install side effect).

The CSS in §3's non-`basic` bundles includes the companion styles that make
the emitted markup do anything — JS without the companion CSS is inert, and
vice versa.

**Idempotency & SPA note.** `installFallbacks` mutates the DOM in place.
Don't re-run it over already-processed content; for SPA route changes, run
it once against the newly-mounted container
(`installFallbacks(containerEl)`), or `uninstallFallbacks` first. Content
rendered *after* install is not watched — there is no MutationObserver; new
content needs its own call.

**SSR.** Every transform runs in Node against a string/DOM source and
returns a `Hype` (from `hyperly`) that serializes back to HTML. In SSR,
transforms run unconditionally (browser CSS decides at delivery time which
wrappers become load-bearing). The browser build stubs the DOM dependency —
bundle size stays JS-only.

Import from **`@hanzi.pro/han.css/ssr`** in anything a bundler processes. The
main entry carries a `browser` condition, and tools that bundle "for the
browser" pick it even when the output runs on a server — you then get the
stubbed DOM and a throw on first call. The `/ssr` subpath has no `browser`
condition, so every resolver lands on the Node build. Plain `node` needs no
special path; `/ssr` is simply always correct.

Requires Node: the DOM is parsed by happy-dom, which needs
`vm.Script.runInContext`. That rules out workerd today — Cloudflare Workers /
Pages Functions throw `[unenv] Script.runInContext is not implemented yet!`,
and the wall is in the dependency chain, not the framework, so a Next.js app on
workerd hits it too. Vercel Functions (Node runtime) and ordinary Node servers
are fine.

**Where the "refined" stamp lands.** `[data-adjacent-lines-refined]` is read off
an ANCESTOR, and hyperly serializes a fragment source as its container's
`innerHTML` — so a stamp on that container would not survive. The passes
therefore stamp the fragment's own top-level elements (`installFallbacks(
'<main>…</main>')` → the `<main>`), skipping han.css's own `<h-char>` / `<h-iss>`
wrappers. Known edge: if a top-level child IS a `<u>` / `<cite>`, the revoke rule
wants a proper ancestor and an element is not its own ancestor — wrap the
fragment in a container.

### High level

```ts
installFallbacks(): Hype                       // browser: document.documentElement
installFallbacks(root: Element): Hype          // browser: scoped
installFallbacks(src: string | Hype): Hype     // SSR: requires explicit source
```
Runs, in order: `refinePunctuation` → `markQuoteBoundaries` →
`applyISSWithProbe` → `markAdjacentLines`. Browser passes gate on `CSS.supports` + the cascade
vars (`--han-punctuation-refinement`, `--han-text-autospace`); SSR runs them all
unconditionally (`auto` / — / `strict` / `auto`; the quote-boundary pass has
no mode of its own). Large documents are
chunked internally (§9) — no size ceiling for callers.

```ts
uninstallFallbacks(root?: Hyperly): void
```
Fully reverses all DOM mutations (restores consumed spaces, unwraps
`<h-char>`, removes `<h-iss>` and marker attributes). Works on any subtree,
prior install not required.

```ts
transpileRuby(src: Hyperly): Hype
```
Opt-in down-leveler for W3C tabular ruby (`<rb>`/`<rtc>`, `rbspan`,
multi-`<rt>`) into the interop nested form engines render today. **Not**
called by `installFallbacks` — call it yourself (once at SSR/build time, or
after load). Idempotent. Throws on structural mismatches (rbspan overflow,
rt/base count mismatch) so authoring errors surface.

### Per-pass (tree-shakable)

| Pass | Apply | With explicit mode | Set cascade var only | Mode type |
|---|---|---|---|---|
| Punctuation 標點擠壓／懸掛 | `refinePunctuation(src)` | `refinePunctuationWithMode(mode)(src)` | `setPunctuationRefinementMode(mode)(src)` | `RefineMode = 'auto' \| 'compress' \| 'hang' \| 'none'` |
| Inter-script spacing 混排間隙 | `applyISS(src)`, `applyISSWithProbe(src)` | `applyISSWithMode(mode)(src)` | `setISSMode(mode)(src)` | `ISSMode = 'normal' \| 'insert' \| 'replace' \| 'strict' \| 'none'` |
| Quote boundaries 引號邊界 | `markQuoteBoundaries(src)` | — (no mode; CSS gates on `--han-cite-title-marks` + `:lang()`) | — | — |
| Adjacent lines 鄰行間距 | `markAdjacentLines(src)` | `markAdjacentLinesWithMode(mode)(src)`, `markAdjacentLinesWithSelectors(selectors)(src)` | `setDecorationInsetMode(mode)(src)` | `DecorationInsetMode = 'auto' \| '0'` |

Shapes: plain `apply` reads the declared cascade var and self-gates;
`WithMode` forces a literal mode (declared `hang` = hang without squeeze;
the squeeze-aware auto-downgrade lives only in the plain entry);
`set*Mode` writes the `--han-*` var as an inline style and does no DOM work.
All are curried `(config) => (src: Hyperly) => Hype` except the plain
applies, which are `(src: Hyperly) => Hype`.

`applyISSWithProbe` = `applyISS` + memoized Safari boundary-bug probe
(`detectAutospaceBoundaryBug`) — prefer it in browsers.

Per-pass calls do NOT chunk internally — on documents that may exceed
~7,500 nodes wrap them: `runPassChunked(root, pass)` (§9).

Exported constants (advanced): `PUNCT_OPEN_CHARS`, `PUNCT_CLOSE_CHARS`,
`PUNCT_END_EXTRA`, `PUNCT_MIDDLE_CHARS`, `PUNCT_INTERPUNCT_CHARS`,
`ALL_PUNCT`, `HANGABLE_CHARS`, `isValidMode`, selector/attribute constants
(`ADJACENT_LINES_REFINED`, `FOLLOWED_BY_ADJACENT_LINE`,
`FOLLOWED_BY_ADJACENT_WAVY`, `SELECTORS_FOR_ELEMENTS_WITH_LINES`,
`ADJACENT_LINE_PAIRING_RULES`, `FOLLOWED_BY_QUOTE`, `QUOTE_GENERATOR_TAGS`), chunking helpers (`runPassChunked`,
`forEachChunk`, `CHUNK_NODE_LIMIT`). Types: `RefineMode`, `ISSMode`,
`DecorationInsetMode`.

`markAdjacentLinesWithSelectors` accepts either bare selector strings (same
family, marked `[data-followed-by-adjacent-line]`) or full pairing rules
`{ subject, next, attr }` — the shape `ADJACENT_LINE_PAIRING_RULES` is made of.
Pass that constant plus your own rules to extend the defaults instead of
restating them.

## 7. Web fonts (delivery is yours)

The fonts module defines **family names and stacks only**; woff2 delivery is
the consumer's choice. Everything below is OFL-licensed — self-hosting means
shipping the license text too (packages include it; see each package's
`LICENSE`, and this repo's `LICENSE-FONTS` for the bundled assets).

| Layer | Package | Note |
|---|---|---|
| Heritage CJK (尚古) | `@hanzi.pro/webfonts-shanggu-{sans,serif}` + `…-yue` variant | ziano `unicode-range` slices; frequency-ordered, on-demand download |
| Heritage CJK (源起) | `@hanzi.pro/webfonts-genki-{sans,serif}` + `…-yue` | smaller; weak hangul — not for Korean |
| Punctuation | `@hanzi.pro/diantenjeom` **≥ 0.2.0** | 0.1.0 family names end in `… KV`, mismatching v4's `… KLR` → silent fallback. Whole bundle or per-convention (`dist/moe.css` etc.) |
| Kaiti | `@hanzi.pro/webfonts-lxgw-wenkai-tc` (zh-Hant), `…-lxgw-wenkai` (zh-Hans), `…-iansui`, `…-klee-one` | zh/ja cursive layer; swap via `--han-webfont-cursive-hant` |
| Emphasis marks | `Diantenjeom Emphasis` (in diantenjeom) | no `unicode-range`; must be placed **first** in the `<em>` font stack by the author — browsers don't per-glyph-fallback emphasis-mark fonts |

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/webfonts-shanggu-sans@latest/swap.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/webfonts-shanggu-sans-yue@latest/swap.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/diantenjeom@0.2.0/dist/diantenjeom.css">
```

Self-hosting: copy the packages' `dist/`, keep relative layout, serve woff2
with long-lived immutable cache headers; CORS headers required if fonts are
on another origin (fonts are CORS-gated). No webfonts at all is a valid
configuration: `--han-use-heritage-glyphs-for-hant: system-ja` +
punctuation `off`.

Vertical-baseline note: ziano & diantenjeom ≥ 0.2.0 normalize hhea/usWin so
the vertical central baseline lands at 0.380em uniformly. Don't add
`ascent-override` on top (Safari ignores it; the font files already carry
the fix).

## 8. Feature ↔ requirement matrix

| Feature | Pure CSS? | JS? | Webfont? | Native property (when present, JS yields) |
|---|---|---|---|---|
| Pseudo-italic cancel, `<dfn>`/`<i>`/`<var>`, quotes, title marks | ✔ | — | — | — |
| Emphasis marks `<em>` | ✔ | — | optional (`Diantenjeom Emphasis`) | `text-emphasis` (universal) |
| Zhuyin ruby (`over` default / `inter-character` opt-in; tone-mark form auto via `salt`/`vert`) | ✔ | optional `transpileRuby` for `<rtc>`/tabular sources | bundled `zhuyin.serif.woff2` | inter-character mode: `ruby-position: inter-character` (Safari 18.2+; CSS fallback elsewhere); vertical needs the `--han-writing-mode` mirror |
| Underline offset / adjacent-lines gap | ✔ | optional (`markAdjacentLines` refines) | — | `text-decoration-inset` (Firefox) |
| Prose block-axis rhythm (headings, blockquote font) | ✔ | — | — | — |
| Structural indent grid (blockquote/figure/lists) | ✔ | — | — | — |
| Inter-script spacing | ✔ (modern engines) | long-tail UAs + `replace`/`strict` modes + Safari seam bug | bundled em-space fonts (for JS path) | `text-autospace` (Chromium/WebKit/Gecko modern) |
| Punctuation compress 擠壓 | ✔ (Chromium) | engines without `text-spacing-trim` | bundled em-space fonts (JS path) | `text-spacing-trim` |
| Punctuation hanging 懸掛 | ✘ | **always JS** | bundled em-space fonts | none shipped (property exists in spec only) |
| Per-locale punctuation conventions | ✔ | — | **Diantenjeom ≥ 0.2.0 required** | — |
| Heritage glyphs / Kaiti | ✔ | — | ziano slices (or `system-ja` escape hatch) | — |

Style queries (`@container style()`) gate most CSS behavior; Firefox
doesn't support them yet, so toggle-gated styles simply don't fire there —
graceful degradation, not breakage. han.css targets modern evergreen
browsers; features degrade individually per the matrix.

## 9. Known limitations (rc0)

- **Atomic inline boxes** (`inline-block`/`inline-flex`/`inline-grid`):
  Chrome treats the box start as a line start — `text-spacing-trim:
  trim-start` on `:root` halves a full-width opening bracket that begins
  such a box. Fix per box: `text-spacing-trim: space-first`. Applies to any
  inline element you promote for transforms/decoration.
- **`text-align: justify` + wrapped `<pre>`**: han.css sets no alignment, but
  if you justify prose yourself, wrapped code needs `text-align: start` —
  see §4.5.
- **Hanging + `::first-line`**: the hang layer is an atomic inline, and
  first-line styles don't inherit into atomic inline contents — so
  `::first-line` styling won't reach a hung mark. (`::selection`,
  Custom Highlight API, structural selectors unaffected.)
- **`installFallbacks` is one-shot**: no MutationObserver; dynamically
  inserted content needs an explicit call.
- **Large documents: `installFallbacks` chunks automatically.** The DOM
  walk recurses per node and a single straight call over roughly **7,500+
  nodes** would throw `RangeError: Maximum call stack size exceeded`
  (measured 2026-08-05, Chromium; threshold is node COUNT, not nesting
  depth) — and fail *partially*, leaving the page merely under-refined.
  `installFallbacks` therefore splits the work internally at element-only
  tree levels (never inside inline flow, so punctuation look-ahead and
  `markAdjacentLines` sibling pairs stay intact; `src/ts/helpers/chunk.ts`).
  No caller action needed. Callers assembling their own pass set from the
  named exports must chunk too — wrap each pass with `runPassChunked`:

  ```js
  runPassChunked(root, refinePunctuation)   // instead of refinePunctuation(root)
  ```

  (`forEachChunk`/`CHUNK_NODE_LIMIT` are exported for lower-level use;
  `runPassChunked` additionally keeps pass-synced inline `--han-*` vars off
  the chunk elements so later `:root` config changes still inherit through.)
- **Quote marks removed outside the switches**: han.css revokes the hang on
  a mark that ends a `<q>`/`<cite>` because a generated close bracket follows
  it, and it learns that a bracket is gone only from a style-queryable value
  — `--han-q-quotes`, `--han-cite-title-marks`, `--han-semantics`. Suppress
  the marks any other way (`q { quotes: none }`, `content: none` on the
  pseudo) and CSS cannot see it: computed `content` reports the
  `open-quote`/`close-quote` keyword either way. The mark then stops hanging
  with nothing after it. `--han-quotes: none` is not an off switch either —
  han.css re-declares that variable per element under `:where(:lang(zh), …)`,
  so an ancestor's value never reaches the `<q>` (measured 2026-08-11).
- **Style-query switches must be set on an ANCESTOR**, never the element
  they govern: `--han-q-quotes` on a `<q>`, or `--han-cite-title-marks` on a
  `<cite>`, leaves that element's own pseudo-elements unchanged (the query
  reads the container) while descendants — including the punctuation
  wrappers inside it — do see the new value, so the two halves disagree.
- **Style queries in Firefox**: toggle-gated CSS inert until Gecko ships
  `@container style()`.
- **`<rtc>`/tabular ruby**: not rendered by any engine; run `transpileRuby`.
- **Unmirrored vertical subtrees**: han.css cannot read `writing-mode` and
  assumes horizontal — zhuyin tone marks get the horizontal `salt` form and
  the inter-character fallback geometry doesn't stand down. Not detectable,
  not repairable from CSS; declare the `--han-writing-mode` mirror (§1).

## 10. Versioning & migration

- rc period: **pin exact versions**. Breaking changes land only in rc bumps,
  each with a changelog migration note.
- From v3: see `manual/src/docs/migration.md` (auto-install became opt-in
  via the `/auto` entry; `Han.init()` → `installFallbacks`; class-based
  toggles → `--han-*` custom properties; …).
- The install Skill records its choices in a committed config file; re-run
  it after upgrading to migrate a configuration.
