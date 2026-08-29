/**
 * <han-console> — the playground configurator, as a shadow-DOM web
 * component. Thin imperative shell (the platform mandates `class extends
 * HTMLElement`); ALL logic lives in the FP modules `console-config.js`
 * (controls → config → `:root` / `body` + broadcast) and `console-metrics.js`
 * (preview sliders). This class only: attaches the shadow, adopts the
 * three stylesheets, injects the locale template, wires the reset
 * button, and relays lifecycle to those modules. That's the ts-style
 * no-classes platform exemption — keep the shell thin.
 *
 * Public contract (the cross-boundary interface — see the component
 * spec; changing it needs owner sign-off):
 *   attrs   lang (hant|hans|en|ja|ko, dynamic) · stateless (skip
 *           localStorage load+save — demo pages) · target (CSS selector,
 *           default `main` — the scope han.js's JS fallbacks are installed
 *           on; the CSS side does NOT ride it, see below) · form
 *           (side|top, pure-CSS in the shadow)
 *           (page-level collapse is NOT component API — the page's
 *           page chrome + its `:has()` state bit own it; see home.css
 *           § han-console.)
 *   event   `han-config-change` — bubbles + composed, detail
 *           `{ config, vars, source }`; config is a shallow-frozen copy
 *           (with `punct` and `metrics` cloned), vars is `cssVars(config)`,
 *           source is the触發 data-cfg-key ('init' on connect, 'reset' on
 *           reset, 'metrics' when a 度量 slider moves). config now carries
 *           `metrics { size, leading, weight }` — codegen turns any
 *           deviation into a `body { }` rule. Fired once on connect.
 *   methods reset() · reapplyFallbacks($target?) · setDemoSwitch(key, on)
 *   attr    demo — 顯示示例頁專屬開關，狀態鏡射到 <html data-demo-*>
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

/** Migrate `config.heritage` across the scalar → per-locale schema change.
 *  Pre-expansion it was a string (`webfont|system|off`) applying to hant only;
 *  now it is `{ hant, hans, ja, ko }`. An old string is carried onto `hant`
 *  (with `system` → the renamed `system-ja`); the other three take DEFAULTS.
 *  A non-object / non-string just yields DEFAULTS.heritage. */
const migrateHeritage = (stored) => {
  if (typeof stored === 'string')
    return { ...DEFAULTS.heritage, hant: stored === 'system' ? 'system-ja' : stored }
  if (stored && typeof stored === 'object')
    return { ...DEFAULTS.heritage, ...stored }
  return { ...DEFAULTS.heritage }
}

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
      heritage: migrateHeritage(config.heritage),
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
// module. controls.css and icons.css are page-shared sheets (dual-homed);
// tokens → icons → controls → console is the cascade order (tokens defines
// the --_* layer the later sheets consume; icons defines --icon-* and the
// [data-icon] primitive that controls.css's ＋/－ and console.css's chevron
// read).
let sheetsPromise = null
const loadSheets = () => {
  sheetsPromise ??= Promise.all(
    [
      new URL('./tokens.css', import.meta.url),
      new URL('../common/icons.css', import.meta.url),
      new URL('../common/controls.css', import.meta.url),
      new URL('../common/select.css', import.meta.url),
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
    if (source !== 'init' && !this.hasAttribute('stateless')) persist(detail.config, detail.vars)
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
    // `no-fallbacks`（specimen.ssr.html）：頁面的 JS 後備已經在**伺服器端**
    // 裝好了，瀏覽器這一側一支都不能再跑——在既有的 <h-char>／<h-iss> 上再
    // 包一層就是雙重加工。target 為 null 時 applyFallbacks 首行即 return，
    // CSS 那一側（:root／body 的 --han-*）照常落地，控制台其餘功能全在。
    if (this.hasAttribute('no-fallbacks')) {
      this.#target = null
      return
    }
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
    // Hand-over flag for the PAGE's pre-upgrade skeleton (home/console.css):
    // the box's panel + hairline are painted from the light DOM until this
    // moment, so the loader sits in a real console-shaped frame instead of
    // a hole. `:defined` can't do it — the element is defined long before
    // the sheets land — and this is the frame where the shadow's `:host`
    // takes the paint over, so the two never both own it.
    this.dataset.ready = ''

    // Seed config: a lang re-render keeps the live state; the FIRST mount
    // seeds from localStorage (the same key the pre-paint script restored),
    // so the toolbar's controls come up reflecting the saved config. null →
    // mountConsoleConfig falls back to DEFAULTS.
    // `stateless` attr（specimen.html 之類的 demo 頁）：不讀不寫 localStorage——
    // 每次進頁都是出廠 DEFAULTS，也不污染 home 存檔（同 origin 共用鍵）。
    const initial = this.#config?.config
      ?? (this.hasAttribute('stateless') ? undefined : readStored())
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
        // 度量落在 `body`，與生成碼的 `body { font-size; line-height;
        // font-weight }` 同一層（consoleConfig 的 CSS 落點同理，見
        // console-config.js § applyTarget）。消費端是 `.Station` / article 的
        // `var(--console-metric-…, inherit)`，繼承得到，不挑落點。
        target: document.body,
        // 起始 metrics 取自剛掛載的 config 模組（lang 重渲染時保留使用者偏差）；
        // onChange 把滑桿快照寫回 config core，由它廣播 source:'metrics'。
        initial: this.#config.config.metrics,
        onChange: (m) => this.#config.setMetrics(m),
      },
    )
    this.#mountDemoSwitches()
    this.#ready = true
  }

  /**
   * 示例頁專屬開關（`<han-console demo>`；模板裡的 `[data-demo-key]`）。
   *
   * 它們不進 config、不進生成碼——調的是示例頁自己的呈現。狀態鏡射成
   * `<html>` 上的 `data-demo-<key>` 屬性，因為 **`:has()` 跨不過影界**：
   * 開關進了 shadow，頁面 CSS 就再也選不到它，只能靠屬性讀。同一條路
   * console-config.js 已經替模組開關走過（`data-han-module-*`）。
   *
   * 方向是**屬性 → 控件**：頁面可以在 <html> 上先寫好初值（深色的
   * pre-paint 還原就靠這個，免 FOUC），元件掛載時照著把 checkbox 撥對，
   * 而不是反過來讓晚到的元件把畫面推翻一次。
   */
  #mountDemoSwitches() {
    const $root = document.documentElement
    for (const $el of this.shadowRoot.querySelectorAll('[data-demo-key]')) {
      const attr = `data-demo-${$el.dataset.demoKey}`
      if ($root.hasAttribute(attr) !== $el.checked) $el.checked = $root.hasAttribute(attr)
      $el.addEventListener('input', () => {
        $root.toggleAttribute(attr, $el.checked)
        this.dispatchEvent(new CustomEvent('han-demo-change', {
          bubbles: true,
          composed: true,
          detail: { key: $el.dataset.demoKey, on: $el.checked },
        }))
      })
    }
  }

  /** 從外部撥一顆示例開關（供頁面與 console 內建控件對點，如書寫方向）。 */
  setDemoSwitch(key, on) {
    const $el = this.shadowRoot?.querySelector(`[data-demo-key="${key}"]`)
    if (!$el || $el.checked === on) return
    $el.checked = on
    $el.dispatchEvent(new Event('input', { bubbles: true }))
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
