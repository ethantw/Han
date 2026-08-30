import {
  refinePunctuation,
  refinePunctuationWithMode,
  markQuoteBoundaries,
} from '/han/han.js'

const root = document.documentElement
const toolbar = document.querySelector('#toolbar')
const source = document.querySelector('#specimen-source')
const modes = [...document.querySelectorAll('[data-mode]')]

for (const mode of modes) {
  const specimen = mode.querySelector('.Specimen')
  specimen.append(source.content.cloneNode(true))

  if (mode.dataset.mode === 'auto') refinePunctuation(specimen)
  else refinePunctuationWithMode(mode.dataset.mode)(specimen)
  markQuoteBoundaries(specimen)

  const chars = specimen.querySelectorAll('h-char[data-punct]').length
  const hanging = specimen.querySelectorAll('h-char[data-punct~="hangable"]').length
  mode.querySelector('header output').textContent = `${chars} wrappers · ${hanging} hangable`
}

const applyControls = () => {
  root.style.setProperty('--measure', `${toolbar.elements.measure.value}em`)
  const vertical = toolbar.elements.vertical.checked
  root.dataset.writing = vertical ? 'vertical' : 'horizontal'
  root.style.setProperty('--han-writing-mode', vertical ? 'vertical-rl' : 'horizontal-tb')
  root.toggleAttribute('data-reveal', toolbar.elements.reveal.checked)
}

toolbar.addEventListener('input', applyControls)
applyControls()

const engine = document.querySelector('#engine')
const dtjFamily = 'Diantenjeom Sans JIS'

const reportEngine = (dtjLoaded) => {
  const sample = document.querySelector('[data-mode="auto"] .PairSet span')
  const stack = getComputedStyle(sample).fontFamily
  engine.textContent = [
    `DTJ ${dtjLoaded ? 'loaded' : 'FAILED'}`,
    `text-spacing-trim ${CSS.supports('text-spacing-trim', 'trim-start')}`,
    `hanging ${CSS.supports('hanging-punctuation', 'allow-end')}`,
    `used stack ${stack}`,
  ].join(' · ')
  engine.toggleAttribute('data-font-failed', !dtjLoaded)
}

const verifyDtj = async () => {
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
