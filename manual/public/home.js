/**
 * Homepage entry — boots per-section interaction modules.
 * Per-section logic lives in `public/home/<section>.js` so that
 * each section's HTML / CSS / JS can be edited as a unit without
 * forcing every change through this file.
 */

import { initLangSwitcher, initFeatureToggles, initMagnifier, initSpecHint } from '/home/hero.js'
import { initPlayground } from '/home/playground.js'

document.addEventListener('DOMContentLoaded', () => {
  initLangSwitcher()
  initFeatureToggles()
  initMagnifier()
  initSpecHint()
  initPlayground()
})
