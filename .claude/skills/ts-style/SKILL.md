---
name: ts-style
description: TypeScript/JavaScript coding style. Use whenever writing, reviewing, or refactoring any .ts/.js file in this project. Covers curried call formatting, point-free style, ternary dispatch, and FP-first collection building.
---

# TypeScript / JavaScript Style

## 1. Curried calls — inline vs. multi-line

Inline when it fits; break to one-argument-per-line when the line grows long. Continuation arguments indent **+2 from the function name**:

```ts
// short — inline
transform(options)(pattern)(portion => _match => `…`)

// long — stack vertically
transform
  (options)
  (longPatternName)
  (portion => match => { … })
```

## 2. Point-free style

Omit the final data argument from the function definition; let the caller apply it:

```ts
// ✅
export const process = (mode: Mode) =>
  mode === 'a' ? transform(options)(pattern)(cb) : identity

// ❌
export const process = (mode: Mode) => (src: string) =>
  …(src)
```

## 3. No `let`, no mutation

All bindings are `const`. Never mutate arrays with `push` or similar — build collections as pure expressions with spread conditionals:

```ts
// ✅
const classes = [
  'base',
  ...deriveClasses(ch),
  ...(condA ? ['extra-a'] : []),
  ...(condB ? ['extra-b'] : []),
]

// ❌
const classes = ['base', ...deriveClasses(ch)]
if (condA) classes.push('extra-a')
if (condB) classes.push('extra-b')
```

## 4. Ternary chains for dispatch

Multi-branch dispatch uses a flat ternary chain, not `if/else`. Condition, `?`, and each `:` sit at the same indentation level:

```ts
const result =
  mode === 'a'
  ? handlerA

  : mode === 'b'
  ? handlerB

  : fallback
```

## 5. Nested arrow callbacks

Curried callbacks use chained arrows with no extra parens or explicit `return`. Name unused parameters `_param`:

```ts
portion => _match =>
  `<tag>${portion.text}</tag>`
```

## 6. Unicode-safe character iteration

Use spread + `map` to iterate string characters; never `.split('')`:

```ts
// ✅
[...str].map((ch, i) => …)

// ❌ — breaks surrogate pairs
str.split('').map(…)
```
