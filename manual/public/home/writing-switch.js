/**
 * 橫排/直排 preview switch — floating bottom-right pill
 * (`[data-writing-switch]`, markup in `_home.html`).
 *
 * Writing mode is PREVIEW state, not a han.css variable — that's why it
 * lives outside the `<han-rail>` configurator (owner call): the rail
 * configures the framework, this flips how you look at the page. Sets
 * `main.han`'s `data-writing`; the vertical layout is pure CSS
 * (stations.css `main.han[data-writing="vertical"]`). Not persisted —
 * a fresh load reads horizontal, like any preview.
 */
export const initWritingSwitch = () => {
  const $main = document.querySelector('main.han')
  const $switch = document.querySelector('[data-writing-switch]')
  if (!$main || !$switch) return

  const apply = () => {
    const $checked = $switch.querySelector('input:checked')
    if ($checked) $main.dataset.writing = $checked.value
  }
  $switch.addEventListener('input', apply)
  apply()
}
