/**
 * Magnifier lens for the playground galley — the reading affordance for a
 * 9px proof sheet. A circular overlay follows the cursor and paints a
 * zoomed view of the text under it, so "read this bit" never reflows the
 * card (the previous hover mode swapped the whole galley to reading size —
 * too violent for a passing cursor).
 *
 * Mechanism (ported from the pre-rebuild homepage's hero lens): the galley
 * article is CLONED into the lens; on mousemove the clone gets
 * `translate(L/2 − cx·z, L/2 − cy·z) scale(z)` so the source point under
 * the cursor lands at the lens centre. The clone keeps the
 * `data-pg-preview` attribute, so every galley style — columns, type
 * scale, han.css wrappers — applies to it verbatim and the lens shows the
 * REAL rendering, just bigger.
 *
 * The galley re-renders on every edit (debounced, plus the fallbacks
 * pass), so the clone is refreshed from a MutationObserver — one rAF per
 * burst — rather than by coupling into playground.js's render path.
 *
 * Mouse-only sugar: gated on `(hover: hover) and (pointer: fine)`, and the
 * keyboard path stays in CSS (`:focus-visible` flips the galley itself to
 * reading size).
 */

const ZOOM = 2.25

export const initPlaygroundLens = () => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
  const $galley = document.querySelector('[data-pg-preview]')
  if (!$galley) return

  const $lens = document.createElement('div')
  $lens.className = 'PgLens'
  $lens.setAttribute('data-mag-lens', '')
  $lens.setAttribute('aria-hidden', 'true')
  $galley.append($lens)

  /* One clone at a time; rebuilt whenever the galley's content changes.
     Strip anything that must not duplicate: the lens itself (recursion),
     ids, and the focus/AT surface. */
  let $clone = null
  const recloneNow = () => {
    // The render pipeline replaces the galley's innerHTML wholesale, which
    // evicts the lens along with the old content — re-adopt it first.
    if (!$lens.isConnected) $galley.append($lens)
    $clone?.remove()
    $clone = $galley.cloneNode(true)
    $clone.classList.add('is-lens-clone')
    $clone.setAttribute('aria-hidden', 'true')
    $clone.removeAttribute('tabindex')
    $clone.removeAttribute('aria-label')
    $clone.querySelectorAll('[data-mag-lens]').forEach(($el) => $el.remove())
    $clone.querySelectorAll('[id]').forEach(($el) => $el.removeAttribute('id'))
    $lens.append($clone)
    sync()
  }

  let cloneQueued = false
  const reclone = () => {
    if (cloneQueued) return
    cloneQueued = true
    requestAnimationFrame(() => {
      cloneQueued = false
      recloneNow()
    })
  }

  let lastX = 0
  let lastY = 0
  let lensSize = 0

  const positionAt = (cx, cy) => {
    if (!lensSize || !$clone) return
    $lens.style.insetInlineStart = `${cx}px`
    $lens.style.insetBlockStart = `${cy}px`
    $clone.style.transform =
      `translate(${lensSize / 2 - cx * ZOOM}px, ${lensSize / 2 - cy * ZOOM}px) scale(${ZOOM})`
  }

  /* The clone must occupy the galley's exact content geometry or the
     column layout re-folds and the lens shows a different page. */
  const sync = () => {
    if (!$clone) return
    const r = $galley.getBoundingClientRect()
    $clone.style.inlineSize = `${r.width}px`
    $clone.style.blockSize = `${r.height}px`
    lensSize = $lens.getBoundingClientRect().width
    positionAt(lastX, lastY)
  }

  $galley.addEventListener('mousemove', (e) => {
    const r = $galley.getBoundingClientRect()
    lastX = e.clientX - r.left
    lastY = e.clientY - r.top
    positionAt(lastX, lastY)
  })

  // Content changes (render pipeline + fallbacks pass) → fresh clone.
  // The observer would see its own reclone too — guard by scoping to
  // childList changes OUTSIDE the lens.
  new MutationObserver((records) => {
    if (records.some((rec) => !$lens.contains(rec.target))) reclone()
  }).observe($galley, { childList: true, subtree: true, characterData: true })

  new ResizeObserver(sync).observe($galley)
  recloneNow()
}
