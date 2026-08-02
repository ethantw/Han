/**
 * Side-effect-only delivery of the auto-installer — the build for a plain
 * `<script type="module" src="…">` tag (or a pasted `<script type="module">`
 * block), where nothing can ever reach a named export.
 *
 * `han.auto.ts` is documented as a strict superset of `han.js`: it re-exports
 * the whole API alongside its install side effect. That contract is worth
 * keeping for anyone doing `import { transpileRuby } from
 * '@hanzi.pro/han.css/auto'` — but it costs the script-tag audience ~1.5k
 * brotli (10.1k → 8.6k) for exports they have no syntax to reach. Importing
 * for effect only, without re-exporting, lets the bundler drop every API
 * surface the installer itself does not call.
 *
 * So: same behaviour as `han.auto.js`, same `--han-install` handling, no
 * exports. `format: 'iife'` would drop them more obviously but is not
 * available — hyperly's entry uses top-level await, which esbuild refuses to
 * emit as an IIFE.
 *
 * Do NOT add exports to this file. An export here re-anchors the whole graph
 * and quietly hands the 1.5k back.
 */

import './han.auto.ts'
