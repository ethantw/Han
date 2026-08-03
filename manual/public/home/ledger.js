/**
 * ledger.js — station 伍's addition ⇄ the console's switches.
 *
 * The plate is not decoration: it prices the build the reader is actually
 * configuring in the left column. Every row names the console key that ships
 * it (`data-cfg` / `data-pass`), unchecked rows go grey, and the footing is
 * the sum of what is left.
 *
 * The console owns the state. This module never writes config and never
 * presses a control — it only listens to `han-config-change` (composed, so it
 * bubbles out of the shadow root, the same route punct-lang.js takes) and
 * reflects. The component broadcasts its config on connect, which is what
 * seeds the first pass from a restored localStorage config.
 *
 * TWO SOURCES OF FIGURE, and the split is deliberate:
 *
 *   - The CSS rows and the `auto` row are FIXED files. Vite baked their
 *     figures into the cells at build time.
 *   - The manual-mode rows are NOT fixed — what `refinePunctuation` costs
 *     depends on what else you ticked, because passes share code. Those come
 *     from `pass-sizes.json`, which holds a real measured bundle for each of
 *     the 31 possible selections (build/pass-sizes.js).
 *
 * The FOOTING, though, has one source: the printed column. Whatever wrote a
 * row, the total re-reads it from the cells, so it can never disagree with
 * the figures above it.
 *
 * ATTRIBUTION. For a selection, each ticked pass is billed the difference its
 * arrival made, in PASSES order:
 *
 *     Δᵢ = size(first i passes) − size(first i−1 passes)
 *
 * so the column adds up to `size(selection)` exactly — a bundle that exists,
 * not a model of one. Shared code lands on whichever pass comes first; that
 * is the one honest choice available, since the alternative (charging both)
 * would make the column sum to more than the file. An UNticked pass is priced
 * differently and more usefully: what ticking it would add on top of the
 * current selection.
 *
 * Summing the ROUNDED figures (rather than bytes) is deliberate too: it makes
 * the total equal what a reader gets adding the visible column by hand.
 *
 * Pure core (`parseK` / `fmtK` / `chain`), imperative shell (`initLedger`);
 * no classes, no state of its own.
 */

/**
 * '壓縮前4.0KB' | '10.1KB' → 4 | 10.1 (NaN when there is no figure to read).
 *
 * Capital `KB` throughout — `kb` is kilobits, and an ambiguous unit on a
 * typography framework's own page is the one typo nobody would forgive.
 */
const parseK = (text) => Number(text?.trim().match(/(\d+(?:\.\d+)?)KB$/)?.[1])

const fmtK = (kb) => (Number.isFinite(kb) ? `${kb.toFixed(1)}KB` : '—')

const sumOf = (values) => values.filter(Number.isFinite).reduce((sum, kb) => sum + kb, 0)

/** The three compression columns, in the order the table prints them. */
const COLS = ['raw', 'br', 'gz']

const figuresOf = ($row) =>
  [...$row.querySelectorAll('td')].map(($td) => parseK($td.textContent))

/**
 * Bill a selection: `{ floor, deltas }`, both in KB per column.
 *
 * `floor` is charged once, to its own row, the moment any hyperly-using pass
 * is in play — detected as「the running total has cleared the floor」rather
 * than by a hardcoded list, so adding a pass that happens not to need hyperly
 * needs no change here.
 *
 * `ids` is the ticked passes in PASSES order; `sizeAt(mask)` returns the
 * measured triple for a bitmask.
 */
const chain = (ids, order, sizeAt, floor) => {
  const deltas = {}
  let mask = 0
  const prev = [0, 0, 0]
  const charged = [false, false, false]

  for (const id of order) {
    if (!ids.includes(id)) continue
    mask |= 1 << order.indexOf(id)
    const cur = sizeAt(mask)
    deltas[id] = COLS.map((_, i) => {
      let d = cur[i] - prev[i]
      if (!charged[i] && cur[i] >= floor[i]) {
        d -= floor[i]
        charged[i] = true
      }
      return d
    })
    COLS.forEach((_, i) => (prev[i] = cur[i]))
  }

  // What each UNticked pass would add on top of the current selection —
  // the number a reader is actually asking for when hovering a checkbox.
  for (const id of order) {
    if (ids.includes(id)) continue
    const withIt = sizeAt(mask | (1 << order.indexOf(id)))
    deltas[id] = COLS.map((_, i) => withIt[i] - (mask ? prev[i] : 0))
  }

  return { floor: charged, total: mask ? prev : [0, 0, 0], deltas, mask }
}

export const initLedger = ($root = document) => {
  const $table = $root.querySelector('.Sum table')
  if (!$table) return

  const $css = [...$table.querySelectorAll('tbody tr[data-cfg]:not([data-js-row])')]
  const $auto = $table.querySelector('tr[data-js-row="auto"]')
  const $floor = $table.querySelector('tr[data-js-row="floor"]')
  const $passes = [...$table.querySelectorAll('tr[data-js-row="pass"]')]
  const $totals = new Map(
    [...$table.querySelectorAll('[data-total]')].map(($el) => [$el.dataset.total, $el]),
  )
  // The caption's `CSS a + JS b = c` equation array (MathML) — outside the
  // table, hence its own lookup off the figure. Keys are `<col>-<part>`,
  // e.g. `br-all`, so one flat map covers all nine cells.
  const $sum = new Map(
    [...($table.closest('figure')?.querySelectorAll('[data-sum]') ?? [])]
      .map(($el) => [$el.dataset.sum, $el]),
  )

  /**
   * Measured once, cached by the browser like any other static asset. The
   * fetch is NOT awaited before wiring up: `<han-console>` broadcasts its
   * config on connect, and awaiting here would let that first event fire into
   * a page with no listener — the plate would then sit at its build-time
   * figures until the reader happened to touch a control. So the listener
   * goes on synchronously, the latest config is remembered, and the arriving
   * data replays it.
   *
   * A failed fetch is not fatal: the plate keeps the build-time figures and
   * the auto row, which is the console's default anyway.
   */
  const dataRef = { current: null }
  const latest = { current: null }
  const order = () => dataRef.current?.passes.map((p) => p.id) ?? []
  const sizeAt = (mask) => {
    const s = dataRef.current?.sizes[mask]
    return s ? [s.raw, s.br, s.gz] : [0, 0, 0]
  }
  const floorKb = () => {
    const f = dataRef.current?.floor
    return f ? [f.raw, f.br, f.gz] : [0, 0, 0]
  }

  const writeRow = ($row, triple, off) => {
    $row.toggleAttribute('data-off', off)
    $row.querySelectorAll('td').forEach(($td, i) => {
      $td.textContent = fmtK(triple?.[i])
    })
  }

  const apply = (config) => {
    latest.current = config
    for (const $row of $css) {
      $row.toggleAttribute('data-off', config?.[$row.dataset.cfg] === false)
    }

    const data = dataRef.current
    const manual = config?.fallbacks !== false && config?.jsMode === 'manual'
    const ticked = manual ? order().filter((id) => config?.fn?.[id]) : []
    const bill = data ? chain(ticked, order(), sizeAt, floorKb()) : null

    // Mode gates which script rows are part of the plate at all. `hidden`,
    // not `data-off`: an auto-mode reader is not「declining」the hyperly row,
    // it is not a line item in their build.
    if ($auto) {
      $auto.hidden = manual
      $auto.toggleAttribute('data-off', config?.fallbacks === false)
    }
    if ($floor) {
      $floor.hidden = !manual
      // Charged only when something in the selection actually pulls hyperly
      // in; a probes-only build never touches it.
      $floor.toggleAttribute('data-off', !bill?.floor.some(Boolean))
    }
    for (const $row of $passes) {
      $row.hidden = !manual
      if (bill) writeRow($row, bill.deltas[$row.dataset.pass], !ticked.includes($row.dataset.pass))
    }

    // The footing sums the PRINTED column — every row that is on the plate
    // (`:not([hidden])`) and still in the build (`:not([data-off])`), read
    // back out of its own cells. Two reasons, and both matter:
    //
    //   · adding the rounded figures is what a reader does by hand, so this
    //     is the only way the total can agree with the column above it. The
    //     unrounded sum drifts by ~0.1KB over six rows and reads as an error;
    //   · it makes the visible state authoritative — a row can never be shown
    //     greyed while still being billed, because greyed IS how it drops out.
    const keptIn = (scope) =>
      [...$table.querySelectorAll(`${scope} tr:not(.GroupHead):not([hidden]):not([data-off])`)]
        .map(figuresOf)

    const css = keptIn('tbody[data-group="css"]')
    const js = keptIn('tbody[data-group="js"]')

    COLS.forEach((col, i) => {
      const $el = $totals.get({ raw: 'raw', br: 'brotli', gz: 'gzip' }[col])
      if ($el) $el.textContent = fmtK(sumOf([...css, ...js].map((f) => f[i])))
    })

    // The caption's equation array restates the footing as CSS + JS = total,
    // once per compression. Same numbers, same source — the very triples the
    // tfoot just summed, so the two blocks cannot drift apart.
    COLS.forEach((col, i) => {
      const cssKb = sumOf(css.map((f) => f[i]))
      const jsKb = sumOf(js.map((f) => f[i]))
      for (const [part, kb] of [['css', cssKb], ['js', jsKb], ['all', cssKb + jsKb]]) {
        const $el = $sum.get(`${col}-${part}`)
        if ($el) $el.textContent = fmtK(kb)
      }
    })
  }

  document.addEventListener('han-config-change', (e) => {
    if (e.detail?.config) apply(e.detail.config)
  })

  fetch('/han/pass-sizes.json')
    .then((r) => r.json())
    .then((data) => {
      dataRef.current = data
      if (latest.current) apply(latest.current)
    })
    .catch(() => {})
}
