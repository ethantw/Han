# 首頁 Web 字體等待器——「漢」描邊開幕式

參照 ziano 的 font gate（`ziano/demo/src/fonts/gate.ts`＋`gate.css`：
pre-paint 蓋章、`document.fonts.ready` 對 4s timeout 賽跑、揭幕一次性
淡入），但取向不同：ziano 全頁留白＋色塊脈動，我們**保留版面骨架、
只隱文字**（`color: transparent`），用 Manifesto 的「漢」水印描邊
動畫當 loading indicator——開幕式。

## 規格（2026-07-19 對齊定案）

- 範圍：**先首頁**。manual 文檔頁日後可補 ziano 式簡版（無描邊）。
- **統一至少等一輪完整描邊（≈1.4s）**，含 cache-hit 回訪——swap
  永遠會閃，錨定「絕不閃」＋儀式感。釋放 = fonts settled 且 ≥1 輪
  描完，兩者取 max；ready 落在輪中則讓當前輪描完。
- 字體慢：描邊整輪重播撐場。fonts 4s 保底（斷網照樣放行，swap 後補）。
- 現有進場動畫（hero-rise 四連、reveal.js 觀察）延後到釋放才開始。
- reduced-motion：不播描邊 → 只等 fonts settled（含 4s 保底），
  color 直接還原不淡入（隱字防閃的原意對 reduced-motion 用戶同樣
  成立，但不強加 1.4s 動畫等待）。
- no-JS：永不蓋章 → 文字即刻可見，settled 態是基態，契約不破。

## 實作

1. `_home.html`：第三個 sanctioned pre-paint script——
   `document.documentElement.dataset.fontsGate = 'loading'`。
2. `home.css` 新 § Fonts gate：
   - `:root[data-fonts-gate='loading'] body * { color: transparent
     !important }`——全站唯一 sanctioned `!important`（gate 必須壓過
     一切後代 `color:`）。水印描邊走 `stroke`，天然免疫；TypeTray
     鉛字 `fill: currentColor` 隨字隱藏，正好。已知豁口：`<han-rail>`
     shadow 內部自帶 color token，不受隱字影響——rail 本有
     `:not(:defined)` 隱藏，可接受。
   - 描邊三態（no-preference 內）：無章（no-JS）= 原 4.5s 慢版入場；
     `[data-fonts-gate]` 蓋章 = 慢版永不跑；`='loading'` = 快版
     wm-draw 0.35s／筆、0.09s 錯峰，一輪 ≈1.34s；`='ready'` =
     `animation: none` 回落基態（滿描髮絲水印）——剛描完的輪
     無縫接住。
   - hero-rise 四連在 `loading` 態 `animation: none`，翻 `ready`
     屬性重新套用 → 從釋放那刻起跑。
   - `ready` 態 `body > *` 一次性 gate-reveal 0.35s 淡入
     （no-preference 內）。
3. `home/fonts-gate.js`（新）：`initFontsGate(): Promise<void>`——
   `Promise.race([document.fonts.ready, 4s])`；監聽末筆（`--i: 11`，
   DOM 末位 path）`animationend` 計輪；輪畢字體未到 →
   `getAnimations().currentTime = 0` 整組回卷重播；兩線齊備翻
   `data-fonts-gate='ready'` 並 resolve。reduced-motion／無描邊
   SVG → 退化為只等字體線。
4. `home.js`：`initFontsGate().then(initReveal)`——reveal.js 本身
   零改動，站的 `data-revealed` 動畫自然延後到釋放。

## 驗收（2026-07-19 Playwright 全過；腳本見 session scratchpad）

- [x] 正常載入：骨架＋逐筆描邊、文字透明；ready ≥1.34s 後文字淡入、
      hero-rise 此刻才起跑（實測 ready 1759ms，h1 rgba(0,0,0,0)→復原）
- [x] ≥1 輪門檻成立（cache 快路徑由最短輪邏輯覆蓋）
- [x] 慢字體：woff2 延遲 3.5s → 循環撐場，ready 4428ms 當輪描完釋放
- [x] 斷字體 4s 保底（fontsSettled race；另加 8s hard cap 防
      animationend 在節流背景分頁永不觸發的絕境）
- [x] reduced-motion：無描邊動畫，字體到即現字（實測 1146ms）
- [x] no-JS：無章，文字即刻可見
- [x] gate 路徑釋放後水印持滿描（strokeAnims=0、dashoffset=0）；
      慢版入場僅無章路徑
- [x] reveal.js 釋放後才觀察（data-revealed 在 ready 後才蓋）

**驗證途中抓到的漏網**：`body *` 不匹配偽元素——hero h1 的
`::first-line` 品牌綠首句照樣可見（截圖現形）。修法：隱字規則加列
`*::before / *::after / *::first-line` 三行（站台水印 `attr(data-wm)`
與 InstallChip `$` 一併收網）。教訓入檔：**以 `color` 蓋全站時，
文字還住在三種偽元素裡**。

**Shadow 側補遺（用戶指出面板漏隱）**：`<han-rail>` shadow 的原
「已知豁口」撤銷——light-DOM 選擇器進不去，但 custom property 穿透
＋`@container style()` 沿 flat tree 查祖先可以：home.css 在 loading
態於 `:root` 立 `--fonts-gate: loading` 旗，rail.css（shadow 專屬表）
以 style query 讀回、`*, *::before, *::after` 全隱字。途中再踩一次
css-traps 帳上的舊雷：**偽元素放進 `:where()` 會被寬容忽略**——
＋/－ 組標記因此漏網，改平鋪選擇器後收淨。骨架（滑桿、開關、
hairline）照舊可見。Playwright 驗證 shadow 內 label 於 loading 態
rgba(0,0,0,0)、ready 後復原。

**3G 實測補修（用戶回報：慢網下描邊只跑一輪就靜止）**——兩層病根：
①節拍器被 home.js 的大 import 圖拖著，3G 下醒來時第一輪早結束，
`animationend` 放空炮；②醒來也不補課，`passesUntil` 只聽未來的
end，永遠等不到 → 8s hard cap 硬放行。修法：①`fonts-gate.js` 改
自啟動單例、`_home.html` 用獨立 `<script type="module">` 掛載
（一檔小圖並行抓，module 天然 deferred、DCL 時 DOM 已備；home.js
import 同 URL 由瀏覽器 dedupe 共享同一 promise）；②醒來時
`getAnimations()` 見 `playState === 'finished'` 即視同該輪已完成，
當場補走一步節拍（字體到→放行；未到→回卷 encore）。驗證：3G 劇本
（home.js 延遲 2.5s＋woff2 延遲 6s）ready 6609ms、末筆 animationend
5 次——循環成立、非 hard cap 放行；原七項全數重跑通過。

**兩層水印＋輪界放行（用戶二修定案）**——重播「整輪回卷」觀感太怪
（描好的字憑空消失）。改為**雙層**：第一輪快版描完即定格，永不
un-draw；字體未到才由 fonts-gate.js 把 12 筆 clone 成 `[data-encore]`
第二層（色深一階 24% vs 12%、慢一檔 0.9s／筆×0.27s 錯峰 ≈3.9s／輪）
疊上重描，每輪回卷的只有這一層。釋放語義同步收緊：**取
max(字體到位, 當前輪畫完)**——encore 進行中字體到了，該輪照樣畫到
底才拿掉 transparent，放行必落輪界（encore 永遠滿描退場），加深層
以 0.15s transition 淡出；首輪內字體就緒則 encore 從未誕生。hard cap
4s→12s 對應輪界等待的正常上界。clone 是 JS 生的，no-JS 頁面零負擔。

**Script 順序陷阱（3G 補修二）**：module script 按**文檔順序**執行——
fonts-gate 排在 han.js/home.js 後面時，就算自己一檔小圖，執行仍被
前面的大 import 圖堵住（實測 3G 下 2.5s+ 才醒，節拍器全面遲到）。
修法：fonts-gate 的 `<script type="module">` 挪到腳本清單**最前**。
配合「醒來見 `playState: 'finished'` 即補拍」雙保險。

驗證（Playwright）：3G 劇本（home.js 延遲 2.5s＋woff2 6s）——encore
1874ms 開演、ready 5666ms 落輪界、放行瞬間 12 筆滿描、0.15s 淡出；
快路徑 ready 1732ms 首輪即放行、encore 未誕生；原七項全數重跑通過。

**釋放瞬間閃爍修正（用戶回報 outline 跟著閃）**——兩個共犯：
①ziano 式 gate-reveal 把 `body > *`（含 `main` 裡的水印）整塊拉回
opacity 0 再淡入——已可見的東西被迫眨眼；②hero-rise 在釋放時重跑，
chips／InstallChip 的可見骨架同閃。裁定：**gate 路徑不再有任何整塊
重淡入**——描邊儀式就是進場動畫，transparent 拿掉時文字像活字一樣
直接「印」上去；gate-reveal 規則刪除、hero-rise 抑制改
`[data-fonts-gate]`（任一態，no-JS 路徑仍保有 hero-rise）。驗證：
rAF 逐幀取樣跨越釋放瞬間，main／水印 opacity 曾低於 1 或 dash 偏移
的幀數＝0；七項全數重跑通過。原則入檔：**閘門揭幕只該現身「本來
藏著的東西」，動過的東西不准再動**。

**Encore 三修：并發落筆（用戶定案）**——重描不再逐筆錯峰，改
12 筆**同時開畫、同一筆速**：每筆時長 ∝ 真實路徑長（fonts-gate.js
以 `getTotalLength()` 量長、per-clone 寫 `--encore-dur`；pathLength=1
只是 dash 記帳，不影響量長），最長筆 1.8s 收官即輪界，全 sheet 回卷
齊步重播；短筆先完成以 fill:both 持筆等候。一輪 3.9s→1.8s，「酷而
不煩」。實測：12 筆 12 種時長（0.34–1.8s）、delay 全 0、放行仍落
輪界且滿描；七項全過。

- [ ] Safari／Firefox 手動過目（Chromium 已全驗）

備忘：本檔在 `docs/` 下，commit 要 `git add -f`。
