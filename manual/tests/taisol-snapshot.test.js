import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..', 'data', 'taisol')

test('homepage taisol snapshot is complete and self-contained', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8'))
  assert.equal(manifest.slugs.length, 7)
  assert.deepEqual(manifest.languageDirs, ['zh', 'hans', 'ja', 'ko'])
  assert.equal(manifest.files.length, 56)

  for (const languageDir of manifest.languageDirs) {
    for (const slug of manifest.slugs) {
      const articleFile = path.join(root, languageDir, `${slug}.md`)
      const article = await fs.readFile(articleFile, 'utf8')
      const excerptRef = article.match(/^home_excerpt:\s*['"]?([^\n'"]+)/m)?.[1]
      assert.ok(excerptRef, `${languageDir}/${slug} has a home_excerpt`)
      const excerptFile = path.resolve(path.dirname(articleFile), excerptRef)
      assert.ok(excerptFile.startsWith(root + path.sep), `${excerptRef} stays in the snapshot`)
      assert.ok((await fs.readFile(excerptFile, 'utf8')).trim().length > 0)
    }
  }
})
