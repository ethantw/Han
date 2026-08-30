




































import { onRendered, settled } from '/home/measure.js'
import { DEV_RESET } from '/home/dev-reset.js'
import {
  clampLensCenter,
  clampToBounds,
  cloneTransform,
  createLensState,
  cycleLens,
  restingPoint,
} from '/home/lens-state.js'












const FINE = matchMedia('(hover: hover) and (pointer: fine)')
const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)')




const ARRIVAL_DELAY = 500

const zoomOf = ($lens) =>
  Number.parseFloat(getComputedStyle($lens).getPropertyValue('--lens-zoom')) || 2
















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








const frameOf = ($host) => {
  for (let $a = $host.parentElement; $a; $a = $a.parentElement) {
    if (getComputedStyle($a).position !== 'static') return $a
  }
  return $host.parentElement
}



const mountOne = ($host, { live }) => {
  let state = createLensState(FINE.matches)
  const update = (patch) => { state = { ...state, ...patch } }





  const $frame = frameOf($host)
  if (!$frame) return

  const $lens = document.createElement('div')
  $lens.setAttribute('data-mag-lens', '')
  $lens.setAttribute('aria-hidden', 'true')
  $frame.append($lens)





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




  const recloneNow = () => {
    $clone?.remove()
    $clone = null
    if (!state.on) return
    $clone = $host.cloneNode(true)
    $clone.dataset.lensClone = ''
    $clone.setAttribute('aria-hidden', 'true')
    $clone.removeAttribute('aria-label')
    depersonalise($clone)
    $clone.querySelectorAll('*').forEach(depersonalise)
    $lens.append($clone)
    sync()
  }

  let cloneQueued = false
  const reclone = () => {
    if (!state.on || cloneQueued) return
    cloneQueued = true
    requestAnimationFrame(() => {
      cloneQueued = false
      recloneNow()
    })
  }

  const dragging = new Set()




  const apply = () => {


    if (state.on) $frame.setAttribute('data-lens-on', state.wide ? 'large' : 'small')
    else $frame.removeAttribute('data-lens-on')
    if (state.on && !$clone) recloneNow()
    else if (!state.on && $clone) {
      $clone.remove()
      $clone = null
    }
  }

  const positionAt = (rawX, rawY) => {
    if (!state.lensSize || !$clone) return

    const h = $host.getBoundingClientRect()
    const f = $frame.getBoundingClientRect()
    const overhang = OVERHANG_REM * Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
    const [cx, cy] = clampLensCenter(
      [rawX, rawY],
      [h.width, h.height],
      state.lensSize,
      overhang,
    )

    $lens.style.insetInlineStart = `${h.left - f.left + $frame.scrollLeft + cx}px`
    $lens.style.insetBlockStart = `${h.top - f.top + $frame.scrollTop + cy}px`
















    $clone.style.transform = cloneTransform({
      point: [rawX, rawY],
      bounds: [state.hostWidth || $host.clientWidth, state.hostHeight || $host.clientHeight],
      lensSize: state.lensSize,
      zoom: state.zoom,
      scroll: [$host.scrollLeft, $host.scrollTop],
    })
  }











  const openingPoint = () => {
    const box = $host.getBoundingClientRect()






    const kids = [...$host.children].filter(($el) => $el.getBoundingClientRect().width)
    const $card = kids.length > 1
      ? kids.reduce((a, b) => (
        b.getBoundingClientRect().left < a.getBoundingClientRect().left ? b : a
      ))
      : $host



    const shown = ($scope, sel) => [...$scope.querySelectorAll(sel)]
      .find(($el) => $el.getBoundingClientRect().width)



    const $first = shown($card, 'h1, h2, h3')
      ?? shown($host, 'h1, h2, h3')
      ?? shown($card, 'p, blockquote')
      ?? shown($host, 'p, blockquote')
    if (!$first) return [box.width / 2, box.height / 2, 0, 0]
    const r = lineOneOf($first)



    const wm = getComputedStyle($first)
    const rtl = wm.writingMode.startsWith('vertical')
      ? !wm.writingMode.endsWith('lr')
      : wm.direction === 'rtl'



    return [
      (rtl ? r.right : r.left) - box.left,
      r.top - box.top,
      rtl ? -1 : 1,
      1,
    ]
  }














  const readGeometry = () => {
    const rect = $host.getBoundingClientRect()
    return {
      host: {
        width: Math.max(rect.width, $host.scrollWidth),
        height: Math.max(rect.height, $host.scrollHeight),
      },
      size: $lens.getBoundingClientRect().width,
      zoom: zoomOf($lens),
      opening: state.readerDriving ? null : openingPoint(),
    }
  }

  const writeGeometry = (g) => {
    if (!state.on || !$clone || !g) return
    $clone.style.inlineSize = `${g.host.width}px`
    $clone.style.blockSize = `${g.host.height}px`
    update({
      hostWidth: g.host.width,
      hostHeight: g.host.height,
      lensSize: g.size,
      zoom: g.zoom,
    })
    syncScroll()
    if (g.opening) {


      const [lastX, lastY] = restingAt(g.opening)
      update({ lastX, lastY })
    }
    positionAt(state.lastX, state.lastY)
  }


  const sync = () => {
    if (!state.on || !$clone) return
    writeGeometry(readGeometry())
  }





  const syncScroll = () => {
    if (!$clone) return
    $clone.scrollLeft = $host.scrollLeft
    $clone.scrollTop = $host.scrollTop
  }
  $host.addEventListener('scroll', () => {
    syncScroll()
    positionAt(state.lastX, state.lastY)
  })







  document.addEventListener('scroll', () => refollow(), { capture: true, passive: true })






  const OVERHANG_REM = 2.5

  const restingAt = ([x, y, dx, dy]) => {
    const r = $host.getBoundingClientRect()
    return restingPoint(
      [x, y, dx, dy],
      state.lensSize,
      state.zoom,
      [state.hostWidth || r.width, state.hostHeight || r.height],
    )
  }



  const inHost = (x, y) => {
    const r = $host.getBoundingClientRect()
    return clampToBounds(
      [x, y],
      [state.hostWidth || r.width, state.hostHeight || r.height],
    )
  }

  const follow = (e) => {
    const r = $host.getBoundingClientRect()
    const [lastX, lastY] = inHost(e.clientX - r.left, e.clientY - r.top)
    update({ readerDriving: true, clientX: e.clientX, clientY: e.clientY, lastX, lastY })
    positionAt(state.lastX, state.lastY)
  }




  const refollow = () => {
    if (!state.on || !$clone) return


    if (!state.readerDriving) {



      const [lastX, lastY] = restingAt(openingPoint())
      update({ lastX, lastY })
    } else if (state.clientX !== null) {
      const r = $host.getBoundingClientRect()
      const [lastX, lastY] = inHost(state.clientX - r.left, state.clientY - r.top)
      update({ lastX, lastY })
    }


    positionAt(state.lastX, state.lastY)
  }





  $host.addEventListener('pointermove', (e) => {
    if (!state.on) return
    if (e.pointerType !== 'mouse' && !dragging.has(e.pointerId)) return
    follow(e)
  })
  $host.addEventListener('pointerdown', (e) => {
    if (!state.on || e.pointerType === 'mouse') return
    dragging.add(e.pointerId)
    follow(e)
  })
  for (const type of ['pointerup', 'pointercancel']) {
    $host.addEventListener(type, (e) => dragging.delete(e.pointerId))
  }



  $host.addEventListener('pointerleave', (e) => {
    if (!state.on) return
    const r = $host.getBoundingClientRect()
    const [lastX, lastY] = inHost(e.clientX - r.left, e.clientY - r.top)
    update({ clientX: e.clientX, clientY: e.clientY, lastX, lastY })
    positionAt(state.lastX, state.lastY)
  })



  $host.addEventListener('click', (e) => {
    if (!FINE.matches) return


    if (!getSelection()?.isCollapsed) return
    const wasOn = state.on
    state = cycleLens(state)
    if (!wasOn) {
      apply()
      sync()
      follow(e)
      return
    }
    apply()

    if (state.on) sync()
  })



  $host.addEventListener('dblclick', () => {
    if (FINE.matches) return
    update({ on: !state.on, wide: true })
    if (state.on) {
      update({ readerDriving: false })
      sync()
    }
    apply()
  })

  if (live) {
    new MutationObserver(reclone)
      .observe($host, { childList: true, subtree: true, characterData: true })
  }


  new ResizeObserver(settled({ read: readGeometry, write: writeGeometry, watch: $host }))
    .observe($host)








  onRendered($host.closest('[data-station]'), sync)





  document.addEventListener(DEV_RESET, () => {
    state = createLensState(FINE.matches)
    apply()
    if (state.on) sync()
    const [lastX, lastY] = restingAt(openingPoint())
    update({ lastX, lastY })
    positionAt(state.lastX, state.lastY)
  })

  apply()
}



/** Mounts a magnifying lens on each declared specimen host. */
export const initLens = () => {
  document.querySelectorAll('[data-lens]').forEach(($host) => {
    mountOne($host, { live: $host.dataset.lens === 'live' })
  })
}
