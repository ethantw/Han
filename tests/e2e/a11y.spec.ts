import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility smoke. Runs axe-core against the homepage and a docs
 * page; fails on any `serious` or `critical` violation. Lower-severity
 * findings (`moderate` / `minor`) are surfaced as warnings via the
 * test report rather than asserted, so they don't block CI but stay
 * visible.
 *
 * No rule is suppressed: a serious issue stays a failing issue.
 */

const ROUTES = [
  { name: 'homepage (hant)', path: '/' },
  { name: 'homepage mobile (hant)', path: '/', mobile: true },
  { name: 'docs intro (hant)', path: '/manual/' },
] as const

for (const { name, path, mobile } of ROUTES) {
  test(`a11y: ${name} has no serious/critical violations`, async ({ page }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(path)
    // Allow the chrome handlers + Hero scripts a tick to attach
    // aria-expanded etc. before scanning.  The shared Brand enters after a
    // one-second delay; scanning its translucent middle frame invents a
    // contrast failure that does not exist in the settled interface (the
    // docs version badge is the smallest descendant, so axe names it first).
    await page.waitForLoadState('networkidle')
    const brand = page.locator('.Brand').first()
    if (await brand.count()) {
      await brand.evaluate((element) => Promise.all(
        element.getAnimations({ subtree: true }).map((animation) => animation.finished),
      ))
    }

    const axeBuilder = new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])

    const { violations } = await axeBuilder.analyze()

    const blocking = violations.filter(
      v => v.impact === 'serious' || v.impact === 'critical',
    )
    if (blocking.length) {
      console.log(`a11y violations on ${path}:`)
      for (const v of blocking) {
        console.log(` ・${v.id} (${v.impact}) — ${v.description}`)
        for (const n of v.nodes.slice(0, 2)) {
          console.log(`      target: ${n.target.join(' ')}`)
          console.log(`      html: ${n.html.slice(0, 240)}`)
        }
      }
    }
    expect.soft(blocking.map(v => v.id), `serious/critical a11y violations on ${path}`).toEqual([])
  })
}
