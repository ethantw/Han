/**
 * <han-console> — the playground configurator, as a shadow-DOM web
 * component. Thin imperative shell (the platform mandates `class extends
 * HTMLElement`); ALL logic lives in the FP modules `console-config.js`
 * (controls → config → target + broadcast) and `console-metrics.js`
 * (preview sliders). This class only: attaches the shadow, adopts the
 * three stylesheets, injects the locale template, wires the reset
 * button, and relays lifecycle to those modules. That's the ts-style
 * no-classes platform exemption — keep the shell thin.
 *
 * Public contract (the cross-boundary interface — see the component
 * spec; changing it needs owner sign-off):
 *   attrs   lang (hant|hans|en|ja|ko, dynamic) · target (CSS selector,
 *           default `main`) · form (side|top, pure-CSS in the shadow)
 *           (page-level collapse is NOT component API — the page's
 *           `.ConsoleToggle` checkbox + `body:has(input:checked)` own it,
 *           dark-mode recipe; see home.css § han-console.)
 *   event   `han-config-change` — bubbles + composed, detail
 *           `{ config, vars, source }`; config is a shallow-frozen copy
 *           (with `punct` and `metrics` cloned), vars is `cssVars(config)`,
 *           source is the触發 data-cfg-key ('init' on connect, 'reset' on
 *           reset, 'metrics' when a 度量 slider moves). config now carries
 *           `metrics { size, leading, weight }` — codegen turns any
 *           deviation into a `body { }` rule. Fired once on connect.
 *   methods reset() · reapplyFallbacks($target?)
 *   prop    config (the frozen copy)
 */
import { cssVars, DEFAULTS } from '/home/codegen.js'
import { TEMPLATES } from '/home/console-templates.js'
import { mountConsoleConfig } from '/components/console-config.js'
import { mountConsoleMetrics } from '/components/console-metrics.js'

const LOCALES = ['hant', 'hans', 'en', 'ja', 'ko']

// Config persistence — same contract as the theme / console-collapsed toggles:
// the config survives reloads in localStorage, and a pre-paint inline script
// (_home.html, in <main>) restores it BEFORE first paint so a
// returning visitor never waits for this (gate-open-deferred) module. We
// store { config, vars }: `vars` is the precomputed cssVars() output the
// inline script stamps without any codegen logic.
const STORAGE_KEY = 'han-console-config'

/** Read the saved config, deep-merged OVER DEFAULTS so a config written by an
 *  older schema can't leave required keys undefined (structuredClone(initial)
 *  in the config core would otherwise carry those gaps into the controls).
 *  Returns undefined when nothing (or garbage) is stored → caller falls back
 *  to DEFAULTS. */
const readStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const { config } = JSON.parse(raw)
    if (!config || typeof config !== 'object') return undefined
    return {
      ...DEFAULTS,
      ...config,
      punct: { ...DEFAULTS.punct, ...config.punct },
      metrics: { ...DEFAULTS.metrics, ...config.metrics },
    }
  } catch {
    return undefined
  }
}

const persist = (config, vars) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ config, vars }))
  } catch {
    /* storage disabled / quota — the live config still works, just won't
       survive the reload; the pre-paint restore simply finds nothing. */
  }
}

/** Map a `lang` attribute (a locale slug OR an HTML language tag) to one
 *  of the five template slugs; null when it matches none. */
const localeOf = (raw) => {
  const v = (raw ?? '').toLowerCase()
  if (LOCALES.includes(v)) return v
  return (
    v.startsWith('zh-hant') || v.startsWith('zh-tw') || v.startsWith('zh-hk') || v === 'zh' ? 'hant'
    : v.startsWith('zh-hans') || v.startsWith('zh-cn') || v.startsWith('zh-sg') ? 'hans'
    : v.startsWith('en') ? 'en'
    : v.startsWith('ja') ? 'ja'
    : v.startsWith('ko') ? 'ko'
    : null
  )
}

/** lang attr → closest [lang] (incl. self) → document root → hant. */
const resolveLocale = (el) => {
  const fromAttr = localeOf(el.getAttribute('lang'))
  if (fromAttr) return fromAttr
  const $closest = el.closest('[lang]')
  const fromClosest = $closest && localeOf($closest.getAttribute('lang'))
  if (fromClosest) return fromClosest
  return localeOf(document.documentElement.lang) ?? 'hant'
}

// Stylesheets fetched + parsed ONCE, shared across every instance. Raw
// ESM environment (no CSS module import), URLs resolved from this
// module. controls.css is the page-shared sheet (dual-homed); tokens →
// controls → console is the cascade order (tokens defines the --_* layer
// both later sheets consume).
let sheetsPromise = null
const loadSheets = () => {
  sheetsPromise ??= Promise.all(
    [
      new URL('./tokens.css', import.meta.url),
      new URL('../home/controls.css', import.meta.url),
      new URL('./console.css', import.meta.url),
    ].map(async (url) => {
      const css = await (await fetch(url)).text()
      const sheet = new CSSStyleSheet()
      sheet.replaceSync(css)
      return sheet
    }),
  )
  return sheetsPromise
}

class HanConsole extends HTMLElement {
  static observedAttributes = ['lang', 'target']

  #config = null
  #metrics = null
  #target = null
  #detail = null
  #ready = false
  #warned = false

  connectedCallback() {
    // NB: the shadow is attached inside #render, AFTER the async sheet
    // fetch — not here. Until it attaches, the element has no shadow root,
    // so its light-DOM fallback (the 字徽 loader) keeps rendering. That's
    // what lets the loader cover the whole load, not just the paint gap.
    this.#render()
  }

  attributeChangedCallback() {
    // Initial attributes are handled by connectedCallback's first render;
    // only re-render once we're live (lang swap keeps config state,
    // target swap re-resolves the apply target).
    if (this.#ready) this.#render()
  }

  // Broadcast — the one cross-boundary interface. Frozen shallow copy so
  // subscribers can't mutate our state; `vars` is the [name,value][].
  #dispatch = (config, source) => {
    const detail = {
      config: Object.freeze({ ...config, punct: { ...config.punct }, metrics: { ...config.metrics } }),
      vars: cssVars(config),
      source,
    }
    this.#detail = detail.config
    // Persist every real change (not the connect-time 'init', which either
    // replays what's already stored or writes untouched DEFAULTS). 'reset'
    // persists too — so a returning visitor gets the reset-to-default state.
    if (source !== 'init') persist(detail.config, detail.vars)
    this.dispatchEvent(
      new CustomEvent(
        'han-config-change',
        {
          bubbles: true,
          composed: true,
          detail,
        },
      ),
    )
  }

  #resolveTarget() {
    const sel = this.getAttribute('target') || 'main'
    this.#target = document.querySelector(sel)
    if (!this.#target && !this.#warned) {
      this.#warned = true
      console.warn(`<han-console>: target "${sel}" not found — rendering without applying.`)
    }
  }

  async #render() {
    // Sheets ready BEFORE the shadow attaches — the FOUC guard AND the
    // loading hand-off in one: while this awaits, the element has no shadow,
    // so the light-DOM 字徽 loader shows; attaching the shadow (it has no
    // <slot>) atomically stops the light DOM rendering and swaps in the
    // toolbar — zero flash, and the loader spans the entire async load.
    const sheets = await loadSheets()
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' })
    this.shadowRoot.adoptedStyleSheets = sheets

    // Seed config: a lang re-render keeps the live state; the FIRST mount
    // seeds from localStorage (the same key the pre-paint script restored),
    // so the toolbar's controls come up reflecting the saved config. null →
    // mountConsoleConfig falls back to DEFAULTS.
    const initial = this.#config?.config ?? readStored()
    const locale = resolveLocale(this)
    const tpl = TEMPLATES[locale] ?? TEMPLATES.hant
    this.shadowRoot.replaceChildren(
      document.createRange().createContextualFragment(tpl),
    )

    this.#resolveTarget()
    this.#config = mountConsoleConfig(
      {
        root: this.shadowRoot,
        target: this.#target,
        dispatch: this.#dispatch,
        initial,
      },
    )
    this.#metrics = mountConsoleMetrics(
      {
        root: this.shadowRoot,
        target: this.#target,
        // 起始 metrics 取自剛掛載的 config 模組（lang 重渲染時保留使用者偏差）；
        // onChange 把滑桿快照寫回 config core，由它廣播 source:'metrics'。
        initial: this.#config.config.metrics,
        onChange: (m) => this.#config.setMetrics(m),
      },
    )
    this.#ready = true
  }

  // ── public API ──
  // No UI button anymore (per-control 「使用預設値」 buttons replaced the
  // global reset — owner call); the method stays public API.
  reset() {
    // metrics 先 reset：其 onChange → setMetrics → 廣播 source:'metrics'。再
    // config.reset() 廣播 source:'reset' 且 config 已全默認（含 metrics）——確保
    // 「最後」那次廣播是乾淨的 source:'reset' 全預設，訂閱者收斂到正確終態。
    this.#metrics?.reset()
    this.#config?.reset()
  }

  reapplyFallbacks($target) {
    return this.#config?.reapplyFallbacks($target)
  }

  get config() {
    return this.#detail
  }
}

customElements.define('han-console', HanConsole)
