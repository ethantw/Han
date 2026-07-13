import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULTS, cssVars, packages, renderCDN, renderBundler,
} from '../public/home/codegen.js'

const cfg = (over = {}) => structuredClone({ ...DEFAULTS, ...over })

/** pane-scoped helpers — panes are `{ lang, code }[]`, empty panes omitted. */
const pane = (panes, lang) => panes.find((p) => p.lang === lang)
const paneCode = (panes, lang) => pane(panes, lang)?.code ?? ''
const langs = (panes) => panes.map((p) => p.lang)

test('全預設 → 無變數偏差、css pane 整個省略（cdn／bundler 皆同）', () => {
  assert.deepEqual(cssVars(DEFAULTS), [])
  assert.ok(!pane(renderCDN(DEFAULTS), 'css'))
  assert.ok(!pane(renderBundler(DEFAULTS, 'pnpm'), 'css'))
})

test('未勾任何 JS → 完全無 script/import JS', () => {
  assert.ok(!paneCode(renderCDN(DEFAULTS), 'html').includes('<script'))
  assert.ok(!paneCode(renderBundler(DEFAULTS, 'pnpm'), 'js').includes('han.css/auto'))
})

test('關語意 → --han-semantics: off', () => {
  assert.deepEqual(cssVars(cfg({ semantics: false })), [['--han-semantics', 'off']])
})

test('語意細項：書名號/著重號輸出；semantics off 時被 gate 掉', () => {
  assert.deepEqual(
    cssVars(cfg({ citeTitleMarks: 'bracket', emSymbol: 'sesame', emPosition: 'over' })),
    [
      ['--han-cite-title-marks', 'bracket'],
      ['--han-em-symbol', 'sesame'],
      ['--han-em-dot-position', 'over right'],
    ],
  )
  assert.deepEqual(
    cssVars(cfg({ semantics: false, citeTitleMarks: 'bracket' })),
    [['--han-semantics', 'off']],
  )
})

test('掛✓擠✗ → refinement: hang；掛✗擠✗ → none', () => {
  assert.deepEqual(cssVars(cfg({ squeeze: false })), [['--han-punctuation-refinement', 'hang']])
  assert.deepEqual(cssVars(cfg({ hang: false, squeeze: false })), [['--han-punctuation-refinement', 'none']])
})

test('混排 off → no-autospace；進階 replace 原樣輸出', () => {
  assert.deepEqual(cssVars(cfg({ autospace: 'off' })), [['--han-text-autospace', 'no-autospace']])
  assert.deepEqual(cssVars(cfg({ autospace: 'replace' })), [['--han-text-autospace', 'replace']])
})

test('DTJ 逐語言覆寫只輸出偏差語言', () => {
  const vars = cssVars(cfg({ punct: { hant: 'GB', hans: 'GB', ja: 'JIS', ko: 'KV' } }))
  assert.deepEqual(vars, [['--han-punctuation-hant', 'GB']])
})

test('換傳承家族 → 覆寫 heritage 堆疊 + 套件表含該家族', () => {
  const c = cfg({ heritageFamily: 'genki' })
  const vars = Object.fromEntries(cssVars(c))
  assert.equal(vars['--han-webfont-heritage-glyphs-sans'], "'Genki Gothic', 'Genki Gothic TC'")
  const ids = packages(c).ziano
  assert.ok(ids.includes('genki-gothic') && ids.includes('genki-gothic-tc'))
  assert.ok(!ids.includes('shanggu-sans'))
})

test('heritage off → 不出 ziano sans/serif 套件；DTJ 全 off → 無 diantenjeom', () => {
  const c1 = packages(cfg({ heritage: 'off', cursive: 'off' }))
  assert.deepEqual(c1.ziano, [])
  const c2 = packages(cfg({ punct: { hant: 'off', hans: 'off', ja: 'off', ko: 'off' } }))
  assert.equal(c2.dtj, false)
})

test('zhuyin webfont off → 覆寫 --han-font-zhuyin-serif', () => {
  assert.deepEqual(
    cssVars(cfg({ zhuyinWebfont: false })),
    [['--han-font-zhuyin-serif', 'cursive, serif']],
  )
})

test('prose 自訂作用選擇器 → cdn css pane 含額外規則；off → :root off', () => {
  const css = paneCode(renderCDN(cfg({ proseScope: 'main.doc' })), 'css')
  assert.ok(css.includes('main.doc { --han-prose: on; }'))
  assert.deepEqual(cssVars(cfg({ prose: false })), [['--han-prose', 'off']])
})

test('CDN：勾後備 → html pane 含 han.auto script；勾 legacyRuby → module script 呼叫', () => {
  const withFallbacks = paneCode(renderCDN(cfg({ fallbacks: true })), 'html')
  assert.ok(withFallbacks.includes('han.auto.min.js'))
  const withRuby = paneCode(renderCDN(cfg({ legacyRuby: true })), 'html')
  assert.ok(withRuby.includes('convertLegacyRuby'))
})

test('bundler：pm 切換 + zianoDelivery=cdn（預設）→ 安裝清單不含 ziano 套件', () => {
  const bash = paneCode(renderBundler(DEFAULTS, 'yarn'), 'bash')
  assert.ok(bash.startsWith('yarn add @hanzi.pro/han.css'))
  assert.ok(!bash.includes('@hanzi.pro/webfonts-shanggu-sans'))
  assert.ok(bash.includes('@hanzi.pro/diantenjeom'))
})

test('heritage/cursive 模式 system|off → 對應變數', () => {
  assert.deepEqual(
    cssVars(cfg({ heritage: 'system' })),
    [['--han-use-heritage-glyphs-for-hant', 'system']],
  )
  assert.deepEqual(cssVars(cfg({ cursive: 'off' })), [['--han-cursive', 'off']])
})

test('ko 直排標點 off → 變數輸出', () => {
  assert.deepEqual(
    cssVars(cfg({ punct: { hant: 'MOE', hans: 'GB', ja: 'JIS', ko: 'off' } })),
    [['--han-punctuation-vertical-ko', 'off']],
  )
})

test('emPosition under → under right', () => {
  assert.deepEqual(
    cssVars(cfg({ emPosition: 'under' })),
    [['--han-em-dot-position', 'under right']],
  )
})

test('baseGeneric serif → cdn／bundler 的 css pane 皆含 body 覆寫規則', () => {
  const c = cfg({ baseGeneric: 'serif' })
  const rule = 'body { font-family: var(--han-font-alternative); }'
  assert.ok(paneCode(renderCDN(c), 'css').includes(rule))
  assert.ok(paneCode(renderBundler(c, 'pnpm'), 'css').includes(rule))
})

test('baseGeneric 預設 sans-serif → 兩分頁皆無 body 覆寫規則（css pane 缺席）', () => {
  const rule = 'body { font-family: var(--han-font-alternative); }'
  assert.ok(!paneCode(renderCDN(DEFAULTS), 'css').includes(rule))
  assert.ok(!pane(renderBundler(DEFAULTS, 'pnpm'), 'css'))
})

test('proseScope 消毒：<>{}; 剔除後進選擇器；剩空白不產規則', () => {
  const css = paneCode(renderCDN(cfg({ proseScope: 'main.doc<{};>' })), 'css')
  assert.ok(css.includes('main.doc { --han-prose: on; }'))
  const none = paneCode(renderCDN(cfg({ proseScope: '<>' })), 'css')
  assert.ok(!none.includes('--han-prose'))
})

/* ── pane 組成本身 ─────────────────────────────────────────── */

test('cdn：panes 順序固定 html→css；全預設只有 html（css 缺席）', () => {
  assert.deepEqual(langs(renderCDN(DEFAULTS)), ['html'])
  assert.deepEqual(langs(renderCDN(cfg({ baseGeneric: 'serif' }))), ['html', 'css'])
})

test('bundler：panes 順序固定 bash→js→css→html；全預設 zianoDelivery=cdn 已含 html（css 仍缺席）', () => {
  assert.deepEqual(langs(renderBundler(DEFAULTS, 'pnpm')), ['bash', 'js', 'html'])
  const full = cfg({ baseGeneric: 'serif' })
  assert.deepEqual(langs(renderBundler(full, 'pnpm')), ['bash', 'js', 'css', 'html'])
})

test('bundler：heritage/cursive 全 off 時，zianoDelivery=cdn 也不會生出 html pane（沒有 ziano 可連）', () => {
  const c = cfg({ heritage: 'off', cursive: 'off' })
  assert.ok(!pane(renderBundler(c, 'pnpm'), 'html'))
})

/* ── Request B — ziano delivery + CDN source ──────────────────── */

test('bundler：zianoDelivery=npm → 安裝清單 + js import 皆含 ziano 套件（無 html pane）', () => {
  const c = cfg({ zianoDelivery: 'npm' })
  const bash = paneCode(renderBundler(c, 'pnpm'), 'bash')
  assert.ok(bash.includes('@hanzi.pro/webfonts-shanggu-sans'))
  const js = paneCode(renderBundler(c, 'pnpm'), 'js')
  assert.ok(js.includes("import '@hanzi.pro/webfonts-shanggu-sans'"))
  assert.ok(!pane(renderBundler(c, 'pnpm'), 'html'))
})

test('bundler：zianoDelivery=cdn（預設，heritage=webfont）→ html pane 含 ziano <link>，來源隨 zianoCdnSource', () => {
  const html = paneCode(renderBundler(DEFAULTS, 'pnpm'), 'html')
  assert.ok(html.includes('cdn.jsdelivr.net'))
  assert.ok(html.includes('webfonts-shanggu-sans'))
  const unpkg = paneCode(renderBundler(cfg({ zianoCdnSource: 'unpkg' }), 'pnpm'), 'html')
  assert.ok(unpkg.includes('unpkg.com'))
  assert.ok(!unpkg.includes('cdn.jsdelivr.net'))
})

test('cdn：zianoCdnSource 只影響 ziano 連結；han.css／diantenjeom 恆走 jsdelivr', () => {
  const html = paneCode(renderCDN(cfg({ zianoCdnSource: 'unpkg' })), 'html')
  assert.ok(html.includes('https://unpkg.com/@hanzi.pro/webfonts-shanggu-sans@latest'))
  assert.ok(html.includes('https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest'))
  assert.ok(html.includes('https://cdn.jsdelivr.net/npm/@hanzi.pro/diantenjeom@latest'))
})

test('cdn：ziano 來源與 jsdelivr 相異時，preconnect 出兩個 host；相同時只一個', () => {
  const twoHosts = paneCode(renderCDN(cfg({ zianoCdnSource: 'esmsh' })), 'html')
  assert.equal((twoHosts.match(/rel="preconnect"/g) ?? []).length, 2)
  const oneHost = paneCode(renderCDN(DEFAULTS), 'html')
  assert.equal((oneHost.match(/rel="preconnect"/g) ?? []).length, 1)
})

test('楷體家族 iansui → cursive-hant swap 變數＋套件替換', () => {
  const c = cfg({ cursiveHant: 'iansui' })
  const vars = Object.fromEntries(cssVars(c))
  assert.equal(vars['--han-webfont-cursive-hant'], "'Iansui'")
  const ids = packages(c).ziano
  assert.ok(ids.includes('iansui') && !ids.includes('lxgw-wenkai-tc'))
  assert.ok(ids.includes('lxgw-wenkai') && ids.includes('klee-one'))
})
