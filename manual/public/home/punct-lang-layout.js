/**
 * Geometry and writing-direction owner for the four-language punctuation
 * rail. Like station ①'s four newspapers, all four editions always remain in
 * one horizontal strip; there is no alternate 2×2 presentation.
 */

import { onRendered, settled } from './measure.js'

export const initPunctLangLayout = ($root = document) => {
  const $figure = $root.querySelector('.PunctLang')
  const $strip = $figure?.querySelector(':scope > ul')
  const $switch = $figure?.querySelector(':scope > .SpecimenSwitch')
  const $caption = $figure?.querySelector(':scope > figcaption')
  const $nav = $figure?.querySelector(':scope > .PunctLangNav')
  const $station = $figure?.closest('[data-station]') ?? $figure
  const $page = $figure?.closest('main') ?? document.documentElement
  const $cards = $strip ? [...$strip.children] : []
  if (!$figure || !$strip || $cards.length !== 4) return
  let writingScrollPosition = null

  const sync = settled({
    /* The sticky figure can be visibly pinned while checkVisibility() reports
       its very tall containing block as skipped. The station is the actual
       content-visibility boundary and therefore the truthful scheduling key. */
    watch: $station,
    read: () => {
      const figureRect = $figure.getBoundingClientRect()
      const containingRect = $figure.parentElement.getBoundingClientRect()
      const containingStyle = getComputedStyle($figure.parentElement)
      const containingInlineEnd = containingRect.right
        - (Number.parseFloat(containingStyle.paddingRight) || 0)

      /* The figure's chrome belongs to the ordinary copy column.  Measure its
         usable width from the actual containing block on every pass; retaining
         the last horizontal width made the pills/nav drift beyond the column
         after the sticky parent or console changed size.  The rail's bleed is
         calculated separately below and therefore does not enlarge this box. */
      const figureInlineSize = Math.max(0, containingInlineEnd - figureRect.left)

      /* .TwoEmDashes keeps a measured inline-start gutter for the dash column.
         Its grid's intrinsic width can consequently push this child beyond
         main's right edge (especially after the specimen turns vertical).
         A rail must end exactly at the page edge: content beyond that point is
         what scrolls, while its controls remain visible inside the viewport. */
      const sideConsole = matchMedia('(min-width: 52rem)').matches
      const consoleOpen = sideConsole
        && !document.querySelector('#console-collapsed')?.checked
      /* Read the painted console edge, not `--w-console`: custom properties
         preserve the authored `rem` token, so parseFloat('17.5rem') yields
         17.5 rather than the rendered 280px and misses the canvas edge. */
      const consoleInlineEnd = document.querySelector('han-console')
        ?.getBoundingClientRect().right ?? 0
      const consoleToken = getComputedStyle(document.documentElement)
        .getPropertyValue('--w-console').trim()
      const consoleNumber = Number.parseFloat(consoleToken) || 0
      const declaredConsoleInlineSize = consoleToken.endsWith('rem')
        ? consoleNumber * (Number.parseFloat(
          getComputedStyle(document.documentElement).fontSize,
        ) || 16)
        : consoleNumber
      const canvasInlineStart = consoleOpen
        ? Math.max(0, consoleInlineEnd, declaredConsoleInlineSize)
        : 0
      const canvasInlineEnd = visualViewport?.width ?? innerWidth
      const railInlineStart = Math.max(0, figureRect.left - canvasInlineStart)
      const railInlineEnd = Math.max(0, canvasInlineEnd - figureRect.right)

      return {
        railInlineStart,
        railInlineEnd,
        railCanvasInlineSize: Math.max(0, canvasInlineEnd - canvasInlineStart),
        figureInlineSize,
        stageInlineSize: Math.max(0, containingRect.width),
      }
    },
    write: ({
      railInlineStart,
      railInlineEnd,
      railCanvasInlineSize,
      figureInlineSize,
      stageInlineSize,
    }) => {
      const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      const gap = Math.min(20, Math.max(12, innerWidth * 0.015))
      const readableCard = 14 * rootSize
      const fitsFour = stageInlineSize >= 4 * readableCard + 3 * gap
      const vertical = $switch
        ?.querySelector('input[name="pl-writing"][value="vertical"]')?.checked
      const visibleCount = stageInlineSize >= 3.5 * readableCard
        ? 3.5
        : stageInlineSize >= 2.5 * readableCard
          ? 2.5
          : 1.5
      /* Vertical copy needs its natural column measure, so it is always a
         rail. Horizontal copy may use the calmer four-up grid when all four
         readable cards genuinely fit without scrolling. */
      $figure.dataset.layout = vertical || !fitsFour ? 'rail' : 'grid'
      $figure.style.setProperty('--pl-visible-count', String(visibleCount))
      $figure.style.setProperty('--pl-rail-inline-start', `${Math.round(railInlineStart)}px`)
      $figure.style.setProperty('--pl-rail-inline-end', `${Math.round(railInlineEnd)}px`)
      $figure.style.setProperty('--pl-rail-canvas-inline-size', `${Math.round(railCanvasInlineSize)}px`)
      $figure.style.setProperty('--pl-figure-inline-size', `${Math.round(figureInlineSize)}px`)
      $strip.dispatchEvent(new Event('han-strip-layout'))
    },
  })

  const watch = new ResizeObserver(sync)
  watch.observe($figure)
  watch.observe($strip)
  for (const $el of [$switch, $caption, $nav, ...$cards]) {
    if ($el) watch.observe($el)
  }
  /* Arrow visibility changes the figure's geometry, so remeasure the physical
     bleed just as station ① does when its rail controls appear/disappear. */
  if ($nav) new MutationObserver(sync).observe($nav, {
    attributes: true,
    attributeFilter: ['hidden'],
  })

  window.visualViewport?.addEventListener('resize', sync, { passive: true })
  addEventListener('resize', sync, { passive: true })
  /* Console toggling is now a pure translate: ResizeObserver correctly stays
     quiet because no box changes size, but this rail is viewport-anchored and
     therefore must refresh its physical bleed once main lands. */
  const $main = $figure.closest('main')
  const $consoleToggle = document.querySelector('#console-collapsed')
  $consoleToggle?.addEventListener('change', sync)
  $main?.addEventListener('transitionend', (event) => {
    if (event.propertyName === 'translate') sync()
  })
  const $writingInputs = $switch
    ? [...$switch.querySelectorAll('input[name="pl-writing"]')]
    : []
  const rememberScroll = () => {
    writingScrollPosition = {
      left: scrollX,
      top: scrollY,
      switchTop: $switch.getBoundingClientRect().top,
    }
  }
  for (const $input of $writingInputs) {
    $input.addEventListener('pointerdown', rememberScroll)
    $input.addEventListener('keydown', (event) => {
      if ([' ', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
        rememberScroll()
      }
    })
  }
  /* A vertical specimen is still a physically horizontal, RTL card rail.
     It owns horizontal gestures only. Vertical (and vertical-dominant
     diagonal) movement always belongs to the page, even while the pointer is
     over a card; this also lets readers continue past partially visible 3D
     type instead of getting trapped at the rail. */
  addEventListener('wheel', (event) => {
    const vertical = $switch
      ?.querySelector('input[name="pl-writing"][value="vertical"]')?.checked
    if (!vertical || $figure.dataset.layout !== 'rail') return
    /* Sticky specimens can visibly overlap a later station whose transparent
       box wins DOM hit testing.  Ownership therefore follows the painted rail
       rectangle, not event.target. */
    const rect = $strip.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right
      || event.clientY < rect.top || event.clientY > rect.bottom) return
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
    /* A natural horizontal gesture that advances an RTL rail carries the
       opposite physical sign. */
    const delta = -event.deltaX
    if (!delta) return
    const max = Math.max(0, $strip.scrollWidth - $strip.clientWidth)
    const at = -$strip.scrollLeft
    const next = Math.min(max, Math.max(0, at + delta))
    if (Math.abs(next - at) < 0.5) return
    event.preventDefault()
    $strip.scrollLeft = -next
  }, { capture: true, passive: false })

  $switch?.addEventListener('change', (event) => {
    sync()
    if (!event.target.matches('input[name="pl-writing"]')) return
    /* Writing direction defines a different reading start. Never carry the
       previous orientation's progress across: LTR and RTL both expose their
       own start at scrollLeft 0 (繁 at the leading edge). Repeat after the
       measured layout write because grid→rail can recreate the scroll range. */
    const resetRail = () => {
      $strip.scrollLeft = 0
      $strip.scrollTop = 0
    }
    resetRail()
    requestAnimationFrame(resetRail)
    setTimeout(resetRail, 180)

    if (!writingScrollPosition) return
    const { left, top, switchTop } = writingScrollPosition
    /* First undo Chrome's synchronous gross jump. */
    scrollTo({ left, top, behavior: 'instant' })
    const pin = () => {
      /* The station's document coordinate itself interpolates for several
         frames after writing-mode changes. Preserve what the reader sees, not
         an abstract scrollY, by absorbing each live rect delta into the page. */
      const delta = $switch.getBoundingClientRect().top - switchTop
      if (Number.isFinite(delta) && Math.abs(delta) > 0.01) {
        scrollBy({ top: delta, behavior: 'instant' })
      }
    }
    /* Cover the measured grid→rail write and the station's ~500ms layout
       interpolation without guessing which frame either one lands on. */
    const until = performance.now() + 750
    const hold = () => {
      pin()
      if (performance.now() < until) requestAnimationFrame(hold)
      else writingScrollPosition = null
    }
    requestAnimationFrame(hold)
  })
  document.fonts?.ready.then(sync)
  onRendered($station, sync)
  sync()
}
