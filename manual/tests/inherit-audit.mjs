/**
 * Which inherited declarations are actually doing something?
 *
 * Step 5 of docs/plans/home-css-station-ownership.md: the homepage re-states
 * `color` / `font-family` / `font-size` … on element after element where the
 * value is already inherited. Guessing which ones are redundant by reading is
 * how you break a page; this asks the browser instead.
 *
 * For every declaration of an inherited property in the built home.css:
 *   1. find the elements the rule actually matches,
 *   2. record their computed value,
 *   3. delete the declaration, force layout, read again,
 *   4. if nothing moved, the declaration is a candidate for deletion,
 *   5. put it back.
 *
 * A candidate is NOT automatically deletable. It is a SHORTLIST — always gate
 * the deletions on `computed-baseline.mjs`:
 *
 *   • It reports false positives. Measured one in 82 (`.ConsoleToggle`'s
 *     `color` in home/console.css): removing it via CSSOM read back unchanged,
 *     but removing it from the source moved the computed colour on every
 *     variant. Treat "redundant" as "worth checking", never as proof.
 *   • It only sees the homepage. `common/*` also serves the docs page and
 *     `home/controls.css` is adopted into <han-console>'s shadow, where the
 *     ancestor chain — and therefore what is inherited — is different.
 *   • And the plan's own keep-cases still apply (a declaration that exists to
 *     guard against a variable override, or to say "back to the default" among
 *     siblings that each set their own).
 *
 *   node manual/tests/inherit-audit.mjs [--viewport 1280x900] [--dark] [--vertical]
 */

import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..')
const PORT = 5277

const INHERITED = [
  'color',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'letter-spacing',
  'line-height',
  'text-align',
  'text-indent',
  'text-transform',
  'white-space',
  'word-break',
  'visibility',
  'cursor',
]

const audit = (props) => {
  const out = []
  const sheets = [...document.styleSheets].filter((s) => {
    try {
      // the built bundle is content-hashed: assets/home.<hash>.css
      return s.cssRules && /\/home\.[^/]*css$/.test(s.href ?? '')
    } catch {
      return false
    }
  })

  /* Nested rules come back with a relative selectorText (`& p`, `p`, `&:hover`).
     Rebuild the absolute one so querySelectorAll can use it: `&` → :is(parent),
     and a bare relative selector is a descendant of the parent. */
  const absolute = (sel, parent) => {
    if (!parent) return sel
    const p = `:is(${parent})`
    return sel.includes('&') ? sel.replaceAll('&', p) : `${p} ${sel}`
  }

  const walk = (rules, parentSel) => {
    for (const rule of rules) {
      // CSSMediaRule / CSSSupportsRule / CSSContainerRule: only descend when the
      // condition currently holds, otherwise the rule isn't in play anyway.
      if (rule.media) {
        if (!matchMedia(rule.conditionText).matches) continue
        walk(rule.cssRules, parentSel)
        continue
      }
      if (rule.cssRules && !rule.selectorText) {
        walk(rule.cssRules, parentSel)
        continue
      }
      if (!rule.selectorText) continue

      const sel = absolute(rule.selectorText, parentSel)
      let $els = []
      try {
        $els = [...document.querySelectorAll(sel)]
      } catch {
        continue // :where(::pseudo) and friends — not queryable, skip
      }

      if ($els.length) {
        for (const prop of props) {
          const value = rule.style.getPropertyValue(prop)
          if (!value) continue
          const priority = rule.style.getPropertyPriority(prop)
          const before = $els.map(($e) => getComputedStyle($e).getPropertyValue(prop))
          rule.style.removeProperty(prop)
          void document.body.offsetHeight
          const after = $els.map(($e) => getComputedStyle($e).getPropertyValue(prop))
          rule.style.setProperty(prop, value, priority)
          if (before.every((v, i) => v === after[i]))
            out.push({ selector: sel, prop, value, matched: $els.length })
        }
      } else {
        out.push({ selector: sel, prop: null, value: null, matched: 0 })
      }

      if (rule.cssRules?.length) walk(rule.cssRules, sel)
    }
  }

  for (const sheet of sheets) walk(sheet.cssRules, null)
  return out
}

// ── driver ───────────────────────────────────────────────────────────────

const bundle = path.join(ROOT, 'manual', 'dist', 'home.css')
if (readFileSync(bundle, 'utf8').includes('@import')) {
  console.error(`${bundle} still has @import — build first, and read the log.`)
  process.exit(2)
}

const args = process.argv.slice(2)
const vpAt = args.indexOf('--viewport')
const [w, h] = (vpAt === -1 ? '1280x900' : args[vpAt + 1]).split('x').map(Number)
const server = spawn('node', ['build/serve.js'], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore',
})
await new Promise((r) => setTimeout(r, 1500))

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: w, height: h } })
await context.addInitScript(
  `try { localStorage.setItem('theme', '${args.includes('--dark') ? 'dark' : 'light'}') } catch (e) {}`,
)
const page = await context.newPage()
await page.goto(`http://localhost:${PORT}`)
await page.waitForFunction(() => document.documentElement.dataset.fontsGate === 'ready')
await page.waitForFunction(() => 'pgReady' in document.documentElement.dataset)
if (args.includes('--vertical'))
  await page.evaluate(() => {
    document.querySelector('main').dataset.writing = 'vertical'
  })
await page.evaluate(async () => {
  for (const $t of document.querySelectorAll('.Manifesto, [data-station]')) {
    $t.scrollIntoView({ block: 'center', inline: 'center' })
    await new Promise((r) => setTimeout(r, 60))
  }
  scrollTo(0, 0)
  await new Promise((r) => setTimeout(r, 500))
})
await page.evaluate(() => document.fonts.ready)

const found = await page.evaluate(audit, INHERITED)
await browser.close()
server.kill()

const dead = found.filter((f) => f.matched === 0)
const redundant = found.filter((f) => f.matched > 0)
console.log(JSON.stringify({ redundant, dead }, null, 1))
console.error(`redundant declarations: ${redundant.length}   rules matching nothing: ${dead.length}`)
