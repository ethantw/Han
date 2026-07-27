/**
 * punct-lang.js — station②'s per-language punctuation demo ⇄ the console.
 *
 * The demo's four <select>s (one per language cell) are a remote for the
 * console's matching per-language punctuation controls. The console config is the
 * SINGLE source of truth: a demo change is routed INTO the console (drive its own
 * shadow control + fire `input`, so the console updates config, applies
 * `--han-punctuation-*` to <main>, and broadcasts), and every `han-config-change`
 * flows back OUT to refresh the selects. The samples carry no local override —
 * they inherit the global variable the console sets on <main>.
 *
 * Pure lookup (KEY) + imperative shell (`initPunctLang`); no classes, no state
 * of its own — the console owns the state, this only mirrors it both ways.
 */

// demo cell lang → console config key (config.punct.* / [data-cfg-key="punct.*"])
const KEY = { 'zh-Hant': 'hant', 'zh-Hans': 'hans', ja: 'ja', 'ko-Hant': 'ko' }

export const initPunctLang = ($root = document) => {
  const $cells = [...$root.querySelectorAll('.PunctLang li[lang]')]
  if (!$cells.length) return
  const $console = document.querySelector('han-console')

  const selects = $cells
    .map(($li) => ({ key: KEY[$li.getAttribute('lang')], $sel: $li.querySelector('select') }))
    .filter((c) => c.key && c.$sel)

  // demo → console: drive the console's own control so its config stays authoritative
  const push = (key, value) => {
    const $ctrl = $console?.shadowRoot?.querySelector(`[data-cfg-key="punct.${key}"]`)
    if (!$ctrl || $ctrl.value === value) return
    $ctrl.value = value
    $ctrl.dispatchEvent(new Event('input', { bubbles: true }))
  }
  // console → demo: reflect the broadcast config back onto the selects
  const pull = (punct) => {
    if (!punct) return
    for (const { key, $sel } of selects) {
      const v = punct[key]
      if (v != null && $sel.value !== v) $sel.value = v
    }
  }

  selects.forEach(({ key, $sel }) =>
    $sel.addEventListener('change', () => push(key, $sel.value)))
  document.addEventListener('han-config-change', (e) => pull(e.detail?.config?.punct))

  // seed if the console is already up (it upgrades post-gate; otherwise its init
  // broadcast lands on the listener above and syncs then)
  pull($console?.config?.punct)
}
