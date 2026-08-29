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
 * **The gesture is the switch**, and which gesture depends on the pointer.
 *
 * A hovering pointer gets three states and one click between them: the loupe
 * rests at three-quarter aperture (`zoom-in` cursor — 「按了會放大」), a click
 * opens it to full (`zoom-out` — 「再按就收起來」), another click puts it away,
 * and only then is the specimen's text selectable again. Selection and the
 * loupe cannot share a drag: the copy sits over the host, so a selection made
 * under it is invisible.
 *
 * A coarse pointer keeps the old double-tap toggle. There is no hover to rest
 * in, the loupe is DRAGGED, and a drag that starts on the page has to keep
 * meaning「scroll」until the reader asks for something else — so it starts off
 * and pays nothing until it is asked.
 *
 * The keyboard path stays in CSS (`:focus-visible` flips the galley itself to
 * reading size).
 */

import { onRendered, settled } from '/home/measure.js'
import { DEV_RESET } from '/home/dev-reset.js'

/* Geometry belongs to CSS (home/lens.css + each host's two tokens): the
 * diameter is derived from the host's own measure and this zoom, so the two
 * can never drift into a lens that clips the column it magnifies.
 *
 * Read once per settle, never per pointer event: `getComputedStyle` flushes
 * style, and with it whatever layout is pending — owner's trace caught this
 * one inside `follow()`, i.e. once per mousemove, forcing a layout of a page
 * whose full layout costs half a second on their machine. */
/* 「有 hover 的指標」——兩套互動的分水嶺（見檔頭）。用 matchMedia 而不是
   `pointer: coarse` 的否定：混合機器兩者皆有，而這一頁的判準是「能不能停在
   一個點上」。 */
const FINE = matchMedia('(hover: hover) and (pointer: fine)')
const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)')

/* The specimen is the actor; the loupe is the observer entering a short beat
 * later. Half a second is enough to separate their entrances without making
 * the tool feel late. */
const ARRIVAL_DELAY = 500

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

/** The box of a heading's FIRST LINE, not the heading's own box: station③'s
 *  vertical headline runs several columns, and the block's centre lands in the
 *  middle of it — the loupe opened on 「梯艙屬地之爭延…」 instead of the top of
 *  the headline (owner 2026-08-27). A Range over the opening characters answers
 *  in whatever direction the line actually runs, so this needs no writing-mode
 *  branch. Falls back to the element for a heading with no text of its own. */
const LINE_ONE = 12

const lineOneOf = ($el) => {
  const $text = document.createTreeWalker($el, NodeFilter.SHOW_TEXT).nextNode()
  if (!$text) return $el.getBoundingClientRect()
  const range = document.createRange()
  range.setStart($text, 0)
  range.setEnd($text, Math.min($text.length, LINE_ONE))
  const r = range.getBoundingClientRect()
  return r.width || r.height ? r : $el.getBoundingClientRect()
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

  /* Do not let the loupe disclose a strip's automatic opening scroll. It gets
     one entrance only, after its station has revealed and (for a centred
     strip) after strip-nav has stamped the real alignment-ready signal.
     Reduced-motion skips both the wait and the fade. */
  const $station = $host.closest('[data-station]')
  let arrivalTimer = 0
  const arrivalObserver = new MutationObserver(() => cueArrival())
  const cueArrival = () => {
    if ($lens.hasAttribute('data-lens-arrived') || arrivalTimer) return
    if ($station && !$station.hasAttribute('data-revealed')) return
    if ($host.hasAttribute('data-strip-start') && !$host.hasAttribute('data-strip-ready')) return

    const arrive = () => {
      $lens.setAttribute('data-lens-arrived', '')
      arrivalObserver.disconnect()
    }
    if (REDUCED_MOTION.matches) arrive()
    else arrivalTimer = window.setTimeout(arrive, ARRIVAL_DELAY)
  }
  if ($station) {
    arrivalObserver.observe($station, {
      attributes: true,
      attributeFilter: ['data-revealed'],
    })
  }
  if ($host.hasAttribute('data-strip-start')) {
    arrivalObserver.observe($host, {
      attributes: true,
      attributeFilter: ['data-strip-ready'],
    })
  }
  cueArrival()

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
  /* 複本的尺寸（＝宿主的捲動尺寸）。取樣的夾限要用它，不能用可視框：長帶捲起
     來的部分也在複本裡。 */
  let hostW = 0
  let hostH = 0
  /* A fine pointer just moves over the page, so the loupe can be on from the
     start; a coarse one has to DRAG it, and dragging is how that reader
     scrolls — so there it waits to be asked (the host stops scrolling while
     the loupe is on, which is exactly the trade the double-tap toggles). */
  let on = FINE.matches
  /* …and how wide it is open. `small` is the resting aperture (three quarters
     of `--lens-size`); the first click opens it to full. Both levels magnify
     the same — what opens is the field of view, not the zoom.
     粗指標沒有那一格：它是雙擊叫出來的，叫出來就給全口徑。 */
  let wide = !FINE.matches
  const dragging = new Set()
  // Until the reader takes over, the lens belongs to the host's opening
  // block — and it re-finds it after every re-render, so it never ends up
  // parked over whitespace the last render left behind.
  let readerDriving = false

  /* State lives on the FRAME, because that is the one box that contains both
     the host and the circle: one attribute dresses the lens and tells the
     host to stop scrolling while a drag belongs to the loupe. */
  const apply = () => {
    /* 態寫成屬性**值**（`small`／`large`），不是兩個旗標：CSS 那頭要的正是
       「哪一級」——口徑、游標、能不能反白，三條規則各取所需。 */
    if (on) $frame.setAttribute('data-lens-on', wide ? 'large' : 'small')
    else $frame.removeAttribute('data-lens-on')
    if (on && !$clone) recloneNow()
    else if (!on && $clone) {
      $clone.remove()
      $clone = null
    }
  }

  const positionAt = (rawX, rawY) => {
    if (!lensSize || !$clone) return
    /* 擺放與取樣分家：圓的位置夾在「最多探出邊緣 2.5rem」之內，取樣仍用**原始
       的那一點**（見下方 sx/sy）。兩者共用一個點的話，宿主邊上那 20 幾個 px
       就永遠落在圓外，讀者怎麼移都看不到第一行（owner 2026-08-27）。 */
    const [cx, cy] = clampToHost(rawX, rawY)
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
    /* 取樣點與擺放點分開。
     *
     * 圓的**位置**已經被夾在「最多探出邊緣 2.5rem」之內（見 clampToHost），若
     * 連取樣也用同一個點，圓的視野就跟著往內縮——宿主最上面那 22px 永遠落在圓
     * 外，讀者怎麼移都看不到第一行（owner 2026-08-27）。所以取樣另外夾：讓**視
     * 野**貼著宿主的邊，圓因此永遠是滿的，邊上的字出現在圓的上緣而不是消失。
     * 代價是靠邊時圓心不再精確等於游標下的那一點，差最多半個視野——放大鏡貼著
     * 框走本來就是這個樣子。 */
    const half = lensSize / (2 * (zoom || 1))
    const fit = (v, size) => (size <= 2 * half ? size / 2 : Math.min(Math.max(v, half), size - half))
    const sx = fit(rawX, hostW || $host.clientWidth) + $host.scrollLeft
    const sy = fit(rawY, hostH || $host.clientHeight) + $host.scrollTop
    $clone.style.transform =
      `translate(${lensSize / 2 - sx * zoom}px, ${lensSize / 2 - sy * zoom}px) scale(${zoom})`
  }

  /** Host-relative centre of the block the loupe should open on: the
   *  specimen's TITLE (owner 2026-08-27 — that is where a reader starts, and
   *  a loupe parked mid-paragraph reads as「it landed somewhere」).
   *
   *  Visually first, not first in the DOM: station③'s strip puts the 直排
   *  dispatch ahead of the 橫排 one with `order`, so DOM order picks the wrong
   *  headline. Taking the smallest `left` picks the leftmost card's heading and
   *  degrades to「the first heading」in single-column content, where every
   *  heading shares one line-start edge. An empty draft has no blocks at all,
   *  and the host's middle is the honest answer there. */
  const openingPoint = () => {
    const box = $host.getBoundingClientRect()

    /* 先挑**視覺上**排在最前面的那一張卡，再在它裡面挑第一個標題。兩步是必要
       的：站③那條長帶把直排那張用 `order` 排到了前面，DOM 序會挑到橫排那張；
       而「整個宿主裡 left 最小的標題」會挑到直排卡中段某個捲到左邊的小標
       （實測選到「積怨引爆」，圓心落在 x = −51，整顆在畫面外）。只有一張卡時
       第一步退化成宿主自己。 */
    const kids = [...$host.children].filter(($el) => $el.getBoundingClientRect().width)
    const $card = kids.length > 1
      ? kids.reduce((a, b) => (
        b.getBoundingClientRect().left < a.getBoundingClientRect().left ? b : a
      ))
      : $host
    /* 看得見的才算：兩張卡都各帶一份**節錄版**（`data-prose` 那個開關），關著的
       那一份仍在 DOM 裡，`querySelector` 一問就先挑到它——量出來是 0×0 的盒，
       圓心於是落在宿主的左上角（實測 [0, 1]）。 */
    const shown = ($scope, sel) => [...$scope.querySelectorAll(sel)]
      .find(($el) => $el.getBoundingClientRect().width)
    /* 標題優先於「那張卡裡的第一塊」：遊樂場那張紙的第一個子元素是報頭
       （`p.Masthead`，沒有標題），照卡片找會停在報頭上——那是刊名，不是這篇
       報導的開頭。所以先在卡裡找標題，再退到整張紙找標題，最後才輪到段落。 */
    const $first = shown($card, 'h1, h2, h3')
      ?? shown($host, 'h1, h2, h3')
      ?? shown($card, 'p, blockquote')
      ?? shown($host, 'p, blockquote')
    if (!$first) return [box.width / 2, box.height / 2, 0, 0]
    const r = lineOneOf($first)
    /* 讀者的目光從哪個角落起算：橫排 ltr 是左上，直排 vertical-rl 是右上。
       行向要問**那個標題**，不是宿主——站③的宿主是一條橫排長帶，直排那張卡才
       是 `vertical-rl`（問錯了圓心會跑到別的角落，實測差 99px）。 */
    const wm = getComputedStyle($first)
    const rtl = wm.writingMode.startsWith('vertical')
      ? !wm.writingMode.endsWith('lr')
      : wm.direction === 'rtl'
    /* 圓心不放在那一行的**正中**，放在報導的**起始角落往內縮一點**：大標的
       起點該落在圓的起始邊，後面幾行才填得滿圓（owner 2026-08-27 的期望圖）。
       縮多少由 writeGeometry 算——它才知道圓在宿主座標裡有多大（`size / zoom`）。 */
    return [
      (rtl ? r.right : r.left) - box.left,
      r.top - box.top,
      rtl ? -1 : 1,
      1,
    ]
  }

  /* The clone must occupy the host's exact geometry or its layout re-folds and
     the lens shows a different page — but the host's *border box* is the wrong
     measure once the host is a scroll container. `.Prose` is 1,159px wide and
     scrolls 1,826px of content; a copy cut to 1,159 clips the rest, and since
     `positionAt` translates the copy rather than scrolling it (a copy refuses
     `scrollLeft`), everything past that edge is simply gone. That is what「橫排
     只看得到第一欄的一半」was: the 橫排 dispatch starts at x=1,788 inside the
     copy, 629px beyond its own clip edge, so the circle showed the sliver that
     happened to reach inside.
     So: the scroll size, and `overflow: visible` on the copy (home/lens.css).
     Clipping is the circle's job, not the copy's. Widening changes nothing
     inside — both dispatches size off `calc(var(--size) * N)`, independent of
     their container (measured: 768×710 and 970×576 either way). */
  const readGeometry = () => {
    const rect = $host.getBoundingClientRect()
    return {
      host: {
        width: Math.max(rect.width, $host.scrollWidth),
        height: Math.max(rect.height, $host.scrollHeight),
      },
      size: $lens.getBoundingClientRect().width,
      zoom: zoomOf($lens),
      opening: readerDriving ? null : openingPoint(),
    }
  }

  const writeGeometry = (g) => {
    if (!on || !$clone || !g) return
    $clone.style.inlineSize = `${g.host.width}px`
    $clone.style.blockSize = `${g.host.height}px`
    hostW = g.host.width
    hostH = g.host.height
    lensSize = g.size
    zoom = g.zoom
    syncScroll()
    if (g.opening) {
      /* 內縮 0.35 個「圓在宿主座標裡的直徑」——起始角落因此落在圓的起始邊內側
         一點，而不是圓心。 */
      ;[lastX, lastY] = restingAt(g.opening)
    }
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

  /* 圓心的活動範圍：圓最多探出宿主邊緣 `OVERHANG`。
   *
   * 不夾的話，游標走到樣張角落時整顆圓有一半懸在版面外，讀者看到的是半個空圓
   * （owner 2026-08-27）。夾住之後游標仍可以走出去，圓就停在邊上——邊上的字看
   * 得清清楚楚，那正是他要的。宿主比圓還小時（窄站台）夾不出區間，取正中。 */
  const OVERHANG_REM = 2.5

  const clampToHost = (x, y) => {
    const r = $host.getBoundingClientRect()
    const over = OVERHANG_REM * Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
    const edge = lensSize / 2 - over
    const span = (v, size) => (size <= 2 * edge ? size / 2 : Math.min(Math.max(v, edge), size - edge))
    return [span(x, r.width), span(y, r.height)]
  }

  /** 開場的圓心：報導的起始角落**往內縮**一點——起點落在圓的起始邊，後面幾行才
   *  填得滿圓。夾限不在這裡，在 positionAt（圓的位置與取樣點各夾各的）。 */
  const restingAt = ([x, y, dx, dy]) => {
    const inset = 0.35 * (lensSize / (zoom || 1))
    return inHost(x + dx * inset, y + dy * inset)
  }

  /* 存的是**原始**的宿主相對座標（只夾在宿主盒內，免得取樣到紙外面）；圓的位置
     由 positionAt 自己夾。 */
  const inHost = (x, y) => {
    const r = $host.getBoundingClientRect()
    return [
      Math.min(Math.max(x, 0), hostW || r.width),
      Math.min(Math.max(y, 0), hostH || r.height),
    ]
  }

  const follow = (e) => {
    readerDriving = true
    clientX = e.clientX
    clientY = e.clientY
    const r = $host.getBoundingClientRect()
    ;[lastX, lastY] = inHost(e.clientX - r.left, e.clientY - r.top)
    positionAt(lastX, lastY)
  }

  /** 指標沒動而宿主動了（長帶被平移、或視窗捲動）：同一個螢幕位置現在對到
   *  宿主裡的另一點，所以從留下來的視窗座標重算一次。夾回宿主之內——內容捲
   *  走之後那個點可能已經在外面，而鏡片停在邊界比跳掉合理。 */
  const refollow = () => {
    if (!on || !$clone) return
    /* 有視窗座標就重算：同一個螢幕位置現在對到宿主裡的另一點。夾回宿主之內
       ——內容捲走之後那個點可能已經在外面，鏡片停在邊界比跳掉合理。 */
    if (!readerDriving) {
      /* 讀者還沒接手：鏡片的家是**開場那一段**，不是上次算出來的座標。長帶一
         平移（站③的縫居中就會捲 434px），同一個宿主相對座標對到的已經是別的
         字，鏡片會離開大標——所以這裡重新問一次它在哪。 */
      ;[lastX, lastY] = restingAt(openingPoint())
    } else if (clientX !== null) {
      const r = $host.getBoundingClientRect()
      ;[lastX, lastY] = inHost(clientX - r.left, clientY - r.top)
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
    ;[lastX, lastY] = inHost(e.clientX - r.left, e.clientY - r.top)
    positionAt(lastX, lastY)
  })

  /* 有 hover 的指標：一次點擊走一格——四分之三口徑 → 全口徑 → 收起 → 再回四分
     之三。回來是重新看一次，所以回到開場那一段，而不是回到上次離手的地方。 */
  $host.addEventListener('click', (e) => {
    if (!FINE.matches) return
    /* 拖出來的選取不算「點一下」：放開滑鼠時瀏覽器照樣送 click，若它也翻一格，
       讀者反白到一半就被鏡片收走。鏡片關著時才選得到字，所以只需要在這裡問。 */
    if (!getSelection()?.isCollapsed) return
    if (!on) {
      on = true
      wide = false
      /* 重開就開在**游標當下這一點**，不是開場那一段：讀者是為了看某個地方才
         把它叫回來的（owner 2026-08-27）。`follow` 順手把 readerDriving 舉起來。 */
      apply()
      sync()
      follow(e)
      return
    } else if (!wide) {
      wide = true
    } else {
      on = false
      wide = false
    }
    apply()
    /* 口徑換了級，`lensSize` 得重讀一次，複本的平移才對得準中心。 */
    if (on) sync()
  })

  /* 粗指標：維持雙擊（雙指點兩下）開關。那裡沒有 hover 可以停，鏡片是拖出來
     的，所以只有「開／關」兩態，沒有口徑那一格。 */
  $host.addEventListener('dblclick', () => {
    if (FINE.matches) return
    on = !on
    wide = true
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
  /* 而「看不到不算」那條紀律有個尾巴：站台被 `content-visibility` 跳過時，上面
     那個觀察者的回呼會被整個跳掉——版面在那期間改了（收起主控台就會改，版心
     重新置中），鏡片的 inset 卻還是舊的，於是站台推回畫面時圓圈落在別處
     （實測收合後散文那顆跑到 -472→-88，整顆在畫面外）。推回畫面的那一刻補算
     一次，這正是 `onRendered` 存在的理由。
     掛在**站台**上而不是宿主：`contentvisibilityautostatechange` 在帶著
     `content-visibility` 的那個元素上發，宿主只是它的後代（playground.js 也是
     掛 `$station`）。 */
  onRendered($host.closest('[data-station]'), sync)
  // apply() builds the first copy if the loupe starts on (a fine pointer);
  // a coarse one starts off and pays nothing until it is asked.
  /* Shift+M（home/dev-reset.js）：回到開場的那一格——口徑、開關、以及**停在開場
     那一段**這件事。連關著的鏡片也要收到：讀者關掉它之後再開，開場位置得是新的
     那一個，而不是上一輪留下的座標。 */
  document.addEventListener(DEV_RESET, () => {
    on = FINE.matches
    wide = !FINE.matches
    readerDriving = false
    clientX = null
    clientY = null
    apply()
    if (on) sync()
    ;[lastX, lastY] = restingAt(openingPoint())
    positionAt(lastX, lastY)
  })

  apply()
}

/** Mount a loupe on every `[data-lens]`; `data-lens="live"` marks a host
 *  whose content is re-rendered, so its copy is rebuilt as it changes. */
export const initLens = () => {
  document.querySelectorAll('[data-lens]').forEach(($host) => {
    mountOne($host, { live: $host.dataset.lens === 'live' })
  })
}
