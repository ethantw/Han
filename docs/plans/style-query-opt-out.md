# Style Query Opt-out Migration

> **✅ COMPLETED (2026-06).** All steps below are done. Final names differ from
> this plan (which predates the later renames): `sectional-refinements.css`→`prose.css`,
> `--han-sectional-refinements`→`--han-prose`; `line-adjustments.css`→`lines.css` with
> native + with-js sheets merged into one `han-lines` layer (no separate
> `han-with-js-line-adjustments`); the `han-generics-*` intermediate containers were
> removed by the `fonts.css` Diantenjeom rewrite (Step 3); the `han-hanging-punctuation`
> JS container became the `--han-hanging-punctuation-state` style query (Step 4); the
> throwaway `style-query-demo.html` was deleted (Step 6). Zero named-container opt-out
> patterns remain in `src/`. Kept for history.

Replace all `container-name: han-revert-*` / named `@container` opt-out patterns
with CSS custom property style queries. Firefox now supports style queries (confirmed
2026-06). Features remain on-by-default; opt-out API changes from adding a
container-name to setting a CSS variable.

**Before:**
```css
/* han.css */
@container han-revert-semantics { … revert-layer … }

/* user */
article { container-name: han-revert-semantics; }
```

**After:**
```css
/* han.css */
:root { --han-semantics: on; }
@container style(--han-semantics: on) { … }

/* user */
article { --han-semantics: off; }
```

---

## Step 1 — `semantics.css`: han-revert-semantics → --han-semantics

The main file. Has 9 occurrences of `@container han-revert-semantics { }` and
a large header comment block explaining the current mechanism (lines 4–90).

- Add `--han-semantics: on` to the `:root` / `html` rule already in the file
- Replace all `@container han-revert-semantics { … }` with the styles moved
  directly into their parent `@layer` blocks under
  `@container style(--han-semantics: on)`
- Rewrite the header comment: remove `container-name` instructions and the
  `⚠️ container-name` warnings; replace with the new CSS variable API
- Remove the stale note "Firefox doesn't support style queries yet" (line 24–25)
- Remove the note about `container-name` not inheriting (line 43) — no longer
  relevant

## Step 2 — `sectional-refinements.css`: two containers

Two named containers here with different roles:

**`han-sectional-refinements`** (opt-in, line 34 / 46) — currently users must
add `container-name: han-sectional-refinements` to apply the feature to
non-`<article>` elements.

- Change to `--han-sectional-refinements: on` on `article` (already set by
  han.css) and the same for any user-facing opt-in docs
- Replace `@container han-sectional-refinements { }` with
  `@container style(--han-sectional-refinements: on) { }`

**`han-revert-sectional-refinements`** (opt-out, line 105) — set by user to
cancel the feature inside an already-enabled subtree.

- User now sets `--han-sectional-refinements: off` (or any non-`on` value)
- Replace `@container han-revert-sectional-refinements { }` with a
  `:not(@container style(--han-sectional-refinements: on))` pattern **or**
  simply remove the revert block and let the variable change cascade naturally
  (if the inner query no longer matches, the styles don't apply — the revert
  block itself may become unnecessary)

## Step 3 — `fonts.css`: flatten han-generics named container intermediates

Currently a two-step chain: style query sets container-name, then a named
`@container` fires.

```css
/* current */
@container style(--han-generics: serif) {
  :root { container-name: han-generics-serif; }
}
@container han-generics-serif { … }
```

Flatten to a single style query:
```css
@container style(--han-generics: serif) { … }
```

Affects `han-generics-sans-serif` (line 172 / 183) and
`han-generics-serif` (line 179 / 206).

## Step 4 — `with-js/line-adjustments.css`: han-hanging-punctuation

JS currently sets `container-name: han-hanging-punctuation` or
`han-hanging-punctuation-none`. Change JS to set a custom property instead,
then convert `@container han-hanging-punctuation { }` (line 246) and
`@container han-hanging-punctuation-none { }` (line 296) to style queries.

Requires coordinated change in the JS side. Do this step last.

## Step 5 — Update `fonts.css` comment (line 41)

Remove "Firefox does not yet support them" note.

## Step 6 — Update `style-query-demo.html`

Delete the demo file (or move to a scratch/docs dir) — it was a throwaway test.
