import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { glob } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import esbuild from 'esbuild'
import { defineConfig } from 'vite'
import MarkdownIt from 'markdown-it'
import { cjkEmphasis } from './_md-cjk-emphasis.js'
import { specificity, splitTopLevel } from './_specificity.js'
import { headings, renderPageToc } from './_md-headings.js'
import { ssrSpecimen } from './ssr-specimen.js'
import {
  DEFAULT_LOCALE as HOME_DEFAULT_LOCALE,
  ALL_LOCALES as HOME_LOCALE_SLUGS,
  HTML_LANG as HOME_HTML_LANG,
  LOCALE_LABELS as HOME_LOCALE_LABELS,
} from './_locales.js'

/**
 * Re-import `_nav.js` and `_i18n.js` with a cache-bust query so each
 * render picks up edits to those files. Node's ESM cache otherwise
 * pins them to the values at config-load time, which is why edits to
 * `I18N` looked invisible no matter how many times the watcher fired.
 *
 * The `new Function` indirection is intentional: vite bundles this file
 * with esbuild, which treats `import('./literal')` as a glob spec to
 * pre-bundle. Routing through `Function` keeps the call dynamic at
 * runtime and bypasses the bundler's static analysis.
 */
const dynImport = new Function('s', 'return import(s)')

async function loadNavI18n() {
  const stamp = Date.now()
  const navUrl = pathToFileURL(NAV_FILE).href + `?t=${stamp}`
  const i18nUrl = pathToFileURL(I18N_FILE).href + `?t=${stamp}`
  const [nav, i18nMod] = await Promise.all([dynImport(navUrl), dynImport(i18nUrl)])
  return { ...nav, I18N: i18nMod.I18N }
}

/**
 * Homepage i18n lives IN each template — a `<script type="text/x-i18n">`
 * block at the top of `_home.html` / `home/*.html` holds that file's own
 * strings as a JS object literal, key→locale:
 *
 *   { ssLede: { hant: '…', hans: '…', en: '…', ja: '…', ko: '…' }, … }
 *
 * Rationale: translations of one string sit adjacent for side-by-side
 * comparison, and each section file is self-contained (DOM is the data).
 * The block is a build-time construct only — `extractHomeI18n()` strips
 * it before substitution, so rendered pages never carry it. A missing
 * locale falls back PER KEY to the default locale (untranslated strings
 * show the source text instead of a hole).
 */
function extractHomeI18n(src) {
  const m = src.match(/<script type="text\/x-i18n">([\s\S]*?)<\/script>\r?\n?/)
  if (!m) return { dict: {}, body: src }
  // JS, not JSON — same authoring ergonomics as the old `_data.js`
  // (single quotes, trailing commas, comments). Two block shapes:
  //   • bare object literal `{ … }` — the default (one dict, no sharing);
  //   • statement body `const X = …; return { … }` — when a value must be
  //     DRY'd across keys (e.g. `_shared.html`'s 漢 SVG referenced by both
  //     `logo` and `han`). We pick by the first non-blank char: `{` → wrap
  //     as an expression; anything else → run as a function body that
  //     returns. `new Function` can't take a `const` inside `return (…)`,
  //     which is the only reason the two paths exist.
  const code = m[1].trim()
  const dict = code.startsWith('{')
    ? new Function(`return (${code})`)()
    : new Function(code)()
  return { dict, body: src.replace(m[0], '') }
}

function localizeHomeI18n(dict, locale) {
  // `'*'` is a wildcard locale: a value defined once under it applies to
  // every locale — for strings that don't localise (the brand wordmark
  // markup, an emoji, a bare number). Precedence: exact locale → wildcard
  // → default locale.
  return Object.fromEntries(
    Object.entries(dict).map(([k, v]) => [k, v[locale] ?? v['*'] ?? v[HOME_DEFAULT_LOCALE]]),
  )
}

/**
 * Per-module ledger — baked at build time so the 工法站 layer map shows the
 * real compressed weight of each han.css module beside its cascade-layer
 * chip, plus a footing line (four-module total ＋ runtime-dep count).
 *
 * Brotli-first (decision 2026-06): headline numbers are brotli (q11, what a
 * modern CDN actually serves); gzip rides along as the secondary figure in
 * the footing since Bundlephobia and gzip-only hosts still speak it.
 *
 *   - sizeSemantics / sizeLines / sizeProse / sizeFonts
 *             brotli size of each per-module `dist/han.<mod>.min.css`, kb
 *             with one decimal formatted like '2.3k'; a missing file → '—'.
 *   - sizeJs…        the four JS bundles (brotli), plus a `…Gzip` twin
 *                    each — han / han.auto × default / browser condition.
 *   - …Raw           every module and bundle again, uncompressed (the
 *                    minified file itself), plus `sizeTotalRaw`.
 *   - sizeTotal      sum of the four CSS modules (brotli), one decimal + 'k'.
 *   - sizeTotalGzip  same sum, gzipped — the footing's secondary figure.
 *
 * The four module keys map 1:1 to the addition's four style rows (han-semantics
 * / -lines / -prose / -fonts). Cached like the old hero stats were, and
 * spread into the same per-locale `ctx` that feeds the station partials.
 */
let _moduleLedgerCache = null
async function computeModuleLedger() {
  if (_moduleLedgerCache) return _moduleLedgerCache
  const modules = {
    sizeSemantics: 'han.semantics.min.css',
    sizeLines:     'han.lines.min.css',
    sizeProse:     'han.prose.min.css',
    sizeFonts:     'han.fonts.min.css',
  }
  // The four JS bundles build/library.js emits: two entry points (`han` —
  // call the API yourself; `han.auto` — apply on load) × the two `exports`
  // conditions (default/Node vs `browser`, which swaps happy-dom for a
  // stub). Same treatment as the CSS modules — measured, never guessed —
  // but they feed their OWN table (the script ledger), so they stay out of
  // the four-module `sizeTotal` footing below.
  const bundles = {
    sizeJs:           'han.min.js',
    sizeJsAuto:       'han.auto.min.js',
    sizeJsBrowser:    'han.browser.min.js',
    sizeJsAutoBrowser:'han.auto.browser.min.js',
  }
  const keys = Object.keys(modules)
  const jsKeys = Object.keys(bundles)
  // `raw` is the minified file as it sits on disk — the figure a reader gets
  // if their server never negotiated an encoding. Same measurement path as
  // the compressed ones (identity, i.e. no compressor), so the three columns
  // can never be measured against different files.
  const identity = buf => buf
  const [sizes, gzipSizes, rawSizes, jsSizes, jsGzipSizes, jsRawSizes] = await Promise.all([
    Promise.all(keys.map(k => compressedSizeKb(path.join(HAN_DIST, modules[k]), brotliCompressSync))),
    Promise.all(keys.map(k => compressedSizeKb(path.join(HAN_DIST, modules[k]), gzipSync))),
    Promise.all(keys.map(k => compressedSizeKb(path.join(HAN_DIST, modules[k]), identity))),
    Promise.all(jsKeys.map(k => compressedSizeKb(path.join(HAN_DIST, bundles[k]), brotliCompressSync))),
    Promise.all(jsKeys.map(k => compressedSizeKb(path.join(HAN_DIST, bundles[k]), gzipSync))),
    Promise.all(jsKeys.map(k => compressedSizeKb(path.join(HAN_DIST, bundles[k]), identity))),
  ])
  // Always one decimal — the four cards print the figure at heading scale in
  // a tabular-nums column, so a bare '1KB' beside '0.8KB' would break the
  // decimal alignment the whole layer map is lined up on.
  //
  // Unit is capital `KB`, never `kb`: lower-case `b` is BITS. On a typography
  // framework's own homepage an ambiguous unit is the one typo nobody would
  // forgive — a reader who parses `3.5kb` as kilobits reads our claim as 8×
  // better than it is.
  const fmtSize = kb => kb == null ? '—' : `${kb.toFixed(1)}KB`
  /**
   * The same figure with no unit, padded to two integer digits with U+2007
   * FIGURE SPACE — the caption's sum aligns its decimal points that way (and
   * only that way; see home/ledger.js § fmtNum).
   */
  const fmtFigure = kb => {
    if (kb == null) return '—'
    const text = kb.toFixed(1)
    return '\u2007'.repeat(Math.max(0, 2 - text.split('.')[0].length)) + text
  }
  const sum = xs => xs.reduce((acc, kb) => acc + (kb ?? 0), 0)
  const total = sum(sizes)
  const totalGzip = sum(gzipSizes)
  _moduleLedgerCache = {
    ...Object.fromEntries(keys.map((k, i) => [k, fmtSize(sizes[i])])),
    ...Object.fromEntries(jsKeys.map((k, i) => [k, fmtSize(jsSizes[i])])),
    ...Object.fromEntries(jsKeys.map((k, i) => [`${k}Gzip`, fmtSize(jsGzipSizes[i])])),
    ...Object.fromEntries(keys.map((k, i) => [`${k}Raw`, fmtSize(rawSizes[i])])),
    ...Object.fromEntries(jsKeys.map((k, i) => [`${k}Raw`, fmtSize(jsRawSizes[i])])),
    ...Object.fromEntries(keys.map((k, i) => [`${k}Gzip`, fmtSize(gzipSizes[i])])),
    sizeTotalRaw: `${rawSizes.reduce((sum, kb) => sum + (kb ?? 0), 0).toFixed(1)}KB`,
    // The ledger's totals are LIVE — home/ledger.js re-sums them from the
    // printed figures whenever the console's switches change. These three are
    // the same sums for the console's DEFAULT config (all four modules on,
    // `fallbacks` on → han.auto.js, `legacyRuby` off), so the line is already
    // correct on first paint and stays correct with JS off. Keep in step with
    // home/codegen.js § DEFAULT if those defaults ever move.
    ...Object.fromEntries([['', jsSizes], ['Gzip', jsGzipSizes], ['Raw', jsRawSizes]].map(
      ([suffix, group]) => [
        `sizeDefaultTotal${suffix}`,
        `${((suffix === 'Gzip' ? gzipSizes : suffix === 'Raw' ? rawSizes : sizes)
          .reduce((sum, kb) => sum + (kb ?? 0), 0) + (group[jsKeys.indexOf('sizeJsAuto')] ?? 0)
        ).toFixed(1)}KB`,
      ],
    )),
    sizeTotal: `${total.toFixed(1)}KB`,
    sizeTotalGzip: `${totalGzip.toFixed(1)}KB`,
    /**
     * Unit-less twins for the caption's sum, padded to a fixed integer width
     * with U+2007 FIGURE SPACE so the decimal points line up before
     * home/ledger.js has run (it pads the same way — see `fmtNum` there for
     * why the alignment cannot be done in CSS).
     */
    ...Object.fromEntries(Object.entries({
      sizeTotalNum:            total,
      sizeTotalGzipNum:        totalGzip,
      sizeTotalRawNum:         sum(rawSizes),
      sizeJsAutoNum:           jsSizes[jsKeys.indexOf('sizeJsAuto')],
      sizeJsAutoGzipNum:       jsGzipSizes[jsKeys.indexOf('sizeJsAuto')],
      sizeJsAutoRawNum:        jsRawSizes[jsKeys.indexOf('sizeJsAuto')],
      sizeDefaultTotalNum:     total + (jsSizes[jsKeys.indexOf('sizeJsAuto')] ?? 0),
      sizeDefaultTotalGzipNum: totalGzip + (jsGzipSizes[jsKeys.indexOf('sizeJsAuto')] ?? 0),
      sizeDefaultTotalRawNum:  sum(rawSizes) + (jsRawSizes[jsKeys.indexOf('sizeJsAuto')] ?? 0),
    }).map(([k, kb]) => [k, fmtFigure(kb)])),
  }
  return _moduleLedgerCache
}

async function compressedSizeKb(file, compress) {
  if (!existsSync(file)) return null
  const buf = await fs.readFile(file)
  return +(compress(buf).length / 1024).toFixed(1)
}

/**
 * Fill station 伍's cascade pairs with computed specificity: han.css's own
 * selector (`data-spec`) and the reader's overriding one (`data-mine-spec`),
 * plus the annotation line's two `<b>`s.
 *
 * Computed, never typed: the whole claim is that a selector of ANY weight
 * comes out at zero and loses to the reader, so a triple that had drifted
 * from the selector printed beside it would undo the argument it exists to
 * make. A post-substitution pass over the rendered HTML rather than a token,
 * so the selectors stay in the markup where they are read (DOM is the data)
 * instead of migrating into this config as a table of strings.
 */
function fillSpecificity(html) {
  const unescape = (s) => s
    .replace(/&gt;/g, '>').replace(/&lt;/g, '<')
    .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  /** A selector LIST weighs what its HEAVIEST branch weighs — that is the one
   *  an author would have to beat. Ranked component-wise, not by string order:
   *  '(0,1,10)' sorts before '(0,1,2)' as text. */
  const rank = (list) => {
    const heaviest = splitTopLevel(unescape(list))
      .map(specificity)
      .reduce((x, y) => (
        x[0] !== y[0] ? (x[0] > y[0] ? x : y)
        : x[1] !== y[1] ? (x[1] > y[1] ? x : y)
        : x[2] >= y[2] ? x : y
      ), [0, 0, 0])
    return `(${heaviest.join(',')})`
  }
  const specs = []
  // Terminator is `</code`, NOT `</code>` — the carousel's items close with
  // the tag split across a line break (`</code\n  ><code …`) to keep the
  // inline-grid free of whitespace text nodes, so requiring the `>` matches
  // nothing and a lazy `[\s\S]*?` then swallows all five selectors as one.
  const filled = html.replace(
    /<code data-spec(?:="[^"]*")?>([\s\S]*?)<\/code/g,
    (_, body) => {
      const spec = rank(body)
      specs.push(spec)
      return `<code data-spec="${spec}">${body}</code`
    },
  )
  // The reader's own selector in each cascade pair — same treatment, its own
  // attribute, so the two rosters can never be mixed up by position.
  const mine = []
  const both = filled.replace(
    /<code data-mine-spec(?:="[^"]*")?>([\s\S]*?)<\/code/g,
    (_, body) => {
      const spec = rank(body)
      mine.push(spec)
      return `<code data-mine-spec="${spec}">${body}</code`
    },
  )
  // Seed the annotation line with the FIRST pair, so the plate reads correctly
  // before (or without) carousel.js.
  return [[specs, 'data-spec-out'], [mine, 'data-mine-out']].reduce(
    (out, [list, attr]) => list.length
      ? out.replace(new RegExp(`<b ${attr}>[^<]*</b>`, 'g'), `<b ${attr}>${list[0]}</b>`)
      : out,
    both,
  )
}



const here = path.dirname(fileURLToPath(import.meta.url))
const HAN_DIST = path.resolve(here, '..', 'dist')
const MANUAL_DIST = path.resolve(here, 'dist')
const PUBLIC_HAN = path.resolve(here, 'public', 'han')
// Markdown sources stay clean in `src/docs/`. Rendered HTML lands in
// `.cache/docs/`, which is vite's `root` — modern SSG convention (cf.
// `.astro/`, `.svelte-kit/`, `.next/`). Both directories mirror the URL
// tree (zh-Hant at `/`, others at `/<slug>/`).
const MD_SRC = path.resolve(here, 'src', 'docs')
const HTML_ROOT = path.resolve(here, '.cache', 'docs')
const LAYOUT = path.resolve(here, '_layout.html')
const NOT_FOUND_LAYOUT = path.resolve(here, '_404.html')
const NAV_FILE = path.resolve(here, '_nav.js')
const I18N_FILE = path.resolve(here, '_i18n.js')
// Homepage assets — separate from the docs Markdown pipeline. Each
// locale gets its own `index.html` rendered from these templates; every
// template carries its own i18n block (see extractHomeI18n above).
const HOME_DIR = path.resolve(here, 'home')
const HOME_LAYOUT = path.resolve(here, '_home.html')
// Cross-template i18n (the brand `logo` wordmark) — merged into every
// homepage template's ctx. Not a section, not a per-file dict.
const HOME_SHARED = path.resolve(HOME_DIR, '_shared.html')
const HOME_SECTIONS = [
  'manifesto', 'station-semantics', 'station-fonts', 'station-lines',
  'station-prose', 'station-craft', 'station-playground', 'station-snippet', 'closing',
]
// The console is chrome, not a station — it sits OUTSIDE <main class="han">
// (mounted into `<aside data-console-mount>`), so it stays out of
// HOME_SECTIONS and gets its own `{{ consoleSection }}` token instead of a
// `<name>Section` one derived from the HOME_SECTIONS list.
const HOME_CONSOLE = path.resolve(HOME_DIR, 'console.html')
// 示例頁。`specimen.html` 是 shipped 的樣張（renderSpecimenPages 由它生出
// /specimen.html 與 /specimen.ssr.html 兩份）；同目錄其餘 .html 是 dev-only
// 的工作台頁，首頁站台以連結指過去。
// （2026-08-08：原本還有一頁 `/demo`——`index.html` ＋ 十八個 `.md` 分節拼成的
// 對照表。刪了：太醜、示例意義不大，樣張頁承擔得了同一件事，owner 拍板。）
const DEMO_DIR = path.resolve(here, 'demo')
const SPECIMEN_FILE = 'specimen.html'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
}).use(cjkEmphasis).use(headings)

const FRAMEWORK_ASSETS = [
  'han.css', 'han.min.css', 'han.basic.css', 'han.basic.min.css',
  'han.semantics.css', 'han.semantics.min.css',
  'han.lines.css', 'han.lines.min.css',
  'han.prose.css', 'han.prose.min.css',
  'han.fonts.css', 'han.fonts.min.css',
  'han.js', 'han.min.js', 'han.auto.js', 'han.auto.min.js',
  // The addition ledger's measured figures — read at runtime by
  // home/ledger.js as the console's switches move (build/pass-sizes.js).
  'pass-sizes.json',
  'em-space.woff2',
  'zhuyin.serif.woff2',
]

async function syncFramework() {
  await fs.mkdir(PUBLIC_HAN, { recursive: true })

  for (const f of FRAMEWORK_ASSETS) {
    const src = path.join(HAN_DIST, f)
    if (!existsSync(src)) continue
    await fs.copyFile(src, path.join(PUBLIC_HAN, f))
  }
}

// Vendored runtime ESM — station-playground's Markdown parser (marked)
// and HTML sanitizer (DOMPurify). Both are single-file, zero-dep browser
// builds; we copy them out of node_modules so `public/` never carries a
// hand-committed minified blob (package.json stays the single version
// source). Emitted to `dist/vendor/` at build (closeBundle) and served
// straight from node_modules by dev middleware — same pattern as the
// generated console-templates module.
const NODE_MODULES = path.resolve(here, 'node_modules')
const VENDOR_ASSETS = {
  'marked.esm.js': path.join(NODE_MODULES, 'marked', 'lib', 'marked.esm.js'),
  'purify.esm.js': path.join(NODE_MODULES, 'dompurify', 'dist', 'purify.es.mjs'),
}

// Drop the trailing `//# sourceMappingURL=` line — we don't ship the
// `.map`, so leaving it only yields a devtools 404.
function stripSourceMap(src) {
  return src.replace(/\n\/\/# sourceMappingURL=\S*\s*$/, '\n')
}

async function readVendor(name) {
  return stripSourceMap(await fs.readFile(VENDOR_ASSETS[name], 'utf-8'))
}

async function emitVendor() {
  const outDir = path.join(MANUAL_DIST, 'vendor')
  await fs.mkdir(outDir, { recursive: true })
  for (const name of Object.keys(VENDOR_ASSETS)) {
    await fs.writeFile(path.join(outDir, name), await readVendor(name))
  }
}

/**
 * Inline the page CSS at BUILD time — `public/home.css` and
 * `public/manual.css` each `@import` their partials (`common/*.css`,
 * `home/*.css`, `manual/*.css`), which
 * lets us author in small readable files; esbuild bundles them into one
 * one flat sheet per entry, so production ships two stylesheets rather
 * than an `@import` waterfall of render-blocking requests. `common/*`
 * is inlined into BOTH — two independent entries is the trade. The SAME tool + shape
 * as the library build (`build/library.js`); NOT minified, mirroring
 * `dist/han.css` (readable in devtools — brotli at the edge handles the
 * bytes). Dev keeps the raw `@import` files (cascade is identical, the
 * waterfall doesn't matter locally), so no dev middleware is needed.
 *
 * Runs in `closeBundle`, after Vite has copied `public/` verbatim into
 * `dist/`: we overwrite the raw `dist/home.css` with the bundled one.
 * Add more `@import`ed partials freely — they all fold into this output.
 *
 * The now-redundant standalone partials are pruned from `dist`
 * afterwards — see `pruneInlinedPartials()`.
 */
async function bundleHomeCss() {
  for (const entry of ['home.css', 'manual.css']) {
    await esbuild.build({
      entryPoints: [path.join(here, 'public', entry)],
      bundle: true,
      outfile: path.join(MANUAL_DIST, entry),
      allowOverwrite: true,
      loader: { '.woff2': 'file' },
      assetNames: '[name]',
      logLevel: 'warning',
    })
  }
  await pruneInlinedPartials()
}

/**
 * The partials are now inlined, so their standalone copies in `dist` are
 * dead weight — drop every `.css` under `common/` and `home/` except the
 * ones something still fetches by URL:
 *
 *   • `common/controls.css` — dual-homed, `<han-console>` fetches it into its
 *     shadow root (constructed stylesheets can't resolve `@import`, so it
 *     must stay a standalone file).
 *   • `common/icons.css` — dual-homed for the same reason: the console's
 *     ↺ 使用預設值 buttons and controls.css's ＋/－ read `--icon-*` and the
 *     `[data-icon]` primitive from it.
 *
 * Its bytes therefore ship twice: inlined here for the light DOM's
 * critical path, plus the standalone the console fetches async after the
 * gate. ~16KB of overlap, brotli'd and cached — cheaper than a
 * waterfall on first paint.
 */
const KEEP_STANDALONE = new Set([
  'common/controls.css',
  'common/icons.css',
  // `common/select.css` — 同樣 dual-homed：<han-console> 要 fetch 它進 shadow，
  // 而 `specimen.html` 也直接 <link> 它（那一頁不載 home.css，沒有 inline 的那份）。
  'common/select.css',
  // `common/code-terminal.css` — specimen.html 的生成碼直接 <link> 它。
  'common/code-terminal.css',
  // `specimen.html` links it by URL (the console's page-side module-state
  // mapping; the specimen page loads no home.css/manual.css to inline it).
  'common/module-state.css',
])

async function pruneInlinedPartials() {
  for (const dir of ['common', 'home', 'manual']) {
    const abs = path.join(MANUAL_DIST, dir)
    const entries = await fs.readdir(abs).catch(() => [])
    for (const name of entries) {
      if (!name.endsWith('.css') || KEEP_STANDALONE.has(`${dir}/${name}`)) continue
      await fs.rm(path.join(abs, name), { force: true })
    }
    if (!(await fs.readdir(abs).catch(() => ['x'])).length) await fs.rmdir(abs)
  }
}

/**
 * Content-hash the sheets the PAGES link, and rewrite the emitted HTML to
 * the hashed copies under `/assets/` — the one prefix `public/_headers`
 * marks `immutable`, so a repeat visitor (and the home→docs hop, which now
 * shares all four framework URLs) revalidates nothing at all.
 *
 * Copies rather than renames: `/home.css`, `/manual.css` and `/han/*.css`
 * stay reachable at their plain paths on purpose — the playground's
 * generated snippets hand the reader local `/han/han*.min.css` URLs, the
 * docs quote those paths in prose, and an HTML page cached from before this
 * change still resolves. The twins cost ~90KB of dist, nothing on the wire.
 * Their plain paths get `must-revalidate` in `_headers` so a stale copy can
 * never outlive a deploy.
 *
 * Deliberately NOT hashed: anything a URL string inside JS points at —
 * `/han/han.js` (console-config lazy-imports it), `/common/controls.css` and
 * `/common/icons.css` (the console fetches both into its shadow root),
 * `/home/console-templates.js`,
 * `/vendor/*`. Hashing those means rewriting module specifiers, which is a
 * bundler's job, not a rename step's.
 *
 * Only real `<link href>` attributes are rewritten. Code samples in the
 * docs live inside `<pre>` with `&lt;link`, so the literal `<link` in the
 * pattern can't match them.
 */
const HASHED_SHEETS = [
  'home.css',
  'manual.css',
  'han/han.css',
  'han/han.semantics.css',
  'han/han.lines.css',
  'han/han.prose.css',
  'han/han.fonts.css',
]

async function hashLinkedSheets() {
  const assetsDir = path.join(MANUAL_DIST, 'assets')
  await fs.mkdir(assetsDir, { recursive: true })

  /** `/home.css` → `/assets/home.1a2b3c4d.css` */
  const map = new Map()
  for (const rel of HASHED_SHEETS) {
    const src = path.join(MANUAL_DIST, rel)
    if (!existsSync(src)) continue
    const bytes = await fs.readFile(src)
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 8)
    const name = path.basename(rel).replace(/\.css$/, `.${hash}.css`)
    await fs.writeFile(path.join(assetsDir, name), bytes)
    map.set(`/${rel}`, `/assets/${name}`)
  }

  let pages = 0
  for await (const file of glob('**/*.html', { cwd: MANUAL_DIST })) {
    const abs = path.join(MANUAL_DIST, file)
    const html = await fs.readFile(abs, 'utf-8')
    const next = html.replace(
      /(<link\b[^>]*\bhref=")([^"]+)(")/g,
      (whole, head, href, tail) => (map.has(href) ? `${head}${map.get(href)}${tail}` : whole),
    )
    if (next === html) continue
    await fs.writeFile(abs, next)
    pages += 1
  }
  console.log(`  ✓ hashed ${map.size} sheets → /assets/, rewrote ${pages} pages`)
}

/** Frontmatter parser — only `key: value` lines, no nested structures. */
function splitFrontmatter(text) {
  if (!text.startsWith('---\n')) return { meta: {}, body: text }
  const end = text.indexOf('\n---\n', 4)
  if (end === -1) return { meta: {}, body: text }
  const meta = {}
  for (const line of text.slice(4, end).split('\n')) {
    const m = line.match(/^([\w-]+):\s*(.+?)\s*$/)
    if (m) meta[m[1]] = m[2]
  }
  return { meta, body: text.slice(end + 5) }
}

/**
 * Strip the leading H1 from a markdown body — the layout already renders
 * the page title separately. Avoids a duplicate <h1>.
 */
function stripLeadingH1(body) {
  return body.replace(/^\s*#\s+.+\n+/, '')
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
}
function escapeAttr(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}

async function renderMarkdownTree() {
  const $ = await loadNavI18n()
  const {
    NAV, I18N,
    DEFAULT_LOCALE, ALL_LOCALES, LOCALE_SLUGS, HTML_LANG,
    buildPageIndex, renderSidebar, renderLangSwitcher, renderBreadcrumb, urlFor, homeUrlFor,
  } = $

  /**
   * Derive `{ locale, id }` from a markdown source path relative to SRC.
   *   `install.md`        → { locale: 'zh-Hant', id: 'install' }
   *   `en/install.md`     → { locale: 'en',      id: 'install' }
   *   `hans/index.md`     → { locale: 'hans',    id: 'index' }
   */
  const parseSourcePath = relPath => {
    const parts = relPath.replace(/\\/g, '/').split('/')
    if (parts.length > 1 && LOCALE_SLUGS.includes(parts[0])) {
      return { locale: parts[0], id: parts.slice(1).join('/').replace(/\.md$/, '') }
    }
    return { locale: DEFAULT_LOCALE, id: parts.join('/').replace(/\.md$/, '') }
  }

  const pagerHtml = (meta, locale, i18n) => {
    const prevLabel = i18n.pagerPrev ?? '← 前章'
    const nextLabel = i18n.pagerNext ?? '後章 →'
    const parts = []
    if (meta.prev) {
      parts.push(
        `<a data-direction="prev" href="${urlFor(meta.prev.id, locale)}">` +
        `<span data-part="hint">${escapeHtml(prevLabel)}</span>` +
        `<span data-part="title">${escapeHtml(meta.prev.title)}</span>` +
        `</a>`,
      )
    } else {
      parts.push('<span data-part="spacer"></span>')
    }
    if (meta.next) {
      parts.push(
        `<a data-direction="next" href="${urlFor(meta.next.id, locale)}">` +
        `<span data-part="hint">${escapeHtml(nextLabel)}</span>` +
        `<span data-part="title">${escapeHtml(meta.next.title)}</span>` +
        `</a>`,
      )
    } else {
      parts.push('<span data-part="spacer"></span>')
    }
    return (meta.prev || meta.next) ? `<nav class="Pager">${parts.join('')}</nav>` : ''
  }

  // Collect available page IDs per locale → drives sidebar filtering
  // and language-switcher visibility.
  const availableByLocale = Object.fromEntries(ALL_LOCALES.map(loc => [loc, new Set()]))
  const mdFiles = []
  for (const file of await fs.readdir(MD_SRC, { recursive: true })) {
    if (!file.endsWith('.md')) continue
    const { locale, id } = parseSourcePath(file)
    availableByLocale[locale]?.add(id)
    mdFiles.push({ file, locale, id })
  }

  const layout = await fs.readFile(LAYOUT, 'utf-8')
  const indexByLocale = Object.fromEntries(
    ALL_LOCALES.map(loc => [loc, buildPageIndex(loc, availableByLocale[loc], NAV)]),
  )

  for (const { file, locale, id } of mdFiles) {
    const raw = await fs.readFile(path.join(MD_SRC, file), 'utf-8')
    const { meta: fm, body } = splitFrontmatter(raw)

    const navMeta = indexByLocale[locale][id] ?? null
    const i18n = I18N[locale] ?? I18N[DEFAULT_LOCALE]
    const title = fm.title ?? navMeta?.title ?? id

    const env = {}
    const content = md.render(stripLeadingH1(body), env)

    // Page subtitle for the .tagline-en line under the H1. Frontmatter
    // `subtitle:` wins; otherwise default to the framework tagline so
    // the slot never renders empty.
    const pageSubtitle = fm.subtitle ?? `${i18n.siteTitle} v${i18n.version ?? '4.0'}`

    const subs = {
      htmlLang:          HTML_LANG[locale] ?? locale,
      locale,
      pageId:            id,
      title:             escapeHtml(title),
      siteTitle:         escapeHtml(i18n.siteTitle),
      description:       escapeAttr(i18n.description),
      tagline:           escapeHtml(i18n.tagline),
      pageSubtitle:      pageSubtitle,
      toggleNav:         escapeHtml(i18n.toggleNav),
      themeToggle:       escapeAttr(i18n.themeToggle),
      consoleToggleLabel:   escapeAttr(i18n.consoleToggleLabel ?? '調校排版'),
      githubLabel:       escapeHtml(i18n.githubLabel),
      helpRefine:        i18n.helpRefine,
      homeLink:          escapeHtml(i18n.homeLink ?? 'Home'),
      docsLink:          escapeHtml(i18n.docsLink ?? 'Docs'),
      searchPlaceholder: escapeAttr(i18n.searchPlaceholder ?? 'Search docs…'),
      searchEmpty:       escapeHtml(i18n.searchEmpty ?? 'No matching results'),
      searchLoading:     escapeHtml(i18n.searchLoading ?? 'Searching…'),
      searchUnready:     escapeHtml(i18n.searchUnready ?? 'Index not built・run pnpm build:search'),
      searchHintNav:     escapeHtml(i18n.searchHintNav ?? 'Navigate'),
      searchHintOpen:    escapeHtml(i18n.searchHintOpen ?? 'Open'),
      searchHintClose:   escapeHtml(i18n.searchHintClose ?? 'Close'),
      version:           escapeHtml(i18n.version ?? '4.0'),
      homeUrl:           homeUrlFor(locale),
      docsUrl:           urlFor('index', locale),
      sidebar:           renderSidebar(id, locale, i18n.sidebarLabel, availableByLocale[locale], NAV),
      langSwitcher:      renderLangSwitcher(locale, availableByLocale, i18n),
      breadcrumb:        renderBreadcrumb(navMeta, locale, i18n.docsLabel ?? i18n.docsLink ?? 'Docs'),
      pageToc:           renderPageToc(env.headings, i18n.pageTocLabel),
      content,
      pager:             navMeta ? pagerHtml(navMeta, locale, i18n) : '',
    }

    let html = layout
    for (const [k, v] of Object.entries(subs)) {
      html = html.replaceAll(`{{ ${k} }}`, v)
    }
    html = html.replace(/\{\{\s*[\w-]+\s*\}\}/g, '')

    // Docs HTML lands under a `manual/` subtree per locale, mirroring
    // the new `/manual/...` URL namespace. The 404 page is rendered
    // separately by `render404()` from the standalone `_404.html` shell
    // — it doesn't go through the docs chrome at all.
    const localePrefix = locale === DEFAULT_LOCALE ? '' : `${locale}/`
    const outRel = `${localePrefix}manual/${id}.html`
    const outPath = path.join(HTML_ROOT, outRel)
    await fs.mkdir(path.dirname(outPath), { recursive: true })
    await fs.writeFile(outPath, html)
  }
}

/**
 * Render the v4 landing page once per locale.
 *
 * Reads `_home.html` (the shell) plus `home/<section>.html` partials,
 * extracts each file's own i18n block, and substitutes `{{ key }}`
 * placeholders against the merged per-locale dictionary. Writes to
 * `<HTML_ROOT>/<slug>/index.html` (default locale at root).
 *
 * Independent of the docs Markdown pipeline — the homepage doesn't
 * follow `_nav.js` and isn't affected by which docs translations exist.
 */
async function renderHomepage() {
  const $ = await loadNavI18n()
  const { urlFor } = $

  const shared = extractHomeI18n(await fs.readFile(HOME_SHARED, 'utf-8'))
  const layout = extractHomeI18n(await fs.readFile(HOME_LAYOUT, 'utf-8'))
  const partials = Object.fromEntries(
    await Promise.all(HOME_SECTIONS.map(async name =>
      [name, extractHomeI18n(await fs.readFile(path.join(HOME_DIR, `${name}.html`), 'utf-8'))],
    )),
  )
  const ledger = await computeModuleLedger()

  for (const locale of HOME_LOCALE_SLUGS) {
    // Per-file keys are partitioned (no cross-file sharing), so merging
    // every file's dict into one ctx is collision-free. `_shared.html`
    // holds the exception — cross-template tokens (the brand `logo`)
    // merged FIRST so any file may reference them via `{{ … }}`.
    const t = Object.assign(
      localizeHomeI18n(shared.dict, locale),
      localizeHomeI18n(layout.dict, locale),
      ...Object.values(partials).map(p => localizeHomeI18n(p.dict, locale)),
    )
    const homeUrl = locale === HOME_DEFAULT_LOCALE ? '/' : `/${locale}/`
    // Docs entry — point at the matching locale's manual root if it
    // exists, else fall back to the default locale's manual.
    const docsLocale = locale === 'hant' ? 'hant'
      : locale === 'hans' ? 'hant' // hans docs not shipped yet
      : locale === 'ko'   ? 'hant'
      : locale
    const docsUrl = urlFor('index', docsLocale)

    const ctx = {
      ...t,
      ...ledger,
      htmlLang: HOME_HTML_LANG[locale] ?? locale,
      locale,
      homeUrl,
      docsUrl,
      langSwitcher: renderHomeLangSwitcher(locale, HOME_LOCALE_SLUGS, HOME_LOCALE_LABELS, t),
    }

    const sections = Object.fromEntries(
      Object.entries(partials).map(([name, p]) => [`${camel(name)}Section`, applySubs(p.body, ctx)]),
    )

    // The console is now a `<han-console>` component (see _home.html); its
    // locale template comes from `home/console-templates.js`
    // (renderConsoleTemplatesSource) instead of an inline `{{ consoleSection }}`.
    let html = applySubs(layout.body, { ...ctx, ...sections })
    html = html.replace(/\{\{\s*[\w-]+\s*\}\}/g, '')
    html = fillSpecificity(html)

    const outPath = locale === HOME_DEFAULT_LOCALE
      ? path.join(HTML_ROOT, 'index.html')
      : path.join(HTML_ROOT, locale, 'index.html')
    await fs.mkdir(path.dirname(outPath), { recursive: true })
    await fs.writeFile(outPath, html)
  }
}

/**
 * Generate the `<han-console>` shadow template module — `home/console.html`
 * expanded once per homepage locale via the SAME `applySubs` machinery
 * (and the same trailing-`{{ }}` sweep) that `renderHomepage()` uses for
 * the section partials, so the two can't drift. `home/console.html` (with
 * its own i18n block) stays the single source of truth; this just
 * pre-bakes the five expansions into an ESM module the component
 * imports at runtime:
 *
 *   export const TEMPLATES = { hant: '…', hans: '…', en: '…', ja: '…', ko: '…' }
 *
 * Emitted to `dist/home/console-templates.js` at build time and served
 * dynamically at the same URL in dev (middleware below) — never written
 * into the source tree, so git stays clean.
 */
async function renderConsoleTemplatesSource() {
  const source = extractHomeI18n(await fs.readFile(HOME_CONSOLE, 'utf-8'))

  const entries = HOME_LOCALE_SLUGS.map((locale) => {
    const t = localizeHomeI18n(source.dict, locale)
    const html = applySubs(source.body, t).replace(/\{\{\s*[\w-]+\s*\}\}/g, '')
    return `  ${JSON.stringify(locale)}: ${JSON.stringify(html)}`
  })

  return (
    `// GENERATED by vite.config.js from home/console.html × HOME_I18N.\n` +
    `// Do not edit — regenerated on every build / dev request.\n` +
    `export const TEMPLATES = {\n${entries.join(',\n')},\n}\n`
  )
}

async function emitConsoleTemplates() {
  const src = await renderConsoleTemplatesSource()
  const outPath = path.join(MANUAL_DIST, 'home', 'console-templates.js')
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, src)
}

/**
 * Render `_404.html` per locale into `<localePrefix>404.html`. Stays out
 * of the docs Markdown pipeline so the page can keep its own minimal
 * shell — no sidebar, no breadcrumb, no pager. Static hosts (Cloudflare
 * Pages, gh-pages, Vercel) serve `404.html` for unknown paths from the
 * nearest directory, so per-locale fallbacks resolve correctly under
 * `/`, `/en/`, `/ja/`, `/hans/`, `/ko/`.
 */
async function render404() {
  const $ = await loadNavI18n()
  const { I18N, ALL_LOCALES, DEFAULT_LOCALE, HTML_LANG, urlFor, homeUrlFor } = $

  const layout = await fs.readFile(NOT_FOUND_LAYOUT, 'utf-8')

  for (const locale of ALL_LOCALES) {
    const i18n = I18N[locale] ?? I18N[DEFAULT_LOCALE]
    const subs = {
      htmlLang:         HTML_LANG[locale] ?? locale,
      locale,
      siteTitle:        escapeHtml(i18n.siteTitle),
      description:      escapeAttr(i18n.description),
      version:          escapeHtml(i18n.version ?? '4.0'),
      homeUrl:          homeUrlFor(locale),
      docsUrl:          urlFor('index', locale),
      homeLink:         escapeHtml(i18n.homeLink ?? 'Home'),
      docsLink:         escapeHtml(i18n.docsLink ?? 'Docs'),
      themeToggle:      escapeAttr(i18n.themeToggle),
      githubLabel:      escapeHtml(i18n.githubLabel),
      notFoundTitle:    escapeHtml(i18n.notFoundTitle),
      notFoundBody:     escapeHtml(i18n.notFoundBody),
      notFoundBackHome: escapeHtml(i18n.notFoundBackHome),
      notFoundBackDocs: escapeHtml(i18n.notFoundBackDocs),
    }

    let html = layout
    for (const [k, v] of Object.entries(subs)) {
      html = html.replaceAll(`{{ ${k} }}`, v)
    }
    html = html.replace(/\{\{\s*[\w-]+\s*\}\}/g, '')

    const localePrefix = locale === DEFAULT_LOCALE ? '' : `${locale}/`
    const outPath = path.join(HTML_ROOT, `${localePrefix}404.html`)
    await fs.mkdir(path.dirname(outPath), { recursive: true })
    await fs.writeFile(outPath, html)
  }
}

/**
 * 樣張頁 — `demo/specimen.html` 是**唯一來源**，寫出兩份：
 *
 *   /specimen.html      逐字照抄。han 的 JS 後備在瀏覽器裡跑（<han-console>
 *                       掛載時 installFallbacks(main)）。
 *   /specimen.ssr.html  同一份標記，但 `<main>` 已經在 Node 裡跑過
 *                       `installFallbacks()`——`<h-char>`／`<h-iss>`／
 *                       `<h-layer>` 烤進 HTML，瀏覽器端一支 han 的 JS 都不跑。
 *
 * 兩頁是**生成的雙生子而不是兩份檔案**：內容一旦分家，「差別只在 JS 跑的位置」
 * 這句話就不再為真，而那正是這一對頁面唯一要展示的東西。頁內少數必須不同的
 * 文案由 `<html data-han-ssr>` 以 CSS 切換（specimen.html § 三），不進這裡。
 *
 * 這裡寫出的 SSR 那一份是**保底**：`mode: 'build'`，任何靜態託管都吃得到。
 * 部署到 Cloudflare Pages／Vercel 時，`functions/` ／ `api/` 底下的邊緣函式會
 * 攔下同一個網址，在**每個請求**現排一份（`mode: 'request'`）蓋過它；函式掛了
 * 就自動退回這一份。dev 的 middleware 同樣是逐次請求現算。頁面上的時間戳分得
 * 出自己是哪一種——那是刻意的，不靠文案宣稱。
 *
 * 這頁是 SHIPPED page，與同目錄的工作台頁（`dash-fuse.html` …，dev-only）不同。
 */
async function renderSpecimenPages() {
  const src = await fs.readFile(path.join(DEMO_DIR, SPECIMEN_FILE), 'utf-8')
  await fs.mkdir(HTML_ROOT, { recursive: true })
  await fs.writeFile(path.join(HTML_ROOT, 'specimen.html'), src)

  const prerendered = await ssrSpecimen(src, { mode: 'build' })
  await fs.writeFile(path.join(HTML_ROOT, 'specimen.ssr.html'), prerendered)
  // 同一份、第二個網址。Vercel 上 `/specimen.ssr.html` 被 rewrite 給了函式
  // （vercel.json），函式掛掉時就沒有路可以回到靜態那一份了——這個別名就是那條
  // 退路。Cloudflare 不需要它（`env.ASSETS.fetch()` 讀得到被函式蓋住的原檔），
  // 留著是為了兩家共用一份輸出。代價是部署裡多一份約 490KB 的 HTML，可接受：
  // 它壓縮得極好，而且沒有任何讀者路徑會同時抓兩份。
  await fs.writeFile(path.join(HTML_ROOT, 'specimen.ssr.prebuilt.html'), prerendered)
}

/**
 * 樣張頁的伺服器端變體、以及那五處變換的說明，全在 `manual/ssr-specimen.js`
 * ——本檔（建置時）、dev middleware（每個請求）與生產的邊緣函式（每個請求）
 * 共用同一支，三邊的輸出才保證一致。
 */

function camel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

/**
 * Substitute `{{ key }}` — and STRIP MARKUP when the placeholder sits inside a
 * tag (i.e. in an attribute value).
 *
 * The i18n values are HTML: Korean copy carries `<ruby>` per the house style.
 * That is right in content position and wrong in an attribute, where the
 * browser has nowhere to render it — a `title` shows the literal tags, an
 * `aria-label` gets read out tag by tag, and `data-label-default` (which
 * console-config.js appends to a button as TEXT) prints `<ruby>基本…` on
 * screen. Caught in the wild on the 度量 group's ↺ button, 2026-08-06.
 *
 * Position is decided by a scan, not by a per-key opt-out list: if the last
 * `<` before the placeholder is later than the last `>`, we are inside a tag.
 * Six keys across four templates were already affected; a list would have
 * gone stale the moment someone added the seventh.
 */
const stripMarkup = (html) =>
  String(html)
    // <rt> first: ruby annotations are a GLOSS on the base, so dropping the
    // tags alone would splice the reading into the word — `<ruby>基本<rt>기본
    // </rt></ruby>값` became `基本기본값`, the hanja followed by its own
    // pronunciation. Only the base survives into an attribute.
    .replace(/<rt\b[^>]*>.*?<\/rt>/gs, '')
    .replace(/<rp\b[^>]*>.*?<\/rp>/gs, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const insideTag = (text, index) =>
  text.lastIndexOf('<', index) > text.lastIndexOf('>', index)

function applySubs(template, ctx) {
  return template.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (match, key, offset) => {
    if (!(key in ctx)) return match
    const value = ctx[key] ?? ''
    return insideTag(template, offset) ? stripMarkup(value) : value
  })
}

function renderHomeLangSwitcher(active, slugs, labels, t) {
  const items = slugs.map(slug => {
    const lab = labels[slug]
    const href = slug === 'hant' ? '/' : `/${slug}/`
    const isActive = slug === active
    return `<li><a href="${href}"${isActive ? ' class="is-active"' : ''} data-lang="${slug}">
      <span data-part="flag">${escapeHtml(lab.flag)}</span>
      <span data-part="texts">
        <span data-part="full">${escapeHtml(lab.full)}</span>
        <span data-part="code">${slug}</span>
      </span>
      ${isActive ? '<span data-part="check" data-icon="check" aria-hidden="true"></span>' : ''}
    </a></li>`
  }).join('')

  return `<div class="LangSwitcher" data-lang-switcher>
    <button type="button" aria-haspopup="true" aria-expanded="false" aria-label="${escapeAttr(t.langSwitcherLabel)}">
      <span data-part="icon" aria-hidden="true"><span data-glyph="zh">文</span><span data-glyph="la">A</span></span>
      <span data-part="caret" data-icon="chevron" data-dir="down" aria-hidden="true"></span>
    </button>
    <ul hidden>
      <li data-part="label">${escapeHtml(t.langSwitcherLabel)}</li>
      ${items}
      <li data-part="foot">
        <span aria-hidden="true">※</span>
        <span>${escapeHtml(t.langSwitcherFoot)}</span>
      </li>
    </ul>
  </div>`
}

function hanManualPlugin() {
  return {
    name: 'han-manual',

    async buildStart() {
      await syncFramework()
      await renderMarkdownTree()
      await renderHomepage()
      await render404()
      await renderSpecimenPages()
    },

    // `dist/` exists only after the bundle is written; emit the
    // <han-console> template module here so it lands beside the copied
    // public assets (dist/home/). The component fetches it at runtime —
    // it's a public/raw ESM asset, never part of rollup's graph.
    async closeBundle() {
      await emitConsoleTemplates()
      await emitVendor()
      await bundleHomeCss()
      // last: hashing reads the FINAL bytes of the bundled sheets
      await hashLinkedSheets()
    },

    configureServer(server) {
      // 兩張樣張 — read STRAIGHT off `demo/specimen.html` on every request, so a
      // save is live on the next reload. (Build still writes both into
      // HTML_ROOT; see renderSpecimenPages.)
      //
      // Why not the copy-in path in dev: the source lives outside Vite's root
      // (.cache/docs), so Vite never sees the edit, and the copy only happens
      // if the watcher branch below is registered — which it is not for a dev
      // server that was started BEFORE this config gained that branch. The
      // symptom is brutal to debug: you edit, you reload, nothing changes, and
      // nothing anywhere says why. Reading from source removes the whole class.
      //
      // 順帶一提，`/specimen.ssr.html` 在 dev 下**真的是**伺服器渲染：每一次
      // 請求現跑一遍 `installFallbacks()`，不是讀建置好的檔。
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0]
        const ssr = pathname === '/specimen.ssr.html'
        if (!ssr && pathname !== '/specimen.html') return next()
        const src = await fs.readFile(path.join(DEMO_DIR, SPECIMEN_FILE), 'utf-8')
        res.setHeader('content-type', 'text/html; charset=utf-8')
        res.setHeader('cache-control', 'no-store')
        res.end(ssr ? await ssrSpecimen(src, { mode: 'request' }) : src)
      })

      // Serve the generated <han-console> template module dynamically —
      // regenerated per request so it tracks edits to home/console.html and
      // HOME_I18N with the rest of the homepage re-render. Registered
      // before the static handler; the file never exists on disk in
      // dev, so nothing shadows it.
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0]
        if (pathname !== '/home/console-templates.js') return next()
        res.setHeader('content-type', 'text/javascript; charset=utf-8')
        res.setHeader('cache-control', 'no-store')
        res.end(await renderConsoleTemplatesSource())
      })

      // Serve the vendored runtime ESM (marked / DOMPurify) straight from
      // node_modules — the files never exist in the source tree, so
      // nothing shadows them. Build emits them to `dist/vendor/` in
      // closeBundle instead (emitVendor).
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0]
        if (!pathname.startsWith('/vendor/')) return next()
        const name = pathname.slice('/vendor/'.length)
        if (!Object.hasOwn(VENDOR_ASSETS, name)) return next()
        res.setHeader('content-type', 'text/javascript; charset=utf-8')
        res.setHeader('cache-control', 'no-store')
        res.end(await readVendor(name))
      })

      // Files outside `root` (= SRC) need explicit registration; vite's
      // watcher won't pick them up otherwise. esbuild-style: build is
      // fresh on each change, you decide when to refresh the browser.
      server.watcher.add([HAN_DIST, NAV_FILE, I18N_FILE, LAYOUT, NOT_FOUND_LAYOUT, HOME_LAYOUT, HOME_DIR, DEMO_DIR])

      // Trailing-slash leniency for flat top-level entries: a request
      // for `/demo/` should serve `.cache/docs/demo.html`, the same as
      // `/demo`. Vite's static handler natively maps `/X/` to
      // `X/index.html`, so flat entries like `demo.html` (no sibling
      // `demo/index.html`) 404 with a trailing slash. Locale dirs like
      // `/en/` continue to resolve via `en/index.html` because the
      // existsSync check below only fires when an `<X>.html` exists at
      // the cache root and that takes priority — `en.html` doesn't
      // exist, so `/en/` falls through unchanged.
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? ''
        const [pathname, query = ''] = url.split('?')
        if (pathname.length > 1 && pathname.endsWith('/')) {
          const trimmed = pathname.slice(0, -1)
          const file = path.join(HTML_ROOT, trimmed.slice(1) + '.html')
          if (file.startsWith(HTML_ROOT) && existsSync(file)) {
            req.url = trimmed + (query ? '?' + query : '')
          }
        }
        next()
      })

      // Pagefind is a build-time artefact written to `dist/pagefind/`.
      // In dev we serve it from there so the search UI works without
      // copying the index into `public/` (which would dirty git and
      // race with the next build). The index is regenerated by
      // `pnpm build:search`; until then this middleware 404s like any
      // missing static asset, and the UI shows the unready hint.
      const PAGEFIND_DEV_DIR = path.resolve(here, 'dist', 'pagefind')
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/pagefind/')) return next()
        const rel = req.url.replace(/^\/pagefind\//, '').split('?')[0]
        const file = path.join(PAGEFIND_DEV_DIR, rel)
        if (!file.startsWith(PAGEFIND_DEV_DIR) || !existsSync(file)) return next()
        const ext = path.extname(file)
        const mime = ext === '.js'   ? 'text/javascript; charset=utf-8'
                   : ext === '.css'  ? 'text/css; charset=utf-8'
                   : ext === '.json' ? 'application/json; charset=utf-8'
                   : ext === '.wasm' ? 'application/wasm'
                   : 'application/octet-stream'
        res.setHeader('content-type', mime)
        res.setHeader('cache-control', 'no-store')
        res.end(await fs.readFile(file))
      })

      let pendingFramework = false
      const onChange = async file => {
        if (file.startsWith(HAN_DIST)) {
          if (pendingFramework) return
          pendingFramework = true
          setTimeout(async () => {
            await syncFramework()
            console.log('[han-manual] framework rebuilt → public/han/ refreshed (refresh browser)')
            pendingFramework = false
          }, 100)
          return
        }

        if (file.endsWith('.md') && file.startsWith(MD_SRC)) {
          await renderMarkdownTree()
          console.log(`[han-manual] ${path.basename(file)} → re-rendered (refresh browser)`)
          return
        }

        if (file === HOME_LAYOUT || file.startsWith(HOME_DIR)) {
          await renderHomepage()
          console.log(`[han-manual] ${path.basename(file)} → homepage re-rendered (refresh browser)`)
          return
        }

        // specimen.html 不進 watcher：dev 由上方的 middleware 逐次請求直接讀
        // 來源檔（SSR 那份也現算），存檔即生效，沒有中間產物可以走味。

        if (file === NOT_FOUND_LAYOUT) {
          await render404()
          console.log('[han-manual] _404.html → 404 re-rendered (refresh browser)')
          return
        }

        if (file === LAYOUT || file === NAV_FILE || file === I18N_FILE) {
          await renderMarkdownTree()
          await renderHomepage()
          await render404()
          console.log('[han-manual] layout/nav/i18n changed → all pages re-rendered (refresh browser)')
        }
      }

      server.watcher.on('change', onChange)
      server.watcher.on('add', onChange)
      server.watcher.on('unlink', onChange)
    },
  }
}

export default defineConfig({
  root: HTML_ROOT,
  publicDir: path.resolve(here, 'public'),
  plugins: [hanManualPlugin()],
  appType: 'mpa',
  server: {
    hmr: false,
    fs: {
      allow: [path.resolve(here, '..')],
    },
  },
  build: {
    outDir: path.resolve(here, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: await collectHtmlEntries(),
    },
  },
})

async function collectHtmlEntries() {
  // Wipe `.cache/docs/` first so renames and removals don't leave orphan
  // HTML — a deleted `.md` would otherwise still glob in below and feed
  // a stale page into rollup inputs. Renders below recreate everything.
  await fs.rm(HTML_ROOT, { recursive: true, force: true })
  await fs.mkdir(HTML_ROOT, { recursive: true })
  await syncFramework()
  await renderMarkdownTree()
  await renderHomepage()
  await render404()
  await renderSpecimenPages()
  const inputs = {}
  for await (const file of glob('**/*.html', { cwd: HTML_ROOT })) {
    const id = file.replace(/\.html$/, '').replace(/\\/g, '/')
    inputs[id] = path.resolve(HTML_ROOT, file)
  }
  return inputs
}
