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
 * (`[data-pg]`, `.Specimen`) — dropped from the boot list. Their
 * modules stay on disk untouched; `/old.html` still needs them via its
 * own frozen `/old-assets/home.js` copy, and HP-4 owns deleting the
 * live copies once nothing references them.
 */

import { initLangSwitcher } from '/home/hero.js'
import { initConfigurator } from '/home/configurator.js'
import { initMetrics } from '/home/rail-metrics.js'
import { initRailChooser } from '/home/rail-chooser.js'

document.addEventListener('DOMContentLoaded', () => {
  initLangSwitcher()
  initConfigurator()
  initMetrics(document.querySelector('main.han'))
  initRailChooser()
})
