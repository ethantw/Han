/* 字面填滿的驗收。用法：node verify-face.mjs [port]
   實墨用每個字自己的 actualBoundingBox（textAlign=center，原點＝advance 中心，
   對上 SVG 的 text-anchor:middle）；切邊只掃 <polygon>（text 的 getBBox 是佈局
   框，含 1.437em 的行高，會把餘量誤報成負）。 */
import { chromium } from '@playwright/test'

const port = process.argv[2] ?? '5173'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })
await page.evaluate(async () => { await document.fonts.ready })
await page.waitForTimeout(1500)

const out = await page.evaluate(async () => {
  const S = 90, cell = 94, r = 11, sw = 2, emCentre = 0.38
  const PUNCT = new Set(['，', '、', '。', '：', '；', '？', '！', '「', '」', '『', '』', '（', '）', '—', '…', '·', '．'])
  await document.fonts.load(`400 ${S}px "Shanggu Serif"`)
  const c = new OffscreenCanvas(10, 10).getContext('2d')
  c.font = `400 ${S}px "Shanggu Serif"`
  c.textAlign = 'center'          /* 原點 = advance 中心，對上 text-anchor:middle */

  const chars = [...new Set([...document.querySelectorAll('.LeadForme .Slug.has-glyph text.g')]
    .map((t) => t.textContent))]

  const rows = chars.map((ch) => {
    const m = c.measureText(ch)
    const y0 = emCentre * S            /* 基線放在字面中心下方 emCentre·S */
    const box = {
      l: -m.actualBoundingBoxLeft, rt: m.actualBoundingBoxRight,
      t: -m.actualBoundingBoxAscent + y0, b: m.actualBoundingBoxDescent + y0,
    }
    /* 半角「」的字面只有半個字身寬（沿 e2 那一軸） */
    const halfSlug = ch === '「' || ch === '」'
    const halfAlong = (halfSlug ? S / 2 : S) / 2
    const edge = sw / 2 + (sw * 0.9) / 2     /* ink 描邊 ＋ 最上層 HI 描邊 */
    return {
      ch, punct: PUNCT.has(ch),
      inkW: +((box.rt - box.l) / S).toFixed(3),
      inkH: +((box.b - box.t) / S).toFixed(3),
      margin: {
        l: +(box.l + S / 2 - edge).toFixed(2), r: +(S / 2 - box.rt - edge).toFixed(2),
        t: +(box.t + halfAlong - edge).toFixed(2), b: +(halfAlong - box.b - edge).toFixed(2),
      },
      centre: { x: +((box.l + box.rt) / 2).toFixed(2), y: +((box.t + box.b) / 2).toFixed(2) },
      gapAlong: +((halfSlug ? cell / 2 : cell) - (box.b - box.t)).toFixed(2),
    }
  })

  /* 切邊：只看真正的塊面多邊形 ＋ 浮雕的頂點預留 */
  const svg = document.querySelector('.LeadForme svg')
  const vb = svg.getAttribute('viewBox').split(' ').map(Number)
  const root = svg.getScreenCTM().inverse()
  let t = Infinity, b = -Infinity, l = Infinity, rr = -Infinity
  for (const p of svg.querySelectorAll('polygon')) {
    const rel = root.multiply(p.getScreenCTM())
    for (const pt of p.getAttribute('points').trim().split(/\s+/)) {
      const [x, y] = pt.split(',').map(Number)
      const q = new DOMPoint(x, y).matrixTransform(rel)
      t = Math.min(t, q.y); b = Math.max(b, q.y); l = Math.min(l, q.x); rr = Math.max(rr, q.x)
    }
  }
  return {
    rows, viewBox: vb,
    slack: {
      top: +(t - vb[1]).toFixed(2), left: +(l - vb[0]).toFixed(2),
      right: +(vb[0] + vb[2] - rr).toFixed(2), bottom: +(vb[1] + vb[3] - b).toFixed(2),
    },
  }
})

const han = out.rows.filter((r) => !r.punct)
const pun = out.rows.filter((r) => r.punct)
const fmt = (rs) => rs.map((r) => ({
  字: r.ch, 墨寬em: r.inkW, 墨高em: r.inkH,
  左: r.margin.l, 右: r.margin.r, 上: r.margin.t, 下: r.margin.b,
  中心x: r.centre.x, 中心y: r.centre.y, 沿行墨間隙: r.gapAlong,
}))
console.log(`\n── 漢字 ${han.length} 種（字面 90 單位，餘白已扣描邊） ──`)
console.table(fmt(han))
console.log(`── 標點 ${pun.length} 種（em 內偏置是刻意的，不參與居中驗收） ──`)
console.table(fmt(pun))

const mins = (rs, k) => Math.min(...rs.map((r) => r.margin[k]))
console.log('漢字最窄餘白  左', mins(han, 'l'), '右', mins(han, 'r'), '上', mins(han, 't'), '下', mins(han, 'b'))
console.log('漢字中心偏移  |x| 最大', Math.max(...han.map((r) => Math.abs(r.centre.x))).toFixed(2),
            ' |y| 最大', Math.max(...han.map((r) => Math.abs(r.centre.y))).toFixed(2), '單位')
console.log('漢字沿行墨到墨間隙 ', Math.min(...han.map((r) => r.gapAlong)).toFixed(1), '–',
            Math.max(...han.map((r) => r.gapAlong)).toFixed(1), '單位（間距 94）')
console.log('\nviewBox', out.viewBox, '\n塊面四邊餘量（負 = 被切）', JSON.stringify(out.slack))
await browser.close()
