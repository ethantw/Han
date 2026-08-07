import { test, expect } from '@playwright/test'

/**
 * Station②'s § pocket layout (lead-forme.css): on wide 橫排 plates the forme
 * becomes a grid — pills as 直排 lozenges and the caption as a 直排 colophon
 * down the fore-edge, both set into the air beyond the parallelogram's
 * inline-end vertex.
 *
 * What's asserted is the geometry RULE, not pixel positions: the colophon's
 * head must clear the vertex's foot (--lf-foot, published by lead-forme.js)
 * and its own foot must stay inside the figure. Slug-bbox intersection is
 * deliberately NOT asserted — an isometric slug's bounding rect is mostly
 * empty corner air, so it false-positives on layouts that are visually clear.
 */

test('pocket: 直排 pills + fore-edge colophon, clear of the vertex foot', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/')
  await page.locator('.LeadForme .Slug').first().waitFor()

  const geo = await page.locator('.LeadForme').evaluate(($f) => {
    const svg = $f.querySelector('svg')!.getBoundingClientRect()
    const cap = $f.querySelector('figcaption')!.getBoundingClientRect()
    const ctl = $f.querySelector('.Controls')!.getBoundingClientRect()
    const forme = $f.getBoundingClientRect()
    const s = getComputedStyle($f)
    return {
      display: s.display,
      foot: Number.parseFloat(s.getPropertyValue('--lf-foot')),
      capWm: getComputedStyle($f.querySelector('figcaption')!).writingMode,
      pillWm: getComputedStyle($f.querySelector('.Controls fieldset')!).writingMode,
      svg, cap, ctl, forme,
    }
  })

  expect(geo.display).toBe('grid')
  expect(geo.capWm).toBe('vertical-rl')
  expect(geo.pillWm).toBe('vertical-rl')

  // the colophon hangs on the fore-edge strip: head below the vertex's foot…
  expect(geo.cap.top).toBeGreaterThanOrEqual(geo.svg.top + geo.foot * geo.svg.width - 1)
  // …foot inside the forme, and the whole column right of the pills
  expect(geo.cap.bottom).toBeLessThanOrEqual(geo.forme.bottom + 1)
  expect(geo.cap.left).toBeGreaterThanOrEqual(geo.ctl.right)
  // pills stand on the LOWEST SLUG, not on the figure's floor. The SVG's box
  // hugs the ink now (§ air), so the ink's bottom line IS svg.bottom and the
  // rack lands on it by construction — where the old `--lf-air-bottom` margin
  // used to hold it, one air above a padded viewBox's edge.
  expect(Math.abs(geo.ctl.bottom - geo.svg.bottom)).toBeLessThan(2)
  expect(geo.ctl.bottom).toBeLessThan(geo.forme.bottom)

  // § air — the SVG's box HUGS the 活字版 and the void around it is the
  // figure's own padding. Three sides are flush with the ink by construction
  // (the extremes ARE the box); only the block-start reserves the relief's rise
  // above the topmost piece, published as --lf-gap-top. Asserted against the
  // ink's real position, so a wrong fraction or a wrong multiplier shows up as a
  // mismatch rather than as a plausible-looking number.
  const air = await page.evaluate(() => {
    const $f = document.querySelector('.LeadForme')!
    const box = $f.querySelector('svg')!.getBoundingClientRect()
    // the FACE POLYGONS, not the `.Slug` groups: buildForme fits the box to the
    // pieces' footprints, and a slug group's bounding rect also swallows its
    // glyph <text> LAYOUT boxes — a 1.437em line height around a 1em face, so it
    // reports ink far outside the type. A polygon's bbox is the polygon.
    const ink = [...$f.querySelectorAll('svg polygon')].reduce(
      (a: { l: number; r: number; t: number; b: number } | null, g) => {
        const r = g.getBoundingClientRect()
        return a
          ? { l: Math.min(a.l, r.left), r: Math.max(a.r, r.right), t: Math.min(a.t, r.top), b: Math.max(a.b, r.bottom) }
          : { l: r.left, r: r.right, t: r.top, b: r.bottom }
      },
      null,
    )!
    // an unregistered custom property computes to its literal token, so
    // getComputedStyle would hand back "calc(0.0251 * 100cqw)". Resolve it the
    // way a consumer would: hand it to a real property and measure the box.
    const $probe = document.createElement('div')
    $probe.style.cssText = 'position:absolute; block-size:0; visibility:hidden'
    $f.append($probe)
    const px = (v: string) => {
      $probe.style.inlineSize = `var(${v})`
      return $probe.getBoundingClientRect().width
    }
    const out = {
      /* the air itself, as the figure's padding, and the one reserved side */
      pad: px('--lf-air'),
      reservedTop: Number.parseFloat(getComputedStyle($f).getPropertyValue('--lf-gap-top')) * box.width,
      actual: { top: ink.t - box.top, bottom: box.bottom - ink.b, left: ink.l - box.left, right: box.right - ink.r },
      padding: getComputedStyle($f).paddingLeft,
    }
    $probe.remove()
    return out
  })
  // 2px of slack throughout: the declared values are pure geometry, the measured
  // ones carry half a stroke at whichever vertex is the extreme.
  expect(air.pad).toBeGreaterThan(0)
  expect(Math.abs(Number.parseFloat(air.padding) - air.pad)).toBeLessThan(2)
  for (const side of ['bottom', 'left', 'right'] as const)
    expect(Math.abs(air.actual[side])).toBeLessThan(2)
  expect(air.reservedTop).toBeGreaterThan(0)
  expect(Math.abs(air.reservedTop - air.actual.top)).toBeLessThan(2)

  // …and its columns hang off the forme's own bottom-inline-end edge: each
  // one starts lower than the one inline-end of it, at the projection's slope
  // (e2 = [−cos30, .5] ⇒ √3 of run per unit of rise). One rect per column.
  const cols = await page.locator('.LeadForme figcaption').evaluate(($c) => {
    const range = document.createRange()
    range.selectNodeContents($c)
    // one column can yield several rects, and the note's inline <code> is set
    // a size down so its rect sits a few px off the column's own edge —
    // cluster by position (half a column's advance) and keep each head.
    const tol = Number.parseFloat(getComputedStyle($c).fontSize)
    const cols: { x: number; top: number }[] = []
    // block order in vertical-rl is right → left
    for (const r of [...range.getClientRects()].sort((a, b) => b.x - a.x)) {
      const last = cols.at(-1)
      if (last && last.x - r.x < tol) last.top = Math.min(last.top, r.top)
      else cols.push({ x: r.x, top: r.top })
    }
    return cols
  })
  expect(cols.length).toBeGreaterThanOrEqual(3)
  cols.slice(1).forEach((col, i) => {
    const prev = cols[i]
    const run = prev.x - col.x
    expect(run).toBeGreaterThan(0)
    // 1/√3 ≈ 0.577 — generous band, the shape-margin rounds each head
    expect((col.top - prev.top) / run).toBeGreaterThan(0.35)
    expect((col.top - prev.top) / run).toBeLessThan(0.85)
  })

  // 「鉛字版壓在樣張卡上」那個視覺哏**不在這裡斷言**（2026-08-07 撤除）。
  // 它量的是斜邊切進卡片幾 px，而抬升是開環的——負 margin 由幾何常數算
  // 出、不錨卡片實際位置，樣張欄上方任何文案改高度它就漂。實測它出生即
  // 未達門檻、經兩輪內容改動一路惡化，是個週期性假紅的美學量
  //（docs/notes/2026-08-06-pocket-cut-erosion.md）。哏成不成立由人眼驗收。
  //
  // 真正該守的功能性不變量另有人守：鉛字版疊上去之後，卡片自己的互動
  // 不能被吃掉——eye-care.spec.ts 在同一個視口用**真的點擊**（非
  // force，Playwright 的 actionability 檢查會擋下任何攔截）驗護眼模式
  // 開關，並另有一個測試驗鉛字版的 slug 自己接得到指標。

  // the radios still answer the pointer through the rotated labels. Settle the
  // entrance first — the pills hold `visibility: hidden` until the drop is over
  // (§ entrance · lf-chrome-in), so an un-revealed forme has nothing to click.
  await page.locator('.LeadForme').evaluate(($f) => {
    $f.setAttribute('data-revealed', '')
    $f.classList.add('settled')
  })
  await page.locator('.LeadForme .Controls label', { hasText: '黑體' }).click()
  await expect(page.locator('.LeadForme')).toHaveAttribute('data-face', 'h')
  await page.locator('.LeadForme .Controls label', { hasText: 'GB' }).click()
  await expect(page.locator('.LeadForme')).toHaveAttribute('data-punct', 'gb')
})

test('stacked fallback: below the pocket width everything returns to flow', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 })
  await page.goto('/')
  await page.locator('.LeadForme .Slug').first().waitFor()

  const geo = await page.locator('.LeadForme').evaluate(($f) => ({
    display: getComputedStyle($f).display,
    capWm: getComputedStyle($f.querySelector('figcaption')!).writingMode,
    pillWm: getComputedStyle($f.querySelector('.Controls fieldset')!).writingMode,
    svgBottom: $f.querySelector('svg')!.getBoundingClientRect().bottom,
    ctlTop: $f.querySelector('.Controls')!.getBoundingClientRect().top,
    capTop: $f.querySelector('figcaption')!.getBoundingClientRect().top,
  }))

  expect(geo.display).not.toBe('grid')
  // the caption reads as a plain paragraph again; the pills stay 直排 lozenges
  expect(geo.capWm).toBe('horizontal-tb')
  expect(geo.pillWm).toBe('vertical-rl')
  // stacked: forme, then pills, then note
  expect(geo.ctlTop).toBeGreaterThanOrEqual(geo.svgBottom)
  expect(geo.capTop).toBeGreaterThanOrEqual(geo.ctlTop)
})
