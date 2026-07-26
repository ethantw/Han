import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { glob } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import esbuild from 'esbuild'
import { defineConfig } from 'vite'
import MarkdownIt from 'markdown-it'
import { cjkEmphasis } from './_md-cjk-emphasis.js'
import { headings, renderPageToc } from './_md-headings.js'
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
 * real gzipped weight of each han.css module beside its cascade-layer chip,
 * plus a footing line (four-module total ＋ runtime-dep count).
 *
 *   - sizeSemantics / sizeLines / sizeProse / sizeFonts
 *             gzipped size of each per-module `dist/han.<mod>.min.css`, kb
 *             with one decimal formatted like '2.3k'; a missing file → '—'.
 *   - sizeTotal  sum of the four, one decimal + 'k'.
 *   - depsCount  count of runtime deps in root package.json.
 *
 * The four module keys map 1:1 to the LayerMap's four chips (han-semantics
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
  const keys = Object.keys(modules)
  const [sizes, deps] = await Promise.all([
    Promise.all(keys.map(k => gzippedSizeKb(path.join(HAN_DIST, modules[k])))),
    countRuntimeDeps(),
  ])
  const fmtSize = kb => kb == null ? '—' : `${kb}k`
  const total = sizes.reduce((sum, kb) => sum + (kb ?? 0), 0)
  _moduleLedgerCache = {
    ...Object.fromEntries(keys.map((k, i) => [k, fmtSize(sizes[i])])),
    sizeTotal: `${total.toFixed(1)}k`,
    depsCount: String(deps),
  }
  return _moduleLedgerCache
}

async function gzippedSizeKb(file) {
  if (!existsSync(file)) return null
  const buf = await fs.readFile(file)
  return +(gzipSync(buf).length / 1024).toFixed(1)
}

async function countRuntimeDeps() {
  try {
    const pkg = JSON.parse(await fs.readFile(path.resolve(here, '..', 'package.json'), 'utf-8'))
    return Object.keys(pkg.dependencies ?? {}).length
  } catch {
    return 0
  }
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
  'manifesto', 'station-semantics', 'station-type', 'station-lines',
  'station-prose', 'station-craft', 'station-playground', 'station-snippet', 'closing',
]
// The rail is chrome, not a station — it sits OUTSIDE <main class="han">
// (mounted into `<aside data-rail-mount>`), so it stays out of
// HOME_SECTIONS and gets its own `{{ railSection }}` token instead of a
// `<name>Section` one derived from the HOME_SECTIONS list.
const HOME_RAIL = path.resolve(HOME_DIR, 'rail.html')
// Per-section demo sources. `index.html` carries the page shell + a
// `<!--demos: slug1 slug2 …-->` declaration; each `<slug>.md` holds the
// inner content of one demo. `renderDemoPage()` stitches them into
// `.cache/docs/demo.html` so it joins the rest of the manual at /demo.
const DEMO_DIR = path.resolve(here, 'demo')

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
// generated rail-templates module.
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
 *   • `home/controls.css` — dual-homed, `<han-rail>` fetches it into its
 *     shadow root (constructed stylesheets can't resolve `@import`, so it
 *     must stay a standalone file).
 *
 * Its bytes therefore ship twice: inlined here for the light DOM's
 * critical path, plus the standalone the rail fetches async after the
 * gate. ~16KB of overlap, brotli'd and cached — cheaper than a
 * waterfall on first paint.
 */
const KEEP_STANDALONE = new Set(['home/controls.css'])

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
 * `/han/han.js` (rail-config lazy-imports it), `/home/controls.css` (the
 * rail fetches it into its shadow root), `/home/rail-templates.js`,
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
      railToggleLabel:   escapeAttr(i18n.railToggleLabel ?? '調校排版'),
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

    // The rail is now a `<han-rail>` component (see _home.html); its
    // locale template comes from `home/rail-templates.js`
    // (renderRailTemplatesSource) instead of an inline `{{ railSection }}`.
    let html = applySubs(layout.body, { ...ctx, ...sections })
    html = html.replace(/\{\{\s*[\w-]+\s*\}\}/g, '')

    const outPath = locale === HOME_DEFAULT_LOCALE
      ? path.join(HTML_ROOT, 'index.html')
      : path.join(HTML_ROOT, locale, 'index.html')
    await fs.mkdir(path.dirname(outPath), { recursive: true })
    await fs.writeFile(outPath, html)
  }
}

/**
 * Generate the `<han-rail>` shadow template module — `home/rail.html`
 * expanded once per homepage locale via the SAME `applySubs` machinery
 * (and the same trailing-`{{ }}` sweep) that `renderHomepage()` uses for
 * the section partials, so the two can't drift. `home/rail.html` (with
 * its own i18n block) stays the single source of truth; this just
 * pre-bakes the five expansions into an ESM module the component
 * imports at runtime:
 *
 *   export const TEMPLATES = { hant: '…', hans: '…', en: '…', ja: '…', ko: '…' }
 *
 * Emitted to `dist/home/rail-templates.js` at build time and served
 * dynamically at the same URL in dev (middleware below) — never written
 * into the source tree, so git stays clean.
 */
async function renderRailTemplatesSource() {
  const rail = extractHomeI18n(await fs.readFile(HOME_RAIL, 'utf-8'))

  const entries = HOME_LOCALE_SLUGS.map((locale) => {
    const t = localizeHomeI18n(rail.dict, locale)
    const html = applySubs(rail.body, t).replace(/\{\{\s*[\w-]+\s*\}\}/g, '')
    return `  ${JSON.stringify(locale)}: ${JSON.stringify(html)}`
  })

  return (
    `// GENERATED by vite.config.js from home/rail.html × HOME_I18N.\n` +
    `// Do not edit — regenerated on every build / dev request.\n` +
    `export const TEMPLATES = {\n${entries.join(',\n')},\n}\n`
  )
}

async function emitRailTemplates() {
  const src = await renderRailTemplatesSource()
  const outPath = path.join(MANUAL_DIST, 'home', 'rail-templates.js')
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
 * Concat the per-section files in `manual/demo/` into a single page.
 * `index.html` is the page shell; its `<!--demos: slug1 slug2 …-->`
 * comment names the slugs (one per line) in render order. Each
 * `<slug>.md` is markdown-rendered (raw HTML passes through) and
 * wrapped in `<section id="<slug>" class="demo-section">…</section>`,
 * then the comment block is replaced with the concatenation.
 *
 * Reordering / adding / removing demos is one place: edit the comment
 * block in `index.html`. Missing-file or empty-list cases throw a
 * named error so dev-mode noise points straight at the offending slug.
 */
async function renderDemoPage() {
  const shellPath = path.join(DEMO_DIR, 'index.html')
  const shell = await fs.readFile(shellPath, 'utf-8')

  const m = shell.match(/<!--\s*demos:\s*([\s\S]*?)-->/)
  if (!m) {
    throw new Error(`[han-manual] manual/demo/index.html: missing <!--demos: ...--> declaration`)
  }
  const slugs = m[1].split('\n').map(s => s.trim()).filter(Boolean)
  if (slugs.length === 0) {
    throw new Error(`[han-manual] manual/demo/index.html: <!--demos: ...--> block is empty`)
  }

  const rendered = await Promise.all(slugs.map(async slug => {
    const file = path.join(DEMO_DIR, `${slug}.md`)
    if (!existsSync(file)) {
      throw new Error(`[han-manual] manual/demo/index.html lists "${slug}" but ${file} does not exist`)
    }
    const src = await fs.readFile(file, 'utf-8')
    const inner = md.render(src)
    return `<section id="${slug}" class="demo-section">\n${inner}</section>`
  }))

  const html = shell.replace(m[0], rendered.join('\n'))
  const outPath = path.join(HTML_ROOT, 'demo.html')
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, html)
}

function camel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

function applySubs(template, ctx) {
  let out = template
  for (const [k, v] of Object.entries(ctx)) {
    out = out.replaceAll(`{{ ${k} }}`, v ?? '')
  }
  return out
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
      ${isActive ? '<span data-part="check">✓</span>' : ''}
    </a></li>`
  }).join('')

  return `<div class="LangSwitcher" data-lang-switcher>
    <button type="button" aria-haspopup="true" aria-expanded="false" aria-label="${escapeAttr(t.langSwitcherLabel)}">
      <span data-part="icon" aria-hidden="true"><span data-glyph="zh">文</span><span data-glyph="la">A</span></span>
      <span data-part="caret" aria-hidden="true">▾</span>
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
      await renderDemoPage()
    },

    // `dist/` exists only after the bundle is written; emit the
    // <han-rail> template module here so it lands beside the copied
    // public assets (dist/home/). The component fetches it at runtime —
    // it's a public/raw ESM asset, never part of rollup's graph.
    async closeBundle() {
      await emitRailTemplates()
      await emitVendor()
      await bundleHomeCss()
      // last: hashing reads the FINAL bytes of the bundled sheets
      await hashLinkedSheets()
    },

    configureServer(server) {
      // Serve the generated <han-rail> template module dynamically —
      // regenerated per request so it tracks edits to home/rail.html and
      // HOME_I18N with the rest of the homepage re-render. Registered
      // before the static handler; the file never exists on disk in
      // dev, so nothing shadows it.
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0]
        if (pathname !== '/home/rail-templates.js') return next()
        res.setHeader('content-type', 'text/javascript; charset=utf-8')
        res.setHeader('cache-control', 'no-store')
        res.end(await renderRailTemplatesSource())
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

        if (file.startsWith(DEMO_DIR) && (file.endsWith('.md') || file.endsWith('index.html'))) {
          await renderDemoPage()
          console.log(`[han-manual] ${path.basename(file)} → demo re-rendered (refresh browser)`)
          return
        }

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
  await renderDemoPage()
  const inputs = {}
  for await (const file of glob('**/*.html', { cwd: HTML_ROOT })) {
    const id = file.replace(/\.html$/, '').replace(/\\/g, '/')
    inputs[id] = path.resolve(HTML_ROOT, file)
  }
  return inputs
}
