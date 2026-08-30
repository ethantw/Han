import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

const PUBLIC_ROOT = path.resolve(import.meta.dirname, '../public')

const sourceFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      if (directory === PUBLIC_ROOT && entry.name === 'han') return []
      return sourceFiles(target)
    }
    return /\.(?:css|js)$/.test(entry.name) ? [target] : []
  }))
  return nested.flat()
}

test('authored public CSS and JavaScript stay below the 1000-line hard ceiling', async () => {
  const violations = []
  for (const file of await sourceFiles(PUBLIC_ROOT)) {
    const source = await readFile(file, 'utf8')
    const lines = source.split('\n').length
    if (lines > 1000) violations.push(`${path.relative(PUBLIC_ROOT, file)}: ${lines}`)
  }
  assert.deepEqual(violations, [])
})

test('the size dialog follows, but does not leak back into, the ledger concern', async () => {
  const manifest = await readFile(path.join(PUBLIC_ROOT, 'home.css'), 'utf8')
  const ledger = await readFile(path.join(PUBLIC_ROOT, 'home/ledger.css'), 'utf8')
  const ledgerImport = manifest.indexOf("@import url('./home/ledger.css')")
  const dialogImport = manifest.indexOf("@import url('./home/size-dialog.css')")

  assert.ok(ledgerImport >= 0)
  assert.ok(dialogImport > ledgerImport)
  assert.doesNotMatch(ledger, /\.SizeDialog|\.OpenSizeDialog/)
})
