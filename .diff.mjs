/* 兩批截圖逐像素比對。用法：node diff.mjs <labelA> <labelB> [threshold] */
import { chromium } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'

const root = '/private/tmp/claude-501/-Users-yijun-Workspace-hanzi-pro-han/315958e6-6bc8-4a35-955b-1f247cd77791/scratchpad/shots'
const [a, b, thr = '8'] = process.argv.slice(2)
const files = readdirSync(`${root}/${a}`).filter((f) => f.endsWith('.png')).sort()

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('about:blank')

const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`

for (const f of files) {
  const out = await page.evaluate(async ([srcA, srcB, thr]) => {
    const load = (src) => new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src
    })
    const [ia, ib] = await Promise.all([load(srcA), load(srcB)])
    if (ia.width !== ib.width || ia.height !== ib.height)
      return { size: [ia.width, ia.height, ib.width, ib.height] }
    const grab = (img) => {
      const c = new OffscreenCanvas(img.width, img.height)
      c.getContext('2d').drawImage(img, 0, 0)
      return c.getContext('2d').getImageData(0, 0, img.width, img.height).data
    }
    const [da, db] = [grab(ia), grab(ib)]
    let n = 0, maxd = 0
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9
    for (let p = 0; p < da.length; p += 4) {
      const d = Math.max(Math.abs(da[p] - db[p]), Math.abs(da[p+1] - db[p+1]), Math.abs(da[p+2] - db[p+2]))
      if (d <= thr) continue
      n++; if (d > maxd) maxd = d
      const i = (p / 4) % ia.width, j = Math.floor((p / 4) / ia.width)
      if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j
    }
    return {
      w: ia.width, h: ia.height, n, maxd,
      pct: +(100 * n / (ia.width * ia.height)).toFixed(3),
      box: n ? { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } : null,
    }
  }, [b64(`${root}/${a}/${f}`), b64(`${root}/${b}/${f}`), Number(thr)])
  console.log(f.padEnd(28), JSON.stringify(out))
}
await browser.close()
