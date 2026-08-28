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
 *
 * Also the one place that owns the date itself: `plus100()` is private,
 * and `plus100EraLine()` hands station⑥'s playground sample the same
 * instant with all four eras on one line (see its own note). Nobody adds
 * a hundred years twice.
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
const lunar = (date, locale) => {
  const parts = new Intl.DateTimeFormat(
    locale,
    { year: 'numeric', month: 'long', day: 'numeric' },
  ).formatToParts(date)
  const part = (type) => parts.find(($p) => $p.type === type)?.value
  return { yearName: part('yearName'), month: part('month'), day: +part('day') }
}

/** 夏曆一行，或 null——引擎沒有農曆就說「不能」，讓呼叫端留靜態退路。
    `label` 與 `locale` 分開傳：曆法的字面（夏历／夏曆）與月名的字形
    （閏／闰）要跟著文種走，簡繁不可混。 */
const lunarEra = (date, locale, label) => {
  try {
    const { yearName, month, day } = lunar(date, locale)
    return yearName && month && day
      ? `${label}${yearName}年${month}${lunarDay(day)}`
      : null
  } catch { return null }
}

/** 「今天＋100 年」——這一頁所有日期的唯一來源 */
const plus100 = () => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 100)
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  return {
    date, y, m, d,
    iso: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
  }
}

/** per-edition dateline builders — HTML strings, keyed by article lang.
    A builder may return a falsy value to say «can't, keep the static
    fallback» (zh-Hans when the engine lacks the chinese calendar). */
const format = {
  'zh-Hant': (date, y, m, d) =>
    `中華民國${digitwise(y - 1911)}年${decimal(m)}月${zhDay(d)}日`,
  'zh-Hans': (date) => lunarEra(date, 'zh-Hans-u-ca-chinese', '夏历'),
  'ja': (date, y, m, d) =>
    `弘宙元年${decimal(m)}月${decimal(d)}日`,
  'ko-Kore': (date, y, m, d) =>
    `<ruby>西紀<rt>서기</rt></ruby> ${y}年 ${m}月 ${d}日`,
}

/**
 * 四套紀年並排的一行，給遊樂場的範本用：中華民國・夏曆・天皇・西元。
 * 站①的報頭是一版一紀年（四份報紙各講自己的話），這裡相反——同一個瞬間
 * 四種讀法擺在一起，範本要展示的正是這件事。
 *
 * 日期不另算：與報頭同一支 `plus100()`，所以遊樂場與站①永遠是同一天。
 * 夏曆取繁體 locale（月名的閏字要正體）；天皇紀年沿用報頭那個虛構的弘宙
 * 元年；西元用報頭的逐字讀法（二一二六年，不是二千一百二十六年）。
 * 引擎沒有農曆時那一段自己缺席，另三段照舊。
 */
export const plus100EraLine = () => {
  const { date, y, m, d, iso } = plus100()
  const text = [
    format['zh-Hant'](date, y, m, d),
    lunarEra(date, 'zh-Hant-u-ca-chinese', '夏曆'),
    format['ja'](date, y, m, d),
    `西元${digitwise(y)}年${decimal(m)}月${zhDay(d)}日`,
  ].filter(Boolean).join('・')
  return { iso, text }
}

export function initPapersDateline() {
  const { date, y, m, d, iso } = plus100()

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
