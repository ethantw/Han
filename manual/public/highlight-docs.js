/**
 * Docs syntax-highlight bootstrap — a src-loaded public module (NOT an
 * inline `<script type="module">` in _layout.html). The inline form makes
 * vite dev extract it into an `?html-proxy` virtual module and run import
 * analysis on it; resolving `import '/home/highlight.js'` (a PUBLIC asset,
 * not part of the module graph) 500s there, so the whole script never runs.
 * A `src=`-loaded public module is served raw and the BROWSER resolves the
 * `/home/highlight.js` import natively — exactly how the homepage's
 * `home.js` reaches it. Feature-detect lives inside `highlightAll`; docs
 * are static, so one pass at DCL is enough (no live re-highlight path).
 */
import { highlightAll } from '/home/highlight.js'

addEventListener('DOMContentLoaded', () => highlightAll('main.han pre > code'))
