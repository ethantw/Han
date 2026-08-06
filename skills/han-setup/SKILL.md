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
in a committed config file so this setup can be reviewed and re-run.

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
| JS enhancement | Include `/auto` when: punctuation hanging wanted (always JS), or Safari autospace coverage matters, or `<ruby>` tabular sources exist. Skip for pure semantic-styles use |
| Heritage glyphs for hans/ja/ko | `off` (national-standard shapes differ; heritage forms are a deliberate aesthetic choice). Ask only if the user asked for a unified mixed-script look |
| Kaiti / cursive layer | Library default (`webfont`) when webfonts chosen, `system` otherwise |
| Zhuyin ruby | Position already handled by the detection-triggered question in Step 1 — nothing further here unless the user wants per-subtree mixing |
| Emphasis-mark font | Only if `<em>` used in CJK content AND webfonts chosen — add `Diantenjeom Emphasis` first in the `<em>` stack |
| Vertical writing | Only if detected/requested — no extra han.css config needed (logical properties throughout), but note the punctuation webfont handles vertical forms |
| Scope | Whole document (default). Container-scoped only if the user has a design system they must not touch — then module toggles `off` at `:root`, `on` at the container, and scoped `installFallbacks(el)` |

## Step 2 — Fix `lang` first (obligation, not a question)

han.css keys everything off `:lang()`. Before any install:

- Root element must carry the right tag: `zh-Hant` / `zh-Hans` / `ja` /
  `ko` (Hanja-mixed Korean: `ko-Hant`). `lang="en"` or missing on a CJK
  site = han.css silently inert. **Fix it and tell the user why.**
- Multilingual pages: tag inline foreign runs (`<span lang="ja">`).
- Framework notes: Next.js → `<Html lang>` in `_document` or root layout;
  Astro → layout `<html lang>`; i18n routing → per-locale lang.

**Writing-mode mirror (same class of obligation).** han.css cannot read
`writing-mode` from CSS. For every `writing-mode: vertical-*` declaration
detection found, add the mirror on the same rule — copy-paste the value:

```css
writing-mode: vertical-rl;
--han-writing-mode: vertical-rl;
```

Do this unprompted and tell the user why. An unmirrored vertical subtree
renders zhuyin (and future direction-dependent features) wrong.

## Step 3 — Generate

Emit, as real files in the user's repo (match their conventions — file
locations, import style, formatting):

1. **Install code** — npm import(s) or CDN `<link>`/`<script>` per
   detection. Module selection: all four modules by default; drop `fonts`
   only when the user explicitly wants their existing font stack untouched;
   `han.basic.css` only for the minimal no-JS-no-fonts case. Load order:
   after resets/preflight, before the user's own styles. If the project
   uses `@layer`, declare
   `@layer han-semantics, han-lines, han-prose, han-fonts, <their-layers>`.
2. **`han.config.css`** — one committed file holding every `--han-*`
   override, **each with a one-line comment: what it does + why this
   value was chosen** (detection fact or user answer). Values that equal
   the library default are omitted (note in the header that defaults rule)
   — except decisions the user explicitly made, which are written out even
   at default value so re-runs know they were deliberate.
   Header comment: han.css version, date, "generated by han-setup — re-run
   after upgrading to migrate".
3. **Webfont links** (if chosen) — heritage slices + Diantenjeom
   (**≥ 0.2.0** — 0.1.0 family names mismatch v4 and fall back silently),
   with `preconnect`. Korean present → `shanggu` family (genki hangul
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
5. **Content fixes** (only with user confirmation, as a separate commit):
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
- [ ] No console errors; woff2 requests return 200 (webfonts) and only the
      slices actually used were downloaded
- [ ] Copy-paste of processed text yields clean original characters (no
      wrapper artifacts)

If a check fails, the first three suspects in order: `lang` attributes,
CSS load order (reset loaded after han.css), missing JS entry (`/auto` not
imported) for hang/long-tail features.

## Re-running (upgrade / reconfigure)

`han.config.css` is the state. On re-run: read it (comments carry the
original reasons), read the target version's API reference + changelog,
map old decisions onto the new surface, regenerate, and show the user a
diff with a note per changed line. Never silently drop a recorded
deliberate choice.
