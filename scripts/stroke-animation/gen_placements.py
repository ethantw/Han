#!/usr/bin/env python3
"""strokes.json → manual/demo/stroke-placements.html——
甲（TypeTray 鉛字盤・鏡像雕刻）／乙（Manifesto 水印・輪廓浮現）
兩個整合方案的並排預覽。"""
import json
from pathlib import Path

from stroke_order import ORDER

data = json.loads((Path(__file__).parent / 'strokes.json').read_text())
OUT = Path('/Users/yijun/Workspace/hanzi.pro/han/manual/demo/stroke-placements.html')

chars = {e['char']: e for e in data['chars']}
for e in chars.values():
    e['strokes'] = [e['strokes'][k] for k in ORDER[e['char']]]


def svg_paths(entry, indent='        '):
    return '\n'.join(
        f'{indent}<path class="Stroke" style="--i: {i}" pathLength="1" d="{s["d"]}" />'
        for i, s in enumerate(entry['strokes'])
    )


# 甲：六顆鉛字，「標」承現站 data-accent
slugs = []
for ci, ch in enumerate('漢字標準格式'):
    accent = ' data-accent' if ch == '標' else ''
    slugs.append(f'''      <span class="Slug"{accent} style="--c: {ci}">
        <svg viewBox="{data["viewBox"]}" aria-hidden="true">
{svg_paths(chars[ch])}
        </svg>
      </span>''')

han = chars['漢']

html = f'''<!doctype html>
<!-- 逐筆動畫整合方案預覽：甲（TypeTray）／乙（Manifesto 水印）。
     路徑同源 scripts/stroke-animation/strokes.json；本檔由
     gen_placements.py 生成，勿手改。 -->
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>逐筆動畫・整合方案 甲／乙</title>
<style>
  :root {{
    color-scheme: light dark;
    --ink: light-dark(#2b2724, #d9d3ca);
    --paper: light-dark(#faf8f4, #211e1b);
    --accent: light-dark(#0c7a43, #4cbf8e);
    --wm-line: light-dark(#dcd7cf, #3a352f);
  }}
  body {{
    margin: 0;
    background: var(--paper);
    color: var(--ink);
    font-family: system-ui, sans-serif;
  }}
  section {{ padding: 3rem clamp(1rem, 6vi, 5rem); }}
  h1 {{ font-size: 1rem; font-weight: 500; margin: 2rem 0 0; text-align: center; }}
  h2 {{ font-size: 0.85rem; font-weight: 500; opacity: 0.6; letter-spacing: 0.1em; }}

  /* ═══ 甲・TypeTray 鉛字盤——鏡像反排，逐筆「雕」出字面 ═══ */
  .Tray {{
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 5px;
    inline-size: min(560px, 92vi);
    padding: 8px;
    border-radius: 10px;
    background: linear-gradient(158deg, #4a453f, #171512);
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 0.12),
      0 18px 44px -26px rgb(0 0 0 / 0.65);
  }}
  .Slug {{
    display: block;
    aspect-ratio: 1;
    padding: 7%;
    box-sizing: border-box;
    border-radius: 4px;
    background: linear-gradient(152deg, #35312c, #1c1916);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.07);
  }}
  .Slug svg {{
    display: block;
    inline-size: 100%;
    transform: scaleX(-1); /* 鉛字反著刻 */
  }}
  /* 雕刻：先亮線刻輪廓，再浮出字面金屬色 */
  .Slug .Stroke {{
    --at: calc(var(--c) * 0.1s + var(--i) * 0.14s);
    fill: rgb(217 211 202 / 0.55);
    fill-opacity: 0;
    stroke: rgb(240 234 222 / 0.9);
    stroke-width: 6;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation:
      draw 0.3s ease-out var(--at) forwards,
      ink 0.3s ease-in calc(var(--at) + 0.2s) forwards;
  }}
  .Slug[data-accent] .Stroke {{
    fill: var(--accent);
    stroke: color-mix(in srgb, var(--accent) 70%, white);
  }}

  /* ═══ 乙・Manifesto 水印——輪廓逐筆浮現，終態即現站水印 ═══ */
  .Hero {{
    position: relative;
    min-block-size: 78vb;
    overflow: hidden;
    border-block: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  }}
  .Watermark {{
    position: absolute;
    inset-block-start: 50%;
    inset-inline-end: clamp(2rem, 14vi, 12rem);
    translate: 0 -50%;
    inline-size: min(72vb, 640px);
  }}
  .Watermark svg {{ display: block; inline-size: 100%; overflow: visible; }}
  .Watermark .Stroke {{
    --at: calc(var(--i) * 0.32s);
    fill: none;                    /* 水印永遠只留輪廓 */
    stroke: var(--wm-line);
    stroke-width: 2.5;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: draw 0.8s ease-in-out var(--at) forwards;
  }}
  .VLede {{
    position: absolute;
    inset-block-start: 4rem;
    inset-inline-end: 2rem;
    writing-mode: vertical-rl;
    font-family: serif;
    font-size: 1.05rem;
    letter-spacing: 0.12em;
    max-block-size: 70%;
  }}

  @keyframes draw {{ to {{ stroke-dashoffset: 0; }} }}
  @keyframes ink {{ to {{ fill-opacity: 1; stroke-opacity: 0; }} }}
  .is-reset .Stroke {{ animation: none; }}

  .Controls {{ text-align: center; padding-block: 1.5rem 3rem; }}
  .Controls button {{
    font: inherit; color: inherit; background: none; cursor: pointer;
    border: 1px solid color-mix(in srgb, currentColor 35%, transparent);
    border-radius: 0.4rem; padding: 0.3rem 1.2rem;
  }}
  @media (prefers-reduced-motion: reduce) {{
    .Slug .Stroke {{ animation: none; fill-opacity: 1; stroke-opacity: 0; }}
    .Watermark .Stroke {{ animation: none; stroke-dashoffset: 0; }}
  }}
</style>
<script type="module">
  document.querySelector('#replay').addEventListener('click', () => {{
    document.body.classList.add('is-reset')
    requestAnimationFrame(() => requestAnimationFrame(() => {{
      document.body.classList.remove('is-reset')
    }}))
  }})
</script>
</head>
<body>
  <h1>逐筆動畫・整合方案預覽</h1>

  <section>
    <h2>甲・TypeTray 鉛字盤——鏡像反排，逐筆雕刻</h2>
    <div class="Tray">
{chr(10).join(slugs)}
    </div>
  </section>

  <section class="Hero">
    <h2>乙・Manifesto 水印——輪廓逐筆浮現</h2>
    <figure class="Watermark" style="margin: 0">
      <svg viewBox="{data["viewBox"]}" aria-hidden="true">
{svg_paths(han)}
      </svg>
    </figure>
    <p class="VLede">排版是文明的底稿——鉛字承載的智慧，在螢幕上繼續演化。</p>
  </section>

  <p class="Controls"><button id="replay" type="button">重播</button></p>
</body>
</html>
'''
OUT.write_text(html)
print('→', OUT, f'{OUT.stat().st_size / 1024:.1f}KB')
