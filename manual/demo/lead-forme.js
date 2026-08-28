/**
 * demo/lead-forme.html 的接線——四語各一副 4×10 版框，並排比較。
 *
 * 句子、切片編號、標點公約的預設全在 /home/lead-forme.js（首頁的模組，
 * FORME_LANGS）：每個 figure 用 `data-lang` 點名自己的語言，本檔只補一個
 * 首頁由 reveal.js 代勞的 `data-revealed` 蓋章。工作台與首頁因此同一份
 * 資料，改句子只改一處。
 *
 * 首頁的鉛字盤自己就有語言藥丸（切換即重排同一副版）；這頁的價值是
 * **並排**——四副同時在畫面上，逐格對位、逐公約比較。
 */

import { initLeadForme } from '/home/lead-forme.js'

for (const $verse of document.querySelectorAll('[data-verse]'))
  initLeadForme($verse)

/* 首頁由 reveal.js 在圖露出六成時蓋 `data-revealed`，入場的落子才對著
 * 觀眾演。這裡自備一個等價的觀察者；門檻對高個子讓步——圖比視窗高時
 * 六成永遠到不了，改以「已露出視窗八成高」為準。蓋過即退訂：戳記是
 * 一次性的，CSS 的 :not(.settled) 管後續。 */
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      const need = Math.min(0.6, (innerHeight * 0.8) / e.boundingClientRect.height)
      if (e.intersectionRatio < need) continue
      e.target.dataset.revealed = ''
      io.unobserve(e.target)
    }
  },
  { threshold: [0, 0.15, 0.3, 0.45, 0.6] },
)
for (const $forme of document.querySelectorAll('.LeadForme')) io.observe($forme)
