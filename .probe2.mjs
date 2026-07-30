/* 字體實際的 metric ＋ 兩支 glyph 分支的定心殘差（多字交叉驗證）。
   用法：node probe-metrics.mjs [port] */
import { chromium } from '@playwright/test'

const port = process.argv[2] ?? '5173'
const EM = 400
const PAD = 400

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 2 * PAD, height: 2 * PAD }, deviceScaleFactor: 1 })
await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })
await page.evaluate(async () => { await document.fonts.ready })
await page.waitForTimeout(1500)

/* ① 字體自己報的 metric：emHeight* 是 OS/2 sTypo，fontBoundingBox* 是 hhea/win */
console.log('— metrics（canvas TextMetrics，em 1000 為單位）—')
console.log(JSON.stringify(await page.evaluate(async () => {
  await document.fonts.load('400 1000px "Shanggu Serif"')
  const c = new OffscreenCanvas(10, 10).getContext('2d')
  c.font = '400 1000px "Shanggu Serif"'
  const m = c.measureText('田')
  const r = (n) => +n.toFixed(1)
  return {
    advance: r(m.width),
    /* Chromium 沒實作 emHeight*（OS/2 sTypo），只有 hhea/win 這一組 */
    fontBoundingBoxAscent: r(m.fontBoundingBoxAscent), fontBoundingBoxDescent: r(m.fontBoundingBoxDescent),
    hheaMidAboveBaseline: r((m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2),
    inkAboveBaseline: r(m.actualBoundingBoxAscent), inkBelowBaseline: r(m.actualBoundingBoxDescent),
    inkCentreAboveBaseline: r((m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2),
  }
}), null, 1))

const ink = async (style, x, y, ch) => {
  await page.evaluate(([style, x, y, ch, EM, PAD]) => {
    document.body.innerHTML = ''
    document.documentElement.style.background = '#fff'
    document.body.style.cssText = 'margin:0; background:#fff'
    const ns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('width', 2 * PAD); svg.setAttribute('height', 2 * PAD)
    svg.setAttribute('viewBox', `${-PAD} ${-PAD} ${2 * PAD} ${2 * PAD}`)
    const t = document.createElementNS(ns, 'text')
    t.setAttribute('x', x); t.setAttribute('y', y)
    t.setAttribute('font-size', EM); t.setAttribute('text-anchor', 'middle'); t.setAttribute('fill', '#000')
    t.setAttribute('style', `font-family:'Shanggu Serif',serif; ${style}`)
    t.textContent = ch
    svg.append(t); document.body.append(svg)
  }, [style, x, y, ch, EM, PAD])
  const buf = await page.screenshot()
  return page.evaluate(async ([b64, PAD, EM]) => {
    const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = b64 })
    const c = new OffscreenCanvas(img.width, img.height)
    const x = c.getContext('2d'); x.drawImage(img, 0, 0)
    const d = x.getImageData(0, 0, img.width, img.height).data
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9
    for (let j = 0; j < img.height; j++) for (let i = 0; i < img.width; i++)
      if (d[((j * img.width + i) << 2)] < 200) {
        if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j
      }
    return { cx: ((x0 + x1) / 2 - PAD) / EM, cy: ((y0 + y1) / 2 - PAD) / EM }
  }, [`data:image/png;base64,${buf.toString('base64')}`, PAD, EM])
}

/* 每字自己的實墨↔基線關係（canvas，精確，非光柵） */
const inkVsBaseline = (ch) => page.evaluate(async (ch) => {
  await document.fonts.load('400 1000px "Shanggu Serif"')
  const c = new OffscreenCanvas(10, 10).getContext('2d')
  c.font = '400 1000px "Shanggu Serif"'
  const m = c.measureText(ch)
  return (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2 / 1000
}, ch)

console.log('\n— 直排 upright 把基線放在錨點下方多遠？（每字用自己的實墨反推）—')
console.log('字   實墨中心↑基線   量到的實墨中心y   ⇒ 基線↓錨點')
for (const ch of ['田', '國', '秒', '山', '臉', '一', '艙']) {
  const c = await inkVsBaseline(ch)
  const v = await ink('writing-mode:vertical-rl; text-orientation:upright', 0, 0, ch)
  console.log(ch, `  ${c.toFixed(4)}`.padEnd(16), `${v.cy.toFixed(4)}`.padEnd(18), (v.cy + c).toFixed(4))
}
await browser.close()
