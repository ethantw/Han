/* 密集量測：每一枚 slug ＋ 周邊 chrome 的螢幕框（相對 station），輸出 JSON。
   用法：node boxes.mjs <label> [port] [width] */
import { chromium } from '@playwright/test'
import { writeFileSync } from 'node:fs'

const [label, port = '5173', width = '1440'] = process.argv.slice(2)
const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: Number(width), height: 1000 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
})
const page = await ctx.newPage()
await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })
await page.evaluate(async () => { await document.fonts.ready })
await page.waitForTimeout(1500)

const out = await page.evaluate(() => {
  const $f = document.querySelector('.LeadForme')
  const $s = $f.closest('[data-station]')
  const o = $s.getBoundingClientRect()
  const rel = (el) => {
    const r = el.getBoundingClientRect()
    return [+(r.x - o.x).toFixed(3), +(r.y - o.y).toFixed(3), +r.width.toFixed(3), +r.height.toFixed(3)]
  }
  return {
    slugs: [...$f.querySelectorAll('.Slug')].map(rel),
    glyphs: [...$f.querySelectorAll('.Slug.has-glyph text.g')].map(rel),
    svg: rel($f.querySelector('svg')),
    figure: rel($f),
    caption: rel($f.querySelector('figcaption')),
    controls: rel($f.querySelector('.Controls')),
    card: rel(document.querySelector('.Illust[data-variant="faces"]')),
    station: [+o.width.toFixed(3), +o.height.toFixed(3)],
  }
})
writeFileSync(
  `/private/tmp/claude-501/-Users-yijun-Workspace-hanzi-pro-han/315958e6-6bc8-4a35-955b-1f247cd77791/scratchpad/boxes-${label}-${width}.json`,
  JSON.stringify(out, null, 1),
)
console.log(`${label}@${width}: ${out.slugs.length} slugs, ${out.glyphs.length} glyphs`)
await browser.close()
