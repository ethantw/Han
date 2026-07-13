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
 * The preview is a plain `<article>` inside `main.han`, so the rail's
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
 * localStorage guarded per web-style; a private/disabled store must not
 * break the editor, so read + write both no-op quietly on throw. */
const load = () => {
  try { return localStorage.getItem(STORAGE_KEY) } catch (e) { return null }
}
const save = (src) => {
  try { localStorage.setItem(STORAGE_KEY, src) } catch (e) { /* quota / private mode */ }
}

/**
 * Boot the playground. `$root` defaults to `document` — the station lives
 * in the page's light DOM.
 */
export const initPlayground = ($root = document) => {
  const $editor = $root.querySelector('[data-playground]')
  if (!$editor) return

  const $src = $editor.querySelector('[data-pg-src]')
  const $preview = $editor.querySelector('[data-pg-preview]')
  if (!$src || !$preview) return

  // Restore the user's own text over the server-rendered sample. The rail's
  // Reset never clears this key — it's content, not config.
  const saved = load()
  if (saved !== null) $src.value = saved

  const render = () => { $preview.innerHTML = renderHtml($src.value) }

  // Debounced + rAF-aligned re-render; persistence is immediate so a fast
  // reload never loses keystrokes.
  const timerRef = { current: 0 }
  const scheduleRender = () => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(
      () => requestAnimationFrame(render),
      DEBOUNCE_MS,
    )
  }

  $src.addEventListener(
    'input',
    () => {
      save($src.value)
      scheduleRender()
    },
  )

  // First paint is synchronous so the preview reads as typeset content in
  // the page flow immediately (preview is the default tab).
  render()
}
