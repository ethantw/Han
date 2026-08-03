/**
 * Per-pass bundle sizes — what the homepage's addition ledger prices.
 *
 * The claim station ⑤ makes is「你只付你叫到的那幾支」. That is a claim about
 * tree-shaking, so it has to be MEASURED, not modelled: for every subset of
 * the selectable passes we bundle a real entry — the exact source
 * `home/codegen.js` hands the reader — and record its size.
 *
 * 2ⁿ, not base + ΣΔ. The marginal model was tried first (docs/plans/
 * console-driven-bundle-ledger.md § ②) and fails:
 *
 *   - `refinePunctuation` and `applyISS` share ~1.5k of line-adjustment
 *     helpers, so summing their marginals overshoots the real pair by 20% —
 *     past the 15% band the plan set as the alarm threshold.
 *
 * Exhausting the subsets removes the whole error class, and it is cheap:
 * 31 bundles land in about a second because esbuild reuses one service
 * process. Guarded at MAX_COMBOS anyway — adding passes doubles the count,
 * and 2ⁿ is a trap worth failing loudly on rather than discovering as a
 * slow build.
 *
 * Consumed by manual/vite.config.js (build-time, → the ledger's tokens) and
 * manual/public/home/ledger.js (runtime, → the live addition as the console's
 * switches move). Both read `dist/pass-sizes.json`; neither re-derives it.
 */

import esbuild from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { brotliCompressSync, gzipSync } from 'node:zlib'

const here = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(here, '..')

/**
 * The selectable passes, in the order the ledger prints them — which is
 * also the order `installFallbacks()` runs the ones it runs. Order is
 * load-bearing: the ledger attributes shared code to whichever pass comes
 * FIRST (see the chain decomposition in ledger.js), so the two line
 * adjustments — which share most of their helpers — lead, and the cheap
 * trailers sit last.
 *
 * `applyISSWithProbe`, not `applyISS`: the probe (Safari's inline-boundary
 * bug) is the difference between the ISS pass working on Safari and quietly
 * not, and it is memoised, so there is no reason to offer the unprobed twin
 * as the headline choice. It stays exported for callers who have already
 * seeded the probe elsewhere.
 *
 * `id` is the console's checkbox key, `fn` the export name, `call` the line
 * codegen emits. `call` must stay byte-identical to codegen's output or the
 * ledger prices a bundle the reader never gets.
 *
 * `installFallbacks` is deliberately absent. It subsumes the first three, so
 * offering it alongside them would let a reader tick a redundant pair — and
 * a reader who wants the lot has the `auto` mode for exactly that.
 */
export const PASSES = [
  { id: 'punctuation',   fn: 'refinePunctuation',  call: 'refinePunctuation(document.body)' },
  { id: 'iss',           fn: 'applyISSWithProbe',  call: 'applyISSWithProbe(document.body)' },
  { id: 'adjacentLines', fn: 'markAdjacentLines',  call: 'markAdjacentLines(document.body)' },
  { id: 'ruby',          fn: 'transpileRuby',      call: 'transpileRuby(document.body)' },
  { id: 'uninstall',     fn: 'uninstallFallbacks', call: 'uninstallFallbacks(document.body)' },
]

const MAX_COMBOS = 256

/**
 * The hyperly floor — a shell that imports hyperly and nothing else. Every
 * pass pays it, and it dwarfs all the marginals put together, so the ledger
 * gives it its own row. Without that row a reader would read
 * the marginals as the whole price and conclude that unticking one pass saves
 * most of the bundle.
 */
const FLOOR_ENTRY = `import { hype } from 'hyperly/fp'\nglobalThis.__hanFloor = hype\n`

const entrySource = (passes) => [
  `import { ${passes.map(p => p.fn).join(', ')} } from './han.ts'`,
  ...passes.map(p => p.call),
  '',
].join('\n')

const sizeOf = async (contents) => {
  const result = await esbuild.build({
    stdin: { contents, resolveDir: path.join(ROOT, 'src'), sourcefile: 'ledger-probe.ts', loader: 'ts' },
    bundle: true,
    format: 'esm',
    minify: true,
    write: false,
    // Mirrors BROWSER_TS_BUNDLE_CONFIG in library.js — the reader's bundler
    // resolves the `browser` condition, so happy-dom is stubbed out. Measuring
    // the Node build instead would price a dependency no browser ever loads.
    alias: { 'happy-dom': path.join(ROOT, 'build', 'happy-dom.browser-stub.js') },
  })
  const buf = Buffer.from(result.outputFiles[0].contents)
  const kb = bytes => +(bytes / 1024).toFixed(3)
  return { raw: kb(buf.length), br: kb(brotliCompressSync(buf).length), gz: kb(gzipSync(buf).length) }
}

/**
 * Bundle every non-empty subset of PASSES. Keys of `sizes` are the decimal
 * form of the selection bitmask (bit i ↔ PASSES[i]) — compact, and the exact
 * value ledger.js computes from the console's checkboxes, so lookup needs no
 * key-building convention shared across two languages.
 */
export async function measurePassSizes() {
  const total = 1 << PASSES.length
  if (total > MAX_COMBOS) {
    throw new Error(
      `pass-sizes: ${PASSES.length} passes ⇒ ${total - 1} bundles, over the ${MAX_COMBOS} cap. ` +
      'Either drop a pass from the console or switch the ledger to a sampled model.',
    )
  }

  const masks = Array.from({ length: total - 1 }, (_, i) => i + 1)
  const [floor, ...sizes] = await Promise.all([
    sizeOf(FLOOR_ENTRY),
    ...masks.map(mask => sizeOf(entrySource(PASSES.filter((_, i) => mask & (1 << i))))),
  ])

  return {
    passes: PASSES.map(({ id, fn }) => ({ id, fn })),
    floor,
    sizes: Object.fromEntries(masks.map((mask, i) => [mask, sizes[i]])),
  }
}
