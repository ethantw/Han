/**
 * <han-rail> — the playground configurator, as a shadow-DOM web
 * component. Thin imperative shell (the platform mandates `class extends
 * HTMLElement`); ALL logic lives in the FP modules `rail-config.js`
 * (controls → config → target + broadcast) and `rail-metrics.js`
 * (preview sliders). This class only: attaches the shadow, adopts the
 * three stylesheets, injects the locale template, wires the reset
 * button, and relays lifecycle to those modules. That's the ts-style
 * no-classes platform exemption — keep the shell thin.
 *
 * Public contract (the cross-boundary interface — see the component
 * spec; changing it needs owner sign-off):
 *   attrs   lang (hant|hans|en|ja|ko, dynamic) · target (CSS selector,
 *           default `main.han`) · form (side|top, pure-CSS in the shadow)
 *   event   `han-config-change` — bubbles + composed, detail
 *           `{ config, vars, source }`; config is a shallow-frozen copy,
 *           vars is `cssVars(config)`, source is the触發 data-cfg-key
 *           ('init' on connect, 'reset' on reset). Fired once on connect.
 *   methods reset() · reapplyFallbacks($target?)
 *   prop    config (the frozen copy)
 */
import { cssVars } from '/home/codegen.js'
import { TEMPLATES } from '/home/rail-templates.js'
import { mountRailConfig } from '/components/rail-config.js'
import { mountRailMetrics } from '/components/rail-metrics.js'

const LOCALES = ['hant', 'hans', 'en', 'ja', 'ko']

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
// controls → rail is the cascade order (tokens defines the --_* layer
// both later sheets consume).
let sheetsPromise = null
const loadSheets = () => {
  sheetsPromise ??= Promise.all(
    [
      new URL('./tokens.css', import.meta.url),
      new URL('../home/controls.css', import.meta.url),
      new URL('./rail.css', import.meta.url),
    ].map(async (url) => {
      const css = await (await fetch(url)).text()
      const sheet = new CSSStyleSheet()
      sheet.replaceSync(css)
      return sheet
    }),
  )
  return sheetsPromise
}

class HanRail extends HTMLElement {
  static observedAttributes = ['lang', 'target']

  #config = null
  #metrics = null
  #target = null
  #detail = null
  #ready = false
  #warned = false

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' })
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
      config: Object.freeze({ ...config, punct: { ...config.punct } }),
      vars: cssVars(config),
      source,
    }
    this.#detail = detail.config
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
    const sel = this.getAttribute('target') || 'main.han'
    this.#target = document.querySelector(sel)
    if (!this.#target && !this.#warned) {
      this.#warned = true
      console.warn(`<han-rail>: target "${sel}" not found — rendering without applying.`)
    }
  }

  async #render() {
    // FOUC guard: sheets ready BEFORE any markup is injected.
    const sheets = await loadSheets()
    this.shadowRoot.adoptedStyleSheets = sheets

    // Preserve config across a lang re-render (fresh controls, same state).
    const initial = this.#config?.config
    const locale = resolveLocale(this)
    const tpl = TEMPLATES[locale] ?? TEMPLATES.hant
    this.shadowRoot.replaceChildren(
      document.createRange().createContextualFragment(tpl),
    )

    this.#resolveTarget()
    this.#config = mountRailConfig(
      {
        root: this.shadowRoot,
        target: this.#target,
        dispatch: this.#dispatch,
        initial,
      },
    )
    this.#metrics = mountRailMetrics(
      {
        root: this.shadowRoot,
        target: this.#target,
      },
    )
    this.#ready = true
  }

  // ── public API ──
  // No UI button anymore (per-control 「使用預設値」 buttons replaced the
  // global reset — owner call); the method stays public API.
  reset() {
    this.#config?.reset()
    this.#metrics?.reset()
  }

  reapplyFallbacks($target) {
    return this.#config?.reapplyFallbacks($target)
  }

  get config() {
    return this.#detail
  }
}

customElements.define('han-rail', HanRail)
