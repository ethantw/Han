/* 把指定字的鉛字放大截圖。用法：node crop-slug.mjs <字> [out] [port] */
import { chromium } from '@playwright/test'

const [ch, out = 'slug', port = '5173'] = process.argv.slice(2)
const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, reducedMotion: 'reduce',
})
const page = await ctx.newPage()
await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })
await page.evaluate(async () => { await document.fonts.ready })
await page.waitForTimeout(1500)
await page.evaluate(() => document.querySelector('.LeadForme').scrollIntoView({ block: 'center' }))
await page.waitForTimeout(600)

const clip = await page.evaluate((ch) => {
  const $g = [...document.querySelectorAll('.LeadForme .Slug.has-glyph')]
    .find((g) => g.querySelector('text.g')?.textContent === ch)
  if (!$g) return null
  const r = $g.getBoundingClientRect()
  const m = 26
  return { x: Math.max(0, r.x - m), y: Math.max(0, r.y - m), width: r.width + 2 * m, height: r.height + 2 * m }
}, ch)
if (!clip) { console.log(`找不到「${ch}」`); await browser.close(); process.exit(1) }
await page.screenshot({
  path: `/private/tmp/claude-501/-Users-yijun-Workspace-hanzi-pro-han/315958e6-6bc8-4a35-955b-1f247cd77791/scratchpad/${out}.png`,
  clip,
})
console.log(`${ch} → ${out}.png  ${JSON.stringify(clip)}`)
await browser.close()
