import { test, expect, type Page } from '@playwright/test'

/**
 * How the forme answers its three pills (lead-forme.js § imperative shell).
 *
 * Face and punctuation are the SAME gesture — one motion, everything that
 * moves moving together — because changing a punctuation convention is
 * changing a font. What the punctuation swap lifts, though, is only what the
 * new convention disturbs (§ reset): a line whose spacing moved goes back
 * whole, a line that stands gives up its punctuation alone. Only the direction
 * switch sets one piece at a time; it re-engraves every glyph.
 */

const PUNCT = new Set(['：', '「', '」', '，', '！', '。', '、'])

const ready = async (page: Page) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('/')
  await page.locator('.LeadForme .Slug').first().waitFor()
  await page.locator('.LeadForme').evaluate(($f) => {
    $f.setAttribute('data-revealed', '')
    $f.dataset.settled = ''
    $f.scrollIntoView({ block: 'center' })
  })
  await page.waitForTimeout(600)
}

/**
 * One frame of the forme. A slug's settled opacity is read off its own class
 * (空鉛 quads and 行距鉛條 sit at half), so nothing here depends on matching
 * indices across the swap — the DOM is replaced midway and the pieces that
 * come out are not the ones that go back.
 */
const frame = (page: Page) =>
  page.locator('.LeadForme').evaluate(($f) =>
    [...$f.querySelectorAll('.Slug')].map((el) => {
      const settled = el.classList.contains('has-glyph') || el.classList.contains('solid') ? 1 : 0.5
      return {
        glyph: el.querySelector('text.g')?.textContent ?? '',
        settled,
        ratio: Number(getComputedStyle(el).opacity) / settled,
      }
    }))

/** watch a swap: which glyphs moved, and how tightly they moved together. */
const watch = async (page: Page, ms: number) => {
  const moved = new Set<string>()
  const held = new Set<string>()
  let spread = 0
  let quadMax = 0
  for (let t = 0; t < ms; t += 80) {
    const slugs = await frame(page)
    slugs.forEach((s) => {
      ;(s.ratio < 0.9 ? moved : held).add(s.glyph)
      quadMax = Math.max(quadMax, s.settled === 0.5 ? s.ratio * 0.5 : 0)
    })
    // spread among the pieces IN FLIGHT this frame — the stationary ones would
    // swamp it. Moving as one forme ⇒ they share an opacity at every instant.
    const flying = slugs.filter((s) => s.ratio < 0.95).map((s) => s.ratio)
    if (flying.length > 1) spread = Math.max(spread, Math.max(...flying) - Math.min(...flying))
    await page.waitForTimeout(60)
  }
  return { moved, held, spread, quadMax }
}

test('the punctuation pill offers the four DTJ conventions without off', async ({ page }) => {
  await ready(page)
  const options = page.locator('.LeadForme input[name="lf-punct"]')

  await expect(options).toHaveCount(4)
  expect(await options.evaluateAll((inputs) => inputs.map(input => input.value)))
    .toEqual(['jis', 'moe', 'gb', 'klr'])
  await expect(page.locator('.LeadForme input[name="lf-punct"][value="off"]')).toHaveCount(0)
})

test('punctuation moves as one forme, not piece by piece', async ({ page }) => {
  await ready(page)
  // KLR → MOE: no 直排 squeeze either side, so the swap is font-only — the
  // cleanest stage for the one-motion assertion.
  await page.locator('.LeadForme .Controls label', { hasText: 'MOE' }).click()
  const { spread } = await watch(page, 1400)
  await expect(page.locator('.LeadForme')).toHaveAttribute('data-punct', 'moe')
  // the old staggered re-drop held some pieces at 0 while others sat at 1
  expect(spread).toBeLessThan(0.2)
})

test('直排: the re-spaced line goes back whole, its neighbours keep their type', async ({ page }) => {
  await ready(page)
  // 直排 squeezes the hant ：「 under JIS only, so KLR (the hant home
  // default) → JIS re-lays line 1 (the pair gains its squeeze and everything
  // after it shifts) and nothing else.
  await page.locator('.LeadForme .Controls label', { hasText: 'JIS' }).click()
  const { moved } = await watch(page, 1400)

  // line 1 entire — plain type, not just the marks that were re-cut
  for (const ch of ['石', '田', '臉', '色', '鐵', '青', '我']) expect(moved).toContain(ch)
  // line 2 stands: its spacing is untouched and it holds no punctuation
  for (const ch of ['特', '地', '放', '棄', '瞬', '移', '艙']) expect(moved).not.toContain(ch)
  // …while the marks on the standing lines are still re-cut
  for (const ch of ['，', '！', '」']) expect(moved).toContain(ch)
})

test('橫排: nothing is re-spaced, so only the punctuation is lifted', async ({ page }) => {
  await ready(page)
  await page.locator('.LeadForme .Controls label', { hasText: '橫排' }).click()
  await page.waitForTimeout(5000)   // the direction switch sets one at a time
  await page.locator('.LeadForme .Controls label', { hasText: 'MOE' }).click()
  const { moved } = await watch(page, 1400)
  await expect(page.locator('.LeadForme')).toHaveAttribute('data-punct', 'moe')

  // 橫排 squeezes under EVERY convention, so the layout is identical either
  // way. A platform may paint the punctuation face without moving its box;
  // if any box moves, it must still be punctuation and never body type.
  for (const glyph of moved) expect(PUNCT.has(glyph)).toBe(true)
})

test('the language pill re-sets the sentence and brings its home convention', async ({ page }) => {
  await ready(page)
  await page.locator('.LeadForme .Controls label', { hasText: '日' }).click()
  await page.waitForTimeout(5000)   // full re-set, one piece at a time
  await expect(page.locator('.LeadForme')).toHaveAttribute('data-lang', 'ja')
  // punct follows the picked language's home convention (hant MOE → ja JIS)
  await expect(page.locator('.LeadForme')).toHaveAttribute('data-punct', 'jis')
  const glyphs = await page.locator('.LeadForme').evaluate(($f) =>
    [...$f.querySelectorAll('text.g')].map((el) => el.textContent).join(''))
  expect(glyphs).toContain('叱')
  expect(glyphs).not.toContain('臉')
  // the reader's own punct override survives until the next language pick
  await page.locator('.LeadForme .Controls label', { hasText: '繁' }).click()
  await page.waitForTimeout(5000)
  await expect(page.locator('.LeadForme')).toHaveAttribute('data-punct', 'moe')
})

test('direction is the one switch that sets one piece at a time', async ({ page }) => {
  await ready(page)
  await page.locator('.LeadForme .Controls label', { hasText: '橫排' }).click()
  const { spread } = await watch(page, 1600)
  await expect(page.locator('.LeadForme')).toHaveAttribute('data-orient', 'h')
  // landed pieces beside pieces still held up and hidden — the whole point
  expect(spread).toBeGreaterThan(0.5)
})

test('空鉛 falls at its own half opacity, with no snap on landing', async ({ page }) => {
  await ready(page)
  await page.locator('.LeadForme .Controls label', { hasText: 'GB' }).click()
  const { quadMax } = await watch(page, 1400)
  // never brighter than the settled value at ANY frame of the fall. The WAA
  // keyframes used to run to a hard-coded 1 and drop back to 0.5 only when the
  // animation was cancelled — a snap one frame after the piece landed.
  expect(quadMax).toBeLessThanOrEqual(0.51)
  // …and it really is the half-opacity value, not a piece stuck invisible
  expect(quadMax).toBeGreaterThan(0.45)
})
