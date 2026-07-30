/* 量兩支 glyph 分支的定心偏移：把同一個字用「橫排 alphabetic」與「直排
   upright」兩種佈局畫在同一個錨點上，光柵化後量實墨框中心對錨點的位移。
   用法：node probe-centre.mjs [port] */
import { chromium } from '@playwright/test'

const port = process.argv[2] ?? '5173'
const EM = 400            // 一個字 400px，量到 0.25% em 的精度
const PAD = 400

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 2 * PAD, height: 2 * PAD }, deviceScaleFactor: 1 })
/* 走首頁，字體才是頁面真正用的那一份（Shanggu Serif，經過 fonts-gate） */
await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })
await page.evaluate(async () => { await document.fonts.ready })
await page.waitForTimeout(1500)

const measure = async (label, style, x, y, ch) => {
  await page.evaluate(([style, x, y, ch, EM, PAD]) => {
    document.body.innerHTML = ''
    document.documentElement.style.background = '#fff'
    document.body.style.cssText = 'margin:0; background:#fff'
    const ns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('width', 2 * PAD)
    svg.setAttribute('height', 2 * PAD)
    svg.setAttribute('viewBox', `${-PAD} ${-PAD} ${2 * PAD} ${2 * PAD}`)
    const t = document.createElementNS(ns, 'text')
    t.setAttribute('x', x)
    t.setAttribute('y', y)
    t.setAttribute('font-size', EM)
    t.setAttribute('text-anchor', 'middle')
    t.setAttribute('fill', '#000')
    t.setAttribute('style', `font-family:'Shanggu Serif',serif; ${style}`)
    t.textContent = ch
    svg.append(t)
    document.body.append(svg)
  }, [style, x, y, ch, EM, PAD])
  const buf = await page.screenshot()
  /* 在瀏覽器裡掃 alpha，找實墨框 */
  const ink = await page.evaluate(async ([b64, PAD]) => {
    const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = b64 })
    const c = new OffscreenCanvas(img.width, img.height)
    const x = c.getContext('2d')
    x.drawImage(img, 0, 0)
    const d = x.getImageData(0, 0, img.width, img.height).data
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9
    for (let j = 0; j < img.height; j++) for (let i = 0; i < img.width; i++) {
      if (d[((j * img.width + i) << 2)] < 200) {   /* 黑墨 */
        if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j
      }
    }
    /* 螢幕座標 → viewBox 座標（1:1，原點在 PAD,PAD） */
    return { x0: x0 - PAD, x1: x1 - PAD, y0: y0 - PAD, y1: y1 - PAD }
  }, [`data:image/png;base64,${buf.toString('base64')}`, PAD])
  const cx = (ink.x0 + ink.x1) / 2, cy = (ink.y0 + ink.y1) / 2
  console.log(
    label.padEnd(34),
    `ink ${(ink.x1 - ink.x0 + 1) / EM * 1}×${((ink.y1 - ink.y0 + 1) / EM).toFixed(3)} em`.padEnd(22),
    `centre offset  x ${(cx / EM).toFixed(4)} em   y ${(cy / EM).toFixed(4)} em`,
  )
  return { cx: cx / EM, cy: cy / EM }
}

console.log(`字＝田（左右上下都對稱的全形字），em = ${EM}px\n`)
await measure('橫排 dominant-baseline:central', 'dominant-baseline:central', 0, 0, '田')
await measure('橫排 alphabetic, y = 0.38em', '', 0, 0.38 * EM, '田')
await measure('直排 upright, x = 0', 'writing-mode:vertical-rl; text-orientation:upright', 0, 0, '田')
await measure('直排 upright, x = +0.0526em', 'writing-mode:vertical-rl; text-orientation:upright', 0.0526 * EM, 0, '田')
await measure('直排 upright, x = -0.0526em', 'writing-mode:vertical-rl; text-orientation:upright', -0.0526 * EM, 0, '田')
await browser.close()
