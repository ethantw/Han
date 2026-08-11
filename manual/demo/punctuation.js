/**
 * Workbench for the punctuation passes (demo/punctuation.html).
 *
 * The page deliberately does NOT load `han.auto`. Every specimen runs its own
 * pass, so four modes can sit side by side and the emitted markup is visible
 * per specimen — which is the whole point of a workbench as opposed to the
 * specimen page.
 *
 * Two kinds of control, and the split is the page's argument:
 *   re-run    the mode and the autospace mode decide WHICH wrappers exist
 *   cascade   everything else decides whether existing wrappers count today
 * Only the first kind calls back into the library.
 */

/* `/han/han.js`, the same entry the manual's own console imports — it is what
 * `syncFramework` keeps in step with `dist/`. (`han.browser.js` is NOT in that
 * list; the copy sitting in `public/han/` is a leftover from an older build and
 * silently serves a stale API.) */
import {
  uninstallFallbacks,
  refinePunctuation,
  refinePunctuationWithMode,
  markQuoteBoundaries,
  applyISSWithMode,
} from '/han/han.js'

const $console = document.querySelector('#console')
const $root = document.documentElement
const specimens = [...document.querySelectorAll('[data-specimen]')]

/* ─── cascade half ───────────────────────────────────────────────────────── */

/** Console control name → the cascade variable it drives. Data, not code:
 *  adding a switch is one `<select>` plus one line here. */
const CASCADE_VARS = {
  'cite-marks': '--han-cite-title-marks',
  'q-quotes': '--han-q-quotes',
  semantics: '--han-semantics',
  'punctuation-hant': '--han-punctuation-hant',
  heritage: '--han-use-heritage-glyphs-for-hant',
}

const value = (name) => $console.elements[name].value

const applyCascade = () => {
  for (const [name, prop] of Object.entries(CASCADE_VARS)) {
    $root.style.setProperty(prop, value(name))
  }
  $root.style.setProperty('--ui-column', `${value('column')}em`)

  // The writing-mode mirror is a documented prerequisite, not a convenience:
  // CSS cannot condition on `writing-mode` itself, so every vertical subtree
  // has to declare the mirror alongside it (here the CSS keys off the
  // checkbox and this keeps the mirror in step).
  $root.style.setProperty(
    '--han-writing-mode',
    $console.elements.vertical.checked ? 'vertical-rl' : 'horizontal-tb',
  )

  // Language rides on the specimens rather than the root: a few cells pin
  // their own `lang` to make a point, and those must survive the switch.
  // `in`, not truthiness — a `data-*` flag's value is the empty string, which
  // is falsy, so `if (!$box.dataset.langPinned)` overwrites every pin.
  for (const $s of specimens) {
    const $box = $s.querySelector('.Specimen')
    if (!('langPinned' in $box.dataset)) $box.lang = value('lang')
  }
}

/* ─── re-run half ────────────────────────────────────────────────────────── */

/** A specimen's mode: its own `data-mode`, or the console's. `cascade` means
 *  "let `refinePunctuation` resolve it", which is the dispatching entry the
 *  library ships as its default. */
const modeOf = ($s) => $s.dataset.mode ?? value('refinement')

const runPasses = () => {
  for (const $s of specimens) {
    const $box = $s.querySelector('.Specimen')
    uninstallFallbacks($box)

    const mode = modeOf($s)
    if (mode === 'cascade') refinePunctuation($box)
    else refinePunctuationWithMode(mode)($box)

    if ($console.elements.fix.checked) markQuoteBoundaries($box)

    applyISSWithMode(value('autospace'))($box)
  }
}

/* ─── reporting ──────────────────────────────────────────────────────────── */

/* Everything below reports what is actually on the DOM. Nothing is a
 * hand-written expectation except `data-expect`, which the browser cannot
 * answer: computed `content` reports the `close-quote` keyword whether or not
 * a bracket was painted, so "is a bracket drawn" is not observable from here
 * (it was measured by width instead — docs/notes/2026-08-11-…). */

/** Scoped to `.Specimen`, never the whole cell: the passes wrap punctuation in
 *  HEADINGS too, and a `，` in a label once put the wrong `<h-layer>` first in
 *  document order — the cell then reported another element's verdict. */
const box = ($cell) => $cell.querySelector('.Specimen')

const reportTokens = ($cell) => {
  const $in = box($cell)
  const marks = [
    ...[...$in.querySelectorAll('[data-followed-by-quote]')].map(
      ($el) => `${$el.textContent} → ${$el.getAttribute('data-followed-by-quote')}`,
    ),
    ...[...$in.querySelectorAll('q[data-followed-by], cite[data-followed-by]')].map(
      ($el) => `<${$el.tagName.toLowerCase()}> → hangable`,
    ),
  ]
  $cell.querySelector('.Out').textContent =
    marks.length > 0 ? marks.join('\n') : '（無標記）'
}

const reportHang = ($cell) => {
  const $layer = box($cell).querySelector('h-layer')
  const hangs = $layer !== null && getComputedStyle($layer).display === 'inline-block'
  const ok = hangs === ($cell.dataset.expect === 'hang')
  $cell.querySelector('.Out').textContent =
    `${hangs ? '句號照懸' : '句號不懸'}　${ok ? '✓ 符合預期' : '✗ 不符預期'}`
}

/** Line-broken so a 200-character single line doesn't force a horizontal
 *  scroll through the whole page. */
const reportMarkup = ($cell) => {
  const $out = $cell.querySelector('.Markup')
  if ($out === null) return
  $out.textContent = box($cell).innerHTML
    .replace(/></g, '>\n<')
    .replace(/\n\s+\n/g, '\n')
    .trim()
}

const REPORTERS = {
  tokens: reportTokens,
  hang: reportHang,
  markup: reportMarkup,
}

const report = () => {
  for (const $s of specimens) REPORTERS[$s.dataset.report ?? 'tokens']($s)

  for (const $cell of document.querySelectorAll('[data-count]')) {
    $cell.textContent = document.querySelectorAll($cell.dataset.count).length
  }

  const declared = value('refinement')
  const native = CSS.supports('text-spacing-trim', 'trim-start')
  document.querySelector('#engine').textContent = [
    `CSS.supports('text-spacing-trim', 'trim-start')  →  ${native}`,
    `CSS.supports('text-autospace', 'normal')         →  ${CSS.supports('text-autospace', 'normal')}`,
    `CSS.supports('hanging-punctuation', 'allow-end') →  ${CSS.supports('hanging-punctuation', 'allow-end')}`,
    '',
    `宣告模式  ${declared}`,
    `實跑配方  ${declared === 'auto' && native ? 'hang（擠壓交給引擎，並補回接縫）' : declared}`,
  ].join('\n')

  const read = (prop) => getComputedStyle(specimens[0].querySelector('.Specimen'))
    .getPropertyValue(prop).trim() || '（未宣告）'
  document.querySelector('#state').textContent = [
    `lang                              ${box(specimens[0]).lang}`,
    `--han-punctuation-refinement      ${read('--han-punctuation-refinement')}`,
    `--han-punctuation-hant            ${read('--han-punctuation-hant')}`,
    `--han-use-heritage-glyphs-for-hant ${read('--han-use-heritage-glyphs-for-hant')}`,
    `--han-cite-title-marks            ${read('--han-cite-title-marks')}`,
    `--han-q-quotes                    ${read('--han-q-quotes')}`,
    `--han-semantics                   ${read('--han-semantics')}`,
    '',
    `⇒ --han-state-hanging-punctuation  ${read('--han-state-hanging-punctuation')}`,
  ].join('\n')
}

/* ─── composition root ───────────────────────────────────────────────────── */

/** Which controls change the DOM rather than only the cascade. */
const RERUN = new Set(['refinement', 'autospace', 'fix'])

const render = (rerun) => {
  applyCascade()
  if (rerun) runPasses()
  report()
}

// Pin the language of the cells that make a point of theirs before the first
// render overwrites them.
for (const $s of specimens) {
  const $box = $s.querySelector('.Specimen')
  if ($box.hasAttribute('lang')) $box.dataset.langPinned = ''
}

$console.addEventListener('input', (e) => render(RERUN.has(e.target.name)))
render(true)

// The mode switch writes an inline custom property onto each specimen, and the
// hang verdict is read back from used values — so a specimen that has just
// been re-wrapped must be measured after style has settled, not during the
// same task.
document.fonts.ready.then(() => report())
