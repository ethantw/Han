/** Shared newspaper reader, loaded on the first article-icon activation. */
import { refreshEraLines } from '/home/papers-dateline.js'

const EDITIONS = ['hant', 'hans', 'ja', 'ko']
const LABELS = { hant: '繁', hans: '简', ja: '日', ko: '한' }
const LANGS = { hant: 'zh-Hant', hans: 'zh-Hans', ja: 'ja', ko: 'ko-Kore' }
const AVAILABLE = { 'standard-glyph-revival': ['hant', 'hans'] }
const SIZES = [14, 16, 10]
const cache = new Map()
let dialog
let current = { slug: '', edition: 'hant' }

const editionFrom = ($link) => {
  if (EDITIONS.includes($link?.dataset.edition)) return $link.dataset.edition
  const lang = $link?.closest('[lang]')?.lang || document.documentElement.lang
  if (/^zh-Hans/i.test(lang)) return 'hans'
  if (/^ja/i.test(lang)) return 'ja'
  if (/^ko/i.test(lang)) return 'ko'
  return 'hant'
}

const articleURL = (slug, edition) => `/articles/${slug}/${edition}.html`
const load = (slug, edition) => {
  const key = `${slug}/${edition}`
  if (!cache.has(key)) {
    cache.set(key, fetch(articleURL(slug, edition)).then((response) => {
      if (!response.ok) throw new Error(`Article ${key}: ${response.status}`)
      return response.text()
    }))
  }
  return cache.get(key)
}

const setSize = (px) => {
  dialog.dataset.size = String(px)
  dialog.style.setProperty('--reader-fs', `${px}px`)
}

const setWriting = (vertical) => {
  dialog.dataset.writing = vertical ? 'vertical' : ''
  dialog.querySelector('.PaperHead')?.toggleAttribute('data-vertical', vertical)
  const button = dialog.querySelector('[data-reader="writing"]')
  button.textContent = vertical ? '橫排' : '直排'
  button.setAttribute('aria-pressed', String(vertical))
  dialog.scrollTo({ top: 0, left: vertical ? dialog.scrollWidth - dialog.clientWidth : 0, behavior: 'instant' })
}

const shell = () => {
  if (dialog) return dialog
  dialog = document.createElement('dialog')
  dialog.className = 'Full ArticleReader'
  dialog.setAttribute('aria-label', '全文閱讀器')
  dialog.innerHTML = `
    <form method="dialog" class="ReaderChrome">
      ${EDITIONS.map((edition) => `<button type="button" class="ReaderEdition" data-reader="edition" data-edition="${edition}" lang="${LANGS[edition]}">${LABELS[edition]}</button>`).join('')}
      <button type="button" class="ReaderWriting" data-reader="writing" aria-pressed="false">直排</button>
      <button value="close" class="ReaderClose" title="關閉" aria-label="關閉"><span data-icon="close" aria-hidden="true"></span></button>
    </form>
    <article class="ReaderSheet" aria-live="polite"><div class="ReaderBody"></div></article>`
  ;(document.querySelector('figure.Papers > article') ?? document.body).append(dialog)
  dialog.addEventListener('click', (event) => {
    const control = event.target.closest?.('[data-reader]')
    if (control?.dataset.reader === 'edition') return show(current.slug, control.dataset.edition)
    if (control?.dataset.reader === 'writing') return setWriting(dialog.dataset.writing !== 'vertical')
    if (!control && event.target === dialog) return dialog.close()
    if (!control && event.target.closest?.('.ReaderSheet') && getSelection()?.isCollapsed !== false) {
      const at = SIZES.indexOf(Number(dialog.dataset.size))
      setSize(SIZES[(at + 1) % SIZES.length])
    }
  })
  return dialog
}

const setEditionState = (edition) => {
  dialog.lang = LANGS[edition]
  const sheet = dialog.querySelector('.ReaderSheet')
  sheet.querySelector(':scope > .PaperHead')?.remove()
  const template = document.querySelector(`#paper-reader-head-${edition}`)
  if (template) sheet.prepend(template.content.cloneNode(true))
  refreshEraLines(sheet)
  sheet.querySelector('.PaperHead')?.toggleAttribute('data-vertical', dialog.dataset.writing === 'vertical')
  dialog.querySelectorAll('[data-reader="edition"]').forEach((button) => {
    button.toggleAttribute('aria-current', button.dataset.edition === edition)
    button.disabled = !(AVAILABLE[current.slug] ?? EDITIONS).includes(button.dataset.edition)
  })
}

const show = async (slug, edition) => {
  shell()
  current = { slug, edition }
  setEditionState(edition)
  const body = dialog.querySelector('.ReaderBody')
  body.setAttribute('aria-busy', 'true')
  if (!dialog.open) {
    dialog.showModal()
    setSize(SIZES[0])
    setWriting(false)
  }
  try {
    body.innerHTML = await load(slug, edition)
  } catch (error) {
    body.innerHTML = `<p class="ReaderError">全文載入失敗。<a href="${articleURL(slug, edition)}">直接開啟報導</a></p>`
    console.error(error)
  } finally {
    body.removeAttribute('aria-busy')
    dialog.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }
}

export const openPaperReader = ($link) => {
  const slug = $link?.dataset.article
  if (slug) show(slug, editionFrom($link))
}
