---
name: han-setup
description: >-
  Install and configure han.css v4 (CJK web typography: 繁簡日韓 punctuation
  conventions, heritage-glyph webfonts, punctuation compression/hanging,
  inter-script spacing, zhuyin ruby) into the user's website or app.
  Use when the user asks to install/set up/configure han.css or hanzi.pro
  typography, improve CJK/Chinese/Japanese/Korean typesetting, fix CJK
  punctuation or mixed-script spacing, or add heritage (傳承字形) webfonts.
  Triggers: "install han.css", "set up han.css", "han.css 安裝/設定/配置",
  "CJK typography", "中文排版", "日本語組版", "한국어 조판", "傳承字形",
  "標點擠壓", "標點懸掛", "text-autospace", "@hanzi.pro/han.css".
---

# han.css v4 Setup

> This file is canonical. The sibling `han-setup-zh-hant` / `-zh-hans` /
> `-ja` / `-ko` skills are language entry points that redirect here — they
> duplicate no technical content. Converse in the user's language; take
> every technical fact from this file and the API reference.

You are configuring **han.css v4** (`@hanzi.pro/han.css`) into the user's
project. Work detection-first: inspect the repo before asking anything, ask
only what you cannot detect, and record every decision — with its reason —
in a project-owned config file suitable for version control so this setup can
be reviewed and re-run. Stage or commit only when the user explicitly asks.

**Single source of truth:** `docs/api-reference.md` in the han.css repo
(also shipped in the npm package). Every variable name, value, default,
bundle path and package name you emit MUST exist there. If this skill and
the reference disagree, the reference wins. Never invent a `--han-*`
property or a package name.

> rc-period note: pin the exact version (`@4.0.0-rc.1`, no `^`). Tell the
> user the API may change between rc bumps and that re-running this skill
> after an upgrade migrates their configuration.

## Step 0 — Detect (no questions yet)

Inspect the repo and fill this table. Detection beats asking; ask only when
detection is genuinely ambiguous AND the answer changes the outcome.

| Fact | How to detect |
|---|---|
| Framework / bundler | `package.json` deps (react, vue, svelte, astro, next, nuxt, vite, webpack); config files (`astro.config.*`, `next.config.*`, `vite.config.*`); plain HTML if none |
| SSR / SSG vs SPA vs static | next/nuxt/astro/eleventy → SSR/SSG; CRA/Vite SPA → client; plain HTML → static |
| Package manager | lockfile (`pnpm-lock.yaml` / `package-lock.json` / `yarn.lock` / `bun.lockb`); none → CDN path |
| Existing reset / Tailwind | `tailwindcss` in deps; `normalize.css` / `modern-normalize` / `sanitize.css` imports; `@layer` usage in existing CSS |
| `lang` attributes | grep `lang=` in HTML templates / layout components. Note the values AND what's missing |
| Site languages | `lang` attrs, i18n config (`next-i18next`, `astro:i18n`, locale dirs), actual content script (scan text files for kana / hangul / hanzi) |
| `<ruby>` usage | grep `<ruby` in content; if found, check for `<rtc>` / `<rb>` / multi-`<rt>` (tabular form → needs `transpileRuby`) |
| Manual CJK↔Latin spaces | sample content files: Han char + ASCII space + Latin (e.g. grep `[一-鿿] [A-Za-z0-9]`). Common in existing zh content; conflicts with autospace |
| Full-width space padding | grep `　` (U+3000) used for alignment |
| Existing CJK typography | deps or CSS mentioning `han.css` v3, `Han.init`, `heti`, `text-spacing-trim`, `text-autospace` — v3 found → follow the migration section of the API reference, don't double-install |
| Vertical writing | `writing-mode: vertical` in existing CSS |
| Dark mode | `prefers-color-scheme` / theme toggles (fonts don't care, but note for the report) |

## Step 1 — Ask (quick path: 3 questions max)

Ask ONLY these, and only the ones detection didn't already answer:

1. **Languages** — "Which languages will the site publish in? (Traditional
   Chinese / Simplified Chinese / Japanese / Korean — multiple OK)"
   Skip if detection found unambiguous `lang` attrs or i18n config.
2. **Sans or serif** — "Default body style: sans (黑體/ゴシック/고딕) or
   serif (明體/明朝/명조)?" Cannot be detected; always ask unless the
   existing CSS clearly commits to one (e.g. body `font-family: serif`).
3. **Webfonts** — "Load heritage-glyph webfonts (傳承字形, ~best CJK glyph
   quality, extra download) or system fonts only? If webfonts: CDN
   (jsDelivr, zero setup) or self-host?"

**Detection-triggered question** (asked in addition, only when its trigger
fires — doesn't count against the three):

- **Zhuyin ruby detected** (`ruby.zhuyin`/`.mps` or bopomofo content) —
  "Zhuyin position in horizontal text: beside each character
  (inter-character, 國語課本式 — recommended, the Taiwan-textbook
  convention) or above the line (over, the library default)?"
  If inter-character: set `--han-zhuyin-ruby-position: inter-character` on
  `:root` — vertical subtrees are safe as long as they carry the
  writing-mode mirror (Step 2), which makes inter-character stand down to
  `over` there automatically. Vertical-only sites: skip the question, the
  `over` default is already correct.

- **Basic bundle + Zhuyin ruby detected** — once `han.basic.css` is selected,
  ask: "Load han.css's bundled Zhuyin font too?" If yes, also import
  `@hanzi.pro/han.css/styles/zhuyin`; it ships the `@font-face` and WOFF2. If
  no, do not import it: semantics keeps `'Han Zhuyin Serif'` as an unresolved
  family placeholder and falls through to the configured cursive/system
  stack. Do not ask this question when no Zhuyin content was detected.

- **Zhuyin ruby font-position check** (`ruby.zhuyin`/`.mps` or bopomofo
  content) — ask: "Will zhuyin ruby inherit a custom body font? If so, do
  you want an optical-position check for its glyph ink bounds?" Skip this
  question only when detection confirms the base stack is one of the
  verified-compatible choices: Diantenjeom (DTJ), Shanggu, or Hiragino.
  Those faces share the default `.075em` synthetic ink seat closely enough
  for the CSS-only default. Any user-provided webfont, system font not on
  that list, or unknown fallback chain must be treated as needing the
  confirmation. Explain that the check is opt-in: it measures a representative
  Han glyph (default `永`) after fonts load and produces
  `--han-ruby-zhuyin-baseline-shift`. Import
  `calibrateZhuyinRuby` from the optional
  `@hanzi.pro/han.css/zhuyin-calibration` entry, run it once during development,
  and write its `cssDeclaration` to `han.config.css`; keep the runtime helper
  only when the effective font cannot be known until the client renders. Variable fonts
  whose optical-size axis changes the outline require
  `{ fontSizeSensitive: true }`. This corrects conspicuous whole-font optical
  drift; it is not a promise to normalize every glyph outline.

**Everything else gets a default, not a question.** Offer at the end:
"I used recommended defaults for punctuation conventions, hanging, spacing
and ruby — each is recorded with its reason in `han.config.css` and can be
changed there. Want to walk through the advanced options?" Only if the user
says yes, continue to Step 1b.

### Step 1b — Advanced (opt-in walkthrough)

Work through these only on request; otherwise apply the listed default:

| Topic | Default (and why) |
|---|---|
| Punctuation convention per locale | Library defaults (hant MOE / hans GB / ja JIS / ko KLR) — each locale's national/standing convention |
| Punctuation compress + hang | `--han-punctuation-refinement: auto` — compress + hang where the convention warrants it (recommended); `compress` if the user dislikes hanging; never suggest hang-without-compress unprompted |
| Inter-script spacing | `normal` (native first, JS long-tail). Offer `strict` only if detection found manual spaces the user wants consumed → then `replace`/`strict` + content cleanup |
| JS enhancement | Include `/auto` when punctuation hanging is wanted (Safari claims native support, but its current implementation is not usable for han.css, so hanging remains JS on every engine), or Safari autospace coverage matters. Tabular ruby is separate: `/auto` never runs `transpileRuby`; wire that named export explicitly when detected. Skip for pure semantic-styles use |
| Heritage glyphs for hans/ja/ko | `off` (national-standard shapes differ; heritage forms are a deliberate aesthetic choice). Ask only if the user asked for a unified mixed-script look |
| Kaiti / cursive layer | Library default (`webfont`) when webfonts chosen, `system` otherwise |
| Zhuyin ruby | Position already handled by the detection-triggered question in Step 1 — nothing further here unless the user wants per-subtree mixing |
| Emphasis-mark font | Only if `<em>` used in CJK content AND webfonts chosen — add `Diantenjeom Emphasis` first in the `<em>` stack |
| Vertical writing | Only if detected/requested — no extra han.css config needed (logical properties throughout), but note the punctuation webfont handles vertical forms |
| Scope | Whole document (default). Container-scoped only if the user has a design system they must not touch — then module toggles `off` at `:root`, `on` at the container, and scoped `installFallbacks(el)` |

## Step 2 — Fix `lang` first (obligation, not a question)

han.css keys everything off `:lang()`. Before any install:

- Root element must carry the right tag: `zh-Hant` / `zh-Hans` / `ja` /
  `ko` (Hanja-mixed Korean: `ko-Kore`). `lang="en"` or missing on a CJK
  site = han.css silently inert. **Fix it and tell the user why.**
- Han-character content in Chinese varieties follows the han.css convention
  `zh-<registered-extlang>-<script>[-region]`, so Min Nan, Min Bei,
  Cantonese, Hakka, Wu, and other Chinese varieties all enter the shared
  `:lang(zh)` rules without duplicating every selector. Examples:
  `zh-nan-Hant-TW`, `zh-mnp-Hant`, `zh-yue-Hant-HK`,
  `zh-hak-Hant-TW`, and `zh-wuu-Hans-CN`. These are valid BCP 47 extlang
  forms, though general-purpose BCP 47 guidance usually prefers the shorter
  primary-language form. Phonetic-script runs keep their own tags, such as
  `nan-Bopo-TW` and `nan-Latn-TW`. Scope this convention to DOM `lang` and CSS
  targeting. For `Intl`, speech, locale negotiation, and tools whose Unicode
  locale grammar rejects extlang, use the primary form (`nan-TW`, `yue-HK`,
  etc.); verify that the rendered DOM preserves the `zh-<extlang>` attribute
  instead of normalizing or rejecting it.
- Every element that carries its own `[lang]` attribute and also matches
  `:lang(zh)`, `:lang(ja)` or `:lang(ko)` deliberately receives a local
  zero-specificity `font-family: var(--han-font-default)` so locale font slots
  re-resolve. Merely matching `:lang()` through an ancestor's language does
  not trigger this boundary reset.

  When it is known that an element setting its own `font-family` may contain
  descendants with their own zh/ja/ko `lang` attributes, it may include those
  boundaries in the same nested component rule. This is optional; do not add
  it speculatively to components that cannot contain such descendants. Replace
  `h2` and the role below with the detected component:

  ```css
  h2 {
    &,
    & [lang]:where(:lang(zh), :lang(ja), :lang(ko)) {
      font-family: var(--han-font-alternative);
    }
  }
  ```

  Use this as a debugging path too. If a font looks wrong, inspect the affected
  element's matched and computed `font-family`. When the element carries
  `[lang]`, matches `:lang(zh)`, `:lang(ja)` or `:lang(ko)`, and han.css's
  boundary declaration is the confirmed reset, extend the author's component
  rule with the same pattern and reapply `var(--han-font-alternative)`,
  `var(--han-font-accent)`, or the author's literal stack. When translations
  are alternate block content, moving `lang` onto each semantic block that
  already matches the component selector is another appropriate solution. Do
  not remove or override the library's global boundary rule as a setup
  shortcut.
- Multilingual pages: tag inline foreign runs (`<span lang="ja">`) and apply
  the font-boundary rule above when their ancestor uses a non-default stack.
- Framework notes: Next.js → `<Html lang>` in `_document` or root layout;
  Astro → layout `<html lang>`; i18n routing → per-locale lang.

**Writing-mode mirror.** Ordinary vertical text does not need
`--han-writing-mode` unless the subtree contains Zhuyin ruby or uses GB
punctuation compression. The latter includes vertical `zh-Hans`, whose default
convention is GB. When either case is detected, add the mirror on the same rule
as `writing-mode` — copy-paste the value:

```css
writing-mode: vertical-rl;
--han-writing-mode: vertical-rl;
```

Do this unprompted only for those two cases, and tell the user whether Zhuyin
geometry or the horizontal-only GB punctuation seam requires it. Otherwise
omit it; do not present the variable as a general vertical-writing requirement.

## Step 3 — Generate

Emit, as real files in the user's repo (match their conventions — file
locations, import style, formatting):

1. **Install code** — npm import(s) or CDN `<link>`/`<script>` per
   detection. Module selection: all four modules by default; drop `fonts`
   only when the user explicitly wants their existing font stack untouched;
   `han.basic.css` only for the minimal no-JS-no-fonts case. With basic and
   detected Zhuyin, include `styles/zhuyin` only when the user chose it in
   Step 1; otherwise leave the family placeholder unresolved. Load order:
   after resets/preflight, before the user's own styles. If the project
   uses `@layer`, declare
   `@layer han-semantics, han-lines, han-prose, han-fonts, <their-layers>`.
2. **`han.config.css`** — one project-owned file holding every `--han-*`
   override and font-role selector, **each with a one-line comment: what it does + why this
   value was chosen** (detection fact or user answer). Values that equal
   the library default are omitted (note in the header that defaults rule)
   — except decisions the user explicitly made, which are written out even
   at default value so re-runs know they were deliberate.
   Role vars are per-element resolved outputs, not inherited global switches:
   never implement a serif-body choice as
   `:root { --han-font-default: var(--han-serif) }`. For a serif choice emit:

   ```css
   :where(:root, body, [lang]):where(:lang(zh), :lang(ja), :lang(ko)) {
     font-family: var(--han-font-alternative);
   }
   ```

   This deliberately includes every explicit CJK language boundary so each
   one rebuilds its own locale serif stack. For the default sans choice, emit
   no declaration and record the explicit decision in a comment. Component
   roles use the optional nested boundary pattern from Step 2 instead.
   Header comment: han.css version, date, "generated by han-setup — re-run
   after upgrading to migrate".
3. **Webfont links** (if chosen) — heritage slices + Diantenjeom, with
   `preconnect`. Korean present → `shanggu` family (genki hangul
   coverage is inadequate). Self-host → copy package `dist/`, keep relative
   layout, immutable cache headers, CORS if cross-origin, **and copy each
   package's OFL LICENSE file alongside — tell the user this is a license
   obligation, not a suggestion.**
4. **JS wiring** (if chosen) — static/SSG: `/auto` entry. SPA: manual
   `installFallbacks(container)` after mount; re-run on route change
   against the new container only; `uninstallFallbacks` before unmount if
   content persists. SSR: run transforms server-side (they accept
   strings/DOM and return serializable output), skip client re-run on
   hydrated content. `transpileRuby` is NOT auto-run — wire it only if
   tabular ruby was detected.
5. **Content fixes** (only with user confirmation, as a separate change set;
   commit only when explicitly requested):
   strip manual CJK↔Latin spaces (autospace replaces them) or switch to
   `replace` mode instead; flag U+3000 alignment padding.

## Step 4 — Verify

Run what the project has (build, dev server + screenshot if available).
Then hand the user this checklist — "installed correctly looks like":

- [ ] CJK text renders in the configured font (webfont: check DevTools →
      Rendered Fonts, not just the stack) — wrong `lang` = nothing changed
- [ ] `<em>` in CJK shows emphasis dots, not italics; `<i>`/`<var>` show
      Kaiti, not slanted glyphs
- [ ] Full-width opening brackets at line starts sit flush (compress);
      consecutive punctuation `」」` closes up
- [ ] If hanging enabled: line-end commas/periods hang past the right edge
      of a justified column
- [ ] A Han↔Latin seam like `列印CSS樣式` shows a thin gap without any
      space character in the DOM
- [ ] `<q>` quotes match the locale (「」 for zh-Hant/ja; “” for zh-Hans)
- [ ] If zhuyin ruby uses a custom/unverified base font: compare its rt
      position with Shanggu/Hiragino at the intended text sizes; run the
      opt-in ink-position check only when the user requested it, then write
      the generated variable instead of leaving a per-reader measurement when
      the font is stable. DTJ, Shanggu, and Hiragino need no such check under
      the default CSS seat.
- [ ] No console errors; woff2 requests return 200 (webfonts) and only the
      slices actually used were downloaded

If a check fails, the first three suspects in order: `lang` attributes,
CSS load order (reset loaded after han.css), missing JS entry (`/auto` not
imported) for hang/long-tail features.

## Re-running (upgrade / reconfigure)

`han.config.css` is the state. On re-run: read it (comments carry the
original reasons), read the target version's API reference + changelog,
map old decisions onto the new surface, regenerate, and show the user a
diff with a note per changed line. Never silently drop a recorded
deliberate choice.
