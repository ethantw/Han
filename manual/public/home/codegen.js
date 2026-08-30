














const CDN = 'https://cdn.jsdelivr.net/npm/'
const SCOPE = '@hanzi.pro/'














/** Heritage font families and their installable packages. */
export const HERITAGE = {
  shanggu: {
    sans:  { stack: "'Shanggu Sans', 'Shanggu Sans Yue'",   pkgs: ['shanggu-sans'] },
    serif: { stack: "'Shanggu Serif', 'Shanggu Serif Yue'", pkgs: ['shanggu-serif'] },
  },

  genki: {
    sans:  { stack: "'Genki Sans Yue', 'Genki Sans'",   pkgs: ['genki-sans-yue'] },
    serif: { stack: "'Genki Serif Yue', 'Genki Serif'", pkgs: ['genki-serif-yue'] },
  },
}


/** Locales supported by the heritage-glyph configuration. */
export const HERITAGE_LOCALES = ['hant', 'hans', 'ja', 'ko']
const HERITAGE_DEFAULT = { hant: 'webfont', hans: 'off', ja: 'off', ko: 'off' }
const anyHeritageWebfont = (c) => HERITAGE_LOCALES.some((loc) => c.heritage[loc] === 'webfont')



/** Traditional Chinese cursive font choices. */
export const CURSIVE_HANT = {
  lxgw:   { stack: "'LXGW WenKai TC'", pkg: 'lxgw-wenkai-tc' },
  iansui: { stack: "'Iansui'",         pkg: 'iansui' },
}

const cursivePkgs = (c) => [CURSIVE_HANT[c.cursiveHant].pkg, 'lxgw-wenkai', 'klee-one']

/** Complete default configuration for previews and generated installation code. */
export const DEFAULTS = {




  metrics: { size: 16, leading: 1.75, weight: 400 },
  semantics: true,
  citeTitleMarks: 'none',
  emSymbol: 'circle',
  emPosition: 'auto',
  zhuyinPosition: 'over',
  prose: true,
  proseScope: 'article',
  lines: true,
  hang: true,
  squeeze: true,
  autospace: 'normal',
  fonts: true,



  heritage: { hant: 'webfont', hans: 'off', ja: 'off', ko: 'off' },
  heritageFamily: 'shanggu',
  cursive: 'webfont',
  cursiveHant: 'lxgw',
  punct: { hant: 'MOE', hans: 'GB', ja: 'JIS', ko: 'KLR' },
  zhuyinWebfont: true,
  baseGeneric: 'sans-serif',
  fallbacks: true,





  jsMode: 'auto',


  fn: {
    punctuation: true,
    iss: true,
    adjacentLines: true,
    ruby: false,
    uninstall: false,
  },
  legacyRuby: false,


  webfontDelivery: 'cdn',
  webfontCdnSource: 'jsdelivr',
}




/** CSS modules in generated import order. */
export const MODULES = ['semantics', 'lines', 'prose', 'fonts']

const enabledModules = (c) => MODULES.filter((m) => c[m])














/** Optional JavaScript fallback passes in execution and bitmask order. */
export const PASSES = [
  { id: 'punctuation',   fn: 'refinePunctuation',  call: 'refinePunctuation(document.body)' },
  { id: 'iss',           fn: 'applyISSWithProbe',  call: 'applyISSWithProbe(document.body)' },
  { id: 'adjacentLines', fn: 'markAdjacentLines',  call: 'markAdjacentLines(document.body)' },
  { id: 'ruby',          fn: 'transpileRuby',      call: 'transpileRuby(document.body)' },
  { id: 'uninstall',     fn: 'uninstallFallbacks', call: 'uninstallFallbacks(document.body)' },
]


/** Returns enabled manual fallback passes in execution order. */
export const selectedPasses = (c) =>
  c.fallbacks && c.jsMode === 'manual' ? PASSES.filter((p) => c.fn[p.id]) : []


/** Encodes enabled manual fallback passes as the transfer-size lookup mask. */
export const passMask = (c) =>
  PASSES.reduce((m, p, i) => (c.fallbacks && c.jsMode === 'manual' && c.fn[p.id] ? m | (1 << i) : m), 0)

const refinement = ({ hang, squeeze }) =>
  hang && squeeze ? 'auto' : hang ? 'hang' : squeeze ? 'compress' : 'none'




/** Returns ordered custom-property pairs that differ from defaults. */
export const cssVars = (c) => {
  const out = []
  if (c.semantics) {
    if (c.citeTitleMarks !== 'none') out.push(['--han-cite-title-marks', c.citeTitleMarks])
    if (c.emSymbol !== 'circle') out.push(['--han-em-symbol', c.emSymbol])
    if (c.emPosition !== 'auto') out.push(['--han-em-dot-position', `${c.emPosition} right`])
    if (c.zhuyinPosition !== 'over') out.push(['--han-zhuyin-ruby-position', c.zhuyinPosition])
  }
  if (c.lines) {
    const refine = refinement(c)
    if (refine !== 'auto') out.push(['--han-punctuation-refinement', refine])
    if (c.autospace !== 'normal')
      out.push(['--han-text-autospace', c.autospace === 'off' ? 'no-autospace' : c.autospace])
  }
  if (c.fonts) {
    for (const loc of HERITAGE_LOCALES)
      if (c.heritage[loc] !== HERITAGE_DEFAULT[loc])
        out.push([`--han-use-heritage-glyphs-for-${loc}`, c.heritage[loc]])


    if (anyHeritageWebfont(c) && c.heritageFamily !== 'shanggu')
      out.push(['--han-webfont-heritage-family', c.heritageFamily])
    if (c.cursive !== 'webfont') out.push(['--han-use-cursive', c.cursive])
    if (c.cursive === 'webfont' && c.cursiveHant !== 'lxgw')
      out.push(['--han-webfont-cursive-hant', CURSIVE_HANT[c.cursiveHant].stack])


    for (const [key, def] of [['hant', 'MOE'], ['hans', 'GB'], ['ja', 'JIS'], ['ko', 'KLR']])
      if (c.punct[key] !== def) out.push([`--han-punctuation-${key}`, c.punct[key]])
    if (!c.zhuyinWebfont) out.push(['--han-font-zhuyin-serif', 'cursive, serif'])
  }
  return out
}


const configCSS = (c, indent = '  ') => {
  const vars = cssVars(c)
  const scope = c.proseScope.replace(/[<>{};/]/g, '').trim()









  const m = c.metrics
  const bodyDecls = [
    ...(c.fonts && c.baseGeneric === 'serif' ? ['font-family: var(--han-font-alternative);'] : []),
    ...(m.size !== 16 ? [`font-size: ${m.size}px;`] : []),
    ...(m.leading !== 1.75 ? [`line-height: ${String(m.leading)};`] : []),
    ...(m.weight !== 400 ? [`font-weight: ${m.weight};`] : []),
  ]
  const bodyRule =
    bodyDecls.length === 0 ? []
    : bodyDecls.length === 1 ? [`body { ${bodyDecls[0]} }`]
    : [`body {\n${bodyDecls.map((d) => `${indent}${d}`).join('\n')}\n}`]
  const rules = [
    ...(vars.length
      ? [`:root {\n${vars.map(([k, v]) => `${indent}${k}: ${v};`).join('\n')}\n}`]
      : []),
    ...(c.prose && scope && scope !== 'article' ? [`${scope} { --han-prose: on; }`] : []),
    ...bodyRule,
  ]
  return rules.join('\n')
}






/** Returns external font packages required by a configuration. */
export const packages = (c) => {
  if (!c.fonts) return { ziano: [], dtj: false }


  const heritagePkgs = anyHeritageWebfont(c)
    ? [
        ...HERITAGE[c.heritageFamily].sans.pkgs,
        ...HERITAGE[c.heritageFamily].serif.pkgs,
      ]
    : []
  const ziano = [
    ...heritagePkgs,
    ...(c.cursive === 'webfont' ? cursivePkgs(c) : []),
  ]
  const dtj = Object.values(c.punct).some((v) => v !== 'off')
  return { ziano, dtj }
}





const ORIGIN = {
  jsdelivr: 'https://cdn.jsdelivr.net/npm/',
  unpkg: 'https://unpkg.com/',
  esmsh: 'https://esm.sh/',
}



const version = (pkg) =>
  globalThis.document
    ?.querySelector(`meta[name="han-cdn-version"][data-package="${pkg}"]`)
    ?.getAttribute('content') || 'latest'

/** Builds a versioned Ziano stylesheet URL for a configured CDN. */
export const zianoUrl = (id, source = 'jsdelivr') =>
  `${ORIGIN[source]}${SCOPE}webfonts-${id}@${version('ziano')}/swap.css`


/** Builds a versioned Diantenjeom stylesheet URL for a configured CDN. */
export const dtjUrl = (source = 'jsdelivr') =>
  `${ORIGIN[source]}${SCOPE}diantenjeom@${version('diantenjeom')}/dist/diantenjeom.css`

const preconnectHost = (source) => new URL(ORIGIN[source]).origin

const HAN_CSS_URL = `${CDN}${SCOPE}han.css@latest/dist/han.min.css`
const HAN_CSS_MOD_URL = (mod) => `${CDN}${SCOPE}han.css@latest/dist/han.${mod}.min.css`
const HAN_AUTO_URL = `${CDN}${SCOPE}han.css@latest/dist/han.auto.min.js`
const HAN_JS_URL = `${CDN}${SCOPE}han.css@latest/dist/han.min.js`



const hanCssUrls = (c) => {
  const mods = enabledModules(c)
  return mods.length === MODULES.length ? [HAN_CSS_URL] : mods.map(HAN_CSS_MOD_URL)
}





/** Returns synchronized local framework stylesheet URLs for inline output. */
export const localHanCssUrls = (c) => {
  const mods = enabledModules(c)
  return mods.length === MODULES.length ? ['/han/han.min.css'] : mods.map((m) => `/han/han.${m}.min.css`)
}
/** Local auto-install bundle used by inline output. */
export const HAN_AUTO_LOCAL_URL = '/han/han.auto.min.js'
/** Local named-export bundle used by inline output. */
export const HAN_JS_LOCAL_URL = '/han/han.min.js'

const hanCssImports = (c) => {
  const mods = enabledModules(c)
  return mods.length === MODULES.length
    ? [`import '${SCOPE}han.css/styles'`]
    : mods.map((m) => `import '${SCOPE}han.css/styles/${m}'`)
}

const styleUrls = (c) => {
  const { ziano, dtj } = packages(c)
  const webfonts = c.webfontDelivery !== 'none'
  return [
    ...hanCssUrls(c),
    ...(webfonts ? ziano.map((id) => zianoUrl(id, c.webfontCdnSource)) : []),
    ...(webfonts && dtj ? [dtjUrl(c.webfontCdnSource)] : []),
  ]
}



const JSDELIVR_ORIGIN = 'https://cdn.jsdelivr.net'

const preconnectLines = (c) => {
  const origins = new Set(styleUrls(c).map((u) => new URL(u).origin))
  const ordered = origins.has(JSDELIVR_ORIGIN)
    ? [JSDELIVR_ORIGIN, ...[...origins].filter((o) => o !== JSDELIVR_ORIGIN)]
    : [...origins]
  return ordered.map((h) => `<link rel="preconnect" href="${h}" crossorigin>`)
}









const moduleScript = (url, passes) => [
  '<script type="module">',
  `  import { ${passes.map((p) => p.fn).join(', ')} } from '${url}'`,
  ...passes.map((p) => `  ${p.call}`),
  '</script>',
].join('\n')

const scriptLines = (c, autoUrl, jsUrl) => {
  if (!c.fallbacks) return []
  if (c.jsMode === 'manual') {
    const passes = selectedPasses(c)
    return passes.length ? [moduleScript(jsUrl, passes)] : []
  }
  return [
    `<script type="module" src="${autoUrl}"></script>`,
    ...(c.legacyRuby ? [moduleScript(jsUrl, [PASSES.find((p) => p.id === 'ruby')])] : []),
  ]
}

/** Renders CDN-ready HTML and optional configuration CSS panes. */
export const renderCDN = (c) => {
  const htmlLines = [
    ...preconnectLines(c),
    ...styleUrls(c).map((u) => `<link rel="stylesheet" href="${u}">`),
    ...scriptLines(c, HAN_AUTO_URL, HAN_JS_URL),
  ]
  const css = configCSS(c)

  return [
    { lang: 'html', code: htmlLines.join('\n') },
    ...(css ? [{ lang: 'css', code: css }] : []),
  ]
}

const PM = { npm: 'npm i', pnpm: 'pnpm add', yarn: 'yarn add' }




/** Renders package-manager, module, CSS and optional CDN panes. */
export const renderBundler = (c, pm = 'pnpm') => {
  const { ziano, dtj } = packages(c)
  const npm = c.webfontDelivery === 'npm'
  const cdn = c.webfontDelivery === 'cdn'
  const npmZiano = npm ? ziano : []
  const cdnZiano = cdn ? ziano : []
  const npmDtj = npm && dtj
  const cdnDtj = cdn && dtj

  const jsPasses = selectedPasses(c)



  const needHanCss = enabledModules(c).length > 0 || c.fallbacks || c.legacyRuby

  const deps = [
    ...(needHanCss ? [`${SCOPE}han.css`] : []),
    ...npmZiano.map((id) => `${SCOPE}webfonts-${id}`),
    ...(npmDtj ? [`${SCOPE}diantenjeom`] : []),
  ]
  const bash = { lang: 'bash', code: `${PM[pm]} ${deps.join(' \\\n  ')}` }

  const jsLines = [
    '// main.js',
    ...hanCssImports(c),
    ...npmZiano.map((id) => `import '${SCOPE}webfonts-${id}'`),
    ...(npmDtj ? [`import '${SCOPE}diantenjeom'`] : []),


    ...(jsPasses.length
      ? [
          `import { ${jsPasses.map((p) => p.fn).join(', ')} } from '${SCOPE}han.css'`,
          ...jsPasses.map((p) => p.call),
        ]
      : c.fallbacks
        ? [
            `import '${SCOPE}han.css/auto'`,
            ...(c.legacyRuby
              ? [
                  `import { transpileRuby } from '${SCOPE}han.css'`,
                  `transpileRuby(document.body)`,
                ]
              : []),
          ]
        : []),
  ]
  const js = { lang: 'js', code: jsLines.join('\n') }

  const cssBody = configCSS(c)
  const css = cssBody ? { lang: 'css', code: `/* styles.css — 放進全域樣式表，勿貼進 main.js */\n${cssBody}` } : null



  const htmlLines = cdnZiano.length || cdnDtj
    ? [
        `<link rel="preconnect" href="${preconnectHost(c.webfontCdnSource)}" crossorigin>`,
        ...cdnZiano.map((id) => `<link rel="stylesheet" href="${zianoUrl(id, c.webfontCdnSource)}">`),
        ...(cdnDtj ? [`<link rel="stylesheet" href="${dtjUrl(c.webfontCdnSource)}">`] : []),
      ]
    : []
  const html = htmlLines.length ? { lang: 'html', code: htmlLines.join('\n') } : null

  return [bash, js, ...(css ? [css] : []), ...(html ? [html] : [])]
}













/** Renders a self-contained HTML pane from already loaded framework assets. */
export const renderInline = (c, assets = {}) => {
  const { ziano, dtj } = packages(c)
  const webfonts = c.webfontDelivery !== 'none'
  const cdnZiano = webfonts ? ziano : []
  const cdnDtj = webfonts && dtj

  const linkLines = cdnZiano.length || cdnDtj
    ? [
        `<link rel="preconnect" href="${preconnectHost(c.webfontCdnSource)}" crossorigin>`,
        ...cdnZiano.map((id) => `<link rel="stylesheet" href="${zianoUrl(id, c.webfontCdnSource)}">`),
        ...(cdnDtj ? [`<link rel="stylesheet" href="${dtjUrl(c.webfontCdnSource)}">`] : []),
      ]
    : []



  const cssBody = configCSS(c)
  const styleBody = [assets.css, cssBody].filter(Boolean).join('')
  const styleLines = styleBody ? [`<style>\n${styleBody}</style>`] : []








  const blobScript = (passes) => [
    '<script type="module">',
    `  const src = ${JSON.stringify(assets.hanJs)}`,
    `  const mod = await import(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })))`,
    ...passes.map((p) => `  mod.${p.call}`),
    '</script>',
  ].join('\n')



  const jsPasses = selectedPasses(c)
  const manual = c.fallbacks && c.jsMode === 'manual'
  const scriptBlocks = [
    ...(manual && jsPasses.length && assets.hanJs ? [blobScript(jsPasses)] : []),


    ...(!manual && c.fallbacks && assets.autoJs ? [`<script type="module">\n${assets.autoJs}</script>`] : []),
    ...(!manual && c.legacyRuby && assets.hanJs ? [blobScript([PASSES.find((p) => p.id === 'ruby')])] : []),
  ]

  const htmlLines = [...linkLines, ...styleLines, ...scriptBlocks]
  return htmlLines.length ? [{ lang: 'html', code: htmlLines.join('\n') }] : []
}
