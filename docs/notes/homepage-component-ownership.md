# Homepage component ownership

This note records the 2026-08-30 boundary audit for the largest homepage
stylesheets. A file boundary follows a component that can move as a whole; it
does not exist merely to keep a source file below a line-count target.

| Sheet | Owner | Boundary decision |
| --- | --- | --- |
| `station-craft.css` | The craft station's axioms, theorem and cascade example | Keep together. The three displays form one argument and share the theorem container and responsive rail geometry. The independent transfer ledger already lives in `ledger.css`. |
| `station-fonts.css` | The type station's face and punctuation specimens | Keep together. Both are controlled by the station-level form and selectors rooted in `#station-fonts:has(...)`; extracting either would split one state machine across sheets. |
| `station-playground.css` | The playground preview, rail and expanded studio | Keep together. The dialog presents the same preview panes rather than a separately reusable dialog body. Shared dialog motion remains in `dialog.css`. |
| `ledger.css` | Transfer equation, module ledger and its detail dialog | Keep as an existing movable component. It is station-hosted but owns its table, equation, open action and detail view end to end. |
| `dash-fuse.css` | The two-em-dash scroll sequence and specimen cover flow | Keep as an existing movable illustration component. Its scroll progress, colour ribbon and specimen track are one timeline. |
| `lead-forme.css` | The lead-type SVG stage, controls and narrow overflow geometry | Keep as an existing movable illustration component. Its apparent subparts share measured SVG geometry published by `lead-forme.js`. |

The manifest order remains deliberate: station composition first, reusable
illustration mechanics after the stations, and console/gate overrides last.
Future extraction requires a component root that can move with its markup and
behaviour without reaching back through another station's state selector.
