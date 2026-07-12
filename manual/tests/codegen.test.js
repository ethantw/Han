import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULTS, cssVars, packages, renderCDN, renderBundler, renderImport,
} from '../public/home/codegen.js'

const cfg = (over = {}) => structuredClone({ ...DEFAULTS, ...over })

test('全預設 → 無變數偏差、:root 區塊整段省略', () => {
  assert.deepEqual(cssVars(DEFAULTS), [])
  assert.ok(!renderCDN(DEFAULTS).includes(':root'))
  assert.ok(!renderImport(DEFAULTS).includes(':root'))
})

test('未勾任何 JS → 完全無 script/import JS', () => {
  assert.ok(!renderCDN(DEFAULTS).includes('<script'))
  assert.ok(!renderBundler(DEFAULTS, 'pnpm').includes("han.css/auto"))
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
  const c = cfg({ heritageSans: 'genki', heritageSerif: 'genki' })
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

test('prose 自訂作用選擇器 → 產出額外規則；off → :root off', () => {
  const cdn = renderCDN(cfg({ proseScope: 'main.doc' }))
  assert.ok(cdn.includes('main.doc { --han-prose: on; }'))
  assert.deepEqual(cssVars(cfg({ prose: false })), [['--han-prose', 'off']])
})

test('CDN：勾後備 → han.auto script；勾 legacyRuby → module script 呼叫', () => {
  const s = renderCDN(cfg({ fallbacks: true }))
  assert.ok(s.includes('han.auto.min.js'))
  const r = renderCDN(cfg({ legacyRuby: true }))
  assert.ok(r.includes('convertLegacyRuby'))
})

test('bundler：pm 切換與最小安裝清單', () => {
  const s = renderBundler(DEFAULTS, 'yarn')
  assert.ok(s.startsWith('yarn add @hanzi.pro/han.css'))
  assert.ok(s.includes('@hanzi.pro/webfonts-shanggu-sans'))
  assert.ok(s.includes('@hanzi.pro/diantenjeom'))
})

test('@import：含等價 URL 序列；勾 JS 時附 script 提示註解', () => {
  const s = renderImport(cfg({ fallbacks: true }))
  assert.ok(s.includes('@import url('))
  assert.ok(s.includes('/*') && s.includes('<script'))
})
