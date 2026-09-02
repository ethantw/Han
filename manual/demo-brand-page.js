import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SHARED_HOME = fileURLToPath(new URL('./home/_shared.html', import.meta.url))
const BRAND_SLOT = /<!--\s*@han:demo-brand\s+(.+?)\s*-->/g

const escapeHtml = (value) => String(value).replace(/[&<>]/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
})[character])

const homepageHanGlyph = () => {
  const source = readFileSync(SHARED_HOME, 'utf8')
  const match = source.match(/const HAN_SVG = `(<svg class="(?:Brand)?Glyph"[\s\S]*?<\/svg>)`/)
  if (!match) throw new Error('homepage shared template is missing HAN_SVG')
  return match[1].replace(/class="(?:Brand)?Glyph"/, 'class="Glyph"')
}

const device = `<svg class="Device" viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="20" cy="28" r="6.5" opacity=".55"></circle>
  <circle cx="20" cy="50" r="9.5"></circle>
  <circle cx="20" cy="78" r="12.5" opacity=".85"></circle>
  <path class="brace" d="M 82 14 H 57 V 86 H 82" fill="none" stroke-width="6.5" stroke-linecap="square" stroke-linejoin="miter"></path>
  <polygon class="dun" points="58,45 43,50 58,55"></polygon>
</svg>`

/** Inject the homepage's exact heritage-glyph wordmark into public demos. */
export const renderDemoBrandPage = (source) => {
  const glyph = homepageHanGlyph()
  let replacements = 0
  const rendered = source.replace(BRAND_SLOT, (_slot, rawLabel) => {
    replacements += 1
    const label = escapeHtml(rawLabel.trim())
    return `<div class="DemoHeroBrand">
  <a class="Brand" data-size="md" href="/" aria-label="漢.css">
    ${device}
    <span class="Mark">${glyph}漢</span><span class="Dot">.</span><span class="Ext">css</span>
  </a>
  <span class="DemoHeroBrandTitle">${label}</span>
</div>`
  })
  if (!replacements) throw new Error('demo page is missing its @han:demo-brand slot')
  return rendered
}
