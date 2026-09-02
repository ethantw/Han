import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '../..')
const MANUAL_DIST = path.join(ROOT, 'manual', 'dist')
const PORT = Number(process.env.PORT || 5173)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'text/javascript; charset=utf-8',
  '.mjs':  'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map':  'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.mp3':  'audio/mpeg',
  '.wav':  'audio/wav',
  '.svg':  'image/svg+xml',
}

/**
 * Resolve a URL path to a file on disk. Roots at `manual/dist/` since
 * that's what the build produces — homepage, docs (under `/manual/`),
 * and demo all live in that tree. Falls back to `manual/dist/` again
 * with the request path treated as a directory (auto-appends
 * `index.html`). Last resort: ROOT, for any path that pre-existing
 * tests reach via legacy URLs.
 */
async function resolveTarget(rel) {
  // 1. Direct: manual/dist/<rel>
  const direct = path.resolve(MANUAL_DIST, rel)
  if (direct === MANUAL_DIST || direct.startsWith(MANUAL_DIST + path.sep)) {
    const stat = await fs.stat(direct).catch(() => null)
    if (stat?.isFile()) return direct
    if (stat?.isDirectory()) {
      const indexed = path.join(direct, 'index.html')
      if (await fs.stat(indexed).catch(() => null)) return indexed
    }
  }
  // 2. Legacy fallback for tests that hit /manual/<file> assuming the
  //    `manual/` prefix maps to manual/dist/. Strip it and try again.
  if (rel.startsWith('manual/')) {
    const stripped = rel.slice('manual/'.length) || 'index.html'
    const legacy = path.resolve(MANUAL_DIST, stripped)
    if (legacy === MANUAL_DIST || legacy.startsWith(MANUAL_DIST + path.sep)) {
      const stat = await fs.stat(legacy).catch(() => null)
      if (stat?.isFile()) return legacy
    }
  }
  // 3. ROOT-relative for anything that escaped both lookups.
  const root = path.resolve(ROOT, rel)
  if (root === ROOT || root.startsWith(ROOT + path.sep)) {
    const stat = await fs.stat(root).catch(() => null)
    if (stat?.isFile()) return root
    if (stat?.isDirectory()) {
      const indexed = path.join(root, 'index.html')
      if (await fs.stat(indexed).catch(() => null)) return indexed
    }
  }
  return null
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`)
    const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html'
    const target = await resolveTarget(rel)
    if (!target) { res.writeHead(404, { 'content-type': 'text/plain' }).end('not found'); return }
    const data = await fs.readFile(target)
    res.writeHead(200, { 'content-type': MIME[path.extname(target)] || 'application/octet-stream' })
    res.end(data)
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found')
  }
})

server.listen(PORT, () => console.log(`[han-css] serving ${MANUAL_DIST} on http://localhost:${PORT}`))
