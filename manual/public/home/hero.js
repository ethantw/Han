/**
 * Hero section interactions — language switcher in the top nav,
 * the live demo specimen with feature toggles, magnifier lens,
 * and per-span hint relay.
 */

import { installFallbacks, uninstallFallbacks } from '/han/han.js'

/* ─── language switcher ─────────────────────────────────────────── */

export function initLangSwitcher() {
  const root = document.querySelector('[data-lang-switcher]')
  if (!root) return
  const trigger = root.querySelector('button')
  const menu    = root.querySelector('ul')
  if (!trigger || !menu) return

  const close = () => {
    menu.hidden = true
    trigger.setAttribute('aria-expanded', 'false')
  }
  const open = () => {
    menu.hidden = false
    trigger.setAttribute('aria-expanded', 'true')
  }

  trigger.addEventListener('click', e => {
    e.stopPropagation()
    if (menu.hidden) open(); else close()
  })

  document.addEventListener('click', e => {
    if (!menu.hidden && !root.contains(e.target)) close()
  })

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) {
      close()
      trigger.focus()
    }
  })
}

/* ─── feature toggles (.Toggle input[data-feat]) ─────────────────
 * The demo is REAL Han.css: each toggle writes the framework's own
 * cascade variables onto the specimen's `.han` block and re-runs
 * `installFallbacks` on it, so what renders is exactly what a page
 * using Han.css gets — no simulated margins or painted-on marks.
 * The one exception is ruby: Han.css has no "ruby off" variable, so
 * its off-state stays a display-only `data-feat-ruby` attribute. */

export function initFeatureToggles() {
  const spec = document.querySelector('.Specimen')
  if (!spec) return
  const han = spec.querySelector('.han')

  const state = { punct: true, mix: true, ruby: true, emph: true, hang: false }

  const apply = () => {
    const { punct, hang, mix, emph, ruby } = state
    const refinement =
      punct && hang ? 'auto' : punct ? 'compress' : hang ? 'hang' : 'none'
    han.style.setProperty('--han-punctuation-refinement', refinement)
    han.style.setProperty('--han-text-autospace', mix ? 'normal' : 'no-autospace')
    han.style.setProperty('--han-em-symbol', emph ? 'circle' : 'none')
    spec.dataset.featRuby = ruby ? 'on' : 'off'
    uninstallFallbacks(han)
    installFallbacks(han)
  }

  document.querySelectorAll('.Toggle input[type="checkbox"][data-feat]').forEach(input => {
    const sync = () => {
      state[input.dataset.feat] = input.checked
      apply()
    }
    input.addEventListener('change', sync)
  })
  apply()
}

/* ─── magnifier lens (real magnification, always on) ─────────────
 *
 * The lens is a circular `.MagLens` overlay that paints a 2×-zoom
 * view of the area under the cursor.  We achieve that by cloning
 * `.Specimen` into the lens once at init, then on each `mousemove`
 * setting the clone's transform to `translate(L/2 - cx*z, L/2 - cy*z)
 * scale(z)` so the source pixel at (cx, cy) lands at the lens centre.
 *
 * Always visible; on `mouseleave` we clamp the cursor coordinates to
 * the Specimen's bounding rect and park the lens at that edge so it
 * "stays" where the cursor left.  Re-entry just keeps updating on
 * `mousemove`. */

const ZOOM = 2

export function initMagnifier() {
  const spec = document.querySelector('.Specimen')
  if (!spec) return
  const lens = spec.querySelector('[data-mag-lens]')
  if (!lens) return

  // Clone the Specimen wholesale (so paddings/border/header/.han are
  // all in the magnified view), then strip:
  //   - any nested MagLens (defensive — would recurse otherwise),
  //   - duplicate `id`s (cloneNode preserves them),
  //   - the Specimen's `data-feat-*` and `data-mag` attrs (so the
  //     clone doesn't self-gate the demo toggles; the OUTER spec's
  //     attrs gate the clone's descendants automatically since
  //     selectors like `.Specimen[data-feat-emph="on"] [data-feat="emph"]`
  //     match through the outer ancestor).
  const clone = spec.cloneNode(true)
  clone.classList.add('is-magnified-clone')
  clone.setAttribute('aria-hidden', 'true')
  clone.querySelectorAll('[data-mag-lens]').forEach(n => n.remove())
  clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'))
  for (const attr of [...clone.attributes]) {
    if (attr.name.startsWith('data-feat-') || attr.name === 'data-mag') {
      clone.removeAttribute(attr.name)
    }
  }
  // Insert before the decorative overlay spans so they paint above
  // the magnified content.
  lens.insertBefore(clone, lens.firstChild)
  lens.removeAttribute('hidden')

  // Last known cursor position within the Specimen.  `null` until the
  // first sync runs; sync seeds it to the Specimen's centre so the
  // lens has a sensible parking spot before any mouse interaction.
  let lastX = null
  let lastY = null
  let lensSize = 0

  const positionAt = (cx, cy) => {
    if (!lensSize) return
    lens.style.insetInlineStart = `${cx}px`
    lens.style.insetBlockStart  = `${cy}px`
    const tx = lensSize / 2 - cx * ZOOM
    const ty = lensSize / 2 - cy * ZOOM
    clone.style.transform = `translate(${tx}px, ${ty}px) scale(${ZOOM})`
  }

  const sync = () => {
    const r = spec.getBoundingClientRect()
    clone.style.inlineSize = `${r.width}px`
    clone.style.blockSize  = `${r.height}px`
    lensSize = lens.getBoundingClientRect().width
    if (lastX === null) {
      lastX = r.width / 2
      lastY = r.height / 2
    }
    positionAt(lastX, lastY)
  }

  // Defer first sync to next frame so layout/fonts have settled.
  requestAnimationFrame(sync)
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(sync).observe(spec)
  } else {
    window.addEventListener('resize', sync)
  }

  spec.addEventListener('mousemove', e => {
    const r = spec.getBoundingClientRect()
    lastX = e.clientX - r.left
    lastY = e.clientY - r.top
    positionAt(lastX, lastY)
  })

  spec.addEventListener('mouseleave', e => {
    const r = spec.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    lastX = Math.max(0, Math.min(r.width,  x))
    lastY = Math.max(0, Math.min(r.height, y))
    positionAt(lastX, lastY)
  })
}

/* ─── hover hint relay (data-hint → .SpecHint) ──────────────────── */

export function initSpecHint() {
  const hintBox  = document.querySelector('[data-spec-hint]')
  if (!hintBox) return
  const textEl   = hintBox.querySelector('[data-part="text"]')
  const markerEl = hintBox.querySelector('[data-part="marker"]')
  if (!textEl) return

  const defaultText   = textEl.textContent
  const defaultMarker = markerEl ? markerEl.textContent : ''

  const restore = () => {
    textEl.textContent = defaultText
    if (markerEl) markerEl.textContent = defaultMarker
    hintBox.classList.remove('is-active')
  }

  document.querySelectorAll('.Specimen [data-hint]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      textEl.textContent = el.dataset.hint
      if (markerEl) markerEl.textContent = ''
      hintBox.classList.add('is-active')
    })
    el.addEventListener('mouseleave', restore)
  })
}
