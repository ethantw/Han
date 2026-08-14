/**
 * dash-fuse.js — station②'s 破折號熔接底圖（.PunctFix）：柱的排版與裁切。
 *
 * 幾何在 dash-fuse.css，句子在 station-fonts.html；這支做兩件事——
 *
 *   § layoutColumn  把 HTML 裡那兩句話拆成一格一個的**橫排** <text>
 *   § initClip      量出「超迴路運行廿載」樣張卡的上緣，發佈 --df-clip-top
 *
 * WebKit 的 SVG 直排不能用（字距讀 hhea 而非 vmtx、`vert` 完全不套），所以
 * 柱子是自己算格子、逐格擺橫排 `<text>`，class R 的字符各自 `rotate(90)`
 * → han/docs/notes/2026-08-02-webkit-svg-vertical-text.md。
 *
 * 那台戲——漂移、較勁、首播熔接、按住不讓它修好——2026-08-14 整組撤下：它是
 * 整頁 idle 時唯一的成本來源（站②停在畫面上每 3 秒 613ms style recalc），而
 * 互動要重新設計。時序、hover 契約與六支 keyframes 都留在 git 裡，見
 * dash-fuse.css § 動畫暫時撤下。
 */

const SVG_NS = 'http://www.w3.org/2000/svg'

/* 一格 ＝ 100 user unit ＝ 1em（font-size 也是 100px，dash-fuse.css）。 */
const CELL = 100

/* 字面的 em 框中心在基線之上 0.38em。**不是** `dominant-baseline: central`
 * ——那個以 hhea asc/desc 的中點為準（實測 0.4326em），em 框的中點是
 * sTypoAscender 880/1000。同一個數、同一個理由見 lead-forme.js § GEO
 * `emCentre`，那裡是逐字量出來的。 */
const EM_CENTRE = 0.38

/* UTR50 class R——直排要轉 90° 的字符。這裡自己轉，不求引擎：WebKit 在 SVG
 * 裡既不套 `vert`／`vrt2`，直排的字距又讀 hhea（見 dash-fuse.css § text）。
 * 表只涵蓋這一柱**可能**出現的字符；漢字是 class U，正立，不在表上。 */
const ROTATED = new Set([
  '《', '》', '〈', '〉',
  '「', '」', '『', '』',
  '（', '）', '〔', '〕',
  '—', '…', '～', 'ー',
])

/* 把一個裝著整句的 <text> 換成一格一個的橫排 <text>。
 * 句子只寫在 HTML（station-fonts.html），這裡讀走、不複製；<text> 自己的
 * `y` 是第一格的**上緣**，所以第 i 格的中點是 y + (i + .5) × CELL。 */
const layoutColumn = ($column) => {
  for (const $text of [...$column.querySelectorAll('text')]) {
    const top = Number.parseFloat($text.getAttribute('y'))
    const x = $text.getAttribute('x')
    const $cells = document.createDocumentFragment()

    ;[...$text.textContent].forEach((char, i) => {
      const centre = top + (i + 0.5) * CELL
      const $cell = document.createElementNS(SVG_NS, 'text')
      $cell.setAttribute('x', x)
      $cell.setAttribute('y', String(centre + EM_CENTRE * CELL))
      $cell.setAttribute('text-anchor', 'middle')
      /* 繞字格中點轉——text-anchor:middle 把 em 框橫向釘在欄軸上，
         y 又是由中點回推的，所以 (x, centre) 正好是 em 框的中心。 */
      if (ROTATED.has(char)) $cell.setAttribute('transform', `rotate(90 ${x} ${centre})`)
      $cell.textContent = char
      $cells.append($cell)
    })

    $text.replaceWith($cells)
  }
  /* 排完才交還橫排行向（CSS 的 `writing-mode: vertical-rl` 是沒有 JS 時的
     退路，見 dash-fuse.css § text）。 */
  $column.setAttribute('data-laid', '')
}

/* 柱的上緣切在「超迴路運行廿載」樣張卡的上緣。這個距離沒有靜態的 CSS 表
 * 達式——它隨 lede 換行、隨版心寬變——所以量出來發佈成變數，CSS 只管用
 * （同 lead-forme.js 把 --lf-* 發佈給 lead-forme.css 的作法）。
 * 觀察 main 的尺寸就夠：站台的一切寬度都由它給。 */
const initClip = ($column) => {
  const $faces = document.querySelector('#station-fonts .Illust[data-variant="faces"]')
  const $main = document.querySelector('main')
  if (!$faces) return

  const sync = () => {
    const top = $faces.getBoundingClientRect().top - $column.getBoundingClientRect().top
    $column.style.setProperty('--df-clip-top', `${Math.max(0, Math.round(top))}px`)
  }

  sync()
  document.fonts?.ready.then(sync)
  if ($main) new ResizeObserver(sync).observe($main)
}

export const initDashFuse = () => {
  const $column = document.querySelector('.PunctFix svg[data-name="dash-fuse"]')
  if (!$column) return
  layoutColumn($column)
  initClip($column)
}
