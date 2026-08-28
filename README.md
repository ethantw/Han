# 漢字標準格式 Han.css

**English** · [繁體中文](./README.zh-Hant.md) · [日本語](./README.ja.md) · [한국어](./README.ko.md)

**Movable type within the pixels.** A CSS typography set curated for CJK
web pages: punctuation that compresses and hangs at the line edge, emphasis
dots beside the text, zhuyin and pinyin ruby, hair-width gaps between scripts,
heritage glyph forms — the craft of the metal-type era, recreated on screen
with CSS custom properties and a little JavaScript fallback.

v4 is a ground-up rewrite on the native platform: **no CSS preprocessor, no
required JavaScript (though it sharpens the finer details).** The library is
four independent CSS modules plus one optional
JavaScript companion, and every feature is switched and tuned through a
`--han-*` custom property.

```
pnpm add @hanzi.pro/han.css
```

```js
import '@hanzi.pro/han.css/styles'   // all four modules
import '@hanzi.pro/han.css/auto'     // optional JS companion (fallbacks)
```

Or straight from a CDN, no build at all:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest/dist/han.min.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest/dist/han.auto.min.js"></script>
```

That is the whole setup — semantic HTML now typesets itself. `<em>` gets
emphasis dots, not italics; `<cite>` gets title marks; punctuation squeezes and
hangs; runs of Han and Latin get their proper spacing.

## The mental model

Three things, and you know the library.

### 1. Four modules, one job each

| Module | Cascade layer | What it does |
|--------|---------------|--------------|
| **Semantics** | `han-semantics` | How semantic elements should look under Han typography — emphasis dots, title marks, proper-noun marks, ruby, the shared indent grid for quotes and lists (`--han-structural-indent`); and no fake italics |
| **Lines** | `han-lines` | The measure within a line — punctuation compression, end-of-line hanging, inter-script spacing |
| **Prose** | `han-prose` | Block-axis rhythm — spacing between headings and the text they belong to; the cursive blockquote face |
| **Fonts** | `han-fonts` | Font stacks and webfonts — heritage glyph forms, punctuation faces, cursive families |

Each lives in its own cascade layer and can be used alone. Import the whole set
or pick modules:

```js
import '@hanzi.pro/han.css/styles/semantics'
import '@hanzi.pro/han.css/styles/lines'
import '@hanzi.pro/han.css/styles/prose'
import '@hanzi.pro/han.css/styles/fonts'
```

### 2. Every feature is a CSS custom property

Set a `--han-*` property on any selector and the feature applies within that
scope. This is not something Han.css invents — it is native inheritance and
style queries (`@container style()`):

```css
/* switch every emphasis mark to sesame dots, document-wide */
:root { --han-em-symbol: sesame; }

/* turn off punctuation refinement (squeeze + hang) in one region */
.quoted-legacy-text { --han-punctuation-refinement: none; }
```

No class names to memorise, no JavaScript API to call: the selector is the
scope, the property is the switch. Style queries read **ancestors**, so set
these on an ancestor (or `:root`) of the content you are targeting. Each
module's page lists its full property table.

### 3. Specificity is zero

Every rule ships inside `:where()`, so its specificity is zero. Any rule of
yours — even a bare element selector — overrides the framework; with `@layer`,
module ordering is yours as well:

```css
@layer han-semantics, han-lines, han-prose, han-fonts, app;
```

## The JavaScript companion is optional

The library is fully usable without it. The four modules' core features are
pure CSS; `installFallbacks` only covers what engines do not yet do natively —
the DOM-level fallback for punctuation compression and hanging, inter-script
spacing where `text-autospace` is unimplemented, and adjacent-underline
marking. Each transform is gated by `CSS.supports` and runtime probes, and
steps aside as engines catch up.

```js
import '@hanzi.pro/han.css/auto'                 // auto-install on DOMContentLoaded

import { installFallbacks } from '@hanzi.pro/han.css'
installFallbacks(document.body)                  // or control timing and scope
```

If inline typographic detail matters to you, load `auto`; if you only need
semantic styles and prose rhythm, pure CSS suffices.

## Webfonts (heritage glyphs)

The fonts module defines the stacks and family names; **delivery** of the
heritage-glyph woff2 (尚古黑體 / 明體 and friends) is your choice. The simplest
is the sliced **ziano** CDN subsets:

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/webfonts-shanggu-sans@latest/swap.css">
```

Or opt out entirely — `--han-use-heritage-glyphs-for-hant: system` falls back to
system fonts.

## Bundle map

| File | Contents |
|------|----------|
| `han.css` | The full set — four modules + JS-companion styles + bundled font assets (em-space calibration face, zhuyin face) |
| `han.{semantics,lines,prose,fonts}.css` | Per-module bundles, each in its own cascade layer; the four sum to the full set |
| `han.basic.css` | Slim — the pure-CSS parts of semantics + lines + prose; no fonts module, no JS-companion styles, no font assets |
| `han.js` | JS entry (ESM), named exports only, no auto-run |
| `han.auto.js` | Auto-install entry; re-exports the full API |

Every file ships a `.min` variant and a source map.

## Browser support

Modern evergreen browsers. The core mechanisms (style queries, `:where()`,
`@layer`, `@property`) track recent Baseline; engine gaps in inline typography
(`text-autospace`, `text-spacing-trim`) are filled on demand by the JavaScript
companion.

## Migrating from v3

v4 retires the v3 JavaScript runtime wholesale — each feature is superseded
by native browser or font behaviour, with the optional companion filling
only what engines still lack. The dropped API, and what replaces it:

| v3 | Superseded by |
|----|---------------|
| `Han.init()` / `Han(ctx).render()` | Nothing to boot — the CSS applies on load; `installFallbacks()` (or the `/auto` entry) only if you want the JS fallbacks |
| `renderHWS()` — inter-script spacing | Native `text-autospace`; `<h-iss>` fallback via `installFallbacks()` |
| `renderJiya()` / `renderHanging()` — punctuation squeeze / hanging | Native `text-spacing-trim` / `hanging-punctuation`; JS fallback meanwhile |
| `renderEm()` / `renderElem()` | Pure CSS — the semantics module |
| `renderDecoLine()` | `text-decoration-inset`, with CSS / JS adjacent-lines fallbacks |
| `renderRuby()` / `substCombLigaWithPUA` | Native `ruby-position` + the zhuyin font's GPOS; `transpileRuby()` down-levels legacy `<rb>` / `<rtc>` markup |
| `locale/normalize` — regional glyph variants | The OpenType `locl` feature on `lang`-aware fonts |
| `jinzify` | `text-justify: inter-character` |
| `Han.support` / `Han.detectFont()` | `CSS.supports()` + the built-in probes (`runProbes`) |

The v3 classes went the same way — `.han-init` → the `/auto` entry, `.pn` →
a bare `<u>`. Step-by-step guide, Sass-variable table included:
[hanzi.pro/manual/migration.html](https://hanzi.pro/manual/migration.html).

## Documentation

Full docs and an interactive playground — paste your text, flip the panel, copy
the generated setup — live at **[hanzi.pro](https://hanzi.pro)**. The reference
manual is currently authoritative in Traditional Chinese; English covers the
introduction and install, with Japanese and Korean on the way.

## License

[MIT](./LICENSE) © 2012–2026 Chen Yijun. The bundled 注音 webfont is a
repackaged BopomofoRuby1909 (© 2018 But Ko), OFL 1.1 — see
[LICENSE-FONTS](./LICENSE-FONTS). Heritage webfonts are delivered
separately and carry their own upstream licenses; see each font package.
