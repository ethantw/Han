





























const SETTLE_MS = 120














const viewportState = new WeakMap()
const viewportJobs = new WeakMap()
const viewportObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    viewportState.set(entry.target, entry.isIntersecting)
    if (!entry.isIntersecting) continue
    for (const trigger of viewportJobs.get(entry.target) ?? []) trigger()
  }
})

const rendered = ($watch) =>
  !$watch
  || (viewportState.get($watch) !== false
    && (typeof $watch.checkVisibility !== 'function'
      || $watch.checkVisibility({ contentVisibilityAuto: true })))



const pending = new Set()
let timer = 0

const flush = () => {
  const jobs = [...pending].filter((job) => rendered(job.watch))
  pending.clear()

  const values = jobs.map((job) => job.read?.())

  jobs.forEach((job, i) => job.write?.(values[i]))
}






/** Debounces a read-then-write measurement job until resize activity settles. */
export const settled = (job) => {
  const trigger = () => {
    pending.add(job)
    clearTimeout(timer)
    timer = setTimeout(flush, SETTLE_MS)
  }
  if (job.watch) {
    const triggers = viewportJobs.get(job.watch) ?? new Set()
    triggers.add(trigger)
    viewportJobs.set(job.watch, triggers)
    viewportObserver.observe(job.watch)
  }
  return trigger
}




















const HOLD_MS = SETTLE_MS + 2600














const PARK_DEPTH = 3
const parked = []





const contentBoxSize = ($el, rect) => {
  const css = getComputedStyle($el)
  const inline = rect.width
    - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight)
    - parseFloat(css.borderLeftWidth) - parseFloat(css.borderRightWidth)
  const block = rect.height
    - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom)
    - parseFloat(css.borderTopWidth) - parseFloat(css.borderBottomWidth)
  return [Math.max(0, inline), Math.max(0, block)]
}

const parkBelowFold = () => {
  const vh = innerHeight
  const found = []

  const scan = ($el, depth) => {
    for (const $child of $el.children) {
      const rect = $child.getBoundingClientRect()
      if (!rect.height || rect.bottom <= 0) continue
      if (rect.top >= vh) found.push([$child, ...contentBoxSize($child, rect)])
      else if (depth > 1) scan($child, depth - 1)
    }
  }
  const $main = document.querySelector('main')
  if ($main) scan($main, PARK_DEPTH)

  for (const [$child, width, height] of found) {
    parked.push([$child, $child.style.containIntrinsicSize])
    $child.style.containIntrinsicSize = `${width}px ${height}px`
    $child.setAttribute('data-park', '')
  }
}














const CONFIG_MARGIN = 0
const configParked = new Map()
const configParkAnchor = { y: NaN, width: 0, height: 0 }

const unparkConfig = ($el) => {
  const prior = configParked.get($el)
  if (!prior) return
  $el.style.containIntrinsicSize = prior.containIntrinsicSize
  $el.style.contentVisibility = prior.contentVisibility
  configParked.delete($el)
  configObserver.unobserve($el)
}

const configObserver = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) unparkConfig(entry.target)
  }),
  { rootMargin: '0px' },
)

/** Parks offscreen content before inherited configuration changes invalidate layout. */
export const parkForConfigChange = () => {
  const $main = document.querySelector('main')
  if (!$main) return



  const sameWorkset = configParked.size > 0
    && Math.abs(scrollY - configParkAnchor.y) < innerHeight / 2
    && innerWidth === configParkAnchor.width
    && innerHeight === configParkAnchor.height
  if (sameWorkset) return

  const found = []
  const top = -CONFIG_MARGIN
  const bottom = innerHeight + CONFIG_MARGIN


  const scan = ($el, depth) => {
    for (const $child of $el.children) {
      if (configParked.has($child)) continue
      const rect = $child.getBoundingClientRect()
      if (!rect.height) continue
      if (rect.bottom < top || rect.top > bottom) {
        found.push([$child, ...contentBoxSize($child, rect)])
      } else if (depth > 1) {
        scan($child, depth - 1)
      }
    }
  }
  scan($main, PARK_DEPTH)
  Object.assign(configParkAnchor, { y: scrollY, width: innerWidth, height: innerHeight })

  for (const [$el, inline, block] of found) {
    configParked.set($el, {
      containIntrinsicSize: $el.style.containIntrinsicSize,
      contentVisibility: $el.style.contentVisibility,
    })
    $el.style.containIntrinsicSize = `${inline}px ${block}px`
    $el.style.contentVisibility = 'hidden'
    configObserver.observe($el)
  }
}

document.addEventListener('han-config-will-apply', parkForConfigChange)

const unpark = () => {
  for (const [$child, previous] of parked) {
    $child.style.containIntrinsicSize = previous
    $child.removeAttribute('data-park')
  }
  parked.length = 0
}




let holdTimer = 0
let parkTimer = 0
let holding = false

addEventListener(
  'resize',
  () => {


    if (!holding) {
      holding = true
      document.documentElement.dataset.resizing = ''
      document.documentElement.dataset.dragging = ''
      parkBelowFold()
    }
    clearTimeout(parkTimer)
    parkTimer = setTimeout(() => {
      holding = false
      delete document.documentElement.dataset.dragging
      unpark()
    }, SETTLE_MS)
    clearTimeout(holdTimer)
    holdTimer = setTimeout(() => {
      delete document.documentElement.dataset.resizing
    }, HOLD_MS)
  },
  { passive: true },
)


/** Runs a callback when skipped content becomes rendered again. */
export const onRendered = ($watch, fn) => {
  $watch?.addEventListener?.('contentvisibilityautostatechange', (event) => {
    if (!event.skipped) fn()
  })
}
