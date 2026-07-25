/**
 * punct-lang.js — station②'s per-language punctuation demo ⇄ the rail.
 *
 * The demo's four <select>s (one per language cell) are a remote for the
 * rail's matching per-language punctuation controls. The rail config is the
 * SINGLE source of truth: a demo change is routed INTO the rail (drive its own
 * shadow control + fire `input`, so the rail updates config, applies
 * `--han-punctuation-*` to <main>, and broadcasts), and every `han-config-change`
 * flows back OUT to refresh the selects. The samples carry no local override —
 * they inherit the global variable the rail sets on <main>.
 *
 * Pure lookup (KEY) + imperative shell (`initPunctLang`); no classes, no state
 * of its own — the rail owns the state, this only mirrors it both ways.
 */

// demo cell lang → rail config key (config.punct.* / [data-cfg-key="punct.*"])
const KEY = { 'zh-Hant': 'hant', 'zh-Hans': 'hans', ja: 'ja', 'ko-Hant': 'ko' }

export const initPunctLang = ($root = document) => {
  const $cells = [...$root.querySelectorAll('.PunctLang li[lang]')]
  if (!$cells.length) return
  const $rail = document.querySelector('han-rail')

  const selects = $cells
    .map(($li) => ({ key: KEY[$li.getAttribute('lang')], $sel: $li.querySelector('select') }))
    .filter((c) => c.key && c.$sel)

  // demo → rail: drive the rail's own control so its config stays authoritative
  const push = (key, value) => {
    const $ctrl = $rail?.shadowRoot?.querySelector(`[data-cfg-key="punct.${key}"]`)
    if (!$ctrl || $ctrl.value === value) return
    $ctrl.value = value
    $ctrl.dispatchEvent(new Event('input', { bubbles: true }))
  }
  // rail → demo: reflect the broadcast config back onto the selects
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

  // seed if the rail is already up (it upgrades post-gate; otherwise its init
  // broadcast lands on the listener above and syncs then)
  pull($rail?.config?.punct)
}
