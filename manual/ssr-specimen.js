/**
 * ssr-specimen.js — 把樣張的來源標記變成「伺服器端排好版」的那一份。
 *
 * **三個呼叫端共用這一支**，這正是它獨立成檔的理由：
 *
 *   · `vite.config.js` 的 `renderSpecimenPages()` — 建置時跑一次，寫成靜態檔
 *     （`mode: 'build'`）。任何靜態託管都吃得到，是保底的那一份。
 *   · `vite.config.js` 的 dev middleware — 每個請求現跑（`mode: 'request'`）。
 *   · `api/specimen-ssr.js`（Vercel Node function） — 生產環境每個請求現跑
 *     （`mode: 'request'`）。
 *
 * 三邊同一支函式、同一份輸出，所以「建置時跑」與「請求時跑」的差別能被誠實地
 * 印在頁面上（`data-han-ssr` 的值 ＋ 那個時間戳），而不是靠文案宣稱。
 *
 * 本檔自己只要 ESM ＋ `String.replaceAll`，不碰檔案系統、`process`、`Buffer`。
 * 但它 import 的東西要求 **Node**：han 的 SSR 路徑經 hyperly 用 happy-dom 解析
 * HTML，而 happy-dom 要 `vm.Script.runInContext`——workerd 沒有，所以
 * Cloudflare Pages Functions 上跑不起來（`wrangler pages dev` 實測：
 * `[unenv] Script.runInContext is not implemented yet!`）。Cloudflare 部署因此
 * 只會有建置時那一份，頁面照實說。全文見
 * `docs/notes/2026-08-08-request-time-ssr-on-edge-hosts.md`。
 */

/* 每一條都**行首錨定 ＋ 驗證有換到**。頁內的註解與文案裡寫得出 `<main>`、
 * `<title>`、`<han-console>` 這些字，而 `String#replace` 換的是第一顆——換錯了
 * 不會報錯，只會生出一頁少了 `no-fallbacks` 的 SSR 樣張，然後瀏覽器端把伺服器
 * 排好的版重排一遍（實測踩過，2026-08-08）。 */
const swap = (s, re, to) => {
  const out = s.replace(re, to)
  if (out === s) throw new Error(`[specimen] nothing matched ${re}`)
  return out
}

/**
 * @param {string} src   `manual/demo/specimen.html` 的原文
 * @param {{ mode?: 'build' | 'request', now?: Date }} opts
 *        `mode` 寫進 `<html data-han-ssr>`，頁面文案據此說實話；
 *        `now` 是排版時刻（時間戳 ＋ 一百年後的年份都由它算）。
 * @returns {Promise<string>} 完整的一頁 HTML
 */
export const ssrSpecimen = async (src, { mode = 'build', now = new Date() } = {}) => {
  /* **`/ssr`，不是主入口**：主入口有 `browser` 條件，而任何把程式碼當「瀏覽器
   * 用」打包的工具——Cloudflare Pages Functions 的 esbuild 就是——都會挑中它，
   * 拿到的是把 happy-dom 換成 stub 的那一份，一呼叫就丟「browser stub
   * constructed — the browser bundle must never take the SSR branch」
   * （2026-08-08 用 `wrangler pages dev` 實測踩到）。`/ssr` 那條出口只有
   * `default`、沒有 `browser`，誰打包都拿得到 Node 那一份。 */
  const { installFallbacks } = await import('@hanzi.pro/han.css/ssr')
  const { html } = await import('hyperly/fp')

  // 行首錨定，不是隨便一個 `<main`：貪婪比對一旦從註解裡的那一顆起頭，送進
  // installFallbacks 的就是一段殘缺片段——happy-dom 照樣解析得出東西，於是
  // **不報錯**，只是幾乎什麼都沒包（實測 135KB 的正文只得 14 個 wrapper）。
  // 真正的那兩顆標籤各自獨占一行、頂格。
  const m = src.match(/^<main\b[^>]*>[\s\S]*^<\/main>$/m)
  if (!m) throw new Error('[specimen] no <main> to server-render')

  return [
    [/^<html\b/m, `<html data-han-ssr="${mode}"`],
    [/^<title>[\s\S]*?<\/title>$/m, '<title>Han.css 樣張・伺服器端排版</title>'],
    // 瀏覽器端不再跑第二次——那會在既有的 wrapper 上再包一層。
    [/^(\s*)<han-console\b/m, '$1<han-console no-fallbacks'],
    // 值走 replacer function，不走字串：`$&`／`$1` 在替換字串裡是特殊序列，而
    // 這一段是幾百 KB 的產生內容，不能讓它被當成樣式指令解讀。
    //
    // **只過 `<main>`，不過整頁**：控制台的標記（<dialog> 裡的控件、生成碼的
    // <pre>）不是排版展品，包了只是噪音，而碼區塊被塞進 <h-char> 之後複製出去
    // 就不是原樣了。
    [m[0], () => html(installFallbacks(m[0]))],
  ].reduce((s, [re, to]) => swap(s, re, to), src)
    // 年份建置／請求時就填好：那頁的賣點是「關掉 JS 也對」，留給 client JS 補
    // 就破功了。
    .replaceAll(
      /(<[^>]*\bdata-future-year\b[^>]*>)[^<]*/g,
      `$1${now.getFullYear() + 100}`,
    )
    // 時間戳。這是「這一份是什麼時候排的」的唯一證據——請求時排的話，重新整理
    // 就會變；建置時排的話，整個部署期間都是同一個值。頁面文案指著它說話，所以
    // 它必須是真的，不能省。
    .replaceAll(
      /(<time[^>]*\bdata-ssr-stamp\b[^>]*)>[^<]*/g,
      `$1 datetime="${now.toISOString()}">${stamp(now)}`,
    )
}

/* `sv-SE` 是拿得到 `YYYY-MM-DD HH:MM:SS` 的最短路徑（ISO 8601 的日期時間，
 * 只是以空格分隔），不必自己補零。UTC 是刻意的：這是伺服器的時刻，不是讀者
 * 的——標成 UTC 才不會讓人以為它讀得到自己的時區。 */
const stamp = (d) =>
  `${d.toLocaleString('sv-SE', { timeZone: 'UTC' })} UTC`
