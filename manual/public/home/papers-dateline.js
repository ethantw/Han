/**
 * Every «today + 100 years» date on the homepage — station①'s four
 * newspaper datelines (four editions, four ERAS) plus any prose year
 * marked `<time data-plus-100>`, so nothing ever goes stale (the markup
 * ships a static fallback for the no-JS case; this refreshes it on
 * boot).
 *
 *   zh-Hant  中華民國二一五年七月廿九日 — ROC era, masthead kanji
 *            digits, the classic 廿/卅 day compression
 *   zh-Hans  夏历丙戌年六月初十 — Chinese lunisolar. `Intl` with
 *            `-u-ca-chinese` does the conversion (cyclic year name,
 *            闰-aware month, day number we render as 初／十／廿)
 *   ja       弘宙元年七月二十九日 — a fictional reign that has JUST
 *            begun, pinned to 元年 forever; only month and day move
 *   ko       西紀 2126年 7月 29日 — plain CE + 100, Arabic numerals,
 *            the era label ruby-annotated 서기
 *
 * Rendered with innerHTML — every string is a constant of our own
 * making, and the ko era label carries `<ruby>`, which a textContent
 * write would flatten into plain prose.
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

/** 3 → 初三, 10 → 初十, 15 → 十五, 24 → 廿四 — lunar day names */
const lunarDay = (n) =>
  n === 10 ? '初十'
  : n < 10 ? '初' + DIGITS[n]
  : n < 20 ? '十' + DIGITS[n - 10]
  : n === 20 ? '二十'
  : n === 30 ? '三十'
  : '廿' + DIGITS[n - 20]

/** Gregorian Date → { yearName: '丙戌', month: '六月', day: 10 } */
const lunar = (date) => {
  const parts = new Intl.DateTimeFormat(
    'zh-Hans-u-ca-chinese',
    { year: 'numeric', month: 'long', day: 'numeric' },
  ).formatToParts(date)
  const part = (type) => parts.find(($p) => $p.type === type)?.value
  return { yearName: part('yearName'), month: part('month'), day: +part('day') }
}

/** per-edition dateline builders — HTML strings, keyed by article lang.
    A builder may return a falsy value to say «can't, keep the static
    fallback» (zh-Hans when the engine lacks the chinese calendar). */
const format = {
  'zh-Hant': (date, y, m, d) =>
    `中華民國${digitwise(y - 1911)}年${decimal(m)}月${zhDay(d)}日`,
  'zh-Hans': (date) => {
    try {
      const { yearName, month, day } = lunar(date)
      return yearName && month && day
        ? `夏历${yearName}年${month}${lunarDay(day)}`
        : null
    } catch { return null }
  },
  'ja': (date, y, m, d) =>
    `弘宙元年${decimal(m)}月${decimal(d)}日`,
  'ko-Hant': (date, y, m, d) =>
    `<ruby>西紀<rt>서기</rt></ruby> ${y}年 ${m}月 ${d}日`,
}

export function initPapersDateline() {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 100)
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  for (const $time of document.querySelectorAll('.Papers .Dateline time')) {
    const html = format[$time.closest('article').lang]?.(date, y, m, d)
    if (!html) continue
    $time.dateTime = iso
    $time.innerHTML = html
  }

  /* prose years — station③'s hanging specimen opens on «the year», and the
     museum's 一甲子 is measured FROM it, so a hard-coded 二一二六年 would
     drift out of step with the newspapers above. Year precision only:
     `datetime="2126"` is a valid <time> value, and the masthead digitwise
     reading (二一二七年, not 二千一百二十七年) matches station①. */
  for (const $time of document.querySelectorAll('time[data-plus-100]')) {
    $time.dateTime = String(y)
    $time.textContent = `${digitwise(y)}年`
  }
}
