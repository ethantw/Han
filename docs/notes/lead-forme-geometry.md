# Lead forme geometry

The homepage lead forme is a fitted isometric SVG, not a rectangular image.
Its CSS layout depends on geometry published by the SVG builder, while the
builder remains independent of the live DOM.

## Type body and glyph seating

- The type body's square footprint and the glyph em are both 90 SVG units.
  Adjacent pieces touch; spacing belongs to explicit furniture, not an extra
  cell pitch.
- Horizontal glyphs use a baseline 0.38 em below the face centre. Browser font
  metrics do not make `dominant-baseline: central` equivalent to the em-box
  centre.
- Chromium supplies usable vertical forms for the tested punctuation. WebKit
  may seat vertical glyphs against its hhea box or omit the SVG `vert` form.
  Runtime probes therefore publish a vertical shift and whether class-R marks
  must be rotated from their horizontal outlines.
- A rotated squeezed opening bracket uses a half-body correction: its useful
  ink occupies the trailing half of the original em.

For the general SVG baseline investigation, see
[SVG glyph baseline alignment](./2026-07-21-svg-glyph-baseline-alignment.md).

## Fitted box and CSS pockets

The generated view box hugs the drawn forme. External breathing room belongs
to the figure's CSS padding so layout can measure it. The builder publishes:

- the apex and block-start air for the control wedge;
- the inline-end foot and total fitted height for the caption pocket;
- the inline-start heel used by the following dash composition;
- the last slug delay used to hand entrance timing to CSS.

These values are ratios of the fitted SVG width. CSS can therefore derive the
pockets at every responsive size without copying SVG coordinates.

## Paint order and reset animation

Pieces are generated column-major. Each column is followed by its line-leading
furniture, which gives the spanning furniture a valid painter's order; a
generic diagonal sort does not.

A punctuation swap compares builds by logical piece identity. It lifts a whole
line when spacing changes and otherwise lifts only the changed punctuation.
The live checked control is read after an asynchronous swap so a second input
cannot be overwritten by stale state.

## Responsive ownership

At wide sizes the forme is centred in the available `main` width, including
the console-reduced width. Below the minimum 768 px drawing width, the rail
owns horizontal overflow and keeps edge padding. Decorative text sits below
the forme in paint order; the SVG itself naturally masks the first character.
Vertical preview removes the horizontal pocket geometry and returns the
caption to normal flow.
