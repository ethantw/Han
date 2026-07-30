/* 容忍 1px 位移的比對：差異像素若在對方 3×3 鄰域裡找得到同色，就是次像素
   相位（抗鋸齒）而不是版面位移。用法：node diff-tol.mjs <A> <B> <file> */
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const root = '/private/tmp/claude-501/-Users-yijun-Workspace-hanzi-pro-han/315958e6-6bc8-4a35-955b-1f247cd77791/scratchpad/shots'
const [a, b, file] = process.argv.slice(2)
const b64 = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto('about:blank')
console.log(JSON.stringify(await page.evaluate(async ([sa, sb]) => {
  const load = (src) => new Promise((r, j) => { const i = new Image(); i.onload = () => r(i); i.onerror = j; i.src = src })
  const [ia, ib] = await Promise.all([load(sa), load(sb)])
  const grab = (img) => {
    const c = new OffscreenCanvas(img.width, img.height)
    c.getContext('2d').drawImage(img, 0, 0)
    return c.getContext('2d').getImageData(0, 0, img.width, img.height).data
  }
  const [da, db] = [grab(ia), grab(ib)]
  const W = ia.width, H = ia.height
  const at = (d, x, y, k) => d[((y * W + x) << 2) + k]
  const near = (x, y) => {          /* db 的 3×3 裡有沒有 da(x,y) 的顏色 */
    for (let j = Math.max(0, y - 1); j <= Math.min(H - 1, y + 1); j++)
      for (let i = Math.max(0, x - 1); i <= Math.min(W - 1, x + 1); i++) {
        const d = Math.max(
          Math.abs(at(da, x, y, 0) - at(db, i, j, 0)),
          Math.abs(at(da, x, y, 1) - at(db, i, j, 1)),
          Math.abs(at(da, x, y, 2) - at(db, i, j, 2)),
        )
        if (d <= 8) return true
      }
    return false
  }
  let diff = 0, real = 0
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.max(
      Math.abs(at(da, x, y, 0) - at(db, x, y, 0)),
      Math.abs(at(da, x, y, 1) - at(db, x, y, 1)),
      Math.abs(at(da, x, y, 2) - at(db, x, y, 2)),
    )
    if (d <= 8) continue
    diff++
    if (near(x, y)) continue
    real++
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
  }
  return {
    diffPx: diff, movedPx: real,
    subpixelShare: +(100 * (1 - real / diff)).toFixed(2),
    movedBox: real ? { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 } : null,
  }
}, [b64(`${root}/${a}/${file}`), b64(`${root}/${b}/${file}`)]), null, 1))
await browser.close()
