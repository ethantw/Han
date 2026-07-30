/**
 * lead-forme.js — station②'s isometric movable-type forme.
 *
 * A decorative specimen that embodies the type-picking ↔ unicode-range story
 * (stTrayNote): the sentence「山田臉色鐵青：「我特地放棄瞬移艙改搭超迴路，就是
 * 因為快十二秒！」」(see COLS) set as mirrored lead slugs in an isometric forme.
 * Three heritage faces (Ziano 明／黑／楷) and three punctuation conventions
 * (Diantenjeom JIS／MOE／GB) swap live from the
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
/* `S` is the type body's footprint AND the glyph's em — a piece of type has one
 * square measure, and the 字面 (printing face) is that square. There used to be
 * a separate `fs: 60`, i.e. a 90-unit body carrying a 60-unit face: 0.667em of
 * glyph in a 1em body, which is 0.333em of dead tracking on every piece. Set a
 * sentence in it and the forme read as though it had `letter-spacing` — the
 * opposite of the 密排 a locked forme is. (Ziano's Han ink measures 0.81–0.94em
 * inside that em, which is the font's own 字面餘白 and exactly the amount that
 * should be there.)
 *
 * `emCentre` is where the baseline sits below the face's centre, in em. NOT
 * `dominant-baseline: central`, which centres on the hhea ascent/descent
 * midpoint (measured: 0.4326em) rather than the em box's (sTypoAscender
 * 880/1000 = 0.38em, and the ink's own centre measures 0.375em) — so `central`
 * hangs every glyph 0.053em LOW. At the old 60-unit face that was 3.2 units and
 * invisible; against a full 90-unit face it is 4.7 units against a 餘白 of about
 * 5, i.e. the whole bottom margin. Same two-metric-systems problem as
 * docs/notes/2026-07-21-svg-glyph-baseline-alignment.md.
 *
 * There is no `cell` separate from `S` either, for the same reason `fs` isn't:
 * a locked forme's pieces TOUCH. `cell` was the reading pitch and `S` the body,
 * at 94 against 90 — four units of nothing between every two pieces, which is
 * silent letter-spacing on top of the face's own. With them equal, two
 * neighbours' 2-unit outlines straddle one shared edge and read as a single
 * seam, which is what a seam between two pieces of lead looks like. */
const GEO = { S: 90, H: 140, r: 11, sw: 2, leadEm: 0.7, emCentre: 0.38 };

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
const spacer = (O, sx, sy, d, solid) =>
  `<g class="Slug${solid ? ' solid' : ''}"${d != null ? ` style="--d:${d.toFixed(2)}s"` : ''}><g class="SlugLift">${faces3(O, sx, sy)}</g></g>`;


// Line layout in body units. Unsqueezed: uniform 1-body slugs. Squeezed at a
// ：「 pair: ： keeps a full em, 「 becomes a half slug (its front-half
// whitespace trimmed), and the freed half is spread as small justify blocks
// between every other pair — so the line keeps its full justified length.
//
// WHEN it squeezes differs by direction. 直排: JIS only — MOE／GB seat ： low in
// the em there, so nothing meets 「's leading space. 橫排: ALL THREE — ：'s
// trailing half-space abuts 「's leading half-space under every convention.
const lineLayout = (col, punct, orient) => {
  const n = col.length;
  let sq = -1;
  for (let i = 0; i < n - 1; i++) if (col[i] === '：' && col[i + 1] === '「') sq = i;
  const squeezes = orient === 'h' || punct === 'jis';
  if (!squeezes || sq < 0) return col.map((ch, i) => ({ char: ch, aStart: i, size: 1 }));
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
const block = ({ O, char, d, sy = GEO.S, half, orient }) => {
  const { S, H, r, sw, emCentre } = GEO;
  const fs = S;                                       // 字面 ＝ 字身（§ GEO）
  const cc = add(add(O, e1, S / 2), e2, sy / 2);      // top-face centre
  const faces = faces3(O, S, sy);

  // The printing face, engraved MIRRORED on the top plane (e1 × e2). Reading
  // runs along e2 either way — the forme is the same 4×10 grid of square em
  // bodies whichever direction it's read in — so all that turns is the glyph:
  //   直排  glyph-x → −e1,  glyph-y → e2   (text descends the column)
  //   橫排  glyph-x →  e2,  glyph-y → e1   (text advances along the line,
  //                                          `down` points at the next line)
  // Both determinants are −2·COS·SIN < 0, i.e. still cut in reverse.
  const m = orient === 'h'
    ? `matrix(${-COS} ${SIN} ${COS} ${SIN} ${cc[0].toFixed(2)} ${cc[1].toFixed(2)})`
    : `matrix(${-COS} ${-SIN} ${-COS} ${SIN} ${cc[0].toFixed(2)} ${cc[1].toFixed(2)})`;
  // 直排 punctuation needs the font's vertical forms (`vert`/`vrt2`), which
  // `writing-mode` is what asks for. 橫排 wants the default horizontal cut —
  // that IS the difference between the two faces of one piece of type.
  const vertical = orient !== 'h' && PUNCT.has(char);
  // …and the two lay the em out on different axes, so they need different
  // centring. Vertical text already centres the em on the anchor (the glyph's
  // vertical origin against a 1em vertical advance), both axes, so x=y=0 is
  // right. Horizontal text only centres the INLINE axis (`text-anchor`); the
  // cross axis is wherever the baseline is put, hence the explicit `y`.
  // MEASURED, not assumed — both branches, five to seven glyphs each, ink read
  // off a rasterised probe and referred back to each glyph's own
  // actualBoundingBox: vertical seats the baseline 0.383–0.391em below the
  // anchor (the tight cluster is 0.3835; 田 and 一 read high because a heavy
  // 明體 horizontal's antialiased edge biases an ink bbox), i.e. `emCentre`.
  // The x offset came out IDENTICAL in the two branches for every glyph, so
  // upright Han needs no cross-axis compensation — the 5.25-unit hhea offset
  // from docs/notes/2026-07-21-svg-glyph-baseline-alignment.md is a class-R
  // (browser-ROTATED) effect and does not reach class U.
  const glyphY = vertical ? 0 : emCentre * fs;
  const glyphLayout = vertical ? 'writing-mode:vertical-rl; text-orientation:upright' : '';
  const glyph = (fill, stroke, gsw, dy) => `
    <g transform="translate(0 ${-dy})"><g transform="${m}">
      <text class="g" x="0" y="${glyphY.toFixed(2)}" font-size="${fs}" text-anchor="middle" style="${glyphLayout}"
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

  return `<g class="Slug has-glyph" style="--d:${d.toFixed(2)}s"><g class="SlugLift">${faces}${relief}${label}</g></g>`;
};

// ── build the whole forme → { viewBox, markup, lastDelay } ──
/** per-piece entrance stagger, in seconds — a compositor sets one slug at a
 *  time, so reading order becomes the drop order (the `--d` custom prop). */
const STAGGER = 0.07;

/** The air around the forme, in the viewBox's own units — no longer part of the
 *  viewBox (which hugs the ink), but published as a fraction of the forme's
 *  width so CSS can lay it out as the <figure>'s `padding` (lead-forme.css
 *  § air). It stays a forme-relative number rather than a flat rem for the same
 *  reason every other published length is: the forme scales with the plate, and
 *  a fixed gutter would be generous at 900px and mean at 1600px. */
const AIR = 34;

const buildForme = (punct, orient) => {
  const { S, H, r, leadEm } = GEO;
  const cell = S;                    // 字身相接 — 沒有間距（§ GEO）
  const rows = COLS[0].length;
  const colStep = S * (1 + leadEm);          // 行距 — leading pitch between columns
  // Generation order IS the paint order — COLUMN-MAJOR: a column top-to-bottom,
  // then its 行距鉛條, then the next column. That's a valid painter's sort here
  // (view ray = e1+e2+up, so a strip is always in FRONT of the column it
  // follows and BEHIND the next one, which the block order gives; and columns
  // never overlap each other directly — 行距 colStep 153 > body H 140, every
  // cross-column overlap goes through the strip). The generic diagonal a+b sort
  // only fits unit boxes — under it a rows-spanning strip has NO valid slot.
  // `line` groups a piece with the others re-set together when that line's
  // spacing changes (§ reset). The 行距鉛條 is furniture BETWEEN lines, not
  // part of one, so it gets a group of its own and stays put while the line it
  // separates is re-laid.
  const cells = [];
  let read = 0;
  COLS.forEach((col, b) => {
    const bx = b * colStep;
    lineLayout(col, punct, orient).forEach((it) => {
      const O = add(add([0, 0], e2, it.aStart * cell), e1, bx);
      if (it.space)                           // justify 小鉛塊 — solid furniture
        cells.push({ kind: 'space', line: b, O, sx: S, sy: it.size * cell, d: read++ * STAGGER, solid: true });
      else if (!it.char.trim())               // 空鉛 段首/收尾 — half-opacity quad
        cells.push({ kind: 'space', line: b, O, sx: S, sy: S, d: read++ * STAGGER, solid: false });
      else
        cells.push({ kind: 'char', line: b, O, char: it.char, sy: it.size * S, d: read++ * STAGGER, half: it.size < 1 });
    });
    if (b < COLS.length - 1)                   // 行距鉛條 — ONE whole box (the
      // column-major order above makes a rows-spanning piece sort cleanly),
      // half-opacity like the 空鉛 quads: a single group composites plain
      // `opacity` with no seams, and the furniture behind ghosts through.
      cells.push({ kind: 'space', line: `lead${b}`, O: add([0, 0], e1, bx + S), sx: colStep - S, sy: rows * cell, d: read++ * STAGGER, solid: false });
  });

  // auto-fit the viewBox over every piece's footprint (rises by r, drops by H)
  const xs = [];
  const ys = [];
  // the inline-end vertex's FOOT — the lowest ink at the box's right edge.
  // Everything below it along that edge is air (the bottom edge recedes
  // inline-start-ward at the projection's slope), which is where the caption
  // colophon hangs (lead-forme.css § pocket).
  let footX = -Infinity;
  let footY = -Infinity;
  // the highest DRAWN point. Not `min(ys)`: the fit reserves the relief's rise
  // `r` above every piece, but only type carries relief — a 空鉛 quad's top face
  // IS its top. The origin piece happens to be the 段首 quad, so the box's own
  // top edge sits a whole `r` above anything ever drawn there — which is the
  // ONE side the box does not hug (§ gapTop below).
  let inkTop = Infinity;
  for (const c of cells) {
    const sx = c.sx ?? S;
    const c1 = add(c.O, e1, sx);
    const c3 = add(c.O, e2, c.sy);
    const c2 = add(c1, e2, c.sy);
    for (const p of [c.O, c1, c2, c3]) {
      xs.push(p[0]);
      ys.push(p[1] - r, p[1] + H);
      inkTop = Math.min(inkTop, p[1] - (c.kind === 'char' ? r : 0));
      if (p[0] > footX + 1e-6) {
        footX = p[0];
        footY = p[1] + H;
      } else if (p[0] > footX - 1e-6) {
        footY = Math.max(footY, p[1] + H);
      }
    }
  }
  // The box HUGS the forme: no fit pad. It used to carry one (34 units a side),
  // which made the SVG's own box bigger than the 活字版 on every side — a band
  // of dead space no CSS could reclaim, because a viewBox pad is inside the
  // graphic. The air is CSS `padding` on the <figure> now (lead-forme.css
  // § air), where it can be laid out against, so the SVG IS the forme.
  // Strokes at an extreme vertex are not shaved for it: the <svg> is
  // `overflow: visible`, so the ~1 unit a round join throws past a corner
  // still paints, and the padding keeps it clear of anything around it.
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;

  const markup = cells
    .map((c) => (c.kind === 'char'
      ? block({ O: c.O, char: c.char, sy: c.sy, d: c.d, half: c.half, orient })
      : spacer(c.O, c.sx, c.sy, c.d, c.solid)))
    .join('');
  return {
    viewBox: `${minX.toFixed(1)} ${minY.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`,
    markup,
    // The forme's TOP VERTEX, as fractions of the rendered width — CSS needs
    // these to size the empty wedge at the block-start／inline-start corner
    // (lead-forme.css § showpiece · the lift). `apex` is where the origin slug
    // sits across the box; `pad` is the band of air above it. Both are
    // published rather than hard-coded because they move with the layout:
    // 直排 and 橫排 lay the same sentence into different column counts, so the
    // wedge is a different shape in each.
    apex: (0 - minX) / w,
    pad: (0 - minY) / w,
    // …and the OTHER pocket's two: where the inline-end vertex's foot sits
    // down the box (the caption may start below it), and the box's own
    // height — both over width, because one length is all CSS has to scale by.
    foot: (footY - minY) / w,
    ratio: h / w,
    /* The air, as a fraction of the forme's own width — the length CSS turns
       into the <figure>'s `padding` (lead-forme.css § air). It used to be a fit
       pad inside the viewBox and CSS could not see a pixel of it, so every
       placement against it was a tuned guess; now it is the one number both
       sides share. */
    bleed: AIR / w,
    /* The one side the box does NOT hug, and why: the fit reserves the relief's
       rise `r` above every piece, but only type carries relief — a 空鉛 quad's
       top face IS its top, and the origin piece happens to be the 段首 quad. So
       the box's top edge sits `r` above the highest thing ever drawn there.
       Left, right and bottom are flush with the ink by construction (the
       extremes ARE the box), which is why there are no gapLeft/Right/Bottom
       here any more — they were three provable zeroes.

       PHYSICAL name on purpose: the isometric projection does not turn with
       `writing-mode`, so `top` is what this is. Note it differs from `pad`
       above: this one is measured to the highest INK, `pad` to the origin's
       y=0 line, which sits `r` lower. */
    gapTop: (inkTop - minY) / w,
    // when the LAST slug starts its drop. The caption's cue is derived from
    // this in CSS (+ the drop's own duration), so the entrance stays ONE
    // ceremony however many pieces the sentence lays out to.
    lastDelay: (read - 1) * STAGGER,
    // the pieces themselves, in generation = paint = DOM order, so a swap can
    // diff two builds and re-set only what actually changed (§ reset).
    cells,
  };
};

// ── § reset — which pieces a punctuation swap has to lift ─────────────
/* Changing convention does NOT change a single character: what moves is
   `lineLayout`'s squeeze decision (直排 squeezes under JIS only), and the
   Diantenjeom face the punctuation slugs are drawn in. So there are exactly
   two kinds of line:
     · its spacing moved  → the whole line is re-set, because every piece after
       the squeeze sits somewhere new and a line half re-set reads as a mistake;
     · its spacing stands → only its punctuation is lifted, since only those
       slugs are re-cut. Everything else is the same lead in the same place.
   Compared by geometry rather than by markup: the markup of an unchanged
   punctuation slug is identical across conventions (the face swap is CSS), so
   a diff of the SVG strings would report "nothing changed" for the very
   pieces that must move.
   Indices, not selectors — generation order is DOM order, and this keeps the
   pieces free of classes that exist only to be animated. */
const geometry = (c) =>
  `${c.O[0].toFixed(3)}/${c.O[1].toFixed(3)}/${(c.sx ?? 0).toFixed(3)}/${c.sy.toFixed(3)}`;

const byLine = (cells) =>
  cells.reduce((m, c, i) => m.set(c.line, [...(m.get(c.line) ?? []), i]), new Map());

export const reset = (before, after) => {
  const was = byLine(before);
  const out = [];
  const back = [];
  for (const [line, now] of byLine(after)) {
    const then = was.get(line) ?? [];
    const stands =
      then.length === now.length &&
      then.every((i, k) => geometry(before[i]) === geometry(after[now[k]]));
    if (!stands) {
      out.push(...then);
      back.push(...now);
    } else {
      // geometry matches piece for piece, so the two indices pair up
      now.forEach((i, k) => {
        if (!PUNCT.has(after[i].char)) return;
        out.push(then[k]);
        back.push(i);
      });
    }
  }
  return { out, back };
};

// ── imperative shell ──────────────────────────────────────────────
/* A slug's SETTLED opacity, read off the piece itself: 空鉛 quads and 行距鉛條
   sit back at half (lead-forme.css § entrance), type and 小鉛塊 are solid. The
   keyframes below have to honour it, and can't say so in CSS terms — the Web
   Animations API takes computed values, not `var(--slug-o)` — so it's read
   here and substituted. Hard-coding 1 (as these did) meant a spacing block
   fell at FULL opacity and only dropped back to half when the animation was
   cancelled and CSS took over: a snap, one frame after it landed. */
const settledOpacity = ($el) =>
  Number.parseFloat(getComputedStyle($el).getPropertyValue('--slug-o')) || 1;

const eject = ($el) => [
  { transform: 'translateY(0)', opacity: settledOpacity($el) },
  { transform: 'translateY(-150px)', opacity: 0 },
];
/* the 0.55 stop mirrors the CSS `lf-drop` keyframe exactly: a piece reaches its
   own opacity BEFORE it lands, so it is already reading as 空鉛 on the way
   down, and the landing frame changes nothing. */
const drop = ($el) => [
  { transform: 'translateY(-150px)', opacity: 0, offset: 0 },
  { opacity: settledOpacity($el), offset: 0.55 },
  { transform: 'translateY(0)', opacity: settledOpacity($el), offset: 1 },
];

/** the measured numbers CSS reads back, as [custom property, build key]. */
const GEOMETRY = [
  ['--lf-apex', 'apex'],
  ['--lf-pad', 'pad'],
  ['--lf-foot', 'foot'],
  ['--lf-ratio', 'ratio'],
  ['--lf-bleed', 'bleed'],
  ['--lf-gap-top', 'gapTop'],
];

export const initLeadForme = ($root = document) => {
  const $forme = $root.querySelector('.LeadForme');
  if (!$forme) return;
  const $svg = $forme.querySelector('svg');
  // the build currently on screen — § reset diffs the next one against it.
  let built;
  const render = () => {
    built = buildForme($forme.dataset.punct || 'jis', $forme.dataset.orient || 'v');
    const { viewBox, markup, lastDelay } = built;
    $svg.setAttribute('viewBox', viewBox);
    $svg.innerHTML = markup;
    // hand the drop's tail to CSS — it adds --lf-drop-dur for the caption's cue
    $forme.style.setProperty('--lf-last-slug', `${lastDelay.toFixed(2)}s`);
    // …and the measured geometry (see buildForme's return): the two pockets,
    // and the air the fitted box leaves on each of the four sides.
    for (const [prop, key] of GEOMETRY)
      $forme.style.setProperty(prop, built[key].toFixed(4));
  };
  render();

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let busy = false;
  const $slugs = () => [...$svg.querySelectorAll('.Slug')];

  /* Lift these pieces, swap while they are out of frame, set them back — one
     motion, no stagger. `pick` runs twice, before and after the swap, because
     a swap that re-lays the forme replaces every node: the pieces that came
     out are not the ones that go back, and for a partial reset they are not
     even at the same indices. */
  const reslot = async (pick, swap) => {
    if (reduced || busy) return swap();
    busy = true;
    const out = pick('out').map(($el) =>
      $el.animate(eject($el), { duration: 240, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }));
    await Promise.all(out.map((a) => a.finished));
    swap();
    const back = pick('back').map(($el) =>
      $el.animate(drop($el), { duration: 720, easing: 'cubic-bezier(.28,1.12,.44,1)', fill: 'forwards' }));
    await Promise.all(back.map((a) => a.finished));
    out.forEach((a) => a.cancel());
    back.forEach((a) => a.cancel());
    busy = false;
  };

  // Read the LIVE checked value rather than closing over the radio that fired.
  // A swap is async, so a second click mid-flight would otherwise let the older
  // handler apply its own stale value on completion — leaving the forme showing
  // one thing and the pills another.
  const picked = (name) => $forme.querySelector(`input[name="${name}"]:checked`)?.value;

  // face change is font-only → reslot the glyph slugs (no geometry change)
  $forme.querySelectorAll('input[name="lf-face"]').forEach((el) =>
    el.addEventListener('change', () => reslot(
      () => [...$svg.querySelectorAll('.has-glyph')],
      () => { $forme.dataset.face = picked('lf-face'); },
    )));
  // punct change is ONE motion like the face swap beside it — the two pills sit
  // shoulder to shoulder and should not answer in different tempos — but it
  // lifts only the pieces the new convention actually disturbs: a re-spaced
  // line whole, an undisturbed line's punctuation alone (§ reset). What comes
  // out is computed against the build on screen, before the swap; what goes
  // back, against the new one, after.
  // `.settled` is one-way: the staggered ENTRANCE plays once, and after any
  // swap the forme is a set forme being altered, not one being composed.
  $forme.querySelectorAll('input[name="lf-punct"]').forEach((el) =>
    el.addEventListener('change', () => {
      const moved = reset(
        built.cells,
        buildForme(picked('lf-punct'), $forme.dataset.orient || 'v').cells,
      );
      reslot(
        (half) => moved[half].map((i) => $slugs()[i]),
        () => {
          $forme.classList.add('settled');
          $forme.dataset.punct = picked('lf-punct');
          render();
        },
      );
    }));

  // Direction change re-engraves EVERY piece (the glyph turns a quarter) and,
  // under MOE／GB, re-lays line 1 as well. So the whole forme comes apart and is
  // set again — which is what changing direction actually means in a type shop.
  // The grid itself is unchanged, so nothing moves; only the faces do.
  $forme.querySelectorAll('input[name="lf-orient"]').forEach((el) =>
    el.addEventListener('change', async () => {
      $forme.classList.add('settled');
      if (reduced || busy) { $forme.dataset.orient = picked('lf-orient'); render(); return; }
      busy = true;
      // the whole forme lifts at once (as in the face/punct swaps), then is set
      // again ONE PIECE AT A TIME — the only swap that does. The asymmetry is
      // the point, and so is the exception: breaking a forme up is quick,
      // setting one is not, and turning the direction re-engraves every glyph
      // rather than re-slotting a few, so it earns the long ceremony.
      await Promise.all($slugs()
        .map(($el) => $el.animate(eject($el), {
          duration: 240, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards',
        }))
        .map((a) => a.finished));
      $forme.dataset.orient = picked('lf-orient');
      render();
      // re-set at the entrance's own pace, reading order = drop order
      await Promise.all($slugs()
        .map(($el, i) => $el.animate(drop($el), {
          duration: 720, delay: i * (STAGGER * 1000), easing: 'cubic-bezier(.28,1.12,.44,1)', fill: 'backwards',
        }))
        .map((a) => a.finished));
      busy = false;
    }));
};
