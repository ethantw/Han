# 模組開關改走 CSS 變數 —— lines／prose（fonts 維持 `<link disabled>`）

承 `docs/plans/rail-module-switches.md`(四個模組開關的規格)與 commit
`80aa666`(semantics 已改走 `--han-semantics`)。目標:把 `<han-console>`
的模組開關從「停用整張樣式表」換成「撥該模組自己的 CSS 變數」,消掉
`link.disabled` 那 400–530ms 的主執行緒阻塞。

**生成碼不變。** 開關要預覽的決定仍是「加／減一行 `@import`」,codegen.js
的 `cssVars` / `configCSS` 一個字都不動。

## Owner 的三個決定(2026-07-29)

| 模組 | 做法 | 備註 |
|---|---|---|
| semantics | 已完成 —— `:root { --han-semantics: off }` | commit `80aa666` |
| **lines** | **`:root { --han-text-autospace: no-autospace; --han-punctuation-refinement: none }`** | 用現成的公開旋鈕,不新增閘門 |
| **prose** | **`article { --han-prose: off }`** | 上游 `:where(article)` 的種法是刻意的,不動 |
| **fonts** | **維持 `<link disabled>`** | 換機制省不到——換字體必然全頁重新 shape |

量測(§5)確認前三項,並推翻我對 lines 的悲觀預估。

上一輪我提議在 `src/css/` 新增 `--han-lines` / `--han-fonts` 總閘門,
**作廢**。查證後 owner 的做法是對的,而且成本低一個數量級:lines 兩個旋鈕
已經涵蓋整個模組(見下),prose 的閘門本來就存在。

---

## 查證結果(全部實測,非推論)

### 1 · 兩個旋鈕確實蓋住整個 lines 模組

`src/css/lines.css` + `lines.with-js.css` 的全部作用面,以及各自被哪個旋鈕關掉:

| 作用面 | 位置 | 被誰關 |
|---|---|---|
| `text-autospace` pass-through | `lines.css:78` `:where(:root)` | `--han-text-autospace: no-autospace` → `lines.css:111` 的 `@container` 把 `:where(*)` 蓋成 `no-autospace` |
| `text-spacing-trim: trim-start` | `lines.css:79` `:where(:root)` | `--han-punctuation-refinement: none` → `lines.css:118` 的 `@container` 把 `:where(*)` 蓋成 `space-all` ⚠️ 見 §3 |
| `<h-iss>` ¼字寬 spacer | `lines.with-js.css:36` | han.js 不再插入(見 §2) |
| 擠壓 fallback `h-char[data-punct]` | `lines.with-js.css:129`(`@supports not (text-spacing-trim: trim-start)`) | han.js 不再標記(見 §2);且在 Chrome 本來就 inert |
| 標點懸掛 | `lines.with-js.css:322` | `refinement: none` → `:314` 的 master override 把 `--han-state-hanging-punctuation` 撥成 `off` |
| `--han-punctuation-{hant,hans,ja}` 驅動的懸掛分支 | `lines.with-js.css:256–305` | 同上,懸掛總狀態已 off,分支moot |

沒有遺漏的第七塊。

### 2 · JS 側也會一起停手(而且比現在更忠實)

- `src/ts/line-adjustments/iss.ts` 的 `resolveISSMode` **顯式把 `no-autospace`
  映射成 JS enum 的 `'none'`**(該處註解已寫明,就是為了不讓作者的 opt-out
  被誤讀成 `normal`)→ `dispatchByISSMode('none')` = identity → 不插 `<h-iss>`。
- `src/ts/line-adjustments/punctuation.ts` 的 `refinePunctuation` 對
  `declared === 'none'` 短路 —— 不跑任何 pass、不寫 cascade。

**反過來說,今天的 `link.disabled` 才是不忠實的那個**:樣式表卸載連帶帶走
`@property` 註冊,`getComputedStyle` 讀回空字串,`resolveISSMode` 退回
`'normal'`、`resolvePunctMode` 退回 `'auto'` —— 於是 han.js **照樣**插
`<h-iss>`、照樣包 `<h-char>`,只是沒有樣式所以看不見。改走變數之後 JS 真的
會站住。這是這次改動附帶的一個正確性修正,不只是效能。

### 3 · 唯一的落差:`space-all` 關過頭了(已修)

Chromium(playwright 1.59.1 隨附)實測,`about:blank` 上的 UA 預設值:

```
text-autospace     : no-autospace
text-spacing-trim  : normal
```

同一個 inline box(`「東京」（都）、〈甲〉。`,12 字,Hiragino Sans 100px)
的寬度:

| `text-spacing-trim` | 寬度 |
|---|---|
| UA 預設 / `normal` | **1000px** |
| `space-all` | **1200px** |
| `trim-start`(han.css) | 950px |

也就是:

- `--han-text-autospace: no-autospace` **恰好等於** UA 預設,零落差。✅
- `--han-punctuation-refinement: none` 會落到 `space-all` = 1200px,但
  「lines 沒 import」是 **1000px** —— 瀏覽器自己本來就擠壓兩個字寬。差距
  200px / 2 個字,在標點密的行上一眼可見,而且錯的方向很難堪:**把瀏覽器
  原生做的事也一起關掉,等於誇大 han.css 的功勞。**

(這也再次確認 workspace ledger 那條:`text-spacing-trim: normal` 不是
"no trim",`space-all` 才是無擠壓基準線。`none` 在公開 API 的語意上落到
`space-all` 是對的 —— 作者說「完全不要擠壓」;錯的是拿它當模組開關。)

**修法:頁面側兩條規則,不動上游。**

```css
:root[data-han-module-lines='off'] {
  &, :where(*) { text-spacing-trim: revert; }
}
```

`revert` 而非硬寫 `normal`:語意就是「移除 author origin」,正好是模組開關要
表達的「這行 import 不存在」,而且不押注 Chrome 今天的預設值。

**`&` 那半是必要的,不是保險。** 第一版我只寫了後代那條,實測回來是
`trim-start` / 950px —— 比不改還糟。原因:`text-spacing-trim` 是繼承屬性,
而 `:root[…] :where(*)` 是後代選擇器,**`<html>` 不是自己的後代**,所以它
留著 `lines.css:79` 的 `trim-start`;後代的 `revert` 對繼承屬性等於「回到
父層的值」,於是整棵樹又把 `trim-start` 繼承回來。補上 `&` 之後,`<html>`
先 revert 成 UA 的 `normal`,後代再 revert 就繼承到 `normal`。§6 有驗證表。

### 4 · 沒有變數打架 —— codegen 早就 gate 好了

原本擔心「模組開關」和 console 自己的擠壓／autospace 控件會搶同兩個屬性
(兩者都在 `console-config.js` 的 `ALL_VARS`,由 `applyTarget` 寫在
`<main>` 上,而 `<main>` 是 `:root` 的後代,會蓋掉 `:root` 的模組開關)。

查了 `codegen.js:102`:`cssVars` 整段包在 `if (c.lines)` 裡。lines off 時
**根本不輸出這兩個變數**,`applyTarget` 開頭的 `removeProperty` 又會把上一
輪的值清掉。衝突不存在,`console-config.js` 不需要為此加任何條件。

同理 prose:`--han-prose` 只出現在 `configCSS` 的 `${scope} { --han-prose: on }`,
那是**生成碼文字**,預覽從不套用。所以預覽裡 `--han-prose: on` 的唯一來源
就是 han.css 的 `:where(article)`,`article { --han-prose: off }`(特異性
(0,0,1) > (0,0,0))完全蓋得住。

### 5 · 效能實測 —— 400ms 是**機制**的價,不是模組的價

首頁 `/`,Chromium(playwright 1.59.1),1440×900,站①揭示完成後靜置 2.5s
再測。每次撥動後開 `longtask` observer 收 600ms,取 7 次的中位數;`1st frame`
= 撥動到下一個 `requestAnimationFrame` 的延遲。

| | | blocked | 1st frame |
|---|---|---|---|
| semantics | `link.disabled` 關 / 開 | **439** / 402 | 434 / 8 |
| semantics | `--han-semantics` 關 / 開 | **123** / 130 | 122 / 128 |
| **lines** | `link.disabled` 關 / 開 | **405** / 441 | 405 / 9 |
| **lines** | 兩個旋鈕 關 / 開 | **163** / 169 | 154 / 168 |
| **prose** | `link.disabled` 關 / 開 | **405** / 393 | 403 / 9 |
| **prose** | `--han-prose` 關 / 開 | **0** / 0 | 14 / 14 |
| fonts | `link.disabled` 關 / 開 | 98 / **478** | 96 / 11 |

三件事:

1. **`link.disabled` 一律要價約 400ms,跟模組大小無關。** `prose.css` 只有
   134 行,照樣 405ms;`semantics.css` 436 行 + `lines.with-js.css` 407 行,
   也是 405–440ms。這是「重新收集整份 document 的 stylesheet」的固定稅,
   不是那個模組的樣式在算。
2. **走變數的成本才跟實際工作量成正比**:prose 幾乎是 0(只改
   `text-align`／`margin`),lines 163ms(全頁 inline 重新 shape),
   semantics 123ms。
3. **所以我上一輪「lines 可能沒賺頭」的懷疑是錯的。** 我以為 400ms 裡有很
   大一塊是 reshape,兩種機制都得付;實測 reshape 只佔 163ms,其餘 240ms
   純粹是換樣式表本身。**lines 值得做,prose 更值得。**

附帶一個觀察:`link.disabled` 的「開」方向 1st frame 只有 8–11ms,但
blocked 仍是 400ms —— 表示重新啟用時第一格畫得很快,400ms 的長任務落在後
面。手感是「按了馬上有反應,然後整頁凍住」,不比「關」方向好。

### 6 · 保真度驗證 —— 撥變數與卸樣式表是否同一個畫面

同一頁注入一個標點密的探針 `<span lang="zh-Hant">「東京」（都）、〈甲〉。</span>`
(100px,繼承頁面真實 cascade),與 `article p` 的 `text-align` 一起讀:

| 狀態 | 探針寬 | `text-spacing-trim` | `text-autospace` | `article p` 對齊 |
|---|---|---|---|---|
| 全開(基準) | 950 | trim-start | normal | justify |
| **lines off · `link.disabled`(真值)** | **1000** | **normal** | **no-autospace** | justify |
| lines off · 兩旋鈕,未補 | 1200 ❌ | space-all | no-autospace | justify |
| lines off · 兩旋鈕 + 補丁 v1(只有後代) | 950 ❌ | trim-start | no-autospace | justify |
| **lines off · 兩旋鈕 + 補丁 v2(`&` + 後代)** | **1000 ✅** | **normal** | **no-autospace** | justify |
| **prose off · `link.disabled`(真值)** | 950 | trim-start | normal | **start** |
| **prose off · `--han-prose` ✅** | 950 | trim-start | normal | **start** |

prose 逐格相同,零落差。lines 出貨的是**補丁 v2** 那一列,也逐格相同。

順帶量到的:整頁 `<h-iss>` 數量在所有狀態都是 **0** —— Chrome 有原生
autospace,`applyISS` 本來就不插 spacer,所以 §2 那段 h-iss 的顧慮在
Chrome 上根本不存在(仍適用於沒有原生 autospace 的引擎)。`<h-char>` 固定
257 個,兩種機制都不會在撥動當下增減 —— han.js 只在 `applyFallbacks`
(console config 變動)時重跑,不是撥樣式的副作用。

---

## 已完成(2026-07-29)

### A · `manual/public/components/console-config.js`

`applyModules` 重寫成一張 `MODULE_MECHANISM` 表:`semantics` / `lines` /
`prose` 各自帶著要寫在 `:root` 上的旗標,`fonts` 標成 `'link'`。同一個迴圈
順手把四個模組的狀態鏡射成 `<html>` 的 `data-han-module-*="off"` —— 不管
該模組走的是旗標還是 link,對頁面 CSS 一視同仁。

原本打算把 prose 的屬性鏡射留給 `home/module-state.js`,改成由 applyModules
負責:那支只在首頁載入(`home.js`),而 `_layout.html` 也掛 `<han-console
form="top">`,手冊頁的 prose 開關會整個沒作用。apply 層是元件自己的邊界,
與 `ensureFont` 往 `document.head` 注 `<link>` 同級,放這裡才對。

### B · `manual/public/common/module-state.css`(新檔)

prose 一條 —— `:root[data-han-module-prose='off'] article { --han-prose: off }`。
`home.css` 與 `manual.css` 各 `@import` 一次(照 manual.css 檔頭的規矩,兩張
表各自引共用 partial,不互相 import)。

兩條:prose 的 `article` 規則,加上 §3 那條 `text-spacing-trim: revert`
—— 把 `space-all` 關過頭的部分交還給瀏覽器。

### C · `manual/_home.html` 的 pre-paint 還原腳本 —— 順手修掉一個現行 bug

那支 inline 腳本在 console 升級前先套用 localStorage 的設定,原本對四個模組
一律 `l.disabled = config[…] === false`。**這在 `80aa666` 之後就壞了**:帶著
「semantics off」重新整理 → 腳本把樣式表 disable → applyModules 只管旗標、
永遠不會把那個 link 收回來 → **該模組直到下次重新整理為止都開不回來。**

改成與 `MODULE_MECHANISM` 同形(三個撥旗標、只有 fonts 撥 link)。兩處表格靠
人工同步,`tests/e2e/module-switches.spec.ts` 有一條 reload 往返測試在守。

### D · `manual/public/home/module-state.js`

`reflect()` 拿掉(屬性改由 applyModules 擁有),檔頭改寫成「這支只做代理」。
延後 `press()` 的那段保留,並把註解裡過期的數字換成實測值:semantics 現在
是 123ms 而非 404–530ms —— 仍是四格掉幀,值得繼續讓路。

### E · 上游 `src/` —— 一行未動

`--han-lines` / `--han-prose-module` 閘門的提議作廢。

---

## 驗證

`tests/e2e/module-switches.spec.ts` 新增一個 describe(四條,粗粒度):

- lines off → `:root` 上兩個旋鈕都在,且 `link[data-han-module=lines]` 未被 disable
- prose off → `article p` 的 `text-align` 不再是 `justify`(旗標＋屬性＋頁面
  CSS 三者串起來才成立,少一環就靜靜地沒作用)
- 四個全關 → 只有 fonts 的 link 被 disable
- **關掉 → reload → 開回來,模組真的回來了**(C 那個 bug 的守門員)

`module-switches.spec.ts` 9/9 通過。全套 e2e 89 passed / 7 failed,7 條全部
是既有失敗 —— 拿 `git worktree` 開一份乾淨 HEAD 對照,同樣三支 spec 在 HEAD
上是 16 failed(工作區的 WIP 反而修好了幾條),我這 7 條是它的子集,錯誤訊息
逐字相同。與本次改動無關的既有失敗:`demo.spec.ts` ×2、`home.spec.ts` ×4
(含 `h-iss` 計數那條 —— Chrome 有原生 autospace,`applyISS` 本來就不插
spacer,測試本身過期了)、`homepage-v2.spec.ts` 的 `data-wm` 少一個。

原計畫寫的「lines off → `<h-iss>` 歸零」那條測試沒做:§6 量到整頁 h-iss
本來就是 0,測不到東西。

## 仍未量的一項

`applyFallbacks` 每次 config 變動都 uninstall + install han.js。改成旗標之後
install 會因為模式是 `none` 而**少做事**(§2),理論上比現在便宜;但 uninstall
的 DOM 手術兩邊都要付,實際淨值沒有單獨量過。

## 已知會留下的不對稱(寫進註解,不修)

- `@property` 註冊不會隨旗標消失。真的少一行 import 時,`--han-punctuation-*`
  這類註冊會一起不見;走旗標則留著。lines 這邊因為懸掛總狀態已經 off,
  觀察不到差異,但 fonts 仍走 `disabled` 正好避開這一整類問題。
- `Han Em Space` 的 `@font-face` 由 `han.fonts.css` 匯入,卻被
  `lines.with-js.css` 引用 —— 這是既有的跨模組耦合,與本次改動無關,但
  值得記一筆:單獨 import `han.lines.css` 的使用者拿不到那支字體,擠壓
  fallback 會退化。(獨立議題,另開。)
