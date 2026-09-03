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
 * 兩種模式：
 *   `node manual/scripts/collect-chars.mjs`          → 寫出字表
 *   `node manual/scripts/collect-chars.mjs --check`  → 只比對，落後就 exit 1
 *
 * **五種語言各走一趟，字表取聯集**，逐族一份。字體樣張本身有繁、簡、日、韓
 * 四套選文，主控台與介面字也隨語言改變，任何單一頁都不是完整字集。逐語言切
 * 套件雖可少放少量字，卻會把五組條件與連結塞進 head；一份聯集讓所有語版共用
 * 同一組可快取資產，而瀏覽器仍只下載實際命中的字體與字重。
 *
 * 起點是本機的 dev server（`pnpm --filter han-manual dev`）；`--base` 可改。
 *
 * `--check` 是 CI 的閘門，守的是「字表跟得上頁面」。另一半——「字體蓋得住
 * 字表」——由 ziano 的 `--require-full-coverage` 在建置時保證，所以這一支不需要
 * 字體檔，也不需要 ziano，在 CI 裡就跑得動。漏掉一個字不會壞畫面，只會安靜地
 * 變成系統字混在傳承字形裡，所以要用閘門而不是提醒。
 *
 * 產出：`manual/chars/<family-id>.txt`（去重、按碼位排序，一行一字）
 */
import { chromium } from '@playwright/test'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { ALL_LOCALES, DEFAULT_LOCALE } from '../_locales.js'

const CHECK = process.argv.includes('--check')
const BASE = (process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:7700').replace(/\/$/, '')
const OUT = 'manual/chars'

/** 首頁的網址：預設語言在根，其餘各自帶前綴（`_locales.js` 的約定）。 */
const urlFor = (locale) => `${BASE}/${locale === DEFAULT_LOCALE ? '' : `${locale}/`}`

/* 要收的字族，以及輸出的檔名。鍵是 `font-family` 字串裡出現的名字（子字串
   比對），所以 `Shanggu Serif` 不會誤中 `Shanggu Serif Yue`——後者本來就該
   一起進同一份子集，因為它們是同一族的兩個變體。 */
/* 兩組名字都要認：頁面接上子集之後，計算出來的字族串寫的是子集的名字；
   而遊樂場切回完整切片、或這一支在還沒接子集的環境跑時，寫的是 ziano 的
   名字。兩者對同一份字表。 */
const FAMILIES = {
  'Han Home Genki Serif': 'genki-serif-yue',
  'Genki Serif Yue': 'genki-serif-yue',
  'Han Home Genki Sans': 'genki-sans-yue',
  'Genki Sans Yue': 'genki-sans-yue',
  'Shanggu Serif': 'shanggu-serif',
  'Han Home Serif': 'shanggu-serif',
  'Shanggu Sans': 'shanggu-sans',
  'Han Home Sans': 'shanggu-sans',
  'LXGW WenKai TC': 'lxgw-wenkai-tc',
  'Han Home Kai': 'lxgw-wenkai-tc',
  'Klee One': 'klee-one',
}

/* 只收字體真的要畫的東西：漢字、假名、諺文、注音、以及全形標點與符號。
   拉丁與數字交給堆疊前面的西文字體，但**全形**數字與字母要收（樣張裡有）。

   空白一律不收——U+3000 全形空格首當其衝。它在管線兩端都會被當成空白剝掉
   （JS 的 `\s` 與 Python 的 `str.isspace()` 都認它），所以字表根本留不住它；
   而它缺了也無害：任何 CJK 字體給的都是同一個 1em 空白。與其讓它在管線裡被
   靜靜吃掉、每次比對都報一次「字表落後」，不如在這裡明講它不收。

   這支函式**必須自給自足**：它是用 `toString()` 送進頁面重建的，引用外面的
   任何東西在那邊都是 ReferenceError。所以空白的判斷內聯在這裡。 */
const wanted = (cp) =>
  !(cp === 0x3000 || cp === 0x0020 || cp === 0x00a0 || (cp >= 0x2000 && cp <= 0x200f))
  && (
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
)

const collect = async (url) => {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  await page.goto(url, { waitUntil: 'load', timeout: 60_000 })
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

  /* 鉛字盤的字面在**字體軸**上有三種狀態，而頁面只載入其中一種。那一軸不像
     語言軸——各語言首頁預設自己的鉛字，逐 locale 跑就覆蓋得到——它預設永遠是
     明體，於是黑體與楷體的字面無論重收幾次都收不到，補進字表也會在下次重收時
     消失。所以這裡把那一軸走完。
     撥 `data-face` 而不是點藥丸：字族串只看這顆屬性，改完立刻生效，不必等
     換版的動畫；`text.g` 的內容本來就不隨字體變。
     韓文跳過楷體：那一格沒有楷體層（藥丸在 ko 下是藏著的），強收只會把諺文
     塞進一份用不到的子集。 */
  const faces = await page.evaluate(() => {
    const $f = document.querySelector('.LeadForme')
    if (!$f) return []
    return $f.dataset.lang === 'ko' ? ['h'] : ['h', 'k']
  })

  const readBags = () => page.evaluate(({ FAMILIES, wantedSrc }) => {
    const wanted = new Function('cp', `return (${wantedSrc})(cp)`)
    const bags = {}
    for (const id of Object.values(FAMILIES)) bags[id] = { all: new Set(), pgOnly: new Set() }

    /* 一條 stack 可能同時列出受管的正文族與末端備援族，例如韓文報紙先列
       Han Home Serif，後面才繼承到 Han Home Kai。前者已由本次建置要求完整
       覆蓋，後者實際不會畫到這段文字；若把同一段餵給兩者，反而會要求不含
       諺文的 LXGW WenKai TC 收進整篇韓文。依 stack 的實際順序，只歸給最先
       出現的受管字族。別依 FAMILIES 的物件順序，因為同族的新舊名稱會並存。 */
    const idsFor = (fontFamily) => {
      const first = Object.entries(FAMILIES)
        .map(([name, id]) => ({ id, at: fontFamily.indexOf(name) }))
        .filter(({ at }) => at >= 0)
        .sort((a, b) => a.at - b.at)[0]
      return first ? [first.id] : []
    }

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

  const result = await readBags()
  const mergeBags = (more) => {
    for (const [id, bag] of Object.entries(more)) {
      const merged = new Set([...result[id].chars, ...bag.chars])
      result[id].chars = [...merged].sort((a, c) => a.codePointAt(0) - c.codePointAt(0)).join('')
    }
  }

  /* The family pill is another font axis. Its non-default branch is still in
     the DOM but does not own a computed Genki stack until the radio is picked,
     so walk that state explicitly just as the lead forme walks its three
     faces below. */
  await page.evaluate(() => {
    const $input = document.querySelector('input[name="faces-family"][value="genki"]')
    if (!$input) return
    $input.checked = true
    $input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await page.waitForTimeout(300)
  mergeBags(await readBags())

  for (const face of faces) {
    await page.evaluate((f) => { document.querySelector('.LeadForme').dataset.face = f }, face)
    await page.waitForTimeout(300)
    mergeBags(await readBags())
  }

  await browser.close()
  return result
}

const BYTES_PER_CHAR = 476 // ziano 切片抽樣六片實測（382,484 B / 804 字）

/* 逐語言各跑一趟，字表取聯集（見檔頭）。 */
const bags = {}
for (const locale of ALL_LOCALES) {
  const result = await collect(urlFor(locale))
  for (const [id, { chars, playgroundOnly }] of Object.entries(result)) {
    bags[id] ??= { chars: new Set(), playgroundOnly: 0 }
    for (const ch of chars) bags[id].chars.add(ch)
    bags[id].playgroundOnly = Math.max(bags[id].playgroundOnly, playgroundOnly)
    console.log(`  ${locale.padEnd(5)} ${id.padEnd(16)} ${String(chars.length).padStart(5)} 字`)
  }
}

const merged = Object.fromEntries(Object.entries(bags).map(([id, bag]) => [id, {
  chars: [...bag.chars].sort((a, c) => a.codePointAt(0) - c.codePointAt(0)).join(''),
  playgroundOnly: bag.playgroundOnly,
}]))

if (CHECK) {
  let stale = false
  for (const [id, { chars }] of Object.entries(merged)) {
    const path = `${OUT}/${id}.txt`
    const committed = new Set(existsSync(path) ? readFileSync(path, 'utf8').replace(/\s/g, '') : '')
    const extra = [...chars].filter((ch) => !committed.has(ch))
    if (!extra.length) {
      console.log(`${id.padEnd(16)} ✓ ${chars.length} 字都在字表裡`)
      continue
    }
    stale = true
    console.log(`${id.padEnd(16)} ✗ 字表少了 ${extra.length} 個字：${extra.join('')}`)
  }
  if (stale) {
    console.log('\n字表落後於頁面。跑 `node manual/scripts/collect-chars.mjs` 重收，'
      + '再跑 `node manual/scripts/build-subsets.mjs` 重建子集。')
    process.exit(1)
  }
  process.exit(0)
}

mkdirSync(OUT, { recursive: true })
for (const [id, { chars, playgroundOnly }] of Object.entries(merged)) {
  writeFileSync(`${OUT}/${id}.txt`, `${chars}\n`)
  const kb = Math.round((chars.length * BYTES_PER_CHAR) / 1024)
  console.log(
    `${id.padEnd(16)} ${String(chars.length).padStart(5)} 字  約 ${String(kb).padStart(4)} KB`
    + `  （其中 ${playgroundOnly} 字只出現在遊樂場的預設稿）`,
  )
}
