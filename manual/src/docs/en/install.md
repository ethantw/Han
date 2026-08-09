---
title: Install & enable
---

# Install & enable

Three ways in: npm, CDN, or inline. The homepage [playground](/en/#station-snippet) generates all of the code below live, matched to your panel configuration.

## npm

```bash
pnpm add @hanzi.pro/han.css
```

```js
// everything (all four modules)
import '@hanzi.pro/han.css/styles'

// or pick modules
import '@hanzi.pro/han.css/styles/semantics'
import '@hanzi.pro/han.css/styles/lines'
import '@hanzi.pro/han.css/styles/prose'
import '@hanzi.pro/han.css/styles/fonts'
```

Optional JavaScript companion:

```js
// auto-install on DOMContentLoaded, zero calls
import '@hanzi.pro/han.css/auto'

// or control timing and scope yourself
import { installFallbacks } from '@hanzi.pro/han.css'
installFallbacks(document.body)
```

## CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest/dist/han.min.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest/dist/han.auto.min.js"></script>
```

Per-module bundles exist too (`dist/han.semantics.min.css` etc.); the four sum to exactly the full bundle. A slim `han.basic.css` carries the pure-CSS parts of semantics + lines + prose, with no fonts module, JS-companion styles or font assets.

## Cascade layers

Modules live in `han-semantics` / `han-lines` / `han-prose` / `han-fonts`. That buys you one rule and one opportunity: **unlayered declarations beat layered ones regardless of specificity** — every line of CSS you write casually already outranks han.css. The flip side: rules that weren't *meant* for han.css outrank it too.

An unlayered reset like `* { margin: 0 }` wipes out typesetting features along the way — the verse indent of `.poem-like`, for one. Put the reset in a layer declared **before** han.css's and the collateral damage disappears, while everything you actually want to override stays overridable:

```css
@layer reset, han-semantics, han-lines, han-prose, han-fonts, app;

@layer reset { /* your reset — loses to han.css, no more collateral */ }
@layer app   { /* your styles — beat everything han.css does */ }
```

Likewise, broad selectors hit elements you didn't have in mind: `ruby { ruby-position: under }` hits **every** ruby on the page, zhuyin included — flipping the annotation position (`--han-zhuyin-ruby-position`) it was configured to use. Exclude zhuyin if you don't mean it:

```css
ruby:not(.zhuyin, .mps) { ruby-position: under; }
```

Specificity is zero throughout (`:where()`), so overriding never takes selector tricks; layer order governs the opposite direction — which of your rules should *not* beat han.css.

## Do you need the JS?

The library is fully usable without it. `installFallbacks` only covers what engines don't natively do yet — punctuation compression/hanging, inter-script spacing fallbacks, adjacent-underline marking — each transform gated by `CSS.supports` and runtime probes, stepping aside as engines catch up. If inline typographic detail matters to you, load `auto`; if you only need semantic styles and prose rhythm, pure CSS suffices.

## Webfonts (heritage glyphs)

The fonts module defines stacks and family names; woff2 delivery is your choice. The easy route is the ziano CDN slices:

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/webfonts-shanggu-sans@latest/swap.css">
```

Or set `--han-use-heritage-glyphs-for-hant: system-ja` for a zero-download JP-system-font fallback. Simplified Chinese / Japanese / Korean heritage glyphs default off and can each be enabled (`--han-use-heritage-glyphs-for-hans`/`-ja`/`-ko`), with Shanggu or Genki as the family — see [Fonts](/manual/fonts.html).
