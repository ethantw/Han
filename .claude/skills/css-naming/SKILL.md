---
name: css-naming
description: Authoritative CSS naming and structuring conventions for projects following the semantic-CSS style. Use whenever writing, reviewing, refactoring, or generating any CSS, SCSS, or styled HTML/JSX/TSX — including new components, restyling existing ones, fixing bugs that touch styles, producing class names in markup, or naming inline SVGs. Apply even when the user does not explicitly ask about naming, because class names, selector structure, font sizes, and CJK/Latin spacing in copy must all conform to these rules. Triggers include: any request mentioning CSS, classes, selectors, BEM, styling a component, "make this look like…", Tailwind-to-CSS conversion, or editing files matching *.css / *.scss / *.tsx / *.jsx.
---

# CSS Naming Conventions

CSS in this style is named for **semantics first**. Words that describe *position* or *structure* are forbidden. Markup and styles work as a pair: the HTML expresses what something *is*, and the CSS targets it through that meaning rather than through invented hook classes.

---

## Core Principle

**A class name must answer "what is this?", not "where is it?" or "what does it look like?".**

A corollary: the smallest valid class set is often *just the component root*. Everything inside should be reachable through element selectors, attribute selectors, or pseudo-classes — adding a class is what you do when none of those carry the meaning you need.

---

## Rules

### 1. Use native CSS nesting; never write expanded descendant selectors

Use the native CSS tree syntax (`Parent { Child {} }`). Do not write expanded descendant selectors (`.Parent .Child {}`).

`&` is **only for self-reference**: pseudo-classes, pseudo-elements, and relational selectors. Child elements and child classes are written directly, without an `&` prefix.

**`@media` and `@container` queries must also be nested inside the element they affect**, never at the top level. This keeps related styles tight together:

```css
/* ✗ Bad — @media scattered at the top level; you have to scroll up and down to cross-reference */
.Hero .Media { aspect-ratio: 16 / 9; }

@media (max-width: 960px) {
  .Hero { height: 100dvh; }
  .Hero .Media { height: 100%; }
}

/* ✓ Good — @media sits right inside the element it affects */
.Hero {
  .Media {
    aspect-ratio: 16 / 9;

    @media (max-width: 960px) {
      aspect-ratio: auto;
      height: 100%;
    }
  }

  @media (max-width: 960px) {
    height: 100dvh;
  }
}
```

The only exception: `@keyframes` is a top-level at-rule and the CSS spec does not allow it nested inside a regular rule, so it stays at the top level.

```css
/* ✗ Bad — expanded selectors lose the structural relationship */
.Hero .Headline { ... }
.Hero .Headline h1 { ... }
.Hero .Headline p { ... }

/* ✓ Good — native nesting expresses the hierarchy clearly */
.Hero {
  .Headline {
    h1 { ... }
    p { ... }
  }

  .Action {
    p { ... }
  }

  /* & is only for self-reference */
  &:has(> .Media:only-child) { ... }
}
```

**When `&` is appropriate:**

```css
.NotFound {
  /* ✓ pseudo-class */
  &:hover { ... }

  /* ✓ upward relationship: how I look when I sit inside a particular parent */
  main:has(&) { margin: 0; }
  .Survey:has(&) { margin-block: 3rem 2rem; }

  /* ✓ complex self-relation */
  &:has(> svg[data-name="loading"]:only-child) { ... }

  /* ✓ element selectors written directly, no & */
  h1 { ... }
  h1 + p { ... }
}
```

The upward relationship form (`Parent:has(&)`) is how a component declares "when I'm placed inside X, X should treat me differently" — without the parent having to know about me. The rule lives with the child, where it belongs.

---

### 2. Put the component root's own styles inside `& { }`

When a component has both styles for itself *and* styles for descendants, wrap the self-styles in an explicit `& { }` block. This visually separates "this is me" from "this is what's inside me," and the two read as siblings rather than the root rules sitting orphaned at the top of a long nested block.

```css
/* ✗ Bad — root styles dangle above the descendants; visually unclear what belongs to what */
.Survey {
  display: flex;
  align-items: center;
  flex-direction: column;

  &:has(> svg[data-name="loading"]:only-child) {
    justify-content: center;
  }

  svg[data-name="loading"] { ... }
}

/* ✓ Good — root styles are a clearly delimited block, parallel to its siblings */
.Survey {
  & {
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  &:has(> svg[data-name="loading"]:only-child) {
    justify-content: center;
  }

  svg[data-name="loading"] { ... }
}
```

If the component root has *no* descendant rules — just its own properties — the `& { }` wrapper is unnecessary. The convention is for the mixed case.

---

### 3. Use HTML element selectors instead of inventing classes

For structural children (headings, paragraphs, lists, images), use element selectors directly. Do not invent a class.

```css
/* ✗ Bad */
.CorePillars-title { ... }
.CorePillars-description { ... }

/* ✓ Good */
.CorePillars {
  .Intro {
    h2 { ... }
    p { ... }
    h2 span { ... }   /* an accent span — no class needed */
  }
}
```

The element selector carries the meaning the class would have invented. `h2` already says "heading at this level"; `.CorePillars-title` adds nothing.

---

### 4. `ComponentName-child` BEM naming is forbidden

Sub-components do **not** get the parent component as a prefix. Each uses its own PascalCase class, and CSS nesting provides the scope.

```css
/* ✗ Bad — BEM-style expanded names */
.Hero-overlay { ... }
.Hero-headline { ... }
.SiteHeader-logo { ... }

/* ✓ Good — independent PascalCase + nested scope */
.Hero {
  .Overlay { ... }
  .Headline { ... }
}

.SiteHeader {
  .Logo { ... }
}
```

---

### 5. PascalCase for sub-components with semantic identity

When a sub-region is an independent **conceptual unit** (it has its own name, and would still make sense moved elsewhere), give it a PascalCase class.

```css
/* ✓ Good — Logo, Cart, Price, Badge, Vendor are meaningful concepts */
.SiteHeader {
  .Logo { ... }
  .Cart { ... }
}

.CollectionCard {
  .Price { ... }
  .Badge { ... }
  .Vendor { ... }
}
```

The test: would this name appear in a designer's spec or a product manager's bug report? If yes, it's a real concept and earns a PascalCase class. If it's just "the thing on the left," it doesn't.

---

### 6. Use type-qualified selectors to strengthen semantics

The HTML element type is itself part of the meaning. Use `element.ClassName` to make intent clearer, and to prevent the same class name on a different element from accidentally matching.

```css
/* ✓ Good */
section.Score { ... }
button.Restart { ... }
a.Button { ... }
```

---

### 7. Inline SVGs are identified with `data-name`, not classes

When you have inline SVG icons or graphics, label them with a `data-name` attribute and target them through `svg[data-name="..."]` rather than giving every SVG its own class.

```css
/* ✓ Good */
.Survey {
  svg[data-name="loading"] {
    animation: spin 1s linear infinite;
    color: #6d6e6b;
  }

  &:has(> svg[data-name="loading"]:only-child) {
    justify-content: center;
  }
}
```

```jsx
{/* ✓ Good — the SVG knows its own name */}
<svg data-name="loading">...</svg>
<svg data-name="cart">...</svg>
```

This pairs naturally with a shared SVG component that takes a `name` prop and renders the matching `data-name`. Use `data-name` even without such a component — the attribute alone is enough to keep CSS clean.

Reasoning: an SVG's identity is conceptually closer to a *type tag* than to a styling hook. `data-name="loading"` says what this SVG **is**; `class="loading-icon"` says what it **looks like or does** — and those two ideas drift apart over time.

---

### 8. Prefer CSS pseudo-classes; for JS-toggled state, use the `is-` prefix

Anything that can be expressed with native CSS pseudo-classes should be — no JS event handler needed.

```css
/* ✓ If :hover, :focus, :empty, :checked work, use them */
.NavDropdown {
  &:hover .Panel { ... }
  &:focus-within .Panel { ... }
}

button {
  &:disabled { opacity: .5; }
}
```

Only when CSS genuinely cannot express the state (i.e. it must be controlled from JS) should a class be toggled, and that class is prefixed `is-`.

**An `is-` state class must be scoped inside the component it belongs to. Never as a global class** — that leaks styles across pages:

```css
/* ✗ Bad — global; any .is-fading-out anywhere on the site is affected */
.is-fading-out { opacity: 0; }

/* ✓ Good — scoped inside the component */
.SiteHeader {
  &.is-scrolled { box-shadow: ...; }
}

.NavDropdown {
  .Categories button {
    &.is-active { background: #fff; }
  }

  .Panel {
    &.is-fading     { transition: opacity 0.15s ease; }
    &.is-fading-out { opacity: 0; }
    &.is-fading-in  { opacity: 1; }
  }
}
```

**Double-dash `--` modifier naming is forbidden**, including the `.Component--modifier` BEM modifier syntax:

```css
/* ✗ Bad */
.NavDropdown-fade--out { opacity: 0; }
.Button--primary { ... }
.Card--featured { ... }

/* ✓ Good */
.is-fading-out { opacity: 0; }
.Button[data-variant="primary"] { ... }
.Card[data-featured] { ... }
```

---

### 9. Use data attributes for state and variants

Modifiers go on `data-*` attributes. Classes represent component identity only — they do not represent state.

```css
/* ✗ Bad */
.QualityBadge--orange { ... }
.Blob-teal { ... }

/* ✓ Good */
.QualityBadge {
  .Icon[data-color="orange"] { ... }
}

.HomepageCta {
  .Blob[data-color="teal"] { ... }
  .Blob[data-color="dark"] { ... }
}
```

A practical signal: if a value comes from data (a product's color, a status from the API, a theme prop), it belongs on a `data-*` attribute. Markup binds variants directly: `<div className="Blob" data-color={product.color}>`. CSS then matches on `[data-color="..."]` without a class explosion.

---

### 10. No reassurance-driven wrapper divs

Use the HTML structure itself plus CSS flexbox/grid for layout. Do not add a meaningless extra `<div>` just because it "feels safer."

```html
<!-- ✗ Bad: -body is just a max-width container -->
<section class="CorePillars">
  <div class="CorePillars-body">
    <div class="Intro">...</div>
    <div class="Pillars">...</div>
  </div>
</section>

<!-- ✓ Good: padding-inline lives on the section; each child sets its own max-width -->
<section class="CorePillars">
  <div class="Intro">...</div>
  <div class="Pillars">...</div>
</section>
```

When you need a full-width background but a constrained content width:
- put `padding-inline` on the section itself
- each child handles its own `max-width: var(--content-max); margin-inline: auto`

The only case where a wrapper is allowed: the wrapper itself represents a meaningful concept (e.g. a two-column `.Card`, or a three-cell `.Pillars`), and it must use a semantic PascalCase name.

---

### 11. Forbidden structural suffixes

The following suffixes describe position or structure rather than meaning, and are **forbidden**:

| Forbidden | Why |
|-----------|-----|
| `-inner` | Describes location (inside) — no semantics |
| `-body` | Describes structure (body) — no semantics |
| `-content` | Describes structure (content) — no semantics |
| `-wrapper` / `-wrap` | Pure structural words |
| `-container` | Pure structural word |
| `-layout` | Describes a layout role, not what it is |
| `-top` / `-bottom` | Describe position |
| `-left` / `-right` | Describe position |
| `-grid` | Describes implementation (uses grid), not semantics |

**Exception:** if the word has actual meaning in the domain (e.g. `.CartPage .Summary` — "Summary" here is a checkout summary, not a structural noun), it is fine.

---

### 12. kebab-case for descriptive, non-component class names

When a class describes a state or characteristic and is *not* a component identity, use **kebab-case**.

```css
/* ✓ Good */
.no-questions { ... }          /* an empty-state message */
.scrolled-to-page-end { ... }  /* describes a state */
```

The case form is the signal of intent:

| Case | Use for | Example |
|------|---------|---------|
| `PascalCase` | Component identity (a thing, a noun phrase) | `.Survey`, `.NotFound`, `.QualityBadge` |
| `kebab-case` | Descriptive, ad-hoc, or stateful classes | `.no-questions`, `.scrolled-to-page-end` |
| `is-kebab-case` | JS-toggled state, scoped inside a component | `.is-scrolled`, `.is-fading-out` |

You can read a class name and know its role from the case alone — that's the point.

---

## Markup Conventions (HTML / JSX / TSX)

These are the markup-side counterparts. They keep the CSS rules above coherent end-to-end.

### M1. The component root `className` matches the component name in PascalCase

A component called `Survey` renders a root with `className="Survey"`. A component called `NotFound` renders `<div className="NotFound">`. The CSS file targets `.Survey` and `.NotFound`. There is one PascalCase class per component, and it lives on the outermost element.

```jsx
function Survey() {
  return (
    <div className="Survey">
      ...
    </div>
  )
}
```

### M2. The component's stylesheet is a sibling `index.css`

A component lives in a folder. The folder is the component name. Inside:
- `index.tsx` (or `index.jsx`) — the component
- `index.css` — its styles
- the `.tsx` imports the `.css` directly (`import './index.css'`)

The folder name matches the component's PascalCase name. Stylesheets are not centralized in a global `styles/` directory — they sit next to the component they describe.

### M3. Variants and state ride on `data-*` attributes in the markup

When a component has variants (color, size, theme, status), pass them through to `data-*` attributes on the rendered element, never as class name suffixes.

```jsx
/* ✗ Bad */
<div className={`Badge Badge--${color}`}>

/* ✓ Good */
<div className="Badge" data-color={color}>
```

This keeps the `className` stable — it always identifies the component — and lets variants be added or removed without rewriting the CSS class string.

### M4. Inline SVGs carry `data-name`

Whether through a shared `<SVG name="..." />` component or written inline by hand, every inline SVG element should expose its identity through a `data-name` attribute. CSS never targets SVGs by class.

```jsx
<svg data-name="loading">...</svg>
{/* or, via a shared component that maps the prop to the attribute: */}
<SVG name="loading" />
```

### M5. Event-handler props use the `onXxx` form

Action handlers passed as props or defined on a component use the `onXxx` naming pattern, mirroring native DOM events: `onStart`, `onNext`, `onBack`, `onFinish`, `onAnswer`. Reserve `handleXxx` for internal handlers if you need a distinction; expose the `on` form at the prop boundary.

---

## Complete Example

```css
/* ✓ Correct overall structure */
.Survey {
  & {
    display: flex;
    align-items: center;
    flex-direction: column;
  }

  &:has(> svg[data-name="loading"]:only-child) {
    justify-content: center;
    block-size: 90vh;
  }

  svg[data-name="loading"] {
    animation: spin 1s linear infinite;
    block-size: 3rem;
    color: #6d6e6b;
  }

  .no-questions {
    color: #6d6e6b;
  }
}

.NotFound {
  main:has(&) {
    margin: 0;
  }

  .Survey:has(&) {
    margin-block: 3rem 2rem;
    align-items: flex-start;
  }

  h1 {
    margin-block: 2rem 0.25rem;
    font-weight: 200;
    font-size: 4rem;
  }

  h1 + p {
    margin-block: 0;
    font-size: 1.5rem;
    font-weight: 200;
    color: #575f60;
  }
}
```

Notice what's *not* there: no `.Survey-loader`, no `.NotFound-title`, no `Survey--loading` modifier, no global `.is-fading-out`, no descendant selector spelled out as `.NotFound h1`. Every rule earns its place.

---

### 13. `font-size` must be a multiple of `0.125rem`

Every `font-size` value (including any `rem` value inside `clamp()`) must be an **integer multiple of `0.125rem`**:

```
0.625rem / 0.75rem / 0.875rem / 1rem / 1.125rem / 1.25rem / 1.375rem /
1.5rem / 1.625rem / 1.75rem / 1.875rem / 2rem / 2.125rem / 2.25rem …
```

Round any non-conforming value to the nearest legal one:

| Common bad value | Use instead |
|------------------|-------------|
| 0.7rem / 0.72rem / 0.78rem | 0.75rem |
| 0.8rem / 0.82rem | 0.75rem |
| 0.85rem / 0.88rem | 0.875rem |
| 0.9rem | 0.875rem |
| 0.95rem / 1.05rem | 1rem |
| 1.1rem / 1.15rem | 1.125rem |
| 1.2rem | 1.25rem |
| 1.6rem | 1.625rem |
| 1.8rem | 1.75rem |
| 2.4rem | 2.375rem |
| 2.6rem | 2.625rem |
| 3.2rem | 3.25rem |
| 3.4rem | 3.375rem |

Viewport units inside `clamp()` (`vw`, `cqi`) are *not* subject to this rule.

---

### 14. No spaces between CJK characters and Latin letters / digits in copy

The visual gap between Chinese and Latin text is handled by CSS (`text-autospace` or an equivalent). **Never insert spaces manually in the copy.**

```
/* ✗ Bad */
通過 ISO 22000 食品安全
由 Shopify 提供
您的 IP 位址

/* ✓ Good */
通過ISO 22000食品安全        ← the space inside "ISO 22000" is preserved (proper noun)
由Shopify提供
您的IP位址
```

Rule: at a **CJK ↔ Latin/digit** boundary, no space. Spaces *inside* a Latin proper noun (e.g. `ISO 22000`, `UC-II`) are kept.

---

## Quick Checklist

After writing CSS or markup, ask yourself:

1. Are there any expanded descendant selectors (`.Parent .Child {}`)? → Convert to nesting.
1a. Are `@media` / `@container` queries at the top level? → Move them inside the element they affect (`@keyframes` is the only exception).
2. If the component has both root styles and descendant rules, are the root styles wrapped in `& { }`? → If not, add the wrapper.
3. Is `&` being used somewhere other than self-reference (e.g. `& h2`)? → Drop the `&`, write `h2` directly.
4. Are there any `ComponentName-child` style class names? → Forbidden. Rename to PascalCase.
5. Do any names contain `-inner / -body / -content / -wrapper / -grid / -layout / -top / -bottom`? → Rename.
6. Could this child be expressed by an HTML element selector? → If so, drop the class.
7. Is an inline SVG being targeted by class instead of `[data-name="..."]`? → Convert to `data-name`.
8. Could this modifier be a `data-*` attribute? → If so, convert it.
9. Any double-dash separators (`.Foo--bar`)? → Forbidden. Use `[data-x]` or `.is-x`.
10. Is there a JS-toggled class for something `:hover` / `:focus` / `:checked` could already do? → Use the pseudo-class.
11. Do JS-toggled classes use the `is-` prefix? → If not, add it. And confirm they are scoped, not global.
12. Are descriptive non-component classes in kebab-case (not PascalCase)? → If not, convert.
13. Is every `font-size` a multiple of `0.125rem`? → If not, look up the table and fix it.
14. Any stray spaces between CJK and Latin/digits in copy? → Remove them (spaces inside Latin proper nouns stay).
