#!/usr/bin/env python3
"""Build the invisible baseline-strut font used by Han's composite stacks.

Han Metrics covers only U+0020 SPACE. Putting it first in a font stack gives
the line a stable 0.925em ascent / 0.075em descent without taking ownership of
letters, digits, punctuation, CJK, or annotation glyphs. Run from the repo
root:

    python3 build/metrics-font.py
"""

from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

UPM = 1000
OUT = Path("src/css/fonts/metrics.woff2")

glyph_order = [".notdef", "space"]

fb = FontBuilder(UPM, isTTF=True)
fb.setupGlyphOrder(glyph_order)
fb.setupCharacterMap({0x20: "space"})

# The visible .notdef outline keeps Chrome's OTS sanitizer from rejecting an
# otherwise empty glyf table. unicode-range limits the face to SPACE, whose
# glyph itself has no contours.
space = TTGlyphPen(None).glyph()
notdef_pen = TTGlyphPen(None)
notdef_pen.moveTo((100, 0))
notdef_pen.lineTo((100, 700))
notdef_pen.lineTo((600, 700))
notdef_pen.lineTo((600, 0))
notdef_pen.closePath()
fb.setupGlyf({".notdef": notdef_pen.glyph(), "space": space})

# A quarter-em space is close to the normal word space in the text faces and
# avoids changing prose rhythm while the face supplies the shared strut.
fb.setupHorizontalMetrics({".notdef": (UPM, 0), "space": (250, 0)})
fb.setupHorizontalHeader(ascent=925, descent=-75, lineGap=0)
fb.setupNameTable(
    {
        "familyName": "Han Metrics",
        "styleName": "Regular",
        "uniqueFontIdentifier": "Han Metrics; baseline strut",
        "fullName": "Han Metrics",
        "psName": "HanMetrics-Regular",
        "version": "1.0",
    }
)
fb.setupOS2(
    version=4,
    sTypoAscender=925,
    sTypoDescender=-75,
    sTypoLineGap=0,
    usWinAscent=925,
    usWinDescent=75,
    fsSelection=0x0080,
)
fb.setupPost(isFixedPitch=1)
fb.font["head"].created = 0
fb.font["head"].modified = 0
fb.font.flavor = "woff2"
fb.save(str(OUT))

print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
