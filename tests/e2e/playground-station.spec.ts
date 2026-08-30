import { test, expect, type Page } from '@playwright/test'

/**
 * Station⑤ playground (user-content editor) e2e.
 *
 * The station (`#station-playground`) hosts a `<textarea data-pg-src>`
 * (Code tab) whose Markdown/HTML is rendered — marked → DOMPurify →
 * `<article data-pg-preview>` (Preview tab, default). The preview lives
 * inside `main`, so the console's `--han-*` vars inherit into it. Text
 * persists to `localStorage['han-playground-src']`; the console's Reset never
 * touches it.
 */

const KEY = 'han-playground-src'

/* The loupe carries an aria-hidden visual clone of the paper. Tests exercise
 * the source document, never that magnified copy. Keep this selector tied to
 * the sheet's direct, non-clone paper so a new lens cannot double every
 * assertion again. */
const $paper = (page: Page) =>
  page.locator('#station-playground .Sheet > [data-pg-paper]:not([data-lens-clone])')
const $preview = (page: Page) => $paper(page).locator('[data-pg-preview]')
const $src = (page: Page) => page.locator('#station-playground [data-pg-src]')
/** Type source into the textarea. Both panes are always on stage now — the
 *  narrow panel's 預覽／原始碼 tabs went away with the one-pane-at-a-time
 *  layout (2026-08-28), so there is nothing to reveal first. */
const setSource = async (page: Page, src: string) => {
  await $src(page).fill(src)
}

/** 配置群組是 shadow 內的 <details> 手風琴——收合組裡的控件先展開。 */
const openGroupOf = (page: Page, cfgKey: string) =>
  page
    .locator(`details.ControlGroup:not([open]):has([data-cfg-key="${cfgKey}"]) > summary`)
    .click()

test.describe('station⑤ playground', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Playground boots after the fonts gate opens (perf: its 190KB
    // vendor is deferred past the stroke ceremony). Wait for the ready
    // signal instead of racing the deferred dynamic import.
    await page.waitForSelector('html[data-pg-ready]')
  })

  test('default sample renders in the preview (a whole 太陽中文報 piece, marked up)', async ({ page }) => {
    // The shipped sample is one full taisol article (zh/trump-sashimi.md) with
    // han-semantics elements applied — headline and four sections; the
    // dateline is paper chrome, asserted below.
    await expect($preview(page).locator('h1')).toHaveCount(1)
    await expect($preview(page).locator('h2')).toHaveCount(4)
    await expect($preview(page).locator('em').first()).toBeVisible()
    await expect($preview(page).locator(':scope > h1:first-of-type')).toHaveCSS('column-span', 'all')

    // …and it exercises the elements han.semantics.css actually styles, which
    // is the whole point of shipping a real article rather than a snippet.
    for (const sel of ['u', 'q', 'dfn', 'i[lang]', 'ruby.zhuyin > rt'])
      expect(await $preview(page).locator(sel).count()).toBeGreaterThan(0)
    await expect($preview(page).locator(':scope > blockquote')).toHaveCount(0)
    await expect($paper(page)).toHaveCSS('padding-block-end', '8px')
    await expect($paper(page)).toHaveCSS('min-block-size', '0px')
    await expect($preview(page)).toHaveCSS('width', '720px')
    await expect($preview(page)).toHaveCSS('column-width', '168px')

    // At the owner's wide desktop size the story actually reaches the fourth
    // column in each of the two 50em rows. A computed four-column box alone
    // can still hide an empty final column, which was the regression here.
    await page.setViewportSize({ width: 1920, height: 1200 })
    await expect.poll(() => $preview(page).evaluate((el) => {
      const s = getComputedStyle(el)
      const gap = Number.parseFloat(s.columnGap)
      const box = el.getBoundingClientRect()
      const column = Number.parseFloat(s.columnWidth)
      const lastInk = Math.max(...[...el.children]
        .filter((child) => getComputedStyle(child).columnSpan !== 'all')
        .map((child) => child.getBoundingClientRect().right - box.left))
      return {
        usedColumns: Math.ceil((lastInk - 0.5 + gap) / (column + gap)),
        rows: Math.ceil((box.height + gap) /
          (Number.parseFloat(s.columnHeight) + Number.parseFloat(s.rowGap))),
      }
    })).toEqual({ usedColumns: 4, rows: 2 })

    // The dateline is card CHROME above the editable article (so it can't
    // be pickled into a localStorage draft), rewritten on boot to «today +
    // 100 years» — the same instant station①'s newspaper datelines carry
    // (home/papers-dateline.js owns the date; the playground borrows it).
    const plus100 = new Date().getFullYear() + 100
    const $time = $paper(page).locator('.PaperHead time[data-era-line]')
    await expect($time).toHaveAttribute('datetime', new RegExp(`^${plus100}-`))
    await expect($time).toContainText('中華民國')
    await expect($time).toContainText('夏曆')
    await expect($time).toContainText('弘宙元年')
    await expect($time).toContainText('西元')
  })

  test('typing Markdown + inline HTML updates the preview', async ({ page }) => {
    await setSource(page, '## 標題\n\n這是<strong>粗體</strong>與*斜體*。')
    /* ARRAY form on purpose. The render is debounced, so the first poll still
       sees the shipped sample — a whole article with four <h2> and five <em>
       — and `toHaveText('…')` against a multi-element locator is a strict-mode
       violation, which THROWS instead of retrying. The list form is defined
       over «all matches», so it just fails that poll and waits. */
    await expect($preview(page).locator('h2')).toHaveText(['標題'])
    await expect($preview(page).locator('strong')).toHaveText(['粗體'])
    await expect($preview(page).locator('em')).toHaveText(['斜體'])
  })

  test('XSS attempts are neutralized (no script / onerror / javascript: href)', async ({ page }) => {
    await setSource(
      page,
      [
        '<script>window.__pwned = 1</script>',
        '<img src=x onerror="window.__pwned = 1">',
        '<a href="javascript:window.__pwned = 1">click</a>',
      ].join('\n\n'),
    )

    // No script element survives.
    await expect($preview(page).locator('script')).toHaveCount(0)
    // No element retains an onerror handler.
    expect(
      await $preview(page).evaluate((el) => el.querySelectorAll('[onerror]').length),
    ).toBe(0)
    // No javascript: href survives.
    expect(
      await $preview(page).evaluate((el) =>
        [...el.querySelectorAll('a')].some((a) =>
          (a.getAttribute('href') ?? '').trim().toLowerCase().startsWith('javascript:')),
      ),
    ).toBe(false)
    // The handler never fired.
    expect(await page.evaluate(() => (window as Record<string, unknown>).__pwned ?? null)).toBeNull()
  })

  test('formatting surface survives sanitization (ruby / lang / data-*)', async ({ page }) => {
    await setSource(
      page,
      '<span lang="ja">日本語</span>\n\n<ruby>漢<rt>かん</rt></ruby>\n\n<span data-foo="bar">x</span>',
    )
    await expect($preview(page).locator('span[lang="ja"]')).toHaveText('日本語')
    await expect($preview(page).locator('ruby rt')).toHaveText('かん')
    await expect($preview(page).locator('[data-foo="bar"]')).toHaveCount(1)
  })

  test('text persists to localStorage and is restored across reload', async ({ page }) => {
    const marker = '# PERSIST-' + Date.now()
    await setSource(page, marker)
    await expect
      .poll(() => page.evaluate((k) => localStorage.getItem(k), KEY))
      .toContain(marker)

    await page.reload()
    await expect($src(page)).toHaveValue(marker)
    await expect($preview(page).locator('h1')).toHaveText(marker.slice(2))
  })

  test('the two content buffers are independent, and a blanked one refills', async ({ page }) => {
    // 報導 and 自訂內容 are separate pages, each with its own default.
    const tab = (label: string) =>
      page.locator('#station-playground [data-pg-content-tabs] label').filter({ hasText: label }).click()

    await tab('自訂內容')
    await expect($src(page)).toHaveValue(/在這裡寫你自己的字/)

    const mine = '# MINE-' + Date.now()
    await setSource(page, mine)
    await tab('報導')
    await expect($src(page)).toHaveValue(/太陽中文報/)   // the article, untouched
    await tab('自訂內容')
    await expect($src(page)).toHaveValue(mine)

    // Emptying a buffer is how a reader says「從頭來過」: the blank must not
    // come back as a saved draft — the default does.
    await setSource(page, '   \n  ')
    await page.reload()
    await tab('自訂內容')
    await expect($src(page)).toHaveValue(/在這裡寫你自己的字/)
  })

  test('the galley is a page: long copy adds column rows and grows the paper', async ({ page }) => {
    // `column-height` caps one row; long copy wraps into another row and the
    // paper grows in the page flow. The paper must never turn into a clipped
    // inner scroller merely because its proof acquired another row.
    const sheet = () =>
      page.evaluate(() => {
        const $rail = document.querySelector('#station-playground [data-pg-panes]')!
        const $card = document.querySelector(
          '#station-playground .Sheet > [data-pg-paper]:not([data-lens-clone])',
        )!
        const $g = $card.querySelector('[data-pg-preview]')!
        const gs = getComputedStyle($g)
        const used = Number.parseFloat(gs.getPropertyValue('--pg-galley-col-used'))
        const em = Number.parseFloat(gs.fontSize)
        return {
          fill: gs.columnFill,
          colEm: (used || Number.parseFloat(gs.columnWidth)) / em,
          bled: $card.hasAttribute('data-pg-bled'),
          paperWidth: Math.round($card.getBoundingClientRect().width),
          paperHeight: Math.round($card.getBoundingClientRect().height),
          paperScrollHeight: $card.scrollHeight,
          paperScrolls: $card.scrollWidth > $card.clientWidth + 1,
          columnHeightInEm: Number.parseFloat(gs.columnHeight) / em,
          columnWrap: gs.columnWrap,
          rowGapInRem: Number.parseFloat(gs.rowGap) /
            Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
          rowSeparator: CSS.supports('row-rule', '1px solid')
            ? gs.getPropertyValue('row-rule')
            : gs.backgroundImage,
          railWidth: $rail.scrollWidth,
          railScrolls: $rail.scrollWidth > $rail.clientWidth + 1,
        }
      })

    const tab = (label: string) =>
      page.locator('#station-playground [data-pg-content-tabs] label').filter({ hasText: label }).click()
    await tab('自訂內容')
    const short = await sheet()
    expect(short.fill).toBe('auto')
    expect(short.columnHeightInEm).toBe(50)
    expect(short.columnWrap).toBe('wrap')
    expect(short.rowGapInRem).toBe(1)
    expect(short.rowSeparator).not.toBe('none')
    expect(short.bled).toBe(false)
    expect(short.paperScrolls).toBe(false)

    await setSource(page, '# 長\n\n' + '把校樣撐出好幾欄來看看橫向捲動。'.repeat(300))
    await expect.poll(async () => (await sheet()).paperHeight).toBeGreaterThan(short.paperHeight)

    const long = await sheet()
    expect(long.bled).toBe(false)
    expect(long.paperScrolls).toBe(false)
    expect(long.railScrolls).toBe(true)
    expect(long.paperScrollHeight).toBeLessThanOrEqual(long.paperHeight + 1)
    // the design measure is a FLOOR — the solve may widen, never narrow
    expect(long.colEm).toBeGreaterThanOrEqual(21)
  })

  test('the loupe follows the specimen onto the stage, then follows the cursor', async ({ page }) => {
    // No switch: in a hover environment the loupe arrives after the specimen's
    // own entrance. It parks on the host's opening block so it never has to be
    // discovered, and from then on the reader drives it.
    const $lens = page.locator('#station-playground [data-mag-lens]')
    await $paper(page).scrollIntoViewIfNeeded()
    await expect($lens).toHaveAttribute('data-lens-arrived', '')
    await expect($lens).toBeVisible()

    const small = await $lens.evaluate((lens) => {
      const style = getComputedStyle(lens)
      const galley = getComputedStyle(document.querySelector(
        '#station-playground .Sheet > [data-pg-paper]:not([data-lens-clone]) [data-pg-preview]',
      )!)
      const magnifiedColumn = Number.parseFloat(galley.columnWidth)
        * Number.parseFloat(style.getPropertyValue('--lens-zoom'))
      const width = lens.getBoundingClientRect().width
      return { width, ratio: width / magnifiedColumn }
    })
    expect(small.ratio).toBeCloseTo(1.05, 2)

    await $paper(page).click({ position: { x: 80, y: 100 } })
    await expect($lens.locator('..')).toHaveAttribute('data-lens-on', 'large')
    const large = await $lens.evaluate((lens) => lens.getBoundingClientRect().width)
    expect(large / small.width).toBeCloseTo(1.25, 2)

    const centre = () =>
      page.evaluate(() => {
        const c = document.querySelector(
          '#station-playground .Sheet > [data-pg-paper]:not([data-lens-clone])',
        )!.getBoundingClientRect()
        const l = document.querySelector('#station-playground [data-mag-lens]')!.getBoundingClientRect()
        return Math.round(l.y + l.height / 2 - c.y)
      })
    const parked = await centre()
    // `hover` with an explicit position, not raw mouse coordinates: the card
    // is `translate`d and taller than this viewport, so a computed page
    // coordinate can land outside it.
    await $paper(page).hover({ position: { x: 200, y: 320 } })
    await expect.poll(centre).not.toBe(parked)

    // …and it lands ON the cursor, not merely somewhere else. The circle is
    // `position: absolute`, so the browser resolves its insets against the
    // nearest POSITIONED ancestor: mount it on a static parent and the module
    // measures one box while the browser uses another — the loupe drifts by
    // exactly the distance between them (it moved into the editor column when
    // the module started mounting on the host's parent instead).
    // Within a pixel, once the page has settled: the geometry solvers run
    // SETTLE_MS after the last resize (home/measure.js), so a card measured in
    // that window has not finished moving. The hover point is also rounded to
    // an integer while the card's origin is fractional — exact equality is not
    // the claim, being ON the cursor rather than a column away is.
    await page.waitForTimeout(250)
    await $paper(page).hover({ position: { x: 200, y: 320 } })
    const off = await page.evaluate(() => {
      const $h = document.querySelector(
        '#station-playground .Sheet > [data-pg-paper]:not([data-lens-clone])',
      )!
      let $frame = $h.parentElement!
      while ($frame && getComputedStyle($frame).position === 'static') $frame = $frame.parentElement!
      const l = $frame.querySelector(':scope > [data-mag-lens]')!.getBoundingClientRect()
      const h = $h.getBoundingClientRect()
      // hovered at 200,320 inside the card
      return [
        Math.abs(l.x + l.width / 2 - h.x - 200),
        Math.abs(l.y + l.height / 2 - h.y - 320),
      ]
    })
    expect(Math.max(...off)).toBeLessThanOrEqual(1)

  })

  test('every miniature specimen carries its own loupe', async ({ page }) => {
    // The loupe is a page-level primitive, not the playground's toy: the four
    // editions of station① and the two dispatches of station④ are kept small
    // on purpose, so each one gets a circle of its own.
    expect(
      await page.evaluate(() =>
        [...document.querySelectorAll('[data-lens]')].map(($h) => {
          // The circle sits in the host's nearest POSITIONED ancestor (that is
          // the box its insets resolve against), as a SIBLING of the content —
          // never a descendant, or the host would carry a second copy of
          // itself past every query and every test.
          let $frame = $h.parentElement!
          while ($frame && getComputedStyle($frame).position === 'static') $frame = $frame.parentElement!
          return [
            $h.className,
            !!$frame.querySelector(':scope > [data-mag-lens]'),
            $h.querySelectorAll('[data-mag-lens]').length,
          ]
        }),
      ),
    ).toEqual([
      // ONE circle for the pair of dispatches, not one each: two would overlap
      // where the cards stack, and a loupe that crosses from the 橫排 card into
      // the 直排 one magnifies the comparison this station is making.
      ['Prose', true, 0],
      ['Paper', true, 0],
    ])
  })

  test('the loupe magnifies THIS page: the copy fragments identically', async ({ page }) => {
    // A loupe that lays its copy out differently isn't magnifying the page,
    // it's showing a second one. Every rule that shapes the galley therefore
    // has to reach the copy — which is why the face is keyed on classes and
    // the card's flex layout is shared: keyed on `data-pg-*` (stripped from
    // the copy) the galley fell back to an auto height and a wider prose
    // indent, and the columns broke elsewhere.
    const diffs = await page.evaluate(() => {
      const sig = (root: Element, scale: number) => {
        const g = root.getBoundingClientRect()
        return [...root.querySelectorAll('h1, h2, p, blockquote')].map((el) => {
          const r = el.getBoundingClientRect()
          return `${el.textContent!.slice(0, 3)}|${Math.round((r.x - g.x) / scale)},${Math.round((r.y - g.y) / scale)}`
        })
      }
      const $src = document.querySelector(
        '#station-playground .Sheet > [data-pg-paper]:not([data-lens-clone]) [data-pg-preview]',
      )!
      const $copy = document.querySelector('#station-playground [data-lens-clone] .Galley')!
      const zoom = Number.parseFloat(
        getComputedStyle(document.querySelector('#station-playground [data-mag-lens]')!)
          .getPropertyValue('--lens-zoom'),
      )
      const a = sig($src, 1)
      const b = sig($copy, zoom)
      return { n: a.length, diffs: a.map((v, i) => [v, b[i]]).filter(([x, y]) => x !== y) }
    })
    expect(diffs.n).toBeGreaterThan(10)
    expect(diffs.diffs).toEqual([])
  })

  test('a re-render re-installs the JS fallbacks, so *.with-js.css has wrappers to select', async ({ page }) => {
    // `innerHTML` replaces the whole preview subtree, and han.js's wrappers
    // live IN it — without a second pass over the new nodes, `<h-char>` /
    // `<h-iss>` are simply gone and every `han.*.with-js.css` rule matches
    // nothing. Fallbacks are on by default (codegen DEFAULTS.fallbacks), so
    // typing must leave wrappers behind (playground.js § scheduleRender).
    await setSource(page, '這一行有「引號」，還有句讀。')
    await expect
      .poll(() => $preview(page).locator('h-char').count())
      .toBeGreaterThan(0)
  })

  test('console interplay: a console control writes --han-* on :root; the preview inherits it', async ({ page }) => {
    const main = page.locator('main')

    // The preview must be a descendant of main (so it inherits config).
    expect(await main.locator(
      '.Sheet > [data-pg-paper]:not([data-lens-clone]) [data-pg-preview]',
    ).count()).toBe(1)

    await openGroupOf(page, 'squeeze')
    await page.locator('[data-cfg-key="squeeze"]').uncheck()

    await expect
      .poll(() => page.evaluate(() =>
        document.documentElement.style.getPropertyValue('--han-punctuation-refinement')))
      .toBe('hang')

    // Inherited all the way down to the preview article (computed value).
    await expect
      .poll(() =>
        $preview(page).evaluate((el) =>
          getComputedStyle(el).getPropertyValue('--han-punctuation-refinement').trim()),
      )
      .toBe('hang')
  })
})
