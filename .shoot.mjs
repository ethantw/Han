/* 鉛字盤基準截圖 ＋ 幾何記錄。用法：node shoot.mjs <label> [port] */
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const label = process.argv[2] ?? 'base'
const port = process.argv[3] ?? '5173'
const dir = `/private/tmp/claude-501/-Users-yijun-Workspace-hanzi-pro-han/315958e6-6bc8-4a35-955b-1f247cd77791/scratchpad/shots/${label}`
mkdirSync(dir, { recursive: true })

const WIDTHS = [1440, 1024, 640]
const THEMES = ['light', 'dark']
const WRITINGS = ['horizontal', 'vertical']

const browser = await chromium.launch()
const record = {}

for (const width of WIDTHS) {
  for (const theme of THEMES) {
    for (const writing of WRITINGS) {
      const key = `${width}-${theme}-${writing}`
      const ctx = await browser.newContext({
        viewport: { width, height: 1000 },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',   /* 靜態、可比對：入場動畫與熔接迴圈都關掉 */
      })
      const page = await ctx.newPage()
      await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })
      await page.evaluate(async () => { await document.fonts.ready })

      if (theme === 'dark')
        await page.evaluate(() => {
          const $t = document.querySelector('input[name="dark-mode"]')
          if ($t && !$t.checked) { $t.checked = true; $t.dispatchEvent(new Event('change', { bubbles: true })) }
        })
      /* 直排切換的浮動藥丸目前不在 _home.html 裡（initWritingSwitch 早退），
         但 main[data-writing='vertical'] 的 CSS 分支還活著——直接蓋，把那些
         分支也納入比對。 */
      if (writing === 'vertical')
        await page.evaluate(() => { document.querySelector('main').dataset.writing = 'vertical' })

      await page.waitForTimeout(1200)
      /* 決定性捲動：把鉛字盤所在的 station 捲到頂 */
      await page.evaluate(() => {
        const $f = document.querySelector('.LeadForme')
        const $s = $f?.closest('[data-station]')
        if ($s) window.scrollTo(0, $s.getBoundingClientRect().top + window.scrollY)
      })
      await page.waitForTimeout(900)

      record[key] = await page.evaluate(() => {
        const $f = document.querySelector('.LeadForme')
        if (!$f) return null
        const $svg = $f.querySelector('svg')
        const $s = $f.closest('[data-station]')
        const cs = getComputedStyle($f)
        const fr = $f.getBoundingClientRect()
        const sr = $svg.getBoundingClientRect()
        const st = $s.getBoundingClientRect()
        const round = (n) => +n.toFixed(2)
        return {
          viewBox: $svg.getAttribute('viewBox'),
          /* 相對 station 的位置——元素截圖會把位移正規化掉，所以位置靠數字驗 */
          figure: { x: round(fr.x - st.x), y: round(fr.y - st.y), w: round(fr.width), h: round(fr.height) },
          svg: { x: round(sr.x - st.x), y: round(sr.y - st.y), w: round(sr.width), h: round(sr.height) },
          marginTop: cs.marginTop,
          marginLeft: cs.marginLeft,
          padding: cs.padding,
          pub: Object.fromEntries(
            ['--lf-apex', '--lf-pad', '--lf-foot', '--lf-ratio', '--lf-bleed',
             '--lf-gap-top', '--lf-gap-bottom', '--lf-gap-left', '--lf-gap-right',
             '--lf-w', '--lf-last-slug']
              .map((k) => [k, cs.getPropertyValue(k).trim()]),
          ),
          /* 墨的實際落點：第一枚與最後一枚 slug 的螢幕框，相對 station */
          firstSlug: (() => {
            const r = $svg.querySelector('.Slug')?.getBoundingClientRect()
            return r && { x: round(r.x - st.x), y: round(r.y - st.y), w: round(r.width), h: round(r.height) }
          })(),
          lastSlug: (() => {
            const all = $svg.querySelectorAll('.Slug')
            const r = all[all.length - 1]?.getBoundingClientRect()
            return r && { x: round(r.x - st.x), y: round(r.y - st.y), w: round(r.width), h: round(r.height) }
          })(),
        }
      })

      await page.screenshot({ path: `${dir}/${key}.png` })
      await ctx.close()
    }
  }
}

writeFileSync(`${dir}/geometry.json`, JSON.stringify(record, null, 1))
await browser.close()
console.log(`→ ${dir}  (${Object.keys(record).length} configs)`)
