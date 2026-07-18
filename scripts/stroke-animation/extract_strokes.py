#!/usr/bin/env python3
"""抽取尚古明體 TC「漢字標準格式」六字的逐筆路徑 → JSON。

前提驗證＋抽取一體：
- 思源系不合併 overlap → 每筆≈一條 contour；
- counter（口形內圈）按「被奇數個 contour 包含＝洞」配對進所屬筆畫組；
- 字體無筆順資訊，contour 序＝製作序，後續人工校訂（JSON 可改序）。
"""
import json
import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.recordingPen import DecomposingRecordingPen

FONT = Path('/Users/yijun/Workspace/hanzi.pro/ziano/.cache/extracted/shanggu-serif-tc/ShangguSerifTC-VF.ttf')
CHARS = '漢字標準格式'
OUT = Path(__file__).parent / 'strokes.json'

font = TTFont(FONT)
fvar = font['fvar']
print('fvar axes:', [(a.axisTag, a.minValue, a.defaultValue, a.maxValue) for a in fvar.axes])
# 釘到 Regular（400）——VF 預設 master 可能是最細的
instantiateVariableFont(font, {'wght': 400}, inplace=True)

upem = font['head'].unitsPerEm
os2 = font['OS/2']
asc = os2.sTypoAscender  # 思源系 880
desc = os2.sTypoDescender  # -120
print(f'upem={upem} typoAsc={asc} typoDesc={desc}')

cmap = font.getBestCmap()
glyph_set = font.getGlyphSet()


def contours_of(glyph_name):
    """回傳 [(records…)]，每條 contour 一組 pen 指令。"""
    pen = DecomposingRecordingPen(glyph_set)
    glyph_set[glyph_name].draw(pen)
    contours, cur = [], []
    for op, args in pen.value:
        cur.append((op, args))
        if op == 'closePath' or op == 'endPath':
            contours.append(cur)
            cur = []
    if cur:
        contours.append(cur)
    return contours


def tt_quads(pts):
    """TrueType qCurveTo 點列 → [(ctrl, on), …] 二次貝茲段（補隱含 on-curve 中點）。"""
    segs = []
    # pts: 一串 off-curve，最後一點是 on-curve（呼叫端保證非 None）
    offs, last_on = list(pts[:-1]), pts[-1]
    for i in range(len(offs) - 1):
        mid = ((offs[i][0] + offs[i + 1][0]) / 2, (offs[i][1] + offs[i + 1][1]) / 2)
        segs.append((offs[i], mid))
    if offs:
        segs.append((offs[-1], last_on))
    else:
        segs.append((None, last_on))  # 無 off-curve → 直線
    return segs


def contour_to_d(recs):
    """一條 contour 的 pen 指令 → SVG path d（座標 y 翻轉到 y-down）。"""
    def T(pt):
        x, y = pt
        return (round(x, 1), round(asc - y, 1))

    d = []
    start = None
    pos = None
    for op, args in recs:
        if op == 'moveTo':
            start = pos = args[0]
            x, y = T(pos)
            d.append(f'M{x} {y}')
        elif op == 'lineTo':
            pos = args[0]
            x, y = T(pos)
            d.append(f'L{x} {y}')
        elif op == 'qCurveTo':
            pts = list(args)
            if pts[-1] is None:
                # 全 off-curve 閉合輪廓：以首點的隱含 on-curve 當起點
                first_implied = ((pts[0][0] + pts[-2][0]) / 2, (pts[0][1] + pts[-2][1]) / 2)
                pts = pts[:-1] + [first_implied]
            for ctrl, on in tt_quads(pts):
                if ctrl is None:
                    x, y = T(on)
                    d.append(f'L{x} {y}')
                else:
                    cx, cy = T(ctrl)
                    x, y = T(on)
                    d.append(f'Q{cx} {cy} {x} {y}')
                pos = on
        elif op == 'curveTo':  # 保險：萬一有 cubic
            coords = [T(p) for p in args]
            flat = ' '.join(f'{x} {y}' for x, y in coords)
            d.append(f'C{flat}')
            pos = args[-1]
        elif op in ('closePath', 'endPath'):
            d.append('Z')
    return ''.join(d)


def bbox_of(recs):
    xs, ys = [], []
    for op, args in recs:
        for pt in args:
            if pt is not None:
                xs.append(pt[0]); ys.append(pt[1])
    return min(xs), min(ys), max(xs), max(ys)


def first_point(recs):
    for op, args in recs:
        if op == 'moveTo':
            return args[0]
    return None


def point_in_contour(pt, recs):
    """射線法（用控制點多邊形近似——配對 counter 足夠）。"""
    poly = []
    for op, args in recs:
        for p in args:
            if p is not None:
                poly.append(p)
    x, y = pt
    inside = False
    n = len(poly)
    for i in range(n):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % n]
        if (y1 > y) != (y2 > y):
            xin = (x2 - x1) * (y - y1) / (y2 - y1) + x1
            if x < xin:
                inside = not inside
    return inside


result = {'font': FONT.name, 'upem': upem, 'viewBox': f'0 0 {upem} {upem}', 'chars': []}
for ch in CHARS:
    gname = cmap[ord(ch)]
    cons = contours_of(gname)
    bbs = [bbox_of(c) for c in cons]
    fps = [first_point(c) for c in cons]
    # 包含計數：first point 落在幾個其他 contour 內
    depth = []
    for i, fp in enumerate(fps):
        cnt = 0
        for j, c in enumerate(cons):
            if i == j:
                continue
            bb = bbs[j]
            if bb[0] <= fp[0] <= bb[2] and bb[1] <= fp[1] <= bb[3] and point_in_contour(fp, c):
                cnt += 1
        depth.append(cnt)
    # 奇數深度＝洞 → 併入「包含它、深度小一層、bbox 最小」的外圈
    groups = []  # [{outer: idx, holes: [idx…]}]
    idx_to_group = {}
    for i, dep in enumerate(depth):
        if dep % 2 == 0:
            idx_to_group[i] = len(groups)
            groups.append({'outer': i, 'holes': []})
    for i, dep in enumerate(depth):
        if dep % 2 == 1:
            candidates = []
            for j in idx_to_group:
                bb = bbs[j]
                if bb[0] <= fps[i][0] <= bb[2] and bb[1] <= fps[i][1] <= bb[3] and point_in_contour(fps[i], cons[j]):
                    area = (bb[2] - bb[0]) * (bb[3] - bb[1])
                    candidates.append((area, j))
            if candidates:
                _, j = min(candidates)
                groups[idx_to_group[j]]['holes'].append(i)
            else:
                idx_to_group[i] = len(groups)
                groups.append({'outer': i, 'holes': []})
    strokes = []
    for g in groups:
        idxs = [g['outer']] + g['holes']
        d = ''.join(contour_to_d(cons[k]) for k in idxs)
        bb = bbs[g['outer']]
        strokes.append({'d': d, 'bbox': [round(v) for v in bb]})
    result['chars'].append({'char': ch, 'glyph': gname, 'contours': len(cons), 'strokes': strokes})
    print(f'{ch}: contour {len(cons)} 條 → 筆畫組 {len(strokes)} 組（洞 {sum(len(g["holes"]) for g in groups)} 個）')

OUT.write_text(json.dumps(result, ensure_ascii=False))
print('→', OUT, f'{OUT.stat().st_size / 1024:.1f}KB')
