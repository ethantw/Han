/**
 * Two-way-bind a page-side checkbox to a `<han-console>` module switch.
 *
 * The root attributes this file used to write (`data-han-module-*`) now come
 * from `components/console-config.js` § applyModules — the console's own apply
 * layer owns them, so they land on every page that mounts the component, not
 * just this one, and stay in step with the flags it writes alongside them.
 * What is left here is the proxy: the station's checkbox is not a second
 * switch, it drives the real one.
 *
 * Why an attribute exists at all: a stylesheet's `disabled` state is invisible
 * to selectors — nothing in CSS can ask «is han.semantics.css
 * participating?» — and the module's own `--han-semantics` flag is no help
 * either, because the `@property` that registers it lives inside the very
 * sheet that would have left. That gap had already produced a real fault:
 * station ① reserves the space its marks occupy so the band doesn't reflow
 * when they come and go (home/station-semantics.css § the poem's marks fade
 * rather than vanish), and those declarations are page-level — so with the
 * semantics module switched off the 著重號 kept being painted, at full ink,
 * by the page, after the library had stopped offering it. The page was
 * drawing a mark han.css was no longer making.
 */

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
    // Pull the proxies into line. Includes the console's very first
    // broadcast on connect, which is what seeds them from a restored
    // localStorage config rather than from their markup default.
    if (config) {
      proxies().forEach(($box) => {
        const state = config[$box.dataset.hanModuleProxy]
        if (typeof state === 'boolean') $box.checked = state
      })
    }
  })

  // …and push the other way immediately. The old implementation deliberately
  // waited for station①'s 520ms animation before pressing the real control,
  // because every switch used to synchronously rebuild the whole fallback
  // tree. The config core now applies cascade state first and schedules only
  // a genuinely necessary fallback rebuild after paint, so that timeout is
  // both obsolete and user-visible input lag.
  proxies().forEach(($box) => {
    const press = () => {
      const $control = consoleControl($box.dataset.hanModuleProxy)
      if (!$control) return
      $control.checked = $box.checked
      $control.dispatchEvent(new Event('input', { bubbles: true }))
    }

    $box.addEventListener('change', () => {
      press()
    })
  })
}
