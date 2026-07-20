---
title: Introduction
subtitle: Han.css v4・Movable type within the pixels
---

# Introduction

Han.css is a CSS typography set for Han-character web pages: punctuation that compresses and hangs, emphasis dots beside the text, zhuyin and pinyin ruby, hair-width gaps between scripts — the craft of the metal-type era, recreated on screen with CSS custom properties and a little JavaScript fallback.

v4 is a ground-up rewrite on the native platform: **no Sass, no build step, no framework**. The library is four independent CSS modules plus one optional JavaScript companion, and every feature is switched and tuned through CSS custom properties.

## The mental model

Three things to know:

### 1. Four modules, one job each

| Module | Cascade layer | What it does |
|--------|--------------|--------------|
| [Semantic styles](./semantics.html) | `han-semantics` | What semantic elements should look like in Han typography — emphasis dots, title marks, proper-noun marks, ruby; farewell to fake italics |
| [Line adjustments](./lines.html) | `han-lines` | The measure within a line — punctuation compression, end-of-line hanging, inter-script spacing |
| [Prose spacing](./prose.html) | `han-prose` | Block-axis rhythm — spacing between headings, paragraphs and lists; indentation measured in characters |
| [Fonts](./fonts.html) | `han-fonts` | Font stacks and webfonts — heritage glyph forms, punctuation faces, cursive families |

Each module lives in its own cascade layer and can be used alone.

### 2. Every feature is a CSS custom property

Set a `--han-*` property on any selector and the feature applies within that scope — plain CSS inheritance and style queries (`@container style()`), nothing invented:

```css
:root { --han-emphasis-symbol: sesame; }
.quoted-legacy-text { --han-punctuation-squeeze: off; }
```

One caveat throughout: style queries read **ancestors**, so set these properties on an ancestor (or `:root`) of the content you're targeting.

### 3. Specificity is zero

Every rule ships inside `:where()` — zero specificity. Any rule of yours overrides the library; with `@layer`, module ordering is yours too.

## Browser support

Modern evergreen browsers. Engine gaps in inline typography (`text-autospace`, `text-spacing-trim`) are covered on demand by the [JavaScript companion](./api-js.html).

## Next

- [Install & enable](./install.html) — npm, CDN, or inline.
- The [playground](/en/#station-playground) on the homepage — paste your text, flip the panel, copy the generated setup code.

> 完整文檔目前以繁體中文為準——見[繁體中文版](/manual/)。Japanese and Korean docs are on the way.
