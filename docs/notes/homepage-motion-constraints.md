# Homepage motion constraints

## Dash fuse

The vertical dash column is HTML text; only the two dash cells are SVG. This
avoids WebKit's incorrect vertical glyph metrics in SVG while allowing the
split strokes to meet at subpixel precision. See
[WebKit SVG vertical text](./2026-08-02-webkit-svg-vertical-text.md).

The fuse is scroll-driven. `--df-arrive` closes the gap, `--df-hold` lets a
pointer interaction reopen it, and `--df-weld` forces it closed while pressed.
Colour intensity derives from the resulting gap rather than directly from
scroll position, keeping all input modes visually consistent. The animation is
scoped to each dash cell because descendants elsewhere in the long column do
not consume these properties.

The column's physical inset is intentional: the vertical text is positioned
against the horizontal page and SVG geometry, so the element's own logical
axes are not the desired coordinate system.

## Semantics specimen

The poem and diagram share one choreography. A registered discrete
`--han-semantics` keyword switches actual typography, while the numeric
`--settle` property interpolates explanatory geometry. Their initial values
show the corrected state when reveal JavaScript does not run.

Discrete animations must last longer than one rendered frame. Chromium can
report a sub-frame delayed animation as finished while retaining its filled
starting value. A distinct replay animation name is required because changing
the timing of an existing named animation does not restart it.

The annotation owns a separate one-shot animation. If it derives opacity from
the row's replayed state, leaving hover can reapply backwards fill and flash
the annotation a second time.

Some label insets remain physical because horizontal labels are deliberately
positioned inside a vertical-writing figure. SVG view-box sizing and mock glyph
hairlines are likewise illustration geometry rather than document layout.
