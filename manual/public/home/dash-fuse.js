/**
 * dash-fuse.js — station②'s 破折號熔接底圖（.PunctFix）：柱的排版、裁切，
 * 以及開演時機。
 *
 * 幾何與動畫在 dash-fuse.css，句子在 station-fonts.html；這支做三件事——
 *
 *   § layoutColumn  把 HTML 裡那兩句話拆成一格一個的**橫排** <text>
 *   § initClip      量出「超迴路運行廿載」樣張卡的上緣，發佈 --df-clip-top
 *   § 開演時機      什麼時候蓋 `data-play`
 *
 * 後者三個條件都成立才蓋：
 *
 *   ① .PunctFix 已被 reveal.js 蓋 `data-revealed`（data-reveal-at 深度
 *      門檻，且過 fonts-gate）——文案還沒印出來，底圖沒理由先開演。
 *   ② 鉛字盤的入場已經落完（首播接合的條件；柱本身早就以斷開態現身了）。盤的節奏由 lead-forme.js 發佈在
 *      `--lf-last-slug`（最後一枚的起跳延遲）＋ `--lf-drop-dur`（一枚的
 *      落程），跟 lead-forme.css 給 figcaption 排隊用的是同一份時刻表；
 *      已經 `.settled` 的盤（reduced、或使用者先動過控制）視為落完。
 *   ③ 至少喘滿 MIN_BREATHS 口，且卡在 df-strain 的輪邊界上（末幀
 *      fuse 0 ＝ df-fuse 的起手），換支不跳。
 *
 * 等待期有兩種身分：**還沒露臉**時是 df-try（極淺，只是活著），
 * **一露臉**就換 df-strain（較勁，見 dash-fuse.css）——**不等鉛字**。
 * 較勁本來就是「等待」本身的樣子：讀者在看鉛字落下的那段時間，兩截已經
 * 在使勁；鉛字落完，才在下一個輪邊界猛然接上。
 *
 * 實測沒有這一段時，滾到本欄後 1.1 秒就接合，那 1.1 秒裡 `--df-fuse`
 * 只從 .003 漂到 .14（df-try 一輪 6s 的六分之一），縫的變化不到
 * 0.01em——等待期寫得再細也等於沒演。
 *
 * 兩段文案的入場不經這裡：它鍵在 .PunctFix 自己的 `data-revealed` 上
 * （reveal.js 蓋，淺門檻），滾到鉛字以下就飛入，與柱的節奏無關。
 *
 * reduced-motion ⇒ 不蓋章也無妨：dash-fuse.css 的隱藏與動畫只活在
 * no-preference 之內，基態就是已修正的終態（同站台 reveal 契約）。
 */

const SVG_NS = 'http://www.w3.org/2000/svg'

/* 一格 ＝ 100 user unit ＝ 1em（font-size 也是 100px，dash-fuse.css）。 */
const CELL = 100

/* 字面的 em 框中心在基線之上 0.38em。**不是** `dominant-baseline: central`
 * ——那個以 hhea asc/desc 的中點為準（實測 0.4326em），em 框的中點是
 * sTypoAscender 880/1000。同一個數、同一個理由見 lead-forme.js § GEO
 * `emCentre`，那裡是逐字量出來的。 */
const EM_CENTRE = 0.38

/* UTR50 class R——直排要轉 90° 的字符。這裡自己轉，不求引擎：WebKit 在 SVG
 * 裡既不套 `vert`／`vrt2`，直排的字距又讀 hhea（見 dash-fuse.css § text）。
 * 表只涵蓋這一柱**可能**出現的字符；漢字是 class U，正立，不在表上。 */
const ROTATED = new Set([
  '《', '》', '〈', '〉',
  '「', '」', '『', '』',
  '（', '）', '〔', '〕',
  '—', '…', '～', 'ー',
])

/* 把一個裝著整句的 <text> 換成一格一個的橫排 <text>。
 * 句子只寫在 HTML（station-fonts.html），這裡讀走、不複製；<text> 自己的
 * `y` 是第一格的**上緣**，所以第 i 格的中點是 y + (i + .5) × CELL。 */
const layoutColumn = ($column) => {
  for (const $text of [...$column.querySelectorAll('text')]) {
    const top = Number.parseFloat($text.getAttribute('y'))
    const x = $text.getAttribute('x')
    const $cells = document.createDocumentFragment()

    ;[...$text.textContent].forEach((char, i) => {
      const centre = top + (i + 0.5) * CELL
      const $cell = document.createElementNS(SVG_NS, 'text')
      $cell.setAttribute('x', x)
      $cell.setAttribute('y', String(centre + EM_CENTRE * CELL))
      $cell.setAttribute('text-anchor', 'middle')
      /* 繞字格中點轉——text-anchor:middle 把 em 框橫向釘在欄軸上，
         y 又是由中點回推的，所以 (x, centre) 正好是 em 框的中心。 */
      if (ROTATED.has(char)) $cell.setAttribute('transform', `rotate(90 ${x} ${centre})`)
      $cell.textContent = char
      $cells.append($cell)
    })

    $text.replaceWith($cells)
  }
  /* 排完才交還橫排行向（CSS 的 `writing-mode: vertical-rl` 是沒有 JS 時的
     退路，見 dash-fuse.css § text）。 */
  $column.setAttribute('data-laid', '')
}

/* 柱的上緣切在「超迴路運行廿載」樣張卡的上緣。這個距離沒有靜態的 CSS 表
 * 達式——它隨 lede 換行、隨版心寬變——所以量出來發佈成變數，CSS 只管用
 * （同 lead-forme.js 把 --lf-* 發佈給 lead-forme.css 的作法）。
 * 觀察 main 的尺寸就夠：站台的一切寬度都由它給。 */
const initClip = ($column) => {
  const $faces = document.querySelector('#station-fonts .Illust[data-variant="faces"]')
  const $main = document.querySelector('main')
  if (!$faces) return

  const sync = () => {
    const top = $faces.getBoundingClientRect().top - $column.getBoundingClientRect().top
    $column.style.setProperty('--df-clip-top', `${Math.max(0, Math.round(top))}px`)
  }

  sync()
  document.fonts?.ready.then(sync)
  if ($main) new ResizeObserver(sync).observe($main)
}

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

/* 一口氣的長度，與 dash-fuse.css 的 `df-strain` 同值。 */
const BREATH_MS = 1600

/* 至少喘幾口才准接合（owner 定案）。鉛字通常在四口之內就落完，這道下限
 * 是給「深連結／盤已 settled」那種一到就位的情形用的——沒有它，讀者根本
 * 來不及看見兩截在試。 */
const MIN_BREATHS = 4

/* 從呼吸起跑算起，還要等多久才接合：湊滿 MIN_BREATHS 口，且落在**整數
 * 輪的邊界**上。邊界這一條是硬的——接合必須從 fuse 0 起手（那是 df-strain
 * 的末幀、也是 df-fuse 的第一幀），中途插進去會看到一次跳變。順帶它也讓
 * 每一口氣都完整：鉛字若在吸到一半時落完，也會等這一口喘完才接。 */
const toFuseEdge = (elapsed) => {
  const earliest = Math.max(elapsed, MIN_BREATHS * BREATH_MS)
  return Math.ceil(earliest / BREATH_MS) * BREATH_MS - elapsed
}

/* 相位要問**動畫自己**，不能用 performance.now() 從蓋章那一刻算。蓋章與
 * 動畫起跑之間隔著一次樣式重算＋一次上畫，實測差 84ms——照 JS 的錶對邊界，
 * 接合就會從 fuse −.06 跳到 0（約 1.6px，看得見）。Animation.currentTime
 * 是動畫自己的錶，對它就準。
 * currentTime 在時間軸動畫是毫秒數；捲動軸動畫會給 CSSUnitValue，這裡兩種
 * 都接（本檔用不到後者，但取值不該挑食）。reduced-motion 下沒有動畫可問，
 * 回 0 ＝ 立刻接合，正是那個模式該有的樣子。 */
const strainClock = ($column) => {
  const time = $column
    ?.getAnimations?.()
    .find((animation) => animation.animationName === 'df-strain')
    ?.currentTime
  return typeof time === 'number' ? time : (time?.value ?? 0)
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/* 讀者按住不放的那一齣（見 dash-fuse.css § .PunctFix[data-hold]）。
 * 進：蓋 data-hold ⇒ 斷開、轉校樣紅、兩截朝對方呼吸。
 * 出：把呼吸**當下**的 --df-fuse 抄進 --df-from，換蓋 data-repair ⇒ 從那個
 *     值接回終態；動畫結束自己撤章。CSS 讀不到執行中的動畫值，這一抄是這
 *     支存在的唯一理由。
 * 兩道閘在這裡而不在 CSS：沒有指標裝置（觸控）就不蓋章——:hover 在那裡會
 * 黏在最後點過的元素上；reduced-motion 同理，一律不演。 */
const initHoldRepair = ($punct, $column) => {
  if (!matchMedia('(hover: hover)').matches) return
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

  $punct.addEventListener('pointerenter', () => {
    $punct.removeAttribute('data-repair')
    $punct.setAttribute('data-hold', '')
  })

  $punct.addEventListener('pointerleave', () => {
    if (!$punct.hasAttribute('data-hold')) return
    $punct.style.setProperty(
      '--df-from',
      getComputedStyle($column).getPropertyValue('--df-fuse').trim() || '-1',
    )
    $punct.removeAttribute('data-hold')
    $punct.setAttribute('data-repair', '')
  })

  $column.addEventListener('animationend', (event) => {
    if (event.animationName === 'df-repair') $punct.removeAttribute('data-repair')
  })
}

export const initDashFuse = () => {
  const $punct = document.querySelector('.PunctFix')
  if (!$punct) return
  const $forme = document.querySelector('.LeadForme')
  const $column = $punct.querySelector('svg[data-name="dash-fuse"]')

  if ($column) {
    layoutColumn($column)
    initClip($column)
  }

  /* 即刻武裝：柱以斷開態示人，不等鉛字排完（CSS 把 armed 的效果關在
     no-preference 之內，reduced 下這個章沒有作用）。 */
  $column?.setAttribute('data-armed', '')

  /* 首播章蓋兩處：柱（接合動畫鍵在它身上）與 .PunctFix（留著給 e2e ／
     未來的旁證用）。條件：本欄 data-revealed、鉛字盤入場落完，且柱已經
     當著讀者的面較勁滿一輪。 */
  stamped($punct, 'data-revealed')
    .then(() => {
      /* 露臉就開始喘，**不等鉛字**——等鉛字的那段時間正是兩截一開一合的
         時間。 */
      $column?.setAttribute('data-strain', '')

      return Promise.resolve($forme ? formeSeen($forme) : false)
        .then((seen) => (seen ? formeDone($forme) : undefined))
        .then(() => wait(toFuseEdge(strainClock($column))))
    })
    .then(() => {
      $punct.setAttribute('data-play', '')
      $column?.setAttribute('data-play', '')
      /* 首播開始才接上 hover：在那之前這根破折號還沒演過修正，
         按住它沒有東西可對照。 */
      if ($column) initHoldRepair($punct, $column)
    })
}
