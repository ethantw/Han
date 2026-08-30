import assert from 'node:assert/strict'
import test from 'node:test'

import { transformOwnDeclarations } from '../../scripts/css-own-blocks.mjs'

const run = (css) => transformOwnDeclarations(css).css

test('wraps only a selector own leading declarations', () => {
  const input = `.Card {
  /* surface */
  color: red;
  padding: 1rem;

  &:hover { color: blue; }
  > p { margin: 0; }
}
`
  const output = run(input)
  assert.match(output, /\.Card \{\s*& \{\s*\/\* surface \*\/\s*color: red;\s*padding: 1rem;\s*\}/)
  assert.match(output, /&:hover \{ color: blue; \}/)
  assert.ok(output.indexOf('&:hover') < output.indexOf('> p'))
})

test('preserves at-rule and comment order after the own block', () => {
  const input = `.Card {
  display: grid;
  /* responsive */
  @media (width > 40rem) { grid-template-columns: 1fr 1fr; }
  /* state */
  &:focus { outline: 1px solid; }
}
`
  const output = run(input)
  assert.ok(output.indexOf('display: grid') < output.indexOf('/* responsive */'))
  assert.ok(output.indexOf('/* responsive */') < output.indexOf('@media'))
  assert.ok(output.indexOf('@media') < output.indexOf('/* state */'))
  assert.ok(output.indexOf('/* state */') < output.indexOf('&:focus'))
})

test('skips rules whose declarations would need reordering', () => {
  const input = `.Card {
  &:hover { color: blue; }
  color: red;
}
`
  const result = transformOwnDeclarations(input)
  assert.doesNotMatch(result.css, /\.Card \{\s*& \{/)
  assert.match(result.css, /&:hover \{ color: blue; \}/)
  assert.deepEqual(result.skipped, [
    { selector: '.Card', reason: 'declaration follows a nested rule or at-rule' },
  ])
})

test('does not rewrite keyframe steps', () => {
  const input = '@keyframes enter { from { opacity: 0; } to { opacity: 1; } }\n'
  assert.equal(run(input), input)
})

test('leaves pseudo-element declarations direct because nesting ampersand cannot represent them', () => {
  const input = `.Card {
  &::before {
    content: '';
    display: block;
  }
}
`
  assert.equal(run(input), input)
})

test('repairs pseudo-element own blocks from an interrupted migration', () => {
  const input = `.Card {
  &::before {
    & {
      content: '';
      display: block;
    }
  }
}
`
  assert.equal(run(input), `.Card {
  &::before {
    content: '';
    display: block;
  }
}
`)
})

test('leaves a declaration-only rule direct', () => {
  const input = `.PunctLang {
  grid-column: 1;
  grid-row: 2;
}
`
  assert.equal(run(input), input)
})

test('unwraps a redundant declaration-only own block', () => {
  const input = `.PunctLang {
  & {
    grid-column: 1;
    grid-row: 2;
  }
}
`
  assert.equal(run(input), `.PunctLang {
  grid-column: 1;
  grid-row: 2;
}
`)
})

test('is idempotent', () => {
  const once = run('.Card { color: red; &:hover { color: blue; } }\n')
  assert.equal(run(once), once)
})
