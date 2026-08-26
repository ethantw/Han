/**
 * 覆蓋率閘門：頁面排出來的每一個漢字，都要在**排它的那個元素**所用的子集裡。
 *
 * 為什麼是閘門而不是提醒：子集的 `unicode-range` 是照字體真實 cmap 修過的，
 * 所以缺字會落到堆疊下一位——系統字。畫面不會壞掉，只會安靜地變成蘋方混在
 * 傳承字形裡，而那正是這個專案存在的理由要避免的事。安靜的失敗要用測試抓。
 *
 * 判準是**字體自己宣告的 `unicode-range`**，不是 `document.fonts.check()`：
 * 那支 API 回答的是「這段文字要不要等某個 webfont 載完」，子集載好之後它對
 * 任何字都回 true（實測「鑫」回 true，而子集裡沒有它）。`unicode-range` 才是
 * 瀏覽器決定回退時真正讀的那份清單。
 *
 * 五種語言各驗一遍——字表是聯集，但覆蓋率要逐頁問：一頁排出來的字要在**那
 * 一頁**的元素所用的子集裡。
 *
 * 用法：`node manual/scripts/check-subset-coverage.mjs [base-url]`；缺字時 exit 1。
 */
import { chromium } from '@playwright/test'
import { ALL_LOCALES, DEFAULT_LOCALE } from '../_locales.js'

const BASE = (process.argv[2] ?? 'http://localhost:7700').replace(/\/$/, '')
const FAMILIES = ['Han Home Serif', 'Han Home Sans', 'Han Home Kai']

let failed = false
for (const locale of ALL_LOCALES) {
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
await page.goto(`${BASE}/${locale === DEFAULT_LOCALE ? '' : `${locale}/`}`, { waitUntil: 'load', timeout: 60_000 })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(3000)
/* 捲過全站：`content-visibility: auto` 的站台在畫面外不排字，不捲就檢查不到。 */
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 500) {
    scrollTo(0, y)
    await new Promise((r) => setTimeout(r, 80))
  }
})
await page.waitForTimeout(1500)

const report = await page.evaluate((families) => {
  const isHan = (cp) =>
    (cp >= 0x3400 && cp <= 0x9fff) || (cp >= 0xf900 && cp <= 0xfaff) || cp >= 0x20000

  const covered = new Map(families.map((f) => [f, new Set()]))
  for (const sheet of document.styleSheets) {
    let rules
    try { rules = sheet.cssRules } catch { continue }
    for (const rule of rules) {
      if (!(rule instanceof CSSFontFaceRule)) continue
      const set = covered.get(rule.style.fontFamily.replace(/["']/g, ''))
      if (!set) continue
      for (const part of (rule.style.unicodeRange || '').split(',')) {
        const t = part.trim().replace(/^U\+/i, '')
        if (!t) continue
        const [lo, hi] = t.includes('-')
          ? t.split('-').map((x) => Number.parseInt(x, 16))
          : [Number.parseInt(t.replace(/\?/g, '0'), 16), Number.parseInt(t.replace(/\?/g, 'F'), 16)]
        for (let cp = lo; cp <= hi; cp++) set.add(cp)
      }
    }
  }

  const gaps = new Map()
  const inspect = ($el, where) => {
    const stack = getComputedStyle($el).fontFamily
    const mine = families.filter((f) => stack.includes(f))
    if (!mine.length) return
    for (const node of $el.childNodes) {
      if (node.nodeType !== 3) continue
      for (const ch of node.data) {
        const cp = ch.codePointAt(0)
        if (!isHan(cp)) continue
        if (mine.some((f) => covered.get(f).has(cp))) continue
        const key = `${mine.join('/')}\t${ch}`
        if (!gaps.has(key)) gaps.set(key, { char: ch, families: mine.join('/'), where })
      }
    }
  }
  const walk = (root, where) => {
    for (const $el of root.querySelectorAll('*')) {
      if ($el.shadowRoot) walk($el.shadowRoot, `${where} › shadow`)
      /* 遊樂場的預覽是 UGC 的家，缺字由 `_boot.js` 在執行時換回完整切片處理，
         不是建置時的字表管得到的事。 */
      if ($el.closest?.('[data-pg-preview]')) continue
      inspect($el, $el.closest('section')?.id ?? where)
    }
  }
  walk(document, '(外)')

  const sizes = Object.fromEntries([...covered].map(([f, s]) => [f, s.size]))
  return { sizes, gaps: [...gaps.values()] }
}, FAMILIES)

await browser.close()

if (!report.gaps.length) {
  const sizes = Object.entries(report.sizes).map(([f, n]) => `${f} ${n}`).join('・')
  console.log(`${locale.padEnd(5)} ✓ 排出來的漢字全部在子集裡（宣告覆蓋 ${sizes}）`)
  continue
}
failed = true
console.log(`${locale.padEnd(5)} ✗ 缺 ${report.gaps.length} 個字——它們會掉到系統字：`)
for (const g of report.gaps.slice(0, 40)) {
  console.log(`  ${g.char}  U+${g.char.codePointAt(0).toString(16).toUpperCase()}  ${g.families}  ${g.where}`)
}
}

process.exit(failed ? 1 : 0)
