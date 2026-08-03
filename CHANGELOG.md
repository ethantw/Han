# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.0.0-rc.1] — 2026-07-23

Han.css v4 is a rebuild from scratch. It leans on native browser
primitives that did not exist when v3 was written — cascade layers,
custom-property style queries (`@container style()`), `@property`,
`text-spacing-trim`, `hanging-punctuation`, `text-autospace`,
`text-decoration-skip` — and the JavaScript half is a thin, self-retiring
fallback layer, not the engine. **No CSS preprocessor, no required
JavaScript (though it sharpens the finer details).**

### Added

- **Four independent CSS modules, one cascade layer each.**
  - `han-semantics` — semantic elements under Han typography: emphasis
    dots (`--han-em-symbol`, `--han-em-dot-position`), title marks on
    `<cite>` (`--han-cite-title-marks`), proper-noun marks, ruby, and no
    fake italics.
  - `han-lines` — the measure within a line: punctuation compression and
    end-of-line hanging (`--han-punctuation-refinement`), inter-script
    spacing (`--han-text-autospace`).
  - `han-prose` — block-axis rhythm: heading / paragraph / list spacing
    and character-measured indentation (`--han-prose`, `--han-prose-indent`,
    scoped to `<article>` by default).
  - `han-fonts` — font stacks and webfonts: heritage glyph forms
    (`--han-use-heritage-glyphs-for-hant`), punctuation faces, cursive
    families (`--han-use-cursive`).
- **Every feature is a `--han-*` custom property.** Set it on any selector
  and the feature applies within that scope, via native inheritance and
  style queries — no class names, no JS calls. Opt out with the same
  mechanism (e.g. `--han-punctuation-refinement: none`).
- **Zero specificity.** Every rule ships inside `:where()`, so any author
  rule overrides the framework; `@layer` gives module ordering too.
- **Zhuyin (注音) ruby, CSS-only** — the `Han Zhuyin Serif` Bopomofo
  webfont (OpenType GPOS for tone-mark placement) on top of native
  `<ruby>`. Safari 18.2+ uses native `ruby-position: inter-character`;
  other engines emulate it via an `@supports not` fallback. No JS polyfill.
- **Optional JavaScript companion** (`installFallbacks`, or the `./auto`
  entry that installs on `DOMContentLoaded`; import the named passes from the
  main entry instead and your bundler ships only those). Each pass is gated by
  `CSS.supports` and runtime probes, and steps aside as engines catch up:
  - `refinePunctuation` — wraps full-width punctuation for squeeze / hang
    where `text-spacing-trim` / `hanging-punctuation` are absent.
  - `applyISS` — inter-script spacing where `text-autospace` is absent.
  - `markAdjacentLines` — adjacent-underline gap where
    `text-decoration-skip` is absent.
  - `uninstallFallbacks` — teardown; every DOM change reversed.
  - Curried `…WithMode` / `…WithSelectors` / `set*Mode` variants for
    callers that need explicit control instead of cascade dispatch.
- **`transpileRuby`** — opt-in helper that rewrites v3-legacy `<rtc>` /
  `<rb>` tabular ruby into the v4 canonical form (one base per
  `<ruby class="zhuyin">`). A build-time migration pass or manual compat
  shim; never auto-invoked.
- **TypeScript throughout** (`src/ts/`), with `.d.ts` shipped via
  `dist/types/`.
- **Package `exports`** expose the entries by subpath: `.` (JS),
  `./auto` (JS companion), `./styles` (full CSS) and the per-module
  `./styles/{semantics,lines,prose,fonts}`, plus the slim `./basic-styles`.
- **Documentation site** under `manual/` — Vite-driven, with an
  interactive playground; reference manual authoritative in Traditional
  Chinese, English covering intro + install, Japanese / Korean on the way.

### Changed

- **Opt-out is a style query, not a named container.** v3-era
  `container-name: han-*` / `han-revert-*` patterns are gone; set the
  module's `--han-*` property instead (`--han-semantics`, `--han-prose`,
  `--han-punctuation-refinement: none`, …).
- **ESM-only distribution.** No CJS / UMD / IIFE. Every bundle ships a
  `.min` variant and a source map.
- **Stylesheets are hand-written native CSS** on cascade layers; the JS
  half builds with esbuild.

### Removed

- The Sass build pipeline, and all legacy CommonJS / UMD / IIFE outputs.
- Per-feature CSS classes (`.han-css--*`) — semantic elements drive the
  styling now.
- **v3 JavaScript runtime features**, each superseded by native browser or
  font behaviour:
  - `renderRuby` / `substCombLigaWithPUA` — zhuyin layout and tone-mark
    placement are now native `ruby-position` + font GPOS.
  - `locale/normalize` — regional glyph variants (雨 / 骨 / 直 …) are the
    OpenType `locl` feature's job on `lang`-aware fonts.
  - `jinzify` — expressible as `text-justify: inter-character`.
  - `charify` — v4 only wraps CJK punctuation in `<h-char>`, where the
    compress / hang fallbacks need it.

## Pre-v4

The pre-v4 history (3.x and earlier) lives in the
[legacy v3 repo](https://github.com/ethantw/Han) tags. v4 is a rebuild
rather than a continuation of the v3 source tree, so older changelog
entries are not migrated here.

[Unreleased]: https://github.com/ethantw/Han/compare/v4.0.0-rc.1...HEAD
[4.0.0-rc.1]: https://github.com/ethantw/Han/compare/v3.3.0...v4.0.0-rc.1
