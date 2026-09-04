/**
 * Console visibility — one hidden checkbox as layout state, one real button
 * as its accessible control.
 *
 * The LAYOUT is pure CSS via `body:has(#console-collapsed:checked)`
 * (home/console.css). What the bit
 * MEANS depends on the form the console is in — collapsed in the side column,
 * on stage in the floating panel — so each form remembers it under its own
 * key, with its own default: the column comes up open, the panel does not.
 *
 * The checkbox's INITIAL state is restored by a pre-paint inline script right
 * next to it in `_home.html` (no flash — same pattern as the theme checkbox);
 * this module persists future flips, re-seeds the bit when the window crosses
 * the boundary between the two forms, and closes the panel on Escape (a
 * non-modal dialog doesn't do that for itself).
 */
const SIDE_FORM = '(min-width: 52rem)'
const KEY = { side: 'han-console-collapsed', panel: 'han-console-panel-open' }
const DISCOVERED_KEY = 'han-console-discovered'

const read = (key) => {
  try {
    return localStorage.getItem(key) === '1'
  } catch (e) {
    return false
  }
}

const write = (key, on) => {
  try {
    localStorage.setItem(key, on ? '1' : '0')
  } catch (e) {
    /* ignore */
  }
}

export const initConsoleCollapse = () => {
  const $box = document.querySelector('#console-collapsed')
  const $toggle = document.querySelector('.ConsoleToggle')
  if (!$box || !$toggle) return

  const $panel = document.querySelector('.ConsolePanel')
  const $close = $panel?.querySelector('.Close')
  const $prompts = document.querySelectorAll('[data-console-prompt]')
  const side = matchMedia(SIDE_FORM)
  const keyNow = () => (side.matches ? KEY.side : KEY.panel)
  const isOpen = () => (side.matches ? !$box.checked : $box.checked)
  let flashTimer

  const flash = () => {
    const $surface = side.matches ? $panel?.querySelector('han-console') : $panel
    if (!$surface) return

    clearTimeout(flashTimer)
    $surface.removeAttribute('data-console-flash')
    requestAnimationFrame(() => {
      $surface.setAttribute('data-console-flash', '')
      flashTimer = setTimeout(() => {
        $surface.removeAttribute('data-console-flash')
      }, 720)
    })
  }

  /* A prompt is allowed to open the console and then acknowledge itself, but
     the acknowledgement must begin on the visible surface.  In the side form
     that means waiting for the slide-in transition; the compact panel has no
     transition, so two frames give its display change one paint before the
     flash starts.  The timeout is the reduced-motion / interrupted-transition
     escape hatch. */
  const flashAfterOpen = () => {
    if (!side.matches) {
      const $surface = $panel
      if (!$surface) return
      let timer
      const done = () => {
        clearTimeout(timer)
        $surface.removeEventListener('animationend', onAnimationEnd)
        flash()
      }
      const onAnimationEnd = (event) => {
        if (event.target === $surface && event.animationName === 'console-panel-enter') done()
      }

      $surface.addEventListener('animationend', onAnimationEnd)
      // Reduced motion skips the entry animation; a frame still puts the
      // panel on stage before the acknowledgement begins.
      timer = setTimeout(done, 280)
      return
    }

    const $surface = $panel?.querySelector('han-console')
    if (!$surface) return
    let timer
    const done = () => {
      clearTimeout(timer)
      $surface.removeEventListener('transitionend', onTransitionEnd)
      flash()
    }
    const onTransitionEnd = (event) => {
      if (event.target === $surface && event.propertyName === 'translate') done()
    }

    $surface.addEventListener('transitionend', onTransitionEnd)
    timer = setTimeout(done, 340)
  }

  const markPanelOpening = () => {
    if (side.matches || !$panel) return
    let timer
    const clear = (event) => {
      if (event && (event.target !== $panel || event.animationName !== 'console-panel-enter')) return
      clearTimeout(timer)
      $panel.removeEventListener('animationend', clear)
      $panel.removeAttribute('data-console-opening')
    }

    $panel.setAttribute('data-console-opening', '')
    $panel.addEventListener('animationend', clear)
    timer = setTimeout(clear, 280)
  }

  const markPanelClosing = () => {
    if (side.matches || !$panel) return
    let timer
    const clear = (event) => {
      if (event && (event.target !== $panel || event.animationName !== 'console-panel-leave')) return
      clearTimeout(timer)
      $panel.removeEventListener('animationend', clear)
      $panel.removeAttribute('data-console-closing')
    }

    $panel.setAttribute('data-console-closing', '')
    $panel.addEventListener('animationend', clear)
    timer = setTimeout(clear, 220)
  }

  const sync = ({ discover = false } = {}) => {
    const open = isOpen()
    const label = open ? $toggle.dataset.labelClose : $toggle.dataset.labelOpen
    $toggle.setAttribute('aria-expanded', String(open))
    if (label) {
      $toggle.setAttribute('aria-label', label)
      $toggle.title = label
    }

    // Translated-offscreen desktop controls must not remain in the tab order
    // or accessibility tree; the mobile form is display:none as well.
    if ($panel) {
      $panel.toggleAttribute('inert', !open)
      if (open) $panel.removeAttribute('aria-hidden')
      else $panel.setAttribute('aria-hidden', 'true')
    }

    if (!open && $panel?.contains(document.activeElement)) $toggle.focus()

    if (discover && open) {
      document.documentElement.dataset.consoleDiscovered = ''
      write(DISCOVERED_KEY, true)
    }
  }

  $box.addEventListener('change', () => {
    // Opening the compact panel can come from its header handle or from an
    // inline prompt.  Key the entrance to the state change itself so both
    // routes receive the same motion.
    if (isOpen()) markPanelOpening()
    else markPanelClosing()
    write(keyNow(), $box.checked)
    sync({ discover: true })
  })

  $toggle.addEventListener('click', () => {
    $box.checked = !$box.checked
    $box.dispatchEvent(new Event('change', { bubbles: true }))
  })

  $prompts.forEach(($prompt) => {
    $prompt.addEventListener('click', () => {
      if (isOpen()) {
        flash()
        return
      }

      $box.checked = !side.matches
      $box.dispatchEvent(new Event('change', { bubbles: true }))
      flashAfterOpen()
    })
  })

  $close?.addEventListener('click', () => {
    if (!isOpen()) return
    $box.checked = side.matches
    $box.dispatchEvent(new Event('change', { bubbles: true }))
    $toggle.focus()
  })

  // Crossing the boundary is a change of meaning, not of state: re-seed the
  // bit from the form we just entered, so a phone that was rotated into the
  // side column doesn't read「面板開著」as「欄收起來」.
  side.addEventListener('change', () => {
    $box.checked = read(keyNow())
    sync()
  })

  // Escape closes the floating panel — `show()`-style dialogs don't, and in
  // the side form there is nothing overlaying anything to dismiss.
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || side.matches || !$box.checked) return
    $box.checked = false
    write(KEY.panel, false)
    sync()
    $toggle.focus()
  })

  sync()
}
