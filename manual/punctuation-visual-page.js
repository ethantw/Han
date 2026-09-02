import { installFallbacks } from '@hanzi.pro/han.css/ssr'
import { html } from 'hyperly/fp'
import { renderDemoBrandPage } from './demo-brand-page.js'

const PREVIEW_SLOT = '<!-- @han:ssr-preview -->'
const CODE_SLOT = '<!-- @han:ssr-code -->'

const SSR_SAMPLE = `<article class="SsrProse" lang="zh-Hant">
  <p>編者問：「為什麼標點要擠壓？」讀者答：「因為《太陽中文報》，值得好好排。」</p>
  <p>她補充：<q>Node.js 先把這段處理好。</q>，瀏覽器收到的已經是完整標記。</p>
</article>`

const escapeHtml = (source) => source
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const formatHtml = (source) => source
  .replace('><p>', '>\n  <p>')
  .replaceAll('</p><p>', '</p>\n  <p>')
  .replace('</p></article>', '</p>\n</article>')

/**
 * Bake one small, inspectable Han.js result into the public specimen page.
 * The browser module deliberately leaves this subtree alone: it demonstrates
 * the exact markup a Node build step can send to the client.
 */
export const renderPunctuationVisualPage = (source) => {
  const rendered = html(installFallbacks(SSR_SAMPLE))

  if (!source.includes(PREVIEW_SLOT) || !source.includes(CODE_SLOT)) {
    throw new Error('punctuation visual page is missing its Node render slots')
  }

  return renderDemoBrandPage(source)
    .replace(PREVIEW_SLOT, rendered)
    .replace(CODE_SLOT, escapeHtml(formatHtml(rendered)))
}
