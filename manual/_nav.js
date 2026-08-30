/**
 * Sidebar navigation — single source of truth shared by the vite plugin
 * and (in principle) any client-side enhancement.
 *
 * Each leaf node names a page id (= `src/[locale]/<id>.md`, with the
 * default locale `zh-Hant` living at `src/<id>.md` directly). Titles
 * are objects keyed by locale; missing locales fall back to `zh-Hant`.
 */

import {
  DEFAULT_LOCALE, LOCALE_SLUGS, ALL_LOCALES, HTML_LANG, LOCALE_LABELS,
} from './_locales.js'
export {
  DEFAULT_LOCALE, LOCALE_SLUGS, ALL_LOCALES, HTML_LANG, LOCALE_LABELS,
}

/*
 * v4 結構（2026-07-20 定，v4-rc-plan.md 決策 4）：平攤四模組，
 * 一模組一頁、頁內錨點分節——與代碼（src/css 四模組）、console 面板
 * 四組開關一比一對應，讀者從面板到文檔零翻譯。
 * 舊「基本功能／高級排版」主題分組在 v4 已無對應物，廢除。
 * RC 後補頁（設計理念／FAQ／辭彙表）直接加條目即可——建構管線
 * 只 render 有 .md 的頁，側欄自動過濾。
 */
export const NAV = [
  {
    title: { hant: '從何開始', en: 'Getting started', ja: 'はじめに' },
    pages: [
      { id: 'index',   title: { hant: '簡介', en: 'Introduction', ja: '紹介', hans: '简介', ko: '소개' } },
      { id: 'install', title: { hant: '安裝與啓用', en: 'Install & enable' } },
    ],
  },
  {
    title: { hant: '四大模組', en: 'The four modules' },
    pages: [
      { id: 'semantics', title: { hant: '語意樣式標準化', en: 'Semantic styles' } },
      { id: 'lines',     title: { hant: '行的調整', en: 'Line adjustments' } },
      { id: 'prose',     title: { hant: '段落間距調整', en: 'Prose spacing' } },
      { id: 'fonts',     title: { hant: '字體', en: 'Fonts' } },
    ],
  },
  {
    title: { hant: 'API' },
    pages: [
      { id: 'api-js', title: { hant: 'JavaScript' } },
    ],
  },
  {
    title: { hant: '遷移', en: 'Migration' },
    pages: [
      { id: 'migration', title: { hant: '從 v3 遷移', en: 'Migrating from v3' } },
    ],
  },
]

/** Resolve `node.title[locale] ?? node.title[DEFAULT_LOCALE]`. */
export const t = (node, locale) =>
  node.title[locale] ?? node.title[DEFAULT_LOCALE]

/**
 * Build the URL for a docs page id under a given locale.
 *
 * Docs live under the `/manual/` namespace; the homepage occupies the
 * locale root. So `urlFor('index', 'hant')` resolves to `/manual/`,
 * `urlFor('install', 'en')` resolves to `/en/manual/install.html`.
 */
export function urlFor(id, locale) {
  const prefix = locale === DEFAULT_LOCALE ? '' : `/${locale}`
  return id === 'index' ? `${prefix}/manual/` : `${prefix}/manual/${id}.html`
}

/** Build the homepage URL for a locale (homepage sits at the locale root). */
export function homeUrlFor(locale) {
  return locale === DEFAULT_LOCALE ? '/' : `/${locale}/`
}

/**
 * Flat lookup: pageId → { title, sectionTitle, prev, next } for a locale.
 * If `availableIds` is given, pages not in the set are skipped (so the
 * pager won't point to translations that haven't shipped yet).
 */
export function buildPageIndex(locale, availableIds, nav = NAV) {
  const flat = []
  for (const section of nav) {
    for (const page of section.pages) {
      if (availableIds && !availableIds.has(page.id)) continue
      flat.push({
        ...page,
        title: t(page, locale),
        sectionTitle: t(section, locale),
      })
    }
  }
  const index = {}
  flat.forEach((page, i) => {
    index[page.id] = {
      ...page,
      prev: i > 0 ? flat[i - 1] : null,
      next: i < flat.length - 1 ? flat[i + 1] : null,
    }
  })
  return index
}

/**
 * Render the sidebar `<nav>` HTML for a given active pageId & locale.
 * Pass `availableIds` to filter out untranslated pages; sections with
 * no remaining pages are dropped entirely.
 */
export function renderSidebar(activeId, locale, sidebarLabel, availableIds, nav = NAV) {
  const sections = nav.map(section => {
    const items = section.pages
      .filter(page => !availableIds || availableIds.has(page.id))
      .map(page => {
        const aria = page.id === activeId ? ' aria-current="page"' : ''
        return `<li><a href="${urlFor(page.id, locale)}"${aria}>${t(page, locale)}</a></li>`
      })
      .join('')
    if (!items) return ''
    return `<li><h2>${t(section, locale)}</h2><ol>${items}</ol></li>`
  }).join('')
  return `<nav class="Sidebar" id="sidebar" aria-label="${sidebarLabel}"><ol>${sections}</ol></nav>`
}

/**
 * Render a breadcrumb trail above the page H1.
 *   Docs / 從何開始 / 簡介
 *
 * The first crumb is a link back to the locale's `intro` page (the docs
 * landing). The middle crumb is the section title from `_nav.js`; the
 * last crumb is the current page title (`aria-current="page"`). If
 * `navMeta` is missing (page not in NAV) we fall back to a single crumb.
 */
export function renderBreadcrumb(navMeta, locale, docsLabel) {
  const homeHref = urlFor('index', locale)
  const sep = '<span class="Sep" aria-hidden="true">/</span>'
  const escape = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const crumbs = [`<a href="${homeHref}">${escape(docsLabel)}</a>`]
  if (navMeta?.sectionTitle) crumbs.push(`<span>${escape(navMeta.sectionTitle)}</span>`)
  if (navMeta?.title) crumbs.push(`<span aria-current="page">${escape(navMeta.title)}</span>`)
  return `<nav class="Crumbs" aria-label="${escape(docsLabel)}">${crumbs.join(sep)}</nav>`
}

/**
 * Render the language switcher (header chrome). Compact button + dropdown
 * matching the homepage's `.LangSwitcher` shape, so the docs and
 * home share the same component CSS and JS handler.
 *
 * Lists every locale that has at least one available page, including the
 * active one (rendered with `is-active` + a check). Each link points to
 * that locale's docs index. The trigger button shows the active locale's
 * `flag` + `short` from `LOCALE_LABELS`.
 *
 * `i18n` carries `langSwitcherLabel` and `langSwitcherFoot` for the menu
 * label and footnote rows.
 */
export function renderLangSwitcher(activeLocale, availableByLocale, i18n) {
  const slugs = ALL_LOCALES.filter(loc => availableByLocale[loc]?.size > 0)
  if (slugs.length <= 1) return ''
  const escape = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const cur = LOCALE_LABELS[activeLocale] ?? LOCALE_LABELS.hant
  const items = slugs.map(slug => {
    const lab = LOCALE_LABELS[slug]
    const isActive = slug === activeLocale
    return `<li><a href="${urlFor('index', slug)}" lang="${HTML_LANG[slug]}" hreflang="${HTML_LANG[slug]}"${isActive ? ' class="is-active" aria-current="true"' : ''} data-lang="${slug}">
      <span class="Flag">${escape(lab.flag)}</span>
      <span class="Texts">
        <span class="Full">${escape(lab.full)}</span>
        <span class="Code">${slug}</span>
      </span>
      ${isActive ? '<span class="Check" data-icon="check" aria-hidden="true"></span>' : ''}
    </a></li>`
  }).join('')

  const labelText = i18n?.langSwitcherLabel ?? 'Switch language・LANGUAGE'
  const footText  = i18n?.langSwitcherFoot  ?? ''

  return `<div class="LangSwitcher">
    <button type="button" aria-haspopup="true" aria-expanded="false" aria-label="${escape(labelText)}">
      <span class="Icon" aria-hidden="true"><span data-glyph="zh">文</span><span data-glyph="la">A</span></span>
      <span class="Caret" data-icon="chevron" data-dir="down" aria-hidden="true"></span>
    </button>
    <ul hidden>
      <li class="Label">${escape(labelText)}</li>
      ${items}
      ${footText ? `<li class="Foot"><span aria-hidden="true">※</span><span>${escape(footText)}</span></li>` : ''}
    </ul>
  </div>`
}
