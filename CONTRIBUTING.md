# Contributing to Han.css

Thanks for the interest. This guide covers the basics; the [manual](https://hanzi.pro)
has the deeper architectural notes.

## Prerequisites

- **Node.js ≥ 22** — the codebase uses native TypeScript loading
  (`node --test 'src/ts/**/*.test.ts'`), `--experimental-test-coverage`,
  and other recent runtime features.
- **pnpm ≥ 9** — the workspace is managed with pnpm.

```bash
node --version   # ≥ 22
pnpm --version   # ≥ 9
```

## Setup

```bash
git clone https://github.com/ethantw/Han.git
cd Han
pnpm install
```

The repo is a pnpm workspace. The root package is the framework itself
(`han-css`); `manual/` is a separate workspace package (`han-manual`)
that builds the documentation site.

## Day-to-day

```bash
pnpm dev           # esbuild watch on the framework
pnpm start         # framework watch + manual vite dev server in parallel
pnpm test          # unit tests via node --test
pnpm test:e2e      # playwright e2e (auto-builds + serves first)
pnpm typecheck     # tsc --noEmit
pnpm build         # one-shot prod build to dist/
```

The dev loop is **rebuild-on-save without auto-reload**. esbuild rewrites
`dist/han.*`; the manual's vite plugin watches `dist/` and copies into
`manual/public/han/`. Refresh the browser yourself when you want to
see changes — there's no WebSocket pushing reloads.

## Code conventions

- Keep TypeScript strict. Prefer narrow types to `any`.
- CSS follows the project's [naming convention](.claude/skills/css-naming/SKILL.md):
  PascalCase blocks, native nesting, `data-*` for variants. No BEM.
- No CJK ↔ Latin spaces in markdown source — the framework's
  `text-autospace` handles the gap; manual spaces double up.
- Tests next to the source: unit specs under `src/ts/__tests__/`,
  e2e specs under `tests/e2e/`.

## Tests

- Unit: `node --test 'src/ts/**/*.test.ts'`. Use `happy-dom` for DOM
  fixtures (`import { Window } from 'happy-dom'`); see
  `src/ts/__tests__/punctuation.test.ts` for the pattern.
- E2E: `playwright test`. Specs live in `tests/e2e/`; the dev server
  is auto-managed by Playwright config.
- Visual baselines: chromium-darwin only by default. Local additions
  for webkit / firefox are optional.

## Submitting changes

1. Branch off `main`.
2. Keep commits focused — one logical change per commit. Conventional
   prefixes (`feat:`, `fix:`, `test:`, `docs:`, `chore:`, `refactor:`,
   `manual:`, `demo:`) are encouraged.
3. Update `CHANGELOG.md` under `[Unreleased]` if the change is
   user-visible.
4. `pnpm test && pnpm typecheck && pnpm test:e2e` should be green
   before opening a PR.
5. Open a PR against `main`. CI runs the same matrix.

## Reporting issues

[github.com/ethantw/Han/issues](https://github.com/ethantw/Han/issues)
— please include:

- Browser + OS
- A minimal reproduction (CodePen, repo, or paste)
- What you expected vs. what you got

## License

By contributing, you agree your contributions will be released under
the MIT License (see [`LICENSE`](./LICENSE)).
