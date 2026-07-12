# Playground Configurator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 manual 首頁 playground 升級為配置器——配置 han.css 各模組 → 即時預覽 → 生成三分頁引用碼（pnpm／CDN／@import），並修正 Ziano 字體對接的 font-family bug。

**Architecture:** 單一 `config` 物件為唯一事實源；`codegen.js` 是純函數（config → 字串），與 UI 分離、可單測；`configurator.js` 做 intents（控件→config）與 apply（config→預覽變數＋按需字體 link＋輸出重繪）。沿用現有 playground 的預覽基建（chips／sliders／自訂 Markdown），汰換舊的 4-toggle data-rule 系統。

**Tech Stack:** 純 ESM JS（manual/public/ 直出、不經 bundler）、`node --test` 單測、Playwright e2e、vite（manual build）。

**規格出處:** `docs/plans/playground-configurator.md`（spec）。

**與 spec 的兩處偏差（實查後的簡化，勿照 spec §3 加 mode 變數）:**
1. `--han-webfont-zhuyin` **不新增**——`semantics.css:148` 已有 `--han-font-zhuyin-serif: 'Han Zhuyin Serif', cursive, serif`，關閉＝覆寫掉字族即可。
2. `--han-webfont-em-space` **不做**——`Han Em Space` 只被 `lines.with-js.css` 的 JS 佔位符消費（內部量字字體，關了只會劣化後備精度），不具用戶配置意義，從配置面移除。

**已核實的變數 API（codegen 的映射依據，勿再改名）:**

| 變數 | 值域（預設加粗） | 出處 |
|---|---|---|
| `--han-semantics` | **on** / off | semantics.css:85 |
| `--han-cite-title-marks` | **none** / bracket / wavy（書名號） | semantics.css:116 |
| `--han-em-symbol` | **circle** / dot / sesame / triangle（著重號符號，text-emphasis 透明代理） | semantics.css:133 |
| `--han-em-dot-position` | **under right**（ja 預設 over right；著重號位置） | semantics.css:134,165 |
| `--han-prose` | **on**(article 內自動) / off；子樹啟用寫 `<sel> { --han-prose: on }` | prose.css:19-27 |
| `--han-text-autospace` | **normal** / insert / replace / strict / no-autospace | lines.css:31 |
| `--han-punctuation-refinement` | **auto** / compress / hang / none | lines.css:52 |
| `--han-punctuation-hant/-hans/-ja` | JIS/MOE/GB/off；預設 **MOE**/**GB**/**JIS** | fonts.css:30-46 |
| `--han-punctuation-vertical-ko` | **KV** / off | fonts.css:57 |
| `--han-use-heritage-glyphs-for-hant` | **webfont** / system / off | fonts.css:82 |
| `--han-cursive` | **webfont** / system / off | fonts.css:107 |
| `--han-webfont-heritage-glyphs-sans/-serif` | 字族堆疊（Task 1 修名後） | fonts.css:158-159 |
| `--han-font-zhuyin-serif` | `'Han Zhuyin Serif', cursive, serif` | semantics.css:148 |
| `--han-install`（han.auto 專用） | **auto** / fallbacks / probes / none | han.auto.ts |

**套件／CDN 路徑（0.1.0 已發佈，一律 @latest）:**
- han（發佈後）: `https://cdn.jsdelivr.net/npm/@hanzi.pro/han.css@latest/dist/han.min.css`、JS `…/dist/han.auto.min.js`
- Ziano: `https://cdn.jsdelivr.net/npm/@hanzi.pro/webfonts-<id>@latest/swap.css`
- DTJ: `https://cdn.jsdelivr.net/npm/@hanzi.pro/diantenjeom@latest/dist/diantenjeom.css`

**傳承家族資料（roster 核實；iansui 是國字標準字體、不入傳承選單）:**

| key | 顯示名 | sans 註冊名 | serif 註冊名 | 套件 id（base, TC） |
|---|---|---|---|---|
| `shanggu` | 尚古 | `'Shanggu Sans'`, `'Shanggu Sans TC'` | `'Shanggu Serif'`, `'Shanggu Serif TC'` | shanggu-{sans,serif}(-tc) |
| `genyo` | 源樣 | `'GenYo Gothic'`, `'GenYo Gothic TC'` | `'GenYo Min'`, `'GenYo Min TC'` | genyo-{gothic,min}(-tc) |
| `genki` | 源起 | `'Genki Gothic'`, `'Genki Gothic TC'` | `'Genki Min'`, `'Genki Min TC'` | genki-{gothic,min}(-tc) |

（顯示名以 ziano `demo/index.html` 家族卡片為準——實作 Task 3 時先 grep 一次核對「源樣／源起」二詞，錯了改 i18n 字串即可，不影響結構。）

---

### Task 1: 字體對接修正（fonts.css 名字 + glyphs typo + manual 全庫 audit）

**Files:**
- Modify: `src/css/fonts.css`
- Modify: manual 下任何含錯名的 demo（grep 決定）

- [ ] **Step 1: 全庫盤點錯名**

```bash
cd /Users/yijun/Workspace/hanzi.pro/han
grep -rn "Shangu \|glyghs\|Genyo \|LXGW Wenkai" src/ manual/ --include="*.css" --include="*.html" --include="*.md" --include="*.js" | grep -v node_modules | grep -v manual/public/han
```

記下命中清單（預期主要在 `src/css/fonts.css`；manual demo 若命中一併改）。

- [ ] **Step 2: 修 src/css/fonts.css**

一次性替換（在 repo 根執行；`GenYo`／`WenKai` 大小寫、`Shanggu` 補 g、`glyphs` typo）：

```bash
sed -i '' \
  -e "s/Shangu /Shanggu /g" \
  -e "s/Genyo /GenYo /g" \
  -e "s/LXGW Wenkai/LXGW WenKai/g" \
  -e "s/heritage-glyghs/heritage-glyphs/g" \
  src/css/fonts.css
```

- [ ] **Step 3: 驗證替換完整**

```bash
grep -n "Shangu \|glyghs" src/css/fonts.css ; echo "exit=$? (期望 1 = 無命中)"
grep -cn "heritage-glyphs" src/css/fonts.css   # 期望 ≥4（@property 名 × 定義+2 消費點）
```

Step 1 若在 manual 命中，同樣以 sed 修掉後重跑本步驟含該檔。

- [ ] **Step 4: build + 現有測試**

```bash
pnpm build && pnpm test
```

Expected: build 無錯、測試全過（此改動純 CSS 字串，不觸 TS）。

- [ ] **Step 5: Commit**

```bash
git add src/css/fonts.css   # + Step 1 命中的 manual 檔
git commit -m "fix(fonts): align font-family names with ziano registrations

'Shangu' (missing g) never matched Shanggu's @font-face — the heritage
layer silently fell through to system fonts. Also GenYo/WenKai casing
and the --han-webfont-heritage-glyghs-* → -glyphs- typo."
```

---

### Task 2: `codegen.js` 純生成模組（TDD）

**Files:**
- Create: `manual/public/home/codegen.js`
- Create: `manual/tests/codegen.test.js`
- Modify: `manual/package.json`（加 test script）

- [ ] **Step 1: 確認 `convertLegacyRuby` 從主入口匯出**

```bash
grep -n "convertLegacyRuby" src/han.ts
```

Expected: 有 `export`（re-export from `./ts/semantics/ruby.ts`）。若沒有，在 `src/han.ts` 的既有 export 區塊加一行：

```ts
export { convertLegacyRuby } from './ts/semantics/ruby.ts'
```

（加了就跑 `pnpm build && pnpm test` 並入本 task 的 commit。）

- [ ] **Step 2: 寫失敗測試 `manual/tests/codegen.test.js`**

```js
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
```

- [ ] **Step 3: 跑測試確認失敗**

```bash
cd manual && node --test tests/
```

Expected: 全 FAIL（`Cannot find module …/codegen.js`）。

- [ ] **Step 4: 實作 `manual/public/home/codegen.js`**

```js
/**
 * Playground 配置器 · 純生成核心。
 * config in → string out，零 DOM——單測直跑 node --test。
 * 變數 API 對照 docs/plans/playground-configurator-impl.md 表格。
 */

const CDN = 'https://cdn.jsdelivr.net/npm/'
const SCOPE = '@hanzi.pro/'

export const HERITAGE = {
  shanggu: {
    sans:  { stack: "'Shanggu Sans', 'Shanggu Sans TC'",  pkgs: ['shanggu-sans', 'shanggu-sans-tc'] },
    serif: { stack: "'Shanggu Serif', 'Shanggu Serif TC'", pkgs: ['shanggu-serif', 'shanggu-serif-tc'] },
  },
  genyo: {
    sans:  { stack: "'GenYo Gothic', 'GenYo Gothic TC'", pkgs: ['genyo-gothic', 'genyo-gothic-tc'] },
    serif: { stack: "'GenYo Min', 'GenYo Min TC'",       pkgs: ['genyo-min', 'genyo-min-tc'] },
  },
  genki: {
    sans:  { stack: "'Genki Gothic', 'Genki Gothic TC'", pkgs: ['genki-gothic', 'genki-gothic-tc'] },
    serif: { stack: "'Genki Min', 'Genki Min TC'",       pkgs: ['genki-min', 'genki-min-tc'] },
  },
}

const CURSIVE_PKGS = ['lxgw-wenkai-tc', 'lxgw-wenkai', 'klee-one']

export const DEFAULTS = {
  semantics: true,
  citeTitleMarks: 'none',        // none|bracket|wavy（僅 semantics on 時輸出）
  emSymbol: 'circle',            // circle|dot|sesame|triangle（同上）
  emPosition: 'auto',            // auto|under|over → '<v> right'（同上）
  prose: true,
  proseScope: 'article',
  hang: true,
  squeeze: true,
  autospace: 'normal',            // normal|insert|replace|strict|off
  heritage: 'webfont',            // webfont|system|off
  heritageSans: 'shanggu',
  heritageSerif: 'shanggu',
  cursive: 'webfont',             // webfont|system|off
  punct: { hant: 'MOE', hans: 'GB', ja: 'JIS', ko: 'KV' },
  zhuyinWebfont: true,
  fallbacks: false,
  legacyRuby: false,
}

/* ── 1 · 變數偏差 ─────────────────────────────────────────── */

const refinement = ({ hang, squeeze }) =>
  hang && squeeze ? 'auto' : hang ? 'hang' : squeeze ? 'compress' : 'none'

/** 只回傳偏離出廠預設的 [prop, value] 對，順序固定。 */
export const cssVars = (c) => {
  const out = []
  if (!c.semantics) out.push(['--han-semantics', 'off'])
  if (c.semantics) {          // 語意細項：layer 關掉即失效，不輸出
    if (c.citeTitleMarks !== 'none') out.push(['--han-cite-title-marks', c.citeTitleMarks])
    if (c.emSymbol !== 'circle') out.push(['--han-em-symbol', c.emSymbol])
    if (c.emPosition !== 'auto') out.push(['--han-em-dot-position', `${c.emPosition} right`])
  }
  if (!c.prose) out.push(['--han-prose', 'off'])
  const refine = refinement(c)
  if (refine !== 'auto') out.push(['--han-punctuation-refinement', refine])
  if (c.autospace !== 'normal')
    out.push(['--han-text-autospace', c.autospace === 'off' ? 'no-autospace' : c.autospace])
  if (c.heritage !== 'webfont') out.push(['--han-use-heritage-glyphs-for-hant', c.heritage])
  if (c.heritage === 'webfont') {
    if (c.heritageSans !== 'shanggu')
      out.push(['--han-webfont-heritage-glyphs-sans', HERITAGE[c.heritageSans].sans.stack])
    if (c.heritageSerif !== 'shanggu')
      out.push(['--han-webfont-heritage-glyphs-serif', HERITAGE[c.heritageSerif].serif.stack])
  }
  if (c.cursive !== 'webfont') out.push(['--han-cursive', c.cursive])
  for (const [key, def] of [['hant', 'MOE'], ['hans', 'GB'], ['ja', 'JIS']])
    if (c.punct[key] !== def) out.push([`--han-punctuation-${key}`, c.punct[key]])
  if (c.punct.ko !== 'KV') out.push(['--han-punctuation-vertical-ko', c.punct.ko])
  if (!c.zhuyinWebfont) out.push(['--han-font-zhuyin-serif', 'cursive, serif'])
  return out
}

/** :root 區塊（含 prose 自訂作用域的附加規則）；無偏差回空字串。 */
const configCSS = (c, indent = '  ') => {
  const vars = cssVars(c)
  const rules = []
  if (vars.length)
    rules.push(`:root {\n${vars.map(([k, v]) => `${indent}${k}: ${v};`).join('\n')}\n}`)
  if (c.prose && c.proseScope.trim() && c.proseScope.trim() !== 'article')
    rules.push(`${c.proseScope.trim()} { --han-prose: on; }`)
  return rules.join('\n')
}

/* ── 2 · 套件清單 ─────────────────────────────────────────── */

/** 實際用到的套件：han 恆在；ziano 依家族/楷體；dtj 依標點是否全關。 */
export const packages = (c) => {
  const ziano = []
  if (c.heritage === 'webfont') {
    ziano.push(...HERITAGE[c.heritageSans].sans.pkgs)
    for (const p of HERITAGE[c.heritageSerif].serif.pkgs)
      if (!ziano.includes(p)) ziano.push(p)
  }
  if (c.cursive === 'webfont') ziano.push(...CURSIVE_PKGS)
  const dtj = Object.values(c.punct).some((v) => v !== 'off')
  return { ziano, dtj }
}

const zianoUrl = (id) => `${CDN}${SCOPE}webfonts-${id}@latest/swap.css`
const DTJ_URL = `${CDN}${SCOPE}diantenjeom@latest/dist/diantenjeom.css`
const HAN_CSS_URL = `${CDN}${SCOPE}han.css@latest/dist/han.min.css`
const HAN_AUTO_URL = `${CDN}${SCOPE}han.css@latest/dist/han.auto.min.js`
const HAN_JS_URL = `${CDN}${SCOPE}han.css@latest/dist/han.min.js`

const styleUrls = (c) => {
  const { ziano, dtj } = packages(c)
  return [HAN_CSS_URL, ...ziano.map(zianoUrl), ...(dtj ? [DTJ_URL] : [])]
}

/* ── 3 · 三分頁 ───────────────────────────────────────────── */

export const renderCDN = (c) => {
  const parts = []
  parts.push(
    `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>`,
    ...styleUrls(c).map((u) => `<link rel="stylesheet" href="${u}">`),
  )
  const css = configCSS(c)
  if (css) parts.push(`<style>\n${css}\n</style>`)
  if (c.fallbacks)
    parts.push(`<script type="module" src="${HAN_AUTO_URL}"></script>`)
  if (c.legacyRuby)
    parts.push(
      `<script type="module">\n` +
      `  import { convertLegacyRuby } from '${HAN_JS_URL}'\n` +
      `  convertLegacyRuby(document.body)\n` +
      `</script>`,
    )
  return parts.join('\n')
}

const PM = { npm: 'npm i', pnpm: 'pnpm add', yarn: 'yarn add' }

export const renderBundler = (c, pm = 'pnpm') => {
  const { ziano, dtj } = packages(c)
  const deps = [
    `${SCOPE}han.css`,
    ...ziano.map((id) => `${SCOPE}webfonts-${id}`),
    ...(dtj ? [`${SCOPE}diantenjeom`] : []),
  ]
  const lines = [`${PM[pm]} ${deps.join(' \\\n  ')}`, '']
  lines.push('// main.js')
  lines.push(`import '${SCOPE}han.css/styles'`)
  for (const id of ziano) lines.push(`import '${SCOPE}webfonts-${id}'`)
  if (dtj) lines.push(`import '${SCOPE}diantenjeom/dist/diantenjeom.css'`)
  if (c.fallbacks) lines.push(`import '${SCOPE}han.css/auto'`)
  if (c.legacyRuby)
    lines.push(
      `import { convertLegacyRuby } from '${SCOPE}han.css'`,
      `convertLegacyRuby(document.body)`,
    )
  const css = configCSS(c)
  if (css) lines.push('', '/* 專案全域 CSS */', css)
  return lines.join('\n')
}

export const renderImport = (c) => {
  const lines = styleUrls(c).map((u) => `@import url("${u}");`)
  const css = configCSS(c)
  if (css) lines.push('', css)
  if (c.fallbacks || c.legacyRuby)
    lines.push('', `/* JS 需另外以 <script type="module"> 引入——@import 帶不動 JS。 */`)
  return lines.join('\n')
}
```

- [ ] **Step 5: 跑測試至全過**

```bash
cd manual && node --test tests/
```

Expected: 全 PASS。失敗就對照斷言修 codegen（不改測試——測試即規格）。

- [ ] **Step 6: 給 manual 加 test script**

`manual/package.json` 的 `"scripts"` 內加：

```json
    "test": "node --test tests/",
```

- [ ] **Step 7: Commit**

```bash
git add manual/public/home/codegen.js manual/tests/codegen.test.js manual/package.json src/han.ts
git commit -m "feat(manual): configurator codegen core — pure config→snippet functions + tests"
```

---

### Task 3: 控制面板 HTML + i18n 字串

**Files:**
- Modify: `manual/home/playground.html`（汰換 4-toggle 規則區、加字體／JS 群組、加輸出面板）
- Modify: `manual/home/_data.js`（i18n 字串）

- [ ] **Step 1: 核對家族中文顯示名**

```bash
grep -B2 -A2 "genki\|genyo" /Users/yijun/Workspace/hanzi.pro/ziano/demo/index.html | grep -oE ">[^<]*[源尚][^<]*<" | head
```

以輸出為準修正下方 i18n 表中「源樣／源起」二詞（結構不變）。

- [ ] **Step 2: 讀 `manual/home/_data.js` 現有 pg* 鍵的寫法，照樣式追加下列鍵**

| key | 值（hant） |
|---|---|
| `pgGrpLayers` | 模組 |
| `pgTogSemantics` / En | 語意強化 / semantics |
| `pgTogProse` / En | 行文版式 / prose |
| `pgProseScope` | 作用選擇器 |
| `pgCiteMarks` | 書名號 |
| `pgCiteBracket` / `pgCiteWavy` | 《》乙式 / ﹏甲式 |
| `pgEmSymbol` / `pgEmPosition` | 著重號 / 著重號位置 |
| `pgEmCircle` / `pgEmDot` / `pgEmSesame` / `pgEmTriangle` | 圈 / 點 / 芝麻點 / 三角 |
| `pgEmPosAuto` / `pgEmPosUnder` / `pgEmPosOver` | 自動 / 字下 / 字上 |
| `pgGrpLines` | 行調整 |
| `pgTogHangNew` / En | 掛標點 / hanging |
| `pgTogSqueeze` / En | 標點擠壓 / squeeze |
| `pgTogAutospace` / En | 混排間距 / autospace |
| `pgAutospaceMode` | 進階模式 |
| `pgGrpFonts` | 字體 |
| `pgHeritage` / En | 傳承字形（僅繁體） / heritage |
| `pgHeritageSans` / `pgHeritageSerif` | 黑體家族 / 明體家族 |
| `pgFamShanggu` / `pgFamGenyo` / `pgFamGenki` | 尚古 / 源樣 / 源起 |
| `pgCursive` / En | 楷體 / cursive |
| `pgModeWebfont` / `pgModeSystem` / `pgModeOff` | 網頁字體 / 系統字體 / 關閉 |
| `pgGrpPunct` | 標點規範（Diantenjeom） |
| `pgPunctHant` / `pgPunctHans` / `pgPunctJa` / `pgPunctKo` | 繁體中文 / 簡體中文 / 日文 / 韓文直排 |
| `pgTogZhuyin` / En | 注音網頁字體 / zhuyin webfont |
| `pgGrpJs` | JavaScript |
| `pgTogFallbacks` / En | 舊瀏覽器後備 / installFallbacks |
| `pgTogLegacyRuby` / En | 舊式 ruby 轉換 / convertLegacyRuby |
| `pgOutTitle` | 引用碼 |
| `pgOutBundler` / `pgOutCdn` / `pgOutImport` | 打包工具 / CDN / CSS @import |
| `pgCopy` / `pgCopied` | 複製 / 已複製 |

- [ ] **Step 3: 改 `manual/home/playground.html`**

把現有「規則 toggles (4)」的整個 `<section class="ControlGroup">…</section>`（`data-pg-toggles` 那段）**替換**為下列群組（度量 sliders 與範文 chips 區塊不動）：

```html
      <!-- 模組（layer 級） -->
      <section class="ControlGroup">
        <header>{{ pgGrpLayers }}</header>
        <fieldset class="PlaygroundRules" data-cfg>
          <label class="Toggle">
            <span>{{ pgTogSemantics }} <small>{{ pgTogSemanticsEn }}</small></span>
            <input type="checkbox" data-cfg-key="semantics" checked>
          </label>
          <label class="Toggle">
            <span>{{ pgTogProse }} <small>{{ pgTogProseEn }}</small></span>
            <input type="checkbox" data-cfg-key="prose" checked>
          </label>
          <label class="Field">
            <span>{{ pgProseScope }}</span>
            <input type="text" data-cfg-key="proseScope" value="article" spellcheck="false">
          </label>
          <!-- 語意細項（semantics off 時整組隱藏） -->
          <label class="Field" data-cfg-semantics-sub>
            <span>{{ pgCiteMarks }} <small>cite</small></span>
            <select data-cfg-key="citeTitleMarks">
              <option value="none" selected>{{ pgModeOff }}</option>
              <option value="bracket">{{ pgCiteBracket }}</option>
              <option value="wavy">{{ pgCiteWavy }}</option>
            </select>
          </label>
          <label class="Field" data-cfg-semantics-sub>
            <span>{{ pgEmSymbol }} <small>em</small></span>
            <select data-cfg-key="emSymbol">
              <option value="circle" selected>{{ pgEmCircle }}</option>
              <option value="dot">{{ pgEmDot }}</option>
              <option value="sesame">{{ pgEmSesame }}</option>
              <option value="triangle">{{ pgEmTriangle }}</option>
            </select>
          </label>
          <label class="Field" data-cfg-semantics-sub>
            <span>{{ pgEmPosition }}</span>
            <select data-cfg-key="emPosition">
              <option value="auto" selected>{{ pgEmPosAuto }}</option>
              <option value="under">{{ pgEmPosUnder }}</option>
              <option value="over">{{ pgEmPosOver }}</option>
            </select>
          </label>
        </fieldset>
      </section>

      <!-- 行調整（友善開關 + 進階） -->
      <section class="ControlGroup">
        <header>{{ pgGrpLines }}</header>
        <fieldset class="PlaygroundRules" data-cfg>
          <label class="Toggle">
            <span>{{ pgTogHangNew }} <small>{{ pgTogHangNewEn }}</small></span>
            <input type="checkbox" data-cfg-key="hang" checked>
          </label>
          <label class="Toggle">
            <span>{{ pgTogSqueeze }} <small>{{ pgTogSqueezeEn }}</small></span>
            <input type="checkbox" data-cfg-key="squeeze" checked>
          </label>
          <label class="Toggle">
            <span>{{ pgTogAutospace }} <small>{{ pgTogAutospaceEn }}</small></span>
            <input type="checkbox" data-cfg-key="autospaceOn" checked>
          </label>
          <label class="Field" data-cfg-advanced hidden>
            <span>{{ pgAutospaceMode }}</span>
            <select data-cfg-key="autospaceMode">
              <option value="normal" selected>normal</option>
              <option value="insert">insert（需 JS）</option>
              <option value="replace">replace（需 JS）</option>
              <option value="strict">strict（需 JS）</option>
            </select>
          </label>
        </fieldset>
      </section>

      <!-- 字體 -->
      <section class="ControlGroup">
        <header>{{ pgGrpFonts }}</header>
        <fieldset class="PlaygroundRules" data-cfg>
          <label class="Field">
            <span>{{ pgHeritage }} <small>{{ pgHeritageEn }}</small></span>
            <select data-cfg-key="heritage">
              <option value="webfont" selected>{{ pgModeWebfont }}</option>
              <option value="system">{{ pgModeSystem }}</option>
              <option value="off">{{ pgModeOff }}</option>
            </select>
          </label>
          <label class="Field" data-cfg-heritage-family>
            <span>{{ pgHeritageSans }}</span>
            <select data-cfg-key="heritageSans">
              <option value="shanggu" selected>{{ pgFamShanggu }}</option>
              <option value="genyo">{{ pgFamGenyo }}</option>
              <option value="genki">{{ pgFamGenki }}</option>
            </select>
          </label>
          <label class="Field" data-cfg-heritage-family>
            <span>{{ pgHeritageSerif }}</span>
            <select data-cfg-key="heritageSerif">
              <option value="shanggu" selected>{{ pgFamShanggu }}</option>
              <option value="genyo">{{ pgFamGenyo }}</option>
              <option value="genki">{{ pgFamGenki }}</option>
            </select>
          </label>
          <label class="Field">
            <span>{{ pgCursive }} <small>{{ pgCursiveEn }}</small></span>
            <select data-cfg-key="cursive">
              <option value="webfont" selected>{{ pgModeWebfont }}</option>
              <option value="system">{{ pgModeSystem }}</option>
              <option value="off">{{ pgModeOff }}</option>
            </select>
          </label>
          <label class="Toggle">
            <span>{{ pgTogZhuyin }} <small>{{ pgTogZhuyinEn }}</small></span>
            <input type="checkbox" data-cfg-key="zhuyinWebfont" checked>
          </label>
        </fieldset>
      </section>

      <!-- 標點規範 -->
      <section class="ControlGroup">
        <header>{{ pgGrpPunct }}</header>
        <fieldset class="PlaygroundRules" data-cfg>
          <label class="Field"><span>{{ pgPunctHant }}</span>
            <select data-cfg-key="punct.hant">
              <option value="MOE" selected>MOE</option><option value="JIS">JIS</option>
              <option value="GB">GB</option><option value="off">{{ pgModeOff }}</option>
            </select></label>
          <label class="Field"><span>{{ pgPunctHans }}</span>
            <select data-cfg-key="punct.hans">
              <option value="GB" selected>GB</option><option value="JIS">JIS</option>
              <option value="MOE">MOE</option><option value="off">{{ pgModeOff }}</option>
            </select></label>
          <label class="Field"><span>{{ pgPunctJa }}</span>
            <select data-cfg-key="punct.ja">
              <option value="JIS" selected>JIS</option><option value="MOE">MOE</option>
              <option value="GB">GB</option><option value="off">{{ pgModeOff }}</option>
            </select></label>
          <label class="Field"><span>{{ pgPunctKo }}</span>
            <select data-cfg-key="punct.ko">
              <option value="KV" selected>KV</option><option value="off">{{ pgModeOff }}</option>
            </select></label>
        </fieldset>
      </section>

      <!-- JavaScript -->
      <section class="ControlGroup">
        <header>{{ pgGrpJs }}</header>
        <fieldset class="PlaygroundRules" data-cfg>
          <label class="Toggle">
            <span>{{ pgTogFallbacks }} <small>{{ pgTogFallbacksEn }}</small></span>
            <input type="checkbox" data-cfg-key="fallbacks">
          </label>
          <label class="Toggle">
            <span>{{ pgTogLegacyRuby }} <small>{{ pgTogLegacyRubyEn }}</small></span>
            <input type="checkbox" data-cfg-key="legacyRuby">
          </label>
        </fieldset>
      </section>
```

再在 `#playground` 內、`.Body` 收合 `</div>` 之後追加輸出面板：

```html
    <!-- ─── 引用碼輸出 ───────────────────────────────────────── -->
    <section class="Snippets" data-out>
      <header class="SnippetsHead">
        <h3>{{ pgOutTitle }}</h3>
        <nav data-out-tabs>
          <button type="button" class="Tab is-active" data-out-tab="bundler">{{ pgOutBundler }}</button>
          <button type="button" class="Tab" data-out-tab="cdn">{{ pgOutCdn }}</button>
          <button type="button" class="Tab" data-out-tab="import">{{ pgOutImport }}</button>
        </nav>
        <select data-out-pm hidden>
          <option value="pnpm" selected>pnpm</option>
          <option value="npm">npm</option>
          <option value="yarn">yarn</option>
        </select>
        <button type="button" class="Copy" data-out-copy>{{ pgCopy }}</button>
      </header>
      <pre data-out-code><code></code></pre>
    </section>
```

- [ ] **Step 4: dev server 目視**

```bash
cd manual && pnpm dev
```

打開 http://localhost:5173（vite 預設埠，以輸出為準）：控制群組全數渲染、i18n 無 `{{ }}` 殘留（JS 尚未接線，控件無作用是預期）。

- [ ] **Step 5: Commit**

```bash
git add manual/home/playground.html manual/home/_data.js
git commit -m "feat(manual): configurator control panel + output panel markup & i18n"
```

---

### Task 4: `configurator.js` — intents ＋ apply（預覽接線）

**Files:**
- Create: `manual/public/home/configurator.js`
- Modify: `manual/public/home/playground.js`（刪 data-rule toggle 邏輯、初始化 configurator）
- Modify: `manual/public/home.js`（僅當 init 簽名變動）
- Modify: `manual/public/home/playground.css`（刪 511-514 的 data-rule 橋、補新控件/輸出面板樣式）

- [ ] **Step 1: 寫 `manual/public/home/configurator.js`**

```js
/**
 * 配置器 intents + apply。
 * config（單一事實源）→ ① 預覽容器變數 ② 按需字體 <link> ③ 輸出面板重繪。
 * 生成邏輯全在 codegen.js（純函數）；本檔只碰 DOM。
 */
import {
  DEFAULTS, HERITAGE, cssVars, packages,
  renderCDN, renderBundler, renderImport,
} from '/home/codegen.js'

const ZIANO_CDN = (id) =>
  `https://cdn.jsdelivr.net/npm/@hanzi.pro/webfonts-${id}@latest/swap.css`

/* ── 按需字體載入（去重） ── */
const loaded = new Set()
const ensureFont = (id) => {
  if (loaded.has(id)) return
  loaded.add(id)
  document.head.insertAdjacentHTML(
    'beforeend',
    `<link rel="stylesheet" href="${ZIANO_CDN(id)}">`,
  )
}

/* ── config 讀寫 ── */
const setPath = (obj, path, value) => {
  const keys = path.split('.')
  const last = keys.pop()
  keys.reduce((o, k) => o[k], obj)[last] = value
}

const readControl = (el) =>
  el.type === 'checkbox' ? el.checked : el.value

/* ── apply：config → 預覽變數 ── */
const applyPreview = (config, body) => {
  const vars = cssVars(config)
  // 先清舊值再套偏差——預設值＝變數不在，交給 @property initial-value
  for (const prop of [
    '--han-semantics', '--han-prose', '--han-punctuation-refinement',
    '--han-text-autospace', '--han-use-heritage-glyphs-for-hant',
    '--han-webfont-heritage-glyphs-sans', '--han-webfont-heritage-glyphs-serif',
    '--han-cursive', '--han-punctuation-hant', '--han-punctuation-hans',
    '--han-punctuation-ja', '--han-punctuation-vertical-ko',
    '--han-font-zhuyin-serif',
    '--han-cite-title-marks', '--han-em-symbol', '--han-em-dot-position',
  ]) body.style.removeProperty(prop)
  for (const [prop, value] of vars) body.style.setProperty(prop, value)
  // 換家族 → 現載該家族 webfont 供預覽
  if (config.heritage === 'webfont')
    for (const id of packages(config).ziano) ensureFont(id)
}

/* ── apply：JS 後備（作用於預覽容器） ── */
let hanMod = null
const applyFallbacks = async (config, body) => {
  if (!config.fallbacks) {
    hanMod?.uninstallFallbacks(body)
    return
  }
  hanMod ??= await import('/han/han.js')
  hanMod.uninstallFallbacks(body)
  hanMod.installFallbacks(body)
}

/* ── apply：輸出面板 ── */
const renderOutput = (config, ui) => {
  const render = {
    bundler: () => renderBundler(config, ui.pm.value),
    cdn: () => renderCDN(config),
    import: () => renderImport(config),
  }[ui.tab]
  ui.code.textContent = render()
  ui.pmSelect.hidden = ui.tab !== 'bundler'
}

/* ── 進場 ── */
export const initConfigurator = (root) => {
  const body = root.querySelector('[data-pg-body]')
  const config = structuredClone(DEFAULTS)
  const ui = {
    tab: 'bundler',
    get pm() { return root.querySelector('[data-out-pm]') },
    get pmSelect() { return root.querySelector('[data-out-pm]') },
    code: root.querySelector('[data-out-code] code'),
  }

  const sync = () => {
    // autospace 開關×進階模式 → config.autospace
    const on = root.querySelector('[data-cfg-key="autospaceOn"]').checked
    const mode = root.querySelector('[data-cfg-key="autospaceMode"]').value
    config.autospace = on ? mode : 'off'
    applyPreview(config, body)
    applyFallbacks(config, body)
    renderOutput(config, ui)
    // 家族選單只在 heritage=webfont 時可用；進階 autospace 只在勾了後備時展示
    root.querySelectorAll('[data-cfg-heritage-family]').forEach((el) => {
      el.toggleAttribute('hidden', config.heritage !== 'webfont')
    })
    root.querySelectorAll('[data-cfg-semantics-sub]').forEach((el) => {
      el.toggleAttribute('hidden', !config.semantics)
    })
    root.querySelector('[data-cfg-advanced]')
      .toggleAttribute('hidden', !config.fallbacks)
  }

  for (const el of root.querySelectorAll('[data-cfg] [data-cfg-key]')) {
    const key = el.dataset.cfgKey
    el.addEventListener('input', () => {
      if (key !== 'autospaceOn' && key !== 'autospaceMode')
        setPath(config, key, readControl(el))
      sync()
    })
  }

  for (const tab of root.querySelectorAll('[data-out-tab]'))
    tab.addEventListener('click', () => {
      ui.tab = tab.dataset.outTab
      root.querySelectorAll('[data-out-tab]').forEach((t) =>
        t.classList.toggle('is-active', t === tab))
      renderOutput(config, ui)
    })
  ui.pm.addEventListener('input', () => renderOutput(config, ui))

  const copy = root.querySelector('[data-out-copy]')
  copy.addEventListener('click', async () => {
    await navigator.clipboard.writeText(ui.code.textContent)
    const original = copy.textContent
    copy.textContent = copy.dataset.copied ?? '已複製'
    setTimeout(() => { copy.textContent = original }, 1500)
  })

  sync()
}
```

- [ ] **Step 2: 汰換 playground.js 的 toggle 系統**

`manual/public/home/playground.js`：
1. 刪除 `data-pg-toggles`／`data-rule` 相關的選取與事件（第 32 行的 `toggles` 陣列及其 wiring）。
2. 檔頭 import 與 `initPlayground` 內各加一行：

```js
import { initConfigurator } from '/home/configurator.js'
// …在 initPlayground(root) 既有初始化尾端：
initConfigurator(root)
```

3. `manual/public/home/playground.css` 刪掉 data-rule 橋（511-514 的四行規則），並為新控件補基本樣式（沿用現有 `.Toggle` 的 token；新增最小集）：

```css
  [data-pg] .Field {
    display: flex; align-items: center; justify-content: space-between;
    gap: .75em;
    & > span { flex: none; }
    & :is(select, input[type="text"]) {
      inline-size: 9.5em; font: inherit;
      background: transparent; border: 1px solid var(--rule, #ccc);
      border-radius: .35em; padding-block: .2em; padding-inline: .5em;
    }
  }
  [data-pg] .Snippets {
    margin-block-start: var(--gutter, 1.5rem);
    & .SnippetsHead { display: flex; align-items: center; gap: .6em; flex-wrap: wrap; }
    & .Tab.is-active { background: var(--ink, #222); color: var(--paper, #fff); }
    & pre {
      overflow-x: auto; padding: 1em;
      background: color-mix(in oklab, currentColor 6%, transparent);
      border-radius: .5em; font-size: .8em; line-height: 1.6;
    }
  }
```

- [ ] **Step 3: dev server 手動驗證（核心走查）**

```bash
cd manual && pnpm dev
```

逐項確認：
1. 開關「語意」→ 預覽 ruby/cite 等強化即時消失；輸出含 `--han-semantics: off`。
2. 掛✗擠✗ → 預覽標點恢復方塊間距（refinement none 生效——**若視覺無變化**，代表 `--han-punctuation-refinement` 只 gate JS 路徑：勾上「舊瀏覽器後備」再驗，並在 commit 訊息記錄此行為）。
3. 傳承黑體改「源起」→ Network 面板出現 `webfonts-genki-gothic…swap.css` 請求、預覽字形變化；輸出 `:root` 含 heritage 覆寫。
4. hant 標點改 GB → 預覽 。位置改變；輸出含 `--han-punctuation-hant: GB`。
5. 勾「舊瀏覽器後備」→ 輸出 CDN 頁出現 `han.auto.min.js`；取消 → script 消失。
6. 三分頁切換與複製按鈕動作正常；bundler 頁 pm 切 npm/yarn 首行變化。
7. 全部復原預設 → 輸出無 `:root` 區塊、無 script。

- [ ] **Step 4: 單測全綠 + Commit**

```bash
cd manual && node --test tests/ && cd ..
git add manual/public/home/configurator.js manual/public/home/playground.js manual/public/home/playground.css manual/public/home.js
git commit -m "feat(manual): wire configurator — config drives preview vars, on-demand webfonts, snippet output"
```

---

### Task 5: Playwright e2e

**Files:**
- Create: `tests/e2e/playground-configurator.spec.ts`

- [ ] **Step 1: 先看一眼既有 e2e 檔的寫法（selector 慣例、goto 路徑）**

```bash
ls tests/e2e/ && head -30 tests/e2e/*.ts | head -40
```

- [ ] **Step 2: 寫 spec（照既有慣例調 `goto` 路徑）**

```ts
import { test, expect } from '@playwright/test'

test.describe('playground configurator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')   // 首頁；若既有測試用其他 base path，照抄
  })

  test('掛標點開關 → 預覽變數 + 生成碼同步', async ({ page }) => {
    const body = page.locator('[data-pg-body]')
    await page.locator('[data-cfg-key="squeeze"]').uncheck()
    await expect(body).toHaveCSS('--han-punctuation-refinement', 'hang')
    await page.locator('[data-out-tab="cdn"]').click()
    await expect(page.locator('[data-out-code]'))
      .toContainText('--han-punctuation-refinement: hang')
  })

  test('DTJ hant 換 GB → 生成碼含覆寫；全預設 → 無 :root', async ({ page }) => {
    const code = page.locator('[data-out-code]')
    await expect(code).not.toContainText(':root')   // 初始＝全預設
    await page.locator('[data-cfg-key="punct.hant"]').selectOption('GB')
    await expect(code).toContainText('--han-punctuation-hant: GB')
  })

  test('換傳承家族 → 注入對應 webfont link', async ({ page }) => {
    await page.locator('[data-cfg-key="heritageSans"]').selectOption('genki')
    await expect(
      page.locator('link[href*="webfonts-genki-gothic"]').first(),
    ).toBeAttached()
  })

  test('勾後備 → CDN 頁出現 han.auto script 行', async ({ page }) => {
    await page.locator('[data-cfg-key="fallbacks"]').check()
    await page.locator('[data-out-tab="cdn"]').click()
    await expect(page.locator('[data-out-code]')).toContainText('han.auto.min.js')
  })
})
```

- [ ] **Step 3: 跑 e2e**

```bash
pnpm test:e2e
```

Expected: 新 spec 4 條全過、既有 e2e 不破。`toHaveCSS` 對 custom property 若不支援（Playwright 版本差異），改用
`await expect.poll(() => body.evaluate((el) => getComputedStyle(el).getPropertyValue('--han-punctuation-refinement').trim())).toBe('hang')`。

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/playground-configurator.spec.ts
git commit -m "test(e2e): playground configurator — vars, codegen sync, on-demand fonts"
```

---

### Task 6: 全量收尾驗證

**Files:** 無新檔（驗證 + 可能的微調）

- [ ] **Step 1: 全套測試**

```bash
pnpm test && pnpm test:coverage && (cd manual && node --test tests/) && pnpm test:e2e
```

Expected: 全綠。

- [ ] **Step 2: production build + preview 目視**

```bash
pnpm build && cd manual && pnpm build && pnpm preview
```

在 preview URL 驗證：
1. DevTools Network 過濾 `woff2`：預覽首屏出現 **Shanggu** 系 woff2 請求（Task 1 修名生效的鐵證）。
2. 配置器整鏈（改配置→預覽→輸出）與 dev 相同。
3. Console 無錯。

- [ ] **Step 3: 勾掉 workspace RC 計畫的對應項**

`/Users/yijun/Workspace/hanzi.pro/docs/plans/2026-07-rc-launch.md` 中 han 的
「manual/playground」相關 todo 打勾並註記日期（該檔在 workspace 根 repo，另行 commit）。

- [ ] **Step 4: 最終 commit（若 Step 1-2 有微調）**

```bash
git add -A && git status   # 檢視後
git commit -m "chore(manual): configurator final polish after full verification"
```

---

## Self-Review 紀錄

- **Spec 覆蓋**：§3 對接修正→Task 1（em-space/zhuyin 兩變數依實查改道，見頭部偏差註記）；§4.1 控制面板→Task 3；§4.2 預覽→Task 4；§4.3 生成→Task 2；§4.4 狀態模型→Task 2+4；§5 manual 收尾→Task 1 Step 1（audit）+Task 3；§6 測試→Task 2（單測）+Task 5（e2e）+Task 6；§7 不做清單未越界。
- **佔位掃描**：無 TBD；兩處「依實際輸出調整」（家族中文名、e2e goto 路徑）均附具體查證指令與調整規則。
- **型別一致**：`cssVars/packages/renderCDN/renderBundler/renderImport/DEFAULTS/HERITAGE` 於 Task 2 定義、Task 4/5 引用名一致；`data-cfg-key` 命名 Task 3 HTML ↔ Task 4 JS 一致（`punct.hant` 點路徑由 `setPath` 處理）。
