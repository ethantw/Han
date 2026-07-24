/**
 * Station①'s newspaper datelines — 民國 era, one century ahead.
 *
 * The four .Papers editions date themselves at «today + 100 years», so
 * the panel never goes stale (the markup ships a static fallback date
 * for the no-JS case; this refreshes it on boot). The era prefix (民國 /
 * 民国 / ruby-annotated 민국) is static markup — only the numbers are
 * computed. Each edition keeps its own numbering convention: kanji
 * digits for the zh/ja editions (with the classic 廿/卅 compression in
 * the Chinese ones), Arabic numerals in the ko edition.
 */

const DIGITS = '〇一二三四五六七八九'

/** 215 → 二一五 — digit-by-digit, the newspaper masthead year style */
const digitwise = (n) =>
  String(n).split('').map(($c) => DIGITS[+$c]).join('')

/** 24 → 二十四 — the regular decimal reading (ja edition, zh months) */
const decimal = (n) =>
  n < 11 ? (n === 10 ? '十' : DIGITS[n])
  : n < 20 ? '十' + DIGITS[n - 10]
  : DIGITS[Math.trunc(n / 10)] + '十' + (n % 10 ? DIGITS[n % 10] : '')

/** 24 → 廿四, 31 → 卅一 — Chinese-edition day-of-month compression */
const zhDay = (n) =>
  n > 30 ? '卅' + DIGITS[n - 30]
  : n > 20 && n < 30 ? '廿' + DIGITS[n - 20]
  : decimal(n)

const format = (lang, roc, m, d) =>
  lang === 'ja' ? `${digitwise(roc)}年${decimal(m)}月${decimal(d)}日`
  : lang.startsWith('ko') ? `${roc}年 ${m}月 ${d}日`
  : `${digitwise(roc)}年${decimal(m)}月${zhDay(d)}日`

export function initPapersDateline() {
  const now = new Date()
  const year = now.getFullYear() + 100
  const roc = year - 1911
  const m = now.getMonth() + 1
  const d = now.getDate()
  const iso = `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  for (const $time of document.querySelectorAll('.Papers .Dateline time')) {
    $time.dateTime = iso
    $time.textContent = format(
      $time.closest('article').lang,
      roc,
      m,
      d,
    )
  }
}
