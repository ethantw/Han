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
 * The lens is ALWAYS on stage: before any hover it parks over the headline
 * (that is the reader's first sentence, and a lens that only exists after
 * you find it explains nothing), and when the cursor leaves it stays where
 * it left rather than snapping home.
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
  // Until the reader takes over, the lens belongs to the headline — and it
  // re-finds it after every re-render, so it never ends up parked over
  // whitespace the last render left behind.
  let readerDriving = false

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

  /** Card-relative centre of the galley's headline (any first block will
   *  do — an empty draft has none, and the card's middle is the honest
   *  answer there). */
  const headlinePoint = () => {
    const card = $paper.getBoundingClientRect()
    const $first = $galley.querySelector('h1, h2, h3, p, blockquote')
    if (!$first) return [card.width / 2, card.height / 2]
    const r = $first.getBoundingClientRect()
    return [r.left - card.left + r.width / 2, r.top - card.top + r.height / 2]
  }

  /* The clone must occupy the card's exact geometry or the column layout
     re-folds and the lens shows a different page. */
  const sync = () => {
    if (!$clone) return
    const r = $paper.getBoundingClientRect()
    $clone.style.inlineSize = `${r.width}px`
    $clone.style.blockSize = `${r.height}px`
    lensSize = $lens.getBoundingClientRect().width
    syncScroll()
    if (!readerDriving) [lastX, lastY] = headlinePoint()
    positionAt(lastX, lastY)
  }

  /* The galley scrolls sideways (a page wider than its card), and a clone
   * starts at scroll 0 — so mirror the offset or the lens shows column one
   * while the reader is looking at column five. */
  const syncScroll = () => {
    const $cloneGalley = $clone?.querySelector('.PgGalley')
    if ($cloneGalley) $cloneGalley.scrollLeft = $galley.scrollLeft
  }
  $galley.addEventListener('scroll', () => {
    syncScroll()
    positionAt(lastX, lastY)
  })

  $paper.addEventListener('mousemove', (e) => {
    readerDriving = true
    const r = $paper.getBoundingClientRect()
    lastX = e.clientX - r.left
    lastY = e.clientY - r.top
    positionAt(lastX, lastY)
  })

  /* Leaving parks the lens where the cursor left, clamped to the card — the
     leave event's own coordinates are already outside it. */
  $paper.addEventListener('mouseleave', (e) => {
    const r = $paper.getBoundingClientRect()
    lastX = Math.min(Math.max(e.clientX - r.left, 0), r.width)
    lastY = Math.min(Math.max(e.clientY - r.top, 0), r.height)
    positionAt(lastX, lastY)
  })

  // Content changes (render pipeline + fallbacks pass) → fresh clone.
  new MutationObserver(reclone)
    .observe($galley, { childList: true, subtree: true, characterData: true })

  /* Switched off and on again, the loupe starts over: it goes back to the
     headline instead of reappearing wherever it happened to be left. Putting
     something down and picking it up again is a fresh look at the page. */
  const $switch = $paper.closest('[data-pg-sheet]')?.querySelector('[data-pg-lens-switch] input')
  $switch?.addEventListener('change', () => {
    if (!$switch.checked) return
    readerDriving = false
    sync()
  })

  new ResizeObserver(sync).observe($paper)
  recloneNow()
}
