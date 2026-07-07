/**
 * Locale metadata — single source of truth shared by the docs chrome
 * (`_nav.js`), the homepage build (`home/_data.js`, `vite.config.js`),
 * and the UI string catalogue (`_i18n.js`).
 *
 * Slugs are short (`hant`, `hans`, `en`, `ja`, `ko`) for tidy URLs;
 * the BCP-47 tag for `<html lang>` lives in `HTML_LANG`.
 */

export const DEFAULT_LOCALE = 'hant'

/** Locales other than DEFAULT_LOCALE — these get a URL prefix. */
export const LOCALE_SLUGS = ['en', 'ja', 'hans', 'ko']

/** Canonical order: default first, then the rest. */
export const ALL_LOCALES = [DEFAULT_LOCALE, ...LOCALE_SLUGS]

/** Slug → BCP 47 language tag for the `<html lang>` attribute. */
export const HTML_LANG = {
  hant: 'zh-Hant',
  en:   'en',
  ja:   'ja',
  hans: 'zh-Hans',
  ko:   'ko',
}

/**
 * Display labels for the language switcher. `flag` is the single
 * character shown in the masthead trigger; `short` is a 1–2-char code;
 * `full` is the locale's autonym.
 */
export const LOCALE_LABELS = {
  hant: { short: '繁',  full: '繁體中文', flag: '繁' },
  hans: { short: '简',  full: '简体中文', flag: '简' },
  en:   { short: 'EN',  full: 'English',  flag: 'A' },
  ja:   { short: '日',  full: '日本語',   flag: 'あ' },
  ko:   { short: '한',  full: '한국어',   flag: '가' },
}
