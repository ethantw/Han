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

const $preview = (page: Page) => page.locator('#station-playground [data-pg-preview]')
const $src = (page: Page) => page.locator('#station-playground [data-pg-src]')
const $tabs = (page: Page) => page.locator('#station-playground [data-pg-editor-views]')

/** Tab clicks are only a thing in the NARROW panel. From 48rem of panel width
 *  the editor is two-pane (playground.css § 夠寬就不必分頁): both source and
 *  preview are on screen at once and the whole tab strip is `display: none`,
 *  so clicking it would just hang. The default e2e viewport (1280) IS
 *  two-pane — measured: 936px of panel — hence the guard rather than a
 *  narrow-only assumption. */
const showTab = async (page: Page, value: 'code' | 'preview') => {
  if (!(await $tabs(page).isVisible())) return
  await $tabs(page).locator(`label:has(input[value="${value}"])`).click()
}
const showCode = (page: Page) => showTab(page, 'code')
const showPreview = (page: Page) => showTab(page, 'preview')

/** Type source into the (hidden-under-Preview) textarea: reveal Code, fill,
 *  back to Preview so assertions see the rendered result. */
const setSource = async (page: Page, src: string) => {
  await showCode(page)
  await $src(page).fill(src)
  await showPreview(page)
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

    // …and it exercises the elements han.semantics.css actually styles, which
    // is the whole point of shipping a real article rather than a snippet.
    for (const sel of ['u', 'q', 'dfn', 'i[lang]', 'ruby.zhuyin > rt', 'blockquote'])
      expect(await $preview(page).locator(sel).count()).toBeGreaterThan(0)

    // The dateline is card CHROME above the editable article (so it can't
    // be pickled into a localStorage draft), rewritten on boot to «today +
    // 100 years» — the same instant station①'s newspaper datelines carry
    // (home/papers-dateline.js owns the date; the playground borrows it).
    const plus100 = new Date().getFullYear() + 100
    const $time = page.locator('#station-playground [data-pg-dateline]')
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

  test('the galley is a page: short copy stays in column one, long copy runs off the right edge', async ({ page }) => {
    // Definite height + `column-fill: auto`: columns fill downward, then
    // continue rightward. A short draft must NOT be balanced across columns
    // (that reads as if the text were rationed), and a page that outgrows
    // its track bleeds to the window edge with its last column cut in half
    // — the signal that there is more to the right.
    const sheet = () =>
      page.evaluate(() => {
        const $card = document.querySelector('#station-playground [data-pg-paper]')!
        const $g = document.querySelector('#station-playground [data-pg-preview]')!
        const cs = getComputedStyle($card)
        const gs = getComputedStyle($g)
        const pad =
          Number.parseFloat(cs.paddingInlineStart) + Number.parseFloat(cs.paddingInlineEnd)
        const used = Number.parseFloat(gs.getPropertyValue('--pg-galley-col-used'))
        const em = Number.parseFloat(gs.fontSize)
        return {
          fill: gs.columnFill,
          colEm: (used || Number.parseFloat(gs.columnWidth)) / em,
          bled: $card.hasAttribute('data-pg-bled'),
          gap: Math.round(Number.parseFloat(gs.columnGap)),
          right: Math.round($card.getBoundingClientRect().right),
          winRight: document.documentElement.clientWidth,
          scrolls: $card.scrollWidth > $card.clientWidth + 1,
          // The card's edge must fall on a column's midpoint: whatever the
          // visible width has left over after whole columns is half of one.
          tail: Math.round(($card.clientWidth - pad) % (used + Number.parseFloat(gs.columnGap))),
          half: Math.round(used / 2),
          // scrolled to the end, the sheet keeps its margin: the last column
          // stops short of the card's edge (overflow columns would spill
          // straight through the padding — hence the covering box)
          endGap: (() => {
            const before = $card.scrollLeft
            $card.scrollLeft = $card.scrollWidth
            const gap = Math.round(
              $card.getBoundingClientRect().right - $g.getBoundingClientRect().right,
            )
            $card.scrollLeft = before
            return gap
          })(),
          padEnd: Math.round(Number.parseFloat(cs.paddingInlineEnd)),
        }
      })

    const tab = (label: string) =>
      page.locator('#station-playground [data-pg-content-tabs] label').filter({ hasText: label }).click()
    await tab('自訂內容')
    const short = await sheet()
    expect(short.fill).toBe('auto')
    expect(short.bled, 'a sheet that fits stays in its track').toBe(false)
    expect(short.scrolls).toBe(false)

    await setSource(page, '# 長\n\n' + '把校樣撐出好幾欄來看看橫向捲動。'.repeat(300))
    await expect.poll(async () => (await sheet()).bled).toBe(true)

    const long = await sheet()
    expect(long.scrolls).toBe(true)
    // the design measure is a FLOOR — the solve may widen, never narrow
    expect(long.colEm).toBeGreaterThanOrEqual(14)
    // right edge on the window's edge, and the cut is half a column wide
    expect(Math.abs(long.right - long.winRight)).toBeLessThanOrEqual(2)
    expect(Math.abs(long.tail - long.half)).toBeLessThanOrEqual(2)
    expect(long.endGap).toBe(long.padEnd)
  })

  test('the loupe is on stage from the first frame, and follows the cursor', async ({ page }) => {
    // No switch: in a hover environment the loupe is simply there (owner's
    // call). It parks on the host's opening block so it never has to be
    // discovered, and from then on the reader drives it.
    const $lens = page.locator('#station-playground .Lens')
    await expect($lens).toBeVisible()

    const centre = () =>
      page.evaluate(() => {
        const c = document.querySelector('#station-playground [data-pg-paper]')!.getBoundingClientRect()
        const l = document.querySelector('#station-playground .Lens')!.getBoundingClientRect()
        return Math.round(l.y + l.height / 2 - c.y)
      })
    const parked = await centre()
    // `hover` with an explicit position, not raw mouse coordinates: the card
    // is `translate`d and taller than this viewport, so a computed page
    // coordinate can land outside it.
    await page.locator('#station-playground [data-pg-paper]').hover({ position: { x: 200, y: 320 } })
    await expect.poll(centre).not.toBe(parked)

    // …and it lands ON the cursor, not merely somewhere else. The circle is
    // `position: absolute`, so the browser resolves its insets against the
    // nearest POSITIONED ancestor: mount it on a static parent and the module
    // measures one box while the browser uses another — the loupe drifts by
    // exactly the distance between them (it moved into the editor column when
    // the module started mounting on the host's parent instead).
    expect(
      await page.evaluate(() => {
        const $h = document.querySelector('#station-playground [data-pg-paper]')!
        let $frame = $h.parentElement!
        while ($frame && getComputedStyle($frame).position === 'static') $frame = $frame.parentElement!
        const l = $frame.querySelector(':scope > .Lens')!.getBoundingClientRect()
        const h = $h.getBoundingClientRect()
        // hovered at 200,320 inside the card
        return [Math.round(l.x + l.width / 2 - h.x - 200), Math.round(l.y + l.height / 2 - h.y - 320)]
      }),
    ).toEqual([0, 0])
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
            !!$frame.querySelector(':scope > .Lens'),
            $h.querySelectorAll('.Lens').length,
          ]
        }),
      ),
    ).toEqual([
      ['Papers', true, 0],
      ['Dispatch', true, 0],
      ['Dispatch vertical', true, 0],
      ['PgPaper', true, 0],
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
      const $src = document.querySelector('#station-playground [data-pg-preview]')!
      const $copy = document.querySelector('#station-playground .is-lens-clone .PgGalley')!
      const zoom = Number.parseFloat(
        getComputedStyle(document.querySelector('#station-playground .Lens')!)
          .getPropertyValue('--lens-zoom'),
      )
      const a = sig($src, 1)
      const b = sig($copy, zoom)
      return { n: a.length, diffs: a.map((v, i) => [v, b[i]]).filter(([x, y]) => x !== y) }
    })
    expect(diffs.n).toBeGreaterThan(10)
    expect(diffs.diffs).toEqual([])
  })

  test('the content tabs follow the panes into 認真模式', async ({ page }) => {
    // One fieldset, moved — not a second copy kept in sync.
    await page.locator('#station-playground label.PgFocus').click()
    await expect(page.locator('[data-pg-studio-head] [data-pg-content-tabs]')).toBeVisible()

    await page.locator('[data-pg-studio] [data-pg-content-tabs] label')
      .filter({ hasText: '自訂內容' }).click()
    await expect($src(page)).toHaveValue(/在這裡寫你自己的字/)

    await page.locator('[data-pg-studio-close]').click()
    await expect(page.locator('.PgControls > [data-pg-content-tabs]')).toBeVisible()
  })

  test('認真模式 lays the borrowed sheet out its own way, and Esc respects the caret', async ({ page }) => {
    await page.locator('#station-playground label.PgFocus').click()
    const $studio = page.locator('[data-pg-studio]')
    await expect($studio).toBeVisible()

    // The sheet arrives dressed for the page (lifted, bled to the window's
    // edge, column box pinned). In here none of that applies.
    expect(
      await page.evaluate(() => {
        const $card = document.querySelector('[data-pg-studio] [data-pg-paper]')!
        const cs = getComputedStyle($card)
        return {
          lifted: cs.translate !== 'none',
          pastWindow: $card.getBoundingClientRect().right > document.documentElement.clientWidth,
          pageScrollsX:
            document.documentElement.scrollWidth > document.documentElement.clientWidth,
          closeReachable:
            document.querySelector('[data-pg-studio-close]')!.getBoundingClientRect().right <=
            document.documentElement.clientWidth,
        }
      }),
    ).toEqual({ lifted: false, pastWindow: false, pageScrollsX: false, closeReachable: true })

    // …but it is still a page: columns fill downward, then rightward, and the
    // card pans. (Reading size, so the article needs many more columns here.)
    expect(
      await page.evaluate(() => {
        const $card = document.querySelector('[data-pg-studio] [data-pg-paper]')!
        const $g = document.querySelector('[data-pg-studio] [data-pg-preview]')!
        $card.scrollLeft = 200
        return {
          fill: getComputedStyle($g).columnFill,
          pans: $card.scrollWidth > $card.clientWidth + 1,
          scrolled: $card.scrollLeft > 0,
        }
      }),
    ).toEqual({ fill: 'auto', pans: true, scrolled: true })

    // Esc is an editing reflex while the caret is in the editor…
    await page.locator('[data-pg-src]').focus()
    await page.keyboard.press('Escape')
    await expect($studio).toBeVisible()

    // …and the usual dialog contract everywhere else.
    await page.locator('[data-pg-studio] [data-pg-preview]').click()
    await page.keyboard.press('Escape')
    await expect($studio).toBeHidden()
    // whichever way out, the panes come home and the switch follows
    await expect(page.locator('[data-playground] > [data-pg-sheet]')).toBeVisible()
    await expect(page.locator('#pg-focus')).not.toBeChecked()
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
    expect(await main.locator('[data-pg-preview]').count()).toBe(1)

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
