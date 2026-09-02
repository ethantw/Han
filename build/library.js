import esbuild from 'esbuild'
import { spawnSync } from 'node:child_process'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { measurePassSizes } from './pass-sizes.js'

const watch = process.argv.includes('--watch')

/**
 * Emit `.d.ts` declarations alongside the bundled JS so downstream
 * TypeScript consumers get types when they `import { … } from 'han-css'`.
 *
 * Per-file `.d.ts` lands in `dist/types/`; `package.json`'s `types`
 * entry points there. Imports inside the .d.ts get rewritten from
 * `.ts` → `.js` thanks to TypeScript 5.7's
 * `rewriteRelativeImportExtensions`. Type resolution is independent
 * of runtime: consumers' bundlers still load the single-file
 * `dist/han.js` bundle that esbuild produces.
 */
async function emitTypes() {
  // Clean dist/types/ before re-emitting so renamed/removed source
  // files don't leave orphan .d.ts behind (e.g. hws.ts → iss.ts).
  await rm('dist/types', { recursive: true, force: true })

  const result = spawnSync('npx', ['tsc', '-p', 'tsconfig.build.json'], {
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    console.error('[han-css] tsc failed; .d.ts not emitted')
    process.exit(result.status ?? 1)
  }

  /**
   * hyperly exposes `Hyperly` / `Hype` via `declare global { … }` rather
   * than as named module exports, so consumers' TypeScript can't see
   * them unless `hyperly` is in their tsconfig's `types` array. To
   * spare consumers that ceremony we prepend a triple-slash reference
   * to the published entry .d.ts — TypeScript's emitter strips such
   * directives during declaration emit (the importer-graph heuristic
   * deems them redundant), so we restore it post-emit.
   */
  const entry = 'dist/types/han.d.ts'
  const REF = '/// <reference types="hyperly" />\n'
  const body = await readFile(entry, 'utf-8')
  if (!body.includes(REF.trim())) {
    await writeFile(entry, REF + body)
  }
}

const CSS_FILES = [
  './src/han.css',
  './src/han.basic.css',
]

/**
 * Per-module bundle entries (semantics/lines/prose/fonts). `han.fonts.css`
 * emits the same `em-space.woff2` / `zhuyin.serif.woff2` assets as
 * `han.css` — both use `assetNames: '[name]'`, so building them in the
 * same esbuild call collides on those output paths. Kept as a separate
 * `CSS_BUNDLE_CONFIG`-shaped build/context so each call's asset graph
 * stays self-consistent; the duplicate files land identically either way.
 */
const MODULE_CSS_FILES = [
  './src/han.semantics.css',
  './src/han.lines.css',
  './src/han.prose.css',
  './src/han.fonts.css',
]

const CSS_BUNDLE_CONFIG = {
  entryPoints: CSS_FILES,

  bundle: true,
  outdir: 'dist',

  loader: { '.woff2': 'file' },
  assetNames: '[name]',

  sourcemap: 'linked',
}

const MODULE_CSS_BUNDLE_CONFIG = {
  ...CSS_BUNDLE_CONFIG,
  entryPoints: MODULE_CSS_FILES,
}

/**
 * Optional Zhuyin face for `han.basic.css` users. Build it separately because
 * the full and fonts bundles emit the same `zhuyin.serif.woff2` asset.
 */
const ZHUYIN_CSS_BUNDLE_CONFIG = {
  ...CSS_BUNDLE_CONFIG,
  entryPoints: [{ in: 'src/css/fonts/zhuyin.css', out: 'han.zhuyin' }],
}

const TS_BUNDLE_CONFIG = {
  entryPoints: [
    { in: 'src/han.ts', out: 'han' },
    { in: 'src/han.auto.ts', out: 'han.auto' },
    { in: 'src/han.zhuyin-calibration.ts', out: 'han.zhuyin-calibration' },
  ],

  bundle: true,
  format: 'esm',
  outdir: 'dist',

  sourcemap: 'linked',

  /**
   * `happy-dom` is hyperly's optional SSR peer; gated by a runtime
   * `isBrowserSide` check that's always true in browsers, so the
   * dynamic import is dead code there. Marking it external keeps
   * the bare `import("happy-dom")` literal out of the bundle.
   */
  external: ['happy-dom'],
}

/**
 * Browser-conditional twin of TS_BUNDLE_CONFIG (`exports`' `browser`
 * condition → `han.browser.js` / `han.auto.browser.js`). The external
 * `import("happy-dom")` literal above is correct for Node, but browser
 * bundlers try to resolve it: absent → "could not resolve happy-dom";
 * present → happy-dom's Node built-ins (`url`, `buffer`) fail the
 * browser build. Aliasing to a stub removes happy-dom from the browser
 * module graph entirely; the aliased branch stays unreachable at
 * runtime (`isBrowserSide` is true).
 */
const BROWSER_TS_BUNDLE_CONFIG = {
  ...TS_BUNDLE_CONFIG,
  entryPoints: [
    { in: 'src/han.ts', out: 'han.browser' },
    { in: 'src/han.auto.ts', out: 'han.auto.browser' },
  ],
  external: [],
  alias: { 'happy-dom': './build/happy-dom.browser-stub.js' },
}

if (watch) {
  // Dev: unminified only, incremental rebuilds on file change.
  // Skip .d.ts emission to keep the watch loop fast — `pnpm typecheck`
  // covers the type-correctness loop separately.
  const ctxs = await Promise.all([
    esbuild.context({ ...CSS_BUNDLE_CONFIG, logLevel: 'info' }),
    esbuild.context({ ...MODULE_CSS_BUNDLE_CONFIG, logLevel: 'info' }),
    esbuild.context({ ...ZHUYIN_CSS_BUNDLE_CONFIG, logLevel: 'info' }),
    esbuild.context({ ...TS_BUNDLE_CONFIG, logLevel: 'info' }),
    esbuild.context({ ...BROWSER_TS_BUNDLE_CONFIG, logLevel: 'info' }),
  ])
  await Promise.all(ctxs.map(ctx => ctx.watch()))
  console.log('[han-css] watching — Ctrl+C to stop')
} else {
  // Prod: unminified + minified bundles, plus per-file .d.ts.
  await Promise.all([
    esbuild.build(CSS_BUNDLE_CONFIG),
    esbuild.build({
      ...CSS_BUNDLE_CONFIG,
      minify: true,
      outExtension: { '.css': '.min.css' },
    }),
    esbuild.build(MODULE_CSS_BUNDLE_CONFIG),
    esbuild.build({
      ...MODULE_CSS_BUNDLE_CONFIG,
      minify: true,
      outExtension: { '.css': '.min.css' },
    }),
    esbuild.build(ZHUYIN_CSS_BUNDLE_CONFIG),
    esbuild.build({
      ...ZHUYIN_CSS_BUNDLE_CONFIG,
      minify: true,
      outExtension: { '.css': '.min.css' },
    }),
    esbuild.build(TS_BUNDLE_CONFIG),
    esbuild.build({
      ...TS_BUNDLE_CONFIG,
      minify: true,
      outExtension: { '.js': '.min.js' },
    }),
    esbuild.build(BROWSER_TS_BUNDLE_CONFIG),
    esbuild.build({
      ...BROWSER_TS_BUNDLE_CONFIG,
      minify: true,
      outExtension: { '.js': '.min.js' },
    }),
  ])
  await emitTypes()
  await emitPassSizes()
}

/**
 * `dist/pass-sizes.json` — the homepage's addition ledger, measured here
 * rather than in the manual's own build so the figures come from the same
 * run that produced the bundles they describe. See build/pass-sizes.js.
 */
async function emitPassSizes() {
  await writeFile('dist/pass-sizes.json', JSON.stringify(await measurePassSizes(), null, 2))
}
