const $ = (selector, root = document) => root.querySelector(selector)
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector))

export const initStationReadings = () => {
  const $station = $('.ReadingStation')
  if (!$station) return

  const initRailNav = () => {
    const $nav = $(':scope > nav', $station)
    const $rail = $(':scope > .Rail', $station)
    const $previous = $('button[value="previous"]', $nav)
    const $next = $('button[value="next"]', $nav)
    if (!$nav || !$rail || !$previous || !$next) return

    const sync = () => {
      const way = getComputedStyle($rail).direction === 'rtl' ? -1 : 1
      const position = $rail.scrollLeft * way
      const end = $rail.scrollWidth - $rail.clientWidth - 1
      $previous.disabled = position <= 0
      $next.disabled = position >= end
      $nav.hidden = $previous.disabled && $next.disabled
    }
    const move = (sign) => {
      const way = getComputedStyle($rail).direction === 'rtl' ? -1 : 1
      $rail.scrollBy({ left: (sign * way * $rail.clientWidth) / 3, behavior: 'smooth' })
    }

    $previous.addEventListener('click', () => move(-1))
    $next.addEventListener('click', () => move(1))
    $rail.addEventListener('scroll', sync, { passive: true })
    $rail.addEventListener('han-rail-layout', sync)
    new ResizeObserver(sync).observe($rail)
    sync()
  }

  const initSkyMotion = () => {
    const $sky = $('.Sky', $station)
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
    if (!$sky?.pauseAnimations || !$sky?.unpauseAnimations) return

    const sync = () => {
      if (reducedMotion.matches) $sky.pauseAnimations()
      else $sky.unpauseAnimations()
    }

    reducedMotion.addEventListener('change', sync)
    sync()
  }

  const synth = window.speechSynthesis
  const AUDIO_ROOT = '/audio/ruby-readings'
  const $numbersGroup = $('button[name="speak"][value="story"]', $station)
  const $fontSize = $('[name="font-size"]', $station)
  const $fontSizeOutput = $('output[for="reading-font-size"]', $station)

  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

  const renderScriptOrbits = () => {
    $$('[data-orbit-glyphs]', $station).forEach((orbit) => {
      const glyphs = [...orbit.dataset.orbitGlyphs]
      const duration = Number(orbit.dataset.orbitDuration)
      const path = orbit.dataset.orbitPath
      orbit.replaceChildren(
        ...glyphs.map((glyph, index) => {
          const text = document.createElementNS(SVG_NAMESPACE, 'text')
          const motion = document.createElementNS(SVG_NAMESPACE, 'animateMotion')
          const motionPath = document.createElementNS(SVG_NAMESPACE, 'mpath')
          motion.setAttribute('dur', `${duration}s`)
          motion.setAttribute('begin', `${((-duration * index) / glyphs.length).toFixed(3)}s`)
          motion.setAttribute('repeatCount', 'indefinite')
          motion.setAttribute('rotate', 'auto')
          motionPath.setAttribute('href', path)
          motion.append(motionPath)
          text.append(glyph, motion)
          return text
        }),
      )
    })
  }

  const renderHunminStar = () => {
    const star = $('[data-star-text]', $station)
    if (!star) return

    const source = [...star.dataset.starText]
    const radius = 72
    const perspective = 260
    const meridianCount = 12
    const latitudeCount = 9
    const glyphs = Array.from(
      { length: meridianCount * latitudeCount },
      (_, index) => source[index % source.length],
    )
    const meridians = Array.from({ length: meridianCount }, (_, index) => {
      const group = document.createElementNS(SVG_NAMESPACE, 'g')
      star.append(group)
      return {
        group,
        longitude: (index / meridianCount) * Math.PI * 2,
        points: [],
      }
    })

    glyphs.forEach((glyph, index) => {
      const meridian = meridians[Math.floor(index / latitudeCount)]
      const row = index % latitudeCount
      const latitude = (-0.4 + (0.8 * row) / (latitudeCount - 1)) * Math.PI
      const ring = Math.cos(latitude)
      const text = document.createElementNS(SVG_NAMESPACE, 'text')
      const variation = ((index * 41 + 17) % 109) / 108
      const phase = ((index * 67) % 109) / 108
      const duration = 3.4 + variation * 5.2
      text.textContent = glyph
      text.style.setProperty('--readings-twinkle-duration', `${duration.toFixed(2)}s`)
      text.style.setProperty('--readings-twinkle-delay', `${(-phase * duration).toFixed(2)}s`)
      text.style.setProperty('--readings-twinkle-floor', (0.42 + variation * 0.28).toFixed(2))
      text.style.setProperty('--readings-twinkle-mid', (0.58 + variation * 0.24).toFixed(2))
      meridian.group.append(text)
      meridian.points.push({
        text,
        latitude,
        x: ring * Math.sin(meridian.longitude),
        y: Math.sin(latitude),
        z: ring * Math.cos(meridian.longitude),
      })
    })

    const draw = (rotation) => {
      const sine = Math.sin(rotation)
      const cosine = Math.cos(rotation)
      meridians.forEach((meridian) => {
        meridian.depth = Math.cos(meridian.longitude + rotation)
        meridian.points.forEach((point) => {
          const x = point.x * cosine + point.z * sine
          const z = point.z * cosine - point.x * sine
          const depth = (z + 1) / 2
          const projection = perspective / (perspective - z * radius)
          const latitudeScale = 0.48 + Math.cos(point.latitude) * 0.72
          const scale = latitudeScale * (0.76 + depth * 0.28) * projection
          const opacity = 0.12 + depth ** 1.55 * 0.82
          const screenX = 930 + x * radius * projection
          const screenY = 215 + point.y * radius * projection
          point.text.setAttribute(
            'transform',
            `translate(${screenX.toFixed(2)} ${screenY.toFixed(2)}) scale(${scale.toFixed(3)})`,
          )
          point.text.setAttribute('opacity', opacity.toFixed(3))
        })
      })
      meridians.toSorted((a, b) => a.depth - b.depth).forEach(({ group }) => star.append(group))
    }

    draw(Math.PI / meridianCount)
  }

  const selectedValue = (name) => $(`[name="${name}"]:checked`, $station).value

  const readingSystems = Object.freeze({
    minnan: {
      name: '閩南語',
      lang: 'nan-TW',
      contentLang: 'zh-nan-Hant-TW',
      groupLabel: '讀全篇捷報',
      annotationLang: 'nan-Bopo-TW',
    },
    mandarin: {
      name: '國語',
      lang: 'zh-TW',
      contentLang: 'zh-Hant-TW',
      groupLabel: '國語讀全篇',
      annotationLang: 'zh-Bopo-TW',
    },
    japanese: {
      name: '日文',
      lang: 'ja-JP',
      contentLang: 'ja',
      groupLabel: '日文讀全篇',
      annotationLang: 'ja',
    },
    korean: {
      name: '韓文',
      lang: 'ko-KR',
      contentLang: 'ko',
      groupLabel: '韓文讀全篇',
      annotationLang: 'ko',
    },
  })

  let voices = []
  let $activeButton = null
  let activeUtterance = null
  let activeRecording = null
  let currentMode = 'minnan'

  const localizedSelectors = [
    '#story-title > h2[lang]',
    '#elements-title > h2[lang]',
    '.Rail > article > .Dispatch[lang]',
    '.Rail > figure > .Legend > li > [lang]',
  ]

  const renderLocalizedChrome = (mode) => {
    const contentLang = readingSystems[mode].contentLang
    localizedSelectors.forEach((selector) => {
      $$(selector, $station).forEach((element) => {
        element.hidden = element.getAttribute('lang') !== contentLang
      })
    })
  }

  const activeLocalized = (selector) => {
    const contentLang = readingSystems[currentMode].contentLang
    return $$(selector, $station).find((element) => element.getAttribute('lang') === contentLang)
  }

  const hiddenByDirection = (element) => {
    const direction = selectedValue('writing-mode')
    return (
      (element.classList.contains('HorizontalOnly') && direction === 'vertical') ||
      (element.classList.contains('VerticalOnly') && direction === 'horizontal')
    )
  }

  const textWithoutAnnotations = (root) => {
    const read = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return node.data
      if (node.nodeType !== Node.ELEMENT_NODE) return ''
      const element = /** @type {Element} */ (node)
      if (element.localName === 'rt') return ''
      return Array.from(element.childNodes, read).join('')
    }
    return read(root).trim()
  }

  /*
   * Speech is derived from the same ruby that the reader sees. rt is presentation
   * metadata, while aria-label on a ruby or punctuation span is an explicit TTS
   * override for a word a platform voice cannot reliably pronounce.
   */
  const speechText = (root) => {
    const read = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return node.data
      if (node.nodeType !== Node.ELEMENT_NODE) return ''
      const element = /** @type {Element} */ (node)
      if (
        element.localName === 'rt' ||
        element.hasAttribute('hidden') ||
        hiddenByDirection(element)
      )
        return ''
      if (element.matches('ruby[aria-label], span[aria-label]'))
        return element.getAttribute('aria-label')
      return Array.from(element.childNodes, read).join('')
    }

    return read(root)
      .replace(/\s+/g, ' ')
      .replace(/\s+([，。；：、,.!?])/g, '$1')
      .trim()
  }

  const elementSpeech = (button, mode = currentMode) => {
    const system = readingSystems[mode]
    const phonetic = $(':scope > ruby > ruby.zhuyin', button)
    const base = textWithoutAnnotations(phonetic)
    const annotation = $(
      `:scope > ruby > ${
        mode === 'minnan' || mode === 'mandarin' ? 'ruby.zhuyin > ' : ''
      }rt[lang="${system.annotationLang}"]`,
      button,
    )
    const reading =
      mode === 'minnan' || mode === 'mandarin'
        ? annotation.getAttribute('aria-label') ?? annotation.textContent
        : annotation.textContent.split('／')[0]

    return {
      language: system.name,
      lang: system.lang,
      reading,
      speech: mode === 'minnan' || mode === 'mandarin' ? base : reading,
    }
  }

  const elementMetadata = (button) => {
    const atomic = $(':scope > ruby > rt data', button).value
    const name = textWithoutAnnotations($(':scope > ruby > ruby.zhuyin', button))
    const assignment = button.title.split('・').at(-1)
    const [system, aboard] = assignment.split('：', 2)
    return { atomic, name, system, aboard }
  }

  const renderElementSpeechMode = (mode) => {
    $$('button[name="speak-element"]', $station).forEach((button) => {
      const speech = elementSpeech(button, mode)
      const element = elementMetadata(button)
      button.setAttribute(
        'aria-label',
        `播放${element.atomic}號元素${element.name}的${speech.language}讀音：${speech.reading}；${element.system}用途：${element.aboard}`,
      )
    })
  }

  const storySpeech = () => {
    const title = activeLocalized('#story-title > h2[lang]')
    const dispatch = activeLocalized('.Rail > article > .Dispatch[lang]')
    return [title, ...$$(':scope > p', dispatch)].map(speechText).join('')
  }

  const elementsSpeech = () => {
    const title = activeLocalized('#elements-title > h2[lang]')
    const elements = $$('button[name="speak-element"]', $station)
      .map((button) => elementSpeech(button).speech)
      .join('、')
    return `${speechText(title)}${elements}`
  }

  const speechFor = (button) => {
    if (button.name === 'speak-element') return elementSpeech(button).speech
    if (button.value === 'story') return storySpeech()
    if (button.value === 'elements') return elementsSpeech()
    return ''
  }

  const recordingFor = (button) => {
    if (currentMode !== 'minnan' || typeof window.Audio !== 'function') return null
    if (button.name === 'speak-element') {
      return `${AUDIO_ROOT}/elements-minnan/${encodeURIComponent(button.value)}.mp3`
    }
    if (button.value === 'elements') return `${AUDIO_ROOT}/elements-minnan/all.mp3`
    if (button.value !== 'story') return null
    const direction = selectedValue('writing-mode') === 'vertical' ? '-left' : ''
    return `${AUDIO_ROOT}/dispatch-minnan${direction}.mp3`
  }

  const voiceLanguage = (voice) => voice.lang.toLowerCase().replaceAll('_', '-')

  const matchingVoice = (lang) => {
    const target = lang.toLowerCase()
    if (target.startsWith('nan')) {
      const namePattern = /hokkien|min[ -]?nan|閩南/i
      return (
        voices.find((voice) => voiceLanguage(voice).startsWith('nan')) ??
        voices.find((voice) => namePattern.test(voice.name)) ??
        null
      )
    }

    const direct =
      voices.find((voice) => voiceLanguage(voice) === target) ??
      voices.find((voice) => voiceLanguage(voice).startsWith(target.split('-')[0]))
    if (direct || !target.startsWith('zh')) return direct ?? null
    return (
      voices.find((voice) => voiceLanguage(voice).startsWith('zh-tw')) ??
      voices.find((voice) => voiceLanguage(voice).startsWith('zh')) ??
      null
    )
  }

  const refreshVoices = () => {
    voices = synth?.getVoices() ?? []
    $$('button:is([name="speak"], [name="speak-element"])', $station).forEach((button) => {
      button.disabled = !synth && !recordingFor(button)
    })
  }

  const clearActive = () => {
    $activeButton?.removeAttribute('aria-busy')
    $activeButton = null
    activeUtterance = null
    activeRecording = null
  }

  const stopActive = () => {
    synth?.cancel()
    activeRecording?.pause()
    clearActive()
  }

  const renderReadingSystem = (mode) => {
    if (!readingSystems[mode]) return
    stopActive()
    currentMode = mode
    renderLocalizedChrome(mode)
    $numbersGroup.textContent = readingSystems[mode].groupLabel
    renderElementSpeechMode(mode)
    refreshVoices()
  }

  const requestRailLayout = () => {
    const rail = $('.Rail', $station)
    rail.scrollLeft = 0
    rail.scrollTop = 0
    requestAnimationFrame(() => rail.dispatchEvent(new Event('han-rail-layout')))
  }

  const setFontSize = () => {
    const value = Number($fontSize.value)
    $station.style.setProperty('--readings-font-size', `${value}px`)
    $fontSizeOutput.value = `${value}px`
  }

  const speakWithBrowser = (button) => {
    if (!synth) return
    refreshVoices()
    const lang = readingSystems[currentMode].lang
    const voice = matchingVoice(lang)
    const utterance = new SpeechSynthesisUtterance(speechFor(button))
    utterance.lang = lang
    utterance.rate = lang.startsWith('nan') ? 0.78 : 0.82
    if (voice) utterance.voice = voice
    $activeButton = button
    activeUtterance = utterance
    button.setAttribute('aria-busy', 'true')

    utterance.addEventListener('end', () => {
      if (activeUtterance !== utterance) return
      clearActive()
      refreshVoices()
    })
    utterance.addEventListener('error', (event) => {
      if (activeUtterance !== utterance || ['canceled', 'interrupted'].includes(event.error)) return
      clearActive()
    })
    synth.speak(utterance)
  }

  const speakWithRecording = (button, source) => {
    const recording = new Audio(source)
    $activeButton = button
    activeRecording = recording
    button.setAttribute('aria-busy', 'true')

    const finish = () => {
      if (activeRecording !== recording) return
      clearActive()
    }
    const fallBack = () => {
      if (activeRecording !== recording) return
      recording.pause()
      clearActive()
      speakWithBrowser(button)
    }

    recording.addEventListener('ended', finish, { once: true })
    recording.addEventListener('error', fallBack, { once: true })
    recording.play().catch(fallBack)
  }

  const speak = (button) => {
    stopActive()
    const source = recordingFor(button)
    if (source) speakWithRecording(button, source)
    else speakWithBrowser(button)
  }

  renderScriptOrbits()
  renderHunminStar()
  renderReadingSystem(currentMode)

  $$('button:is([name="speak"], [name="speak-element"])', $station).forEach((button) => {
    button.addEventListener('click', () => speak(button))
  })

  $$('[name="reading-mode"]', $station).forEach((input) => {
    input.addEventListener('change', () => {
      if (input.checked) renderReadingSystem(input.value)
    })
  })

  $$('[name="writing-mode"], [name="annotation-position"]', $station).forEach((input) => {
    input.addEventListener('change', () => {
      if (!input.checked) return
      stopActive()
      requestRailLayout()
    })
  })

  $fontSize.addEventListener('input', setFontSize)
  setFontSize()

  initRailNav()
  initSkyMotion()
  if (synth) synth.addEventListener('voiceschanged', refreshVoices)
  refreshVoices()
  window.addEventListener('pagehide', stopActive)
}
