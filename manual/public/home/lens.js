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

/** A picture of the host, not a second one: strip the hooks that must stay
 *  unique — the ones an observer, a query or a test would trip over.
 *
 *  It is a DENYLIST, and it used to be「every `data-*`」. That was true when
 *  the face was keyed on classes alone; it stopped being true the day the
 *  specimens started keying LAYOUT on data attributes. `data-prose` is the
 *  switch between the abridged and the full dispatch, so wiping it showed
 *  BOTH at once and the copy stood 954px where the host stands 710 — the
 *  loupe was magnifying a page that exists nowhere. Same trap waits in the
 *  playground (`data-pg-*`) and in han.css's own output (`data-punct`,
 *  `data-followed-by*`), all of which CSS selects on.
 *
 *  So: drop identity (`id`, `tabindex`) and the hooks that address a single
 *  live instance (the loupe's own, the strips' scroll wiring, the stations'
 *  reveal gate). Everything else is part of the picture and stays. */
const DENY = new Set([
  'id', 'tabindex',
  'data-lens', 'data-mag-lens',
  'data-strip', 'data-strip-start', 'data-strip-nav',
  'data-station', 'data-revealed', 'data-reveal-at',
])

const depersonalise = ($el) => {
  for (const { name } of [...$el.attributes]) {
    if (DENY.has(name)) $el.removeAttribute(name)
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
  /* 指標最後一次的**視窗**座標。宿主相對座標（lastX/lastY）在宿主底下的內容
     平移時就過期了——長帶一捲，同一個螢幕位置對到的是別的字。要重算就得留著
     這一份，因為捲動不會送 pointermove。 */
  let clientX = null
  let clientY = null
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
    /* The copy is never scrolled — it is translated. cx/cy are where the
       pointer is over the host's VIEWPORT, so the host's own scroll offset
       turns them into where that is in its CONTENT, which is the copy's own
       coordinate system (the copy lays its full content out; nothing clips it
       but the circle). Zero for a host that doesn't scroll, so this is the
       same formula it always was — but the strips scroll, and programmatic
       `scrollLeft` on the copy does not take, so mirroring the scroll was
       never going to work. */
    const sx = cx + $host.scrollLeft
    const sy = cy + $host.scrollTop
    $clone.style.transform =
      `translate(${lensSize / 2 - sx * zoom}px, ${lensSize / 2 - sy * zoom}px) scale(${zoom})`
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

  /* Best-effort only: the copy's own scroll offset is NOT what aligns it any
   * more (`positionAt` folds the host's scroll into the translate instead —
   * a programmatic `scrollLeft` on the copy is silently refused). This stays
   * for descendants that scroll on their own account. */
  const syncScroll = () => {
    if (!$clone) return
    $clone.scrollLeft = $host.scrollLeft
    $clone.scrollTop = $host.scrollTop
  }
  $host.addEventListener('scroll', () => {
    syncScroll()
    positionAt(lastX, lastY)
  })
  /* 宿主**自己**不捲、但它整塊被平移的情形：遊樂場的兩塊面板住在可平移的長帶
     裡，捲的是長帶。宿主收不到 scroll，指標也沒動，於是鏡片停在原地顯示舊
     內容——那正是它「定死」的樣子。
     掛在 document 的**捕獲**階段：scroll 不冒泡，但捕獲階段會經過 document，
     所以這一條收得到任何祖先（包含視窗）的捲動；掛在「最近的定位祖先」上是
     不夠的——長帶不一定是定位元素（實測 `[data-pg-panes]` 就不是）。
     `refollow` 自己會在鏡片關著時直接返回，`passive` 表示不攔捲動。 */
  document.addEventListener('scroll', () => refollow(), { capture: true, passive: true })

  const follow = (e) => {
    readerDriving = true
    clientX = e.clientX
    clientY = e.clientY
    const r = $host.getBoundingClientRect()
    lastX = e.clientX - r.left
    lastY = e.clientY - r.top
    positionAt(lastX, lastY)
  }

  /** 指標沒動而宿主動了（長帶被平移、或視窗捲動）：同一個螢幕位置現在對到
   *  宿主裡的另一點，所以從留下來的視窗座標重算一次。夾回宿主之內——內容捲
   *  走之後那個點可能已經在外面，而鏡片停在邊界比跳掉合理。 */
  const refollow = () => {
    if (!on || !$clone) return
    /* 有視窗座標就重算：同一個螢幕位置現在對到宿主裡的另一點。夾回宿主之內
       ——內容捲走之後那個點可能已經在外面，鏡片停在邊界比跳掉合理。 */
    if (clientX !== null) {
      const r = $host.getBoundingClientRect()
      lastX = Math.min(Math.max(clientX - r.left, 0), r.width)
      lastY = Math.min(Math.max(clientY - r.top, 0), r.height)
    }
    /* 沒有視窗座標（讀者還沒動過指標，鏡片停在開場那一段）也要重排一次：
       長帶一平移，宿主整塊都走了，而鏡片的定位祖先不一定跟著走。 */
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
    clientX = e.clientX
    clientY = e.clientY
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
