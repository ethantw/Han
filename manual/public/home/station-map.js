/**
 * Seven-station route map.
 *
 * The ordered links in home/station-map.html are the sole metadata source.
 * This module only derives current state from those links and their fragment
 * targets. Native anchors retain fragment history, reload and Back/Forward;
 * an IntersectionObserver updates the progress marker without scroll loops
 * or repeated whole-page geometry reads.
 */

const COMPACT = '(max-width: 71.9375rem)'

export const initStationMap = () => {
  const $map = document.querySelector('[data-station-map]')
  const $toggle = $map?.querySelector('.StationMapCurrent')
  const $list = $map?.querySelector('.StationMapList')
  const links = [...($map?.querySelectorAll('.StationMapList a[href^="#"]') ?? [])]
  if (!$map || !$toggle || !$list || !links.length) return

  const entries = links.map(($link, index) => ({
    index,
    $link,
    $station: document.querySelector($link.hash),
    number: $link.dataset.number,
    name: $link.dataset.name,
    summary: $link.dataset.summary,
  })).filter(({ $station }) => $station)
  if (!entries.length) return

  const compact = matchMedia(COMPACT)
  const totalNumber = entries.at(-1).number
  const initialHashIndex = entries.findIndex(({ $link }) => $link.hash === location.hash)
  let current = Math.max(0, initialHashIndex)
  let waitingForFragment = initialHashIndex >= 0 && document.readyState !== 'complete'
  const intersecting = new Set()

  const accessibleLabel = (open) => {
    const entry = entries[current]
    const action = open ? $toggle.dataset.labelClose : $toggle.dataset.labelOpen
    return `${action}：${entry.number}／${totalNumber}・${entry.name}—${entry.summary}`
  }

  const setOpen = (open, { focus = false } = {}) => {
    const next = compact.matches && open
    $map.toggleAttribute('data-open', next)
    $toggle.setAttribute('aria-expanded', String(next))
    $toggle.setAttribute('aria-label', accessibleLabel(next))
    if (focus) $toggle.focus()
  }

  const setCurrent = (index) => {
    if (index < 0 || index >= entries.length) return
    current = index
    const entry = entries[index]
    $map.dataset.current = String(index + 1)
    $toggle.querySelector('.StationMapCurrentNo').textContent = `${entry.number}／${totalNumber}`
    $toggle.querySelector('.StationMapCurrentName').textContent = entry.name
    entries.forEach(({ $link }, i) => {
      if (i === index) $link.setAttribute('aria-current', 'location')
      else $link.removeAttribute('aria-current')
    })
    $toggle.setAttribute('aria-label', accessibleLabel($map.hasAttribute('data-open')))
  }

  $map.dataset.enhanced = ''
  setCurrent(current)
  setOpen(false)

  $toggle.addEventListener('click', () => {
    setOpen(!$map.hasAttribute('data-open'))
  })
  links.forEach(($link) => $link.addEventListener('click', () => setOpen(false)))
  document.addEventListener('pointerdown', (event) => {
    if ($map.hasAttribute('data-open') && !$map.contains(event.target)) setOpen(false)
  })
  addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && $map.hasAttribute('data-open')) setOpen(false, { focus: true })
  })
  compact.addEventListener('change', () => setOpen(false))
  document.querySelector('#console-collapsed')?.addEventListener('change', (event) => {
    if (compact.matches && event.target.checked) setOpen(false)
  })
  addEventListener('hashchange', () => {
    const index = entries.findIndex(({ $link }) => $link.hash === location.hash)
    if (index >= 0) setCurrent(index)
  })
  if (waitingForFragment) {
    // Fragment scrolling is applied during load, after DCL. Do not let the
    // observer's initial "top of document" delivery overwrite that explicit
    // route; restamp it once the browser has restored the anchor position.
    addEventListener('load', () => {
      waitingForFragment = false
      setCurrent(initialHashIndex)
    }, { once: true })
  }

  if (!('IntersectionObserver' in window)) return
  const observer = new IntersectionObserver((changes) => {
    for (const change of changes) {
      const index = entries.findIndex(({ $station }) => $station === change.target)
      if (change.isIntersecting) intersecting.add(index)
      else intersecting.delete(index)
    }
    if (waitingForFragment) return
    if (!intersecting.size) return
    // The later station wins while two neighbours share the shallow band.
    // That changes forward when the next opening reaches the upper third,
    // and changes back only after the later opening leaves that band. It is
    // also immune to tiny font-swap scroll corrections being misread as a
    // change of reading direction.
    setCurrent(Math.max(...intersecting))
  }, {
    // A shallow reading band immediately below the sticky masthead. The next
    // station becomes current as its opening reaches the upper third.
    rootMargin: '0px 0px -65% 0px',
    threshold: 0,
  })
  entries.forEach(({ $station }) => observer.observe($station))
}
