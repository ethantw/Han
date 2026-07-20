import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULTS, MODULES, cssVars, packages, renderCDN, renderBundler, renderInline,
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
  // fallbacks 出廠即開（owner call）——測的是「兩個 JS 開關都關」這個狀態本
  // 身，不是出廠預設，故顯式覆寫兩者為 false。
  const c = cfg({ fallbacks: false, legacyRuby: false })
  assert.ok(!paneCode(renderCDN(c), 'html').includes('<script'))
  assert.ok(!paneCode(renderBundler(c, 'pnpm'), 'js').includes('han.css/auto'))
})

test('關語意 → 不再輸出 --han-semantics（off 由缺席表達，無任何變數）', () => {
  assert.deepEqual(cssVars(cfg({ semantics: false })), [])
})

test('semantics off → 兩分頁任何 pane 皆無 --han-semantics 殘留', () => {
  const c = cfg({ semantics: false })
  for (const p of [...renderCDN(c), ...renderBundler(c, 'pnpm')])
    assert.ok(!p.code.includes('--han-semantics'))
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
    [],
  )
})

test('掛✓擠✗ → refinement: hang；掛✗擠✗ → none', () => {
  assert.deepEqual(cssVars(cfg({ squeeze: false })), [['--han-punctuation-refinement', 'hang']])
  assert.deepEqual(cssVars(cfg({ hang: false, squeeze: false })), [['--han-punctuation-refinement', 'none']])
})

test('lines off → 不輸出 refinement／autospace 變數', () => {
  assert.deepEqual(
    cssVars(cfg({ lines: false, hang: false, squeeze: false, autospace: 'off' })),
    [],
  )
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

test('fonts off → 無字體變數、套件表全空、兩分頁皆無 ziano／dtj', () => {
  const c = cfg({ fonts: false })
  assert.deepEqual(cssVars(c), [])
  assert.deepEqual(packages(c), { ziano: [], dtj: false })
  for (const p of [...renderCDN(c), ...renderBundler(c, 'pnpm')]) {
    assert.ok(!p.code.includes('webfonts-'))
    assert.ok(!p.code.includes('diantenjeom'))
  }
})

test('zhuyin webfont off → 覆寫 --han-font-zhuyin-serif', () => {
  assert.deepEqual(
    cssVars(cfg({ zhuyinWebfont: false })),
    [['--han-font-zhuyin-serif', 'cursive, serif']],
  )
})

test('prose 自訂作用選擇器 → cdn css pane 含額外規則；prose off → 不輸出 --han-prose', () => {
  const css = paneCode(renderCDN(cfg({ proseScope: 'main.doc' })), 'css')
  assert.ok(css.includes('main.doc { --han-prose: on; }'))
  assert.deepEqual(cssVars(cfg({ prose: false })), [])
})

test('CDN：勾後備 → html pane 含 han.auto script；勾 legacyRuby → module script 呼叫', () => {
  const withFallbacks = paneCode(renderCDN(cfg({ fallbacks: true })), 'html')
  assert.ok(withFallbacks.includes('han.auto.min.js'))
  const withRuby = paneCode(renderCDN(cfg({ legacyRuby: true })), 'html')
  assert.ok(withRuby.includes('transpileRuby'))
})

test('bundler：pm 切換 + webfontDelivery=cdn（預設）→ 安裝清單不含 ziano／dtj 套件', () => {
  const bash = paneCode(renderBundler(DEFAULTS, 'yarn'), 'bash')
  assert.ok(bash.startsWith('yarn add @hanzi.pro/han.css'))
  assert.ok(!bash.includes('@hanzi.pro/webfonts-shanggu-sans'))
  assert.ok(!bash.includes('@hanzi.pro/diantenjeom'))
})

test('heritage/cursive 模式 system|off → 對應變數', () => {
  assert.deepEqual(
    cssVars(cfg({ heritage: 'system' })),
    [['--han-use-heritage-glyphs-for-hant', 'system']],
  )
  assert.deepEqual(cssVars(cfg({ cursive: 'off' })), [['--han-use-cursive', 'off']])
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

/* ── 度量 slider → body 規則 ──────────────────────────────────
 * 字級/行距/字重只在偏離出廠基準時進生成碼，合成單一 body { }（baseGeneric
 * serif 的 font-family 也併入同一條）。無偏差 → 無 body 規則。 */

test('度量偏差（size 18／leading 1.6）→ css pane 含 body 塊，無 :root（無變數偏差）', () => {
  const c = cfg({ metrics: { size: 18, leading: 1.6, weight: 400 } })
  const css = paneCode(renderCDN(c), 'css')
  assert.ok(css.includes('font-size: 18px'))
  assert.ok(css.includes('line-height: 1.6'))
  assert.ok(!css.includes(':root'))            // 無 --han-* 變數偏差
  assert.equal((css.match(/body \{/g) ?? []).length, 1)
})

test('度量 leading 整數/小數格式（2 → "2"、1.8 → "1.8"）', () => {
  assert.ok(paneCode(renderCDN(cfg({ metrics: { size: 16, leading: 2, weight: 400 } })), 'css')
    .includes('line-height: 2;'))
  assert.ok(paneCode(renderCDN(cfg({ metrics: { size: 16, leading: 1.8, weight: 400 } })), 'css')
    .includes('line-height: 1.8;'))
})

test('度量偏差 ＋ baseGeneric serif → 單一 body 規則含 font-family 與度量行（不重複 body）', () => {
  const c = cfg({ baseGeneric: 'serif', metrics: { size: 18, leading: 1.75, weight: 700 } })
  const css = paneCode(renderCDN(c), 'css')
  assert.ok(css.includes('font-family: var(--han-font-alternative)'))
  assert.ok(css.includes('font-size: 18px'))
  assert.ok(css.includes('font-weight: 700'))
  assert.equal((css.match(/body \{/g) ?? []).length, 1)
})

test('全預設度量 → 無 body 規則（cdn／bundler 皆同）', () => {
  assert.ok(!paneCode(renderCDN(DEFAULTS), 'css').includes('body {'))
  assert.ok(!pane(renderBundler(DEFAULTS, 'pnpm'), 'css'))
})

test('fonts off ＋ 度量偏差 → body 規則仍出（含度量、但無 font-family）', () => {
  const c = cfg({ fonts: false, metrics: { size: 18, leading: 1.75, weight: 400 } })
  const css = paneCode(renderCDN(c), 'css')
  assert.ok(css.includes('body { font-size: 18px; }'))   // 唯一宣告 → 單行
  assert.ok(!css.includes('font-family'))
})

/* ── 模組開關 → 逐模組 import ───────────────────────────────── */

test('全模組開 → 單一 han.css 入口（han.min.css／\'/styles\'），無逐模組行', () => {
  const cdnHtml = paneCode(renderCDN(DEFAULTS), 'html')
  assert.ok(cdnHtml.includes('han.min.css'))
  assert.ok(!cdnHtml.includes('han.semantics.min.css'))
  const js = paneCode(renderBundler(DEFAULTS, 'pnpm'), 'js')
  assert.ok(js.includes("import '@hanzi.pro/han.css/styles'"))
  assert.ok(!js.includes('/styles/'))
})

test('任一模組 off → CDN html 列啟用模組的逐一 min.css；npm js 列逐一 import', () => {
  const c = cfg({ prose: false })          // 啟用 semantics／lines／fonts
  const cdnHtml = paneCode(renderCDN(c), 'html')
  assert.ok(!cdnHtml.includes('/han.min.css'))
  for (const m of ['semantics', 'lines', 'fonts'])
    assert.ok(cdnHtml.includes(`han.${m}.min.css`), `缺 han.${m}.min.css`)
  assert.ok(!cdnHtml.includes('han.prose.min.css'))

  const js = paneCode(renderBundler(c, 'pnpm'), 'js')
  for (const m of ['semantics', 'lines', 'fonts'])
    assert.ok(js.includes(`import '@hanzi.pro/han.css/styles/${m}'`), `缺 /styles/${m}`)
  assert.ok(!js.includes("/styles/prose'"))
  assert.ok(!js.includes("import '@hanzi.pro/han.css/styles'"))
})

test('逐模組順序恆依 MODULES（bundle 順序）', () => {
  const c = cfg({ lines: false })          // 啟用 semantics／prose／fonts
  const js = paneCode(renderBundler(c, 'pnpm'), 'js')
  const order = ['semantics', 'prose', 'fonts']
    .map((m) => js.indexOf(`/styles/${m}'`))
  assert.deepEqual(order, [...order].sort((a, b) => a - b))
  assert.deepEqual(MODULES, ['semantics', 'lines', 'prose', 'fonts'])
})

test('全模組 off + fallbacks:false → bash pane 無 han.css 套件', () => {
  const c = cfg({ semantics: false, lines: false, prose: false, fonts: false, fallbacks: false })
  const bash = paneCode(renderBundler(c, 'pnpm'), 'bash')
  assert.ok(!bash.includes('@hanzi.pro/han.css'))
})

test('全模組 off 但勾 fallbacks → bash pane 仍列 han.css（JS 需要）', () => {
  const c = cfg({ semantics: false, lines: false, prose: false, fonts: false, fallbacks: true })
  const bash = paneCode(renderBundler(c, 'pnpm'), 'bash')
  assert.ok(bash.includes('@hanzi.pro/han.css'))
})

/* ── pane 組成本身 ─────────────────────────────────────────── */

test('cdn：panes 順序固定 html→css；全預設只有 html（css 缺席）', () => {
  assert.deepEqual(langs(renderCDN(DEFAULTS)), ['html'])
  assert.deepEqual(langs(renderCDN(cfg({ baseGeneric: 'serif' }))), ['html', 'css'])
})

test('bundler：panes 順序固定 bash→js→css→html；全預設 webfontDelivery=cdn 已含 html（css 仍缺席）', () => {
  assert.deepEqual(langs(renderBundler(DEFAULTS, 'pnpm')), ['bash', 'js', 'html'])
  const full = cfg({ baseGeneric: 'serif' })
  assert.deepEqual(langs(renderBundler(full, 'pnpm')), ['bash', 'js', 'css', 'html'])
})

test('bundler：字體全關（heritage/cursive/punct off）webfontDelivery=cdn 也不生 html pane', () => {
  const c = cfg({ heritage: 'off', cursive: 'off', punct: { hant: 'off', hans: 'off', ja: 'off', ko: 'off' } })
  assert.ok(!pane(renderBundler(c, 'pnpm'), 'html'))
})

/* ── Request B — webfont delivery + CDN source ────────────────── */

test('bundler：webfontDelivery=npm → 安裝清單 + js import 皆含 ziano 與 dtj（無 html pane）', () => {
  const c = cfg({ webfontDelivery: 'npm' })
  const bash = paneCode(renderBundler(c, 'pnpm'), 'bash')
  assert.ok(bash.includes('@hanzi.pro/webfonts-shanggu-sans'))
  assert.ok(bash.includes('@hanzi.pro/diantenjeom'))
  const js = paneCode(renderBundler(c, 'pnpm'), 'js')
  assert.ok(js.includes("import '@hanzi.pro/webfonts-shanggu-sans'"))
  assert.ok(js.includes("import '@hanzi.pro/diantenjeom'"))
  assert.ok(!pane(renderBundler(c, 'pnpm'), 'html'))
})

test('bundler：webfontDelivery=cdn（預設）→ ziano ＋ dtj 皆為 html <link>（不進 bash/js），dtj 排 ziano 後', () => {
  const c = DEFAULTS
  const html = paneCode(renderBundler(c, 'pnpm'), 'html')
  assert.ok(html.includes('webfonts-shanggu-sans'))
  assert.ok(html.includes('diantenjeom'))
  assert.ok(html.indexOf('diantenjeom') > html.indexOf('webfonts-shanggu-sans'))
  const bash = paneCode(renderBundler(c, 'pnpm'), 'bash')
  const js = paneCode(renderBundler(c, 'pnpm'), 'js')
  assert.ok(!bash.includes('diantenjeom') && !js.includes('diantenjeom'))
})

test('bundler：webfontDelivery=cdn，來源隨 webfontCdnSource', () => {
  const html = paneCode(renderBundler(DEFAULTS, 'pnpm'), 'html')
  assert.ok(html.includes('cdn.jsdelivr.net'))
  const unpkg = paneCode(renderBundler(cfg({ webfontCdnSource: 'unpkg' }), 'pnpm'), 'html')
  assert.ok(unpkg.includes('unpkg.com'))
  assert.ok(!unpkg.includes('cdn.jsdelivr.net'))
})

test('webfontDelivery=none → 兩分頁皆無 ziano／dtj', () => {
  const c = cfg({ webfontDelivery: 'none' })
  for (const p of [...renderCDN(c), ...renderBundler(c, 'pnpm')]) {
    assert.ok(!p.code.includes('webfonts-'))
    assert.ok(!p.code.includes('diantenjeom'))
  }
})

test('cdn：dtj 連結隨 webfontCdnSource（unpkg → unpkg.com），han.css 恆走 jsdelivr', () => {
  const html = paneCode(renderCDN(cfg({ webfontCdnSource: 'unpkg' })), 'html')
  assert.ok(html.includes('https://unpkg.com/@hanzi.pro/webfonts-shanggu-sans@latest'))
  assert.ok(html.includes('https://unpkg.com/@hanzi.pro/diantenjeom@latest'))
  assert.ok(html.includes('https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest'))
})

test('cdn：ziano／dtj 來源與 jsdelivr 相異時，preconnect 出兩個 host；相同時只一個', () => {
  const twoHosts = paneCode(renderCDN(cfg({ webfontCdnSource: 'esmsh' })), 'html')
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

/* ── 內嵌分頁（renderInline）── framework 的 minified bytes 不是 codegen.js
 * 自己抓的（保持零 DOM／純函式）——測試直接餵假字串當 assets，只驗生成邏輯，
 * 不驗真實檔案內容。ziano/dtj 依然是 CDN <link>，這條分頁不內嵌它們。 */

test('內嵌：無 assets、全預設 → 只有 ziano/dtj 的 <link>（webfontDelivery 預設 cdn），無 <style>/<script>', () => {
  const html = paneCode(renderInline(DEFAULTS), 'html')
  assert.ok(html.includes('<link rel="stylesheet"'))
  assert.ok(!html.includes('<style>'))
  assert.ok(!html.includes('<script'))
})

test('內嵌：webfontDelivery=none → 連 <link> 都不出（跟另兩分頁一致）', () => {
  const out = renderInline(cfg({ webfontDelivery: 'none' }))
  assert.deepEqual(out, [])
})

test('內嵌：assets.css 有內容 → 進同一顆 <style>，變數偏差接在後面', () => {
  const c = cfg({ webfontDelivery: 'none', citeTitleMarks: 'bracket' })
  const html = paneCode(renderInline(c, { css: '/* framework bytes */' }), 'html')
  const styleBody = html.match(/<style>\n([\s\S]*?)<\/style>/)[1]
  assert.ok(styleBody.startsWith('/* framework bytes */'))
  assert.ok(styleBody.includes('--han-cite-title-marks: bracket'))
})

test('內嵌：fallbacks on 但 assets.autoJs 還沒抓到 → 安全省略，不丟例外', () => {
  const c = cfg({ webfontDelivery: 'none', fallbacks: true })
  assert.doesNotThrow(() => renderInline(c, {}))
  assert.ok(!paneCode(renderInline(c, {}), 'html').includes('<script'))
})

test('內嵌：fallbacks on ＋ assets.autoJs → auto bundle 原樣貼進一顆 <script type="module">', () => {
  const c = cfg({ webfontDelivery: 'none', fallbacks: true })
  const html = paneCode(renderInline(c, { autoJs: '/* auto bundle */' }), 'html')
  assert.ok(html.includes('<script type="module">\n/* auto bundle */</script>'))
})

test('內嵌：legacyRuby on ＋ assets.hanJs → Blob 動態 import，呼叫 mod.transpileRuby', () => {
  const c = cfg({ webfontDelivery: 'none', legacyRuby: true })
  const html = paneCode(renderInline(c, { hanJs: '/* han.js bundle */' }), 'html')
  assert.ok(html.includes(JSON.stringify('/* han.js bundle */')))
  assert.ok(html.includes('new Blob([src]'))
  assert.ok(html.includes('mod.transpileRuby(document.body)'))
})
