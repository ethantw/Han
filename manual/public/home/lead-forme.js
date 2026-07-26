/**
 * lead-forme.js — station②'s isometric movable-type forme.
 *
 * A decorative specimen that embodies the type-picking ↔ unicode-range story
 * (stTrayNote): the sentence「字有百年筋骨，標點各歸其位。」set as mirrored
 * lead slugs in an isometric forme. Three heritage faces (Ziano 明／黑／楷)
 * and two punctuation conventions (Diantenjeom JIS／MOE) swap live from the
 * figure's own form — each swap ejects the affected slugs and drops the new
 * ones back in. Every slug is engraved on its reader-facing side with the
 * frequency slice it downloads from (Han) or its Diantenjeom name (punctuation).
 *
 * Pure builders (iso maths → SVG string) are quarantined from the imperative
 * shell (`initLeadForme`): the shell only queries the DOM, injects the built
 * markup, and wires the form. Colours come entirely from `--forme-*` tokens
 * (home/lead-forme.css) so the whole thing is theme-aware; state lives on the
 * figure's own `data-face` / `data-punct`, never on `:root`.
 */

// ── isometric basis ───────────────────────────────────────────────
const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;
const e1 = [COS, SIN];    // down-right → columns advance (mirror → first column left)
const e2 = [-COS, SIN];   // down-left  → within a column, top→bottom
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
const pts = (...ps) => ps.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');

// theme tokens (resolved by CSS light-dark() — see home/lead-forme.css)
const INK = 'var(--forme-ink)';
const FACE = ['var(--forme-face-1)', 'var(--forme-face-2)', 'var(--forme-face-3)'];
const WALL = 'var(--forme-wall)';
const RELIEF = 'var(--forme-relief)';
const HI = 'var(--forme-hi)';

const PUNCT = new Set(['，', '、', '。', '：', '；', '？', '！', '「', '」', '『', '』', '（', '）', '—', '…', '·', '．']);
// the real Ziano frequency slice each glyph downloads from (120-way partition)
const SLICE = {
  山: 117, 田: 114, 臉: 115, 色: 118, 鐵: 115, 青: 116,
  我: 119, 特: 118, 地: 119, 放: 117, 棄: 113, 瞬: 109, 移: 114, 艙: 105,
  改: 117, 搭: 115, 超: 118, 迴: 112, 路: 118, 就: 118, 是: 119,
  因: 118, 為: 119, 快: 118, 十: 117, 二: 118, 秒: 113,
};

// 太陽中文報 hyperloop-3min — the furious commuter's opening line, set 直排右起
// (under mirror the first reading column sits on the LEFT). Proper vertical
// typesetting: a 1-em 段首縮排 opens column 1, 10 slugs per column, and 禁則
// (kinsoku) holds — 「 lands 2nd-from-tail (never line-end), 「，！」」never at
// a line-head. The short last column is packed out with 空鉛 (quads) to fill
// the 版框 — real justification locks the forme so the type can't shift.
//   山田臉色鐵青：「我特地放棄瞬移艙改搭超迴路，就是因為快十二秒！」
const COLS = [
  ['', '山', '田', '臉', '色', '鐵', '青', '：', '「', '我'],
  ['特', '地', '放', '棄', '瞬', '移', '艙', '改', '搭', '超'],
  ['迴', '路', '，', '就', '是', '因', '為', '快', '十', '二'],
  ['秒', '！', '」', '', '', '', '', '', '', ''],
];
const GEO = { S: 90, cell: 94, H: 140, r: 11, fs: 60, sw: 2, leadEm: 0.7, squeezeGap: 0.5 };

// three visible faces of a box: footprint sx (e1) × sy (e2), body height bodyH
const faces3 = (O, sx, sy, bodyH = GEO.H) => {
  const { sw } = GEO;
  const c0 = O;
  const c1 = add(O, e1, sx);
  const c2 = add(c1, e2, sy);
  const c3 = add(O, e2, sy);
  const down = (p) => [p[0], p[1] + bodyH];
  return `
    <polygon points="${pts(c3, c2, down(c2), down(c3))}" fill="${FACE[0]}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" />
    <polygon points="${pts(c1, c2, down(c2), down(c1))}" fill="${FACE[1]}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" />
    <polygon points="${pts(c0, c1, c2, c3)}" fill="${FACE[2]}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" />`;
};

// a spacing block — 空鉛 (段首/收尾)、justify 小鉛塊: a bare full-height box,
// no glyph or label. `solid` = a real 小鉛塊 (opaque, so it reads as
// furniture); otherwise a 空鉛 quad (half-opacity, CSS .Slug:not(.has-glyph)).
// `first` tags column 1 so the punct swap re-drops it.
const spacer = (O, sx, sy, d, first, solid) =>
  `<g class="Slug${first ? ' col0' : ''}${solid ? ' solid' : ''}"${d != null ? ` style="--d:${d.toFixed(2)}s"` : ''}><g class="SlugLift">${faces3(O, sx, sy)}</g></g>`;


// column layout in cell units. MOE／GB: uniform 1-cell slugs. JIS with a ：「
// pair: ： keeps a full em, 「 becomes a half slug (its front-half whitespace
// trimmed), and the freed half is spread as small justify blocks between every
// other pair — so the column keeps its full justified length.
const columnLayout = (col, punct) => {
  const n = col.length;
  let sq = -1;
  for (let i = 0; i < n - 1; i++) if (col[i] === '：' && col[i + 1] === '「') sq = i;
  if (punct !== 'jis' || sq < 0) return col.map((ch, i) => ({ char: ch, aStart: i, size: 1 }));
  const half = 0.5;
  // freed 0.5 is shared by every 字距 gap EXCEPT the tight ：「 pair and the gap
  // right after the 段首縮排 空鉛 (no 字距 block hugs the indent quad).
  const isGap = (ch, i) => i < n - 1 && i !== sq && ch.trim() !== '';
  const e = (1 - half) / col.filter(isGap).length;
  const items = [];
  let a = 0;
  for (let i = 0; i < n; i++) {
    const isHalf = i === sq + 1;    // 「
    items.push({ char: col[i], aStart: a, size: isHalf ? half : 1 });
    a += isHalf ? half : 1;
    if (isGap(col[i], i)) { items.push({ space: true, aStart: a, size: e }); a += e; }
  }
  return items;
};

// ── one lead-type slug (a printing character) → SVG group string ──
const block = ({ O, char, d, sy = GEO.S, first, half }) => {
  const { S, H, r, fs, sw } = GEO;
  const cc = add(add(O, e1, S / 2), e2, sy / 2);      // top-face centre
  const faces = faces3(O, S, sy);
  const cls = `Slug has-glyph${first ? ' col0' : ''}${PUNCT.has(char) ? ' is-punct' : ''}`;

  // mirrored printing face on the top plane (scaleX −1 baked into column 1)
  const m = `matrix(${-COS} ${-SIN} ${-COS} ${SIN} ${cc[0].toFixed(2)} ${cc[1].toFixed(2)})`;
  const glyphLayout = PUNCT.has(char)
    ? 'writing-mode:vertical-rl; text-orientation:upright'
    : 'dominant-baseline:central';
  const glyph = (fill, stroke, gsw, dy) => `
    <g transform="translate(0 ${-dy})"><g transform="${m}">
      <text class="g" x="0" y="0" font-size="${fs}" text-anchor="middle" style="${glyphLayout}"
            fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="${gsw}"` : ''}
            stroke-linejoin="round" paint-order="stroke">${char}</text>
    </g></g>`;
  let relief = glyph(WALL, INK, sw * 0.7, 0);
  for (let k = 1; k < r; k++) relief += glyph(WALL, '', 0, k);
  relief += glyph(RELIEF, INK, sw, r - 1);
  relief += glyph('none', HI, sw * 0.9, r);

  // engraved side-face spec on BOTH visible side faces (e1 right + e2 left/front)
  // so a hover-lift shows it whichever face it exposes — including the half 「.
  // text-x with a positive determinant vs text-y=(0,1) keeps glyphs unreflected.
  const c1 = add(O, e1, S);
  const c2 = add(c1, e2, sy);
  const c3 = add(O, e2, sy);
  const spec = PUNCT.has(char)
    ? `<text class="lbl-var dtj dtj-serif" x="0" y="0" font-size="15" text-anchor="middle">Serif</text>
       <text class="lbl-var dtj dtj-sans" x="0" y="0" font-size="15" text-anchor="middle">Sans</text>
       <text class="lbl-sub" x="0" y="13" font-size="7.5" text-anchor="middle">Diantenjeom</text>`
    : `<text class="lbl-num" x="0" y="0" font-size="20" text-anchor="middle">${SLICE[char]}</text>
       <text class="nm nm-m" x="0" y="14" font-size="8.5" text-anchor="middle">尚古明體</text>
       <text class="nm nm-h" x="0" y="14" font-size="8.5" text-anchor="middle">尚古黑體</text>
       <text class="nm nm-k" x="0" y="14" font-size="8.5" text-anchor="middle">霞鶩文楷</text>`;
  const faceLabel = (anchor, tx) =>
    `<g transform="matrix(${tx[0].toFixed(4)} ${tx[1].toFixed(4)} 0 1 ${anchor[0].toFixed(2)} ${(anchor[1] + H * 0.3).toFixed(2)})">${spec}</g>`;
  // FACE[1] (right, mid c1-c2) spans e2=sy → cramped to half on the squeezed 「;
  // FACE[0] (left-front, mid c3-c2) spans e1=S → always full. Label only the
  // full-area face when squeezed, so the half slug isn't crammed with text.
  const label = (half ? '' : faceLabel(mid(c1, c2), [COS, -SIN])) + faceLabel(mid(c3, c2), [COS, SIN]);

  return `<g class="${cls}" style="--d:${d.toFixed(2)}s"><g class="SlugLift">${faces}${relief}${label}</g></g>`;
};

// ── build the whole forme for a punctuation mode → { viewBox, markup, lastDelay } ──
/** per-piece entrance stagger, in seconds — a compositor sets one slug at a
 *  time, so reading order becomes the drop order (the `--d` custom prop). */
const STAGGER = 0.07;

const buildForme = (punct) => {
  const { S, cell, H, r, leadEm } = GEO;
  const rows = COLS[0].length;
  const colStep = S * (1 + leadEm);          // 行距 — leading pitch between columns
  // Generation order IS the paint order — COLUMN-MAJOR: a column top-to-bottom,
  // then its 行距鉛條, then the next column. That's a valid painter's sort here
  // (view ray = e1+e2+up, so a strip is always in FRONT of the column it
  // follows and BEHIND the next one, which the block order gives; and columns
  // never overlap each other directly — 行距 colStep 153 > body H 140, every
  // cross-column overlap goes through the strip). The generic diagonal a+b sort
  // only fits unit boxes — under it a rows-spanning strip has NO valid slot.
  const cells = [];
  let read = 0;
  COLS.forEach((col, b) => {
    const bx = b * colStep;
    const first = b === 0;                     // column 1 — re-laid-out on punct swap
    columnLayout(col, punct).forEach((it) => {
      const O = add(add([0, 0], e2, it.aStart * cell), e1, bx);
      if (it.space)                           // justify 小鉛塊 — solid furniture
        cells.push({ kind: 'space', O, sx: S, sy: it.size * cell, d: read++ * STAGGER, first, solid: true });
      else if (!it.char.trim())               // 空鉛 段首/收尾 — half-opacity quad
        cells.push({ kind: 'space', O, sx: S, sy: S, d: read++ * STAGGER, first, solid: false });
      else
        cells.push({ kind: 'char', O, char: it.char, sy: it.size * S, d: read++ * STAGGER, first, half: it.size < 1 });
    });
    if (b < COLS.length - 1)                   // 行距鉛條 — ONE whole box (the
      // column-major order above makes a rows-spanning piece sort cleanly),
      // half-opacity like the 空鉛 quads: a single group composites plain
      // `opacity` with no seams, and the furniture behind ghosts through.
      cells.push({ kind: 'space', O: add([0, 0], e1, bx + S), sx: colStep - S, sy: rows * cell, d: read++ * STAGGER, solid: false });
  });

  // auto-fit the viewBox over every piece's footprint (rises by r, drops by H)
  const xs = [];
  const ys = [];
  for (const c of cells) {
    const sx = c.sx ?? S;
    const c1 = add(c.O, e1, sx);
    const c3 = add(c.O, e2, c.sy);
    const c2 = add(c1, e2, c.sy);
    for (const p of [c.O, c1, c2, c3]) {
      xs.push(p[0]);
      ys.push(p[1] - r, p[1] + H);
    }
  }
  const pad = 34;
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const w = Math.max(...xs) + pad - minX;
  const h = Math.max(...ys) + pad - minY;

  const markup = cells
    .map((c) => (c.kind === 'char'
      ? block({ O: c.O, char: c.char, sy: c.sy, d: c.d, first: c.first, half: c.half })
      : spacer(c.O, c.sx, c.sy, c.d, c.first, c.solid)))
    .join('');
  return {
    viewBox: `${minX.toFixed(1)} ${minY.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`,
    markup,
    // when the LAST slug starts its drop. The caption's cue is derived from
    // this in CSS (+ the drop's own duration), so the entrance stays ONE
    // ceremony however many pieces the sentence lays out to.
    lastDelay: (read - 1) * STAGGER,
  };
};

// ── imperative shell ──────────────────────────────────────────────
const EJECT = [
  { transform: 'translateY(0)', opacity: 1 },
  { transform: 'translateY(-150px)', opacity: 0 },
];
const DROP = [
  { transform: 'translateY(-150px)', opacity: 0 },
  { transform: 'translateY(0)', opacity: 1 },
];

export const initLeadForme = ($root = document) => {
  const $forme = $root.querySelector('.LeadForme');
  if (!$forme) return;
  const $svg = $forme.querySelector('svg');
  const render = () => {
    const { viewBox, markup, lastDelay } = buildForme($forme.dataset.punct || 'jis');
    $svg.setAttribute('viewBox', viewBox);
    $svg.innerHTML = markup;
    // hand the drop's tail to CSS — it adds --lf-drop-dur for the caption's cue
    $forme.style.setProperty('--lf-last-slug', `${lastDelay.toFixed(2)}s`);
  };
  render();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let busy = false;
  // eject the affected slugs, swap the font while they're out of frame, drop back.
  const reslot = async (sel, swap) => {
    if (reduced || busy) return swap();
    busy = true;
    const els = [...$svg.querySelectorAll(sel)];
    const a1 = els.map((el) => el.animate(EJECT, { duration: 240, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }));
    await Promise.all(a1.map((a) => a.finished));
    swap();
    const a2 = els.map((el) => el.animate(DROP, { duration: 720, easing: 'cubic-bezier(.28,1.12,.44,1)', fill: 'forwards' }));
    await Promise.all(a2.map((a) => a.finished));
    a1.forEach((a) => a.cancel());
    a2.forEach((a) => a.cancel());
    busy = false;
  };

  // face change is font-only → reslot the glyph slugs (no geometry change)
  $forme.querySelectorAll('input[name="lf-face"]').forEach((el) =>
    el.addEventListener('change', () => reslot('.has-glyph', () => { $forme.dataset.face = el.value; })));
  // punct change re-lays-out the ：「 column (half 「 + justify blocks). Only the
  // punctuation slugs and column 1 differ, so we suppress the full entrance drop
  // (`.settled`, one-way) and re-drop JUST those pieces; the rest is rebuilt in
  // place at unchanged positions, so it doesn't move.
  $forme.querySelectorAll('input[name="lf-punct"]').forEach((el) =>
    el.addEventListener('change', () => {
      $forme.classList.add('settled');
      $forme.dataset.punct = el.value;
      render();
      if (reduced) return;
      // stagger the re-drop (fill:backwards holds each piece up-and-hidden until
      // its turn) so the swap arranges over ~3s, matching the entrance pace.
      // A compositor sets one line at a time: finish column 1 top-to-bottom
      // (DOM = depth order = reading order there), THEN the other columns'
      // punctuation — never hopping between lines mid-column.
      [
        ...$svg.querySelectorAll('.col0'),
        ...$svg.querySelectorAll('.is-punct:not(.col0)'),
      ].forEach(($el, i) =>
        $el.animate(DROP, { duration: 720, delay: i * 180, easing: 'cubic-bezier(.28,1.12,.44,1)', fill: 'backwards' }));
    }));
};
