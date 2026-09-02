

const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;
const e1 = [COS, SIN];
const e2 = [-COS, SIN];
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
const pts = (...ps) => ps.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');

const INK = 'var(--forme-ink)';
const FACE = ['var(--forme-face-1)', 'var(--forme-face-2)', 'var(--forme-face-3)'];
const WALL = 'var(--forme-wall)';
const RELIEF = 'var(--forme-relief)';
const HI = 'var(--forme-hi)';

const PUNCT = new Set(['，', '、', '。', '：', '；', '？', '！', '「', '」', '『', '』', '（', '）', '—', '…', '·', '．']);
const SLICE = {
  石: 115, 田: 114, 臉: 115, 色: 118, 鐵: 115, 青: 116,
  我: 119, 特: 118, 地: 119, 放: 117, 棄: 113, 瞬: 109, 移: 114, 艙: 105,
  改: 117, 搭: 115, 超: 118, 迴: 112, 路: 118, 就: 118, 是: 119,
  因: 118, 為: 119, 快: 118, 十: 117, 二: 118, 秒: 113,
  脸: 42, 铁: 27, 弃: 71, 舱: 42, 为: 106, 回: 118,
  叱: 80, 変: 76, 速: 117, 怒: 111,
  い: 111, え: 111, か: 111, ざ: 111, た: 111, だ: 111,
  っ: 111, に: 111, の: 111, は: 111, ら: 111, わ: 111,
  가: 19, 건: 19, 고: 19, 다: 18, 라: 17, 루: 17, 리: 17,
  버: 16, 빨: 16, 서: 15, 였: 15, 이: 101, 탄: 13, 퍼: 13,
  프: 13, 하: 12, 했: 12,
};

const COLS = [
  ['', '石', '田', '臉', '色', '鐵', '青', '：', '「', '我'],
  ['特', '地', '放', '棄', '瞬', '移', '艙', '改', '搭', '超'],
  ['迴', '路', '，', '就', '是', '因', '為', '快', '十', '二'],
  ['秒', '！', '」', '', '', '', '', '', '', ''],
];
const COLS_HANS = [
  ['', '石', '田', '脸', '色', '铁', '青', '：', '「', '我'],
  ['特', '地', '放', '弃', '瞬', '移', '舱', '改', '搭', '超'],
  ['回', '路', '，', '就', '是', '因', '为', '快', '十', '二'],
  ['秒', '！', '」', '', '', '', '', '', '', ''],
];
const COLS_JA = [
  ['', '石', '田', 'は', '叱', 'っ', 'た', '。', '「', 'わ'],
  ['ざ', 'わ', 'ざ', '超', '回', '路', 'に', '変', 'え', 'た'],
  ['の', 'は', '，', '十', '二', '秒', '速', 'い', 'か', 'ら'],
  ['だ', '！', '」', '', '', '', '', '', '', ''],
];
const COLS_KO = [
  ['', '石', '田', '가', '怒', '했', '다', '。', '「', '瞬'],
  ['移', '艙', '버', '리', '고', '　', '하', '이', '퍼', '루'],
  ['프', '탄', '건', '，', '十', '二', '秒', '빨', '라', '서'],
  ['였', '다', '！', '」', '', '', '', '', '', ''],
];


/** Maps each specimen language to its forme, default punctuation and SVG language. */
export const FORME_LANGS = {
  hant: { cols: COLS, punct: 'moe', tag: 'zh-Hant' },
  hans: { cols: COLS_HANS, punct: 'gb', tag: 'zh-Hans' },
  ja: { cols: COLS_JA, punct: 'jis', tag: 'ja' },
  ko: { cols: COLS_KO, punct: 'klr', tag: 'ko-Kore' },
};

/* The homepage owns the physical 4×10 case, while taisol owns its words.
 * Column one reserves its first quad for paragraph indentation; the final
 * column is padded with blank quads. This reproduces the original hand-cut
 * arrays exactly while allowing their copy to come from `home_excerpt`. */
const columnsFromText = (source) => {
  const glyphs = [...source];
  const pad = (items) => [...items, ...Array(Math.max(0, 10 - items.length)).fill('')];
  return [
    pad(['', ...glyphs.slice(0, 9)]),
    pad(glyphs.slice(9, 19)),
    pad(glyphs.slice(19, 29)),
    pad(glyphs.slice(29, 39)),
  ];
};

const normalizePunct = (value) => typeof value === 'string' ? value.toLowerCase() : null;
const consolePunctValue = (value) => value === 'off' ? value : value?.toUpperCase();

const GEO = { S: 90, H: 140, r: 11, sw: 2, leadEm: 0.7, emCentre: 0.38 };

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

const spacer = (O, sx, sy, d, solid) =>
  `<g class="Slug${solid ? ' solid' : ''}"${d != null ? ` style="--d:${d.toFixed(2)}s"` : ''}><g class="SlugLift">${faces3(O, sx, sy)}</g></g>`;


const SQUEEZE = {
  '：「': { v: new Set(['jis']), h: new Set(['jis', 'moe', 'gb', 'klr']) },
  '。「': { v: new Set(['jis', 'gb', 'klr']), h: new Set(['jis', 'gb', 'klr']) },
};

const lineLayout = (col, punct, orient) => {
  const n = col.length;
  let sq = -1;
  let rule;
  for (let i = 0; i < n - 1; i++) {
    const r = SQUEEZE[col[i] + col[i + 1]];
    if (r) { sq = i; rule = r; }
  }
  const squeezes = rule?.[orient === 'h' ? 'h' : 'v'].has(punct) ?? false;
  if (!squeezes || sq < 0) return col.map((ch, i) => ({ char: ch, aStart: i, size: 1 }));
  const half = 0.5;
  const isGap = (ch, i) => i < n - 1 && i !== sq && ch.trim() !== '';
  const e = (1 - half) / col.filter(isGap).length;
  const items = [];
  let a = 0;
  for (let i = 0; i < n; i++) {
    const isHalf = i === sq + 1;
    items.push({ char: col[i], aStart: a, size: isHalf ? half : 1 });
    a += isHalf ? half : 1;
    if (isGap(col[i], i)) { items.push({ space: true, aStart: a, size: e }); a += e; }
  }
  return items;
};


const TURN = 'turn';
const VERT_FORM = {
  common: {
    '「': TURN, '」': TURN, '『': TURN, '』': TURN,
    '〈': TURN, '〉': TURN, '《': TURN, '》': TURN,
    '〔': TURN, '〕': TURN, '【': TURN, '】': TURN,
    '（': TURN, '）': TURN,
    '．': [662, 662],
  },
  jis: { '，': [656, 668], '、': [635, 657], '。': [591, 606], '：': TURN },
  moe: {},
  gb: {
    '，': [656, 668], '、': [635, 657], '。': [591, 606],
    '：': [532, 223], '；': [532, 224], '！': [498, 29], '？': [500, 45],
  },
  klr: { '，': [656, 668], '、': [635, 657], '。': [591, 606] },
};
const vertForm = (char, punct) => VERT_FORM[punct]?.[char] ?? VERT_FORM.common[char];

const block = ({ O, char, d, sy = GEO.S, half, orient, spin, punct, slice = SLICE }) => {
  const { S, H, r, sw, emCentre } = GEO;
  const fs = S;
  const cc = add(add(O, e1, S / 2), e2, sy / 2);
  const faces = faces3(O, S, sy);

  const m = orient === 'h'
    ? `matrix(${-COS} ${SIN} ${COS} ${SIN} ${cc[0].toFixed(2)} ${cc[1].toFixed(2)})`
    : `matrix(${-COS} ${-SIN} ${-COS} ${SIN} ${cc[0].toFixed(2)} ${cc[1].toFixed(2)})`;
  const vertical = orient !== 'h' && PUNCT.has(char);
  const spun = vertical && spin;
  const form = spun ? vertForm(char, punct) : undefined;
  const engineVertical = vertical && !spun;
  const glyphX = form === TURN ? ((sy / S) - 1) / 2 * fs : 0;
  const glyphY = engineVertical ? 0 : emCentre * fs;
  const glyphLayout = engineVertical ? 'writing-mode:vertical-rl; text-orientation:upright' : '';
  const unit = fs / 1000;
  const turn = form === TURN
    ? ' rotate(90)'
    : Array.isArray(form)
      ? ` translate(${(form[0] * unit).toFixed(2)} ${(-form[1] * unit).toFixed(2)})`
      : '';
  const glyph = (fill, stroke, gsw, dy) => `
    <g transform="translate(0 ${-dy})"><g transform="${m}${turn}">
      <text class="g${engineVertical ? ' vert' : ''}" x="${glyphX.toFixed(2)}" y="${glyphY.toFixed(2)}" font-size="${fs}" text-anchor="middle" style="${glyphLayout}"
            fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="${gsw}"` : ''}
            stroke-linejoin="round" paint-order="stroke">${char}</text>
    </g></g>`;
  let relief = glyph(WALL, INK, sw * 0.7, 0);
  for (let k = 1; k < r; k++) relief += glyph(WALL, '', 0, k);
  relief += glyph(RELIEF, INK, sw, r - 1);
  relief += glyph('none', HI, sw * 0.9, r);

  const c1 = add(O, e1, S);
  const c2 = add(c1, e2, sy);
  const c3 = add(O, e2, sy);
  const spec = PUNCT.has(char)
    ? `<text class="lbl-var dtj dtj-serif" x="0" y="0" font-size="16" text-anchor="middle">Serif</text>
       <text class="lbl-var dtj dtj-sans" x="0" y="0" font-size="16" text-anchor="middle">Sans</text>
       <text class="lbl-sub" x="0" y="13" font-size="8" text-anchor="middle">Diantenjeom</text>`
    : `<text class="lbl-num" x="0" y="0" font-size="20" text-anchor="middle">${slice[char]}</text>
       <text class="nm nm-m" x="0" y="14" font-size="8" text-anchor="middle">尚古明體</text>
       <text class="nm nm-h" x="0" y="14" font-size="8" text-anchor="middle">尚古黑體</text>
       <text class="nm nm-k" x="0" y="14" font-size="8" text-anchor="middle">霞鶩文楷</text>`;
  const faceLabel = (anchor, tx) =>
    `<g transform="matrix(${tx[0].toFixed(4)} ${tx[1].toFixed(4)} 0 1 ${anchor[0].toFixed(2)} ${(anchor[1] + H * 0.3).toFixed(2)})">${spec}</g>`;
  const label = (half ? '' : faceLabel(mid(c1, c2), [COS, -SIN])) + faceLabel(mid(c3, c2), [COS, SIN]);

  return `<g class="Slug has-glyph" style="--d:${d.toFixed(2)}s"><g class="SlugLift">${faces}${relief}${label}</g></g>`;
};


const STAGGER = 0.07;


const AIR = 34;

/** Builds fitted isometric SVG markup and publishes its responsive geometry. */
export const buildForme = (punct, orient, spin, data = {}) => {
  const { S, H, r, leadEm } = GEO;
  const cols = data.cols ?? COLS;
  const slice = data.slice ?? SLICE;
  const cell = S;
  const rows = cols[0].length;
  const colStep = S * (1 + leadEm);
  const cells = [];
  let read = 0;
  cols.forEach((col, b) => {
    const bx = b * colStep;
    lineLayout(col, punct, orient).forEach((it) => {
      const O = add(add([0, 0], e2, it.aStart * cell), e1, bx);
      if (it.space)
        cells.push({ kind: 'space', line: b, O, sx: S, sy: it.size * cell, d: read++ * STAGGER, solid: true });
      else if (!it.char.trim())
        cells.push({ kind: 'space', line: b, O, sx: S, sy: S, d: read++ * STAGGER, solid: false });
      else
        cells.push({ kind: 'char', line: b, O, char: it.char, sy: it.size * S, d: read++ * STAGGER, half: it.size < 1 });
    });
    if (b < cols.length - 1)
      cells.push({ kind: 'space', line: `lead${b}`, O: add([0, 0], e1, bx + S), sx: colStep - S, sy: rows * cell, d: read++ * STAGGER, solid: false });
  });

  const xs = [];
  const ys = [];
  let footX = -Infinity;
  let footY = -Infinity;
  let heelX = Infinity;
  let heelY = -Infinity;
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
      if (p[0] < heelX - 1e-6) {
        heelX = p[0];
        heelY = p[1] + H;
      } else if (p[0] < heelX + 1e-6) {
        heelY = Math.max(heelY, p[1] + H);
      }
    }
  }
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;

  const firstColumnLast = cells.filter((c) => c.kind === 'char' && c.line === 0).at(-1);
  const firstColumnLastBottom = firstColumnLast
    ? Math.max(
        firstColumnLast.O[1],
        add(firstColumnLast.O, e1, S)[1],
        add(firstColumnLast.O, e2, firstColumnLast.sy)[1],
        add(add(firstColumnLast.O, e1, S), e2, firstColumnLast.sy)[1],
      ) + H
    : minY;

  const markup = cells
    .map((c) => (c.kind === 'char'
      ? block({ O: c.O, char: c.char, sy: c.sy, d: c.d, half: c.half, orient, spin, punct, slice })
      : spacer(c.O, c.sx, c.sy, c.d, c.solid)))
    .join('');
  return {
    viewBox: `${minX.toFixed(1)} ${minY.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`,
    markup,
    apex: (0 - minX) / w,
    pad: (0 - minY) / w,
    foot: (footY - minY) / w,

    heel: (heelY - minY) / w,
    columnAnchor: ((firstColumnLast?.O[0] ?? minX) - minX) / w,
    columnStart: (firstColumnLastBottom - minY) / w,
    ratio: h / w,

    bleed: AIR / w,

    gapTop: (inkTop - minY) / w,
    lastDelay: (read - 1) * STAGGER,
    cells,
  };
};


const geometry = (c) =>
  `${c.O[0].toFixed(3)}/${c.O[1].toFixed(3)}/${(c.sx ?? 0).toFixed(3)}/${c.sy.toFixed(3)}`;

const byLine = (cells) =>
  cells.reduce((m, c, i) => m.set(c.line, [...(m.get(c.line) ?? []), i]), new Map());

/** Finds the old and new slug indices affected by a punctuation reset. */
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
      now.forEach((i, k) => {
        if (!PUNCT.has(after[i].char)) return;
        out.push(then[k]);
        back.push(i);
      });
    }
  }
  return { out, back };
};


const settledOpacity = ($el) =>
  Number.parseFloat(getComputedStyle($el).getPropertyValue('--slug-o')) || 1;

const eject = ($el) => [
  { transform: 'translateY(0)', opacity: settledOpacity($el) },
  { transform: 'translateY(-150px)', opacity: 0 },
];

const drop = ($el) => [
  { transform: 'translateY(-150px)', opacity: 0, offset: 0 },
  { opacity: settledOpacity($el), offset: 0.55 },
  { transform: 'translateY(0)', opacity: settledOpacity($el), offset: 1 },
];


const surveyEngine = ($svg) => {
  const fs = 100;
  const $probe = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  $probe.setAttribute('style', `font-size:${fs}px;visibility:hidden`);
  $probe.innerHTML =
    `<text class="g" x="0" y="0" style="writing-mode:vertical-rl;text-orientation:upright">。</text>`
    + `<text class="g" x="0" y="0">。</text>`;
  $svg.append($probe);
  const [$vertical, $horizontal] = $probe.children;
  const box = $vertical.getExtentOfChar(0).height;
  const hhea = $horizontal.getExtentOfChar(0);
  const hheaBox = hhea.height;
  const hheaAscent = -hhea.y;
  $probe.remove();

  const onHheaPath = Math.abs(box - hheaBox) < 1;
  return {
    runsVert: !onHheaPath,
    shift: onHheaPath ? (hheaAscent - GEO.emCentre * fs - hheaBox / 2) / fs : 0,
  };
};


const GEOMETRY = [
  ['--lf-apex', 'apex'],
  ['--lf-pad', 'pad'],
  ['--lf-foot', 'foot'],
  ['--lf-heel', 'heel'],
  ['--lf-column-anchor', 'columnAnchor'],
  ['--lf-column-start', 'columnStart'],
  ['--lf-ratio', 'ratio'],
  ['--lf-bleed', 'bleed'],
  ['--lf-gap-top', 'gapTop'],
];


/** Initializes the lead-forme specimen and its language, face and punctuation controls. */
export const initLeadForme = ($root = document, config = {}) => {
  const $forme = $root.querySelector('.LeadForme');
  if (!$forme) return;
  const $console = document.querySelector('han-console');

  const slice = config.slice ? { ...SLICE, ...config.slice } : SLICE;
  const colsFor = (lang) => {
    const source = $forme.getAttribute(`data-copy-${lang}`);
    return source ? columnsFromText(source) : FORME_LANGS[lang]?.cols ?? COLS;
  };
  const data = () => ({
    cols: config.cols ?? colsFor($forme.dataset.lang),
    slice,
  });
  const syncExcerpt = (lang) => {
    const type = $forme.getAttribute(`data-forme-type-${lang}`);
    const verbatim = $forme.getAttribute(`data-forme-verbatim-${lang}`);
    if (type) $forme.dataset.excerptType = type;
    if (verbatim) $forme.dataset.verbatim = verbatim;
    const $jump = $forme.querySelector('[data-forme-paper-jump]');
    if ($jump && FORME_LANGS[lang]) {
      $jump.dataset.edition = lang;
      $jump.href = `/articles/hyperloop-12sec/${lang}.html`;
    }
  };

  const check = (name, value) => {
    $forme.querySelectorAll(`input[name="${name}"]`).forEach(($radio) => {
      $radio.checked = $radio.value === value;
    });
  };
  const punctFor = (lang, punct = $console?.config?.punct) =>
    normalizePunct(punct?.[lang]) ?? FORME_LANGS[lang]?.punct;
  check('lf-punct', $forme.dataset.punct);
  check('lf-lang', $forme.dataset.lang);
  syncExcerpt($forme.dataset.lang);
  const $svg = $forme.querySelector('svg');

  let spin = false;
  let built;
  const render = () => {
    built = buildForme($forme.dataset.punct || 'jis', $forme.dataset.orient || 'v', spin, data());
    const { viewBox, markup, lastDelay } = built;
    $svg.setAttribute('viewBox', viewBox);
    const tag = FORME_LANGS[$forme.dataset.lang]?.tag;
    if (tag) $svg.setAttribute('lang', tag);
    $svg.innerHTML = markup;
    $forme.style.setProperty('--lf-last-slug', `${lastDelay.toFixed(2)}s`);
    for (const [prop, key] of GEOMETRY)
      $forme.style.setProperty(prop, built[key].toFixed(4));
  };
  const resurvey = () => {
    const { runsVert, shift } = surveyEngine($svg);

    $forme.style.setProperty('--lf-vshift', shift.toFixed(4));

    if (runsVert === !spin) return;
    spin = !runsVert;
    render();
  };
  // Assume fallback fonts lack vertical forms until the live probe completes.
  spin = true;
  render();
  resurvey();
  document.fonts?.ready.then(resurvey);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let busy = false;
  const $slugs = () => [...$svg.querySelectorAll('.Slug')];
  const entranceInFlight = () => {
    if (reduced || $forme.hasAttribute('data-settled')) return false;
    if (!$forme.hasAttribute('data-revealed')) return true;
    return [$svg, ...$slugs()].some(($el) =>
      $el.getAnimations().some((animation) =>
        ['lf-drop', 'lf-forme-in'].includes(animation.animationName)
        && animation.playState !== 'finished'));
  };


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

  const picked = (name) => $forme.querySelector(`input[name="${name}"]:checked`)?.value;

  /* The console owns punctuation.  This form is only a second remote for the
     currently selected language; data-punct remains the geometry input for
     buildForme(), while the actual DTJ family comes from han.css's
     --han-font-punctuation-* token on each SVG text node. */
  const applyPunct = (punct) => {
    punct = normalizePunct(punct);
    if (!punct) return;
    check('lf-punct', punct);
    if (punct === $forme.dataset.punct) return;
    /* The console upgrades asynchronously after the font gate. A returning
       reader can therefore replay a saved punctuation choice while the
       forme's first stagger is already running. Treat that as initial data:
       rebuild every slug under the still-live entrance selector instead of
       marking the forme settled and cancelling the ceremony. On desktop the
       replacement slugs restart their stagger; on the narrow branch the SVG
       itself keeps flying as one object. Later user changes still take the
       selective reslot path below. */
    if (entranceInFlight()) {
      $forme.dataset.punct = punct;
      render();
      return;
    }
    const moved = reset(
      built.cells,
      buildForme(punct, $forme.dataset.orient || 'v', spin, data()).cells,
    );
    reslot(
      (half) => moved[half].map((i) => $slugs()[i]),
      () => {
        $forme.dataset.settled = '';
        $forme.dataset.punct = punct;
        render();
      },
    );
  };
  const pushPunct = (punct) => {
    const lang = $forme.dataset.lang;
    const $control = $console?.shadowRoot
      ?.querySelector(`[data-cfg-key="punct.${lang}"]`);
    const value = consolePunctValue(punct);
    if (!$control || !value || $control.value === value) return;
    $control.value = value;
    $control.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const pullPunct = (punct) => applyPunct(punctFor($forme.dataset.lang, punct));

  $forme.querySelectorAll('input[name="lf-face"]').forEach((el) =>
    el.addEventListener('change', () => reslot(
      () => [...$svg.querySelectorAll('.has-glyph')],
      () => { $forme.dataset.face = picked('lf-face'); },
    )));
  $forme.querySelectorAll('input[name="lf-punct"]').forEach((el) =>
    el.addEventListener('change', () => {
      const punct = picked('lf-punct');
      applyPunct(punct);
      pushPunct(punct);
    }));


  const recompose = async (mutate) => {
    $forme.dataset.settled = '';
    if (reduced || busy) { mutate(); render(); return; }
    busy = true;
    await Promise.all($slugs()
      .map(($el) => $el.animate(eject($el), {
        duration: 240, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards',
      }))
      .map((a) => a.finished));
    mutate();
    render();
    await Promise.all($slugs()
      .map(($el, i) => $el.animate(drop($el), {
        duration: 720, delay: i * (STAGGER * 1000), easing: 'cubic-bezier(.28,1.12,.44,1)', fill: 'backwards',
      }))
      .map((a) => a.finished));
    busy = false;
  };

  $forme.querySelectorAll('input[name="lf-orient"]').forEach((el) =>
    el.addEventListener('change', () => recompose(() => {
      $forme.dataset.orient = picked('lf-orient');
    })));

  $forme.querySelectorAll('input[name="lf-lang"]').forEach((el) =>
    el.addEventListener('change', () => recompose(() => {
      const lang = picked('lf-lang');
      $forme.dataset.lang = lang;
      syncExcerpt(lang);
      const punct = punctFor(lang);
      if (punct) {
        $forme.dataset.punct = punct;
        check('lf-punct', punct);
      }
      if (lang === 'ko' && picked('lf-face') === 'k') {
        $forme.dataset.face = 'm';
        check('lf-face', 'm');
      }
    })));

  document.addEventListener('han-config-change', (event) =>
    pullPunct(event.detail?.config?.punct));
  pullPunct($console?.config?.punct);
};
