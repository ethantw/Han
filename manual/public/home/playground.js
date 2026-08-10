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
  const $focusBtn = $editor.querySelector('[data-pg-focus]')
  const $paper = $editor.querySelector('[data-pg-paper]')
  if ($studio && $studioBody && $focusBtn && $paper) {
    $focusBtn.addEventListener('click', () => {
      $studioBody.append($src, $paper)
      $studio.showModal()
      $src.focus()
    })
    $studio.addEventListener('cancel', (e) => e.preventDefault())
    $studio.querySelector('[data-pg-studio-close]').addEventListener('click', () => {
      const $lens = $editor.querySelector('.PgLens')
      $editor.insertBefore($src, $lens)
      $editor.insertBefore($paper, $lens)
      $studio.close()
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

  // Restore the user's own text over the server-rendered sample. The console's
  // Reset never clears this key — it's content, not config.
  const saved = load()
  if (saved !== null) $src.value = saved

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
      }),
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
