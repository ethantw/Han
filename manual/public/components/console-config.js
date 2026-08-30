
















import { DEFAULTS, MODULES, HERITAGE_LOCALES } from '/home/codegen.js'
import { icon } from '../common/icon.js'
import {
  fallbackPlan,
  fallbackRunKind,
  effectiveVars,
  getConfigPath,
  sameFallbackPlan,
  setConfigPath,
} from './console-config-state.js'
import {
  applyConfigModules,
  applyConfigTarget,
  applyFallbacks,
  applyFallbacksPreservingCascade,
  clearFallbackModes,
  scheduleFallbacks,
} from './console-config-runtime.js'





const readControl = ($el) => ($el.type === "checkbox" ? $el.checked : $el.value)

/** Mounts the configuration console and applies its state to the target document. */
export const mountConsoleConfig = ({ root, target, dispatch, initial, passiveInit = false }) => {
  const configRef = { current: structuredClone(initial ?? DEFAULTS) }
  const appliedRef = { current: { vars: null, baseGeneric: null } }
  const fallbackAppliedRef = { current: null }
  const fallbackDesiredRef = { current: null }
  const fallbackGenerationRef = { current: 0 }








  const deliveryRef = { current: configRef.current.webfontDelivery }
  const webfontMemo = { current: null }

  const controls = () => [...root.querySelectorAll('[data-cfg] [data-cfg-key]')]
  const $autospaceOn = () => root.querySelector('[data-cfg-key="autospaceOn"]')
  const $autospaceMode = () => root.querySelector('[data-cfg-key="autospaceMode"]')





  const defaultFor = (key) =>
    key === 'autospaceOn' ? DEFAULTS.autospace !== 'off'
    : key === 'autospaceMode' ? 'normal'
    : getConfigPath(DEFAULTS, key)










  const groupControls = ($group) => [...$group.querySelectorAll('[data-cfg-key]')]
  const groups = () => [...root.querySelectorAll('.ControlGroup')]
    .map(($group) => ({
      $group,
      $head: $group.querySelector(':scope > summary, :scope > header'),
    }))
    .filter(({ $group, $head }) => $head && groupControls($group).length)

  const injectDefaultButtons = () => {
    const label = root.querySelector('.Controls')?.dataset.labelDefault ?? 'Use default'
    groups().forEach(({ $group, $head }) => {
      const $btn = document.createElement('button')
      $btn.type = 'button'
      $btn.dataset.action = 'restore-defaults'
      $btn.append(icon('reset'), label)
      $btn.title = label
      $btn.hidden = true
      $btn.addEventListener('click', (e) => {
        e.preventDefault()
        groupControls($group).forEach(($el) => {
          const key = $el.dataset.cfgKey
          const v = defaultFor(key)
          if ($el.type === 'checkbox') $el.checked = v
          else $el.value = v
          if (key !== 'autospaceOn' && key !== 'autospaceMode')
            configRef.current = setConfigPath(configRef.current, key, v)
        })
        sync('reset')
      })
      $head.append($btn)
    })
  }

  const updateDefaultButtons = () => {
    groups().forEach(({ $group, $head }) => {
      const $btn = $head.querySelector(':scope > [data-action="restore-defaults"]')
      if (!$btn) return
      $btn.hidden = groupControls($group)
        .every(($el) => readControl($el) === defaultFor($el.dataset.cfgKey))
    })
  }

  const applyVisibility = () => {
    const c = configRef.current
    const anyHeritageWebfont = HERITAGE_LOCALES.some((loc) => c.heritage[loc] === 'webfont')
    root.querySelectorAll('[data-cfg-heritage-family]').forEach(($el) => {
      $el.toggleAttribute('hidden', !anyHeritageWebfont)
    })
    root.querySelectorAll('[data-cfg-cursive-family]').forEach(($el) => {
      $el.toggleAttribute('hidden', c.cursive !== 'webfont')
    })
    root.querySelectorAll('[data-cfg-webfont-cdn-source]').forEach(($el) => {
      $el.toggleAttribute('hidden', c.webfontDelivery !== 'cdn')
    })



    for (const key of MODULES) {
      root.querySelector(`details[data-module="${key}"]`)
        ?.toggleAttribute('data-module-off', !c[key])
    }


    const noWebfont = c.webfontDelivery === 'none'
    const webfontSelectKeys = [
      ...HERITAGE_LOCALES.map((loc) => `heritage.${loc}`),
      'cursive',
    ]
    for (const key of webfontSelectKeys) {
      const $opt = root.querySelector(`[data-cfg-key="${key}"] option[value="webfont"]`)
      if ($opt) $opt.disabled = noWebfont
    }
    root.querySelectorAll('[data-cfg-key^="punct."] option').forEach(($opt) => {
      if ($opt.value !== 'off') $opt.disabled = noWebfont
    })
    root.querySelector('[data-cfg-advanced]')
      ?.toggleAttribute('hidden', !c.fallbacks)
  }

  const sync = (source, { applyRuntime = true } = {}) => {


    const delivery = configRef.current.webfontDelivery
    if (delivery !== deliveryRef.current) {
      if (source === 'reset') {
        webfontMemo.current = null
      } else if (delivery === 'none') {
        webfontMemo.current = {
          heritage: { ...configRef.current.heritage },
          cursive: configRef.current.cursive,
          punct: { ...configRef.current.punct },
        }
        configRef.current = {
          ...configRef.current,

          heritage: { hant: 'system-ja', hans: 'off', ja: 'off', ko: 'off' },
          cursive: 'system',
          punct: { hant: 'off', hans: 'off', ja: 'off', ko: 'off' },
        }
        writeControls(configRef.current)
      } else if (webfontMemo.current) {
        configRef.current = { ...configRef.current, ...webfontMemo.current }
        webfontMemo.current = null
        writeControls(configRef.current)
      }
      deliveryRef.current = delivery
    }


    const jsMode = configRef.current.fallbacks ? $autospaceMode().value : 'normal'
    configRef.current = {
      ...configRef.current,
      autospace: $autospaceOn().checked ? jsMode : 'off',
    }




    if (applyRuntime && source !== 'init') {
      document.dispatchEvent(new CustomEvent('han-config-will-apply', {
        detail: { source },
      }))
    }

    if (applyRuntime) {
      applyConfigTarget(configRef.current, appliedRef.current)
      applyConfigModules(configRef.current)
      const plan = fallbackPlan(configRef.current)
      const fallbackConfigChanged = !sameFallbackPlan(plan, fallbackDesiredRef.current)
      fallbackDesiredRef.current = plan
      if (fallbackConfigChanged) clearFallbackModes(target)

      const runKind = fallbackConfigChanged
        ? fallbackRunKind(plan, fallbackAppliedRef.current)
        : null
      if (fallbackConfigChanged && !runKind) {
        fallbackGenerationRef.current += 1
      }

      if (runKind) {
        clearFallbackModes(target)
        if (source === 'init') {
          const generation = ++fallbackGenerationRef.current
          const snapshot = structuredClone(configRef.current)
          applyFallbacks(
            snapshot,
            target,
            () => generation === fallbackGenerationRef.current,
          ).then(() => {
            if (generation === fallbackGenerationRef.current)
              fallbackAppliedRef.current = plan
          })
        } else {
          scheduleFallbacks(
            configRef.current,
            target,
            runKind,
            fallbackGenerationRef,
            () => { fallbackAppliedRef.current = plan },
          )
        }
      }
    }
    applyVisibility()
    updateDefaultButtons()
    dispatch(configRef.current, source)
  }


  const writeControls = (config) => {
    controls().forEach(($el) => {
      const key = $el.dataset.cfgKey
      if (key === 'autospaceOn') { $el.checked = config.autospace !== 'off'; return }
      if (key === 'autospaceMode') { $el.value = config.autospace === 'off' ? 'normal' : config.autospace; return }
      const v = getConfigPath(config, key)
      if ($el.type === 'checkbox') $el.checked = v
      else $el.value = v
    })
  }


  if (initial) writeControls(configRef.current)

  injectDefaultButtons()

  controls().forEach(($el) => {
    const key = $el.dataset.cfgKey
    $el.addEventListener('input', () => {
      if (key !== 'autospaceOn' && key !== 'autospaceMode')
        configRef.current = setConfigPath(configRef.current, key, readControl($el))


      if (MODULES.includes(key)) {
        const $details = root.querySelector(`details[data-module="${key}"]`)
        if ($details) $details.open = $el.checked
      }
      sync(key)
    })
  })


  const reset = () => {
    configRef.current = structuredClone(DEFAULTS)
    writeControls(DEFAULTS)
    sync('reset')
  }

  /* A second console can render the same config without becoming a second
     runtime owner. Its peer calls this after a real user change: refresh the
     controls and internal baselines silently, then let the originating
     instance remain the sole broadcaster. */
  const replace = (config) => {
    configRef.current = structuredClone(config)
    deliveryRef.current = configRef.current.webfontDelivery
    webfontMemo.current = null
    writeControls(configRef.current)
    applyVisibility()
    updateDefaultButtons()
    appliedRef.current = {
      vars: effectiveVars(configRef.current),
      baseGeneric: configRef.current.baseGeneric,
    }
    const plan = fallbackPlan(configRef.current)
    fallbackDesiredRef.current = plan
    fallbackAppliedRef.current = plan
  }

  sync('init', { applyRuntime: !passiveInit })
  if (passiveInit) replace(configRef.current)

  return {
    reset,
    replace,
    reapplyFallbacks: ($t) => $t
      ? applyFallbacksPreservingCascade(configRef.current, $t)
      : applyFallbacks(configRef.current, target),
    get config() { return configRef.current },



    setMetrics: (metrics) => {
      configRef.current = { ...configRef.current, metrics: { ...metrics } }
      sync('metrics')
    },
  }
}
