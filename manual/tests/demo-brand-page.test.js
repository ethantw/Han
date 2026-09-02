import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { renderDemoBrandPage } from '../demo-brand-page.js'

const RUBY_SOURCE = path.resolve(import.meta.dirname, '../demo/ruby-zhuyin-config.html')
const HOME_SHARED = path.resolve(import.meta.dirname, '../home/_shared.html')

test('public demos receive the homepage heritage glyph from one source', async () => {
  const [ruby, home] = await Promise.all([
    readFile(RUBY_SOURCE, 'utf8'),
    readFile(HOME_SHARED, 'utf8'),
  ])
  const rendered = renderDemoBrandPage(ruby)
  const homepagePath = home.match(/const HAN_SVG = `<svg[\s\S]*?<path d="([^"]+)"/)?.[1]
  const demoPath = rendered.match(/<span class="Mark"><svg[\s\S]*?<path d="([^"]+)"/)?.[1]

  assert.ok(homepagePath)
  assert.equal(demoPath, homepagePath)
  assert.doesNotMatch(rendered, /@han:demo-brand/)
  assert.match(rendered, /<span class="DemoHeroBrandTitle">注音字體樣張<\/span>/)
})

test('demo brand renderer refuses a page without its named slot', () => {
  assert.throws(() => renderDemoBrandPage('<main></main>'), /missing its @han:demo-brand slot/)
})
