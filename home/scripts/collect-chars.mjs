/**
 * 收出首頁**實際排出來**的字，逐字族一份字表——`ziano subset-page` 的輸入。
 *
 * 為什麼要開瀏覽器而不是掃原始碼：頁面上的字有四個來源，只有渲染後的 DOM
 * 同時看得到全部——標記裡的正文、CSS 的 `content`（書名號、著重號、四曆的
 * 「日」「한」…）、主控台 shadow DOM 裡的介面字，以及 JS 當場算出來的日期。
 * 少收一種，讀者就會在傳承字形裡看到一個系統字——`.notdef` 規則見
 * .ideas/font-subset/PLAN.md 的第二條約束。
 *
 * 逐**字族**分開收，而不是收一份大字表：一個字要不要進某一族的子集，看的是
 * 它有沒有被那一族排過。繁中頁的日韓簡報導走系統字（han.fonts.css 的語言閘），
 * 所以它們的字**不該**進尚古的子集。
 *
 * 遊樂場的**預設稿**照收，UGC 才留給 ziano。理由是那一站載入時排的就是預設
 * 稿——把它併進子集，ziano 的切片就可以延後到「讀者打出子集沒有的字」才載，
 * 於是載入當下沒有任何一種字體用法點名那 109 片（實測：全頁 66 種點名切片
 * 字族的用法裡，有 11 種出現在遊樂場）。讀者不打字就永遠不必載。
 * 統計欄位保留「只在遊樂場出現」的數字，因為那正是這個決定多付的字數。
 *
 * 用法：`node home/scripts/collect-chars.mjs [http://localhost:7770/]`
 * 產出：`home/chars/<family-id>.txt`（NFC、去重、按碼位排序，一行一字）
 */
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const URL_ = process.argv[2] ?? 'http://localhost:7770/'
const OUT = 'home/chars'

/* 要收的字族，以及輸出的檔名。鍵是 `font-family` 字串裡出現的名字（子字串
   比對），所以 `Shanggu Serif` 不會誤中 `Shanggu Serif Yue`——後者本來就該
   一起進同一份子集，因為它們是同一族的兩個變體。 */
const FAMILIES = {
  'Shanggu Serif': 'shanggu-serif',
  'Shanggu Sans': 'shanggu-sans',
  'LXGW WenKai TC': 'lxgw-wenkai-tc',
  'Klee One': 'klee-one',
}

/* 只收字體真的要畫的東西：漢字、假名、諺文、注音、以及全形標點與符號。
   拉丁與數字交給堆疊前面的西文字體，但**全形**數字與字母要收（樣張裡有）。 */
const wanted = (cp) =>
  (cp >= 0x2e80 && cp <= 0x2fff)      // 部首補充・康熙部首・表意文字描述符
  || (cp >= 0x3000 && cp <= 0x303f)   // CJK 標點
  || (cp >= 0x3040 && cp <= 0x30ff)   // 假名
  || (cp >= 0x3100 && cp <= 0x312f)   // 注音
  || (cp >= 0x3190 && cp <= 0x319f)   // 漢文訓讀
  || (cp >= 0x31c0 && cp <= 0x31ef)   // 筆畫
  || (cp >= 0x3200 && cp <= 0x33ff)   // 圈號・組合
  || (cp >= 0x3400 && cp <= 0x9fff)   // 擴充 A ＋ 基本區
  || (cp >= 0xac00 && cp <= 0xd7af)   // 諺文音節
  || (cp >= 0xf900 && cp <= 0xfaff)   // 相容漢字
  || (cp >= 0xfe10 && cp <= 0xfe4f)   // 直排標點・相容形式
  || (cp >= 0xff00 && cp <= 0xffef)   // 全形
  || (cp >= 0x20000 && cp <= 0x3ffff) // 擴充 B 以上

const collect = async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  await page.goto(URL_, { waitUntil: 'load' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(3000)
  /* 捲過全站：`content-visibility: auto` 讓畫面外的站台不排字，不捲就收不到
     它們的字（實測整頁高 10,212px，首屏只排了 1,657 個字）。 */
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 80))
    }
    scrollTo(0, 0)
  })
  await page.waitForTimeout(1500)

  const result = await page.evaluate(({ FAMILIES, wantedSrc }) => {
    const wanted = new Function('cp', `return (${wantedSrc})(cp)`)
    const bags = {}
    for (const id of Object.values(FAMILIES)) bags[id] = { all: new Set(), pgOnly: new Set() }

    const idsFor = (fontFamily) =>
      Object.entries(FAMILIES).filter(([name]) => fontFamily.includes(name)).map(([, id]) => id)

    const eat = (text, ids, inPlayground) => {
      for (const ch of text) {
        if (!wanted(ch.codePointAt(0))) continue
        for (const id of ids) (inPlayground ? bags[id].pgOnly : bags[id].all).add(ch)
      }
    }

    const walk = (root, inPlayground) => {
      for (const $el of root.querySelectorAll('*')) {
        if ($el.shadowRoot) walk($el.shadowRoot, inPlayground)
        const style = getComputedStyle($el)
        const ids = idsFor(style.fontFamily ?? '')
        if (!ids.length) continue
        /* 預設稿也收（見檔頭）。這個旗標只用來統計「多付了幾個字」。 */
        const pg = inPlayground || !!$el.closest?.('#station-playground')
        /* 只吃自己的文字節點，不吃 textContent——後者會把後代的字算進祖先的
           字族，而後代往往是別的字族。 */
        for (const node of $el.childNodes) {
          if (node.nodeType === 3) eat(node.data, ids, pg)
        }
        for (const pseudo of ['::before', '::after']) {
          const content = getComputedStyle($el, pseudo).content
          if (content && content.startsWith('"')) eat(content.slice(1, -1), ids, pg)
        }
      }
    }
    walk(document, false)

    const out = {}
    for (const [id, bag] of Object.entries(bags)) {
      const only = [...bag.pgOnly].filter((ch) => !bag.all.has(ch))
      const merged = new Set([...bag.all, ...bag.pgOnly])
      out[id] = {
        chars: [...merged].sort((a, c) => a.codePointAt(0) - c.codePointAt(0)).join(''),
        playgroundOnly: only.length,
      }
    }
    return out
  }, { FAMILIES, wantedSrc: wanted.toString() })

  await browser.close()
  return result
}

const BYTES_PER_CHAR = 476 // ziano 切片抽樣六片實測（382,484 B / 804 字）

const result = await collect()
mkdirSync(OUT, { recursive: true })
for (const [id, { chars, playgroundOnly }] of Object.entries(result)) {
  writeFileSync(`${OUT}/${id}.txt`, `${chars}\n`)
  const kb = Math.round((chars.length * BYTES_PER_CHAR) / 1024)
  console.log(
    `${id.padEnd(16)} ${String(chars.length).padStart(5)} 字  約 ${String(kb).padStart(4)} KB`
    + `  （其中 ${playgroundOnly} 字只出現在遊樂場的預設稿）`,
  )
}
