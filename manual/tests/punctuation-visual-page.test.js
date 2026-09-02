import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { renderPunctuationVisualPage } from '../punctuation-visual-page.js'

const SOURCE = path.resolve(import.meta.dirname, '../demo/punctuation-visual.html')
const BROWSER_SCRIPT = path.resolve(import.meta.dirname, '../demo/punctuation-visual.js')

test('the public punctuation specimen contains a real Node-preprocessed sample', async () => {
  const rendered = renderPunctuationVisualPage(await readFile(SOURCE, 'utf8'))

  assert.doesNotMatch(rendered, /@han:ssr-(?:preview|code)/)
  assert.match(rendered, /data-node-rendered/)
  assert.match(rendered, /<h-char data-punct="end dividing consecutive"/)
  assert.match(rendered, /<h-layer>，<\/h-layer>/)
  assert.match(rendered, /&lt;h-char data-punct="end dividing consecutive"/)
  assert.match(rendered, /data-followed-by-quote="open-q"/)
})

test('the Node renderer refuses to silently ship an unfilled page', () => {
  assert.throws(
    () => renderPunctuationVisualPage('<main></main>'),
    /missing its Node render slots/,
  )
})

test('browser comparison modes cannot collide with Han.js data-mode output', async () => {
  const [source, script] = await Promise.all([
    readFile(SOURCE, 'utf8'),
    readFile(BROWSER_SCRIPT, 'utf8'),
  ])
  const rendered = renderPunctuationVisualPage(source)

  assert.match(rendered, /<h-iss hidden="" data-mode="replace">/)
  assert.match(source, /data-refinement-mode="auto"/)
  assert.match(script, /querySelectorAll\('\[data-refinement-mode\]'\)/)
  assert.doesNotMatch(script, /querySelectorAll\('\[data-mode\]'\)/)
})
