/**
 * Magnifying loupe for the specimens that have to stay small. A circular
 * overlay follows the cursor and paints a zoomed view of the host under it,
 * so "read this bit" never reflows the page — the playground's 9px proof,
 * station①'s four editions (one loupe over the whole figure, so one line can
 * be compared across all four) and station④'s two miniature dispatches.
 *
 * Mechanism: the host is CLONED into the lens; on mousemove the clone gets
 * `translate(L/2 − cx·z, L/2 − cy·z) scale(z)` so the source point under the
 * cursor lands at the lens centre. The clone keeps its CLASSES (its face:
 * card chrome, column measure, type scale, han.css's own wrappers) and drops
 * every `data-*` — those are the render pipelines' and the tests' hooks, and
 * there must only ever be one of each on the page.
 *
 * It parks over the host's first block before anyone touches it (that is the
 * reader's first sentence, and a loupe that only exists after you find it
 * explains nothing), and when the pointer leaves it stays where it left
 * rather than snapping home.
 *
 * **The gesture is the switch**: a double-click (double-tap) on the specimen
 * turns its loupe off and on again, so the page needs no chrome for it — each
 * station says so in a line of small print. A fine pointer gets it on from
 * the first frame; a coarse one does not, because there it is DRAGGED, and a
 * drag that starts on the page has to keep meaning「scroll」until the reader
 * asks for something else.
 *
 * The keyboard path stays in CSS (`:focus-visible` flips the galley itself to
 * reading size).
 */

import { settled } from '/home/measure.js'

/* Geometry belongs to CSS (home/lens.css + each host's two tokens): the
 * diameter is derived from the host's own measure and this zoom, so the two
 * can never drift into a lens that clips the column it magnifies.
 *
 * Read once per settle, never per pointer event: `getComputedStyle` flushes
 * style, and with it whatever layout is pending — owner's trace caught this
 * one inside `follow()`, i.e. once per mousemove, forcing a layout of a page
 * whose full layout costs half a second on their machine. */
const zoomOf = ($lens) =>
  Number.parseFloat(getComputedStyle($lens).getPropertyValue('--lens-zoom')) || 2

/** A picture of the host, not a second one: strip every hook an observer, a
 *  query or a test could trip over. `data-*` goes wholesale — on this page
 *  every one of them is a pipeline's or a test's handle, while the face is
 *  keyed on classes and `lang`, both of which the clone keeps. */
const depersonalise = ($el) => {
  for (const { name } of [...$el.attributes]) {
    if (name.startsWith('data-') || name === 'id' || name === 'tabindex') {
      $el.removeAttribute(name)
    }
  }
}

/** The box the lens is positioned in: the nearest POSITIONED ancestor, not
 *  simply the parent. The lens is `position: absolute`, so the browser
 *  resolves its insets against that ancestor — mounting it on a static parent
 *  makes the module measure one box while the browser uses another, and the
 *  circle lands displaced by exactly the distance between them (the
 *  playground's loupe drifted into the editor column: its host's parent is
 *  the sheet, but the positioned box is the panel). */
const frameOf = ($host) => {
  for (let $a = $host.parentElement; $a; $a = $a.parentElement) {
    if (getComputedStyle($a).position !== 'static') return $a
  }
  return $host.parentElement
}

/** One loupe over one host. `live` hosts re-render (the playground draft), so
 *  their copy is rebuilt from a MutationObserver; the rest are set once. */
const mountOne = ($host, { live }) => {
  // The lens is a SIBLING of the host, never a descendant: everything that
  // queries the host — the render pipeline, the fallbacks pass, the tests —
  // must keep seeing exactly one of it with exactly one copy of the content.
  // Sibling placement also means an innerHTML swap on re-render can never
  // evict the lens.
  const $frame = frameOf($host)
  if (!$frame) return

  const $lens = document.createElement('div')
  $lens.className = 'Lens'
  $lens.setAttribute('data-mag-lens', '')
  $lens.setAttribute('aria-hidden', 'true')
  $frame.append($lens)

  let $clone = null
  /* The copy is a whole duplicated card, so it is built only while the loupe
     is ON and thrown away when it goes off: a page carrying three idle copies
     pays their layout on every resize, and this page's layout is expensive
     (the measurement is in home/frame.css § content-visibility). */
  const recloneNow = () => {
    $clone?.remove()
    $clone = null
    if (!on) return
    $clone = $host.cloneNode(true)
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
    if (!on || cloneQueued) return
    cloneQueued = true
    requestAnimationFrame(() => {
      cloneQueued = false
      recloneNow()
    })
  }

  let lastX = 0
  let lastY = 0
  let lensSize = 0
  let zoom = 2
  /* A fine pointer just moves over the page, so the loupe can be on from the
     start; a coarse one has to DRAG it, and dragging is how that reader
     scrolls — so there it waits to be asked (the host stops scrolling while
     the loupe is on, which is exactly the trade the double-tap toggles). */
  let on = matchMedia('(hover: hover) and (pointer: fine)').matches
  const dragging = new Set()
  // Until the reader takes over, the lens belongs to the host's opening
  // block — and it re-finds it after every re-render, so it never ends up
  // parked over whitespace the last render left behind.
  let readerDriving = false

  /* State lives on the FRAME, because that is the one box that contains both
     the host and the circle: one attribute dresses the lens and tells the
     host to stop scrolling while a drag belongs to the loupe. */
  const apply = () => {
    $frame.toggleAttribute('data-lens-on', on)
    if (on && !$clone) recloneNow()
    else if (!on && $clone) {
      $clone.remove()
      $clone = null
    }
  }

  const positionAt = (cx, cy) => {
    if (!lensSize || !$clone) return
    // cx/cy are host-relative; the lens is positioned in the frame.
    const h = $host.getBoundingClientRect()
    const f = $frame.getBoundingClientRect()
    /* …and the frame's own scroll offset, because an absolutely positioned
       child of a SCROLL CONTAINER is placed in that container's scrolled
       content, not against the box you can see. `f.left` is the visible edge,
       so adding `scrollLeft` converts viewport space into content space. Zero
       for a frame that doesn't scroll, so the formula is the same one — but it
       stopped being zero the day the specimens became pannable strips, and the
       circle then sat one scroll offset away from the pointer. */
    $lens.style.insetInlineStart = `${h.left - f.left + $frame.scrollLeft + cx}px`
    $lens.style.insetBlockStart = `${h.top - f.top + $frame.scrollTop + cy}px`
    $clone.style.transform =
      `translate(${lensSize / 2 - cx * zoom}px, ${lensSize / 2 - cy * zoom}px) scale(${zoom})`
  }

  /** Host-relative centre of its first block (an empty draft has none, and
   *  the host's middle is the honest answer there). */
  const openingPoint = () => {
    const box = $host.getBoundingClientRect()
    const $first = $host.querySelector('h1, h2, h3, p, blockquote')
    if (!$first) return [box.width / 2, box.height / 2]
    const r = $first.getBoundingClientRect()
    return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2]
  }

  /* The clone must occupy the host's exact geometry or its layout re-folds
     and the lens shows a different page. */
  const readGeometry = () => ({
    host: $host.getBoundingClientRect(),
    size: $lens.getBoundingClientRect().width,
    zoom: zoomOf($lens),
    opening: readerDriving ? null : openingPoint(),
  })

  const writeGeometry = (g) => {
    if (!on || !$clone || !g) return
    $clone.style.inlineSize = `${g.host.width}px`
    $clone.style.blockSize = `${g.host.height}px`
    lensSize = g.size
    zoom = g.zoom
    syncScroll()
    if (g.opening) [lastX, lastY] = g.opening
    positionAt(lastX, lastY)
  }

  /* 讀寫分開，好讓共用的排程器把所有讀集中在前（home/measure.js § 先讀再寫）。 */
  const sync = () => {
    if (!on || !$clone) return
    writeGeometry(readGeometry())
  }

  /* A host can be its own scroll container (a sheet wider than its card, a
   * 直排 card scrolling along its block axis), and a clone starts at offset
   * 0 — mirror both axes, or the loupe shows column one while the reader is
   * looking at column five. */
  const syncScroll = () => {
    if (!$clone) return
    $clone.scrollLeft = $host.scrollLeft
    $clone.scrollTop = $host.scrollTop
  }
  $host.addEventListener('scroll', () => {
    syncScroll()
    positionAt(lastX, lastY)
  })

  const follow = (e) => {
    readerDriving = true
    const r = $host.getBoundingClientRect()
    lastX = e.clientX - r.left
    lastY = e.clientY - r.top
    positionAt(lastX, lastY)
  }

  /* One code path, two pointers: a hovering pointer moves the circle by
     hovering, a coarse one only while it is down. `pointerType` is the
     honest question — a hybrid machine can do both, and the same finger on
     the same page should still drag. */
  $host.addEventListener('pointermove', (e) => {
    if (!on) return
    if (e.pointerType !== 'mouse' && !dragging.has(e.pointerId)) return
    follow(e)
  })
  $host.addEventListener('pointerdown', (e) => {
    if (!on || e.pointerType === 'mouse') return
    dragging.add(e.pointerId)
    follow(e)
  })
  for (const type of ['pointerup', 'pointercancel']) {
    $host.addEventListener(type, (e) => dragging.delete(e.pointerId))
  }

  /* Leaving parks the lens where the pointer left, clamped to the host — the
     leave event's own coordinates are already outside it. */
  $host.addEventListener('pointerleave', (e) => {
    if (!on) return
    const r = $host.getBoundingClientRect()
    lastX = Math.min(Math.max(e.clientX - r.left, 0), r.width)
    lastY = Math.min(Math.max(e.clientY - r.top, 0), r.height)
    positionAt(lastX, lastY)
  })

  /* Put it down and pick it up again: a double-click (double-tap) toggles.
     Coming back is a fresh look at the page, so it goes home to the opening
     block rather than reappearing wherever it was left. */
  $host.addEventListener('dblclick', () => {
    on = !on
    if (on) {
      readerDriving = false
      sync()
    }
    apply()
  })

  if (live) {
    new MutationObserver(reclone)
      .observe($host, { childList: true, subtree: true, characterData: true })
  }
  /* 放手才算（見 home/measure.js）：複本要與宿主等尺寸，而每次同步都會讀
     rect——拖著窗邊改大小時那是每幀一次同步版面，而拖曳中沒有人在讀鏡子。 */
  new ResizeObserver(settled({ read: readGeometry, write: writeGeometry, watch: $host }))
    .observe($host)
  // apply() builds the first copy if the loupe starts on (a fine pointer);
  // a coarse one starts off and pays nothing until it is asked.
  apply()
}

/** Mount a loupe on every `[data-lens]`; `data-lens="live"` marks a host
 *  whose content is re-rendered, so its copy is rebuilt as it changes. */
export const initLens = () => {
  document.querySelectorAll('[data-lens]').forEach(($host) => {
    mountOne($host, { live: $host.dataset.lens === 'live' })
  })
}
