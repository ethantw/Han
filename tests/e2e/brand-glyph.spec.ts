import { test, expect } from '@playwright/test'

/**
 * The wordmark's 漢 must not move when the webfont swaps in.
 *
 * Two independent things had to be nailed down for that:
 *
 *   1. `.Brand` is a baseline-aligned flex line, so the baseline's offset
 *      inside the box is `max(ascent)` over its atoms — which JUMPED at swap
 *      (measured: the 「.」 and `css` sat 0.1875em / 6px lower before it).
 *      `[data-part="mark"]` now declares the always-available `'Brand
 *      Metrics'` face first, pinning the largest ascent in the line to a
 *      constant, so the baseline can't move (`common/brand.css`).
 *   2. `.BrandGlyph` (the 漢 overlay) is absolutely positioned, and abspos can
 *      only anchor box edges — where the baseline sits inside that box is a
 *      font metric CSS cannot read. `home/brand-glyph.js` measures it and pins
 *      the glyph to `baseline − 0.88em` (its em box's ascent, Shanggu sTypoAsc
 *      880). Before that, the hard-coded offset left the glyph 0.182em (4.4px
 *      at the Topbar's 24px) low until the swap snapped it up.
 *
 * So the assertions are: identical geometry in both font states, and the glyph
 * on the baseline in both. The fallback state is produced by aborting the
 * webfont CDN — the same thing a slow network does for real.
 */

const BRANDS = ['header .Brand', '.Manifesto h1 .Brand']

/** Every atom's offset inside its `.Brand`, in em (font-size-independent). */
const geometry = (page) =>
  page.evaluate((sels: string[]) =>
    sels.map((sel) => {
      const $brand = document.querySelector(sel) as HTMLElement
      const $mark = $brand.querySelector('[data-part="mark"]') as HTMLElement
      const em = parseFloat(getComputedStyle($mark).fontSize)
      const box = $brand.getBoundingClientRect()
      const at = (child: string) => {
        const r = $brand.querySelector(child)!.getBoundingClientRect()
        return { top: +((r.top - box.top) / em).toFixed(3), left: +((r.left - box.left) / em).toFixed(3) }
      }

      // zero-size inline-block on the baseline: its box top IS the baseline
      const $probe = document.createElement('span')
      $probe.style.cssText = 'display:inline-block;inline-size:0;block-size:0;vertical-align:baseline'
      $mark.append($probe)
      const baseline = $probe.getBoundingClientRect().top
      $probe.remove()

      return {
        sel,
        blockSize: +(box.height / em).toFixed(3),
        glyph: at('.BrandGlyph'),
        dot: at('[data-part="dot"]'),
        ext: at('[data-part="ext"]'),
        zihui: at('.BrandMark'),
        // px between the glyph's top edge and where its em box belongs
        glyphOffBaselinePx: $brand.querySelector('.BrandGlyph')!.getBoundingClientRect().top - (baseline - em * 0.88),
      }
    }),
  BRANDS)

const settled = async (page) => {
  await page.goto('/')
  await page.waitForFunction(() => (document as any).fonts.status === 'loaded')
  await page.waitForTimeout(600)
}

test('the wordmark is laid out identically with and without the webfont', async ({ page }) => {
  await page.route('**/cdn.jsdelivr.net/**', (r) => r.abort())
  await settled(page)
  const fallback = await geometry(page)

  await page.unroute('**/cdn.jsdelivr.net/**')
  await settled(page)
  const webfont = await geometry(page)

  for (const [i, sel] of BRANDS.entries()) {
    // The GLYPH is what the reader sees — it must not move by a hair. The
    // atoms' font BOXES legitimately grow when the real face arrives (a box
    // is `baseline − ascent`, and Shanggu's ascent is taller than the
    // fallback's); their glyphs still sit on the same frozen baseline, which
    // is exactly what the glyph's own stability proves.
    expect(fallback[i].glyph, sel).toEqual(webfont[i].glyph)
    expect(fallback[i].dot.left, `${sel} dot`).toBe(webfont[i].dot.left)
    expect(fallback[i].ext.left, `${sel} ext`).toBe(webfont[i].ext.left)
    expect(fallback[i].zihui, `${sel} 字徽`).toEqual(webfont[i].zihui)
  }
})

test('the glyph sits on the baseline in both font states', async ({ page }) => {
  await page.route('**/cdn.jsdelivr.net/**', (r) => r.abort())
  await settled(page)
  for (const { sel, glyphOffBaselinePx } of await geometry(page)) {
    // one CSS pixel of slack; the old hard-coded offset was 4.4px out here
    expect(Math.abs(glyphOffBaselinePx), `fallback ${sel}`).toBeLessThan(1)
  }

  await page.unroute('**/cdn.jsdelivr.net/**')
  await settled(page)
  for (const { sel, glyphOffBaselinePx } of await geometry(page)) {
    expect(Math.abs(glyphOffBaselinePx), `webfont ${sel}`).toBeLessThan(1)
  }
})

/**
 * Regression: the hero used to be measured while its own section's rendering
 * was being SKIPPED. `main > section` carries `content-visibility: auto` for
 * the stations (home/frame.css), and it caught `.Manifesto` too — so on any
 * load that starts below the fold (a reload with a restored scroll, or a
 * `#station` deep link) the hero was skipped when brand-glyph.js measured. In
 * a skipped subtree a node inserted just now has no box and reports an
 * all-zero rect, while the mark still reports the off-screen one it was last
 * laid out at: their difference is the scroll offset, not a baseline. It was
 * written out as `128.2294em` and threw the 漢 a page and a half down, where
 * the section's `overflow: clip` swallowed it. The gap looked normal — the
 * width belongs to the transparent real 漢, not to the SVG.
 *
 * The same skip silences the subtree's animations, which is why this also
 * checks the opening ceremony: the strokes never ran, so the `animationend`
 * fonts-gate.js waits on never came, `data-pass` stayed on all twelve strokes
 * (an undrawn watermark) and `data-han-traced` was never stamped — leaving
 * station①'s envelope folded for the life of the page.
 */
test('a load that starts below the fold still measures the hero', async ({ page }) => {
  await page.goto('/#station-fonts')
  await page.waitForFunction(() => (document as any).fonts.status === 'loaded')

  /* The ceremony is asserted FIRST, while the page is still parked down at
     the station: scrolling back up un-skips the hero and lets the pass finish
     after all — what a reader would do, and it would hide the very thing this
     test is here for.

     The deadline matters as much as the assertion. A real pass lands well
     under 8s (measured 5–8s for all twelve strokes) and fonts-gate.js's
     backstop only fires at 12s, so a 9s window is what separates「描完了」from
    「靠保底收的場」. Skipped, this read 12 strokes still writing and no stamp
     at all, for the life of the page. */
  await expect
    .poll(
      () =>
        page.evaluate(() => ({
          traced: document.documentElement.dataset.hanTraced,
          writing: [...document.querySelectorAll('.Manifesto .Outline .Stroke')]
            .filter(($s) => $s.hasAttribute('data-pass')).length,
        })),
      { timeout: 9_000 },
    )
    .toEqual({ traced: '', writing: 0 })

  // and the glyph itself is where the wordmark's baseline puts it
  await page.evaluate(() => scrollTo(0, 0))
  await page.waitForTimeout(300)
  const [hero] = (await geometry(page)).filter((g) => g.sel === '.Manifesto h1 .Brand')
  expect(Math.abs(hero.glyphOffBaselinePx), 'hero glyph off its baseline').toBeLessThan(1)
})
