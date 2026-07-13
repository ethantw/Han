# Homepage owner-feedback round — rail v2 + demo-lang + content polish

Working repo: `/Users/yijun/Workspace/hanzi.pro/han` (branch `v4/main`). Do not
touch `manual/public/old.html` / `manual/public/old-assets/`.

## Scope (7 changes, owner-verbatim — see task prompt for full text)

1. Demo-lang chip row (繁/簡/日/韓) top-right of content column →
   `manual/public/home/demo-lang.js` (new), booted from `manual/public/home.js`.
2. Content carries lang-tagged passages (station-semantics ja blockquote,
   station-type zh-Hans/ja/ko spans, station-lines ja ruby).
3. Font panel split into 3 groups: 字體 / 標點規範 / 繁體專項 (closed).
4. 模組 group: nest sub-controls under their parent toggle
   (`.SubField`, `[data-cfg-prose-sub]`).
5. Delete tracking (字距) slider entirely.
6. Add 字重 slider (250–900) + 直排/橫排 switch (preview-state, not codegen).
7. New `baseGeneric` control (sans-serif/serif) — IS part of codegen.

## Files touched

- `manual/home/rail.html` — groups 3/4/5/6/7 markup
- `manual/home/_data.js` — i18n keys ×5 (new + delete tracking keys)
- `manual/home/manifesto.html` or `_home.html` — demo-lang chip markup
- `manual/home/station-{semantics,type,lines}.html` — content polish
- `manual/public/home/demo-lang.js` — new module
- `manual/public/home.js` — boot wiring
- `manual/public/home/configurator.js` — baseGeneric apply, prose-sub hide
- `manual/public/home/rail-metrics.js` — remove tracking; add weight+writing
- `manual/public/home/codegen.js` — baseGeneric in DEFAULTS + renderers
- `manual/public/home/controls.css` / `rail.css` / `stations.css` — SubField,
  demo-lang chip style, vertical-writing CSS
- `manual/tests/codegen.test.js` — +2 tests (baseGeneric)
- `tests/e2e/home.spec.ts`, `tests/e2e/playground-configurator.spec.ts` — fix
  heritage-group-open assumption, reset test, +demo-lang test, +weight/vertical smoke

## Verify

- `cd manual && pnpm test` → 20/20
- `pnpm --filter han-manual build` green, zero `{{ }}` × 5 locales
- `npx playwright test tests/e2e/home.spec.ts tests/e2e/playground-configurator.spec.ts`
- headless smoke: demo-lang ja chip → lang attr; vertical-mode screenshot

## Status
See final report in conversation — this file is a working plan, not updated live.
