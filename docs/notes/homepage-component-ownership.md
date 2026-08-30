# Homepage component ownership

This note records the 2026-08-30 boundary audit for the largest homepage
stylesheets. A file boundary follows a component that can move as a whole; it
does not exist merely to keep a source file below a line-count target.

| Sheet | Lines | Owner | Boundary decision |
| --- | ---: | --- | --- |
| `station-craft.css` | 890 | The craft station's axioms, theorem and cascade example | Keep together. The three displays form one argument and share the theorem container and responsive rail geometry. Transfer tables and their dialog are independent components. |
| `semantics-specimen.css` | 840 | The poem and its mark-correction diagram | Keep together. Both sides consume one progress state and settle/replay as one illustration; neither can move without the other. |
| `lead-forme.css` | 716 | The lead-type SVG stage, controls and narrow overflow geometry | Keep together after the 700-line review. Its apparent subparts share measured SVG geometry published by `lead-forme.js`. |
| `station-fonts.css` | 604 | The type station's face and punctuation specimens | Keep together. Both are controlled by the station-level form and selectors rooted in `#station-fonts:has(...)`; extracting either would split one state machine across sheets. |
| `station-playground.css` | 638 | The playground preview, rail and expanded studio | Keep together. The dialog presents the same preview panes rather than a separately reusable dialog body. Shared dialog motion remains in `dialog.css`. |
| `ledger.css` | 532 | Transfer equation and reusable module/font ledgers | Keep as a movable data-display component. It no longer owns dialog chrome. |
| `size-dialog.css` | 179 | Trigger, panel and responsive layout for the complete-transfer dialog | Moved whole out of `ledger.css`; it consumes the ledger component but owns its own presentation lifecycle alongside `size-dialog.js`. |
| `paper-reader.css` | 521 | Article-reader chrome, stage and newspaper body | Moved whole out of station composition; shared dialog motion remains in `dialog.css`. |
| `dash-fuse.css` | 593 | The two-em-dash scroll sequence and specimen cover flow | Keep as a movable illustration component. Its scroll progress, colour ribbon and specimen track are one timeline. |

No authored CSS or JavaScript under `manual/public` exceeds the 1000-line hard
ceiling. The manifest order remains deliberate: shared dialog primitives and
the reader precede station composition; reusable illustration and ledger
mechanics follow the stations; `size-dialog.css` follows the ledger it presents;
console/gate overrides remain last. Future extraction requires a component root
that can move with its markup and behaviour without reaching back through
another station's state selector.
