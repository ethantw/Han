#!/usr/bin/env python3
"""Build the geometry-only font used by the punctuation squeeze demo.

Every covered character advances exactly 1em. The outlines are intentionally
simple and original: the page tests CSS/DOM spacing, not a typeface's GPOS.
Run from the repository root.
"""

from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.pens.ttGlyphPen import TTGlyphPen

UPM = 1000
OUT = Path("manual/public/test/punctuation-metrics.woff2")
CHARS = "漢「『《〈（〔［｛【〖」』》〉）〕］｝】〗︰．、，。：；？！ー·＼／－゠＆・＿"
PAIR_CHARS = "「『《〈（〔［｛【〖」』》〉）〕］｝】〗︰．、，。：；？！·・"


def rectangle(x0: int, y0: int, x1: int, y1: int):
    pen = TTGlyphPen(None)
    pen.moveTo((x0, y0))
    pen.lineTo((x0, y1))
    pen.lineTo((x1, y1))
    pen.lineTo((x1, y0))
    pen.closePath()
    return pen.glyph()


glyph_order = [".notdef"] + [f"uni{ord(ch):04X}" for ch in CHARS]
glyphs = {".notdef": rectangle(100, 0, 900, 800)}
cmap = {}

for ch in CHARS:
    name = f"uni{ord(ch):04X}"
    cmap[ord(ch)] = name
    if ch in "「『《〈（〔［｛【〖":
        glyphs[name] = rectangle(650, 100, 850, 750)
    elif ch in "」』》〉）〕］｝】〗":
        glyphs[name] = rectangle(150, 100, 350, 750)
    elif ch == "漢":
        glyphs[name] = rectangle(100, 50, 900, 850)
    else:
        glyphs[name] = rectangle(180, 80, 420, 320)

fb = FontBuilder(UPM, isTTF=True)
fb.setupGlyphOrder(glyph_order)
fb.setupCharacterMap(cmap)
fb.setupGlyf(glyphs)
fb.setupHorizontalMetrics({name: (UPM, 0) for name in glyph_order})
fb.setupHorizontalHeader(ascent=880, descent=-120, lineGap=0)
fb.setupNameTable({
    "familyName": "Han Punctuation Metrics",
    "styleName": "Regular",
    "uniqueFontIdentifier": "Han Punctuation Metrics; geometry fixture",
    "fullName": "Han Punctuation Metrics",
    "psName": "HanPunctuationMetrics-Regular",
    "version": "1.0",
})
fb.setupOS2(
    version=4,
    sTypoAscender=880,
    sTypoDescender=-120,
    sTypoLineGap=0,
    usWinAscent=880,
    usWinDescent=120,
    fsSelection=0x0080,
)
fb.setupPost(isFixedPitch=1)
pair_glyphs = " ".join(f"uni{ord(ch):04X}" for ch in PAIR_CHARS)
addOpenTypeFeaturesFromString(
    fb.font,
    f"@PAIR = [{pair_glyphs}]; feature kern {{ pos @PAIR @PAIR -500; }} kern;",
)
fb.font["head"].created = 0
fb.font["head"].modified = 0
fb.font.flavor = "woff2"

OUT.parent.mkdir(parents=True, exist_ok=True)
fb.save(str(OUT))
print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
