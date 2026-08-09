/**
 * `transpileRuby` — opt-in down-leveler for W3C tabular ruby. `<rb>`/`<rtc>`
 * markup is conforming, but no engine renders the tabular model
 * interoperably, so it is down-leveled the way newer-standard JS is
 * transpiled: one base per ruby, extra annotation layers as nested
 * `<ruby>`. Not wired into `installFallbacks` — call it yourself, once
 * (SSR/build time, or after load). Purely structural: base text is never
 * inspected, and structural mismatches throw so authoring errors surface.
 */

import { element, hype, type Hyperly, type Hype } from 'hyperly/fp'

class WarnAndSkipError extends Error {}

const CANDIDATE_SELECTOR = 'ruby:has(> rb):has(> rtc)'
const MULTI_RT_SELECTOR = 'ruby:where(.zhuyin, .mps):not(:has(> rb)):not(:has(> rtc))'
const hasMultiDirectRt = (el: Element): boolean =>
  [...el.children].filter(c => isTagged(c, 'rt')).length >= 2

const isElement = (n: Node): n is Element => n.nodeType === 1
const isText = (n: Node): n is Text => n.nodeType === 3
const isTagged = (n: Node, tag: string): n is Element =>
  isElement(n) && n.tagName.toLowerCase() === tag
const isWhitespaceText = (n: Node): boolean => isText(n) && /^[ \t\n\r\f]*$/.test(n.data)
const hasZhuyinClass = (el: Element): boolean =>
  el.classList.contains('zhuyin') || el.classList.contains('mps')

interface Base {
  nodes: Node[]
}

interface ExtraRtc {
  rtc: Element
  rts: Array<{ rt: Element; rbspan: number }>
}

interface Parsed {
  bases: Base[]
  isZhuyinBase: boolean
  primaryRts: Element[]
  extraRtcs: ExtraRtc[]
  /** Map base-index → nodes (text or wrapper elements) that must follow that base's output. */
  nodesAfter: Map<number, Node[]>
}

const parseRbspan = (rt: Element): { rt: Element; rbspan: number } | null => {
  const v = parseInt(rt.getAttribute('rbspan') ?? '1', 10)
  return v > 0 ? { rt, rbspan: v } : null
}

const getRts = (rtc: Element): Element[] =>
  [...rtc.children].filter((c): c is Element => isTagged(c, 'rt'))

const parseTabularRuby = (ruby: Element): Parsed | null => {
  const bases: Base[] = []
  const allRtcs: Element[] = []
  const nodesAfter = new Map<number, Node[]>()
  const doc = ruby.ownerDocument!
  const parentHasZhuyinClass = hasZhuyinClass(ruby)

  for (const child of [...ruby.childNodes]) {
    if (isTagged(child, 'rp') || isWhitespaceText(child)) continue
    if (isTagged(child, 'rb')) { bases.push({ nodes: [...child.childNodes] }); continue }
    if (isTagged(child, 'rtc')) { allRtcs.push(child); continue }
    const lastIdx = bases.length - 1
    if (lastIdx < 0) continue
    if (isText(child)) {
      const stripped = child.data.replace(/\s/g, '')
      if (!stripped) continue
      const arr = nodesAfter.get(lastIdx) ?? []
      arr.push(doc.createTextNode(stripped))
      nodesAfter.set(lastIdx, arr)
    } else if (isElement(child)) {
      const arr = nodesAfter.get(lastIdx) ?? []
      arr.push(child.cloneNode(true))
      nodesAfter.set(lastIdx, arr)
    }
  }

  if (bases.length === 0) return null

  // Prefer rtc with zhuyin/mps class as primary; fall back to first in order
  const zhuyinRtc = allRtcs.find(hasZhuyinClass)
  const primaryRtc = zhuyinRtc ?? allRtcs[0]
  if (!primaryRtc) return null

  const isZhuyinBase = zhuyinRtc != null || parentHasZhuyinClass
  const primaryRts = getRts(primaryRtc)
  const extraRtcs = allRtcs
    .filter(rtc => rtc !== primaryRtc)
    .map(rtc => ({
      rtc,
      rts: getRts(rtc)
        .map(rt => hasZhuyinClass(rtc) ? { rt, rbspan: 1 } : parseRbspan(rt))
        .filter((x): x is { rt: Element; rbspan: number } => x !== null),
    }))

  if (primaryRts.length !== bases.length) {
    throw new WarnAndSkipError(
      `[han.css] transpileRuby: ${bases.length} <rb> base(s) but ${primaryRts.length} primary <rt>(s) — skipping.`,
    )
  }

  for (const { rts } of extraRtcs) {
    const total = rts.reduce((s, { rbspan }) => s + rbspan, 0)
    if (total > bases.length) {
      throw new Error(
        `[han.css] transpileRuby: rbspan total (${total}) ≠ base count (${bases.length}).`,
      )
    }
  }

  return { bases, isZhuyinBase, primaryRts, extraRtcs, nodesAfter }
}


interface SegmentRange {
  start: number
  end: number
  followingNodes: Node[]
}

const buildSegments = (parsed: Parsed): SegmentRange[] => {
  const segments: SegmentRange[] = []
  let segStart = 0
  for (let i = 0; i < parsed.bases.length; i++) {
    const nodes = parsed.nodesAfter.get(i)
    if (nodes?.length) {
      segments.push({ start: segStart, end: i + 1, followingNodes: nodes })
      segStart = i + 1
    }
  }
  if (segStart < parsed.bases.length) {
    segments.push({ start: segStart, end: parsed.bases.length, followingNodes: [] })
  }
  return segments
}

interface InheritedAttrs {
  lang: string | null
  id: string | null
  /** Other attrs to copy onto every output ruby (data-*, etc.). */
  rest: Array<{ name: string; value: string }>
}

const collectInherited = (ruby: Element): InheritedAttrs => {
  const rest: Array<{ name: string; value: string }> = []
  let lang: string | null = null
  let id: string | null = null
  for (const attr of [...ruby.attributes]) {
    if (attr.name === 'lang') { lang = attr.value; continue }
    if (attr.name === 'id') { id = attr.value; continue }
    if (attr.name === 'class') continue
    rest.push({ name: attr.name, value: attr.value })
  }
  return { lang, id, rest }
}

const splitMultiRtRuby = (ruby: Element, doc: Document, inherited: InheritedAttrs): Node[] => {
  const rubyClass = ruby.classList.contains('mps') ? 'mps' : 'zhuyin'
  const result: Node[] = []
  let pendingBase: Node[] = []
  let isFirst = true

  for (const child of [...ruby.childNodes]) {
    if (isWhitespaceText(child)) continue
    if (isTagged(child, 'rt')) {
      if (pendingBase.length === 0) continue  // orphaned rt (concatenated form) — skip silently
      const out = doc.createElement('ruby')
      out.setAttribute('class', rubyClass)
      if (inherited.lang) out.setAttribute('lang', inherited.lang)
      if (isFirst) {
        if (inherited.id) out.setAttribute('id', inherited.id)
        for (const { name, value } of inherited.rest) out.setAttribute(name, value)
        isFirst = false
      }
      for (const n of pendingBase) out.appendChild(n.cloneNode(true))
      out.appendChild(cloneRtContent(doc, child as Element))
      result.push(out)
      pendingBase = []
    } else {
      pendingBase.push(child)
    }
  }

  // trailing non-annotated nodes (e.g. punctuation after last base)
  for (const n of pendingBase) result.push(n.cloneNode(true))

  return result
}

const cloneRtContent = (doc: Document, src: Element): Element => {
  const rt = doc.createElement('rt')
  for (const n of [...src.childNodes]) rt.appendChild(n.cloneNode(true))
  if (rt.childNodes.length === 1 && isText(rt.firstChild!)) {
    ;(rt.firstChild as Text).data = (rt.firstChild as Text).data.trim()
  }
  return rt
}

const buildSegmentOutput = (
  doc: Document,
  parsed: Parsed,
  range: SegmentRange,
  inherited: InheritedAttrs,
  applyId: boolean,
): Element[] => {
  // Layer 0: per-base primary rubies
  let layer: Element[] = []
  for (let i = range.start; i < range.end; i++) {
    const ruby = doc.createElement('ruby')
    if (parsed.isZhuyinBase) ruby.setAttribute('class', 'zhuyin')
    if (inherited.lang) ruby.setAttribute('lang', inherited.lang)
    for (const node of parsed.bases[i]!.nodes) ruby.appendChild(node.cloneNode(true))
    ruby.appendChild(cloneRtContent(doc, parsed.primaryRts[i]!))
    layer.push(ruby)
  }

  // Each extra rtc wraps the current layer in another nesting level
  for (const extra of parsed.extraRtcs) {
    let offset = 0
    const nextLayer: Element[] = []
    let consumedUpTo = range.start
    for (const { rt, rbspan } of extra.rts) {
      const coverStart = offset
      const coverEnd = offset + rbspan
      offset = coverEnd
      if (coverEnd <= range.start || coverStart >= range.end) continue
      const clampedStart = Math.max(coverStart, range.start)
      const clampedEnd = Math.min(coverEnd, range.end)
      if (clampedEnd <= clampedStart) continue
      if (clampedStart !== coverStart || clampedEnd !== coverEnd) {
        throw new WarnAndSkipError(
          '[han.css] transpileRuby: rbspan crosses an embedded-punctuation segment boundary — skipping.',
        )
      }
      const outer = doc.createElement('ruby')
      if (inherited.lang) outer.setAttribute('lang', inherited.lang)
      for (let i = clampedStart; i < clampedEnd; i++) {
        const inner = layer[i - range.start]
        if (inner) outer.appendChild(inner)
      }
      const outerRt = cloneRtContent(doc, rt)
      const rtcLang = extra.rtc.getAttribute('lang')
      if (rtcLang) outerRt.setAttribute('lang', rtcLang)
      outer.appendChild(outerRt)
      nextLayer.push(outer)
      consumedUpTo = clampedEnd
    }
    // Bare-output bases not covered by this rtc's rbspan total
    for (let i = consumedUpTo; i < range.end; i++) {
      const inner = layer[i - range.start]
      if (inner) nextLayer.push(inner)
    }
    layer = nextLayer
  }

  if (applyId && layer.length > 0) {
    if (inherited.id) layer[0]!.setAttribute('id', inherited.id)
    for (const { name, value } of inherited.rest) layer[0]!.setAttribute(name, value)
  }

  return layer
}

/**
 * Rewrite every tabular / multi-`<rt>` ruby under `src` into the interop
 * form (see file header). Idempotent: input already in the interop form
 * is left untouched.
 *
 * Accepts any `Hyperly` source (`string | Element | Hype`); returns
 * `Hype`. Best invoked once during SSR or as an opt-in browser-side
 * compat shim.
 */
export const transpileRuby = (src: Hyperly): Hype => {
  const h = hype(src)
  const root = element(h)
  const selfMatch = root.matches(CANDIDATE_SELECTOR) ? [root as HTMLElement] : []

  for (const ruby of [...selfMatch, ...root.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR)]) {
    try {
      const parsed = parseTabularRuby(ruby)
      if (!parsed) continue

      const doc = ruby.ownerDocument!
      const inherited = collectInherited(ruby)
      const segments = buildSegments(parsed)

      const fragment = doc.createDocumentFragment()
      for (let s = 0; s < segments.length; s++) {
        const seg = segments[s]!
        const out = buildSegmentOutput(doc, parsed, seg, inherited, s === 0)
        for (const r of out) fragment.appendChild(r)
        for (const n of seg.followingNodes) fragment.appendChild(n)
      }
      ruby.replaceWith(fragment)
    } catch (e) {
      if (e instanceof WarnAndSkipError) { console.warn(e.message); continue }
      throw e
    }
  }

  // Pass 2: conforming zhuyin/mps ruby with multiple <rt> → split into per-base rubies for the inter-character fallback
  const selfMatchMulti = root.matches(MULTI_RT_SELECTOR) && hasMultiDirectRt(root) ? [root as HTMLElement] : []
  for (const ruby of [...selfMatchMulti, ...root.querySelectorAll<HTMLElement>(MULTI_RT_SELECTOR)]) {
    if (!hasMultiDirectRt(ruby)) continue
    const doc = ruby.ownerDocument!
    const inherited = collectInherited(ruby)
    const fragment = doc.createDocumentFragment()
    for (const n of splitMultiRtRuby(ruby, doc, inherited)) fragment.appendChild(n)
    ruby.replaceWith(fragment)
  }

  return h
}
