/* 直排標點（writing-mode:vertical-rl; text-orientation:upright）的實墨落在 em
   的哪裡——用頁面真正的字體堆疊（Diantenjeom Serif JIS 在前），光柵化量測。
   用法：node probe-punct.mjs [port] */
import { chromium } from '@playwright/test'

const port = process.argv[2] ?? '5173'
const EM = 400, PAD = 500
const STACK = "'Diantenjeom Serif JIS','Shanggu Serif',serif"

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 2 * PAD, height: 2 * PAD }, deviceScaleFactor: 1 })
await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })
await page.evaluate(async () => { await document.fonts.ready })
await page.waitForTimeout(1500)

const ink = async (ch, style) => {
  await page.evaluate(([ch, style, EM, PAD, STACK]) => {
    document.body.innerHTML = ''
    document.documentElement.style.background = '#fff'
    document.body.style.cssText = 'margin:0; background:#fff'
    const ns = 'http://www.w3.org/2000/svg'
    const svg = document.createElementNS(ns, 'svg')
    svg.setAttribute('width', 2 * PAD); svg.setAttribute('height', 2 * PAD)
    svg.setAttribute('viewBox', `${-PAD} ${-PAD} ${2 * PAD} ${2 * PAD}`)
    /* em 框的參考線：字面就是這個方框 */
    const box = document.createElementNS(ns, 'rect')
    box.setAttribute('x', -EM / 2); box.setAttribute('y', -EM / 2)
    box.setAttribute('width', EM); box.setAttribute('height', EM)
    box.setAttribute('fill', 'none'); box.setAttribute('stroke', '#f00')
    const t = document.createElementNS(ns, 'text')
    t.setAttribute('x', 0); t.setAttribute('y', 0)
    t.setAttribute('font-size', EM); t.setAttribute('text-anchor', 'middle'); t.setAttribute('fill', '#000')
    t.setAttribute('style', `font-family:${STACK}; ${style}`)
    t.textContent = ch
    svg.append(box, t); document.body.append(svg)
  }, [ch, style, EM, PAD, STACK])
  const buf = await page.screenshot()
  return page.evaluate(async ([b64, PAD, EM]) => {
    const img = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = b64 })
    const c = new OffscreenCanvas(img.width, img.height)
    const x = c.getContext('2d'); x.drawImage(img, 0, 0)
    const d = x.getImageData(0, 0, img.width, img.height).data
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9
    for (let j = 0; j < img.height; j++) for (let i = 0; i < img.width; i++) {
      const p = (j * img.width + i) << 2
      /* 只算黑墨，紅色的 em 參考框不算 */
      if (d[p] < 120 && d[p + 1] < 120 && d[p + 2] < 120) {
        if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j
      }
    }
    const u = (v) => +((v - PAD) / EM).toFixed(3)
    return { l: u(x0), r: u(x1), t: u(y0), b: u(y1) }
  }, [`data:image/png;base64,${buf.toString('base64')}`, PAD, EM])
}

const V = 'writing-mode:vertical-rl; text-orientation:upright'
console.log('em 框 = [-0.5, +0.5] 兩軸；值超出 ±0.5 就是越出字面\n')
console.log('字   分支        左      右      上      下     寬     高')
for (const ch of ['「', '」', '：', '，', '。', '、', '！']) {
  const v = await ink(ch, V)
  console.log(
    ch, ' 直排upright ',
    [v.l, v.r, v.t, v.b].map((n) => String(n).padStart(6)).join('  '),
    ` ${(v.r - v.l).toFixed(3)}  ${(v.b - v.t).toFixed(3)}`,
  )
}
await browser.close()
