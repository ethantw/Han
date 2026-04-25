# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### v4 — full rewrite

Han.css v4 is a rebuild from scratch. The framework now leans on
native browser primitives that didn't exist when v3 was written:
cascade layers, container queries, custom-property style queries,
`text-spacing-trim`, `hanging-punctuation`, `text-autospace`,
`text-decoration-skip`. The JavaScript half is a thin polyfill layer,
not the engine.

#### Added

- TypeScript implementation (`src/ts/`) with `.d.ts` declarations
  shipped via `dist/types/`.
- Cascade-variable-driven feature toggles (`--han-text-autospace`,
  `--han-hanging-punctuation`, the `--han-font-family-*` cascade).
- Named-container-driven sectional refinements (`container-name:
  han-sectional-refinements` / `han-sectional-refinements-none`).
- Zhuyin ruby — CSS-only via the `Han Zhuyin Serif` Bopomofo web font
  (OpenType GPOS) on top of native `<ruby>`. Safari 18.2+ uses native
  `ruby-position: inter-character`; other engines emulate inter-character
  layout via an `@supports not` CSS fallback. No JS polyfill is wired into
  `installFallbacks`. (An earlier in-development `transformZhuyinRuby`
  polyfill was retired before public release; never published.)
- `convertLegacyZhuyinRuby(src)` — opt-in helper that rewrites v3-legacy
  `<rtc>` / `<rb>` tabular ruby (and multi-base anonymous forms) into the
  v4 canonical form (`one base per <ruby class="zhuyin">`, dual annotation
  via nested `<ruby>`). Useful as a build-time migration pass or a manual
  runtime compat shim. Not auto-invoked.
- `text-autospace` fallback (`applyISS` / `applyISSWithProbe`) covering
  both the spec's `replace` semantic (no engine ships it yet) and the
  `strict` author-typed-space scenario.
- Punctuation compression (`compressPunctuation`) — wraps full-width
  punctuation in `<h-char class="punct …">` so the companion CSS can
  trim / hang on engines without `text-spacing-trim`.
- Hanging punctuation (`hangPunctuation`) — positions sentence-end
  marks via `<h-punct>` for engines without `hanging-punctuation`.
- Adjacent-line decoration (`markAdjacentLines`) — covers older UAs
  without `text-decoration-skip: edges`.
- Korean font configuration (`[lang^='ko']` heiti / songti / kaiti
  stacks, with Nanum Pen substituting for kaiti).
- Manual site under `manual/` — vite-driven, 5-locale ready
  (`hant` / `hans` / `en` / `ja` / `ko`).
- Demo page (`/manual/demo.html`) covering 16 features with ON / OFF
  contrast cells per language.

#### Changed

- **`markAdjacentLines` now has a single call shape.** The previous
  polymorphic overload `markAdjacentLines(selectors)(src)` is removed;
  callers wanting custom selector families call
  `markAdjacentLinesWithSelectors(selectors)(src)` instead. The plain
  `markAdjacentLines(src)` form (cascade-dispatched) is unchanged.
- ESM-only distribution. No CJS / UMD / IIFE.
- Drop Sass — all stylesheets are hand-written native CSS using
  cascade layers.
- Bundler strategy: esbuild for the JS half; CSS is a curated import
  graph that bundlers resolve directly.
- `package.json` `exports` map exposes named subpaths (`./style`,
  `./style/basic`, `./style/min`, `./style/basic/min`) instead of a
  single legacy entry.

#### Removed

- Sass build pipeline.
- Legacy CommonJS / UMD / IIFE outputs.
- Per-feature CSS classes (`.han-css--*`) — semantics now drive the
  styling.

---

## Pre-v4

The pre-v4 history (versions 3.x and earlier) lives in the
[legacy v3 repo](https://github.com/ethantw/Han) tags. v4 is a
rebuild rather than a continuation of the v3 source tree, so older
changelog entries are not migrated here.

[Unreleased]: https://github.com/ethantw/Han/compare/v3.3.0...HEAD
