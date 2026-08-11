/**
 * Station⑤ playground — the user pastes their OWN Markdown / HTML and
 * watches han.css typeset it live.
 *
 * ONE render pipeline, both formats: marked() parses the Markdown (inline
 * and block HTML pass straight through markdown natively), then DOMPurify
 * sanitizes the resulting HTML before it reaches the preview. No MD/HTML
 * toggle — a single path covers both, which is exactly the owner's
 * 「無傷大雅的HTML＆Markdown」in one input.
 *
 * The preview is a plain `<article>` inside `main`, so the console's
 * `--han-*` config vars and the metric sliders inherit into it with zero
 * wiring (han's prose layer auto-scopes to `<article>`). The two tabs
 * (preview / code) switch purely in CSS via a radio `:has(:checked)` — JS
 * only owns the render + persistence.
 *
 * ts-style notes: pure core (`renderHtml`/`sanitize` — string in, string
 * out) is quarantined from the imperative shell (`initPlayground`);
 * `timerRef` is the one-mutable-cell (debounce handle), replaced wholesale.
 */
import { marked } from '/vendor/marked.esm.js'
import DOMPurify from '/vendor/purify.esm.js'
import { plus100EraLine } from '/home/papers-dateline.js'

const STORAGE_KEY = 'han-playground-src'
const DEBOUNCE_MS = 200

/* ── pure core ──────────────────────────────────────────────────────
 * Sanitize user HTML for the preview. DOMPurify's defaults already do the
 * whole security job — they strip `<script>`, every `on*` event handler,
 * and `javascript:` / other dangerous URI schemes — while KEEPING the
 * formatting surface han.css typesets: ruby markup, class, lang, style and
 * `data-*` are all in the default allowlist. We only pin the load-bearing
 * ones explicitly (ADD_TAGS / ADD_ATTR) so a future default change can't
 * silently drop them; nothing here re-opens an attack surface. */
const sanitize = (dirty) =>
  DOMPurify.sanitize(
    dirty,
    {
      ADD_TAGS: ['ruby', 'rt', 'rp', 'rb'],
      ADD_ATTR: ['lang', 'style', 'class'],
      ALLOW_DATA_ATTR: true,
    },
  )

// Markdown (＋ passthrough inline/block HTML) → sanitized HTML string.
const renderHtml = (src) => sanitize(marked.parse(src))


/* ── shell ──────────────────────────────────────────────────────────
 * Two independent buffers — 報導 (the shipped article) and 自訂內容 (the
 * reader's own page) — each with its own default, persisted together as
 * one JSON record `{ tab, story, custom }`. Ported from ziano's
 * playground, including the rule that earns its keep:
 *
 *   **A blank buffer is not a saved draft.** Emptying the editor is how a
 *   reader says「從頭來過」, so a whitespace-only buffer is dropped on the
 *   way in and its default comes back — never a blank page inherited from
 *   a session they already walked away from.
 *
 * localStorage guarded per web-style; a private/disabled store must not
 * break the editor, so read + write both no-op quietly on throw. */
const isBlank = (src) => (src ?? '').trim() === ''

const load = () => {
  let raw = null
  try { raw = localStorage.getItem(STORAGE_KEY) } catch (e) { return {} }
  if (raw === null) return {}
  try {
    const saved = JSON.parse(raw)
    // A pre-tabs draft was a bare string. It is the reader's own writing,
    // so it lands in 自訂內容 and 報導 keeps its pristine article.
    return typeof saved === 'string' ? { tab: 'custom', custom: saved } : saved
  } catch (e) {
    return { tab: 'custom', custom: raw }
  }
}
const save = (record) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(record)) } catch (e) { /* quota / private mode */ }
}

/**
 * Boot the playground. `$root` defaults to `document` — the station lives
 * in the page's light DOM.
 *
 * `reapplyFallbacks` is `<han-console>`'s own method, handed in by the
 * composition root (same arrangement as `initDemoLang`): every re-render
 * replaces the preview's whole subtree, and han.js's JS fallbacks live IN
 * that subtree — `<h-char>` / `<h-iss>` wrappers are what
 * `han.*.with-js.css` selects on, so a freshly rendered preview has nothing
 * for those rules to match until the passes run again over it. Re-running
 * through the console (rather than importing `installFallbacks` here) is
 * what keeps the reader's own switches honoured: fallbacks off ⇒ it
 * uninstalls instead, `manual` mode ⇒ only the passes they ticked, in order.
 */
export const initPlayground = (reapplyFallbacks, $root = document) => {
  const $editor = $root.querySelector('[data-playground]')
  if (!$editor) return

  const $src = $editor.querySelector('[data-pg-src]')
  const $preview = $editor.querySelector('[data-pg-preview]')
  if (!$src || !$preview) return

  /* ── 專心編輯模式 ──
   * The studio borrows the LIVE panes: moving nodes keeps the draft, its
   * input listeners and the rendered preview intact — nothing re-renders,
   * nothing re-mounts. On exit they return in front of the lens (the `~`
   * reveal rule needs the lens last). Esc is cancelled on purpose: the
   * mode's contract is「只有 ✕ 能退出」, so a stray Esc can't dump the
   * writer back into the scrolling page. */
  const $studio = $editor.querySelector('[data-pg-studio]')
  const $studioBody = $editor.querySelector('[data-pg-studio-body]')
  const $studioHead = $editor.querySelector('[data-pg-studio-head]')
  // the switch sits in the station head, outside [data-playground]
  const $focusBtn = $editor.closest('section')?.querySelector('[data-pg-focus]')
  const $sheet = $editor.querySelector('[data-pg-sheet]')
  if ($studio && $studioBody && $focusBtn && $sheet) {
    // The switch is a checkbox: checked ⇒ in the studio. While the modal is
    // up the switch is inert behind it, so the ✕ is the only way back —
    // it closes AND unchecks, keeping switch and reality in step.
    $focusBtn.addEventListener('change', () => {
      if (!$focusBtn.checked) return
      // The content tabs travel WITH the panes — same element, so the same
      // listener and the same buffers; a second set of radios in here would
      // be two writers on one piece of state.
      // …before the ✕, which owns the far end of that row.
      if ($tabs && $studioHead) {
        $studioHead.insertBefore($tabs, $studioHead.querySelector('[data-pg-studio-close]'))
      }
      $studioBody.append($src, $sheet)
      $studio.showModal()
      $src.focus()
    })
    $studio.addEventListener('cancel', (e) => e.preventDefault())
    $studio.querySelector('[data-pg-studio-close]').addEventListener('click', () => {
      const $lens = $editor.querySelector('.PgLens')
      $editor.insertBefore($src, $lens)
      $editor.insertBefore($sheet, $lens)
      // …and the tabs go back to the head, ahead of the focus switch.
      if ($tabs) $focusBtn.closest('.PgControls')?.prepend($tabs)
      $studio.close()
      $focusBtn.checked = false
    })
  }

  // The paper's dateline is card chrome, not editable content — refreshed
  // to «today + 100 years» on every load (papers-dateline.js owns the
  // date), so it can never go stale inside a saved draft.
  const $dateline = $editor.querySelector('[data-pg-dateline]')
  if ($dateline) {
    const { iso, text } = plus100EraLine()
    $dateline.dateTime = iso
    $dateline.textContent = text
  }

  /* ── the two content buffers ──
   * Defaults come from the DOM, not from JS: 報導 is the server-rendered
   * sample already sitting in the textarea, 自訂內容 travels as a data-*
   * on the same element. Buffers live in memory while the reader switches
   * between them, and are written out together on every keystroke. The
   * console's Reset never clears this key — it's content, not config. */
  const DEFAULTS = {
    story: $src.value,
    custom: $editor.querySelector('[data-pg-custom-default]')?.textContent ?? '',
  }
  const $tabs = $editor.closest('section')?.querySelector('[data-pg-content-tabs]')
  const saved = load()
  const buffers = {
    story: isBlank(saved.story) ? DEFAULTS.story : saved.story,
    custom: isBlank(saved.custom) ? DEFAULTS.custom : saved.custom,
  }
  let tab = saved.tab === 'custom' ? 'custom' : 'story'

  const $tabInput = $tabs?.querySelector(`[name="pg-content"][value="${tab}"]`)
  if ($tabInput) $tabInput.checked = true
  $src.value = buffers[tab]

  const persist = () => {
    buffers[tab] = $src.value
    save({ tab, ...buffers })
  }

  /* ── fitSheet — how wide the sheet is, and where it gets cut ────────
   * A sheet that fits its grid track stays in it. One that doesn't widens
   * to the WINDOW's right edge and gets its last visible column cut in
   * half: a page ending mid-column is the only honest way to say「還有右邊」
   * without drawing an arrow at the reader.
   *
   * Two numbers CSS can't reach on its own (they need the viewport and the
   * used column metrics in one expression):
   *
   *   --pg-bleed             width past the grid track
   *   --pg-galley-w          the multicol box, pinned to a WHOLE number of
   *   --pg-galley-col-used   columns at a solved measure
   *
   * The solve: let k full columns, k gaps and one HALF column exactly fill
   * the visible width —
   *
   *     visible = k·c + k·g + c/2   ⇒   c = (visible − k·g) / (k + 0.5)
   *
   * `--pg-galley-col` (em) is a FLOOR, not a target: k is the largest count
   * whose solved measure still clears it, so the columns come out at or
   * above the design measure and never below it. Three demands meet here —
   * the right edge on the window, the cut exactly half a column, the measure
   * at least 14em — and only one of them can absorb the remainder; the
   * measure is the one that can grow without lying about anything.
   *
   *     c ≥ floor  ⟺  k ≤ (visible − floor/2) / (floor + g)
   *
   * The box is k·c + (k−1)·g — exactly k columns, no stretch — and the rest
   * of the copy flows into overflow columns beyond it, inside the card's
   * scroll.
   *
   * Pinning the box is the whole trick: a multicol box always stretches its
   * columns to fill itself, so as long as the box IS the visible width every
   * visible column is complete, and a complete last column signals nothing.
   */
  const fitSheet = () => {
    if (getComputedStyle($editor).display !== 'grid') return   // tab mode
    const $paper = $editor.querySelector('[data-pg-paper]')
    if (!$paper) return

    // Start from the honest default: the track, columns filling it whole.
    const reset = () => {
      $paper.style.setProperty('--pg-bleed', '0px')
      $paper.removeAttribute('data-pg-bled')
      $preview.style.removeProperty('--pg-galley-w')
      $preview.style.removeProperty('--pg-galley-col-used')
    }
    const overflowing = () => $paper.scrollWidth > $paper.clientWidth + 1

    reset()
    if (!overflowing()) return                  // one sheet, no scroll, no cut

    const cs = getComputedStyle($paper)
    const pad = Number.parseFloat(cs.paddingInlineStart) + Number.parseFloat(cs.paddingInlineEnd)
    const track = $paper.getBoundingClientRect()
    const room = document.documentElement.clientWidth - track.left
    if (room > track.width + 1) {
      $paper.style.setProperty('--pg-bleed', `${room - track.width}px`)
      $paper.setAttribute('data-pg-bled', '')
    }

    const gs = getComputedStyle($preview)
    const gap = Number.parseFloat(gs.columnGap) || 0
    const floorC =
      Number.parseFloat(gs.fontSize) * Number.parseFloat(gs.getPropertyValue('--pg-galley-col'))
    const visible = $paper.clientWidth - pad
    if (!Number.isFinite(floorC) || floorC <= 0 || !(visible > 0)) return

    const k = Math.max(1, Math.floor((visible - floorC / 2) / (floorC + gap)))
    const c = (visible - k * gap) / (k + 0.5)
    $preview.style.setProperty('--pg-galley-col-used', `${c}px`)
    $preview.style.setProperty('--pg-galley-w', `${k * c + (k - 1) * gap}px`)

    // Wider sheet, wider capacity: if the copy now fits, a cut column would
    // promise a next page that isn't there. Fill instead, and keep the bleed.
    if (!overflowing()) {
      $preview.style.removeProperty('--pg-galley-w')
      $preview.style.removeProperty('--pg-galley-col-used')
    }
  }

  const render = () => { $preview.innerHTML = renderHtml($src.value) }

  // Debounced + rAF-aligned re-render; persistence is immediate so a fast
  // reload never loses keystrokes.
  /* 重繪之後補跑 JS 後備（見檔頭那段），掛在 debounce 這條路上而**不是**
     `render()` 裡：首屏那次同步 render 由主控台自己的 init pass 覆蓋——它的
     作用域是整個 `main`，預覽本來就在裡面。塞進 render() 反而有害，實測
     `tests/e2e/playground-station.spec.ts` 的「主控台一撥就寫 :root」那條會
     掉：開機那一輪多一次 `await import('/han/han.js')`，把主控台的初始 sync
     推到讀者（測試）撥動控件之後，那次 init 再把值蓋回預設。 */
  const timerRef = { current: 0 }
  const scheduleRender = () => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(
      () => requestAnimationFrame(() => {
        render()
        reapplyFallbacks?.($preview)
        fitSheet()
      }),
      DEBOUNCE_MS,
    )
  }

  $src.addEventListener(
    'input',
    () => {
      persist()
      scheduleRender()
    },
  )

  /* Switching content tabs: park what is on screen, bring the other buffer
     up, redraw at once (a tab swap is not typing — there is nothing to
     debounce), and re-run the JS fallbacks over the fresh subtree. */
  $tabs?.addEventListener('change', (e) => {
    const next = e.target?.value
    if (next !== 'story' && next !== 'custom') return
    buffers[tab] = $src.value
    tab = next
    // An emptied buffer refills the moment you come back to it: a tab is a
    // page, and a page with nothing on it helps no one.
    if (isBlank(buffers[tab])) buffers[tab] = DEFAULTS[tab]
    $src.value = buffers[tab]
    persist()
    render()
    reapplyFallbacks?.($preview)
    fitSheet()
  })

  // First paint is synchronous so the preview reads as typeset content in
  // the page flow immediately (preview is the default tab).
  render()
  fitSheet()
  // The sheet is measured against the viewport, so a resize re-solves it.
  addEventListener('resize', fitSheet)
}
