/**
 * dash-fuse.js — station②'s 破折號熔接底圖的開演時機（.PunctFix）。
 *
 * 幾何與動畫全在 dash-fuse.css；這支只回答一個問題——什麼時候蓋
 * `data-play`。兩個條件都成立才蓋：
 *
 *   ① .PunctFix 已被 reveal.js 蓋 `data-revealed`（data-reveal-at 深度
 *      門檻，且過 fonts-gate）——文案還沒印出來，底圖沒理由先開演。
 *   ② 鉛字盤的入場已經落完（首播接合的條件；柱本身早就以斷開態現身了）。盤的節奏由 lead-forme.js 發佈在
 *      `--lf-last-slug`（最後一枚的起跳延遲）＋ `--lf-drop-dur`（一枚的
 *      落程），跟 lead-forme.css 給 figcaption 排隊用的是同一份時刻表；
 *      已經 `.settled` 的盤（reduced、或使用者先動過控制）視為落完。
 *
 * 兩段文案的入場不經這裡：它鍵在 .PunctFix 自己的 `data-revealed` 上
 * （reveal.js 蓋，淺門檻），滾到鉛字以下就飛入，與柱的節奏無關。
 *
 * reduced-motion ⇒ 不蓋章也無妨：dash-fuse.css 的隱藏與動畫只活在
 * no-preference 之內，基態就是已修正的終態（同站台 reveal 契約）。
 */

const ms = (value, fallback) => {
  const n = Number.parseFloat(value)
  return Number.isNaN(n) ? fallback : n * (value.includes('ms') ? 1 : 1000)
}

/* 屬性已在 ⇒ 立即；否則等 MutationObserver 的那一次。 */
const stamped = ($el, attr) =>
  $el.hasAttribute(attr)
    ? Promise.resolve()
    : new Promise((resolve) => {
        const observer = new MutationObserver(() => {
          if (!$el.hasAttribute(attr)) return
          observer.disconnect()
          resolve()
        })
        observer.observe($el, { attributes: true, attributeFilter: [attr] })
      })

/* 盤落完：revealed 起算 last-slug ＋ drop-dur，再加一口氣的緩衝。 */
const formeDone = ($forme) =>
  $forme.classList.contains('settled')
    ? Promise.resolve()
    : stamped($forme, 'data-revealed').then(
        () =>
          new Promise((resolve) => {
            const style = getComputedStyle($forme)
            setTimeout(
              resolve,
              ms(style.getPropertyValue('--lf-last-slug'), 2900)
                + ms(style.getPropertyValue('--lf-drop-dur'), 720)
                + 250,
            )
          }),
      )

/* 盤的 reveal 用的是 0.6 深度門檻（reveal.js data-reveal-at）——正常滾讀
   必然先過它；但深連結／一步跳到文案，盤可能永遠不亮章。文案亮章後給盤
   一個短窗：窗內亮了就等它落完，沒亮就是讀者跳過了儀式，不再扣住底圖。 */
const formeSeen = ($forme) =>
  Promise.race([
    stamped($forme, 'data-revealed').then(() => true),
    new Promise((resolve) => setTimeout(() => resolve(false), 1000)),
  ])

export const initDashFuse = () => {
  const $punct = document.querySelector('.PunctFix')
  if (!$punct) return
  const $forme = document.querySelector('.LeadForme')
  const $column = $punct.querySelector('svg[data-name="dash-fuse"]')

  /* 即刻武裝：柱以斷開態示人，不等鉛字排完（CSS 把 armed 的效果關在
     no-preference 之內，reduced 下這個章沒有作用）。 */
  $column?.setAttribute('data-armed', '')

  /* 首播章蓋兩處：柱（接合動畫鍵在它身上）與 .PunctFix（留著給 e2e ／
     未來的旁證用）。條件：本欄 data-revealed 且鉛字盤入場落完。 */
  stamped($punct, 'data-revealed')
    .then(() => ($forme ? formeSeen($forme) : false))
    .then((seen) => (seen ? formeDone($forme) : undefined))
    .then(() => {
      $punct.setAttribute('data-play', '')
      $column?.setAttribute('data-play', '')
    })
}
