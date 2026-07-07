import path from 'node:path'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { glob } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { execFileSync } from 'node:child_process'
import { defineConfig } from 'vite'
import MarkdownIt from 'markdown-it'
import { cjkEmphasis } from './_md-cjk-emphasis.js'
import { headings, renderPageToc } from './_md-headings.js'

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

async function loadHomeData() {
  const url = pathToFileURL(HOME_DATA).href + `?t=${Date.now()}`
  return dynImport(url)
}

/**
 * Hero stats — baked at build time so the four <dt> tiles in hero.html
 * reflect reality instead of typeset placeholders. ASCII formatting
 * across all locales (hant once used "一萬二 / 四 / 八.二 / 零"; the
 * priority is real data, the typographic numerals can come back via
 * a maintainer-curated formatter if desired).
 *
 *   - stars   GitHub stargazer count (gh api; falls back to "—")
 *   - scripts 4 — CJK script families covered (Han / Kana / Hangul /
 *             Latin run via mixed-script spacing). Hardcoded; the
 *             label across locales matches a small integer.
 *   - size    gzipped `dist/han.min.css` size in kb, one decimal
 *   - deps    count of runtime deps in root package.json
 */
let _heroStatsCache = null
async function computeHeroStats() {
  if (_heroStatsCache) return _heroStatsCache
  const [stars, sizeKb, deps] = await Promise.all([
    fetchStars(),
    gzippedSizeKb(path.join(HAN_DIST, 'han.min.css')),
    countRuntimeDeps(),
  ])
  const fmtStars = n => n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n)
  const fmtSize  = kb => kb == null ? '—' : `${kb}k`
  _heroStatsCache = {
    statStarsValue:   fmtStars(stars),
    statScriptsValue: '4',
    statSizeValue:    fmtSize(sizeKb),
    statDepsValue:    String(deps),
  }
  return _heroStatsCache
}

function fetchStars() {
  try {
    const out = execFileSync('gh', ['api', 'repos/ethantw/Han', '--jq', '.stargazers_count'], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    })
    const n = Number(out.trim())
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
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
// locale gets its own `index.html` rendered straight from these
// templates and the shared `_data.js` dictionary.
const HOME_DIR = path.resolve(here, 'home')
const HOME_LAYOUT = path.resolve(here, '_home.html')
const HOME_DATA = path.resolve(HOME_DIR, '_data.js')
const HOME_SECTIONS = ['hero', 'features', 'playground', 'getting-started', 'footer']
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
 * substitutes `{{ key }}` placeholders against `HOME_I18N[locale]`, and
 * writes to `<HTML_ROOT>/<slug>/index.html` (default locale at root).
 *
 * Independent of the docs Markdown pipeline — the homepage doesn't
 * follow `_nav.js` and isn't affected by which docs translations exist.
 */
async function renderHomepage() {
  const home = await loadHomeData()
  const $ = await loadNavI18n()
  const { urlFor } = $
  const {
    HOME_I18N, HOME_LOCALE_SLUGS, HOME_DEFAULT_LOCALE, HOME_HTML_LANG,
    HOME_LOCALE_LABELS,
  } = home

  const layout = await fs.readFile(HOME_LAYOUT, 'utf-8')
  const partials = Object.fromEntries(
    await Promise.all(HOME_SECTIONS.map(async name =>
      [name, await fs.readFile(path.join(HOME_DIR, `${name}.html`), 'utf-8')],
    )),
  )
  const stats = await computeHeroStats()

  for (const locale of HOME_LOCALE_SLUGS) {
    const t = HOME_I18N[locale] ?? HOME_I18N[HOME_DEFAULT_LOCALE]
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
      ...stats,
      htmlLang: HOME_HTML_LANG[locale] ?? locale,
      locale,
      homeUrl,
      docsUrl,
      langSwitcher: renderHomeLangSwitcher(locale, HOME_LOCALE_SLUGS, HOME_LOCALE_LABELS, t),
    }

    const sections = Object.fromEntries(
      Object.entries(partials).map(([name, src]) => [`${camel(name)}Section`, applySubs(src, ctx)]),
    )

    let html = applySubs(layout, { ...ctx, ...sections })
    html = html.replace(/\{\{\s*[\w-]+\s*\}\}/g, '')

    const outPath = locale === HOME_DEFAULT_LOCALE
      ? path.join(HTML_ROOT, 'index.html')
      : path.join(HTML_ROOT, locale, 'index.html')
    await fs.mkdir(path.dirname(outPath), { recursive: true })
    await fs.writeFile(outPath, html)
  }
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

    configureServer(server) {
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
