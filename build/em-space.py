#!/usr/bin/env python3
"""Build the Han Em Space fallback webfont.

A tiny utility font whose only job is to map U+0020 SPACE to a glyph whose
advance width is exactly 1em (full-width). It is the `Han Em Space Fallback`
family in `src/css/fonts/em-space.css`, used as the invisible,
em-calibrated inline spacer in the JS line-adjustment fallbacks
(擠壓 / 懸掛 / 跨文種間隙) when Courier New / Courier is unavailable.

Only `.notdef` and `space` are included; the space glyph has no outline,
so the output carries no copyrightable glyph data (no OFL provenance to
preserve). Run from the repo root:

    python3 build/em-space.py
"""

from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

UPM = 1000  # units per em; space advance == UPM == 1em (full-width)
# Source of truth; the library build (esbuild file loader) copies this into dist/.
OUT = Path("src/css/fonts/em-space.woff2")

glyph_order = [".notdef", "space"]

fb = FontBuilder(UPM, isTTF=True)
fb.setupGlyphOrder(glyph_order)
fb.setupCharacterMap({0x20: "space"})

# `space` carries no contours (its advance is all that matters). `.notdef`
# gets a simple box outline: a wholly-empty `glyf` table is a zero-length
# table, which Chrome's OTS sanitizer rejects ("glyf: zero-length table"),
# so the font must contain at least one real outline even though we never
# render .notdef (the @font-face restricts unicode-range to U+20).
space = TTGlyphPen(None).glyph()
notdef_pen = TTGlyphPen(None)
notdef_pen.moveTo((100, 0))
notdef_pen.lineTo((100, 700))
notdef_pen.lineTo((600, 700))
notdef_pen.lineTo((600, 0))
notdef_pen.closePath()
fb.setupGlyf({".notdef": notdef_pen.glyph(), "space": space})

# advance == 1em for the space; lsb 0.
fb.setupHorizontalMetrics({name: (UPM, 0) for name in glyph_order})
fb.setupHorizontalHeader(ascent=800, descent=-200, lineGap=0)

fb.setupNameTable(
    {
        "familyName": "Han Em Space",
        "styleName": "Regular",
        "uniqueFontIdentifier": "Han Em Space; full-width U+0020 spacer",
        "fullName": "Han Em Space",
        "psName": "HanEmSpace-Regular",
        "version": "2.0",
    }
)

fb.setupOS2(
    version=4,  # USE_TYPO_METRICS (fsSelection bit 7) is only valid in v4+
    sTypoAscender=800,
    sTypoDescender=-200,
    sTypoLineGap=0,
    usWinAscent=800,
    usWinDescent=200,
    fsSelection=0x0080,  # USE_TYPO_METRICS, so the line box stays predictable
)
fb.setupPost(isFixedPitch=1)

# Pin head dates so the build is byte-reproducible (FontBuilder otherwise
# stamps `created` / `modified` with the wall clock, churning the binary on
# every run). 0 == the font epoch, 1904-01-01.
fb.font["head"].created = 0
fb.font["head"].modified = 0

fb.font.flavor = "woff2"
fb.save(str(OUT))

print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
