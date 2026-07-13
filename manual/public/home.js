/**
 * Homepage entry — boots the whole-page interaction modules.
 *
 * HP-3: the page itself is the playground. `initConfigurator` wires the
 * rail's controls to `main.han` and station④'s output pane;
 * `initMetrics` ports the old playground's slider logic onto the same
 * `<main>`; `initRailChooser` drives the (temporary, owner-facing)
 * side/top layout picker. `initLangSwitcher` is unrelated chrome (top
 * nav) and stays.
 *
 * `initPlayground` / `initFeatureToggles` / `initMagnifier` /
 * `initSpecHint` targeted DOM that no longer exists on this page
 * (`[data-pg]`, `.Specimen`) — dropped from the boot list along with
 * their now-deleted live modules (`hero.js`, `playground.js`,
 * `playground-md.js`); `/old.html` still needs them via its own
 * frozen `/old-assets/` copies. `initLangSwitcher` moved out of
 * `hero.js` into its own `lang-switcher.js` (HP-4) since it was the
 * only export this page still used.
 */

import { initLangSwitcher } from '/home/lang-switcher.js'
import { initConfigurator } from '/home/configurator.js'
import { initMetrics } from '/home/rail-metrics.js'
import { initRailChooser } from '/home/rail-chooser.js'

document.addEventListener('DOMContentLoaded', () => {
  initLangSwitcher()
  initConfigurator()
  initMetrics(document.querySelector('main.han'))
  initRailChooser()
})
