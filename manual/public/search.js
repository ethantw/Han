/**
 * Manual chrome — search dropdown wired to a Pagefind index built into
 * `/pagefind/`.  Keyboard model: ⌘K / Ctrl+K focuses, ↑↓ navigates,
 * ↵ opens, Esc closes.  Pointer model: hover highlights, click opens,
 * outside-click closes.
 *
 * Pagefind is loaded lazily on first keystroke so the manual chrome
 * paints without waiting for the 50–100 KB worker bundle.  In `vite
 * dev` the index doesn't exist (it's a build-time artefact) — the
 * import 404s, we trip an `unready` flag and show a build-it-first
 * hint.  Functional search resumes after `pnpm build:search`.
 */

const DEBOUNCE_MS = 140
const MAX_RESULTS = 8
const PAGEFIND_URL = '/pagefind/pagefind.js'

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('.SiteSearch')
  if (!root) return
  initSearch(root)
})

function initSearch(root) {
  const input = root.querySelector('input[type="search"]')
  const panel = root.querySelector(':scope > .Panel')
  const statusEl = panel?.querySelector(':scope > .Status')
  const resultsEl = panel?.querySelector(':scope > ol')
  if (!input || !panel || !resultsEl) return

  const i18n = {
    empty:   panel.dataset.emptyMsg   || 'No results',
    loading: panel.dataset.loadingMsg || 'Searching…',
    unready: panel.dataset.unreadyMsg || 'Index not built',
  }

  let pagefind  = null
  let unready   = false
  let timer     = 0
  let activeIdx = -1
  let resultEls = []
  let lastQuery = ''
  let queryToken = 0  // discards stale async results when typing fast

  /* ── pagefind loader ────────────────────────────────────────── */

  const ensurePagefind = async () => {
    if (pagefind || unready) return pagefind
    try {
      const mod = await import(/* @vite-ignore */ PAGEFIND_URL)
      // Pagefind exposes top-level methods on the module itself.
      if (typeof mod.search === 'function') {
        pagefind = mod
      } else if (mod.default && typeof mod.default.search === 'function') {
        pagefind = mod.default
      } else {
        throw new Error('pagefind module shape unrecognised')
      }
      // Restrict to the current page's language unless ambiguous.
      const lang = (document.documentElement.lang || '').split('-')[0]
      if (lang && pagefind.options) {
        await pagefind.options({ excerptLength: 24 })
      }
    } catch (err) {
      unready = true
      console.warn('[search] pagefind unavailable —', err?.message || err)
    }
    return pagefind
  }

  /* ── panel open / close ─────────────────────────────────────── */

  const open = () => {
    if (panel.hidden === false) return
    panel.hidden = false
    root.classList.add('is-open')
    input.setAttribute('aria-expanded', 'true')
  }
  const close = () => {
    if (panel.hidden) return
    panel.hidden = true
    root.classList.remove('is-open')
    input.setAttribute('aria-expanded', 'false')
    setActive(-1)
  }

  /* ── status / results render ────────────────────────────────── */

  const setStatus = msg => { statusEl.textContent = msg || '' }

  const renderResults = items => {
    resultsEl.innerHTML = ''
    resultEls = items.map((it, i) => {
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.className = 'Result'
      a.id = `search-result-${i}`
      a.href = it.url
      a.setAttribute('role', 'option')
      a.dataset.idx = String(i)
      const crumbs = it.crumbs ? `<small class="Crumbs">${escape(it.crumbs)}</small>` : ''
      const title  = `<strong class="Title">${escape(it.title)}</strong>`
      // Pagefind excerpt is HTML with <mark> tags already in it.
      const snippet = it.excerpt
        ? `<p class="Snippet">${it.excerpt}</p>`
        : ''
      a.innerHTML = crumbs + title + snippet
      a.addEventListener('mouseenter', () => setActive(i))
      a.addEventListener('click', () => close())
      li.appendChild(a)
      return a
    })
    resultEls.forEach(el => resultsEl.appendChild(el.parentElement))
  }

  const setActive = idx => {
    activeIdx = idx
    resultEls.forEach((el, i) => el.classList.toggle('is-active', i === idx))
    if (idx >= 0 && resultEls[idx]) {
      input.setAttribute('aria-activedescendant', resultEls[idx].id)
      resultEls[idx].scrollIntoView({ block: 'nearest' })
    } else input.removeAttribute('aria-activedescendant')
  }

  /* ── search execution ───────────────────────────────────────── */

  const runSearch = async q => {
    const my = ++queryToken
    setStatus(i18n.loading)
    const pf = await ensurePagefind()
    if (my !== queryToken) return  // user kept typing

    if (!pf) {
      renderResults([])
      setStatus(i18n.unready)
      return
    }

    const out = await pf.search(q)
    if (my !== queryToken) return

    if (!out.results.length) {
      renderResults([])
      setStatus(i18n.empty)
      return
    }

    const top = out.results.slice(0, MAX_RESULTS)
    const datas = await Promise.all(top.map(r => r.data()))
    if (my !== queryToken) return

    const items = datas.map(d => ({
      url:      d.url || d.raw_url || '#',
      title:    d.meta?.title || d.url || '',
      excerpt:  d.excerpt || '',
      crumbs:   crumbsFor(d.url || ''),
    }))
    renderResults(items)
    setStatus(`${out.results.length} ${out.results.length === 1 ? 'result' : 'results'}`)
    setActive(0)
  }

  /* ── input wiring ───────────────────────────────────────────── */

  input.addEventListener('input', () => {
    const q = input.value.trim()
    clearTimeout(timer)
    if (!q) {
      lastQuery = ''
      close()
      return
    }
    if (q === lastQuery) return
    lastQuery = q
    open()
    timer = setTimeout(() => runSearch(q), DEBOUNCE_MS)
  })

  input.addEventListener('focus', () => {
    if (input.value.trim() && resultEls.length) open()
  })

  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!resultEls.length) return
      open()
      setActive((activeIdx + 1) % resultEls.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!resultEls.length) return
      setActive(activeIdx <= 0 ? resultEls.length - 1 : activeIdx - 1)
    } else if (e.key === 'Enter') {
      const el = resultEls[activeIdx]
      if (el) {
        e.preventDefault()
        location.href = el.href
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
      input.blur()
    }
  })

  /* ── ⌘K / Ctrl+K global ─────────────────────────────────────── */

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      input.focus()
      input.select()
    }
  })

  /* ── click-outside close ────────────────────────────────────── */

  document.addEventListener('mousedown', e => {
    if (!root.contains(e.target)) close()
  })
}

/* ─── helpers ──────────────────────────────────────────────────── */

const ESCAPE = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
function escape(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ESCAPE[c])
}

/**
 * Derive a crumb string from a URL path:
 *   /manual/install.html      → MANUAL
 *   /en/manual/install.html   → EN・MANUAL
 *   /                         → ''
 */
function crumbsFor(url) {
  if (!url) return ''
  const segs = url.split('/').filter(Boolean)
  segs.pop() // drop the file name
  return segs.join('・').toUpperCase()
}
