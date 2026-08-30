# Native nesting own blocks

The homepage uses a leading `& { ... }` block only when it has work to do:
separating a selector's own declarations from nested states and descendants.
A declaration-only rule stays direct; wrapping it would add bytes without
clarifying ownership. The migration tool at
`scripts/css-own-blocks.mjs` uses PostCSS only for structural analysis and
source offsets; text edits preserve the original declaration, selector,
at-rule, comment, whitespace and semicolon order.

Three cases deliberately remain unwrapped:

- declaration-only rules, which have no nested ownership to disambiguate;

- keyframe steps, where `&` has no selector subject;
- rules whose selector contains a pseudo-element (`::before`, `::after`,
  `::-webkit-scrollbar`, and similar).

A nesting selector does not reliably represent a pseudo-element subject. In
Chromium, wrapping pseudo-element declarations in an inner `& {}` caused the
rule to stop painting while the surrounding stylesheet continued parsing.
This removed station backgrounds and shape-outside geometry without a CSS
error. The codemod therefore repairs such wrappers back to direct declarations
and its fixtures lock down that exception.

The tool also refuses a rule when an own declaration follows a nested rule or
at-rule. Moving that declaration to the leading block would alter source order;
the caller must review that rule manually before retrying.
