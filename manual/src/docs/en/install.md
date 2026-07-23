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

Modules live in `han-semantics` / `han-lines` / `han-prose` / `han-fonts`. Pre-declare the order if you want certainty:

```css
@layer han-semantics, han-lines, han-prose, han-fonts, app;
```

Specificity is zero throughout (`:where()`), so your rules win regardless.

## Do you need the JS?

The library is fully usable without it. `installFallbacks` only covers what engines don't natively do yet — punctuation compression/hanging, inter-script spacing fallbacks, adjacent-underline marking — each transform gated by `CSS.supports` and runtime probes, stepping aside as engines catch up. If inline typographic detail matters to you, load `auto`; if you only need semantic styles and prose rhythm, pure CSS suffices.

## Webfonts (heritage glyphs)

The fonts module defines stacks and family names; woff2 delivery is your choice. The easy route is the ziano CDN slices:

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@hanzi.pro/webfonts-shanggu-sans@latest/swap.css">
```

Or set `--han-use-heritage-glyphs-for-hant: system` for a zero-download system fallback — see [Fonts](/manual/fonts.html).
