/**
 * Mirror `<han-console>`'s module switches onto `<html>` so the page's own CSS
 * can react to them.
 *
 * The console expresses «module off» by disabling its `<link
 * data-han-module>` — the honest mechanism, since that IS what not importing
 * the file looks like. But a stylesheet's `disabled` state is invisible to
 * selectors: nothing in CSS can ask «is han.semantics.css participating?».
 * And the module's own `--han-semantics` flag is no help either, because the
 * `@property` that registers it lives inside the very sheet that just left.
 *
 * That gap had already produced a real fault. Station ① reserves the space
 * its marks occupy so the band doesn't reflow when they come and go
 * (home/station-semantics.css § the poem's marks fade rather than vanish),
 * and those declarations are page-level — so with the semantics module
 * switched off the 著重號 kept being painted, at full ink, by the page,
 * after the library had stopped offering it. The page was drawing a mark
 * han.css was no longer making.
 *
 * So: one attribute per module on the root, absent when on. Page CSS that
 * needs to follow a module now has something to select on, and there is one
 * source of truth instead of a control per station quietly contradicting the
 * console.
 */

const MODULES = ['semantics', 'lines', 'prose', 'fonts']

/** Page-side checkboxes that stand in for a console module switch. */
const proxies = () => [...document.querySelectorAll('input[data-han-module-proxy]')]

/**
 * The console's control, reached through its open shadow root. There is no
 * public setter for a single config key — `<han-console>` exposes `reset()`,
 * `reapplyFallbacks()` and a read-only `config` — so a proxy drives the real
 * control and lets the component's own `input` listener do the rest. That way
 * the console stays the single owner of config, persistence and the
 * broadcast; the proxy never computes anything, it only presses the button.
 */
const consoleControl = (name) =>
  document.querySelector('han-console')?.shadowRoot
    ?.querySelector(`[data-cfg-key="${name}"]`) ?? null

const reflect = (config) => {
  if (!config) return
  MODULES.forEach((name) => {
    const key = `hanModule${name[0].toUpperCase()}${name.slice(1)}`
    if (config[name] === false) document.documentElement.dataset[key] = 'off'
    else delete document.documentElement.dataset[key]
  })
}

/**
 * Subscribed on `document` because the console's event is `composed` and
 * bubbles out of the shadow root — the same route `punct-lang.js` and
 * `snippet.js` take. The console dispatches its initial config on connect, so
 * there is no need to read the control's state here: the first broadcast
 * seeds it.
 */
export const initModuleState = () => {
  document.addEventListener('han-config-change', (e) => {
    const config = e.detail?.config
    reflect(config)
    // …and pull the proxies into line. Includes the console's very first
    // broadcast on connect, which is what seeds them from a restored
    // localStorage config rather than from their markup default.
    if (config) {
      proxies().forEach(($box) => {
        const state = config[$box.dataset.hanModuleProxy]
        if (typeof state === 'boolean') $box.checked = state
      })
    }
  })

  // …and push the other way, but NOT in the same frame as the local
  // animation.
  //
  // Flipping a module means enabling or disabling a whole stylesheet, and
  // that is expensive: measured on this page, one toggle blocks the main
  // thread for 404–530ms (`longtask` observer; an attribute-only flip for
  // comparison costs 81). Fired on `change`, that landed squarely on top of
  // the diagram's 520ms correction and ate most of its frames.
  //
  // So the cheap half goes first and the expensive half waits: set the root
  // attribute immediately — that is all the diagram reads, and it costs one
  // small restyle — let the animation play out, and only then press the
  // console's button. The hitch still happens; it just no longer happens
  // during motion, where it is the only place anyone can see it.
  //
  // Only when switching OFF. Coming back on there is nothing local to
  // protect: removing the attribute hands `--settle` straight back to the
  // entrance animation's filled 1, with no run of its own to interrupt.
  proxies().forEach(($box) => {
    let pending = null

    const press = () => {
      const $control = consoleControl($box.dataset.hanModuleProxy)
      if (!$control) return
      $control.checked = $box.checked
      $control.dispatchEvent(new Event('input', { bubbles: true }))
    }

    $box.addEventListener('change', () => {
      clearTimeout(pending)
      const key = `hanModule${$box.dataset.hanModuleProxy[0].toUpperCase()}${$box.dataset.hanModuleProxy.slice(1)}`

      if ($box.checked) {
        delete document.documentElement.dataset[key]
        press()
        return
      }

      document.documentElement.dataset[key] = 'off'
      // read the wait off the CSS rather than repeat it here — the animation
      // that has to finish is the one the attribute just started
      const $bar = document.querySelector('.MarkDiagram [data-mark]')
      const secs = $bar ? parseFloat(getComputedStyle($bar).animationDuration) : 0
      pending = setTimeout(press, Number.isFinite(secs) ? secs * 1000 : 0)
    })
  })
}
