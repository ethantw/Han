# Homepage Redesign v2 — implementation contract

Source: Claude Design `Homepage Redesign v2.html` + direction doc (方向A
「字裡行間」＋C 過場帶) in the CD project. This file is the BINDING
contract for implementation agents — the mockup is an art board (inline
styles, px, fake rail, Google Fonts); we port its DESIGN LANGUAGE into
the existing token/em architecture. Rail/web-component/codegen logic is
untouched. All work obeys `hanzi.pro/web-style.md`, `copy-style.md`,
repo skills (css-naming, ts-style). NO letter-spacing on content. All
49 e2e must stay green.

## Owner rulings (override the mockup)

1. Station H2s stay OURS: 名正言順的元素樣式／百年傳承的字體，拂偏歸正
   的標點／行的呼吸／疏密有致的段落調配／遊樂場／生成引用碼.
2. Fake demos become REAL: the MOE/GB three-column and the hanging-punct
   comparison render with actual `--han-*` vars; the zero-width-span
   "gap wash" is REJECTED (dishonest); marginalia lists REAL var names.
3. NO looping animations (mockup's breathe/floaty/caret/hangout violate
   the direction doc's own 無循環動效). One-shot entrance + hover only,
   all inside `@media (prefers-reduced-motion: no-preference)`.
4. CD didn't know station 肆・段落 exists — extend the station-plate
   system to it. Watermark chars: 語／字／行／段／格／碼.
5. Mockup junk to ignore: "Your text here" artifact, caret, Noto Sans KR
   font tags, fake rail markup, fixed 1680px page.

## Copy (hant finals — hans translate, en write freely, ja/ko mirror hant)

- mfVLede (NEW, hero vertical lede): 排版是文明的底稿——鉛字時代的講究，不該亡於像素。
- mfLede (REPLACE): 以CSS變數為骨、少量JavaScript為筋——標點懸掛、著重號、注音、跨文種混排，皆有定法。中西之間不假空格字元，間隙一律0.125em：鉛字時代的規矩，一條不少。
- ssLede (NEW): 標籤名正，則樣式言順——圈點自來。
- ssSpecimen (NEW, display specimen; REAL elements): 文字之<em>道在細節</em>，讀<cite>考工記</cite>可知——<u>王羲之</u>寫過的每一筆，瀏覽器都該記得。
  (specimen block sets `--han-cite-title-marks: bracket` inline on itself
  so the《》actually show — mirrors ssP2's explanation.)
- stLede (NEW): 一字三面——黑、明、楷，各司其職。
- stTrayNote (NEW): 鉛字反著刻，紙上才是正的——CSS變數是這個時代的活字盤，撥一格，全頁重排。
- stCompare* (NEW): sample 字距，行氣。 columns MOE／GB／off,
  mono labels MOE・教育部／GB・國標／關・原字體.
- slLede (NEW): 好的段落是一塊方正的墨——標點懸出行外，字字落在格上。
- slHang* (NEW): labels 懸掛・關 ／ 懸掛・開（han.css）; samples
  「世界，你好！」句子走到行末，標點擠而不入，版面凹凸。 ／
  「世界，你好！」句子走到行末，標點懸出格外，段落見方。
- pgStationLede (REPLACE): ——貼上Markdown或無傷大雅的HTML，這一頁的講究，即刻用在你的字上。
- snBridge (NEW, transition band before 引用碼): 配置即代碼
  (band also carries the snEyebrow vertically).
- Marginalia notes (NEW): ssNote 旁註記的是對應的變數名——寬螢幕才出現。/
  stNote 撥左欄「傳承字形」，三面互換。/ slNote 間隙由CSS生成，文中沒有一個空格字元。/
  prNote 作用範圍預設article，可在面板指定。
- Everything else keeps current tokens (snLede, prP*, ss/st/sl P*, closing).
- Trim stPunctP's opening 「標點斷連亦有地域公約——」 stays; body copy
  otherwise untouched.

## Structure & CSS contracts

### Tokens (home.css :root, two-tier discipline)
- `--palette-station-a` / `--palette-station-b`: alternating section
  grounds — light `#fafaf7`/`#f3f3f0` (existing paper primitives),
  dark = existing ink layers, via light-dark(). Components consume only
  these.
- `--palette-wm`: watermark ink — light-dark(4% ink, 6% paper) via
  color-mix on existing primitives.
- Hairlines/accent reuse existing tokens. NO new hues.

### Station plate system (all six stations)
- Each `.Station` gets: `data-wm="語|字|行|段|格|碼"` rendered by
  `&::before` (content: attr(data-wm)) — display-serif, ~clamp(12rem,
  28vw, 22rem), absolute inset-block-start/-inline-end, --palette-wm,
  pointer-events none, aria-hidden by nature of pseudo.
- Kicker: existing hgroup eyebrow gains a trailing hairline (flex +
  ::after line). Eyebrow keeps 壹・語意 numbering.
- Alternating grounds: odd/even stations a/b; 陸・引用碼 section is
  CONSTANT dark (--palette-ink ground, paper text, fixed faint hairline
  per web-style dark-surface gotcha) in BOTH themes.
- Station paddings 1×/1.5× alternating rhythm (block padding tokens).

### Hero (manifesto)
- Outline glyph 漢 behind (pseudo or aria-hidden span, -webkit-text-stroke
  + transparent fill, very low alpha, NO animation loop).
- Vertical lede column at inline-end: writing-mode vertical-rl, serif,
  mfVLede, hidden <68rem.
- DemoLangSwitch moves to hero top as the chips row (SAME control markup,
  functional; do not duplicate).
- 字階尺 scale-run: eight 漢 at OUR ramp tokens (--fs-display …
  --fs-micro) with mono micro labels naming the ACTUAL token names;
  one-shot stagger rise on load; static under reduced-motion.
- Stats: hairline-framed 3-col, numbers at --fs-heading serif.
- InstallChip unchanged.

### Station interiors
- 壹: display specimen block (ssSpecimen) between hgroup and prose;
  `.cols` grid [minmax(0,1fr) | 14rem marginalia] gap ~4rem, ≥68rem
  only (below: marginalia `display:none` — it repeats var names, no
  content loss). Marginalia: `<aside>` with mono var names
  (--han-em-symbol, --han-cite-title-marks, --han-em-dot-position) +
  note. Real semantic elements in specimen.
- 貳: type-tray figure (mirrored typeblocks 漢字標準格式, one accent,
  scaleX(-1), gradient metal look, hover lift only) + stTrayNote beside;
  three-col comparison: same sample per column, column 1 inline
  `--han-punctuation-hant: MOE` … wait MOE is default — column styles:
  MOE (default), `--han-punctuation-hant: GB`, `--han-punctuation-hant: off`;
  text wrapped lang="zh-Hant". Marginalia vars:
  --han-use-heritage-glyphs-for-hant, --han-punctuation-hant.
- 參: hanging comparison two columns: left sets
  `--han-punctuation-refinement: compress` (hang off, squeeze kept),
  right inherits page config + mint ground (--palette-accent-bg
  existing); mono labels. NO fake hang animation. Marginalia vars:
  --han-punctuation-refinement, --han-text-autospace.
- 肆・段落: plate treatment only + marginalia (--han-prose,
  --han-prose-indent + prNote). Content unchanged.
- 伍・試玩: editor chrome dark strip (ViewTabs restyle on ink ground),
  editor block may bleed one gutter wider than measure (max-width
  bump), lede replaced.
- 陸・引用碼: full dark station + preceding transition band (mint ground,
  snBridge display text + vertical snEyebrow). CodePanes unchanged.
- Closing: centered mirror — watermark 漢 behind, install chip centered,
  links row. Copy unchanged.

### Motion
- One-shot entrance: hero children stagger (animation … both + delays);
  stations reveal watermark/kicker line on first intersection via tiny
  `home/reveal.js` (IO, adds data-revealed once, disconnects; guards:
  no IO / reduced-motion → set immediately). CSS keys off
  `[data-revealed]`. inkline scaleX for kicker hairline. 250–700ms,
  ease-out family. Everything inside no-preference media; static end
  state otherwise. NO infinite loops. transform-origin logical note.
- typeblock hover lift = interaction, allowed.

### JS
- `home/reveal.js` exporting `initReveal` — FP style, wired in home.js
  boot. No other JS.

### e2e
- Existing 49 stay green (demo-lang chips move — home.spec selectors key
  on control names, verify). Add: station watermark attr present ×6;
  marginalia hidden at 52rem/visible at ≥68rem (one viewport test);
  snippet station dark ground token applied; reveal respects
  reduced-motion (emulateMedia) — smoke level, not pixel tests.

## Out of scope
Rail internals, codegen, docs site, /old.html, mint gap-wash (rejected),
CD's h2 copy, looping animations.
The `.WritingSwitch` 橫排/直排 pill keeps its CURRENT styling exactly
(owner call 2026-07-14) — do not restyle it to the mockup's version,
do not bump its contrast, do not move it.
