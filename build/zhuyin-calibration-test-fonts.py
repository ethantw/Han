#!/usr/bin/env python3
"""Build deterministic outline fixtures for zhuyin calibration E2E tests.

Both faces contain only U+6C38 永 and have identical font/line metrics. Their
original rectangular outlines differ only at yMin, giving Canvas a stable
actualBoundingBoxDescent of .075em and .225em respectively. These are original
geometry fixtures, not redistributions of production fonts.

Generated WOFF2 files are committed because the normal JS build and CI do not
install FontTools. Run this script from the repository root when rebuilding.
"""

from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

UPM = 1000
OUT = Path("tests/e2e/fixtures/fonts")


def rectangle(x0: int, y0: int, x1: int, y1: int):
    pen = TTGlyphPen(None)
    pen.moveTo((x0, y0))
    pen.lineTo((x0, y1))
    pen.lineTo((x1, y1))
    pen.lineTo((x1, y0))
    pen.closePath()
    return pen.glyph()


def build(slug: str, family: str, y_min: int) -> Path:
    glyph_order = [".notdef", "uni6C38"]
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(glyph_order)
    fb.setupCharacterMap({0x6C38: "uni6C38"})
    fb.setupGlyf({
        ".notdef": rectangle(100, 0, 900, 800),
        "uni6C38": rectangle(100, y_min, 900, 825),
    })
    fb.setupHorizontalMetrics({name: (UPM, 0) for name in glyph_order})
    fb.setupHorizontalHeader(ascent=900, descent=-300, lineGap=0)
    fb.setupNameTable({
        "familyName": family,
        "styleName": "Regular",
        "uniqueFontIdentifier": f"{family}; deterministic geometry fixture",
        "fullName": family,
        "psName": f"{family.replace(' ', '')}-Regular",
        "version": "1.0",
    })
    fb.setupOS2(
        version=4,
        sTypoAscender=900,
        sTypoDescender=-300,
        sTypoLineGap=0,
        usWinAscent=900,
        usWinDescent=300,
        fsSelection=0x0080,
    )
    fb.setupPost(isFixedPitch=1)
    fb.font["head"].created = 0
    fb.font["head"].modified = 0
    fb.font.flavor = "woff2"

    path = OUT / f"zhuyin-ink-{slug}.woff2"
    fb.save(str(path))
    return path


OUT.mkdir(parents=True, exist_ok=True)
outputs = [
    build("reference", "Han Test Zhuyin Ink Reference", -75),
    build("low", "Han Test Zhuyin Ink Low", -225),
]
for output in outputs:
    print(f"wrote {output} ({output.stat().st_size} bytes)")
