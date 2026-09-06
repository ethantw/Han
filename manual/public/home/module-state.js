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

/* Station ③ has room to hang its line-control beside the specimen only while
 * its 24em card, the 3rem gap, and the aside's 300px readable minimum fit on
 * one line. When they do not, keep the *same* control with the explanation it
 * changes: immediately after the station's squeeze/hang lede, rather than
 * marooned beneath the full card. Moving the node preserves its console
 * binding and current checked state. */
const initLinesControlPlacement = () => {
  const $station = document.querySelector('#station-lines')
  const $aside = $station?.querySelector(':scope > aside.Breath')
  const $toggle = $aside?.querySelector(':scope > .Toggle.for-lines')
  const $lede = $station?.querySelector(':scope > p')
  if (!$station || !$aside || !$toggle || !$lede) return

  const compactAt = () => 51.75 * parseFloat(getComputedStyle(document.documentElement).fontSize)
  let queued = false
  const place = () => {
    queued = false
    if ($station.clientWidth < compactAt()) {
      $lede.after($toggle)
      $aside.dataset.controlRelocated = ''
    } else {
      $aside.prepend($toggle)
      delete $aside.dataset.controlRelocated
    }
  }
  const schedule = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(place)
  }
  new ResizeObserver(schedule).observe($station)
  schedule()
}

/* Station ①'s semantics switch belongs to the figure caption on a wide
 * plate, where it explains the specimen. On a compact plate the figure's
 * diagram and vertical poem make that caption too far away from the control;
 * keep the same node (and therefore its console binding) between the lede and
 * the poem instead. */
const initSemanticsControlPlacement = () => {
  const $station = document.querySelector('#station-semantics')
  const $figure = $station?.querySelector(':scope > figure.semantic-elements')
  const $caption = $figure?.querySelector(':scope > figcaption')
  const $toggle = $caption?.querySelector(':scope > .Toggle.for-semantics')
  const $lede = $station?.querySelector(':scope > p')
  if (!$station || !$figure || !$caption || !$toggle || !$lede) return

  const compactAt = () => 52 * parseFloat(getComputedStyle(document.documentElement).fontSize)
  let queued = false
  const place = () => {
    queued = false
    if ($station.clientWidth < compactAt()) {
      $lede.after($toggle)
      $station.dataset.semanticsControlRelocated = ''
    } else {
      $caption.append($toggle)
      delete $station.dataset.semanticsControlRelocated
    }
  }
  const schedule = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(place)
  }
  new ResizeObserver(schedule).observe($station)
  schedule()
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

  initLinesControlPlacement()
  initSemanticsControlPlacement()
}
