/** Render the focused punctuation page's SSR column with the real Node pass. */
export const renderPunctuationSqueezePage = async (source) => {
  const [{ Window }, { installFallbacks }, { html }] = await Promise.all([
    import('happy-dom'),
    import('@hanzi.pro/han.css/ssr'),
    import('hyperly/fp'),
  ])
  const win = new Window()
  win.document.write(source)

  for (const row of win.document.querySelectorAll('[data-case]')) {
    const template = row.querySelector('script[data-source]')
    const output = row.querySelector('[data-path="ssr"]')
    if (!template || !output) continue
    const specimen = `<span class="Measure">${template.textContent.trim()}</span>`
    output.innerHTML = html(installFallbacks(specimen))
    output.setAttribute('data-node-rendered', '')
  }

  return '<!doctype html>\n' + win.document.documentElement.outerHTML
}
