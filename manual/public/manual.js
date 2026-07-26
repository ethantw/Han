/**
 * Docs-chrome handlers — sidebar toggle, theme toggle, language
 * switcher, and TOC scrollspy. Loaded as a classic (non-module)
 * script from `_layout.html` so listeners attach independently of
 * any module-loading hiccup. The pre-paint theme application stays
 * inline in `_layout.html` to avoid a flash of light on dark-saved
 * sessions.
 *
 * Selectors target `data-*` hooks rather than ids, mirroring the
 * SiteSearch / Toggle conventions elsewhere in the project. The body
 * owns the sidebar-open state under the scoped `.ManualPage.is-nav-open`
 * pair (CSS rule 8 — never a global `.nav-open` class).
 */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('[data-nav-toggle]')?.addEventListener('click', e => {
    const open = document.body.classList.toggle('is-nav-open')
    e.currentTarget.setAttribute('aria-expanded', String(open))
  })

  // The `.ThemeToggle` checkbox does the theming on its own — CSS reads
  // it through `:root:has(…)`. This only remembers the choice; the
  // initial state is restored pre-paint by the inline script beside the
  // input (_layout.html). Same 'theme' key as the homepage.
  document.querySelector('input[name="dark-mode"]')?.addEventListener('change', e => {
    try {
      localStorage.setItem('theme', e.target.checked ? 'dark' : 'light')
    } catch {
      /* private mode — the toggle still works, it just won't persist */
    }
  })

  // Language switcher — mirrors the homepage's `initLangSwitcher`
  // (manual/public/home/lang-switcher.js). Trigger toggles the `<ul hidden>`;
  // outside-click and Escape close it. Same shape as home so the CSS
  // and behaviour stay in sync.
  const langRoot = document.querySelector('[data-lang-switcher]')
  if (langRoot) {
    const trigger = langRoot.querySelector('button')
    const menu    = langRoot.querySelector('ul')
    const closeMenu = () => {
      menu.hidden = true
      trigger.setAttribute('aria-expanded', 'false')
    }
    const openMenu = () => {
      menu.hidden = false
      trigger.setAttribute('aria-expanded', 'true')
    }
    trigger.addEventListener('click', e => {
      e.stopPropagation()
      if (menu.hidden) openMenu(); else closeMenu()
    })
    document.addEventListener('click', e => {
      if (!menu.hidden && !langRoot.contains(e.target)) closeMenu()
    })
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !menu.hidden) {
        closeMenu()
        trigger.focus()
      }
    })
  }

  // Page-TOC scrollspy — toggle `aria-current="location"` on the link
  // matching the section nearest the viewport top. Cheap and synchronous;
  // no IntersectionObserver needed for the volume of headings we ship.
  const tocLinks = Array.from(document.querySelectorAll('.PageToc a[href^="#"]'))
  if (tocLinks.length > 0) {
    const targets = tocLinks
      .map(a => ({ link: a, el: document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))) }))
      .filter(t => t.el)
    const onScroll = () => {
      const y = window.scrollY + 120
      let active = targets[0]
      for (const t of targets) {
        if (t.el.offsetTop <= y) active = t
      }
      for (const t of targets) {
        if (t === active) t.link.setAttribute('aria-current', 'location')
        else t.link.removeAttribute('aria-current')
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
  }
})
