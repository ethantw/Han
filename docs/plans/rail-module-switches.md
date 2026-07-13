# Rail 模塊開關 ＋ Web字體來源 — implementation plan

Owner-approved spec (2026-07-13 session). Four module switches in a
non-collapsible block under 度量; switch = whether the module's CSS is
imported at all (generated code adds/removes import lines; preview
toggles real per-module `<link>`s). Ziano引入/CDN來源 merge into one
「Web字體來源」 select (CDN / npm / 不使用外部Web字體) that also
carries DTJ delivery.

## Locked contracts

### Modules (bundle order — also generated-import order)

| config key | layer        | dist file              | export              | rail group (details)      |
|------------|--------------|------------------------|---------------------|---------------------------|
| semantics  | han-semantics| han.semantics(.min).css| ./styles/semantics  | 語意樣式標準化            |
| lines      | han-lines    | han.lines(.min).css    | ./styles/lines      | 行的調整                  |
| prose      | han-prose    | han.prose(.min).css    | ./styles/prose      | 長文段落間距調整（改名）  |
| fonts      | han-fonts    | han.fonts(.min).css    | ./styles/fonts      | 字體                      |

Module entry composition (new `src/han.<mod>.css`, mirroring src/han.css):
- semantics: css/semantics.css + css/semantics.with-js.css → layer(han-semantics)
- lines: css/lines.css + css/lines.with-js.css → layer(han-lines)
- prose: css/prose.css → layer(han-prose)
- fonts: css/fonts.css → layer(han-fonts), + css/fonts/em-space.css + css/fonts/zhuyin.css (unlayered, as in han.css)

Sum of the four ≡ dist/han.css. Watch for esbuild duplicate-asset
collision (em-space.woff2 emitted by both han.css and han.fonts.css):
if one build call errors, split module entries into a second
esbuild.build with the same config.

### Config model (codegen.js DEFAULTS)

- ADD `lines: true`, `fonts: true` (semantics/prose booleans already exist — reused as module switches; the old per-group 啟用 rows are REMOVED).
- RENAME `zianoDelivery: 'cdn'` → `webfontDelivery: 'cdn'|'npm'|'none'`.
- RENAME `zianoCdnSource` → `webfontCdnSource` (values unchanged).

### cssVars / codegen gating

- Module off → NO vars for that module, and NO import of it. Drop the
  old `--han-semantics: off` / `--han-prose: off` outputs entirely
  (off is now expressed by absence of the import, not a var).
- lines off → no `--han-punctuation-refinement` / `--han-text-autospace`.
- fonts off → no heritage/cursive/punct/zhuyin vars; `packages()`
  returns `{ ziano: [], dtj: false }`; baseGeneric body rule also
  gated by fonts (it rides `--han-font-alternative` from fonts.css).
- han.css import lines: all four on → single `/styles` (npm) or
  han.min.css (CDN), unchanged. Any off → per-module lines in bundle
  order for the enabled ones. All off → none (npm dep `@hanzi.pro/han.css`
  still listed iff any module on OR fallbacks OR legacyRuby).
- DTJ follows webfontDelivery like ziano: npm → dep+import; cdn →
  `<link>` (bundler tab: in the html pane beside ziano); none → absent.
  `dtjUrl(source)` honors webfontCdnSource (han.css itself stays
  jsdelivr). Preconnect hosts derived from the actual emitted URLs.

### Preview (homepage + rail-config.js)

- _home.html: single `/han/han.css` link → four links
  `/han/han.<mod>.css` each with `data-han-module="<mod>"`; the five
  static webfont links (4× shanggu + DTJ) get `data-han-webfont`.
- Module off → `link[data-han-module=<mod>]`.disabled = true (page-side
  toggle in rail-config's apply layer; same boundary as ensureFont).
- webfontDelivery 'none' → `link[data-han-webfont]`.disabled = true,
  and CASCADE with memo: save {heritage, cursive, punct}, force
  heritage/cursive→'system', punct.*→'off', write controls, disable
  the now-unreachable options (heritage/cursive `option[value=webfont]`,
  punct non-off options); leaving 'none' restores the memo. sync
  source 'reset' drops the memo without restoring (reset wins).
  zhuyinWebfont is NOT affected ('none' = no third-party font
  packages; zhuyin/em-space ship inside han.css itself).
- Module switch flip ON auto-opens `details[data-module=<key>]` — only
  at the flip (input handler), never in applyVisibility; flip OFF
  closes it. applyVisibility (state-based, idempotent) toggles
  `data-module-off` on the details → controls.css greys the fieldset
  (opacity + pointer-events none), summary stays clickable.
- data-cfg-semantics-sub / data-cfg-prose-sub hide hooks are removed
  (module-off grey replaces them); `data-cfg-ziano-cdn-source` hook →
  `data-cfg-webfont-cdn-source`, hidden unless webfontDelivery='cdn'.

### Rail template / i18n

- New non-collapsible `<section class="ControlGroup">` directly after
  度量: header {{ pgGrpModules }}, four `.Toggle` rows reusing the
  group tokens as labels (semantics/prose/lines/fonts), all checked.
- 啟用 rows removed from 語意/長文 groups; pgTogEnabled token removed
  if now unused.
- Tokens: pgGrpModules 模組/模块/Modules; pgGrpProse → 長文段落間距調整
  /长文段落间距调整/(en analog); pgWebfontDelivery Web字體來源;
  pgDeliveryNone 不使用外部Web字體; pgZianoCdnSource → key
  pgWebfontCdnSource (values CDN來源… unchanged); pgZianoDelivery
  removed. ja/ko stay hant-fallback per existing NOTE convention.
- vite FRAMEWORK_ASSETS += the 8 new css files (plain + min).

### Tests

- manual/tests/codegen.test.js: key renames + module-import cases +
  delivery none/dtj-follows-source cases.
- e2e: rail-component KEYS list (+lines +fonts, renames → 26);
  playground-configurator Request B describe → webfontDelivery;
  home.spec count comments; NEW coverage: module flip → details
  auto-open/close + data-module-off + document link.disabled +
  per-module import lines in panes; delivery none cascade (heritage
  select shows system, restore on leaving none, reset drops memo).

### Out of scope

JS per-module granularity (han.auto stays one bundle, gated by the
JAVASCRIPT group as today); docs site; /old.html.
