const {
  refinePunctuation,
  refinePunctuationWithMode,
  markQuoteBoundaries,
} = await import(/* @vite-ignore */ '/han/han.js')

const root = document.documentElement
const toolbar = document.querySelector('#toolbar')
const source = document.querySelector('#specimen-source')
const modes = [...document.querySelectorAll('[data-refinement-mode]')]

for (const mode of modes) {
  const specimen = mode.querySelector('.Specimen')
  specimen.append(source.content.cloneNode(true))

  const refine = mode.dataset.refinementMode === 'auto'
    ? refinePunctuation
    : refinePunctuationWithMode(mode.dataset.refinementMode)

  /* A PairSet is a matrix of independent specimens, not one prose run.
     Refine each cell first so the library's intentional traversal across
     inline markup cannot join the last mark of one sample to the first mark
     of the next. The root pass remains for the line-edge and prose cases. */
  for (const pair of specimen.querySelectorAll('.PairSet span')) refine(pair)
  refine(specimen)
  markQuoteBoundaries(specimen)

  const chars = specimen.querySelectorAll('h-char[data-punct]').length
  const hanging = specimen.querySelectorAll('h-char[data-punct~="hangable"]').length
  mode.querySelector('header output').textContent = `${chars} wrappers · ${hanging} hangable`
}

const applyControls = () => {
  const convention = toolbar.elements.convention.value
  root.style.setProperty('--han-punctuation-hant', convention)
  root.style.setProperty('--demo-dtj-family', `'Diantenjeom Sans ${convention}'`)
  root.style.setProperty('--measure', `${toolbar.elements.measure.value}em`)
  const vertical = toolbar.elements.vertical.checked
  root.dataset.writing = vertical ? 'vertical' : 'horizontal'
  root.style.setProperty('--han-writing-mode', vertical ? 'vertical-rl' : 'horizontal-tb')
  root.toggleAttribute('data-reveal', toolbar.elements.reveal.checked)
}

toolbar.addEventListener('input', () => {
  applyControls()
  verifyDtj().then(reportEngine, () => reportEngine(false))
})
applyControls()

const engine = document.querySelector('#engine')

const reportEngine = (dtjLoaded) => {
  const sample = document.querySelector('[data-refinement-mode="auto"] .PairSet span')
  const stack = getComputedStyle(sample).fontFamily
  engine.textContent = [
    `DTJ ${dtjLoaded ? '已載入' : '載入失敗'}`,
    `text-spacing-trim：${CSS.supports('text-spacing-trim', 'trim-start') ? 'native' : 'JS fallback'}`,
    `hanging-punctuation：${CSS.supports('hanging-punctuation', 'allow-end') ? 'reported' : 'fallback'}`,
    `font stack：${stack}`,
  ].join('\n')
  engine.toggleAttribute('data-font-failed', !dtjLoaded)
}

const verifyDtj = async () => {
  const dtjFamily = `Diantenjeom Sans ${toolbar.elements.convention.value}`
  const link = document.querySelector('link[data-dtj]')
  // WebKit may execute a deferred module while a cross-origin stylesheet is
  // registered but its @font-face rules are not yet visible to FontFaceSet.
  if (!link.sheet) {
    await new Promise((resolve) => {
      link.addEventListener('load', resolve, { once: true })
      link.addEventListener('error', resolve, { once: true })
    })
  }

  for (let attempt = 0; attempt < 12; attempt++) {
    await new Promise(requestAnimationFrame)
    const faces = await document.fonts.load(`1em "${dtjFamily}"`, '》，，「。？！')
    if (faces.length > 0 && document.fonts.check(`1em "${dtjFamily}"`, '》，，「。？！'))
      return true
  }
  return false
}

verifyDtj().then(reportEngine, () => reportEngine(false))

const copyButton = document.querySelector('[data-copy-ssr]')
const ssrCode = document.querySelector('[data-ssr-code]')

copyButton?.addEventListener('click', async () => {
  const original = copyButton.textContent
  try {
    await navigator.clipboard.writeText(ssrCode.textContent)
    copyButton.textContent = '已複製'
  } catch {
    copyButton.textContent = '無法複製'
  }
  window.setTimeout(() => { copyButton.textContent = original }, 1600)
})
