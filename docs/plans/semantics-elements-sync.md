# 站①語意元素 × MarkDiagram 同拍 — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 站①（semantics）的 `.poem-like` 演示行與 MarkDiagram **共用同一組
節拍**——圖解動哪個記號，正文的同類元素就同時動；並補上四個新戲：`<u>`
專名號淡入、`<i>` 逐字 skew 歸正、甲式波浪線淡入、乙式《》展開淡入。

**Architecture:** 現況是兩套錯拍各排各的（圖解 `<g>` 的 inline
`--row-cue`；詩行 `nth-of-type` 的 200ms 階梯），大致對齊但無契約。改法：
把每個**記號**的拍點提升為 `#station-semantics` 上的 `--cue-*` tokens，
圖解與詩行都引用同一個 token——同步是「同一個變數的兩個讀者」，不是對秒
數。新效果全部是入場 keyframes（`[data-revealed]` ＋ no-preference 之
內），基態＝已修正終態，無 JS／reduced-motion 契約與現況完全一致。逐字
skew 的 span 由新的 runtime 腳本包（無 JS ⇒ 不包 ⇒ 直接終態）。

**Tech Stack:** 純 CSS（keyframes ＋ custom property tokens）＋一支
~40 行的 vanilla JS（包字）。不引入 hyperly（`manual/public/` 是 vite
不處理的原樣目錄，bare specifier 不解析；han.js 也沒 re-export wrap——
若日後 han.css 開 util subpath export，`semantic-chars.js` 可換成官方
wrap，介面已預留）。

**檔案地圖：**

- Modify: `manual/public/home/station-semantics.css`（cue tokens、詩行
  cue 重指、四個新效果、off-gate 補刀、註解更新）
- Modify: `manual/home/station-semantics.html`（`<g>` 的 inline
  `--row-cue` 改引 token；其餘不動）
- Create: `manual/public/home/semantic-chars.js`（包字）
- Modify: `manual/public/home.js`（掛 `initSemanticChars`）

**既有機制備忘（實作前必讀，行號以 v4/main-rewrite HEAD 為準）：**

- 圖解時鐘：`@property --settle`（station-semantics.css:91，initial 1
  ＝無 JS 終態）；入場 `mark-settle 520ms ease-out var(--row-cue) both`
  （:639-649），鍵在 `#station-semantics[data-revealed]`。
- 詩行入場（:734-798）：`semantics-settle`（step-end 翻 `--han-semantics`
  off→on）＋ `semantics-straighten`＋`semantics-mark-cue`，cue 在
  :780-788 的 `nth-of-type` 階梯。**旗標在 cue+520ms 才翻**（step-end）
  ——著重號／wavy 的淡入靠翻旗後 :662-683 的 transition 觸發。
- 模組開關 off-gate（:830-846）：`:root[data-han-module-semantics='off']
  #station-semantics &`，**ID 同重才打得贏 reveal 規則**；
  `animation: none` 是必要的（filled animation 蓋過普通宣告）；
  `article * { animation: none }` **不含 pseudo-elements**。
- `<u>` 目前被刻意排除在淡入名單外（:848-852）：off 態（瀏覽器預設）
  本來就有底線，不能把 decoration-color 掛進 --han-semantics 的
  container query，否則關掉模組會連瀏覽器底線一起藏——本計畫的 u 淡入
  因此**只做入場 keyframe，不進旗標機制**。
- 相關陷阱集：`~/.claude` workspace memory「CSS 靜默失效陷阱集」——
  style query 讀祖先、:root 代換定型、未定義 var() 毒化。

**新拍點契約（tokens，值＝現行圖解 inline cue，行為不變只是命名）：**

```
--cue-proper: 200ms    --cue-emphasis: 400ms   --cue-weight: 800ms
--cue-plain: 1000ms    --cue-wavy: 1200ms      --cue-bracket: 1400ms
--cue-settle: 520ms（交棒點：行旗標 step-end 的翻轉時刻，新動畫的 delay 基準）
```

詩行改按**記號歸屬**取 cue（行 1、3 都是專名號 ⇒ 同取 `--cue-proper`，
兩行同亮＝「圖動 `<u>`、字也動 `<u>`」的戲；其餘行的 cue 值與現行階梯
本來就相同，視覺不變）。新效果的 delay 分兩類：**UA 本來就畫的**
（u 底線）從 cue 起跑；**翻旗才存在的**（wavy 線、《》、楷體）從
`calc(cue + 520ms)` 起跑——與旗標翻轉的瞬間無縫交棒。

---

### Task 1: cue tokens ＋ 兩邊改引同一組變數

**Files:**
- Modify: `manual/public/home/station-semantics.css`（`#station-semantics`
  的根規則附近宣告 tokens；:780-788 的詩行 cue 重指）
- Modify: `manual/home/station-semantics.html`（六個 `<g data-mark>` ＋
  `<g data-clock>` 的 inline style）

- [ ] **Step 1: 宣告 tokens**

在 station-semantics.css 圖解段（`.MarkDiagram` 規則之前）加：

```css
/* 記號拍點——圖解 <g> 與詩行共用的同一組時鐘（誰的記號誰取用；
   詩行第 1、3 行同為專名號，同取 --cue-proper，與圖解同亮）。
   值即原 inline --row-cue，行為不變，只是把秒數收攏成契約。 */
#station-semantics {
  --cue-proper: 200ms;
  --cue-emphasis: 400ms;
  --cue-weight: 800ms;
  --cue-plain: 1000ms;
  --cue-wavy: 1200ms;
  --cue-bracket: 1400ms;
}
```

- [ ] **Step 2: `<g>` inline style 改引 token**

station-semantics.html:255-292 一帶，逐個把
`style="--row-mid: …; --row-cue: 200ms"` 的 cue 值換成
`--row-cue: var(--cue-proper)`（emphasis／weight／plain／wavy／bracket
同理；`data-clock` 取 `var(--cue-emphasis)`）。`--row-mid` 不動。

- [ ] **Step 3: 詩行 cue 重指**

station-semantics.css :780-788 的階梯改為（注意 `<br>` 是兄弟，維持
`nth-of-type`）：

```css
    /* 行拍——按記號歸屬取圖解同一個 token：1、3 行專名號同亮，
       2 著重、4 字重、5 楷體、6 甲式、7 乙式。address 倆維持原拍。 */
    > address:not([lang]) { --row-cue: 0ms; }
    .poem-like > span:nth-of-type(1) { --row-cue: var(--cue-proper); }
    .poem-like > span:nth-of-type(2) { --row-cue: var(--cue-emphasis); }
    .poem-like > span:nth-of-type(3) { --row-cue: var(--cue-proper); }
    .poem-like > span:nth-of-type(4) { --row-cue: var(--cue-weight); }
    .poem-like > span:nth-of-type(5) { --row-cue: var(--cue-plain); }
    .poem-like > span:nth-of-type(6) { --row-cue: var(--cue-wavy); }
    .poem-like > span:nth-of-type(7) { --row-cue: var(--cue-bracket); }
    > address[lang] { --row-cue: 1600ms; }
```

（address 的 0ms／1600ms 若現行寫法不同，照現行值搬，只換表達式。）

- [ ] **Step 4: 驗證** dev server：入場總長不變（~1920ms＋行 7 的
  520ms）；唯一視覺差＝第 3 行與第 1 行同時亮。reduced-motion 下無動畫。

- [ ] **Step 5: Commit**
  `feat(home): 站①拍點收攏成 --cue-* tokens，詩行與圖解同鐘`

---

### Task 2: `<u>` 專名號——先接上、再斷開（同 `--cue-proper`）

圖解 proper 行演的本來就是「瀏覽器的連通底線 → 專名號裂開」（settle 0
兩段 rect 靠攏、settle 1 滑開 ±2 unit）。詩行照演同一齣：入場 keyframe
的 from 把相鄰縫 **cheat 成 0**（兩條底線強迫相連），前 40% 淡入「連著
的線」，後 60% 裂開到正字法的縫。

背景：相鄰縫由 han.js 蓋的 adjacent-line 標記＋
`margin-inline-end: var(--han-adjacent-lines-skip-gap-fallback)`
（src/css/semantics.css:499-503）畫出，**且不在 --han-semantics 門內**
（off 了 margin 還在——核心的既有怪癖，本計畫利用它、不修它；要修另
開 src/ 的案）。

**Files:**
- Modify: `manual/public/home/station-semantics.css`

- [ ] **Step 0: 查實標記名**——`grep -n 'data-followed'
  src/ts/semantics/adjacent-lines.ts src/css/semantics.css`，下文選擇器
  以 grep 結果為準（暫記 `u[data-followed-by-adjacent-line]`）。

- [ ] **Step 1: keyframes ＋ 掛載**

```css
/* 專名號的入場，兩拍：先淡入一條「相連的」底線（縫 cheat 成 0——
   UA 底線本就連通，margin 歸零即重現），再在同一窗的後 60% 裂開到
   正字法的縫——與圖解 proper 行（settle 0 靠攏 → 1 滑開）同一齣戲。
   u 不進 --han-semantics 旗標機制（off 態也有 UA 底線，掛進去會連
   瀏覽器底線一起藏）；透明與零縫只存在 keyframe 裡，基態＝終態。 */
@keyframes semantics-u-in {
  from { text-decoration-color: transparent; }
  40%, to { text-decoration-color: currentColor; }
}
@keyframes semantics-u-split {
  from, 40% { margin-inline-end: 0em; }
  to {
    margin-inline-end: var(--han-adjacent-lines-skip-gap-fallback, .125em);
  }
}
```

動畫區（:734-798 內）：

```css
    /* 淡入掛所有 u；裂縫只掛帶 adjacent 標記的那顆——別給單獨的 u
       憑空加 margin */
    .poem-like u {
      animation: semantics-u-in 520ms ease-out var(--cue-proper) both;
    }
    .poem-like u[data-followed-by-adjacent-line] {
      animation:
        semantics-u-in 520ms ease-out var(--cue-proper) both,
        semantics-u-split 520ms ease-out var(--cue-proper) both
      ;
    }
```

- [ ] **Step 2: off-gate 免疫確認**：`article * { animation: none }`
  （:846 一帶）已覆蓋 `u`，關模組回瀏覽器預設（底線在、margin 也在
  ——既有怪癖，維持現狀）。開關兩次目測。

- [ ] **Step 3: 更新 :848-852 舊註**——「u 排除在淡入名單外」改寫為
  「u 不進旗標機制（off 態也有 UA 底線）；入場由 semantics-u-in／
  -u-split 演『接上再斷開』」。

- [ ] **Step 4: Commit**
  `feat(home): 站①專名號入場——底線先相連再裂開，與圖解同齣`

---

### Task 3: `<i>` 逐字 span ＋ skew 歸正

**Files:**
- Create: `manual/public/home/semantic-chars.js`
- Modify: `manual/public/home.js`（import ＋ DCL 呼叫，排在
  `initReveal` 之前）
- Modify: `manual/public/home/station-semantics.css`

- [ ] **Step 1: 包字腳本**

```js
/**
 * semantic-chars.js — 站①詩行 <i> 的逐字 span（semantic-chars 動畫用）。
 *
 * 只包 .poem-like 裡的 <i>（純文字內容），每字一個
 * <span data-char style="--i:n">。無 JS ⇒ 不包 ⇒ CSS 基態即歸正終態，
 * 同站台 reveal 契約。用 [...text] 迭代 code point，不用 split('')。
 * （若日後 han.js 開 wrap util 的 subpath export，此檔改為薄轉接。）
 */
export const initSemanticChars = () => {
  for (const $i of document.querySelectorAll('#station-semantics .poem-like i')) {
    if ($i.querySelector('[data-char]')) continue
    const chars = [...$i.textContent]
    $i.replaceChildren(
      ...chars.map((char, index) => {
        const $span = document.createElement('span')
        $span.dataset.char = ''
        $span.style.setProperty('--i', index)
        $span.textContent = char
        return $span
      }),
    )
  }
}
```

home.js 的 DCL 佇列裡、`initReveal` 之前加 `initSemanticChars()`（import
路徑 `'/home/semantic-chars.js'`，比照 `initWavyCiteGap` 的掛法）。

- [ ] **Step 2: skew 動畫（交棒式時序）**

station-semantics.css 新增：

```css
/* 楷體行的逐字歸正。時序是「交棒」：cue+520ms 旗標翻轉的那一瞬，
   font-style 的合成斜體（oblique）消失、每字的 skew(-12deg) 同時接手
   ——斜度連續無跳變；然後逐字（每字 +40ms）擺正。span 不碰
   font-style：off 態的瀏覽器斜體要原樣活著。inline-block 是 transform
   生效的條件；atomic inline 會斷 pair-squeeze，但 <i> 內全是漢字、
   邊界是冒號／逗號對漢字，不構成擠壓對（diantenjeom/docs/
   pair-squeeze-and-markup.md）。 */
@keyframes semantics-char-settle {
  from { transform: skew(-12deg); }
  to { transform: skew(0deg); }
}
```

動畫區內加：

```css
    .poem-like i [data-char] {
      display: inline-block;
      animation:
        semantics-char-settle
        520ms
        ease-out
        calc(var(--cue-plain) + var(--cue-settle) + var(--i) * 40ms)
        both
      ;
    }
```

同時把 :7xx 現行 `.poem-like :is(cite, em, i)` 的
`semantics-straighten` 名單中的 `i` 拿掉（skew 接手歸正；`cite`、`em`
照舊），`semantics-mark-cue` 名單維持含 `i`。

- [ ] **Step 3: off-gate**：`article * { animation: none }` 已覆蓋
  `[data-char]`（是真元素非 pseudo）✓；spans 無其他樣式，off 態
  瀏覽器斜體照常。開關目測。

- [ ] **Step 4: 直排軸向目測**——article 是 vertical-rl；合成斜體在直排
  的傾向若與 skewX 不合（字的歪向不像從斜體接手），把 keyframes 改
  `skewY(12deg)` 再測。此為已知待目測項，寫進 commit message。

- [ ] **Step 5: Commit**
  `feat(home): 站①楷體行逐字 skew 歸正（runtime 包字，交棒式時序）`

---

### Task 4: 甲式波浪線淡入改與圖解同窗

現況 wavy 淡入靠「翻旗 → :662-683 transition 420ms」，時窗＝
`cue+520 → cue+940`，而圖解 wavy 行在 `cue → cue+520` 畫線——慢半拍。
改成與 u 同款的入場 keyframe，從翻旗瞬間起跑。

**Files:**
- Modify: `manual/public/home/station-semantics.css`

- [ ] **Step 1:**

```css
/* 甲式波浪線淡入。線是翻旗（cue+520ms）才存在的，keyframe 從那一瞬
   起跑 520ms——與圖解 wavy 行的第二拍（縫張開）疊在同一窗。
   :662-683 的 transition 仍是模組開關用的淡入淡出，兩者不打架：
   入場時 animation 蓋 transition，開關時 animation: none 讓位。 */
@keyframes semantics-wavy-in {
  from { text-decoration-color: transparent; }
  to { text-decoration-color: currentColor; }
}
```

動畫區內：

```css
    .poem-like :where([style*='wavy']) cite {
      animation:
        semantics-wavy-in
        520ms
        ease-out
        calc(var(--cue-wavy) + var(--cue-settle))
        both
      ;
    }
```

- [ ] **Step 2: 開關回歸**——off→on 的 420ms transition 淡入照舊
  （animation 已 none，不搶）。開關兩輪目測甲式行。

- [ ] **Step 3: Commit**
  `feat(home): 站①甲式波浪線與圖解同窗淡入`

---

### Task 5: 乙式《》展開淡入

**Files:**
- Modify: `manual/public/home/station-semantics.css`

- [ ] **Step 1:**

```css
/* 乙式《》的登場：翻旗瞬間 content 出現（36px 迴流，:854 舊註記錄
   在案），本動畫把那一下「彈出」改成「長出」——inline-size 0→1em
   （《》是全形字，內容寬恰 1em）推開行文、墨色同步浮現。
   inline-size 要生效得 inline-block（atomic inline；《 對書名首字、
   》對後文的 pair-squeeze 邊界風險同 Task 3 註）。fill both ⇒ 動畫
   結束後定格 1em，與 content 實寬一致，無裁切。 */
@keyframes semantics-bracket-in {
  from {
    color: transparent;
    inline-size: 0;
  }
  to {
    color: currentColor;
    inline-size: 1em;
  }
}
```

動畫區內（pseudo 不能包進 `:where()`——:370-376 的舊坑）：

```css
    .poem-like cite::before,
    .poem-like cite::after {
      display: inline-block;
      overflow: clip;
      animation:
        semantics-bracket-in
        520ms
        ease-out
        calc(var(--cue-bracket) + var(--cue-settle))
        both
      ;
    }
```

注意選擇器只該命中乙式行：甲式行的 cite 沒有 ::before/::after
（content 由 bracket container query 才給），規則寫寬無妨但要目測
甲式行無異狀。

- [ ] **Step 2: off-gate 補刀（pseudo 不在 `article *` 覆蓋內！）**

:830-846 的 off 規則裡加：

```css
    article cite::before,
    article cite::after { animation: none; }
```

（同規則已有的 ID 重量即夠；不加這刀，關模組時 filled keyframe 會把
透明態釘死在殘存的 pseudo 上。）

- [ ] **Step 3: 目測**——乙式行《》從行文中長出、文字被推開的迴流即
  動畫本體；關模組 36px 迴流照舊瞬收（off 態無動畫，維持現約）。

- [ ] **Step 4: Commit**
  `feat(home): 站①乙式《》展開淡入，off-gate 補 pseudo 免疫`

---

### Task 6: 回歸清單＋註解收尾

- [ ] reduced-motion：全站靜態、全部是修正終態（新效果全在
  no-preference 內）。
- [ ] 無 JS（`pnpm preview` 關 JS）：不包字、不 reveal，直接終態。
- [ ] 模組開關連按數次：u 底線常在、《》瞬收瞬回、wavy/著重 420ms
  transition、楷體行回瀏覽器斜體——無透明殘留、無動畫重播。
- [ ] hover 圖解各行：圖解自身 replay 照舊；雙向重播的驗收在
  Task 7 Step 4（本 task 只確認 Task 1–5 沒弄壞既有 hover）。
- [ ] 清掉 figure 內兩行永不命中的 address 拍點與 semantics-ghost-cue（死碼，
  Task 1 品質審查點名）。
- [ ] 檔頭與 :82-87、:686-693 的「`<ul>`／code ghost」歷史註解順手改掉
  （探勘已證實與現markup不符）。
- [ ] Commit：`docs(home): 站①註解對齊現況（cue tokens、u 淡入、ul 史前史）`

### Task 7: 雙向 hover 重播（詩行 ↔ 圖解）

任一邊 hover（詩行的語意元素、或圖解的對應行）⇒ **兩邊同時重播**該記
號的動畫。機制：`:has()` 把觸發收在 `#station-semantics` 上，一條選擇
器天生雙向。成本：CSS 動畫**同名重宣告不重啟**（圖解為此自製了
`mark-replay`，:111-117），每個入場效果都要一支同幀的 `*-replay` 雙胞
胎；replay 一律**去掉 cue delay**（hover 即演）。

**Files:**
- Modify: `manual/public/home/station-semantics.css`

- [ ] **Step 1: replay 雙胞胎**——複製 `semantics-u-in`／`-u-split`／
  `-wavy-in`／`-bracket-in`／`-char-settle` 為 `*-replay`（幀完全同，
  僅改名）；em／dfn 的詩行側 replay 直接複製現有
  `semantics-mark-cue`／`semantics-straighten` 為 `-replay` 版。

- [ ] **Step 2: 六組觸發規則**（`@media (hover: hover) and
  (prefers-reduced-motion: no-preference)` 內；ID 重量同 reveal 規則。
  proper 組示例，其餘五組同構）：

```css
  /* 雙向重播：詩行元素或圖解行，誰被 hover 都點燃兩邊。圖解側沿用
     mark-replay；詩行側用各自的 -replay 雙胞胎（同名不重啟，:111）。
     replay 無 delay——hover 即演；逐字 skew 保留每字 40ms 錯拍。 */
  #station-semantics:has(
    .MarkDiagram [data-mark='proper']:hover,
    .poem-like u:hover
  ) {
    .MarkDiagram [data-mark='proper'] {
      animation: mark-replay 620ms ease-out both;
    }
    .poem-like u {
      animation: semantics-u-replay 620ms ease-out both;
    }
    .poem-like u[data-followed-by-adjacent-line] {
      animation:
        semantics-u-replay 620ms ease-out both,
        semantics-u-split-replay 620ms ease-out both
      ;
    }
  }
```

  對應表：proper↔`u`（兩行齊播）、emphasis↔`em`、weight↔`dfn`、
  plain↔`i`（`[data-char]` 錯拍 `calc(var(--i) * 40ms)`）、
  wavy↔`[style*='wavy'] cite`、bracket↔第 7 行 `cite`（pseudo 一併）。

- [ ] **Step 3: 已知取捨（實作時照此，不另發明）**——(a) 詩行 hover
  目標是直排行內元素、命中面積小：先做元素級（user 指定「semantic
  elmt」）；若手感差，改行級 `span:has(u):hover` 是一行的事，留給
  owner 目測後定。(b) off 態：詩行側被 `article * { animation: none }`
  壓住不重播、圖解側照舊（含被詩行 hover 點燃）——與現況 off 行為
  一致的不對稱，接受並在 off-gate 註解記一筆。

- [ ] **Step 4: 目測**——六組來回 hover、hover 中途離開（動畫消失回
  終態，同圖解現況）、觸控裝置無 hover 無害。

- [ ] **Step 5: Commit**
  `feat(home): 站①雙向 hover——詩行與圖解互相點燃重播`

### 明確不做

- **em 著重號／dfn 字重的入場時窗改制**：現行翻旗＋transition 已達意，
  不為一致而動（Task 7 只給它們 replay 雙胞胎，不動入場）。
- **修 han.css 核心「off 態 adjacent margin 殘留」**：本計畫的 cheat
  正好用得上它；要修是 src/ 另案。
- **hyperly**：不引入（理由見檔頭 Tech Stack）。
