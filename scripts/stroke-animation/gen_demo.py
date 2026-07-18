#!/usr/bin/env python3
"""strokes.json → manual/demo/stroke-animation.html（自足單檔 demo）。"""
import json
from pathlib import Path

data = json.loads((Path(__file__).parent / 'strokes.json').read_text())
OUT = Path('/Users/yijun/Workspace/hanzi.pro/han/manual/demo/stroke-animation.html')

from stroke_order import ORDER
for entry in data['chars']:
    order = ORDER[entry['char']]
    assert sorted(order) == list(range(len(entry['strokes']))), entry['char']
    entry['strokes'] = [entry['strokes'][k] for k in order]

figures = []
for ci, entry in enumerate(data['chars']):
    paths = []
    nums = []
    for i, s in enumerate(entry['strokes']):
        paths.append(
            f'      <path class="Stroke" style="--i: {i}" pathLength="1" d="{s["d"]}" />'
        )
        x0, y0, x1, y1 = s['bbox']
        # bbox 是字體座標（y-up），文字座標要翻到 y-down
        cx = (x0 + x1) / 2
        cy = 880 - (y0 + y1) / 2
        nums.append(f'      <text class="Num" x="{cx:.0f}" y="{cy:.0f}">{i + 1}</text>')
    figures.append(f'''    <figure class="Glyph" style="--c: {ci}; --n: {len(entry["strokes"])}">
    <svg viewBox="{data["viewBox"]}" role="img" aria-label="{entry["char"]}">
{chr(10).join(paths)}
{chr(10).join(nums)}
    </svg>
    <figcaption>{entry["char"]}・{len(entry["strokes"])}組</figcaption>
  </figure>''')

html = f'''<!doctype html>
<!-- 筆畫路徑抽自尚古明體 TC（ShangguSerifTC-VF，wght 400）——思源宋衍生，
     SIL OFL 1.1。此處嵌入的是渲染輪廓（文件內嵌），非字體軟體再散布。
     管線：scripts/stroke-animation/extract_strokes.py → strokes.json →
     gen_demo.py（本檔由腳本生成，勿手改——改腳本再重跑）。
     筆順已人工校訂（見 scripts/stroke-animation/gen_demo.py 的 ORDER 表），
     「筆順編號」核取方塊可隨時複查。 -->
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>逐筆動畫・尚古明體「漢字標準格式」</title>
<style>
  /* 自足 demo——不掛 han.css，只用系統字。配色走 light-dark()
     （baseline 2024），主題跟系統。 */
  :root {{
    color-scheme: light dark;
    --ink: light-dark(#2b2724, #d9d3ca);
    --paper: light-dark(#faf8f4, #211e1b);
    --accent: light-dark(#9a4a2c, #d08b5e);
    --stroke-step: 0.22s;   /* 逐筆錯峰間隔 */
    --char-stagger: 0.12s;  /* 字與字的起步差 */
    --draw-dur: 0.4s;       /* 描邊（打稿）時長 */
    --ink-dur: 0.35s;       /* 上墨時長 */
  }}
  body {{
    margin: 0;
    min-block-size: 100dvb;
    display: grid;
    place-content: center;
    gap: 2rem;
    background: var(--paper);
    color: var(--ink);
    font-family: system-ui, sans-serif;
  }}
  h1 {{ font-size: 1rem; font-weight: 500; text-align: center; margin: 2rem 0 0; }}
  .Tray {{
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
    padding: 0 2rem;
  }}
  .Glyph {{
    margin: 0;
    inline-size: min(160px, 26vi);
  }}
  .Glyph svg {{ display: block; inline-size: 100%; overflow: visible; }}
  .Glyph figcaption {{
    text-align: center;
    font-size: 0.75rem;
    opacity: 0.55;
    margin-block-start: 0.25rem;
  }}

  /* ─── 逐筆：打稿（描輪廓）→ 上墨（填實） ───
     delay = 字起步差 + 該筆序號 × 錯峰間隔；上墨比描邊晚起半拍。 */
  .Stroke {{
    --at: calc(var(--c) * var(--char-stagger) + var(--i) * var(--stroke-step));
    fill: var(--ink);
    fill-opacity: 0;
    stroke: var(--accent);
    stroke-width: 4;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation:
      draw var(--draw-dur) ease-out var(--at) forwards,
      ink var(--ink-dur) ease-in calc(var(--at) + var(--draw-dur) * 0.6) forwards;
  }}
  @keyframes draw {{ to {{ stroke-dashoffset: 0; }} }}
  @keyframes ink {{
    to {{ fill-opacity: 1; stroke-opacity: 0; }}
  }}

  /* 重播：.replay 期間凍結在初始態，移除後動畫重新起算 */
  .is-reset .Stroke {{ animation: none; }}

  /* 筆順編號（校訂用）——預設隱藏 */
  .Num {{
    display: none;
    font-size: 72px;
    fill: var(--accent);
    stroke: var(--paper);
    stroke-width: 6;
    paint-order: stroke;
    text-anchor: middle;
    dominant-baseline: central;
    font-family: system-ui, sans-serif;
  }}
  body:has(#nums:checked) .Num {{ display: block; }}
  body:has(#nums:checked) .Stroke {{
    animation: none;
    fill-opacity: 0.12;
    stroke-opacity: 1;
    stroke-dashoffset: 0;
  }}

  .Controls {{
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-block-end: 2.5rem;
    font-size: 0.85rem;
  }}
  .Controls button {{
    font: inherit;
    color: inherit;
    background: none;
    border: 1px solid color-mix(in srgb, currentColor 35%, transparent);
    border-radius: 0.4rem;
    padding: 0.3rem 1rem;
    cursor: pointer;
  }}

  @media (prefers-reduced-motion: reduce) {{
    .Stroke {{ animation: none; fill-opacity: 1; stroke-opacity: 0; }}
  }}
</style>
<script type="module">
  const replay = document.querySelector('#replay')
  replay.addEventListener('click', () => {{
    document.body.classList.add('is-reset')
    requestAnimationFrame(() => requestAnimationFrame(() => {{
      document.body.classList.remove('is-reset')
    }}))
  }})
</script>
</head>
<body>
  <h1>逐筆動畫試作——尚古明體「漢字標準格式」</h1>
  <div class="Tray">
{chr(10).join(figures)}
  </div>
  <p class="Controls">
    <button id="replay" type="button">重播</button>
    <label><input type="checkbox" id="nums"> 筆順編號（校訂用）</label>
  </p>
</body>
</html>
'''
OUT.write_text(html)
print('→', OUT, f'{OUT.stat().st_size / 1024:.1f}KB')
