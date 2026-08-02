/**
 * ledger.js — station 伍's two ledgers ⇄ the console's switches.
 *
 * The layer map and the script ledger are not decoration: they price the
 * build the reader is actually configuring in the left column. So every row
 * names the console key that ships it (`data-cfg`), unchecked rows go grey,
 * and the totals are re-summed from what is left.
 *
 * The console owns the state. This module never writes config and never
 * presses a control — it only listens to `han-config-change` (composed, so it
 * bubbles out of the shadow root, the same route punct-lang.js takes) and
 * reflects. The component broadcasts its config on connect, which is what
 * seeds the first pass from a restored localStorage config.
 *
 * THE FIGURES ARE THE DOM'S. Nothing here knows how big han-prose is; it
 * reads the printed 'N.Nk' back out of the cells vite baked, so the sum can
 * never disagree with the column above it. The one exception is the cards'
 * gzip figure, which the card does not print but the footing needs — that
 * rides a `data-gzip` attribute on the same <li>. Summing the ROUNDED
 * figures (rather than bytes) is deliberate too: it makes the total equal
 * what a reader gets adding the visible column by hand.
 *
 * Pure core (`parseK` / `sumOf` / `fmtK`), imperative shell (`initLedger`);
 * no classes, no state of its own.
 */

/**
 * '壓縮前4.0KB' | '10.1KB' → 4 | 10.1 (NaN when there is no figure to read).
 *
 * Capital `KB` throughout — `kb` is kilobits, and an ambiguous unit on a
 * typography framework's own page is the one typo nobody would forgive.
 */
const parseK = (text) => Number(text?.trim().match(/(\d+(?:\.\d+)?)KB$/)?.[1])

const fmtK = (kb) => `${kb.toFixed(1)}KB`

const sumOf = (values) => values.filter(Number.isFinite).reduce((sum, kb) => sum + kb, 0)

/**
 * A row's three figures, in the order the ledger prints them. The layer-map
 * cards print two and carry the third; the script rows print all three as
 * <td>s, so both shapes resolve through the same function and the totals
 * cannot end up measuring different things.
 */
const figuresOf = ($row) => {
  const $cells = $row.querySelectorAll('td')
  if ($cells.length) {
    const [raw, brotli, gzip] = [...$cells].map(($td) => parseK($td.textContent))
    return { raw, brotli, gzip }
  }
  return {
    raw: parseK($row.querySelector('small')?.textContent),
    brotli: parseK($row.querySelector('b')?.textContent),
    gzip: parseK($row.dataset.gzip),
  }
}

/** Rows whose console switch is still checked. `config` absent → all of them. */
const keptOf = ($rows, config) =>
  $rows.filter(($row) => config?.[$row.dataset.cfg] !== false)

export const initLedger = ($root = document) => {
  const $cards = [...$root.querySelectorAll('.LayerMap li[data-cfg]')]
  const $scripts = [...$root.querySelectorAll('.ScriptLedger tbody tr[data-cfg]')]
  if (!$cards.length && !$scripts.length) return

  const $totals = new Map(
    [...$root.querySelectorAll('[data-total]')].map(($el) => [$el.dataset.total, $el]),
  )
  const write = (name, kb) => {
    const $el = $totals.get(name)
    if ($el) $el.textContent = fmtK(kb)
  }

  const apply = (config) => {
    // grey out what the reader unchecked — both ledgers, one rule
    for (const $row of [...$cards, ...$scripts]) {
      $row.toggleAttribute('data-off', config?.[$row.dataset.cfg] === false)
    }

    // …then re-price what is left. Only the default-condition bundles carry
    // `data-in-total`: the two `browser` rows are the SAME code packaged for
    // a different `exports` condition, so counting them would bill the reader
    // twice for one script.
    const css = keptOf($cards, config).map(figuresOf)
    const js = keptOf($scripts.filter(($r) => 'inTotal' in $r.dataset), config).map(figuresOf)

    for (const [suffix, key] of [['', 'brotli'], ['-gzip', 'gzip'], ['-raw', 'raw']]) {
      const cssTotal = sumOf(css.map((f) => f[key]))
      const jsTotal = sumOf(js.map((f) => f[key]))
      write(`css${suffix}`, cssTotal)
      write(`js${suffix}`, jsTotal)
      write(`all${suffix}`, cssTotal + jsTotal)
    }
  }

  document.addEventListener('han-config-change', (e) => {
    if (e.detail?.config) apply(e.detail.config)
  })
}
