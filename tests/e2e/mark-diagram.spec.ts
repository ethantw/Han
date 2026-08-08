import { test, expect, type Page } from '@playwright/test'

/**
 * Station ①'s 標記原理圖 — the six-bar SVG beside the poem in
 * `<figure class="semantic-elements">`.
 *
 * It exists because the TEXT cannot animate the station's own argument:
 * Chromium's synthetic oblique ignores `font-style: oblique <angle>` at
 * rasterisation time (measured — see the keyframe comment in
 * home/station-semantics.css), and in the 直排 band a `skewX` shears a whole
 * run sideways instead of slanting each glyph. The diagram moves the claim
 * to pure geometry, where every quantity is continuous again.
 *
 * What is worth pinning here is not how it looks but the handful of facts a
 * later edit could quietly break:
 *
 *   - `--settle` answers the same switch the poem does (0 ⇄ 1),
 *   - `<u>` NEVER slants, because no browser italicises it,
 *   - adjacent 甲式 titles keep their gap,
 *   - no fake `<code>` tag string is left anywhere in the station's text.
 *
 * Deliberately coarse. The diagram's VISUAL mechanism is still moving — the
 * bars have already been rectangles, glyph cells, and now stroked IDCs, and
 * `<dfn>`'s weight has been a scaleX and is now a stroke-width — so tests
 * that pin the mechanism just break on every redesign without ever catching
 * a real fault. These pin behaviour that must survive any redesign; the
 * fine-grained pass waits until the design settles.
 */

const FIGURE = '#station-semantics figure.semantic-elements'
const BARS = `${FIGURE} .MarkDiagram [data-mark]`

const settleOf = (page: Page) =>
  page.$$eval(BARS, (gs) =>
    gs.map((g) => Number(getComputedStyle(g).getPropertyValue('--settle'))),
  )

/** The whole station is gated behind the fonts gate + reveal stamp. */
const revealStation = async (page: Page) => {
  await page.locator('#station-semantics').scrollIntoViewIfNeeded()
  await expect(page.locator('#station-semantics')).toHaveAttribute('data-revealed', '', {
    timeout: 20_000,
  })
}

test.describe('station ① mark diagram', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await revealStation(page)
  })

  test('settles to 1, and the switch drives every bar back to 0', async ({ page }) => {
    await expect
      .poll(async () => (await settleOf(page)).every((v) => v === 1), { timeout: 15_000 })
      .toBe(true)

    // Polled, not read once: the return is animated too (`mark-unsettle`),
    // so a bare read lands mid-flight on a fractional --settle.
    await page.locator('[data-cfg-key="semantics"]').uncheck()
    await expect
      .poll(async () => (await settleOf(page)).every((v) => v === 0), { timeout: 15_000 })
      .toBe(true)

    await page.locator('[data-cfg-key="semantics"]').check()
    await expect
      .poll(async () => (await settleOf(page)).every((v) => v === 1), { timeout: 15_000 })
      .toBe(true)
  })

  test('<u> is never slanted — no engine italicises it', async ({ page }) => {
    const identity = 'matrix(1, 0, 0, 1, 0, 0)'
    // `[data-glyph]`, NOT the `[data-cell]` ruling. The 字格 is static in
    // every row by design — an em box is the page's, and no engine bends it
    // — so asserting on the cell would pass in all six rows and keep passing
    // even if `<u>`'s strokes were sheared. Aim at the thing that moves.
    const strokes = page.locator(`${FIGURE} [data-mark="proper"] [data-glyph]`).first()

    await expect(strokes).toHaveCSS('transform', identity)

    // …and still upright in the browser-defaults state, where every OTHER
    // row shears. That asymmetry is the point: `<u>` takes an underline and
    // stays upright, so its two states differ by the RULE alone.
    await page.locator('[data-cfg-key="semantics"]').uncheck()
    await expect(strokes).toHaveCSS('transform', identity)
    await expect(
      page.locator(`${FIGURE} [data-mark="emphasis"] [data-glyph]`).first(),
    ).not.toHaveCSS('transform', identity)
  })

  test('no fake tag string is selectable anywhere in the station', async ({ page }) => {
    // The poem used to carry a `<code>` ghost inside every marked run, and the
    // letterheads a literal «<address>» text node — so copying a letterhead
    // yielded «<address>大宋　…», welding a tag name into the prose of a
    // station whose entire claim is that the ELEMENT carries the meaning.
    // Both are gone: the diagram beside the poem does that teaching now, and
    // it is `user-select: none` precisely so its own row labels (`<u>`,
    // `<em>`, … — real `<text>`) don't reintroduce the same problem.
    //
    // Scoped to the whole station, not the figure: the envelope moved out of
    // the figure and carries the two `<address>` specimens with it, so the
    // narrower scope would have stopped watching the very elements this
    // guards.
    const copied = await page.$eval('#station-semantics', (station) => {
      const sel = getSelection()!
      sel.removeAllRanges()
      const range = document.createRange()
      range.selectNodeContents(station)
      sel.addRange(range)
      return sel.toString()
    })

    for (const tag of ['<address', '<cite', '<em', '<dfn', '<u>', '</']) {
      expect(copied, `selection must not contain ${tag}`).not.toContain(tag)
    }
    expect(await page.locator('#station-semantics code').count()).toBe(0)
  })
})

/**
 * The real behaviour the diagram's 甲式 row abstracts. Kept in this file on
 * purpose: the diagram DRAWS the break, the library MAKES it, and if they ever
 * disagree the figure starts lying about its own specimen.
 */
test.describe('station ① 甲式 adjacent-title gap', () => {
  test('adjacent wavy <cite> keep a gap, and keep it after the fallbacks re-run', async ({
    page,
  }) => {
    await page.goto('/')
    await revealStation(page)

    const gapOf = (nth: number) =>
      page.$eval(
        `#station-semantics .poem-like cite:nth-of-type(${nth})`,
        (el) => getComputedStyle(el).marginInlineEnd,
      )

    // 《武經總要》〈字驗〉— a work and a chapter of it. Adjacent 書名號 mean
    // containment, so the two waves MUST stay distinguishable; merged, the row
    // reads as one long title 「武經總要字驗」 and the grammar is lost.
    //
    // 2026-08-08 這條從「頁面自己補」變成「庫負責」：han.js 的鄰行 pass 以前
    // 只認 `u, ins` / `s, del` 兩家，`cite` 在 with-js CSS 的撤銷名單裡卻沒有
    // 任何家族會標記它——JS 一跑，純 CSS 給的縫就被撤掉。手冊為此帶了一支
    // `home/wavy-cite-gap.js` 補標記；現在庫發第二顆標記
    // （`data-followed-by-adjacent-wavy`），那支補丁已刪。
    // 這條斷言因此升級成庫的迴歸鎖，包含「控制台重跑一輪 fallbacks 之後縫還在」
    // ——那一輪會先把標記全抹掉再重標，是最容易靜默壞掉的一刻。
    await expect.poll(() => gapOf(1), { timeout: 15_000 }).not.toBe('0px')

    // 乙式 elsewhere must NOT be touched — 《》 already separate the titles.
    expect(await page.$eval('.Papers cite', (el) => getComputedStyle(el).marginInlineEnd)).toBe(
      '0px',
    )
  })
})

test.describe('station ① mark diagram, reduced motion', () => {
  test('lands on the corrected end with no animation, switch still works', async ({ page }) => {
    // `emulateMedia`, not `test.use({ reducedMotion })` — the latter is
    // silently ignored under this project config (probed: the media query
    // stays false), which would leave this test asserting nothing.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    expect(
      await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
    ).toBe(true)
    await revealStation(page)

    // `initial-value: 1` is the no-JS / no-motion contract: the uncorrected
    // frame only ever exists inside a running animation, so its absence has
    // to leave the CORRECTED state, never the browser-defaults one.
    expect(await settleOf(page)).toEqual([1, 1, 1, 1, 1, 1])
    await expect(page.locator(BARS).first()).toHaveCSS('animation-name', 'none')

    await page.locator('[data-cfg-key="semantics"]').uncheck()
    expect(await settleOf(page)).toEqual([0, 0, 0, 0, 0, 0])
  })
})
