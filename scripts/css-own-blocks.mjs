#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import postcss from 'postcss'

const insideKeyframes = (rule) => {
  for (let node = rule.parent; node; node = node.parent) {
    if (node.type === 'atrule' && /keyframes$/i.test(node.name)) return true
  }
  return false
}

const applyEdits = (css, edits) => edits
  .sort((a, b) => b.start - a.start)
  .reduce(
    (text, { start, end, replacement }) => text.slice(0, start) + replacement + text.slice(end),
    css,
  )

const unwrapRedundantOwnBlocks = (css, from) => {
  const root = postcss.parse(css, { from })
  const edits = []
  root.walkRules((rule) => {
    if (rule.selector.trim() !== '&' || rule.parent?.type !== 'rule') return

    const siblings = rule.parent.nodes.filter((node) => node !== rule)
    const hasOtherStructure = siblings.some((node) =>
      node.type === 'rule' || node.type === 'atrule',
    )
    if (hasOtherStructure || !rule.nodes?.length) return

    const start = rule.source.start.offset
    const end = rule.source.end.offset
    const lineStart = css.lastIndexOf('\n', start - 1) + 1
    const indent = css.slice(lineStart, start)
    const text = css.slice(start, end)
    const open = text.indexOf('{')
    const close = text.lastIndexOf('}')
    const rawInner = text.slice(open + 1, close)
    if (!rawInner.includes('\n')) {
      edits.push({ start, end, replacement: rawInner.trim() })
      return
    }

    const lines = rawInner.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n')
    const deindented = lines.map((line) => line.startsWith('  ') ? line.slice(2) : line)
    deindented[0] = deindented[0].startsWith(indent)
      ? deindented[0].slice(indent.length)
      : deindented[0].trimStart()
    edits.push({ start, end, replacement: deindented.join('\n') })
  })
  return applyEdits(css, edits)
}

const unwrapPseudoElementOwnBlocks = (css, from) => {
  const root = postcss.parse(css, { from })
  const edits = []
  root.walkRules((rule) => {
    if (!rule.selector.includes('::')) return
    const own = rule.nodes.find((node) => node.type === 'rule' && node.selector.trim() === '&')
    if (!own?.nodes?.length) return

    const start = own.source.start.offset
    const end = own.source.end.offset
    const lineStart = css.lastIndexOf('\n', start - 1) + 1
    const indent = css.slice(lineStart, start)
    const text = css.slice(start, end)
    const open = text.indexOf('{')
    const close = text.lastIndexOf('}')
    const rawInner = text.slice(open + 1, close)
    if (!rawInner.includes('\n')) {
      edits.push({ start, end, replacement: rawInner.trim() })
      return
    }

    const lines = rawInner.replace(/^\n/, '').replace(/\n\s*$/, '').split('\n')
    const deindented = lines.map((line) => line.startsWith('  ') ? line.slice(2) : line)
    deindented[0] = deindented[0].startsWith(indent)
      ? deindented[0].slice(indent.length)
      : deindented[0].trimStart()
    edits.push({ start, end, replacement: deindented.join('\n') })
  })
  return applyEdits(css, edits)
}

/** Wrap eligible direct declarations in a rule's leading native `& {}` block. */
export const transformOwnDeclarations = (css, { from = undefined } = {}) => {
  const normalized = unwrapRedundantOwnBlocks(unwrapPseudoElementOwnBlocks(css, from), from)
  const root = postcss.parse(normalized, { from })
  const skipped = []
  const edits = []

  root.walkRules((rule) => {
    // A nested `&` cannot represent a pseudo-element subject; declarations
    // must remain direct. See docs/notes/native-nesting-own-blocks.md.
    if (rule.selector.trim() === '&' || rule.selector.includes('::') || insideKeyframes(rule)) return

    const declarationIndexes = rule.nodes
      .map((node, index) => node.type === 'decl' ? index : -1)
      .filter((index) => index >= 0)
    if (!declarationIndexes.length) return

    const firstStructure = rule.nodes.findIndex((node) =>
      node.type === 'rule' || node.type === 'atrule',
    )
    // An own block only earns its bytes when it distinguishes declarations
    // from nested rules in this same selector.
    if (firstStructure < 0) return
    const boundary = firstStructure < 0 ? rule.nodes.length : firstStructure
    if (declarationIndexes.some((index) => index >= boundary)) {
      skipped.push({ selector: rule.selector, reason: 'declaration follows a nested rule or at-rule' })
      return
    }

    const prefix = rule.nodes.slice(0, boundary)
    const first = prefix[0]
    const last = prefix.at(-1)
    const nodeStart = first.source.start.offset
    const lineStart = normalized.lastIndexOf('\n', nodeStart - 1) + 1
    const before = normalized.slice(lineStart, nodeStart)
    const start = /^\s*$/.test(before) ? lineStart : nodeStart
    const end = last.source.end.offset
    const indent = start === lineStart ? before : ''
    const content = normalized.slice(start, end)
    const multiline = start === lineStart
    const replacement = multiline
      ? `${indent}& {\n${content.split('\n').map((line) => line ? `  ${line}` : line).join('\n')}\n${indent}}`
      : `& { ${content} }`
    edits.push({ start, end, replacement })
  })

  const output = applyEdits(normalized, edits)
  return { css: output, skipped }
}

const main = async () => {
  const args = process.argv.slice(2)
  const write = args[0] === '--write'
  const files = write ? args.slice(1) : args
  if (!files.length) throw new Error('usage: css-own-blocks.mjs [--write] <file...>')

  let changed = 0
  let unsafe = 0
  for (const file of files) {
    const input = await readFile(file, 'utf8')
    const result = transformOwnDeclarations(input, { from: file })
    changed += Number(result.css !== input)
    unsafe += result.skipped.length
    result.skipped.forEach(({ selector, reason }) =>
      console.error(`${file}: skipped ${selector}: ${reason}`),
    )
    if (write && result.css !== input) await writeFile(file, result.css)
  }

  console.log(`${files.length} files; ${changed} would change; ${unsafe} unsafe rules skipped`)
  if (!write && changed) process.exitCode = 1
  if (unsafe) process.exitCode = 2
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) await main()
