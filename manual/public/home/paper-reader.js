/** Shared newspaper reader, loaded on the first article-icon activation. */
import { refreshEraLines } from '/home/papers-dateline.js'

const EDITIONS = ['hant', 'hans', 'ja', 'ko']
const LABELS = { hant: '繁', hans: '简', ja: '日', ko: '한' }
const LANGS = { hant: 'zh-Hant', hans: 'zh-Hans', ja: 'ja', ko: 'ko-Kore' }
const AVAILABLE = { 'standard-glyph-revival': ['hant', 'hans'] }
const SCALES = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.25, 1.5, 1.75, 2]
const WRITING_STORAGE_KEY = 'han-paper-reader-writing'
const MIN_STAGE_DELAY = 250
const cache = new Map()
let dialog
let current = { slug: '', edition: 'hant' }
let scaleMode = 'auto'
let layoutFrame = 0
let readerTrim = { width: 0, height: 0 }
let reapplyFallbacks
let loadGeneration = 0
let closePromise

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))
const wait = (duration) => new Promise((resolve) => setTimeout(resolve, duration))

const transitionMilliseconds = (element, pseudo) => {
  const style = getComputedStyle(element, pseudo)
  const times = (value) => value.split(',').map((part) => {
    const number = Number.parseFloat(part)
    return part.trim().endsWith('ms') ? number : number * 1000
  })
  const durations = times(style.transitionDuration)
  const delays = times(style.transitionDelay)
  return Math.max(0, ...durations.map((duration, index) =>
    duration + (delays[index % delays.length] ?? 0)))
}

const waitForTransition = async (element, pseudo) => {
  const duration = transitionMilliseconds(element, pseudo)
  if (!duration) return
  await wait(duration + 34)
}

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

const storedWriting = () => {
  try { return localStorage.getItem(WRITING_STORAGE_KEY) === 'vertical' }
  catch { return false }
}

const storeWriting = (vertical) => {
  try { localStorage.setItem(WRITING_STORAGE_KEY, vertical ? 'vertical' : 'horizontal') }
  catch { /* private browsing / disabled storage */ }
}

const rootRem = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
const headerHeight = () => document.querySelector('body > header')?.getBoundingClientRect().height || 0
const readerInlineGutter = () => {
  const value = getComputedStyle(dialog.querySelector('.Stage'))
    .getPropertyValue('--reader-inline-gutter').trim()
  const number = Number.parseFloat(value)
  if (!Number.isFinite(number)) return rootRem()
  return value.endsWith('rem') ? number * rootRem() : number
}

const naturalSheetSize = () => {
  const sheet = dialog.querySelector('.Sheet')
  return {
    width: sheet.offsetWidth - readerTrim.width,
    height: sheet.offsetHeight - readerTrim.height,
  }
}

/* `column-height` deliberately keeps the last row at its full block-size even
 * when little copy reaches it. That is correct fragmentation, but it leaves a
 * large blank tail on an on-screen sheet. Find the final ink edge after Han's
 * wrappers are installed, then let the stage crop only that empty tail while
 * retaining the sheet's own physical padding. No text is reflowed. */
const measureReaderTrim = () => {
  const stage = dialog.querySelector('.Stage')
  const sheet = dialog.querySelector('.Sheet')
  const body = dialog.querySelector('.Body')
  readerTrim = { width: 0, height: 0 }

  if (!CSS.supports('column-height', '1em') || !sheet.offsetWidth || !sheet.offsetHeight) {
    stage.removeAttribute('data-reader-trimmed')
    return
  }

  const sheetRect = sheet.getBoundingClientRect()
  const renderedScale = sheetRect.width / sheet.offsetWidth || 1
  const ink = { minLeft: Infinity, maxBottom: -Infinity }
  const include = (rect) => {
    if (!rect.width || !rect.height) return
    ink.minLeft = Math.min(ink.minLeft, rect.left)
    ink.maxBottom = Math.max(ink.maxBottom, rect.bottom)
  }
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT)
  for (let text = walker.nextNode(); text; text = walker.nextNode()) {
    if (!text.textContent.trim()) continue
    const range = document.createRange()
    range.selectNodeContents(text)
    ;[...range.getClientRects()].forEach(include)
  }
  body.querySelectorAll('img, svg, canvas, video').forEach((element) => {
    include(element.getBoundingClientRect())
  })

  if (!Number.isFinite(ink.minLeft) || !Number.isFinite(ink.maxBottom)) {
    stage.removeAttribute('data-reader-trimmed')
    return
  }

  const style = getComputedStyle(sheet)
  if (dialog.dataset.writing === 'vertical') {
    readerTrim.width = Math.max(0, Math.floor(
      (ink.minLeft - sheetRect.left) / renderedScale - Number.parseFloat(style.paddingLeft),
    ))
  } else {
    readerTrim.height = Math.max(0, Math.floor(
      (sheetRect.bottom - ink.maxBottom) / renderedScale - Number.parseFloat(style.paddingBottom),
    ))
  }
  /* 即使剛好不必裁尺寸，stage 仍要承接可見的 3rem 紙尾與紙框。 */
  stage.setAttribute('data-reader-trimmed', '')
}

const fittedScale = () => {
  const size = naturalSheetSize()
  if (!size.width || !size.height) return 1
  if (dialog.dataset.writing === 'vertical') {
    const availableHeight = innerHeight - headerHeight() - 4 * rootRem()
    return Math.min(1, Math.max(0.1, availableHeight / size.height))
  }
  const availableWidth = innerWidth - 2 * readerInlineGutter()
  return Math.min(1, Math.max(0.1, availableWidth / size.width))
}

const applyScale = (scale) => {
  const rounded = Math.round(scale * 1000) / 1000
  const { width, height } = naturalSheetSize()
  const stage = dialog.querySelector('.Stage')
  const select = dialog.querySelector('.Scale')
  dialog.style.setProperty('--reader-scale', String(rounded))
  stage.style.setProperty('--reader-stage-width', `${width * rounded}px`)
  stage.style.setProperty('--reader-stage-height', `${height * rounded}px`)
  if (scaleMode === 'auto') {
    const option = select.querySelector('option[value="auto"]')
    option.textContent = `適合・${Math.round(rounded * 100)}%`
    select.value = 'auto'
  } else {
    select.value = String(scaleMode)
  }
}

const readerStart = () => {
  dialog.scrollTo({
    top: 0,
    left: dialog.dataset.writing === 'vertical'
      ? dialog.scrollWidth - dialog.clientWidth
      : 0,
    behavior: 'instant',
  })
}

const layoutReader = ({ resetScroll = false, preserveScroll = false } = {}) => {
  const scroll = preserveScroll ? {
    top: dialog.scrollTop,
    left: dialog.scrollLeft,
    right: dialog.scrollWidth - dialog.clientWidth - dialog.scrollLeft,
  } : null
  cancelAnimationFrame(layoutFrame)
  layoutFrame = requestAnimationFrame(() => {
    measureReaderTrim()
    applyScale(scaleMode === 'auto' ? fittedScale() : scaleMode)
    if (resetScroll) requestAnimationFrame(readerStart)
    else if (scroll) requestAnimationFrame(() => dialog.scrollTo({
      top: scroll.top,
      left: dialog.dataset.writing === 'vertical'
        ? dialog.scrollWidth - dialog.clientWidth - scroll.right
        : scroll.left,
      behavior: 'instant',
    }))
  })
}

const setWriting = (vertical, { persist = true, fit = true } = {}) => {
  dialog.dataset.writing = vertical ? 'vertical' : ''
  dialog.querySelector('.PaperHead')?.toggleAttribute('data-vertical', vertical)
  const button = dialog.querySelector('.Writing')
  button.textContent = vertical ? '橫排' : '直排'
  button.setAttribute('aria-pressed', String(vertical))
  if (persist) storeWriting(vertical)
  if (fit) scaleMode = 'auto'
  layoutReader({ resetScroll: true })
}

const setReaderConsole = (open, { restoreFocus = false } = {}) => {
  const panel = dialog?.querySelector(':scope > .ConsolePanel')
  const trigger = dialog?.querySelector('.Console')
  if (!panel || !trigger) return false
  const wasOpen = !panel.hidden
  panel.hidden = !open
  panel.toggleAttribute('inert', !open)
  panel.setAttribute('aria-hidden', String(!open))
  trigger.setAttribute('aria-expanded', String(open))
  const label = open ? trigger.dataset.labelClose : trigger.dataset.labelOpen
  if (label) {
    trigger.setAttribute('aria-label', label)
    trigger.title = label
  }
  if (!open && wasOpen && restoreFocus) trigger.focus()
  return wasOpen
}

const cloneConsoleForReader = () => {
  const source = document.querySelector('body > .ConsolePanel')
  if (!source) return null
  const panel = source.cloneNode(true)
  panel.id = 'typesetting-console-reader'
  panel.hidden = true
  panel.setAttribute('inert', '')
  panel.setAttribute('aria-hidden', 'true')
  const console = panel.querySelector('han-console')
  console?.setAttribute('mirror', '')
  console?.removeAttribute('data-ready')
  return panel
}

const ensureReaderConsole = () => {
  let panel = dialog.querySelector(':scope > .ConsolePanel')
  if (panel) return panel
  panel = cloneConsoleForReader()
  if (!panel) return null
  panel.querySelector('.Close')?.addEventListener('click', () => {
    setReaderConsole(false, { restoreFocus: true })
  })
  dialog.append(panel)
  return panel
}

const shell = () => {
  if (dialog) return dialog
  dialog = document.createElement('dialog')
  dialog.className = 'Reader'
  dialog.setAttribute('aria-label', '全文閱讀器')
  dialog.innerHTML = `
    <div class="Loading" role="progressbar" aria-label="正在載入報導" aria-hidden="true"></div>
    <form method="dialog" class="Chrome">
      <div class="Controls">
        <fieldset class="Tools">
          <legend class="sr-only">閱讀工具</legend>
          <button type="button" class="Console" aria-expanded="false"><span data-icon="console" aria-hidden="true"></span></button>
          <button type="button" class="Writing" aria-pressed="false">直排</button>
          <select class="Scale" aria-label="顯示倍率">
            <option value="auto">適合・100%</option>
            ${SCALES.map((scale) => `<option value="${scale}">${Math.round(scale * 100)}%</option>`).join('')}
          </select>
        </fieldset>
        <fieldset class="Editions">
          <legend class="sr-only">語言版本</legend>
          ${EDITIONS.map((edition) => `<button type="button" class="Edition" data-edition="${edition}" lang="${LANGS[edition]}">${LABELS[edition]}</button>`).join('')}
        </fieldset>
      </div>
      <div class="Actions">
        <button value="close" class="Close" title="關閉" aria-label="關閉"><span data-icon="close" aria-hidden="true"></span></button>
      </div>
    </form>
    <div class="Stage">
      <article class="Sheet" aria-live="polite"><div class="RowField"><div class="Body"></div></div></article>
    </div>`
  const consoleButton = dialog.querySelector('.Console')
  const pageConsoleButton = document.querySelector('.ConsoleToggle')
  const openLabel = pageConsoleButton?.dataset.labelOpen ?? '打開排版面板'
  const closeLabel = pageConsoleButton?.dataset.labelClose ?? '關閉排版面板'
  consoleButton.dataset.labelOpen = openLabel
  consoleButton.dataset.labelClose = closeLabel
  consoleButton.setAttribute('aria-label', openLabel)
  consoleButton.title = openLabel
  ;(document.querySelector('figure.Papers > article') ?? document.body).append(dialog)
  setWriting(storedWriting(), { persist: false, fit: false })
  dialog.addEventListener('click', (event) => {
    const control = event.target.closest?.('.Edition, .Writing, .Console')
    if (control?.matches('.Edition')) return show(current.slug, control.dataset.edition)
    if (control?.matches('.Writing')) return setWriting(dialog.dataset.writing !== 'vertical')
    if (control?.matches('.Console')) {
      const panel = ensureReaderConsole()
      return setReaderConsole(panel?.hidden ?? true, { restoreFocus: true })
    }
    if (!control && event.target === dialog) {
      if (setReaderConsole(false, { restoreFocus: false })) return
      closeReader()
    }
  })
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault()
    if (setReaderConsole(false, { restoreFocus: true })) return
    closeReader()
  })
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !setReaderConsole(false, { restoreFocus: true })) return
    /* A nested non-modal <dialog open> can consume Escape before the parent
       modal emits `cancel`; catch it at the reader boundary so the first
       press always dismisses only the console copy. */
    event.preventDefault()
    event.stopPropagation()
  }, true)
  dialog.addEventListener('submit', (event) => {
    event.preventDefault()
    closeReader(event.submitter?.value)
  })
  dialog.addEventListener('close', () => {
    setReaderConsole(false, { restoreFocus: false })
    dialog.querySelector('.Body').removeAttribute('aria-busy')
    dialog.querySelector('.Loading').setAttribute('aria-hidden', 'true')
    dialog.removeAttribute('data-stage-visible')
    dialog.removeAttribute('data-chrome-visible')
    dialog.removeAttribute('data-reader-loading')
  })
  dialog.addEventListener('change', (event) => {
    if (!event.target.matches?.('.Scale')) return
    const scale = Number(event.target.value)
    if (!SCALES.includes(scale)) return
    scaleMode = scale
    layoutReader({ preserveScroll: true })
  })
  addEventListener('resize', () => {
    if (dialog.open) layoutReader({ preserveScroll: true })
  })
  return dialog
}

/* Closing is deliberately the inverse of opening: let the newspaper leave
 * first, then retract the toolbar and mask, and only then leave the top layer.
 * While an article is still loading there is no newspaper phase to wait for,
 * so clicking the mask dismisses the shell immediately. */
const closeReader = (returnValue = '') => {
  if (!dialog?.open) return Promise.resolve()
  if (closePromise) return closePromise
  const generation = ++loadGeneration
  closePromise = (async () => {
    setReaderConsole(false, { restoreFocus: false })
    dialog.removeAttribute('data-reader-loading')
    dialog.querySelector('.Loading').setAttribute('aria-hidden', 'true')
    const stageWasVisible = dialog.hasAttribute('data-stage-visible')
    dialog.removeAttribute('data-stage-visible')
    if (stageWasVisible) await waitForTransition(dialog.querySelector('.Stage'))
    if (generation !== loadGeneration || !dialog.open) return

    dialog.removeAttribute('data-chrome-visible')
    await Promise.all([
      waitForTransition(dialog.querySelector('.Chrome')),
      waitForTransition(dialog, '::backdrop'),
    ])
    if (generation === loadGeneration && dialog.open) dialog.close(returnValue)
  })().finally(() => { closePromise = null })
  return closePromise
}

const setEditionState = (edition) => {
  dialog.lang = LANGS[edition]
  const sheet = dialog.querySelector('.Sheet')
  sheet.querySelector(':scope > .PaperHead')?.remove()
  const template = document.querySelector(`#paper-reader-head-${edition}`)
  if (template) sheet.prepend(template.content.cloneNode(true))
  refreshEraLines(sheet)
  sheet.querySelector('.PaperHead')?.toggleAttribute('data-vertical', dialog.dataset.writing === 'vertical')
  dialog.querySelectorAll('.Edition').forEach((button) => {
    button.toggleAttribute('aria-current', button.dataset.edition === edition)
    button.disabled = !(AVAILABLE[current.slug] ?? EDITIONS).includes(button.dataset.edition)
  })
}

const show = async (slug, edition) => {
  const generation = ++loadGeneration
  shell()
  current = { slug, edition }
  setEditionState(edition)
  const body = dialog.querySelector('.Body')
  body.setAttribute('aria-busy', 'true')
  dialog.setAttribute('data-reader-loading', '')
  dialog.querySelector('.Loading').setAttribute('aria-hidden', 'false')
  let stageDue = performance.now()
  if (!dialog.open) {
    scaleMode = 'auto'
    dialog.removeAttribute('data-stage-visible')
    dialog.setAttribute('data-chrome-visible', '')
    dialog.showModal()
    stageDue = performance.now() + MIN_STAGE_DELAY
  }
  try {
    const source = await load(slug, edition)
    if (generation !== loadGeneration) return
    body.innerHTML = source
    /* 舊的 dev server 可能仍回傳帶列表摘要的 fragment；Reader 自己再守一道，
       只移除緊接首題的 blockquote，後文真正的引用不受影響。 */
    body.querySelector(':scope > h1:first-of-type + blockquote')?.remove()
    /* Fetch 插入的是全新的 DOM，首頁啟動時跑過的 Han pass 不會自動看見它。
       借主控台的同一入口重跑目前設定，確保標點擠壓、行首尾懸掛、ISS 等 wrapper
       與頁面其餘內容一致；await 後再量 column-height，否則裁尾會量到舊版面。 */
    await reapplyFallbacks?.(body)
    if (generation !== loadGeneration) return
  } catch (error) {
    if (generation !== loadGeneration) return
    body.innerHTML = `<p class="Error">全文載入失敗。<a href="${articleURL(slug, edition)}">直接開啟報導</a></p>`
    console.error(error)
  } finally {
    if (generation !== loadGeneration) return
    body.removeAttribute('aria-busy')
    layoutReader({ resetScroll: true })
    await Promise.all([
      nextFrame(),
      wait(Math.max(0, stageDue - performance.now())),
    ])
    if (generation !== loadGeneration || !dialog.open) return
    dialog.removeAttribute('data-reader-loading')
    dialog.querySelector('.Loading').setAttribute('aria-hidden', 'true')
    dialog.setAttribute('data-stage-visible', '')
  }
}

export const openPaperReader = ($link, applyFallbacks) => {
  const slug = $link?.dataset.article
  if (applyFallbacks) reapplyFallbacks = applyFallbacks
  if (slug) show(slug, editionFrom($link))
}
