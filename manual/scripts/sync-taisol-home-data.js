import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const manualDir = path.resolve(here, '..')
const sourceDir = path.resolve(manualDir, '..', '..', 'taisol')
const targetDir = path.resolve(manualDir, 'data', 'taisol')

const slugs = [
  'passport-museum',
  'hyperloop-12sec',
  'hypersleep-drunk',
  'ark-europa-customs',
  'standard-glyph-revival',
  'telepathy-speech-rehab',
  'soviet-koi8-nuke',
]
const languageDirs = ['zh', 'hans', 'ja', 'ko']

const unquote = (value) => String(value ?? '').replace(/^(['"])([\s\S]*)\1$/, '$2')

const homeExcerptOf = (source, file) => {
  const match = source.match(/^home_excerpt:\s*(.+?)\s*$/m)
  const value = unquote(match?.[1])
  if (!value) throw new Error(`[taisol snapshot] ${file} has no home_excerpt`)
  return value
}

const assertInside = (root, file) => {
  if (file !== root && !file.startsWith(root + path.sep))
    throw new Error(`[taisol snapshot] path escapes source: ${file}`)
}

const copy = async (sourceFile) => {
  assertInside(sourceDir, sourceFile)
  const relative = path.relative(sourceDir, sourceFile)
  const targetFile = path.join(targetDir, relative)
  await fs.mkdir(path.dirname(targetFile), { recursive: true })
  await fs.copyFile(sourceFile, targetFile)
  return relative.replaceAll(path.sep, '/')
}

const copied = new Set()
for (const languageDir of languageDirs) {
  for (const slug of slugs) {
    const articleFile = path.join(sourceDir, languageDir, `${slug}.md`)
    const article = await fs.readFile(articleFile, 'utf8')
    copied.add(await copy(articleFile))

    const excerptFile = path.resolve(path.dirname(articleFile), homeExcerptOf(article, articleFile))
    copied.add(await copy(excerptFile))
  }
}

const manifest = {
  source: 'taisol',
  purpose: 'han.css homepage excerpts and newspaper-reader articles',
  slugs,
  languageDirs,
  files: [...copied].sort(),
}
await fs.writeFile(
  path.join(targetDir, 'manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
)

console.log(`[taisol snapshot] copied ${copied.size} files to ${targetDir}`)
