/**
 * Magnifier lens for the playground galley — the reading affordance for a
 * 9px proof sheet. A circular overlay follows the cursor and paints a
 * zoomed view of the text under it, so "read this bit" never reflows the
 * card (the previous hover mode swapped the whole galley to reading size —
 * too violent for a passing cursor).
 *
 * Mechanism (ported from the pre-rebuild homepage's hero lens): the whole
 * paper card — masthead, dateline, galley — is CLONED into the lens; on
 * mousemove the clone gets `translate(L/2 − cx·z, L/2 − cy·z) scale(z)` so
 * the source point under the cursor lands at the lens centre. The clone
 * keeps its CLASSES (its face: card chrome, column measure, type scale,
 * han.css's own wrappers) and drops every `data-*` — those are the render
 * pipeline's and the tests' hooks, and there must only ever be one of each
 * on the page.
 *
 * The galley re-renders on every edit (debounced, plus the fallbacks
 * pass), so the clone is refreshed from a MutationObserver — one rAF per
 * burst — rather than by coupling into playground.js's render path.
 *
 * Mouse-only sugar: gated on `(hover: hover) and (pointer: fine)`, and the
 * keyboard path stays in CSS (`:focus-visible` flips the galley itself to
 * reading size).
 */

/* Geometry belongs to CSS (station-playground.css § .PgLens): the lens's
 * diameter is derived from the galley's column measure and this zoom, so
 * the two can never drift into a lens that clips the column it magnifies. */
const zoomOf = ($lens) =>
  Number.parseFloat(getComputedStyle($lens).getPropertyValue('--pg-lens-zoom')) || 2

export const initPlaygroundLens = () => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return
  // Source = the whole paper card: the masthead and dateline are part of
  // the page being proofed, so they magnify like everything else.
  const $paper = document.querySelector('[data-pg-paper]')
  const $galley = $paper?.querySelector('[data-pg-preview]')
  const $wrap = $paper?.closest('[data-playground]')
  if (!$paper || !$galley || !$wrap) return

  // The lens is a SIBLING of the galley, not a descendant: everything that
  // queries [data-pg-preview] — the render pipeline, the fallbacks pass,
  // the tests — must keep seeing exactly one preview with exactly one copy
  // of the content. Sibling placement also means the innerHTML swaps on
  // re-render can never evict the lens.
  const $lens = document.createElement('div')
  $lens.className = 'PgLens'
  $lens.setAttribute('data-mag-lens', '')
  $lens.setAttribute('aria-hidden', 'true')
  $wrap.append($lens)

  /* One clone at a time; rebuilt whenever the galley's content changes.
     Strip anything that must not duplicate: the lens itself (recursion),
     ids, and the focus/AT surface. */
  /** A picture of the card, not a second card: strip every hook an
   *  observer, a query or a test could trip over. */
  const depersonalise = ($el) => {
    for (const { name } of [...$el.attributes]) {
      if (name.startsWith('data-pg') || name === 'id' || name === 'tabindex') {
        $el.removeAttribute(name)
      }
    }
  }

  let $clone = null
  const recloneNow = () => {
    $clone?.remove()
    $clone = $paper.cloneNode(true)
    $clone.classList.add('is-lens-clone')
    $clone.setAttribute('aria-hidden', 'true')
    $clone.removeAttribute('aria-label')
    depersonalise($clone)
    $clone.querySelectorAll('*').forEach(depersonalise)
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
    // cx/cy are card-relative; the lens is positioned in the wrapper.
    const g = $paper.getBoundingClientRect()
    const w = $wrap.getBoundingClientRect()
    $lens.style.insetInlineStart = `${g.left - w.left + cx}px`
    $lens.style.insetBlockStart = `${g.top - w.top + cy}px`
    const z = zoomOf($lens)
    $clone.style.transform =
      `translate(${lensSize / 2 - cx * z}px, ${lensSize / 2 - cy * z}px) scale(${z})`
  }

  /* The clone must occupy the card's exact geometry or the column layout
     re-folds and the lens shows a different page. */
  const sync = () => {
    if (!$clone) return
    const r = $paper.getBoundingClientRect()
    $clone.style.inlineSize = `${r.width}px`
    $clone.style.blockSize = `${r.height}px`
    lensSize = $lens.getBoundingClientRect().width
    positionAt(lastX, lastY)
  }

  $paper.addEventListener('mousemove', (e) => {
    const r = $paper.getBoundingClientRect()
    lastX = e.clientX - r.left
    lastY = e.clientY - r.top
    positionAt(lastX, lastY)
  })

  // Content changes (render pipeline + fallbacks pass) → fresh clone.
  new MutationObserver(reclone)
    .observe($galley, { childList: true, subtree: true, characterData: true })

  new ResizeObserver(sync).observe($paper)
  recloneNow()
}
